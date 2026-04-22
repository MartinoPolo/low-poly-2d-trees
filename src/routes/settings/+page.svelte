<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { authClient } from '$lib/auth/client.js';
	import Fingerprint from '@lucide/svelte/icons/fingerprint';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Check from '@lucide/svelte/icons/check';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import AvatarCircle from '$lib/avatar/AvatarCircle.svelte';
	import AnimalIcon from '$lib/avatar/AnimalIcon.svelte';
	import { ANIMAL_PRESETS, PRESET_COLORS, type AnimalPreset } from '$lib/avatar/presets.js';

	let { data } = $props();

	let presetOverride = $state<string | null | undefined>(undefined);
	let colorOverride = $state<string | null | undefined>(undefined);

	const selectedPreset = $derived(
		presetOverride !== undefined ? presetOverride : data.avatarPreset,
	);
	const selectedColor = $derived(colorOverride !== undefined ? colorOverride : data.avatarColor);
	let passkeys = $state<{ id: string; name?: string | undefined; createdAt: Date | null }[]>([]);
	let loading = $state(true);
	let registering = $state(false);
	let errorMessage = $state<string | null>(null);
	const colorPickerValue = $derived(selectedColor ?? '#888888');

	const isCustomColor = $derived(
		selectedColor !== null && !(PRESET_COLORS as readonly string[]).includes(selectedColor),
	);

	async function updateAvatar(updates: { avatarPreset?: string; avatarColor?: string }) {
		await fetch('/api/avatar', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updates),
		});
		await invalidateAll();
		presetOverride = undefined;
		colorOverride = undefined;
	}

	function selectPreset(preset: AnimalPreset) {
		presetOverride = preset;
		void updateAvatar({ avatarPreset: preset });
	}

	function selectColor(color: string) {
		colorOverride = color;
		void updateAvatar({ avatarColor: color });
	}

	function handleColorPickerInput(event: Event) {
		selectColor((event.target as HTMLInputElement).value);
	}

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

	<Card.Root class="mb-6">
		<Card.Header>
			<Card.Title>Avatar</Card.Title>
			<Card.Description>Choose your animal and background color.</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-6">
			<div class="flex justify-center">
				<AvatarCircle preset={selectedPreset} color={selectedColor} size="lg" />
			</div>

			<div>
				<p class="mb-3 text-sm font-medium">Animal</p>
				<div class="flex flex-wrap gap-2" data-testid="animal-swatches">
					{#each ANIMAL_PRESETS as preset (preset)}
						<button
							type="button"
							class="flex size-10 items-center justify-center rounded-full border-2 transition-colors {selectedPreset ===
							preset
								? 'border-primary bg-primary/10'
								: 'border-transparent hover:border-muted-foreground/30'}"
							onclick={() => selectPreset(preset)}
							aria-label="Select {preset}"
							data-testid="animal-swatch-{preset}"
						>
							<AnimalIcon {preset} class="size-6" />
						</button>
					{/each}
				</div>
			</div>

			<div>
				<p class="mb-3 text-sm font-medium">Background Color</p>
				<div class="flex flex-wrap gap-2" data-testid="color-swatches">
					{#each PRESET_COLORS as color (color)}
						<button
							type="button"
							class="flex size-10 items-center justify-center rounded-full border-2 transition-colors {selectedColor ===
							color
								? 'border-primary'
								: 'border-transparent hover:border-muted-foreground/30'}"
							style:background-color={color}
							onclick={() => selectColor(color)}
							aria-label="Select color {color}"
							data-testid="color-swatch"
						>
							{#if selectedColor === color}
								<Check class="size-4 text-white drop-shadow-sm" />
							{/if}
						</button>
					{/each}
					<label
						class="flex size-10 cursor-pointer items-center justify-center rounded-full border-2 transition-colors {isCustomColor
							? 'border-primary'
							: 'border-dashed border-muted-foreground/40 hover:border-muted-foreground/60'}"
						style:background-color={isCustomColor ? selectedColor : undefined}
						data-testid="color-picker"
					>
						<input
							type="color"
							class="sr-only"
							value={colorPickerValue}
							onchange={handleColorPickerInput}
						/>
						{#if isCustomColor}
							<Check class="size-4 text-white drop-shadow-sm" />
						{:else}
							<span class="text-xs text-muted-foreground">+</span>
						{/if}
					</label>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

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
