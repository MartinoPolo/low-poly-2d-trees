<script lang="ts">
	import { generateCloudShapes } from '../environment_generators.js';
	import { ENVIRONMENT_SEEDS, ENVIRONMENT_VIEW_WIDTH } from '../environment_config.js';
	import CloudSvg from '$lib/trees/assets/overlays/CloudSvg.svelte';

	const clouds = generateCloudShapes(5, ENVIRONMENT_SEEDS.clouds, ENVIRONMENT_VIEW_WIDTH);
</script>

<svg
	data-testid="clouds-overlay"
	class="clouds-container"
	viewBox="0 0 800 200"
	preserveAspectRatio="xMidYMin slice"
	xmlns="http://www.w3.org/2000/svg"
>
	{#each clouds as cloud, i (i)}
		<g
			data-testid="cloud"
			class="cloud-group"
			style="--x: {cloud.x}px; --y: {cloud.y * 5}px; animation-delay: {i * 2}s;"
		>
			<CloudSvg triangles={cloud.triangles} opacity={cloud.opacity} />
		</g>
	{/each}
</svg>

<style>
	.clouds-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 30%;
	}

	.cloud-group {
		animation: cloud-drift 30s linear infinite;
		will-change: transform;
	}

	@keyframes cloud-drift {
		0% {
			transform: translate(var(--x), var(--y));
		}

		100% {
			transform: translate(calc(var(--x) + 100px), var(--y));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cloud-group {
			animation: none;
			transform: translate(var(--x), var(--y));
		}
	}
</style>
