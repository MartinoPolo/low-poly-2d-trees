<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
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
	import { localizedResolve } from '$lib/i18n/localized_resolve.js';

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
			errorMessage = m.auth_passwords_mismatch();
			return;
		}

		pendingAction = 'email';
		try {
			const result = await authClient.signUp.email({ email, password, name });
			if (result.error) {
				errorMessage = result.error.message ?? m.auth_sign_up_failed();
				return;
			}
			await invalidateAll();
			await goto(localizedResolve('/'));
		} catch {
			errorMessage = m.auth_sign_up_failed();
		} finally {
			pendingAction = null;
		}
	}
</script>

<svelte:head>
	<title>{m.page_sign_up()}</title>
</svelte:head>

<Card>
	<CardHeader class="text-center">
		<h1 class="text-2xl font-medium leading-normal">{m.auth_sign_up_heading()}</h1>
		<CardDescription>{m.auth_sign_up_description()}</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="flex gap-3">
			<Button
				class="flex-1"
				data-testid="sign-up-google"
				disabled={pendingAction !== null}
				onclick={() => signInWithSocial('google')}
			>
				{m.auth_google()}
			</Button>
			<Button
				class="flex-1"
				data-testid="sign-up-github"
				disabled={pendingAction !== null}
				onclick={() => signInWithSocial('github')}
			>
				{m.auth_github()}
			</Button>
		</div>

		<div class="flex items-center gap-4">
			<Separator class="flex-1" />
			<span class="text-muted-foreground text-xs uppercase"
				>{m.auth_or_continue_with_email()}</span
			>
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
				<Label for="name">{m.auth_name()}</Label>
				<Input
					id="name"
					data-testid="auth-name"
					type="text"
					placeholder={m.auth_name_placeholder()}
					required
					bind:value={name}
				/>
			</div>

			<div class="space-y-2">
				<Label for="email">{m.auth_email()}</Label>
				<Input
					id="email"
					data-testid="auth-email"
					type="email"
					placeholder={m.auth_email_placeholder()}
					required
					bind:value={email}
				/>
			</div>

			<div class="space-y-2">
				<Label for="password">{m.auth_password()}</Label>
				<Input
					id="password"
					data-testid="auth-password"
					type="password"
					placeholder={m.auth_password_placeholder()}
					required
					minlength={8}
					bind:value={password}
				/>
			</div>

			<div class="space-y-2">
				<Label for="confirm-password">{m.auth_confirm_password()}</Label>
				<Input
					id="confirm-password"
					data-testid="auth-confirm-password"
					type="password"
					placeholder={m.auth_password_placeholder()}
					required
					minlength={8}
					bind:value={confirmPassword}
				/>
			</div>

			<Button type="submit" data-testid="auth-email-submit" disabled={pendingAction !== null}>
				{m.action_sign_up()}
			</Button>
		</form>

		{#if errorMessage}
			<Alert variant="destructive">
				<AlertDescription>{errorMessage}</AlertDescription>
			</Alert>
		{/if}

		<p class="text-muted-foreground text-center text-sm">
			{m.auth_have_account()}
			<a
				href={localizedResolve('/auth/sign-in')}
				class="text-foreground underline underline-offset-4 hover:text-primary"
				data-testid="auth-cross-link"
			>
				{m.action_sign_in()}
			</a>
		</p>
	</CardContent>
</Card>
