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
	import type { createTreeConfigContext } from '$lib/trees/tree_config.context.svelte.js';

	interface Props {
		treeConfig: ReturnType<typeof createTreeConfigContext>;
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
		treeConfig,
		mode,
		sceneShapeSelection,
		usePerShapeDefaults = $bindable(false),
		onShapeChange,
		onSceneShapeChange,
		onStageChange,
		onRandomizeSeed,
		saveForm,
	}: Props = $props();

	const { tier } = use_settings_tier();

	const isAdvanced = $derived(tierAtLeast(tier.current, 'advanced'));
</script>

<SectionCard title="Shape" contentClass="space-y-4">
	{#if saveForm}
		{@render saveForm()}
	{/if}

	{#if mode === 'single'}
		<LabeledSelect
			label="Tree Type"
			options={TREE_SHAPE_OPTIONS}
			value={treeConfig.current.shape}
			onValueChange={onShapeChange}
		/>
	{:else}
		<LabeledSelect
			label="Tree Type"
			options={SCENE_SHAPE_OPTIONS}
			value={sceneShapeSelection ?? SCENE_SHAPE_RANDOM}
			onValueChange={onSceneShapeChange}
		/>
		{#if sceneShapeSelection === SCENE_SHAPE_RANDOM}
			<LabeledCheckbox
				label="Use per-shape default colors"
				bind:checked={usePerShapeDefaults}
			/>
		{/if}
	{/if}

	<LabeledSelect
		label="Life Stage"
		options={TREE_STAGE_OPTIONS}
		value={treeConfig.current.stage}
		onValueChange={onStageChange}
	/>

	{#if isAdvanced}
		<div class="space-y-2">
			<Label>Seed</Label>
			<div class="flex gap-2">
				<Input type="number" bind:value={treeConfig.current.seed} class="flex-1" />
				<Button variant="outline" size="icon" onclick={onRandomizeSeed}>
					<Shuffle />
				</Button>
			</div>
		</div>
	{/if}
</SectionCard>
