import { json } from '@sveltejs/kit';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { convertSvgToSvelte } from '../../../../../scripts/convert-svg.js';
import { getTargetViewBox } from '$lib/trees/assets/asset_target_viewbox.js';
import type { RequestHandler } from './$types.js';

const VALID_CATEGORIES = ['tools', 'fruits', 'flowers', 'ground', 'stages', 'overlays'] as const;
type AssetCategory = (typeof VALID_CATEGORIES)[number];

const SAFE_ASSET_NAME = /^[a-z][a-z0-9_]{0,63}$/;

function toPascalCase(snakeCaseName: string): string {
	return snakeCaseName
		.split('_')
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join('');
}

function isValidCategory(value: string): value is AssetCategory {
	return (VALID_CATEGORIES as readonly string[]).includes(value);
}

export const POST: RequestHandler = async ({ request }) => {
	if (!import.meta.env.DEV) {
		return new Response('Not found', { status: 404 });
	}

	const formData = await request.formData();
	const file = formData.get('file');
	const assetName = formData.get('assetName');
	const category = formData.get('category');

	if (!(file instanceof File) || !file.size) {
		return json({ error: 'Missing file' }, { status: 400 });
	}
	if (typeof assetName !== 'string' || !SAFE_ASSET_NAME.test(assetName)) {
		return json({ error: 'Invalid assetName — lowercase snake_case only' }, { status: 400 });
	}
	if (typeof category !== 'string' || !isValidCategory(category)) {
		return json({ error: 'Invalid or missing category' }, { status: 400 });
	}

	const svgContent = await file.text();
	const target = getTargetViewBox(category, assetName);
	const svelteContent = convertSvgToSvelte(svgContent, assetName, target.width, target.height);

	const pascalName = toPascalCase(assetName);
	const relativePath = `src/lib/trees/assets/${category}/${pascalName}Svg.svelte`;
	const absolutePath = path.resolve(process.cwd(), relativePath);

	try {
		mkdirSync(path.dirname(absolutePath), { recursive: true });
		writeFileSync(absolutePath, svelteContent, 'utf-8');
	} catch (error) {
		return json(
			{
				error: `File write failed: ${error instanceof Error ? error.message : String(error)}`,
			},
			{ status: 500 },
		);
	}

	return json({ success: true, outputPath: relativePath });
};
