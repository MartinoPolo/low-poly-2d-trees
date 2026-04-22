<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';

	interface Props {
		value: string;
		id: string;
		ariaLabel: string;
		swatchTestId?: string;
		hexTestId?: string;
		disabled?: boolean;
	}

	let {
		value = $bindable(),
		id,
		ariaLabel,
		swatchTestId,
		hexTestId,
		disabled = false,
	}: Props = $props();

	let colorInputRef: HTMLInputElement | undefined = $state(undefined);
</script>

<input
	type="color"
	{id}
	bind:this={colorInputRef}
	bind:value
	{disabled}
	tabindex={-1}
	class="absolute h-0 w-0 overflow-hidden opacity-0"
/>
<button
	type="button"
	aria-label={ariaLabel}
	data-swatch={swatchTestId}
	{disabled}
	onclick={() => colorInputRef?.click()}
	style:background-color={value}
	class="h-9 w-9 cursor-pointer rounded-md border border-input shadow-sm transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
></button>
<Input data-hex={hexTestId} bind:value class="font-mono text-sm w-24 tabular-nums" {disabled} />
