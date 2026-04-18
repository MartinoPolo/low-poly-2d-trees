<script lang="ts">
	import type { TreeAnchors } from '$lib/trees/types/core.js';
	import type { OverlayConfig } from './overlay_types.js';
	import StormCloud from './StormCloud.svelte';
	import SpeechBubble from './SpeechBubble.svelte';

	interface Props {
		config: OverlayConfig;
		anchors: TreeAnchors;
		seed: number;
		treeWidth: number;
	}

	let { config, anchors, seed, treeWidth }: Props = $props();
</script>

<g class="tree-overlays">
	{#if config.stormCloud.enabled}
		<StormCloud anchor={anchors.crownTop} config={config.stormCloud} {seed} {treeWidth} />
	{/if}

	{#if config.speechBubble.enabled && config.speechBubble.text.length > 0}
		<SpeechBubble anchor={anchors.crownCenter} config={config.speechBubble} />
	{/if}
</g>
