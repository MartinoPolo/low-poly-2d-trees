<script lang="ts">
	import LabeledSlider from './LabeledSlider.svelte';
	import LabeledSelect from './LabeledSelect.svelte';
	import SectionCard from './SectionCard.svelte';
	import { FRUIT_TYPE_OPTIONS } from '$lib/trees/types.js';
	import { isParamDisabled } from '$lib/trees/disabled_params.js';
	import { useTreeConfig } from '$lib/trees/tree_config.context.svelte.js';

	interface Props {
		onFruitTypeChange?: (value: string) => void;
	}

	let { onFruitTypeChange }: Props = $props();

	const treeConfig = useTreeConfig();

	const fruitCountDisabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'fruitCount', {
			fruitType: treeConfig.current.fruitType,
		}),
	);
</script>

<SectionCard title="Growables" contentClass="space-y-4">
	<LabeledSelect
		label="Fruit Type"
		options={FRUIT_TYPE_OPTIONS}
		value={treeConfig.current.fruitType}
		onValueChange={onFruitTypeChange}
	/>
	<LabeledSlider
		label="Fruit Count"
		min={0}
		max={7}
		bind:value={treeConfig.current.fruitCount}
		disabled={fruitCountDisabled}
	/>
</SectionCard>
