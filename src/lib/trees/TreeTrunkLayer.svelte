<script lang="ts">
	import { STAGE_DEFINITIONS, STAGE_ASSET_TYPES } from '$lib/trees/stages/stage_definitions.js';
	import { TREE_STAGES } from '$lib/trees/types.js';
	import type { TreeGeometry } from '$lib/trees/types/core.js';
	import type { TreeStage } from '$lib/trees/types.js';
	import MushroomSvg from '$lib/trees/assets/decorations/MushroomSvg.svelte';

	const STAGE_TO_ASSET_TYPE: Partial<Record<TreeStage, keyof typeof STAGE_DEFINITIONS>> = {
		[TREE_STAGES.seed]: STAGE_ASSET_TYPES.seed,
		[TREE_STAGES.sprouting]: STAGE_ASSET_TYPES.sprouting,
		[TREE_STAGES.stump]: STAGE_ASSET_TYPES.stump,
	};

	interface Props {
		geometry: TreeGeometry;
		stage: TreeStage;
	}

	let { geometry, stage }: Props = $props();

	const stageDefinition = $derived.by(() => {
		const assetType = STAGE_TO_ASSET_TYPE[stage];
		return assetType ? STAGE_DEFINITIONS[assetType] : null;
	});
</script>

<g class="trunk">
	{#if stageDefinition}
		{@const StageSvg = stageDefinition.svgComponent}
		<g
			transform="translate({geometry.anchors.trunkBase.x +
				stageDefinition.positionOffset.x},{geometry.anchors.trunkBase.y +
				stageDefinition.positionOffset.y}) scale({stageDefinition.scale})"
		>
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
		{#each geometry.trunkMushrooms as mushroom (mushroom)}
			<g
				transform="translate({mushroom.centerX}, {mushroom.y}) scale({mushroom.side ===
				'left'
					? -1
					: 1}, 1) scale({mushroom.scale})"
			>
				<MushroomSvg variant={mushroom.variant} />
			</g>
		{/each}
	{/if}
</g>
