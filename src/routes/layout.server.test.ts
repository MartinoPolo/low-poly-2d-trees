import { describe, it, expect, vi } from 'vitest';
import { SIDEBAR_COOKIE_NAME } from '$lib/components/ui/sidebar/constants.js';
import { load } from './+layout.server.js';

function makeEvent(cookieValue?: string) {
	const cookies = {
		get: vi.fn((name: string) => {
			if (name === SIDEBAR_COOKIE_NAME) {
				return cookieValue;
			}
			return undefined;
		}),
	};
	return {
		locals: { user: null },
		cookies,
	} as unknown as Parameters<typeof load>[0];
}

describe('+layout.server load', () => {
	it('returns sidebarOpen true when cookie is absent', async () => {
		expect.assertions(2);
		const result = await load(makeEvent());
		expect(result).toBeDefined();
		expect(result!.sidebarOpen).toBe(true);
	});

	it('returns sidebarOpen false when cookie value is "false"', async () => {
		expect.assertions(2);
		const result = await load(makeEvent('false'));
		expect(result).toBeDefined();
		expect(result!.sidebarOpen).toBe(false);
	});

	it('returns sidebarOpen true when cookie value is "true"', async () => {
		expect.assertions(2);
		const result = await load(makeEvent('true'));
		expect(result).toBeDefined();
		expect(result!.sidebarOpen).toBe(true);
	});
});
