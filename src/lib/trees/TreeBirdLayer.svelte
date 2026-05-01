<script lang="ts">
	import type { Point2D } from '$lib/trees/types/core.js';
	import type { BirdConfig } from '$lib/trees/birds/bird_types.js';
	import { BIRD_DEFINITIONS } from '$lib/trees/birds/bird_definitions.js';

	interface Props {
		birds: BirdConfig[];
		branchTips: readonly Point2D[];
		onbirdclick?: (bird: BirdConfig, index: number) => void;
	}

	let { birds, branchTips, onbirdclick }: Props = $props();

	const displayedBirds = $derived(birds.slice(0, Math.min(birds.length, branchTips.length)));
</script>

{#if displayedBirds.length > 0}
	<g class="bird-layer">
		{#each displayedBirds as bird, index (index)}
			{@const tip = branchTips[index]!}
			{@const definition = BIRD_DEFINITIONS[bird.type]}
			{@const isActive = bird.active !== false}
			<g
				transform="translate({tip.x}, {tip.y}) scale({definition.defaultScale})"
				class={isActive ? 'bird-active' : 'bird-inactive'}
				style="cursor: pointer;"
				data-bird-type={bird.type}
				role="button"
				tabindex="0"
				onclick={() => onbirdclick?.(bird, index)}
				onkeydown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						onbirdclick?.(bird, index);
					}
				}}
			>
				{#if bird.label}
					<title>{bird.label}</title>
				{/if}
				<definition.svgComponent />
			</g>
		{/each}
	</g>
{/if}

<style>
	.bird-active {
		opacity: 1;
		transition: opacity 0.3s ease;
		animation: bird-idle 4s ease-in-out infinite;
		transform-origin: center bottom;
	}

	.bird-inactive {
		opacity: 0;
		transition: opacity 1s ease;
		pointer-events: none;
	}

	@keyframes bird-idle {
		0%,
		100% {
			transform: translateY(0);
		}

		50% {
			transform: translateY(-1px);
		}
	}
</style>
