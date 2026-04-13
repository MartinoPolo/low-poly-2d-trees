<script lang="ts">
	import { generateTree } from '$lib/trees/generate.js';
	import {
		DEFAULT_TREE_CONFIG,
		TREE_STAGES,
		type TreeConfig,
		type TreeAnchors,
	} from '$lib/trees/types.js';
	import {
		computeAnimationDelay,
		computeBranchDuration,
		computeBranchDelay,
	} from '$lib/trees/animation.js';
	import TreeTool from '$lib/trees/TreeTool.svelte';
	import {
		TOOL_TYPES,
		TOOL_ANCHOR_MAP,
		type ToolVisibility,
	} from '$lib/trees/tools/tool_types.js';

	interface Props {
		config?: TreeConfig;
		showCanopy?: boolean;
		showBranches?: boolean;
		showTrunk?: boolean;
		showFruit?: boolean;
		showAnchors?: boolean;
		animateCanopySway?: boolean;
		animateBranches?: boolean;
		animateGrowth?: boolean;
		toolVisibility?: ToolVisibility;
		animateTools?: boolean;
		class?: string;
		onanchors?: (anchors: TreeAnchors) => void;
	}

	let {
		config = DEFAULT_TREE_CONFIG,
		showCanopy = true,
		showBranches = true,
		showTrunk = true,
		showFruit = true,
		showAnchors = false,
		animateCanopySway = false,
		animateBranches = false,
		animateGrowth = false,
		toolVisibility,
		animateTools = false,
		class: className = '',
		onanchors,
	}: Props = $props();

	const geometry = $derived(generateTree(config));
	const hasGlow = $derived(config.stage === TREE_STAGES.ready);

	const canopySwayDelay = $derived(computeAnimationDelay(config.seed));

	const branchDurations = $derived(
		geometry.branchGroups.map((_, i) => computeBranchDuration(config.seed, i)),
	);

	const branchDelays = $derived(
		geometry.branchGroups.map((_, i) => computeBranchDelay(config.seed, i)),
	);

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
	<g
		class="tree-root"
		class:animate-growth={animateGrowth}
		style="--growth-origin-x: {geometry.anchors.trunkBase.x}px; --growth-origin-y: {geometry
			.anchors.trunkBase.y}px;"
	>
		{#if showTrunk}
			<g class="trunk">
				<!-- Quad-based trunk (BR-1: stacked trapezoids) -->
				{#each geometry.trunkQuads as quad (quad)}
					<polygon
						points="{quad.points[0].x},{quad.points[0].y} {quad.points[1].x},{quad
							.points[1].y} {quad.points[2].x},{quad.points[2].y} {quad.points[3]
							.x},{quad.points[3].y}"
						fill={quad.color}
						stroke={quad.color}
						stroke-width="0.5"
					/>
				{/each}
				<!-- Legacy triangles for simple stages (seed, sprouting, stump) -->
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
				{#each geometry.branchGroups as group, groupIndex (group)}
					<g
						class="branch-group"
						class:animate-branch-sway={animateBranches}
						style="--branch-duration: {branchDurations[
							groupIndex
						]}s; --branch-delay: {branchDelays[groupIndex]}s; --branch-origin-x: {group
							.origin.x}px; --branch-origin-y: {group.origin.y}px;"
					>
						{#each group.quads as quad (quad)}
							<polygon
								points="{quad.points[0].x},{quad.points[0].y} {quad.points[1]
									.x},{quad.points[1].y} {quad.points[2].x},{quad.points[2]
									.y} {quad.points[3].x},{quad.points[3].y}"
								fill={quad.color}
								stroke={quad.color}
								stroke-width="0.5"
							/>
						{/each}
						{#each group.junctionFills as fill (fill)}
							<polygon
								points="{fill.points[0].x},{fill.points[0].y} {fill.points[1]
									.x},{fill.points[1].y} {fill.points[2].x},{fill.points[2]
									.y} {fill.points[3].x},{fill.points[3].y}"
								fill={fill.color}
								stroke={fill.color}
								stroke-width="0.5"
							/>
						{/each}
					</g>
				{/each}
			</g>
		{/if}

		{#if showCanopy}
			<g class="canopy">
				{#each geometry.canopyBlobs as blob, blobIndex (blob)}
					<g
						class="canopy-blob"
						class:animate-canopy-sway={animateCanopySway}
						style="--sway-delay: {canopySwayDelay +
							blobIndex * 0.15}s; --sway-origin-x: {blob.center
							.x}px; --sway-origin-y: {blob.center.y}px;"
					>
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

		{#if showFruit}
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

		{#if toolVisibility}
			<g class="tools-group">
				{#each Object.values(TOOL_TYPES) as toolType (toolType)}
					{#if toolVisibility[toolType].visible}
						<TreeTool
							tool={toolType}
							anchor={geometry.anchors[TOOL_ANCHOR_MAP[toolType]]}
							size={toolVisibility[toolType].size}
							animate={animateTools}
						/>
					{/if}
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
	</g>
</svg>

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

	@keyframes branch-sway {
		0%,
		100% {
			transform: rotate(0deg);
		}

		50% {
			transform: rotate(3deg);
		}
	}

	@keyframes tree-growth {
		0% {
			transform: scale(0.05);
		}

		100% {
			transform: scale(1);
		}
	}

	.canopy-blob.animate-canopy-sway {
		animation: canopy-sway 2.5s ease-in-out infinite;
		animation-delay: var(--sway-delay);
		transform-origin: var(--sway-origin-x) var(--sway-origin-y);
		will-change: transform;
	}

	.branch-group.animate-branch-sway {
		animation: branch-sway var(--branch-duration) ease-in-out infinite;
		animation-delay: var(--branch-delay);
		transform-origin: var(--branch-origin-x) var(--branch-origin-y);
		will-change: transform;
	}

	.tree-root.animate-growth {
		animation: tree-growth 2s ease-in-out infinite alternate;
		transform-origin: var(--growth-origin-x) var(--growth-origin-y);
		will-change: transform;
	}
</style>
