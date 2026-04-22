<script lang="ts">
	import type { Point2D } from '$lib/trees/types/core.js';
	import { generateGroundPlacements } from './ground_generators.js';
	import StoneSvg from '$lib/trees/assets/ground/StoneSvg.svelte';
	import GrassSvg from '$lib/trees/assets/ground/GrassSvg.svelte';

	interface Props {
		seed: number;
		trunkBase: Point2D;
		spreadWidth?: number;
		count?: number;
		sizeMultiplier?: number;
	}

	let { seed, trunkBase, spreadWidth = 100, count, sizeMultiplier }: Props = $props();

	const placements = $derived(
		generateGroundPlacements(seed, trunkBase, spreadWidth, count, sizeMultiplier),
	);
</script>

<g class="ground-elements">
	{#each placements as placement, i (i)}
		<g
			transform="translate({placement.x}, {placement.y}) scale({placement.scale}) rotate({placement.rotation})"
		>
			{#if placement.type === 'stone'}
				<StoneSvg variant={placement.variant} />
			{:else}
				<GrassSvg variant={placement.variant} />
			{/if}
		</g>
	{/each}
</g>
