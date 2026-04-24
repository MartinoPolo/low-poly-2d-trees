<script lang="ts">
	import type { EditorMode } from '$lib/config/editor_mode.js';
	import LabeledCheckbox from './LabeledCheckbox.svelte';
	import SectionCard from './SectionCard.svelte';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		mode: EditorMode;
		showCanopy: boolean;
		showBranches: boolean;
		showTrunk: boolean;
		showFruit?: boolean;
		showAnchors: boolean;
		showEnvelope?: boolean;
		showViewBox: boolean;
		debugDisableBackRows?: boolean;
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
		debugDisableBackRows = $bindable(false),
	}: Props = $props();
</script>

<SectionCard title={m.section_debug()} contentClass="space-y-4">
	<LabeledCheckbox
		label={m.label_show_canopy()}
		id="input-show-canopy"
		bind:checked={showCanopy}
	/>
	<LabeledCheckbox
		label={m.label_show_branches()}
		id="input-show-branches"
		bind:checked={showBranches}
	/>
	<LabeledCheckbox label={m.label_show_trunk()} id="input-show-trunk" bind:checked={showTrunk} />
	{#if mode === 'single'}
		<LabeledCheckbox
			label={m.label_show_fruit()}
			id="input-show-fruit"
			bind:checked={showFruit}
		/>
	{/if}
	<LabeledCheckbox
		label={m.label_show_anchor_points()}
		id="input-show-anchor-points"
		bind:checked={showAnchors}
	/>
	{#if mode === 'single'}
		<LabeledCheckbox
			label={m.label_show_envelope()}
			id="input-show-envelope"
			bind:checked={showEnvelope}
		/>
	{/if}
	<LabeledCheckbox
		label={m.label_show_view_box()}
		id="input-show-view-box"
		bind:checked={showViewBox}
	/>
	{#if mode === 'scene'}
		<LabeledCheckbox
			label={m.label_disable_back_rows()}
			id="input-disable-trees-from-row-2-"
			bind:checked={debugDisableBackRows}
		/>
	{/if}
</SectionCard>
