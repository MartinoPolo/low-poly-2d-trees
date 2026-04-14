<script lang="ts">
	import { generatePottedPlant } from '$lib/trees/potted_plant_generator.js';
	import {
		DEFAULT_POTTED_PLANT_CONFIG,
		POTTED_PLANT_STAGES,
		type PottedPlantConfig,
		type PottedPlantStage,
	} from '$lib/trees/types.js';

	interface Props {
		stage?: PottedPlantStage;
		seed?: number;
		canopyLightColor?: string;
		canopyDarkColor?: string;
		class?: string;
	}

	let {
		stage = DEFAULT_POTTED_PLANT_CONFIG.stage,
		seed = DEFAULT_POTTED_PLANT_CONFIG.seed,
		canopyLightColor,
		canopyDarkColor,
		class: className = '',
	}: Props = $props();

	const config = $derived<PottedPlantConfig>({
		stage,
		seed,
		canopyLightColor,
		canopyDarkColor,
	});

	const geometry = $derived(generatePottedPlant(config));
	const isDried = $derived(stage === POTTED_PLANT_STAGES.dried);
</script>

<svg
	viewBox="0 0 {geometry.viewBox.width} {geometry.viewBox.height}"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
>
	<g class="potted-plant-root">
		<!-- Pot + stem (trunk triangles) -->
		<g class="pot-and-stem">
			{#each geometry.trunkTriangles as tri (tri)}
				<polygon
					points="{tri.points[0].x},{tri.points[0].y} {tri.points[1].x},{tri.points[1]
						.y} {tri.points[2].x},{tri.points[2].y}"
					fill={tri.color}
					stroke={tri.color}
					stroke-width="0.5"
				/>
			{/each}
		</g>

		<!-- Canopy blobs -->
		{#if geometry.canopyBlobs.length > 0}
			<g class="canopy" class:dried-canopy={isDried}>
				{#each geometry.canopyBlobs as blob (blob)}
					<g class="canopy-blob">
						{#each blob.triangles as tri (tri)}
							<polygon
								points="{tri.points[0].x},{tri.points[0].y} {tri.points[1].x},{tri
									.points[1].y} {tri.points[2].x},{tri.points[2].y}"
								fill={tri.color}
								stroke={tri.color}
								stroke-width="0.5"
							/>
						{/each}
					</g>
				{/each}
			</g>
		{/if}

		<!-- Fruit (flowers) -->
		{#if geometry.fruitTriangles.length > 0}
			<g class="fruit">
				{#each geometry.fruitTriangles as tri (tri)}
					<polygon
						points="{tri.points[0].x},{tri.points[0].y} {tri.points[1].x},{tri.points[1]
							.y} {tri.points[2].x},{tri.points[2].y}"
						fill={tri.color}
						stroke={tri.color}
						stroke-width="0.5"
					/>
				{/each}
			</g>
		{/if}
	</g>
</svg>

<style>
	.dried-canopy {
		transform: skewY(3deg);
		transform-origin: center bottom;
	}
</style>
