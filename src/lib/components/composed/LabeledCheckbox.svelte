<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { labelToInputId } from '$lib/utils/id.js';

	interface Props {
		label: string;
		checked: boolean;
		onchange?: (checked: boolean) => void;
		testId?: string;
		labelClass?: string;
		disabled?: boolean;
		class?: string;
	}

	let {
		label,
		checked = $bindable(),
		onchange,
		testId,
		labelClass,
		disabled,
		class: className,
	}: Props = $props();

	const inputId = $derived(labelToInputId(label));

	function handleChange(v: boolean | 'indeterminate') {
		const newValue = v === true;
		if (onchange) {
			onchange(newValue);
		} else {
			checked = newValue;
		}
	}
</script>

<div class="flex items-center gap-2 {className ?? ''}">
	<Checkbox
		id={inputId}
		data-testid={testId}
		{checked}
		{disabled}
		onCheckedChange={handleChange}
	/>
	<Label for={inputId} class={labelClass}>{label}</Label>
</div>
