<script lang="ts">
	import type { EditorMode } from '$lib/config/editor_mode.js';
	import SectionCard from './SectionCard.svelte';
	import LabeledSlider from './LabeledSlider.svelte';
	import LabeledSelect from './LabeledSelect.svelte';
	import { CROOKEDNESS_MODES, CROOKEDNESS_MODE_OPTIONS } from '$lib/trees/types.js';
	import { isParamDisabled } from '$lib/trees/disabled_params.js';
	import { use_settings_tier, tierAtLeast } from '$lib/context/settings_tier.context.svelte.js';
	import type { createTreeConfigContext } from '$lib/trees/tree_config.context.svelte.js';

	interface Props {
		treeConfig: ReturnType<typeof createTreeConfigContext>;
		mode: EditorMode;
		sceneShapeIsRandom?: boolean;
		onTrunkHeightChange?: () => void;
	}

	let { treeConfig, mode, sceneShapeIsRandom = false, onTrunkHeightChange }: Props = $props();

	const { tier } = use_settings_tier();

	const isIntermediate = $derived(tierAtLeast(tier.current, 'intermediate'));
	const isAdvanced = $derived(tierAtLeast(tier.current, 'advanced'));

	const trunkHeightMin = $derived(mode === 'single' ? 10 : 50);

	const trunkCrookednessDisabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'trunkCrookedness', {
			trunkSegments: treeConfig.current.trunkSegments,
		}),
	);
	const crookednessModeDisabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'crookednessMode', {
			trunkSegments: treeConfig.current.trunkSegments,
		}),
	);

	function onCrookednessModeChange(v: string) {
		if (v in CROOKEDNESS_MODES) {
			treeConfig.current.crookednessMode =
				v as (typeof CROOKEDNESS_MODES)[keyof typeof CROOKEDNESS_MODES];
		}
	}
</script>

<SectionCard title="Trunk" contentClass="space-y-4">
	<LabeledSlider
		label="Trunk Height"
		min={trunkHeightMin}
		max={150}
		unit="%"
		bind:value={treeConfig.current.trunkHeight}
		onValueChange={() => onTrunkHeightChange?.()}
	/>
	<LabeledSlider
		label="Trunk Thickness"
		min={25}
		max={400}
		step={5}
		unit="%"
		bind:value={treeConfig.current.trunkThickness}
	/>
	{#if isAdvanced}
		<LabeledSlider
			label="Trunk Strips"
			min={2}
			max={4}
			bind:value={treeConfig.current.trunkStripCount}
		/>
	{/if}
	{#if isIntermediate}
		<LabeledSlider
			label="Trunk Segments"
			min={1}
			max={10}
			step={1}
			bind:value={treeConfig.current.trunkSegments}
		/>
		<LabeledSlider
			label="Trunk Crookedness"
			min={0}
			max={100}
			step={5}
			unit="%"
			disabled={trunkCrookednessDisabled}
			bind:value={treeConfig.current.trunkCrookedness}
		/>
		<LabeledSlider
			label="Trunk Lean"
			min={-45}
			max={45}
			step={1}
			unit="°"
			bind:value={treeConfig.current.trunkLean}
		/>
	{/if}
	{#if isAdvanced}
		<LabeledSlider
			label="Trunk Twist"
			min={0}
			max={100}
			step={5}
			unit="%"
			disabled={isParamDisabled(treeConfig.current.shape, 'trunkTwist', treeConfig.current) ||
				sceneShapeIsRandom}
			bind:value={treeConfig.current.trunkTwist}
		/>
		<LabeledSelect
			label="Crookedness Mode"
			options={CROOKEDNESS_MODE_OPTIONS}
			value={treeConfig.current.crookednessMode}
			onValueChange={onCrookednessModeChange}
			disabled={crookednessModeDisabled || sceneShapeIsRandom}
		/>
	{/if}
</SectionCard>
