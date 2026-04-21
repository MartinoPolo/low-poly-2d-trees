<script lang="ts">
	import LabeledSlider from './LabeledSlider.svelte';
	import SectionCard from './SectionCard.svelte';
	import { use_settings_tier, tierAtLeast } from '$lib/context/settings_tier.context.svelte.js';

	interface Props {
		lightAngle: number;
		depthVariance: number;
	}

	let { lightAngle = $bindable(), depthVariance = $bindable() }: Props = $props();

	const { tier } = use_settings_tier();

	const isAdvanced = $derived(tierAtLeast(tier.current, 'advanced'));
</script>

<SectionCard title="Lighting" contentClass="space-y-4">
	<LabeledSlider label="Light Angle" min={0} max={360} unit="°" bind:value={lightAngle} />
	{#if isAdvanced}
		<LabeledSlider
			label="Depth Variance"
			min={0}
			max={2}
			step={0.1}
			format={(v) => v.toFixed(1)}
			bind:value={depthVariance}
		/>
	{/if}
</SectionCard>
