<script lang="ts">
	import type { EditorMode } from '$lib/config/editor_mode.js';
	import SectionCard from './SectionCard.svelte';
	import LabeledSlider from './LabeledSlider.svelte';
	import LabeledSelect from './LabeledSelect.svelte';
	import { CROOKEDNESS_MODES, CROOKEDNESS_MODE_OPTIONS } from '$lib/trees/types.js';
	import { isParamDisabled } from '$lib/trees/disabled_params.js';
	import { use_settings_tier, tierAtLeast } from '$lib/context/settings_tier.context.svelte.js';
	import { useTreeConfig } from '$lib/trees/tree_config.context.svelte.js';
	import { m } from '$lib/paraglide/messages.js';
	import { CROOKEDNESS_LABELS, translateOptions } from '$lib/i18n/option_labels.js';

	interface Props {
		mode: EditorMode;
		sceneShapeIsRandom?: boolean;
		onTrunkHeightChange?: () => void;
	}

	let { mode, sceneShapeIsRandom = false, onTrunkHeightChange }: Props = $props();

	const treeConfig = useTreeConfig();
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

	const translatedCrookednessOptions = $derived(
		translateOptions(CROOKEDNESS_MODE_OPTIONS, CROOKEDNESS_LABELS),
	);

	function onCrookednessModeChange(v: string) {
		if (v in CROOKEDNESS_MODES) {
			treeConfig.current.crookednessMode =
				v as (typeof CROOKEDNESS_MODES)[keyof typeof CROOKEDNESS_MODES];
		}
	}
</script>

<SectionCard title={m.section_trunk()} contentClass="space-y-4">
	<LabeledSlider
		label={m.label_trunk_height()}
		id="input-trunk-height"
		min={trunkHeightMin}
		max={150}
		unit="%"
		bind:value={treeConfig.current.trunkHeight}
		onValueChange={() => onTrunkHeightChange?.()}
	/>
	<LabeledSlider
		label={m.label_trunk_thickness()}
		id="input-trunk-thickness"
		min={25}
		max={400}
		step={5}
		unit="%"
		bind:value={treeConfig.current.trunkThickness}
	/>
	{#if isAdvanced}
		<LabeledSlider
			label={m.label_trunk_strips()}
			id="input-trunk-strips"
			min={2}
			max={4}
			bind:value={treeConfig.current.trunkStripCount}
		/>
	{/if}
	{#if isIntermediate}
		<LabeledSlider
			label={m.label_trunk_segments()}
			id="input-trunk-segments"
			min={1}
			max={10}
			step={1}
			bind:value={treeConfig.current.trunkSegments}
		/>
		<LabeledSlider
			label={m.label_trunk_crookedness()}
			id="input-trunk-crookedness"
			min={0}
			max={100}
			step={5}
			unit="%"
			disabled={trunkCrookednessDisabled}
			bind:value={treeConfig.current.trunkCrookedness}
		/>
		<LabeledSlider
			label={m.label_trunk_lean()}
			id="input-trunk-lean"
			min={-45}
			max={45}
			step={1}
			unit="°"
			bind:value={treeConfig.current.trunkLean}
		/>
	{/if}
	{#if isAdvanced}
		<LabeledSlider
			label={m.label_trunk_twist()}
			id="input-trunk-twist"
			min={0}
			max={100}
			step={5}
			unit="%"
			disabled={isParamDisabled(treeConfig.current.shape, 'trunkTwist', treeConfig.current) ||
				sceneShapeIsRandom}
			bind:value={treeConfig.current.trunkTwist}
		/>
		<LabeledSelect
			label={m.label_crookedness_mode()}
			options={translatedCrookednessOptions}
			value={treeConfig.current.crookednessMode}
			onValueChange={onCrookednessModeChange}
			disabled={crookednessModeDisabled || sceneShapeIsRandom}
		/>
	{/if}
</SectionCard>
