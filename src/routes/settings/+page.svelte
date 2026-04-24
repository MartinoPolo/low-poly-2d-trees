<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { authClient } from '$lib/auth/client.js';
	import Fingerprint from '@lucide/svelte/icons/fingerprint';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Check from '@lucide/svelte/icons/check';
	import Save from '@lucide/svelte/icons/save';
	import { onMount } from 'svelte';
	import AvatarCircle from '$lib/avatar/AvatarCircle.svelte';
	import AnimalIcon from '$lib/avatar/AnimalIcon.svelte';
	import { ANIMAL_PRESETS, PRESET_COLORS, type AnimalPreset } from '$lib/avatar/presets.js';
	import { invalidateAll } from '$app/navigation';
	import { use_avatar } from '$lib/context/avatar.context.svelte.js';
	import { m } from '$lib/paraglide/messages.js';
	import PageLayout from '$lib/components/app-shell/PageLayout.svelte';

	const { avatar: avatarCtx } = use_avatar();

	let selectedPreset = $state<string | null>(avatarCtx.current.preset);
	let selectedColor = $state<string | null>(avatarCtx.current.color);
	let saving = $state(false);
	let passkeys = $state<{ id: string; name?: string | undefined; createdAt: Date | null }[]>([]);
	let loading = $state(true);
	let registering = $state(false);
	let errorMessage = $state<string | null>(null);
	const colorPickerValue = $derived(selectedColor ?? '#888888');

	const isCustomColor = $derived(
		selectedColor !== null && !(PRESET_COLORS as readonly string[]).includes(selectedColor),
	);

	const hasChanges = $derived(
		selectedPreset !== avatarCtx.current.preset || selectedColor !== avatarCtx.current.color,
	);

	async function saveAvatar() {
		if (!hasChanges) {
			return;
		}
		saving = true;
		try {
			const updates: { avatarPreset?: string; avatarColor?: string } = {};
			if (selectedPreset !== null && selectedPreset !== avatarCtx.current.preset) {
				updates.avatarPreset = selectedPreset;
			}
			if (selectedColor !== null && selectedColor !== avatarCtx.current.color) {
				updates.avatarColor = selectedColor;
			}
			const response = await fetch('/api/avatar', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates),
			});
			if (response.ok) {
				avatarCtx.current = {
					preset: selectedPreset,
					color: selectedColor,
				};
				await invalidateAll();
			}
		} finally {
			saving = false;
		}
	}

	function selectPreset(preset: AnimalPreset) {
		selectedPreset = preset;
	}

	function selectColor(color: string) {
		selectedColor = color;
	}

	function handleColorPickerChange(event: Event) {
		selectColor((event.target as HTMLInputElement).value);
	}

	async function loadPasskeys() {
		loading = true;
		errorMessage = null;
		const result = await authClient.passkey.listUserPasskeys();
		if (result.error) {
			errorMessage = result.error.message ?? m.status_failed_load_passkeys();
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
			errorMessage = result.error.message ?? m.status_failed_register_passkey();
			registering = false;
			return;
		}
		registering = false;
		await loadPasskeys();
	}

	async function deletePasskey(id: string) {
		const confirmed = globalThis.confirm(m.action_confirm_delete_passkey());
		if (!confirmed) {
			return;
		}

		errorMessage = null;
		const result = await authClient.passkey.deletePasskey({ id });
		if (result?.error) {
			errorMessage = result.error.message ?? m.status_failed_delete_passkey();
			return;
		}
		await loadPasskeys();
	}

	onMount(() => {
		void loadPasskeys();
	});
</script>

<svelte:head>
	<title>{m.page_settings()}</title>
</svelte:head>

<PageLayout heading={m.settings_heading()}>
	<div class="mx-auto max-w-2xl space-y-6">
		<Card.Root>
			<Card.Header>
				<Card.Title>{m.settings_avatar()}</Card.Title>
				<Card.Description>{m.settings_avatar_description()}</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="flex justify-center">
					<AvatarCircle preset={selectedPreset} color={selectedColor} size="lg" />
				</div>

				<div>
					<p class="mb-3 text-sm font-medium">{m.settings_animal()}</p>
					<div class="flex flex-wrap gap-2" data-testid="animal-swatches">
						{#each ANIMAL_PRESETS as preset (preset)}
							<button
								type="button"
								class="flex size-10 items-center justify-center rounded-full border-2 transition-colors {selectedPreset ===
								preset
									? 'border-primary bg-primary/10'
									: 'border-transparent hover:border-muted-foreground/30'}"
								onclick={() => selectPreset(preset)}
								aria-label={m.settings_select_animal({ preset })}
								data-testid="animal-swatch-{preset}"
							>
								<AnimalIcon {preset} class="size-6" />
							</button>
						{/each}
					</div>
				</div>

				<div>
					<p class="mb-3 text-sm font-medium">{m.settings_background_color()}</p>
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
								aria-label={m.settings_select_color({ color })}
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
								onchange={handleColorPickerChange}
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
			<Card.Footer>
				<Button
					data-testid="save-avatar"
					disabled={!hasChanges || saving}
					onclick={saveAvatar}
				>
					<Save class="mr-2 size-4" />
					{saving ? m.action_saving() : m.action_save_avatar()}
				</Button>
			</Card.Footer>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Fingerprint class="size-5" />
					{m.settings_passkeys()}
				</Card.Title>
				<Card.Description>{m.settings_passkeys_description()}</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				{#if loading}
					<p class="text-sm text-muted-foreground">{m.status_loading_passkeys()}</p>
				{:else if passkeys.length === 0}
					<p class="text-sm text-muted-foreground" data-testid="no-passkeys">
						{m.status_no_passkeys()}
					</p>
				{:else}
					<ul class="divide-y divide-border" data-testid="passkey-list">
						{#each passkeys as pk (pk.id)}
							<li class="flex items-center justify-between py-3">
								<div>
									<p class="text-sm font-medium">
										{pk.name ?? m.status_unnamed_passkey()}
									</p>
									{#if pk.createdAt}
										<p class="text-xs text-muted-foreground">
											{m.status_passkey_registered({
												date: new Date(pk.createdAt).toLocaleDateString(),
											})}
										</p>
									{/if}
								</div>
								<Button
									variant="ghost"
									size="icon"
									class="size-8"
									data-testid="delete-passkey"
									onclick={() => deletePasskey(pk.id)}
									aria-label={m.settings_delete_passkey()}
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
				<Button
					data-testid="register-passkey"
					disabled={registering}
					onclick={registerPasskey}
				>
					<Fingerprint class="mr-2 size-4" />
					{registering ? m.action_registering() : m.action_register_passkey()}
				</Button>
			</Card.Footer>
		</Card.Root>
	</div>
</PageLayout>
