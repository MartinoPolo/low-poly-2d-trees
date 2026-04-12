<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
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

	let mode = $state<'sign-in' | 'sign-up'>('sign-in');
	let errorMessage = $state<string | null>(null);
	let pendingAction = $state<PendingAction | null>(null);

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');

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

		if (mode === 'sign-up' && password !== confirmPassword) {
			errorMessage = 'Passwords do not match.';
			return;
		}

		pendingAction = 'email';

		if (mode === 'sign-up') {
			const result = await authClient.signUp.email({
				email,
				password,
				name,
			});
			if (result.error) {
				errorMessage = result.error.message ?? 'Sign-up failed.';
				pendingAction = null;
				return;
			}
		} else {
			const result = await authClient.signIn.email({
				email,
				password,
			});
			if (result.error) {
				errorMessage = result.error.message ?? 'Sign-in failed.';
				pendingAction = null;
				return;
			}
		}

		await goto(resolve('/'));
	}

	function toggleMode() {
		mode = mode === 'sign-in' ? 'sign-up' : 'sign-in';
		errorMessage = null;
	}
</script>

<svelte:head>
	<title>{mode === 'sign-in' ? 'Sign in' : 'Sign up'}</title>
</svelte:head>

<main
	class="bg-background text-foreground flex min-h-screen items-center justify-center px-6 py-12"
>
	<section class="w-full max-w-sm space-y-6">
		<header class="space-y-2 text-center">
			<h1 class="text-3xl font-bold tracking-tight">
				{mode === 'sign-in' ? 'Sign in' : 'Sign up'}
			</h1>
			<p class="text-muted-foreground text-sm">
				{mode === 'sign-in'
					? 'Continue with a social account, passkey, or email.'
					: 'Create your account to get started.'}
			</p>
		</header>

		<!-- OAuth buttons -->
		<div class="flex flex-col gap-3">
			<Button
				data-testid="sign-in-google"
				disabled={pendingAction !== null}
				onclick={() => signInWithSocial('google')}
			>
				Continue with Google
			</Button>
			<Button
				data-testid="sign-in-github"
				disabled={pendingAction !== null}
				onclick={() => signInWithSocial('github')}
			>
				Continue with GitHub
			</Button>
			<Button
				data-testid="sign-in-passkey"
				variant="outline"
				disabled={pendingAction !== null}
				onclick={signInWithPasskey}
			>
				Continue with Passkey
			</Button>
		</div>

		<div class="flex items-center gap-4">
			<Separator class="flex-1" />
			<span class="text-muted-foreground text-xs uppercase">Or continue with email</span>
			<Separator class="flex-1" />
		</div>

		<!-- Email/password form -->
		<form
			class="flex flex-col gap-4"
			onsubmit={(event) => {
				event.preventDefault();
				void handleEmailSubmit();
			}}
		>
			{#if mode === 'sign-up'}
				<div class="space-y-2">
					<Label for="name">Name</Label>
					<Input
						id="name"
						data-testid="auth-name"
						type="text"
						placeholder="Your name"
						required
						bind:value={name}
					/>
				</div>
			{/if}

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

			{#if mode === 'sign-up'}
				<div class="space-y-2">
					<Label for="confirm-password">Confirm Password</Label>
					<Input
						id="confirm-password"
						data-testid="auth-confirm-password"
						type="password"
						placeholder="••••••••"
						required
						minlength={8}
						bind:value={confirmPassword}
					/>
				</div>
			{/if}

			<Button type="submit" data-testid="auth-email-submit" disabled={pendingAction !== null}>
				{mode === 'sign-in' ? 'Sign in' : 'Sign up'}
			</Button>
		</form>

		{#if errorMessage}
			<p role="alert" class="text-destructive text-center text-sm">{errorMessage}</p>
		{/if}

		<p class="text-muted-foreground text-center text-sm">
			{#if mode === 'sign-in'}
				Don't have an account?
				<button
					type="button"
					class="text-foreground underline underline-offset-4 hover:text-primary"
					data-testid="auth-toggle-mode"
					onclick={toggleMode}
				>
					Sign up
				</button>
			{:else}
				Already have an account?
				<button
					type="button"
					class="text-foreground underline underline-offset-4 hover:text-primary"
					data-testid="auth-toggle-mode"
					onclick={toggleMode}
				>
					Sign in
				</button>
			{/if}
		</p>
	</section>
</main>
