<script lang="ts">
	import { GROWTH_DURATION_SECONDS } from '$lib/trees/animation.js';
	import type { IndexedCanopyBlob } from '$lib/trees/tree_z_ordering.js';

	interface Props {
		backCanopyBlobs: readonly IndexedCanopyBlob[];
		frontCanopyBlobs: readonly IndexedCanopyBlob[];
		animateCanopySway: boolean;
		shouldAnimateGrowth: boolean;
		canopySwayDelay: number;
		growthScales: { canopyMinScale: number; canopyMaxScale: number };
		showSnow: boolean;
		snowAboveCanopy: boolean;
	}

	let {
		backCanopyBlobs,
		frontCanopyBlobs,
		animateCanopySway,
		shouldAnimateGrowth,
		canopySwayDelay,
		growthScales,
		showSnow,
		snowAboveCanopy,
	}: Props = $props();
</script>

{#snippet canopyBlobSnippet(
	blob: IndexedCanopyBlob['blob'],
	blobIndex: number,
	includeSnow: boolean,
)}
	<g
		class="canopy-blob"
		class:animate-canopy-sway={animateCanopySway}
		class:animate-canopy-pulse={shouldAnimateGrowth}
		style="--sway-delay: {canopySwayDelay + blobIndex * 0.15}s; --sway-origin-x: {blob.center
			.x}px; --sway-origin-y: {blob.center
			.y}px; --canopy-min-scale: {growthScales.canopyMinScale}; --canopy-max-scale: {growthScales.canopyMaxScale}; --growth-duration: {GROWTH_DURATION_SECONDS}s;"
	>
		{#each blob.triangles as tri (tri)}
			<polygon
				points="{tri.points[0].x},{tri.points[0].y} {tri.points[1].x},{tri.points[1].y} {tri
					.points[2].x},{tri.points[2].y}"
				fill={tri.color}
				stroke={tri.color}
				stroke-width="0.5"
			/>
		{/each}
		{#if includeSnow && blob.snowCap}
			{#each blob.snowCap.triangles as snowTri (snowTri)}
				<polygon
					points="{snowTri.points[0].x},{snowTri.points[0].y} {snowTri.points[1]
						.x},{snowTri.points[1].y} {snowTri.points[2].x},{snowTri.points[2].y}"
					fill={snowTri.color}
					stroke={snowTri.color}
					stroke-width="0.5"
				/>
			{/each}
		{/if}
	</g>
{/snippet}

{#snippet snowBlobSnippet(blob: IndexedCanopyBlob['blob'])}
	{#if blob.snowCap}
		{#each blob.snowCap.triangles as snowTri (snowTri)}
			<polygon
				points="{snowTri.points[0].x},{snowTri.points[0].y} {snowTri.points[1].x},{snowTri
					.points[1].y} {snowTri.points[2].x},{snowTri.points[2].y}"
				fill={snowTri.color}
				stroke={snowTri.color}
				stroke-width="0.5"
			/>
		{/each}
	{/if}
{/snippet}

{#if backCanopyBlobs.length > 0}
	<g class="back-canopy">
		{#each backCanopyBlobs as { blob, index: blobIndex } (blob)}
			{@render canopyBlobSnippet(blob, blobIndex, showSnow && !snowAboveCanopy)}
		{/each}
	</g>
	{#if showSnow && snowAboveCanopy}
		<g class="back-snow">
			{#each backCanopyBlobs as { blob } (blob)}
				{@render snowBlobSnippet(blob)}
			{/each}
		</g>
	{/if}
{/if}

<g class="canopy">
	{#each frontCanopyBlobs as { blob, index: blobIndex } (blob)}
		{@render canopyBlobSnippet(blob, blobIndex, showSnow && !snowAboveCanopy)}
	{/each}
</g>
{#if showSnow && snowAboveCanopy}
	<g class="front-snow">
		{#each frontCanopyBlobs as { blob } (blob)}
			{@render snowBlobSnippet(blob)}
		{/each}
	</g>
{/if}

<style>
	@keyframes canopy-sway {
		0%,
		100% {
			transform: rotate(0deg);
		}

		25% {
			transform: rotate(2.5deg);
		}

		75% {
			transform: rotate(-2.5deg);
		}
	}

	@keyframes canopy-pulse {
		0%,
		100% {
			transform: scale(var(--canopy-min-scale));
		}

		50% {
			transform: scale(var(--canopy-max-scale));
		}
	}

	.canopy-blob.animate-canopy-sway {
		animation: canopy-sway 2.5s ease-in-out infinite;
		animation-delay: var(--sway-delay);
		transform-origin: var(--sway-origin-x) var(--sway-origin-y);
		will-change: transform;
	}

	.canopy-blob.animate-canopy-pulse {
		animation: canopy-pulse var(--growth-duration) ease-in-out infinite;
		animation-delay: 0s;
		transform-origin: var(--sway-origin-x) var(--sway-origin-y);
		will-change: transform;
	}
</style>
