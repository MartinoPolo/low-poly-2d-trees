import { describe, it, expect } from 'vitest';
import { convertSvgToSvelte } from './convert-svg.js';

describe('convertSvgToSvelte', () => {
	it('strips SVG wrapper and wraps inner content in <g>', () => {
		const input =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';
		const result = convertSvgToSvelte(input, 'testAsset');

		expect(result).not.toContain('<svg');
		expect(result).not.toContain('</svg>');
		expect(result).toContain('<g>');
		expect(result).toContain('</g>');
		expect(result).toContain('<circle cx="50" cy="50" r="40" fill="red"/>');
	});

	it('namespaces gradient IDs in defs and updates all references', () => {
		const input = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs><linearGradient id="a"><stop offset="0" stop-color="red"/></linearGradient></defs>
<rect fill="url(#a)" width="100" height="100"/>
</svg>`;
		const result = convertSvgToSvelte(input, 'myAsset');

		expect(result).toContain('id="myAsset-a"');
		expect(result).toContain('fill="url(#myAsset-a)"');
		expect(result).not.toContain('id="a"');
		expect(result).not.toContain('url(#a)');
	});

	it('namespaces multiple IDs and handles xlink:href and clip-path references', () => {
		const input = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<defs>
<linearGradient id="grad1"><stop offset="0" stop-color="blue"/></linearGradient>
<clipPath id="clip1"><rect width="50" height="50"/></clipPath>
<linearGradient id="grad2" xlink:href="#grad1"/>
</defs>
<rect fill="url(#grad1)" clip-path="url(#clip1)" width="200" height="200"/>
</svg>`;
		const result = convertSvgToSvelte(input, 'icon');

		expect(result).toContain('id="icon-grad1"');
		expect(result).toContain('id="icon-clip1"');
		expect(result).toContain('id="icon-grad2"');
		expect(result).toContain('fill="url(#icon-grad1)"');
		expect(result).toContain('clip-path="url(#icon-clip1)"');
		expect(result).toContain('xlink:href="#icon-grad1"');
	});

	it('passes through SVGs without defs or IDs cleanly', () => {
		const input =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><rect width="50" height="50" fill="blue"/><circle cx="25" cy="25" r="10" fill="white"/></svg>';
		const result = convertSvgToSvelte(input, 'simple');

		expect(result).toContain('<rect width="50" height="50" fill="blue"/>');
		expect(result).toContain('<circle cx="25" cy="25" r="10" fill="white"/>');
		expect(result).not.toContain('<svg');
		expect(result).toContain('<g>');
		expect(result).toContain('<!-- viewBox: 0 0 50 50 -->');
	});

	it('preserves viewBox as comment header on first line', () => {
		const input =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200"><path d="M0 0"/></svg>';
		const result = convertSvgToSvelte(input, 'tall');
		const firstLine = result.split('\n')[0];

		expect(firstLine).toBe('<!-- viewBox: 0 0 100 200 -->');
	});
});
