import { describe, it, expect, vi, beforeEach } from 'vitest';

const { signOutMock } = vi.hoisted(() => ({ signOutMock: vi.fn() }));
vi.mock('$lib/server/auth.js', () => ({
	auth: {
		api: {
			signOut: signOutMock,
		},
	},
}));

// @sveltejs/kit's redirect throws a Redirect object; importing from the package
// avoids reimplementing the sentinel type.
import { POST } from './+server.js';

function makeEvent(headers: Headers): Parameters<typeof POST>[0] {
	const request = new Request('http://localhost/auth/sign-out', {
		method: 'POST',
		headers,
	});
	return { request } as Parameters<typeof POST>[0];
}

describe('POST /auth/sign-out', () => {
	beforeEach(() => {
		signOutMock.mockReset();
		signOutMock.mockResolvedValue({ success: true });
	});

	it('calls auth.api.signOut with the request headers', async () => {
		const headers = new Headers({ cookie: 'test-session=abc' });
		await expect(POST(makeEvent(headers))).rejects.toMatchObject({
			status: 303,
			location: '/',
		});
		expect(signOutMock).toHaveBeenCalledWith({ headers });
	});

	it('redirects to / after sign-out', async () => {
		const headers = new Headers();
		await expect(POST(makeEvent(headers))).rejects.toMatchObject({
			status: 303,
			location: '/',
		});
	});
});
