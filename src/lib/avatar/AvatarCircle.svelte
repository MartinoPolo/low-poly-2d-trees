<script lang="ts">
	import User from '@lucide/svelte/icons/user';
	import AnimalIcon from './AnimalIcon.svelte';
	import { isValidPreset, type AnimalPreset } from './presets.js';

	let {
		preset = null,
		color = null,
		size = 'sm',
	}: {
		preset?: string | null;
		color?: string | null;
		size?: 'sm' | 'lg';
	} = $props();

	const sizeClass = $derived(size === 'lg' ? 'size-16' : 'size-8');
	const iconClass = $derived(size === 'lg' ? 'size-10' : 'size-5');
	const fallbackIconClass = $derived(size === 'lg' ? 'size-6' : 'size-4');
	const validPreset = $derived.by((): AnimalPreset | null => {
		if (preset !== null && isValidPreset(preset)) {
			return preset;
		}
		return null;
	});
</script>

{#if validPreset !== null && color !== null}
	<div
		class="flex items-center justify-center rounded-full {sizeClass}"
		style:background-color={color}
	>
		<AnimalIcon preset={validPreset} class="{iconClass} text-white drop-shadow-sm" />
	</div>
{:else}
	<div class="flex items-center justify-center rounded-full bg-muted {sizeClass}">
		<User class="{fallbackIconClass} text-muted-foreground" />
	</div>
{/if}
