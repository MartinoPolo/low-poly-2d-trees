<script lang="ts">
	import LabeledSlider from './LabeledSlider.svelte';
	import LabeledSelect from './LabeledSelect.svelte';
	import SectionCard from './SectionCard.svelte';
	import { FRUIT_TYPE_OPTIONS } from '$lib/trees/types.js';
	import { isParamDisabled } from '$lib/trees/disabled_params.js';
	import { useTreeConfig } from '$lib/trees/tree_config.context.svelte.js';
	import { m } from '$lib/paraglide/messages.js';
	import { FRUIT_LABELS, translateOptions } from '$lib/i18n/option_labels.js';

	interface Props {
		onFruitTypeChange?: (value: string) => void;
	}

	let { onFruitTypeChange }: Props = $props();

	const treeConfig = useTreeConfig();

	const translatedFruitOptions = $derived(translateOptions(FRUIT_TYPE_OPTIONS, FRUIT_LABELS));

	const fruitCountDisabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'fruitCount', {
			fruitType: treeConfig.current.fruitType,
		}),
	);
</script>

<SectionCard title={m.section_growables()} contentClass="space-y-4">
	<LabeledSelect
		label={m.label_fruit_type()}
		options={translatedFruitOptions}
		value={treeConfig.current.fruitType}
		onValueChange={onFruitTypeChange}
	/>
	<LabeledSlider
		label={m.label_fruit_count()}
		id="input-fruit-count"
		min={0}
		max={7}
		bind:value={treeConfig.current.fruitCount}
		disabled={fruitCountDisabled}
	/>
</SectionCard>
