<script lang="ts">
	import { generateTree } from '$lib/trees/generate.js';
	import {
		DEFAULT_TREE_CONFIG,
		TREE_STAGES,
		type TreeConfig,
		type TreeAnchors,
	} from '$lib/trees/types.js';

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
	const hasGlow = $derived(config.stage === TREE_STAGES.ready);

	$effect(() => {
		onanchors?.(geometry.anchors);
	});
</script>

<svg
	viewBox="0 0 {geometry.viewBox.width} {geometry.viewBox.height}"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
	style={hasGlow ? 'filter: drop-shadow(0 0 8px gold)' : undefined}
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

	{#if geometry.stakeTriangles.length > 0}
		<g class="stakes">
			{#each geometry.stakeTriangles as tri (tri)}
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

	{#if geometry.fruitSlots.length > 0}
		<g class="fruit">
			{#each geometry.fruitSlots as slot (slot)}
				<circle
					cx={slot.x}
					cy={slot.y}
					r="4"
					fill="#E74C3C"
					stroke="#C0392B"
					stroke-width="0.5"
				/>
			{/each}
		</g>
	{/if}

	{#if showAnchors}
		<g class="anchors-group">
			<circle
				cx={geometry.anchors.trunkBase.x}
				cy={geometry.anchors.trunkBase.y}
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
				cx={geometry.anchors.crownCenter.x}
				cy={geometry.anchors.crownCenter.y}
				r="4"
				fill="#22c55e"
				stroke="white"
				stroke-width="1"
			/>
			<circle
				cx={geometry.anchors.crownTop.x}
				cy={geometry.anchors.crownTop.y}
				r="4"
				fill="#06b6d4"
				stroke="white"
				stroke-width="1"
			/>
			<circle
				cx={geometry.anchors.roots.x}
				cy={geometry.anchors.roots.y}
				r="4"
				fill="#a855f7"
				stroke="white"
				stroke-width="1"
			/>
			{#each geometry.anchors.branchTips as tip (tip)}
				<circle
					cx={tip.x}
					cy={tip.y}
					r="3"
					fill="#f43f5e"
					stroke="white"
					stroke-width="0.5"
				/>
			{/each}
			{#each geometry.anchors.fruitSlots as slot (slot)}
				<circle
					cx={slot.x}
					cy={slot.y}
					r="3"
					fill="#10b981"
					stroke="white"
					stroke-width="0.5"
				/>
			{/each}
		</g>
	{/if}
</svg>
