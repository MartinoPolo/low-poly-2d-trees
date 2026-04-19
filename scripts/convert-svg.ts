import { readFileSync, writeFileSync } from 'node:fs';

export function convertSvgToSvelte(svgContent: string, assetName: string): string {
	const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
	const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 100 100';

	let innerContent = svgContent.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

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

	return `<!-- viewBox: ${viewBox} -->\n<g>\n${innerContent}\n</g>`;
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
