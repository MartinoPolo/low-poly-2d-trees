<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';

	interface Props {
		label: string;
		value: number;
		min: number;
		max: number;
		step?: number;
		unit?: string;
		format?: (value: number) => string;
		disabled?: boolean;
		id?: string;
		class?: string;
	}

	let {
		label,
		value = $bindable(),
		min,
		max,
		step = 1,
		unit,
		format,
		disabled = false,
		id,
		class: className,
	}: Props = $props();

	const inputId = $derived(id ?? `range-${label.toLowerCase().replace(/\s+/g, '-')}`);
	const displayValue = $derived(format ? format(value) : String(value));
	const suffix = $derived(unit ?? '');
</script>

<div class="space-y-2 {className ?? ''}">
	<Label for={inputId}>{label}: {displayValue}{suffix}</Label>
	<input
		type="range"
		id={inputId}
		{min}
		{max}
		{step}
		bind:value
		{disabled}
		class="w-full accent-primary disabled:cursor-not-allowed disabled:opacity-50"
	/>
</div>
