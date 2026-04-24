import { authClient } from './client.js';
import { resolve } from '$app/paths';

export type SocialProvider = 'google' | 'github';

const PROVIDER_LABEL: Record<SocialProvider, string> = {
	google: 'Google',
	github: 'GitHub',
};

export async function signInWithSocial(
	provider: SocialProvider,
	setError: (message: string | null) => void,
	setPending: (pending: boolean) => void,
): Promise<void> {
	setError(null);
	setPending(true);
	try {
		const result = await authClient.signIn.social({ provider, callbackURL: resolve('/') });
		if (result.error) {
			setError(result.error.message ?? `${PROVIDER_LABEL[provider]} sign-in failed.`);
		}
	} catch {
		setError(`${PROVIDER_LABEL[provider]} sign-in failed.`);
	} finally {
		setPending(false);
	}
}
