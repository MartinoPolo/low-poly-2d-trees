<script lang="ts">
	import { SeedSvg, SproutingSvg, StumpSvg } from '$lib/trees/assets/stages/index.js';
	import { TREE_STAGES } from '$lib/trees/types.js';
	import type { TreeGeometry } from '$lib/trees/types/core.js';
	import type { TreeStage } from '$lib/trees/types.js';

	interface Props {
		geometry: TreeGeometry;
		stage: TreeStage;
	}

	let { geometry, stage }: Props = $props();

	const stageSvgComponent = $derived(
		stage === TREE_STAGES.seed
			? SeedSvg
			: stage === TREE_STAGES.sprouting
				? SproutingSvg
				: stage === TREE_STAGES.stump
					? StumpSvg
					: null,
	);
</script>

<g class="trunk">
	{#if stageSvgComponent}
		{@const StageSvg = stageSvgComponent}
		<g transform="translate({geometry.anchors.trunkBase.x},{geometry.anchors.trunkBase.y})">
			<StageSvg />
		</g>
	{:else}
		{#each geometry.trunkQuads as quad (quad)}
			<polygon
				points="{quad.points[0].x},{quad.points[0].y} {quad.points[1].x},{quad.points[1]
					.y} {quad.points[2].x},{quad.points[2].y} {quad.points[3].x},{quad.points[3].y}"
				fill={quad.color}
				stroke={quad.color}
				stroke-width="0.5"
			/>
		{/each}
		{#each geometry.trunkTriangles as tri (tri)}
			<polygon
				points="{tri.points[0].x},{tri.points[0].y} {tri.points[1].x},{tri.points[1].y} {tri
					.points[2].x},{tri.points[2].y}"
				fill={tri.color}
				stroke={tri.color}
				stroke-width="0.5"
			/>
		{/each}
		{#each geometry.birchStripes as stripe (stripe)}
			<rect
				x={stripe.centerX - stripe.width / 2}
				y={stripe.y - stripe.height / 2}
				width={stripe.width}
				height={stripe.height}
				fill={stripe.color}
			/>
		{/each}
	{/if}
</g>
