<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { authClient } from '$lib/auth/client.js';
	import Fingerprint from '@lucide/svelte/icons/fingerprint';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';

	let passkeys = $state<{ id: string; name?: string | undefined; createdAt: Date | null }[]>([]);
	let loading = $state(true);
	let registering = $state(false);
	let errorMessage = $state<string | null>(null);

	async function loadPasskeys() {
		loading = true;
		errorMessage = null;
		const result = await authClient.passkey.listUserPasskeys();
		if (result.error) {
			errorMessage = result.error.message ?? 'Failed to load passkeys.';
		} else {
			passkeys = result.data ?? [];
		}
		loading = false;
	}

	async function registerPasskey() {
		registering = true;
		errorMessage = null;
		const result = await authClient.passkey.addPasskey();
		if (result?.error) {
			errorMessage = result.error.message ?? 'Failed to register passkey.';
			registering = false;
			return;
		}
		registering = false;
		await loadPasskeys();
	}

	async function deletePasskey(id: string) {
		const confirmed = globalThis.confirm('Delete this passkey? This cannot be undone.');
		if (!confirmed) {
			return;
		}

		errorMessage = null;
		const result = await authClient.passkey.deletePasskey({ id });
		if (result?.error) {
			errorMessage = result.error.message ?? 'Failed to delete passkey.';
			return;
		}
		await loadPasskeys();
	}

	onMount(() => {
		void loadPasskeys();
	});
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<main class="container mx-auto max-w-2xl p-6">
	<header class="mb-6">
		<h1 class="text-2xl font-bold tracking-tight">Settings</h1>
	</header>

	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Fingerprint class="size-5" />
				Passkeys
			</Card.Title>
			<Card.Description>Manage your passkeys for passwordless sign-in.</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#if loading}
				<p class="text-sm text-muted-foreground">Loading passkeys…</p>
			{:else if passkeys.length === 0}
				<p class="text-sm text-muted-foreground" data-testid="no-passkeys">
					No passkeys registered yet.
				</p>
			{:else}
				<ul class="divide-y divide-border" data-testid="passkey-list">
					{#each passkeys as pk (pk.id)}
						<li class="flex items-center justify-between py-3">
							<div>
								<p class="text-sm font-medium">
									{pk.name ?? 'Unnamed passkey'}
								</p>
								{#if pk.createdAt}
									<p class="text-xs text-muted-foreground">
										Registered {new Date(pk.createdAt).toLocaleDateString()}
									</p>
								{/if}
							</div>
							<Button
								variant="ghost"
								size="icon"
								class="size-8"
								data-testid="delete-passkey"
								onclick={() => deletePasskey(pk.id)}
								aria-label="Delete passkey"
							>
								<Trash2 class="size-4" />
							</Button>
						</li>
					{/each}
				</ul>
			{/if}

			{#if errorMessage}
				<p role="alert" class="text-sm text-destructive">{errorMessage}</p>
			{/if}
		</Card.Content>
		<Card.Footer>
			<Button data-testid="register-passkey" disabled={registering} onclick={registerPasskey}>
				<Fingerprint class="mr-2 size-4" />
				{registering ? 'Registering…' : 'Register new passkey'}
			</Button>
		</Card.Footer>
	</Card.Root>
</main>
