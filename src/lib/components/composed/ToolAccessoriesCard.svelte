<script lang="ts">
	import LabeledCheckbox from '$lib/components/composed/LabeledCheckbox.svelte';
	import SectionCard from '$lib/components/composed/SectionCard.svelte';
	import LabeledSlider from '$lib/components/composed/LabeledSlider.svelte';
	import { TOOL_OPTIONS, type ToolVisibility } from '$lib/trees/tools/tool_types.js';

	interface Props {
		toolVisibility: ToolVisibility;
		animateTools: boolean;
	}

	let { toolVisibility = $bindable(), animateTools = $bindable() }: Props = $props();
</script>

<SectionCard title="Tools & Accessories" contentClass="space-y-4">
	{#each TOOL_OPTIONS as option (option.value)}
		<LabeledCheckbox
			label={option.label}
			checked={toolVisibility[option.value].visible}
			onchange={(v) =>
				(toolVisibility[option.value] = {
					...toolVisibility[option.value],
					visible: v,
				})}
			testId="tool-{option.value}-visible"
		/>
		{#if toolVisibility[option.value].visible}
			<LabeledSlider
				label="{option.label} Size"
				min={0.5}
				max={2}
				step={0.1}
				bind:value={toolVisibility[option.value].size}
				id="tool-{option.value}-size"
			/>
		{/if}
	{/each}
	<LabeledCheckbox label="Animate Tools" bind:checked={animateTools} testId="animate-tools" />
</SectionCard>
