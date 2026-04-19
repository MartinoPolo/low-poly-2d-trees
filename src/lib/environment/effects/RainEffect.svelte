<script lang="ts">
	import { generateRainDrops } from '../environment_generators.js';
	import {
		ENVIRONMENT_SEEDS,
		ENVIRONMENT_VIEW_HEIGHT,
		ENVIRONMENT_VIEW_WIDTH,
	} from '../environment_config.js';
	import RaindropSvg from '$lib/trees/assets/overlays/RaindropSvg.svelte';

	interface Props {
		intensity: number;
	}

	const { intensity }: Props = $props();

	const drops = $derived(
		generateRainDrops(
			intensity,
			ENVIRONMENT_SEEDS.rain,
			ENVIRONMENT_VIEW_WIDTH,
			ENVIRONMENT_VIEW_HEIGHT,
		),
	);
</script>

<svg
	data-testid="rain-overlay"
	class="rain-container"
	viewBox="0 0 {ENVIRONMENT_VIEW_WIDTH} {ENVIRONMENT_VIEW_HEIGHT}"
	preserveAspectRatio="none"
	xmlns="http://www.w3.org/2000/svg"
>
	{#each drops as drop, index (index)}
		<g transform="translate({drop.x}, {drop.y})">
			<g
				data-testid="rain-drop"
				class="rain-drop"
				style="animation-delay: {drop.delay}s; animation-duration: {drop.speed}s;"
			>
				<RaindropSvg length={drop.length} />
			</g>
		</g>
	{/each}
</svg>

<style>
	.rain-container {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.rain-drop {
		animation: rain-fall linear infinite;
		will-change: transform;
	}

	@keyframes rain-fall {
		0% {
			transform: translateY(-20px) translateX(-5px);
			opacity: 1;
		}

		100% {
			transform: translateY(620px) translateX(15px);
			opacity: 0.3;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rain-drop {
			animation: none;
		}
	}
</style>
