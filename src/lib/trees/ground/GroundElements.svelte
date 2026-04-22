<script lang="ts">
	import type { Point2D } from '$lib/trees/types/core.js';
	import { generateGroundPlacements } from './ground_generators.js';
	import { GROUND_DEFINITIONS } from './ground_definitions.js';

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
		{@const GroundSvg = GROUND_DEFINITIONS[placement.type].svgComponent}
		<g
			transform="translate({placement.x}, {placement.y}) scale({placement.scale}) rotate({placement.rotation})"
		>
			<GroundSvg variant={placement.variant} />
		</g>
	{/each}
</g>
