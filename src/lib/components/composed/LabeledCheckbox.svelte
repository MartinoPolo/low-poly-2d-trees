<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

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
	<Checkbox data-testid={testId} {checked} {disabled} onCheckedChange={handleChange} />
	<Label class={labelClass}>{label}</Label>
</div>
