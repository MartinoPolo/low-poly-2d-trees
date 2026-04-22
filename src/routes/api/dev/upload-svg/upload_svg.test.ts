import { describe, it, expect, vi, beforeEach } from 'vitest';

const { writeFileSyncMock, mkdirSyncMock } = vi.hoisted(() => ({
	writeFileSyncMock: vi.fn(),
	mkdirSyncMock: vi.fn(),
}));

vi.mock('node:fs', () => ({
	writeFileSync: writeFileSyncMock,
	mkdirSync: mkdirSyncMock,
}));

vi.mock('../../../../../scripts/convert-svg.js', () => ({
	convertSvgToSvelte: vi.fn(() => '<!-- viewBox: 0 0 100 100 -->\n<g>\n<circle/>\n</g>'),
}));

import { POST } from './+server.js';

function makeFormDataRequest(fields: Record<string, string | File>): Request {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		formData.append(key, value);
	}
	return new Request('http://localhost/api/dev/upload-svg', {
		method: 'POST',
		body: formData,
	});
}

function makeSvgFile(content = '<svg viewBox="0 0 100 100"><circle/></svg>'): File {
	return new File([content], 'test.svg', { type: 'image/svg+xml' });
}

function makeEvent(request: Request): Parameters<typeof POST>[0] {
	return { request } as unknown as Parameters<typeof POST>[0];
}

describe('POST /api/dev/upload-svg', () => {
	beforeEach(() => {
		writeFileSyncMock.mockReset();
		mkdirSyncMock.mockReset();
	});

	it('converts SVG and returns output path on success', async () => {
		const request = makeFormDataRequest({
			file: makeSvgFile(),
			assetName: 'acorn',
			category: 'fruits',
		});

		const response = await POST(makeEvent(request));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);
		expect(body.outputPath).toContain('src/lib/trees/assets/fruits/AcornSvg.svelte');
		expect(writeFileSyncMock).toHaveBeenCalledOnce();
	});

	it('converts snake_case asset name to PascalCase in output path', async () => {
		const request = makeFormDataRequest({
			file: makeSvgFile(),
			assetName: 'catkin_birch',
			category: 'fruits',
		});

		const response = await POST(makeEvent(request));
		const body = await response.json();

		expect(body.outputPath).toContain('CatkinBirchSvg.svelte');
	});

	it('returns 400 when file is missing', async () => {
		const request = makeFormDataRequest({
			assetName: 'acorn',
			category: 'fruits',
		});

		const response = await POST(makeEvent(request));
		expect(response.status).toBe(400);
	});

	it('returns 400 when assetName is missing', async () => {
		const request = makeFormDataRequest({
			file: makeSvgFile(),
			category: 'fruits',
		});

		const response = await POST(makeEvent(request));
		expect(response.status).toBe(400);
	});

	it('returns 400 when category is missing', async () => {
		const request = makeFormDataRequest({
			file: makeSvgFile(),
			assetName: 'acorn',
		});

		const response = await POST(makeEvent(request));
		expect(response.status).toBe(400);
	});

	it('returns 400 for invalid category', async () => {
		const request = makeFormDataRequest({
			file: makeSvgFile(),
			assetName: 'acorn',
			category: 'invalid',
		});

		const response = await POST(makeEvent(request));
		expect(response.status).toBe(400);
	});
});
