<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { authClient } from '$lib/auth/client.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	type SocialProvider = 'google' | 'github';
	type PendingProvider = SocialProvider | 'passkey';

	const PROVIDER_LABEL = {
		google: 'Google',
		github: 'GitHub',
		passkey: 'Passkey',
	} as const satisfies Record<PendingProvider, string>;

	let errorMessage = $state<string | null>(null);
	let pendingProvider = $state<PendingProvider | null>(null);

	async function signInWithSocial(provider: SocialProvider) {
		errorMessage = null;
		pendingProvider = provider;
		const result = await authClient.signIn.social({ provider, callbackURL: '/' });
		if (result.error) {
			errorMessage = result.error.message ?? `${PROVIDER_LABEL[provider]} sign-in failed.`;
			pendingProvider = null;
		}
	}

	async function signInWithPasskey() {
		errorMessage = null;
		pendingProvider = 'passkey';
		const result = await authClient.signIn.passkey();
		if (result?.error) {
			errorMessage = result.error.message ?? `${PROVIDER_LABEL.passkey} sign-in failed.`;
			pendingProvider = null;
			return;
		}
		await goto(resolve('/'));
	}
</script>

<svelte:head>
	<title>Sign in</title>
</svelte:head>

<main
	class="bg-background text-foreground flex min-h-screen items-center justify-center px-6 py-12"
>
	<section class="w-full max-w-sm space-y-6">
		<header class="space-y-2 text-center">
			<h1 class="text-3xl font-bold tracking-tight">Sign in</h1>
			<p class="text-muted-foreground text-sm">
				Continue with Google, GitHub, or a passkey. Your first successful sign-in creates
				your account automatically.
			</p>
		</header>

		<div class="flex flex-col gap-3">
			<Button
				data-testid="sign-in-google"
				disabled={pendingProvider !== null}
				onclick={() => signInWithSocial('google')}
			>
				Continue with Google
			</Button>
			<Button
				data-testid="sign-in-github"
				disabled={pendingProvider !== null}
				onclick={() => signInWithSocial('github')}
			>
				Continue with GitHub
			</Button>
			<Button
				data-testid="sign-in-passkey"
				variant="outline"
				disabled={pendingProvider !== null}
				onclick={signInWithPasskey}
			>
				Continue with Passkey
			</Button>
		</div>

		{#if errorMessage}
			<p role="alert" class="text-destructive text-center text-sm">{errorMessage}</p>
		{/if}
	</section>
</main>
