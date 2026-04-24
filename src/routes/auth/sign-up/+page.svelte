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
	import {
		signInWithSocial as signInSocial,
		type SocialProvider,
	} from '$lib/auth/social_auth.js';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';

	type PendingAction = SocialProvider | 'email';

	let errorMessage = $state<string | null>(null);
	let pendingAction = $state<PendingAction | null>(null);

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');

	async function signInWithSocial(provider: SocialProvider) {
		pendingAction = provider;
		await signInSocial(
			provider,
			(msg) => (errorMessage = msg),
			() => (pendingAction = null),
		);
	}

	async function handleEmailSubmit() {
		errorMessage = null;

		if (password !== confirmPassword) {
			errorMessage = 'Passwords do not match.';
			return;
		}

		pendingAction = 'email';
		try {
			const result = await authClient.signUp.email({ email, password, name });
			if (result.error) {
				errorMessage = result.error.message ?? 'Sign-up failed.';
				return;
			}
			await invalidateAll();
			await goto(resolve('/'));
		} catch {
			errorMessage = 'Sign-up failed.';
		} finally {
			pendingAction = null;
		}
	}
</script>

<svelte:head>
	<title>Sign Up</title>
</svelte:head>

<Card>
	<CardHeader class="text-center">
		<h1 class="text-2xl font-medium leading-normal">Create an account</h1>
		<CardDescription>Create your account to get started.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="flex gap-3">
			<Button
				class="flex-1"
				data-testid="sign-up-google"
				disabled={pendingAction !== null}
				onclick={() => signInWithSocial('google')}
			>
				Google
			</Button>
			<Button
				class="flex-1"
				data-testid="sign-up-github"
				disabled={pendingAction !== null}
				onclick={() => signInWithSocial('github')}
			>
				GitHub
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

			<Button type="submit" data-testid="auth-email-submit" disabled={pendingAction !== null}>
				Sign up
			</Button>
		</form>

		{#if errorMessage}
			<Alert variant="destructive">
				<AlertDescription>{errorMessage}</AlertDescription>
			</Alert>
		{/if}

		<p class="text-muted-foreground text-center text-sm">
			Already have an account?
			<a
				href={resolve('/auth/sign-in')}
				class="text-foreground underline underline-offset-4 hover:text-primary"
				data-testid="auth-cross-link"
			>
				Sign in
			</a>
		</p>
	</CardContent>
</Card>
