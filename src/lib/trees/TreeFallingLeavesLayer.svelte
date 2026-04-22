<script lang="ts">
	import {
		OVERLAY_DEFINITIONS,
		OVERLAY_PARTICLE_TYPES,
	} from '$lib/trees/overlays/overlay_definitions.js';
	import {
		FALLING_LEAF_STATES,
		FALLING_LEAF_CONFIG,
		type FallingLeaf,
	} from '$lib/trees/animation.js';

	const LeafSvg = OVERLAY_DEFINITIONS[OVERLAY_PARTICLE_TYPES.leaf].svgComponent;

	interface Props {
		fallingLeaves: readonly FallingLeaf[];
	}

	let { fallingLeaves }: Props = $props();
</script>

{#if fallingLeaves.length > 0}
	<g class="falling-leaves">
		{#each fallingLeaves as leaf (leaf.id)}
			<g
				class="falling-leaf"
				class:falling-leaf-landed={leaf.state === FALLING_LEAF_STATES.landed}
				class:falling-leaf-fading={leaf.state === FALLING_LEAF_STATES.fading}
				style="--leaf-start-x: {leaf.x}px; --leaf-start-y: {leaf.y}px; --leaf-land-y: {leaf.landedY}px; --leaf-land-x: {leaf.x +
					leaf.scatterX}px; --leaf-duration: {leaf.fallDuration}s; --leaf-rotation: {leaf.rotation}deg; --leaf-fade-duration: {FALLING_LEAF_CONFIG.fadeDurationMs}ms;"
			>
				<g transform="scale(2)"><LeafSvg color={leaf.color} /></g>
			</g>
		{/each}
	</g>
{/if}

<style>
	@keyframes leaf-fall {
		0% {
			transform: translate(var(--leaf-start-x), var(--leaf-start-y)) rotate(0deg);
			opacity: 0.85;
		}

		50% {
			opacity: 0.7;
		}

		100% {
			transform: translate(var(--leaf-land-x), var(--leaf-land-y))
				rotate(var(--leaf-rotation));
			opacity: 0.85;
		}
	}

	.falling-leaf {
		animation: leaf-fall var(--leaf-duration) ease-in forwards;
		will-change: transform, opacity;
	}

	.falling-leaf.falling-leaf-landed {
		transform: translate(var(--leaf-land-x), var(--leaf-land-y)) rotate(var(--leaf-rotation));
		opacity: 0.85;
		animation: none;
	}

	.falling-leaf.falling-leaf-fading {
		transform: translate(var(--leaf-land-x), var(--leaf-land-y)) rotate(var(--leaf-rotation));
		opacity: 0;
		animation: none;
		transition: opacity var(--leaf-fade-duration) ease-out;
	}
</style>
