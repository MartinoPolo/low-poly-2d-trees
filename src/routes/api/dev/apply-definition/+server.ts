import { json } from '@sveltejs/kit';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { RequestHandler } from './$types.js';

const CATEGORY_DEFINITION_PATHS = {
	tools: 'src/lib/trees/tools/tool_definitions.ts',
	fruits: 'src/lib/trees/shapes/fruit_definitions.ts',
	flowers: 'src/lib/trees/shapes/flower_definitions.ts',
	ground: 'src/lib/trees/ground/ground_definitions.ts',
	stages: 'src/lib/trees/stages/stage_definitions.ts',
	overlays: 'src/lib/trees/overlays/overlay_definitions.ts',
} as const;

type DefinitionCategory = keyof typeof CATEGORY_DEFINITION_PATHS;

const SAFE_ASSET_NAME = /^[a-z][a-z0-9_]{0,63}$/;

function isValidCategory(value: string): value is DefinitionCategory {
	return value in CATEGORY_DEFINITION_PATHS;
}

interface OffsetValue {
	readonly x: number;
	readonly y: number;
}

interface ApplyDefinitionValues {
	readonly scale?: number;
	readonly originOffset?: OffsetValue;
	readonly snapOffset?: OffsetValue;
	readonly positionOffset?: OffsetValue;
	readonly pivotPoint?: OffsetValue;
	readonly anchorTarget?: string;
}

function replaceOffsetInContent(
	content: string,
	assetName: string,
	offsetKey: string,
	offsetValue: OffsetValue,
): string {
	// Match the offset property within the asset's definition entry
	// Handles both single-line and multi-line formats
	const offsetPattern = new RegExp(
		`(\\[\\w+\\.${assetName}\\][\\s\\S]*?)${offsetKey}:\\s*\\{\\s*x:\\s*[\\d.eE+-]+,\\s*y:\\s*[\\d.eE+-]+\\s*\\}`,
	);
	return content.replace(
		offsetPattern,
		`$1${offsetKey}: { x: ${offsetValue.x}, y: ${offsetValue.y} }`,
	);
}

function replaceAnchorTargetInContent(
	content: string,
	assetName: string,
	anchorTarget: string,
): string {
	const pattern = new RegExp(`(\\[\\w+\\.${assetName}\\][\\s\\S]*?)anchorTarget:\\s*'[^']*'`);
	return content.replace(pattern, `$1anchorTarget: '${anchorTarget}'`);
}

function replaceScaleInContent(content: string, assetName: string, scaleValue: number): string {
	const scalePattern = new RegExp(`(\\[\\w+\\.${assetName}\\][\\s\\S]*?)scale:\\s*[\\d.eE+-]+`);
	return content.replace(scalePattern, `$1scale: ${scaleValue}`);
}

export const POST: RequestHandler = async ({ request }) => {
	if (!import.meta.env.DEV) {
		return new Response('Not found', { status: 404 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { category, assetName, values } = body as Record<string, unknown>;

	if (typeof category !== 'string' || !isValidCategory(category)) {
		return json({ error: 'Invalid or missing category' }, { status: 400 });
	}
	if (typeof assetName !== 'string' || !SAFE_ASSET_NAME.test(assetName)) {
		return json({ error: 'Invalid assetName — lowercase snake_case only' }, { status: 400 });
	}
	if (typeof values !== 'object' || values === null) {
		return json({ error: 'Missing values' }, { status: 400 });
	}

	const typedValues = values as ApplyDefinitionValues;
	const definitionPath = path.join(process.cwd(), CATEGORY_DEFINITION_PATHS[category]);

	let content: string;
	try {
		content = readFileSync(definitionPath, 'utf-8');
	} catch (error) {
		return json(
			{
				error: `File read failed: ${error instanceof Error ? error.message : String(error)}`,
			},
			{ status: 500 },
		);
	}

	if (typedValues.scale !== undefined) {
		content = replaceScaleInContent(content, assetName, typedValues.scale);
	}
	if (typedValues.originOffset !== undefined) {
		content = replaceOffsetInContent(
			content,
			assetName,
			'originOffset',
			typedValues.originOffset,
		);
	}
	if (typedValues.snapOffset !== undefined) {
		content = replaceOffsetInContent(content, assetName, 'snapOffset', typedValues.snapOffset);
	}
	if (typedValues.positionOffset !== undefined) {
		content = replaceOffsetInContent(
			content,
			assetName,
			'positionOffset',
			typedValues.positionOffset,
		);
	}
	if (typedValues.pivotPoint !== undefined) {
		content = replaceOffsetInContent(content, assetName, 'pivotPoint', typedValues.pivotPoint);
	}
	if (typedValues.anchorTarget !== undefined) {
		content = replaceAnchorTargetInContent(content, assetName, typedValues.anchorTarget);
	}

	try {
		writeFileSync(definitionPath, content, 'utf-8');
	} catch (error) {
		return json(
			{
				error: `File write failed: ${error instanceof Error ? error.message : String(error)}`,
			},
			{ status: 500 },
		);
	}

	return json({ success: true });
};
