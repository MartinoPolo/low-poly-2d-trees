<script lang="ts">
	import LabeledCheckbox from '$lib/components/composed/LabeledCheckbox.svelte';
	import LabeledSlider from '$lib/components/composed/LabeledSlider.svelte';
	import SectionCard from '$lib/components/composed/SectionCard.svelte';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		animateCanopySway: boolean;
		animateBranches: boolean;
		animateGrowth: boolean;
		growthVariance: number;
		animateTools: boolean;
	}

	let {
		animateCanopySway = $bindable(),
		animateBranches = $bindable(),
		animateGrowth = $bindable(),
		growthVariance = $bindable(),
		animateTools = $bindable(),
	}: Props = $props();
</script>

<SectionCard title={m.section_animations()} contentClass="space-y-4">
	<div data-testid="animation-controls">
		<LabeledCheckbox
			label={m.label_canopy_sway()}
			id="input-canopy-sway"
			bind:checked={animateCanopySway}
			testId="animate-canopy-sway"
		/>
		<LabeledCheckbox
			label={m.label_branch_movement()}
			id="input-branch-movement"
			bind:checked={animateBranches}
			testId="animate-branches"
			class="mt-4"
		/>
		<LabeledCheckbox
			label={m.label_growth()}
			id="input-growth"
			bind:checked={animateGrowth}
			testId="animate-growth"
			class="mt-4"
		/>
		{#if animateGrowth}
			<LabeledSlider
				label={m.label_growth_variance()}
				id="input-growth-variance"
				min={0}
				max={100}
				step={5}
				unit="%"
				bind:value={growthVariance}
			/>
		{/if}
	</div>
	<LabeledCheckbox
		label={m.label_animate_tools()}
		id="input-animate-tools"
		bind:checked={animateTools}
		testId="animate-tools"
		class="mt-4"
	/>
</SectionCard>
