<script lang="ts">
	import type { EditorMode } from '$lib/config/editor_mode.js';
	import SectionCard from './SectionCard.svelte';
	import LabeledSlider from './LabeledSlider.svelte';
	import LabeledSelect from './LabeledSelect.svelte';
	import LabeledCheckbox from './LabeledCheckbox.svelte';
	import LabeledRangeSliderDual from './LabeledRangeSliderDual.svelte';
	import {
		BRANCH_MIRRORING,
		BRANCH_MIRRORING_OPTIONS,
		type BranchMirroring,
	} from '$lib/trees/types.js';
	import { isParamDisabled } from '$lib/trees/disabled_params.js';
	import { computeMaxBranches, clampBranchMaximums } from '$lib/trees/shapes.js';
	import { use_settings_tier, tierAtLeast } from '$lib/context/settings_tier.context.svelte.js';
	import { useTreeConfig } from '$lib/trees/tree_config.context.svelte.js';
	import { untrack } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { MIRRORING_LABELS, translateOptions } from '$lib/i18n/option_labels.js';

	interface Props {
		mode: EditorMode;
		sceneShapeIsRandom?: boolean;
	}

	let { mode, sceneShapeIsRandom }: Props = $props();

	const treeConfig = useTreeConfig();
	const { tier } = use_settings_tier();

	const isIntermediate = $derived(tierAtLeast(tier.current, 'intermediate'));
	const isAdvanced = $derived(tierAtLeast(tier.current, 'advanced'));

	const branchMaximums = $derived.by(() => {
		const raw = computeMaxBranches(treeConfig.current.shape, treeConfig.current.trunkHeight);
		return clampBranchMaximums(
			raw,
			treeConfig.current.branchMirroring,
			treeConfig.current.trunkFork,
		);
	});

	const branchCrookednessDisabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'branchCrookedness', {
			branchSegments: treeConfig.current.branchSegments,
		}),
	);
	const level1Disabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'branchesLevel1Range', {
			branchDepth: treeConfig.current.branchDepth,
		}),
	);
	const level2Disabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'branchesLevel2Range', {
			branchDepth: treeConfig.current.branchDepth,
		}),
	);
	const level3Disabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'branchesLevel3Range', {
			branchDepth: treeConfig.current.branchDepth,
		}),
	);

	const randomDisabled = $derived(mode === 'scene' && (sceneShapeIsRandom ?? false));

	const translatedMirroringOptions = $derived(
		translateOptions(BRANCH_MIRRORING_OPTIONS, MIRRORING_LABELS),
	);

	function isBranchMirroring(value: string): value is BranchMirroring {
		return (Object.values(BRANCH_MIRRORING) as readonly string[]).includes(value);
	}

	$effect(() => {
		const maxes = branchMaximums;
		untrack(() => {
			if (treeConfig.current.branchesLevel1Range[1] > maxes.maxLevel1) {
				treeConfig.current.branchesLevel1Range = [
					Math.min(treeConfig.current.branchesLevel1Range[0], maxes.maxLevel1),
					maxes.maxLevel1,
				];
			}
			if (treeConfig.current.branchesLevel2Range[1] > maxes.maxLevel2) {
				treeConfig.current.branchesLevel2Range = [
					Math.min(treeConfig.current.branchesLevel2Range[0], maxes.maxLevel2),
					maxes.maxLevel2,
				];
			}
			if (treeConfig.current.branchesLevel3Range[1] > maxes.maxLevel3) {
				treeConfig.current.branchesLevel3Range = [
					Math.min(treeConfig.current.branchesLevel3Range[0], maxes.maxLevel3),
					maxes.maxLevel3,
				];
			}
		});
	});
</script>

