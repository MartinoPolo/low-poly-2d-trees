<script lang="ts">
	import { generateSnowflakes } from '../environment_generators.js';
	import {
		ENVIRONMENT_SEEDS,
		ENVIRONMENT_VIEW_HEIGHT,
		ENVIRONMENT_VIEW_WIDTH,
	} from '../environment_config.js';
	import SnowflakeSvg from '$lib/trees/assets/overlays/SnowflakeSvg.svelte';

	const flakes = generateSnowflakes(
		40,
		ENVIRONMENT_SEEDS.snow,
		ENVIRONMENT_VIEW_WIDTH,
		ENVIRONMENT_VIEW_HEIGHT,
	);
</script>

<svg
	data-testid="snow-overlay"
	class="snow-container"
	viewBox="0 0 {ENVIRONMENT_VIEW_WIDTH} {ENVIRONMENT_VIEW_HEIGHT}"
	preserveAspectRatio="none"
	xmlns="http://www.w3.org/2000/svg"
>
	{#each flakes as flake, index (index)}
		<g transform="translate({flake.x}, {flake.y})">
			<g
				data-testid="snow-particle"
				class="snow-flake"
				style="animation-delay: {flake.delay}s; animation-duration: {flake.speed}s; --drift: {flake.drift}px;"
			>
				<SnowflakeSvg size={flake.size} />
			</g>
		</g>
	{/each}
</svg>

<style>
	.snow-container {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.snow-flake {
		animation: snow-fall linear infinite;
		will-change: transform;
	}

	@keyframes snow-fall {
		0% {
			transform: translateY(-20px) translateX(0);
			opacity: 0.9;
		}

		100% {
			transform: translateY(620px) translateX(var(--drift, 10px));
			opacity: 0.3;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.snow-flake {
			animation: none;
		}
	}
</style>
