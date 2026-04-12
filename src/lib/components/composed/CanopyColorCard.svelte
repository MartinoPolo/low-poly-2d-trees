<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import SectionCard from './SectionCard.svelte';

	interface Props {
		lightColor: string;
		darkColor: string;
		disabled?: boolean;
	}

	let { lightColor = $bindable(), darkColor = $bindable(), disabled = false }: Props = $props();

	let lightInputRef: HTMLInputElement | undefined = $state(undefined);
	let darkInputRef: HTMLInputElement | undefined = $state(undefined);
</script>

<SectionCard title="Canopy Color" contentClass="space-y-4">
	<div class="space-y-2">
		<Label for="canopy-light-color">Light Color</Label>
		<div class="relative flex items-center gap-3">
			<input
				type="color"
				id="canopy-light-color"
				bind:this={lightInputRef}
				bind:value={lightColor}
				{disabled}
				tabindex={-1}
				class="absolute h-0 w-0 overflow-hidden opacity-0"
			/>
			<button
				type="button"
				aria-label="Pick light canopy color"
				data-swatch="canopy-light"
				{disabled}
				onclick={() => lightInputRef?.click()}
				style:background-color={lightColor}
				class="h-10 w-10 cursor-pointer rounded-md border border-input shadow-sm transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
			></button>
			<Input
				data-hex="canopy-light"
				bind:value={lightColor}
				class="font-mono text-sm w-24 tabular-nums"
				{disabled}
			/>
		</div>
	</div>
	<div class="space-y-2">
		<Label for="canopy-dark-color">Dark Color</Label>
		<div class="relative flex items-center gap-3">
			<input
				type="color"
				id="canopy-dark-color"
				bind:this={darkInputRef}
				bind:value={darkColor}
				{disabled}
				tabindex={-1}
				class="absolute h-0 w-0 overflow-hidden opacity-0"
			/>
			<button
				type="button"
				aria-label="Pick dark canopy color"
				data-swatch="canopy-dark"
				{disabled}
				onclick={() => darkInputRef?.click()}
				style:background-color={darkColor}
				class="h-10 w-10 cursor-pointer rounded-md border border-input shadow-sm transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
			></button>
			<Input
				data-hex="canopy-dark"
				bind:value={darkColor}
				class="font-mono text-sm w-24 tabular-nums"
				{disabled}
			/>
		</div>
	</div>
</SectionCard>
