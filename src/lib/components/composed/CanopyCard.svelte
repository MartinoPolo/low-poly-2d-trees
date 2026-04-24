<script lang="ts">
	import type { EditorMode } from '$lib/config/editor_mode.js';
	import SectionCard from './SectionCard.svelte';
	import LabeledSlider from './LabeledSlider.svelte';
	import { use_settings_tier, tierAtLeast } from '$lib/context/settings_tier.context.svelte.js';
	import { useTreeConfig } from '$lib/trees/tree_config.context.svelte.js';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		mode: EditorMode;
		sceneShapeIsRandom?: boolean;
		onBlobCountChange?: (value: number) => void;
	}

	let { mode, sceneShapeIsRandom = false, onBlobCountChange }: Props = $props();

	const treeConfig = useTreeConfig();
	const { tier } = use_settings_tier();

	const isAdvanced = $derived(tierAtLeast(tier.current, 'advanced'));
	const isSceneRandom = $derived(mode === 'scene' && sceneShapeIsRandom);
	const canopySizeMax = $derived(mode === 'scene' ? 400 : 200);
</script>

<SectionCard title={m.section_canopy()} contentClass="space-y-4">
	<LabeledSlider
		label={m.label_blob_count()}
		id="input-blob-count"
		min={1}
		max={25}
		value={treeConfig.current.blobCount}
		onValueChange={onBlobCountChange}
		disabled={isSceneRandom}
	/>
	<LabeledSlider
		label={m.label_canopy_size()}
		id="input-canopy-size"
		min={25}
		max={canopySizeMax}
		step={5}
		unit="%"
		bind:value={treeConfig.current.canopySize}
	/>
	{#if isAdvanced}
		<LabeledSlider
			label={m.label_polygons_per_blob()}
			id="input-polygons-per-blob"
			min={4}
			max={30}
			bind:value={treeConfig.current.polygonsPerBlob}
		/>
		<LabeledSlider
			label={m.label_blob_size_variance()}
			id="input-blob-size-variance"
			min={1}
			max={10}
			step={0.1}
			format={(v) => v.toFixed(1)}
			unit="x"
			bind:value={treeConfig.current.blobSizeVariance}
			disabled={sceneShapeIsRandom}
		/>
		<LabeledSlider
			label={m.label_blob_closeness()}
			id="input-blob-closeness"
			min={0}
			max={100}
			unit="%"
			bind:value={treeConfig.current.blobCloseness}
			disabled={sceneShapeIsRandom}
		/>
	{/if}
</SectionCard>
