<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { EditorMode } from '$lib/config/editor_mode.js';
	import type { SceneShapeSelection } from '$lib/scene/scene_config.js';
	import SectionCard from './SectionCard.svelte';
	import LabeledSelect from './LabeledSelect.svelte';
	import LabeledCheckbox from './LabeledCheckbox.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import Shuffle from '@lucide/svelte/icons/shuffle';
	import { TREE_SHAPE_OPTIONS, TREE_STAGE_OPTIONS } from '$lib/trees/types.js';
	import { SCENE_SHAPE_OPTIONS, SCENE_SHAPE_RANDOM } from '$lib/scene/scene_config.js';
	import { use_settings_tier, tierAtLeast } from '$lib/context/settings_tier.context.svelte.js';
	import { useTreeConfig } from '$lib/trees/tree_config.context.svelte.js';
	import { m } from '$lib/paraglide/messages.js';
	import { SHAPE_LABELS, STAGE_LABELS, translateOptions } from '$lib/i18n/option_labels.js';

	interface Props {
		mode: EditorMode;
		sceneShapeSelection?: SceneShapeSelection;
		usePerShapeDefaults?: boolean;
		onShapeChange?: (value: string) => void;
		onSceneShapeChange?: (value: string) => void;
		onStageChange?: (value: string) => void;
		onRandomizeSeed?: () => void;
		saveForm?: Snippet;
	}

	let {
		mode,
		sceneShapeSelection,
		usePerShapeDefaults = $bindable(false),
		onShapeChange,
		onSceneShapeChange,
		onStageChange,
		onRandomizeSeed,
		saveForm,
	}: Props = $props();

	const treeConfig = useTreeConfig();
	const { tier } = use_settings_tier();

	const isAdvanced = $derived(tierAtLeast(tier.current, 'advanced'));

	const translatedShapeOptions = $derived(translateOptions(TREE_SHAPE_OPTIONS, SHAPE_LABELS));
	const translatedStageOptions = $derived(translateOptions(TREE_STAGE_OPTIONS, STAGE_LABELS));
	const translatedSceneShapeOptions = $derived(
		translateOptions(SCENE_SHAPE_OPTIONS, SHAPE_LABELS),
	);
</script>

<SectionCard title={m.section_shape()} contentClass="space-y-4">
	{#if saveForm}
		{@render saveForm()}
	{/if}

	{#if mode === 'single'}
		<LabeledSelect
			label={m.label_tree_type()}
			options={translatedShapeOptions}
			value={treeConfig.current.shape}
			onValueChange={onShapeChange}
		/>
	{:else}
		<LabeledSelect
			label={m.label_tree_type()}
			options={translatedSceneShapeOptions}
			value={sceneShapeSelection ?? SCENE_SHAPE_RANDOM}
			onValueChange={onSceneShapeChange}
		/>
		{#if sceneShapeSelection === SCENE_SHAPE_RANDOM}
			<LabeledCheckbox
				label={m.label_use_per_shape_default_colors()}
				id="input-use-per-shape-default-colors"
				bind:checked={usePerShapeDefaults}
			/>
		{/if}
	{/if}

	<LabeledSelect
		label={m.label_life_stage()}
		options={translatedStageOptions}
		value={treeConfig.current.stage}
		onValueChange={onStageChange}
	/>

	{#if isAdvanced}
		<div class="space-y-2">
			<Label>{m.label_seed()}</Label>
			<div class="flex gap-2">
				<Input type="number" bind:value={treeConfig.current.seed} class="flex-1" />
				<Button variant="outline" size="icon" onclick={onRandomizeSeed}>
					<Shuffle />
				</Button>
			</div>
		</div>
	{/if}
</SectionCard>