<SectionCard title={m.section_branches()} contentClass="space-y-4">
	{#if isIntermediate}
		<LabeledSlider
			label={m.label_branch_thickness()}
			id="input-branch-thickness"
			min={25}
			max={400}
			step={5}
			unit="%"
			bind:value={treeConfig.current.branchThickness}
		/>
		<LabeledSlider
			label={m.label_branch_depth()}
			id="input-branch-depth"
			min={0}
			max={3}
			disabled={randomDisabled}
			bind:value={treeConfig.current.branchDepth}
		/>
		<LabeledSlider
			label={m.label_branch_angle()}
			id="input-branch-angle"
			min={0}
			max={100}
			step={5}
			unit="%"
			disabled={level1Disabled || randomDisabled}
			bind:value={treeConfig.current.branchAngle}
		/>
		<LabeledSlider
			label={m.label_branch_length()}
			id="input-branch-length"
			min={25}
			max={400}
			step={5}
			unit="%"
			bind:value={treeConfig.current.branchLength}
		/>
		<LabeledSlider
			label={m.label_branch_length_variance()}
			id="input-branch-length-variance"
			min={0}
			max={100}
			step={5}
			unit="%"
			bind:value={treeConfig.current.branchLengthVariance}
		/>
		<LabeledSelect
			label={m.label_branch_mirroring()}
			options={translatedMirroringOptions}
			value={treeConfig.current.branchMirroring}
			disabled={level1Disabled || randomDisabled}
			onValueChange={(v) => {
				if (isBranchMirroring(v)) {
					treeConfig.current.branchMirroring = v;
				}
			}}
		/>
		<LabeledCheckbox
			label={m.label_trunk_fork()}
			id="input-trunk-fork"
			checked={treeConfig.current.trunkFork}
			disabled={level1Disabled || randomDisabled}
			onchange={(v) => {
				treeConfig.current.trunkFork = v;
			}}
		/>
		{#if treeConfig.current.branchDepth >= 1}
			<LabeledRangeSliderDual
				label={m.label_l1_branches()}
				id="input-l1-branches"
				min={0}
				max={branchMaximums.maxLevel1}
				value={[...treeConfig.current.branchesLevel1Range]}
				onValueChange={(v) => (treeConfig.current.branchesLevel1Range = v)}
				disabled={level1Disabled || randomDisabled}
			/>
		{/if}
		{#if treeConfig.current.branchDepth >= 2}
			<LabeledRangeSliderDual
				label={m.label_l2_branches()}
				id="input-l2-branches"
				min={0}
				max={branchMaximums.maxLevel2}
				value={[...treeConfig.current.branchesLevel2Range]}
				onValueChange={(v) => (treeConfig.current.branchesLevel2Range = v)}
				disabled={level2Disabled || randomDisabled}
			/>
		{/if}
		{#if treeConfig.current.branchDepth >= 3}
			<LabeledRangeSliderDual
				label={m.label_l3_branches()}
				id="input-l3-branches"
				min={0}
				max={branchMaximums.maxLevel3}
				value={[...treeConfig.current.branchesLevel3Range]}
				onValueChange={(v) => (treeConfig.current.branchesLevel3Range = v)}
				disabled={level3Disabled || randomDisabled}
			/>
		{/if}
	{/if}
	{#if isAdvanced}
		<LabeledSlider
			label={m.label_branch_segments()}
			id="input-branch-segments"
			min={1}
			max={3}
			step={1}
			disabled={randomDisabled}
			bind:value={treeConfig.current.branchSegments}
		/>
		<LabeledSlider
			label={m.label_branch_crookedness()}
			id="input-branch-crookedness"
			min={0}
			max={100}
			step={5}
			unit="%"
			disabled={branchCrookednessDisabled || randomDisabled}
			bind:value={treeConfig.current.branchCrookedness}
		/>
		<LabeledSlider
			label={m.label_branch_width_variance()}
			id="input-branch-width-variance"
			min={0}
			max={50}
			step={5}
			disabled={randomDisabled}
			bind:value={treeConfig.current.branchWidthVariance}
		/>
	{/if}
</SectionCard>
