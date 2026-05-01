<script lang="ts">
	import { generatePottedPlant } from '$lib/trees/potted_plant_generator.js';
	import {
		DEFAULT_POTTED_PLANT_CONFIG,
		POTTED_PLANT_STAGES,
		type PottedPlantConfig,
		type PottedPlantStage,
	} from '$lib/trees/types.js';
	import GlowEffect from '$lib/trees/overlays/GlowEffect.svelte';
	import { OVERLAY_DEFAULTS, type OverlayConfig } from '$lib/trees/overlays/overlay_types.js';

	interface Props {
		stage?: PottedPlantStage;
		seed?: number;
		canopyLightColor?: string;
		canopyDarkColor?: string;
		overlayConfig?: OverlayConfig;
		class?: string;
	}

	let {
		stage = DEFAULT_POTTED_PLANT_CONFIG.stage,
		seed = DEFAULT_POTTED_PLANT_CONFIG.seed,
		canopyLightColor,
		canopyDarkColor,
		overlayConfig = OVERLAY_DEFAULTS,
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
	const hasOverlayGlow = $derived(overlayConfig.glow.enabled);
	const glowFilterId = $derived(`potted-glow-${seed}`);
</script>

<svg
	viewBox="0 0 {geometry.viewBox.width} {geometry.viewBox.height}"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
>
	<GlowEffect config={overlayConfig.glow} filterId={glowFilterId} />

	<g class="potted-plant-root">
		{#snippet plantContent()}
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
									points="{tri.points[0].x},{tri.points[0].y} {tri.points[1]
										.x},{tri.points[1].y} {tri.points[2].x},{tri.points[2].y}"
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
							points="{tri.points[0].x},{tri.points[0].y} {tri.points[1].x},{tri
								.points[1].y} {tri.points[2].x},{tri.points[2].y}"
							fill={tri.color}
							stroke={tri.color}
							stroke-width="0.5"
						/>
					{/each}
				</g>
			{/if}
		{/snippet}

		{#if hasOverlayGlow}
			<g filter="url(#{glowFilterId})" class:glow-pulse={overlayConfig.glow.pulse}>
				{@render plantContent()}
			</g>
		{:else}
			{@render plantContent()}
		{/if}
	</g>
</svg>

<style>
	@keyframes glow-pulse {
		0%,
		100% {
			opacity: 1;
		}

		50% {
			opacity: 0.1;
		}
	}

	.glow-pulse {
		animation: glow-pulse 2s ease-in-out infinite;
	}

	.dried-canopy {
		transform: skewY(3deg);
		transform-origin: center bottom;
	}
</style>
