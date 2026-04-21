<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { labelToInputId } from '$lib/utils/id.js';

	interface Props {
		label: string;
		value: number;
		min: number;
		max: number;
		step?: number;
		unit?: string;
		format?: (value: number) => string;
		disabled?: boolean;
		onValueChange?: (value: number) => void;
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
		onValueChange,
		id,
		class: className,
	}: Props = $props();

	const inputId = $derived(labelToInputId(label, id));
	const displayValue = $derived(format ? format(value) : String(value));

	function handleValueChange(newValue: number) {
		value = newValue;
		onValueChange?.(newValue);
	}
</script>

<div class="space-y-2 {className ?? ''}">
	<Label for={inputId}>{label}: {displayValue}{unit ?? ''}</Label>
	<Slider
		type="single"
		id={inputId}
		{value}
		{min}
		{max}
		{step}
		{disabled}
		onValueChange={handleValueChange}
	/>
</div>
