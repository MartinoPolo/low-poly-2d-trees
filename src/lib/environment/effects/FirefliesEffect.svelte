<script lang="ts">
	import { generateFireflyPositions } from '../environment_generators.js';
	import {
		ENVIRONMENT_SEEDS,
		ENVIRONMENT_VIEW_HEIGHT,
		ENVIRONMENT_VIEW_WIDTH,
	} from '../environment_config.js';
	import FireflySvg from '$lib/trees/assets/overlays/FireflySvg.svelte';

	const fireflies = generateFireflyPositions(
		20,
		ENVIRONMENT_SEEDS.fireflies,
		ENVIRONMENT_VIEW_WIDTH,
		ENVIRONMENT_VIEW_HEIGHT,
	);
</script>

<svg
	data-testid="fireflies-overlay"
	class="fireflies-container"
	viewBox="0 0 {ENVIRONMENT_VIEW_WIDTH} {ENVIRONMENT_VIEW_HEIGHT}"
	preserveAspectRatio="none"
	xmlns="http://www.w3.org/2000/svg"
>
	<defs>
		<filter id="firefly-glow">
			<feGaussianBlur stdDeviation="3" result="blur" />
			<feMerge>
				<feMergeNode in="blur" />
				<feMergeNode in="SourceGraphic" />
			</feMerge>
		</filter>
	</defs>
	{#each fireflies as ff, index (index)}
		<g transform="translate({ff.x}, {ff.y})">
			<g
				data-testid="firefly"
				class="firefly"
				style="animation-delay: {ff.delay}s; animation-duration: {ff.duration}s;"
			>
				<FireflySvg />
			</g>
		</g>
	{/each}
</svg>

<style>
	.fireflies-container {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.firefly {
		animation: firefly-pulse ease-in-out infinite alternate;
		will-change: transform;
	}

	@keyframes firefly-pulse {
		0% {
			opacity: 0.2;
			transform: scale(0.8) translate(0, 0);
		}

		50% {
			opacity: 1;
			transform: scale(1.2) translate(5px, -3px);
		}

		100% {
			opacity: 0.3;
			transform: scale(0.9) translate(-4px, 2px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.firefly {
			animation: none;
			opacity: 0.6;
		}
	}
</style>
