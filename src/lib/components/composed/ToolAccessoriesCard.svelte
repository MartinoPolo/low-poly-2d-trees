<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
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
		<div class="flex items-center gap-2">
			<Checkbox
				data-testid="tool-{option.value}-visible"
				checked={toolVisibility[option.value].visible}
				onCheckedChange={(v) =>
					(toolVisibility[option.value] = {
						...toolVisibility[option.value],
						visible: v === true,
					})}
			/>
			<Label>{option.label}</Label>
		</div>
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
	<div class="flex items-center gap-2">
		<Checkbox
			data-testid="animate-tools"
			checked={animateTools}
			onCheckedChange={(v) => (animateTools = v === true)}
		/>
		<Label>Animate Tools</Label>
	</div>
</SectionCard>
