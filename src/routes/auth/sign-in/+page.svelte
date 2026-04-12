<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
	} from '$lib/components/ui/card/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { authClient } from '$lib/auth/client.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	type SocialProvider = 'google' | 'github';
	type PendingAction = SocialProvider | 'passkey' | 'email';

	const PROVIDER_LABEL = {
		google: 'Google',
		github: 'GitHub',
		passkey: 'Passkey',
		email: 'Email',
	} as const satisfies Record<PendingAction, string>;

	let errorMessage = $state<string | null>(null);
	let pendingAction = $state<PendingAction | null>(null);

	let email = $state('');
	let password = $state('');

	async function signInWithSocial(provider: SocialProvider) {
		errorMessage = null;
		pendingAction = provider;
		const result = await authClient.signIn.social({ provider, callbackURL: resolve('/') });
		if (result.error) {
			errorMessage = result.error.message ?? `${PROVIDER_LABEL[provider]} sign-in failed.`;
			pendingAction = null;
		}
	}

	async function signInWithPasskey() {
		errorMessage = null;
		pendingAction = 'passkey';
		const result = await authClient.signIn.passkey();
		if (result?.error) {
			errorMessage = result.error.message ?? 'Passkey sign-in failed.';
			pendingAction = null;
			return;
		}
		await goto(resolve('/'));
	}

	async function handleEmailSubmit() {
		errorMessage = null;
		pendingAction = 'email';
		const result = await authClient.signIn.email({ email, password });
		if (result.error) {
			errorMessage = result.error.message ?? 'Sign-in failed.';
			pendingAction = null;
			return;
		}
		await goto(resolve('/'));
	}
</script>

<svelte:head>
	<title>Sign In</title>
</svelte:head>

<Card>
	<CardHeader class="text-center">
		<h1 class="text-2xl font-medium leading-normal">Sign In</h1>
		<CardDescription>Continue with a social account, passkey, or email.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="flex gap-3">
			<Button
				class="flex-1"
				data-testid="sign-in-google"
				disabled={pendingAction !== null}
				onclick={() => signInWithSocial('google')}
			>
				Google
			</Button>
			<Button
				class="flex-1"
				data-testid="sign-in-github"
				disabled={pendingAction !== null}
				onclick={() => signInWithSocial('github')}
			>
				GitHub
			</Button>
			<Button
				class="flex-1"
				variant="outline"
				data-testid="sign-in-passkey"
				disabled={pendingAction !== null}
				onclick={signInWithPasskey}
			>
				Passkey
			</Button>
		</div>

		<div class="flex items-center gap-4">
			<Separator class="flex-1" />
			<span class="text-muted-foreground text-xs uppercase">Or continue with email</span>
			<Separator class="flex-1" />
		</div>

		<form
			class="flex flex-col gap-4"
			onsubmit={(event) => {
				event.preventDefault();
				void handleEmailSubmit();
			}}
		>
			<div class="space-y-2">
				<Label for="email">Email</Label>
				<Input
					id="email"
					data-testid="auth-email"
					type="email"
					placeholder="you@example.com"
					required
					bind:value={email}
				/>
			</div>

			<div class="space-y-2">
				<Label for="password">Password</Label>
				<Input
					id="password"
					data-testid="auth-password"
					type="password"
					placeholder="••••••••"
					required
					minlength={8}
					bind:value={password}
				/>
			</div>

			<Button type="submit" data-testid="auth-email-submit" disabled={pendingAction !== null}>
				Sign in
			</Button>
		</form>

		{#if errorMessage}
			<Alert variant="destructive">
				<AlertDescription>{errorMessage}</AlertDescription>
			</Alert>
		{/if}

		<p class="text-muted-foreground text-center text-sm">
			Don't have an account?
			<a
				href={resolve('/auth/sign-up')}
				class="text-foreground underline underline-offset-4 hover:text-primary"
				data-testid="auth-cross-link"
			>
				Sign up
			</a>
		</p>
	</CardContent>
</Card>
