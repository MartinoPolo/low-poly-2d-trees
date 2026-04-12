<script lang="ts">
	import { generateTree } from '$lib/trees/generate.js';
	import { DEFAULT_TREE_CONFIG, type TreeConfig, type TreeAnchors } from '$lib/trees/types.js';

	interface Props {
		config?: TreeConfig;
		showCanopy?: boolean;
		showBranches?: boolean;
		showTrunk?: boolean;
		showAnchors?: boolean;
		class?: string;
		onanchors?: (anchors: TreeAnchors) => void;
	}

	let {
		config = DEFAULT_TREE_CONFIG,
		showCanopy = true,
		showBranches = true,
		showTrunk = true,
		showAnchors = false,
		class: className = '',
		onanchors,
	}: Props = $props();

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
