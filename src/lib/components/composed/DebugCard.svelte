<script lang="ts">
	import type { EditorMode } from '$lib/config/editor_mode.js';
	import LabeledCheckbox from './LabeledCheckbox.svelte';
	import SectionCard from './SectionCard.svelte';

	interface Props {
		mode: EditorMode;
		showCanopy: boolean;
		showBranches: boolean;
		showTrunk: boolean;
		showFruit?: boolean;
		showAnchors: boolean;
		showEnvelope?: boolean;
		showViewBox: boolean;
	}

	let {
		mode,
		showCanopy = $bindable(),
		showBranches = $bindable(),
		showTrunk = $bindable(),
		showFruit = $bindable(false),
		showAnchors = $bindable(),
		showEnvelope = $bindable(false),
		showViewBox = $bindable(),
	}: Props = $props();
</script>

<SectionCard title="Debug" contentClass="space-y-4">
	<LabeledCheckbox label="Show Canopy" bind:checked={showCanopy} />
	<LabeledCheckbox label="Show Branches" bind:checked={showBranches} />
	<LabeledCheckbox label="Show Trunk" bind:checked={showTrunk} />
	{#if mode === 'single'}
		<LabeledCheckbox label="Show Fruit" bind:checked={showFruit} />
	{/if}
	<LabeledCheckbox label="Show Anchor Points" bind:checked={showAnchors} />
	{#if mode === 'single'}
		<LabeledCheckbox label="Show Envelope" bind:checked={showEnvelope} />
	{/if}
	<LabeledCheckbox label="Show View Box" bind:checked={showViewBox} />
</SectionCard>
