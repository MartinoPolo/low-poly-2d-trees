<script lang="ts">
	import type { Point2D } from '$lib/trees/types/core.js';
	import { generateStormCloudTriangles, generateRainLines } from './overlay_generators.js';
	import type { StormCloudConfig } from './overlay_types.js';

	interface Props {
		anchor: Point2D;
		config: StormCloudConfig;
		seed: number;
		treeWidth: number;
	}

	let { anchor, config, seed, treeWidth }: Props = $props();

	const cloudWidth = $derived(Math.min(treeWidth * 0.6, 80));
	const cloudGeometry = $derived(generateStormCloudTriangles(seed, cloudWidth));
	const rainLines = $derived(
		config.showRain ? generateRainLines(seed + 1000, 12, cloudWidth) : [],
	);

	const offsetX = $derived(anchor.x - cloudWidth / 2);
	const offsetY = $derived(anchor.y - cloudGeometry.height - 20);
</script>

<g class="storm-cloud-group" transform="translate({offsetX}, {offsetY})">
	<g class="storm-cloud-bob">
		{#each cloudGeometry.triangles as tri (tri.points)}
			<polygon points={tri.points} fill={tri.color} stroke={tri.color} stroke-width="0.3" />
		{/each}
	</g>

	{#if rainLines.length > 0}
		<g class="storm-rain" transform="translate(0, {cloudGeometry.height})">
			{#each rainLines as line, i (i)}
				<line
					x1={line.x}
					y1={line.y}
					x2={line.x - 1}
					y2={line.y + line.length}
					stroke="#7a8aaa"
					stroke-width="0.8"
					opacity="0.6"
					class="rain-drop"
					style="--rain-delay: {line.delay}s; --rain-speed: {line.speed}s;"
				/>
			{/each}
		</g>
	{/if}
</g>

<style>
	@keyframes cloud-bob {
		0%,
		100% {
			transform: translateY(0);
		}

		50% {
			transform: translateY(-2px);
		}
	}

	@keyframes rain-fall {
		0% {
			transform: translateY(0);
			opacity: 0.6;
		}

		100% {
			transform: translateY(25px);
			opacity: 0;
		}
	}

	.storm-cloud-bob {
		animation: cloud-bob 2s ease-in-out infinite;
	}

	.rain-drop {
		animation: rain-fall var(--rain-speed) linear infinite;
		animation-delay: var(--rain-delay);
	}
</style>
