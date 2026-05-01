<script lang="ts">
	import LabeledCheckbox from '$lib/components/composed/LabeledCheckbox.svelte';
	import SectionCard from '$lib/components/composed/SectionCard.svelte';
	import LabeledSlider from '$lib/components/composed/LabeledSlider.svelte';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { TOOL_TYPES, TOOL_OPTIONS, type ToolVisibility } from '$lib/trees/tools/tool_types.js';
	import { m } from '$lib/paraglide/messages.js';

	const TOOL_LABELS: Record<string, () => string> = {
		[TOOL_TYPES.shovel]: () => m.tool_shovel(),
		[TOOL_TYPES.wateringCan]: () => m.tool_watering_can(),
		[TOOL_TYPES.ladder]: () => m.tool_ladder(),
		[TOOL_TYPES.axe]: () => m.tool_axe(),
		[TOOL_TYPES.rake]: () => m.tool_rake(),
		[TOOL_TYPES.woodpecker]: () => m.tool_woodpecker(),
		[TOOL_TYPES.grill]: () => m.tool_grill(),
		[TOOL_TYPES.speechBubble]: () => m.tool_speech_bubble(),
		[TOOL_TYPES.stormCloud]: () => m.tool_storm_cloud(),
		[TOOL_TYPES.lantern]: () => 'Lantern',
		[TOOL_TYPES.pruningShears]: () => 'Pruning Shears',
	};

	interface Props {
		toolVisibility: ToolVisibility;
	}

	let { toolVisibility = $bindable() }: Props = $props();
</script>

<SectionCard title={m.section_tools_accessories()} contentClass="space-y-4">
	{#each TOOL_OPTIONS as option (option.value)}
		<LabeledCheckbox
			label={TOOL_LABELS[option.value]?.() ?? option.label}
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
				label={m.label_tool_size({ tool: TOOL_LABELS[option.value]?.() ?? option.label })}
				min={0.5}
				max={2}
				step={0.1}
				bind:value={toolVisibility[option.value].size}
				id="tool-{option.value}-size"
			/>
			{#if option.value === TOOL_TYPES.speechBubble}
				<div class="ml-6 space-y-2">
					<Textarea
						data-testid="tool-speechBubble-text"
						placeholder={m.placeholder_enter_text()}
						bind:value={toolVisibility[option.value].text}
					/>
					<label class="flex items-center gap-2 text-sm">
						<span>Bubble Color</span>
						<input
							type="color"
							value={toolVisibility[option.value].color ?? '#ffffff'}
							oninput={(e) =>
								(toolVisibility[option.value] = {
									...toolVisibility[option.value],
									color: e.currentTarget.value,
								})}
							data-testid="tool-speechBubble-color"
						/>
					</label>
				</div>
			{/if}
		{/if}
	{/each}
</SectionCard>
