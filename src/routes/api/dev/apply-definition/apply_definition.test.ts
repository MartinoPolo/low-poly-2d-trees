import { describe, it, expect, vi, beforeEach } from 'vitest';

const { readFileSyncMock, writeFileSyncMock } = vi.hoisted(() => ({
	readFileSyncMock: vi.fn(),
	writeFileSyncMock: vi.fn(),
}));

vi.mock('node:fs', () => ({
	readFileSync: readFileSyncMock,
	writeFileSync: writeFileSyncMock,
}));

import { POST } from './+server.js';

function makeJsonRequest(body: Record<string, unknown>): Request {
	return new Request('http://localhost/api/dev/apply-definition', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

function makeEvent(request: Request): Parameters<typeof POST>[0] {
	return { request } as unknown as Parameters<typeof POST>[0];
}

describe('POST /api/dev/apply-definition', () => {
	beforeEach(() => {
		readFileSyncMock.mockReset();
		writeFileSyncMock.mockReset();
	});

	it('updates fruit definition values and returns success', async () => {
		const existingContent = `import { FRUIT_TYPES } from '../types/fruit.js';
export const FRUIT_DEFINITIONS = {
	[FRUIT_TYPES.acorn]: { svgComponent: AcornSvg, scale: 1, originOffset: { x: 0, y: 0 } },
	[FRUIT_TYPES.apple]: { svgComponent: AppleSvg, scale: 1, originOffset: { x: 0, y: 0 } },
} as const;`;
		readFileSyncMock.mockReturnValue(existingContent);

		const request = makeJsonRequest({
			category: 'fruits',
			assetName: 'acorn',
			values: { scale: 2.5, originOffset: { x: 3, y: -5 } },
		});

		const response = await POST(makeEvent(request));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);

		const writtenContent = writeFileSyncMock.mock.calls[0][1] as string;
		expect(writtenContent).toContain('scale: 2.5');
		expect(writtenContent).toContain('originOffset: { x: 3, y: -5 }');
		// other entries should be unchanged
		expect(writtenContent).toContain('[FRUIT_TYPES.apple]');
	});

	it('updates tool definition with plain keys (not computed)', async () => {
		const existingContent = `export const TOOL_DEFINITIONS = {
	shovel: {
		svgComponent: ShovelSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 0, y: 25 },
		pivotPoint: { x: 38, y: 2 },
	},
} satisfies Partial<Record<ToolType, ToolDefinition>>;`;
		readFileSyncMock.mockReturnValue(existingContent);

		const request = makeJsonRequest({
			category: 'tools',
			assetName: 'shovel',
			values: {
				snapOffset: { x: 10, y: -15 },
				pivotPoint: { x: 5, y: 3 },
				anchorTarget: 'trunkMiddle',
			},
		});

		const response = await POST(makeEvent(request));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);

		const writtenContent = writeFileSyncMock.mock.calls[0][1] as string;
		expect(writtenContent).toContain('snapOffset: { x: 10, y: -15 }');
		expect(writtenContent).toContain('pivotPoint: { x: 5, y: 3 }');
		expect(writtenContent).toContain("anchorTarget: 'trunkMiddle'");
	});

	it('accepts camelCase asset names', async () => {
		const existingContent = `export const TOOL_DEFINITIONS = {
	wateringCan: {
		svgComponent: WateringCanSvg,
		anchorTarget: 'trunkBase',
		snapOffset: { x: 16, y: -8 },
		pivotPoint: { x: 16, y: 0 },
	},
} satisfies Partial<Record<ToolType, ToolDefinition>>;`;
		readFileSyncMock.mockReturnValue(existingContent);

		const request = makeJsonRequest({
			category: 'tools',
			assetName: 'wateringCan',
			values: { snapOffset: { x: 20, y: 5 } },
		});

		const response = await POST(makeEvent(request));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);

		const writtenContent = writeFileSyncMock.mock.calls[0][1] as string;
		expect(writtenContent).toContain('snapOffset: { x: 20, y: 5 }');
	});

	it('updates stage definition positionOffset values', async () => {
		const existingContent = `export const STAGE_DEFINITIONS = {
	[STAGE_ASSET_TYPES.seed]: {
		svgComponent: SeedSvg,
		scale: 1,
		positionOffset: { x: 0, y: 0 },
	},
} as const;`;
		readFileSyncMock.mockReturnValue(existingContent);

		const request = makeJsonRequest({
			category: 'stages',
			assetName: 'seed',
			values: { scale: 1.5, positionOffset: { x: 2, y: -3 } },
		});

		const response = await POST(makeEvent(request));
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.success).toBe(true);

		const writtenContent = writeFileSyncMock.mock.calls[0][1] as string;
		expect(writtenContent).toContain('scale: 1.5');
		expect(writtenContent).toContain('positionOffset: { x: 2, y: -3 }');
	});

	it('returns 400 for invalid category', async () => {
		const request = makeJsonRequest({
			category: 'invalid',
			assetName: 'acorn',
			values: { scale: 2 },
		});

		const response = await POST(makeEvent(request));
		expect(response.status).toBe(400);
	});

	it('returns 400 when category is missing', async () => {
		const request = makeJsonRequest({
			assetName: 'acorn',
			values: { scale: 2 },
		});

		const response = await POST(makeEvent(request));
		expect(response.status).toBe(400);
	});

	it('returns 400 when assetName is missing', async () => {
		const request = makeJsonRequest({
			category: 'fruits',
			values: { scale: 2 },
		});

		const response = await POST(makeEvent(request));
		expect(response.status).toBe(400);
	});
});
