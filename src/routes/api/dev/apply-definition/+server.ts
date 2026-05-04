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

const SAFE_ASSET_NAME = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;

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

interface ValidatedInput {
	category: DefinitionCategory;
	assetName: string;
	values: ApplyDefinitionValues;
}

// fallow-ignore-next-line complexity
function validateInput(body: unknown): ValidatedInput | { error: string } {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		return { error: 'Invalid request body' };
	}

	const { category, assetName, values } = body as Record<string, unknown>;

	if (typeof category !== 'string' || !isValidCategory(category)) {
		return { error: 'Invalid or missing category' };
	}
	if (typeof assetName !== 'string' || !SAFE_ASSET_NAME.test(assetName)) {
		return { error: 'Invalid assetName — lowercase snake_case only' };
	}
	if (typeof values !== 'object' || values === null) {
		return { error: 'Missing values' };
	}

	return { category, assetName, values: values as ApplyDefinitionValues };
}

function assetKeyPattern(assetName: string): string {
	return `(?:[w+.${assetName}]|\b${assetName})s*:`;
}

function replaceOffsetInContent(
	content: string,
	assetName: string,
	offsetKey: string,
	offsetValue: OffsetValue,
): string {
	const offsetPattern = new RegExp(
		`(${assetKeyPattern(assetName)}[sS]*?)${offsetKey}:s*{s*x:s*[d.eE+-]+,s*y:s*[d.eE+-]+s*}`,
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
	const pattern = new RegExp(`(${assetKeyPattern(assetName)}[sS]*?)anchorTarget:s*'[^']*'`);
	return content.replace(pattern, `$1anchorTarget: '${anchorTarget}'`);
}

function replaceScaleInContent(content: string, assetName: string, scaleValue: number): string {
	const scalePattern = new RegExp(`(${assetKeyPattern(assetName)}[sS]*?)scale:s*[d.eE+-]+`);
	return content.replace(scalePattern, `$1scale: ${scaleValue}`);
}

type ValueKey = keyof ApplyDefinitionValues;
type ValueHandler = (content: string, assetName: string, value: unknown) => string;

const VALUE_HANDLERS: Record<ValueKey, ValueHandler | null> = {
	scale: (content, assetName, value) =>
		replaceScaleInContent(content, assetName, value as number),
	originOffset: (content, assetName, value) =>
		replaceOffsetInContent(content, assetName, 'originOffset', value as OffsetValue),
	snapOffset: (content, assetName, value) =>
		replaceOffsetInContent(content, assetName, 'snapOffset', value as OffsetValue),
	positionOffset: (content, assetName, value) =>
		replaceOffsetInContent(content, assetName, 'positionOffset', value as OffsetValue),
	pivotPoint: (content, assetName, value) =>
		replaceOffsetInContent(content, assetName, 'pivotPoint', value as OffsetValue),
	anchorTarget: (content, assetName, value) =>
		replaceAnchorTargetInContent(content, assetName, value as string),
};

function applyValueUpdates(
	content: string,
	assetName: string,
	values: ApplyDefinitionValues,
): string {
	let result = content;
	for (const key of Object.keys(values) as ValueKey[]) {
		const value = values[key];
		if (value !== undefined) {
			const handler = VALUE_HANDLERS[key];
			if (handler) {
				result = handler(result, assetName, value);
			}
		}
	}
	return result;
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

	const validation = validateInput(body);
	if ('error' in validation) {
		return json(validation, { status: 400 });
	}

	const { category, assetName, values } = validation;
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

	content = applyValueUpdates(content, assetName, values);

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
