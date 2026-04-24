import { describe, it, expect, vi, beforeEach } from 'vitest';

const { updateMock, setMock, whereMock } = vi.hoisted(() => ({
	updateMock: vi.fn(),
	setMock: vi.fn(),
	whereMock: vi.fn(),
}));

vi.mock('$lib/server/db/index.js', () => ({
	db: {
		update: updateMock,
	},
}));

vi.mock('$lib/server/db/schema.js', () => ({
	user: { id: 'id' },
}));

vi.mock('drizzle-orm', () => ({
	eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
}));

import { PATCH } from './+server.js';
import { PRESET_COLORS } from '$lib/avatar/presets.js';

function makeEvent(
	body: Record<string, unknown>,
	user: { id: string } | null = { id: 'user-1' },
): Parameters<typeof PATCH>[0] {
	const request = new Request('http://localhost/api/avatar', {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	return {
		locals: { user },
		request,
		cookies: {
			delete: vi.fn(),
		},
	} as unknown as Parameters<typeof PATCH>[0];
}

describe('PATCH /api/avatar', () => {
	beforeEach(() => {
		updateMock.mockReset();
		setMock.mockReset();
		whereMock.mockReset();
		updateMock.mockReturnValue({ set: setMock });
		setMock.mockReturnValue({ where: whereMock });
		whereMock.mockResolvedValue(undefined);
	});

	it('returns 401 when not authenticated', async () => {
		await expect(PATCH(makeEvent({ avatarPreset: 'cat' }, null))).rejects.toMatchObject({
			status: 401,
		});
	});

	it('updates avatarPreset with valid value', async () => {
		const response = await PATCH(makeEvent({ avatarPreset: 'fox' }));
		expect(response.status).toBe(200);
		expect(setMock).toHaveBeenCalledWith({ avatarPreset: 'fox' });
	});

	it('updates avatarColor with valid hex', async () => {
		const response = await PATCH(makeEvent({ avatarColor: PRESET_COLORS[0] }));
		expect(response.status).toBe(200);
		expect(setMock).toHaveBeenCalledWith({ avatarColor: PRESET_COLORS[0] });
	});

	it('updates both fields at once', async () => {
		const response = await PATCH(makeEvent({ avatarPreset: 'owl', avatarColor: '#AABBCC' }));
		expect(response.status).toBe(200);
		expect(setMock).toHaveBeenCalledWith({ avatarPreset: 'owl', avatarColor: '#AABBCC' });
	});

	it('returns 400 for invalid preset', async () => {
		await expect(PATCH(makeEvent({ avatarPreset: 'unicorn' }))).rejects.toMatchObject({
			status: 400,
		});
	});

	it('returns 400 for invalid color', async () => {
		await expect(PATCH(makeEvent({ avatarColor: 'not-a-color' }))).rejects.toMatchObject({
			status: 400,
		});
	});
});
