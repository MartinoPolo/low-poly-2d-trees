<script lang="ts">
	import { generateOakPrdTree } from '$lib/trees/oak_prd_generator.js';
	import { DEFAULT_OAK_PRD_CONFIG, type OakPrdConfig } from '$lib/trees/types.js';

	interface Props {
		completionRatio?: number;
		issueCount?: number;
		seed?: number;
		name?: string;
		class?: string;
	}

	let {
		completionRatio = DEFAULT_OAK_PRD_CONFIG.completionRatio,
		issueCount = DEFAULT_OAK_PRD_CONFIG.issueCount,
		seed = DEFAULT_OAK_PRD_CONFIG.seed,
		name,
		class: className = '',
	}: Props = $props();

	const config = $derived<OakPrdConfig>({
		completionRatio,
		issueCount,
		seed,
		name,
	});

	const geometry = $derived(generateOakPrdTree(config));

	const NAMEPLATE_HEIGHT = 24;
	const NAMEPLATE_PADDING_X = 12;
	const NAMEPLATE_PADDING_Y = 4;
	const NAMEPLATE_RADIUS = 4;
	const NAMEPLATE_FILL = '#8B8B8B';
	const NAMEPLATE_STROKE = '#6B6B6B';
	const NAMEPLATE_FONT_SIZE = 12;
	const NAMEPLATE_CHAR_WIDTH_RATIO = 0.6;
	const NAMEPLATE_OFFSET_Y = 20;
	const NAMEPLATE_EXTRA_HEIGHT = NAMEPLATE_OFFSET_Y + NAMEPLATE_HEIGHT + 10;

	const viewBoxHeight = $derived(
		name !== undefined && name !== ''
			? geometry.viewBox.height + NAMEPLATE_EXTRA_HEIGHT
			: geometry.viewBox.height,
	);
</script>

<svg
	viewBox="0 0 {geometry.viewBox.width} {viewBoxHeight}"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
>
	<g class="oak-tree-root">
		<!-- Trunk quads -->
		<g class="trunk">
			{#each geometry.trunkQuads as quad (quad)}
				<polygon
					points="{quad.points[0].x},{quad.points[0].y} {quad.points[1].x},{quad.points[1]
						.y} {quad.points[2].x},{quad.points[2].y} {quad.points[3].x},{quad.points[3]
						.y}"
					fill={quad.color}
					stroke={quad.color}
					stroke-width="0.5"
				/>
			{/each}
		</g>

		<!-- Branch groups -->
		<g class="branches">
			{#each geometry.branchGroups as group (group)}
				<g class="branch-group">
					{#each group.quads as quad (quad)}
						<polygon
							points="{quad.points[0].x},{quad.points[0].y} {quad.points[1].x},{quad
								.points[1].y} {quad.points[2].x},{quad.points[2].y} {quad.points[3]
								.x},{quad.points[3].y}"
							fill={quad.color}
							stroke={quad.color}
							stroke-width="0.5"
						/>
					{/each}
					{#each group.junctionFills as fill (fill)}
						<polygon
							points="{fill.points[0].x},{fill.points[0].y} {fill.points[1].x},{fill
								.points[1].y} {fill.points[2].x},{fill.points[2].y} {fill.points[3]
								.x},{fill.points[3].y}"
							fill={fill.color}
							stroke={fill.color}
							stroke-width="0.5"
						/>
					{/each}
				</g>
			{/each}
		</g>

		<!-- Canopy blobs (only those with triangles — bare branches have empty blobs) -->
		<g class="canopy">
			{#each geometry.canopyBlobs as blob (blob)}
				{#if blob.triangles.length > 0}
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
				{/if}
			{/each}
		</g>

		<!-- Stone nameplate (oak only, when name is provided) -->
		{#if name !== undefined && name !== ''}
			<g class="nameplate">
				<rect
					x={geometry.viewBox.width / 2 -
						(name.length * NAMEPLATE_FONT_SIZE * NAMEPLATE_CHAR_WIDTH_RATIO) / 2 -
						NAMEPLATE_PADDING_X}
					y={geometry.anchors.trunkBase.y + NAMEPLATE_OFFSET_Y}
					width={name.length * NAMEPLATE_FONT_SIZE * NAMEPLATE_CHAR_WIDTH_RATIO +
						NAMEPLATE_PADDING_X * 2}
					height={NAMEPLATE_HEIGHT}
					rx={NAMEPLATE_RADIUS}
					ry={NAMEPLATE_RADIUS}
					fill={NAMEPLATE_FILL}
					stroke={NAMEPLATE_STROKE}
					stroke-width="1.5"
				/>
				<text
					x={geometry.viewBox.width / 2}
					y={geometry.anchors.trunkBase.y +
						NAMEPLATE_OFFSET_Y +
						NAMEPLATE_HEIGHT / 2 +
						NAMEPLATE_PADDING_Y}
					text-anchor="middle"
					font-size={NAMEPLATE_FONT_SIZE}
					font-family="sans-serif"
					font-weight="600"
					fill="white"
				>
					{name}
				</text>
			</g>
		{/if}
	</g>
</svg>
