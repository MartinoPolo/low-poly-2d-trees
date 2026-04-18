<script lang="ts">
	import type { Point2D } from '$lib/trees/types/core.js';
	import { generateGroundPlacements } from './ground_generators.js';

	interface Props {
		seed: number;
		trunkBase: Point2D;
		spreadWidth?: number;
	}

	let { seed, trunkBase, spreadWidth = 50 }: Props = $props();

	const placements = $derived(generateGroundPlacements(seed, trunkBase, spreadWidth));
</script>

<g class="ground-elements">
	{#each placements as placement (placement)}
		<g
			transform="translate({placement.x}, {placement.y}) scale({placement.scale}) rotate({placement.rotation})"
		>
			{#if placement.type === 'stone'}
				{#if placement.variant === 0}
					<polygon
						points="-4,0 -2,-3 2,-4 5,-1 3,2 -1,2"
						fill="#8a8a7a"
						stroke="#7a7a6a"
						stroke-width="0.3"
					/>
				{:else if placement.variant === 1}
					<polygon
						points="-3,0 -1,-3 3,-2 4,1 0,2"
						fill="#9a9080"
						stroke="#8a8070"
						stroke-width="0.3"
					/>
				{:else}
					<polygon
						points="-5,1 -3,-2 0,-3 4,-1 3,2 -2,2"
						fill="#7a7a6a"
						stroke="#6a6a5a"
						stroke-width="0.3"
					/>
				{/if}
			{:else if placement.variant === 0}
				<path d="M0,0 L-1,-6 L0,-4 L1,-7 L2,-3 L1,-5 L2,0" fill="#5a8a3a" stroke="none" />
			{:else}
				<path d="M0,0 L-2,-5 L-1,-3 L0,-7 L1,-4 L2,-6 L1,0" fill="#4a7a2a" stroke="none" />
			{/if}
		</g>
	{/each}
</g>
