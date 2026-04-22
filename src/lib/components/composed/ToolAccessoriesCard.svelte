<script lang="ts">
	import LabeledCheckbox from '$lib/components/composed/LabeledCheckbox.svelte';
	import SectionCard from '$lib/components/composed/SectionCard.svelte';
	import LabeledSlider from '$lib/components/composed/LabeledSlider.svelte';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { TOOL_TYPES, TOOL_OPTIONS, type ToolVisibility } from '$lib/trees/tools/tool_types.js';

	interface Props {
		toolVisibility: ToolVisibility;
	}

	let { toolVisibility = $bindable() }: Props = $props();
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
			{#if option.value === TOOL_TYPES.speechBubble}
				<div class="ml-6">
					<Textarea
						data-testid="tool-speechBubble-text"
						placeholder="Enter text..."
						bind:value={toolVisibility[option.value].text}
					/>
				</div>
			{/if}
		{/if}
	{/each}
</SectionCard>
