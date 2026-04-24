import { readFileSync, writeFileSync } from 'node:fs';

function parseOriginalDimensions(
	svgContent: string,
	viewBox: string,
): { width: number; height: number } | null {
	const parts = viewBox.split(/\s+/).map(Number);
	if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
		return { width: parts[2], height: parts[3] };
	}
	const widthMatch = svgContent.match(/\swidth="([^"]+)"/);
	const heightMatch = svgContent.match(/\sheight="([^"]+)"/);
	const width = widthMatch ? parseFloat(widthMatch[1]) : 0;
	const height = heightMatch ? parseFloat(heightMatch[1]) : 0;
	if (width > 0 && height > 0) {
		return { width, height };
	}
	return null;
}

function buildNormalizationTransform(
	origWidth: number,
	origHeight: number,
	targetWidth: number,
	targetHeight: number,
): string | null {
	const scale = Math.min(targetWidth / origWidth, targetHeight / origHeight);
	const scaledWidth = origWidth * scale;
	const scaledHeight = origHeight * scale;
	const translateX = -scaledWidth / 2;
	const translateY = -scaledHeight / 2;
	if (
		Math.abs(scale - 1) < 0.001 &&
		Math.abs(translateX) < 0.001 &&
		Math.abs(translateY) < 0.001
	) {
		return null;
	}
	return `translate(${translateX.toFixed(2)}, ${translateY.toFixed(2)}) scale(${scale.toFixed(4)})`;
}

export function convertSvgToSvelte(
	svgContent: string,
	assetName: string,
	targetWidth?: number,
	targetHeight?: number,
): string {
	const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
	const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 100 100';

	let innerContent = svgContent
		.replace(/<\?[^?]*\?>/g, '')
		.replace(/<svg[^>]*>/, '')
		.replace(/<\/svg>\s*$/, '');

	// Collect all id="X" values
	const idMatches = [...innerContent.matchAll(/\bid="([^"]+)"/g)];
	const ids = idMatches.map((m) => m[1]);

	// Namespace each ID and all references to it
	for (const id of ids) {
		const namespacedId = `${assetName}-${id}`;
		innerContent = innerContent.replaceAll(`id="${id}"`, `id="${namespacedId}"`);
		innerContent = innerContent.replaceAll(`url(#${id})`, `url(#${namespacedId})`);
		innerContent = innerContent.replaceAll(
			`xlink:href="#${id}"`,
			`xlink:href="#${namespacedId}"`,
		);
		innerContent = innerContent.replaceAll(`href="#${id}"`, `href="#${namespacedId}"`);
	}

	let normalizedContent = innerContent;
	if (targetWidth !== undefined && targetHeight !== undefined) {
		const dims = parseOriginalDimensions(svgContent, viewBox);
		if (dims) {
			const transform = buildNormalizationTransform(
				dims.width,
				dims.height,
				targetWidth,
				targetHeight,
			);
			if (transform !== null) {
				normalizedContent = `<g transform="${transform}">\n${innerContent}\n</g>`;
			}
		}
	}

	return `<!-- viewBox: ${viewBox} -->\n<g>\n${normalizedContent}\n</g>`;
}

function parseCliArguments(argv: string[]): { input: string; name: string; output: string } {
	const args = argv.slice(2);
	let input = '';
	let name = '';
	let output = '';

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--input' && args[i + 1]) {
			input = args[++i];
		} else if (args[i] === '--name' && args[i + 1]) {
			name = args[++i];
		} else if (args[i] === '--output' && args[i + 1]) {
			output = args[++i];
		}
	}

	if (!input || !name || !output) {
		console.error(
			'Usage: convert-svg --input <file.svg> --name <assetName> --output <file.svelte>',
		);
		process.exit(1);
	}

	return { input, name, output };
}

// CLI entry point — only runs when executed directly
const isDirectExecution =
	typeof process !== 'undefined' &&
	typeof process.argv[1] === 'string' &&
	(process.argv[1].endsWith('convert-svg.ts') || process.argv[1].endsWith('convert-svg.js'));

if (isDirectExecution === true) {
	const { input, name, output } = parseCliArguments(process.argv);
	const svgContent = readFileSync(input, 'utf-8');
	const svelteContent = convertSvgToSvelte(svgContent, name);
	writeFileSync(output, svelteContent, 'utf-8');
	console.log(`Converted ${input} -> ${output} (asset: ${name})`);
}
