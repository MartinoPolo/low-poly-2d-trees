<script lang="ts">
	import { generateTree } from '$lib/trees/generate.js';
	import { DEFAULT_TREE_CONFIG, type TreeConfig, type TreeAnchors } from '$lib/trees/types.js';

	interface Props {
		shape?: TreeConfig['shape'];
		seed?: number;
		canopyPolygons?: number;
		trunkPolygons?: number;
		canopyLightColor?: string;
		canopyDarkColor?: string;
		trunkHue?: number;
		trunkSaturation?: number;
		trunkLightness?: number;
		lightAngle?: number;
		blobCount?: number;
		branchCount?: number;
		depthVariance?: number;
		blobSizeVariance?: number;
		blobCloseness?: number;
		trunkThickness?: number;
		branchThickness?: number;
		canopySize?: number;
		trunkHeight?: number;
		trunkBranchRatio?: number;
		trunkLean?: number;
		trunkSegments?: number;
		trunkCrookedness?: number;
		branchLength?: number;
		branchLengthVariance?: number;
		showCanopy?: boolean;
		showBranches?: boolean;
		showTrunk?: boolean;
		showAnchors?: boolean;
		class?: string;
		onanchors?: (anchors: TreeAnchors) => void;
	}

	let {
		shape = DEFAULT_TREE_CONFIG.shape,
		seed = DEFAULT_TREE_CONFIG.seed,
		canopyPolygons = DEFAULT_TREE_CONFIG.canopyPolygons,
		trunkPolygons = DEFAULT_TREE_CONFIG.trunkPolygons,
		canopyLightColor = DEFAULT_TREE_CONFIG.canopyLightColor,
		canopyDarkColor = DEFAULT_TREE_CONFIG.canopyDarkColor,
		trunkHue = DEFAULT_TREE_CONFIG.trunkHue,
		trunkSaturation = DEFAULT_TREE_CONFIG.trunkSaturation,
		trunkLightness = DEFAULT_TREE_CONFIG.trunkLightness,
		lightAngle = DEFAULT_TREE_CONFIG.lightAngle,
		blobCount = DEFAULT_TREE_CONFIG.blobCount,
		branchCount = DEFAULT_TREE_CONFIG.branchCount,
		depthVariance = DEFAULT_TREE_CONFIG.depthVariance,
		blobSizeVariance = DEFAULT_TREE_CONFIG.blobSizeVariance,
		blobCloseness = DEFAULT_TREE_CONFIG.blobCloseness,
		trunkThickness = DEFAULT_TREE_CONFIG.trunkThickness,
		branchThickness = DEFAULT_TREE_CONFIG.branchThickness,
		canopySize = DEFAULT_TREE_CONFIG.canopySize,
		trunkHeight = DEFAULT_TREE_CONFIG.trunkHeight,
		trunkBranchRatio = DEFAULT_TREE_CONFIG.trunkBranchRatio,
		trunkLean = DEFAULT_TREE_CONFIG.trunkLean,
		trunkSegments = DEFAULT_TREE_CONFIG.trunkSegments,
		trunkCrookedness = DEFAULT_TREE_CONFIG.trunkCrookedness,
		branchLength = DEFAULT_TREE_CONFIG.branchLength,
		branchLengthVariance = DEFAULT_TREE_CONFIG.branchLengthVariance,
		showCanopy = true,
		showBranches = true,
		showTrunk = true,
		showAnchors = false,
		class: className = '',
		onanchors,
	}: Props = $props();

	const config = $derived<TreeConfig>({
		shape,
		seed,
		canopyPolygons,
		trunkPolygons,
		canopyLightColor,
		canopyDarkColor,
		trunkHue,
		trunkSaturation,
		trunkLightness,
		lightAngle,
		blobCount,
		branchCount,
		depthVariance,
		blobSizeVariance,
		blobCloseness,
		trunkThickness,
		branchThickness,
		canopySize,
		trunkHeight,
		trunkBranchRatio,
		trunkLean,
		trunkSegments,
		trunkCrookedness,
		branchLength,
		branchLengthVariance,
	});

	const geometry = $derived(generateTree(config));

	$effect(() => {
		onanchors?.(geometry.anchors);
	});
</script>

<svg
	viewBox="0 0 {geometry.viewBox.width} {geometry.viewBox.height}"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
>
	{#if showTrunk}
		<g class="trunk">
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
	{/if}

	{#if showBranches}
		<g class="branches">
			{#each geometry.branchTriangles as tri (tri)}
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

	{#if showCanopy}
		<g class="canopy">
			{#each geometry.canopyBlobs as blob (blob)}
				<g>
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

	{#if showAnchors}
		<g class="anchors-group">
			<circle
				cx={geometry.anchors.trunkBottom.x}
				cy={geometry.anchors.trunkBottom.y}
				r="4"
				fill="#ef4444"
				stroke="white"
				stroke-width="1"
			/>
			<circle
				cx={geometry.anchors.trunkMiddle.x}
				cy={geometry.anchors.trunkMiddle.y}
				r="4"
				fill="#f97316"
				stroke="white"
				stroke-width="1"
			/>
			<circle
				cx={geometry.anchors.trunkTop.x}
				cy={geometry.anchors.trunkTop.y}
				r="4"
				fill="#eab308"
				stroke="white"
				stroke-width="1"
			/>
			<circle
				cx={geometry.anchors.canopyCenter.x}
				cy={geometry.anchors.canopyCenter.y}
				r="4"
				fill="#22c55e"
				stroke="white"
				stroke-width="1"
			/>
		</g>
	{/if}
</svg>
