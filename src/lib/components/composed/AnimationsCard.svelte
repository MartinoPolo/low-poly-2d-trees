<script lang="ts">
	import LabeledCheckbox from '$lib/components/composed/LabeledCheckbox.svelte';
	import LabeledSlider from '$lib/components/composed/LabeledSlider.svelte';
	import SectionCard from '$lib/components/composed/SectionCard.svelte';

	interface Props {
		animateCanopySway: boolean;
		animateBranches: boolean;
		animateGrowth: boolean;
		growthVariance: number;
	}

	let {
		animateCanopySway = $bindable(),
		animateBranches = $bindable(),
		animateGrowth = $bindable(),
		growthVariance = $bindable(),
	}: Props = $props();
</script>

<SectionCard title="Animations" contentClass="space-y-4">
	<div data-testid="animation-controls">
		<LabeledCheckbox
			label="Canopy Sway"
			bind:checked={animateCanopySway}
			testId="animate-canopy-sway"
		/>
		<LabeledCheckbox
			label="Branch Movement"
			bind:checked={animateBranches}
			testId="animate-branches"
			class="mt-4"
		/>
		<LabeledCheckbox
			label="Growth"
			bind:checked={animateGrowth}
			testId="animate-growth"
			class="mt-4"
		/>
		{#if animateGrowth}
			<LabeledSlider
				label="Growth Variance"
				min={0}
				max={100}
				step={5}
				unit="%"
				bind:value={growthVariance}
			/>
		{/if}
	</div>
</SectionCard>
