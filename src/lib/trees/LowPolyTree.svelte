<script lang="ts">
	import { generateTree } from '$lib/trees/generate.js';
	import {
		DEFAULT_TREE_CONFIG,
		TREE_STAGES,
		TREE_SHAPES,
		FRUIT_TYPES,
		type TreeConfig,
		type TreeAnchors,
		type TreeShape,
		type BranchGeometry,
	} from '$lib/trees/types.js';
	import { Z_ORDER_LAYERS } from '$lib/trees/types/core.js';
	import {
		computeAnimationDelay,
		computeBranchDuration,
		computeBranchDelay,
		computeCanopyBottomY,
	} from '$lib/trees/animation.js';
	import TreeTool from '$lib/trees/TreeTool.svelte';
	import {
		TOOL_TYPES,
		TOOL_ANCHOR_MAP,
		type ToolVisibility,
	} from '$lib/trees/tools/tool_types.js';
	import { FRUIT_SVG_COMPONENTS } from '$lib/trees/shapes/fruit_geometry.js';
	import { FLOWER_SVG_COMPONENTS } from '$lib/trees/shapes/flower_geometry.js';
	import { createPrng, randomInRange } from '$lib/trees/prng.js';
	import { SvelteMap } from 'svelte/reactivity';

	const FRUIT_RENDER_SCALE = 2;

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
		growthProgress?: number;
		toolVisibility?: ToolVisibility;
		animateTools?: boolean;
		reviewerCount?: number;
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
		growthProgress = 1,
		toolVisibility,
		animateTools = false,
		reviewerCount = 0,
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

	const rootBranches = $derived(
		geometry.branchGroups
			.map((group, index) => ({ group, index }))
			.filter(({ group }) => group.parentIndex === null),
	);

	const childBranchesByParent = $derived.by(() => {
		const map = new SvelteMap<number, { group: BranchGeometry; index: number }[]>();
		for (let i = 0; i < geometry.branchGroups.length; i++) {
			const group = geometry.branchGroups[i]!;
			if (group.parentIndex !== null) {
				const children = map.get(group.parentIndex) ?? [];
				children.push({ group, index: i });
				map.set(group.parentIndex, children);
			}
		}
		return map;
	});

	// REQ-EV2-Z-04: Does this tree have 5-layer z-ordering?
	const hasZOrdering = $derived(geometry.branchGroups.some((g) => g.zOrder !== undefined));

	// Split root branches into back/front for 5-layer rendering
	const backRootBranches = $derived(
		hasZOrdering
			? rootBranches.filter(({ group }) => group.zOrder === Z_ORDER_LAYERS.backBranches)
			: [],
	);
	const frontRootBranches = $derived(
		hasZOrdering
			? rootBranches.filter(({ group }) => group.zOrder === Z_ORDER_LAYERS.frontBranches)
			: rootBranches,
	);

	// Split canopy blobs into back/front for 5-layer rendering
	const backCanopyBlobs = $derived(
		hasZOrdering
			? geometry.canopyBlobs
					.map((blob, i) => ({ blob, index: i }))
					.filter(({ blob }) => blob.zOrder === Z_ORDER_LAYERS.backCanopy)
			: [],
	);
	const frontCanopyBlobs = $derived(
		hasZOrdering
			? geometry.canopyBlobs
					.map((blob, i) => ({ blob, index: i }))
					.filter(
						({ blob }) =>
							blob.zOrder === Z_ORDER_LAYERS.frontCanopy || blob.zOrder === undefined,
					)
			: geometry.canopyBlobs.map((blob, i) => ({ blob, index: i })),
	);

	const fruitComponent = $derived(
		config.fruitType !== FRUIT_TYPES.none ? FRUIT_SVG_COMPONENTS[config.fruitType] : null,
	);

	const flowerComponent = $derived.by(() => {
		if (config.shape === TREE_SHAPES.custom || geometry.flowerSlots.length === 0) {
			return null;
		}
		return FLOWER_SVG_COMPONENTS[config.shape as Exclude<TreeShape, 'custom'>];
	});

	/** Falling leaf particle data for autumn stage. */
	const fallingLeaves = $derived.by(() => {
		if (!geometry.showFallingLeaves) {
			return [];
		}
		const rng = createPrng(config.seed + 99999);
		const count = 8;
		const leaves: {
			x: number;
			y: number;
			delay: number;
			duration: number;
			rotation: number;
			color: string;
		}[] = [];
		const bounds = geometry.anchors;
		const minX = bounds.crownCenter.x - 30;
		const maxX = bounds.crownCenter.x + 30;
		const startY = computeCanopyBottomY(geometry.canopyBlobs);
		const colors = ['#E8A028', '#C47020', '#8B2010', '#A05020', '#D08030'];
		for (let i = 0; i < count; i++) {
			leaves.push({
				x: randomInRange(rng, minX, maxX),
				y: startY + randomInRange(rng, -5, 15),
				delay: randomInRange(rng, 0, 4),
				duration: randomInRange(rng, 2, 4),
				rotation: randomInRange(rng, -180, 180),
				color: colors[Math.floor(rng() * colors.length)]!,
			});
		}
		return leaves;
	});

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
			.anchors.trunkBase.y}px; --growth-progress: {growthProgress};"
	>
		{#snippet branchGroupSnippet(branchGroup: BranchGeometry, branchIndex: number)}
			<g
				class="branch-group"
				class:animate-branch-sway={animateBranches}
				style="--branch-duration: {branchDurations[
					branchIndex
				]}s; --branch-delay: {branchDelays[branchIndex]}s; --branch-origin-x: {branchGroup
					.origin.x}px; --branch-origin-y: {branchGroup.origin.y}px;"
			>
				{#each branchGroup.quads as quad (quad)}
					<polygon
						points="{quad.points[0].x},{quad.points[0].y} {quad.points[1].x},{quad
							.points[1].y} {quad.points[2].x},{quad.points[2].y} {quad.points[3]
							.x},{quad.points[3].y}"
						fill={quad.color}
						stroke={quad.color}
						stroke-width="0.5"
					/>
				{/each}
				{#each branchGroup.junctionFills as fill (fill)}
					<polygon
						points="{fill.points[0].x},{fill.points[0].y} {fill.points[1].x},{fill
							.points[1].y} {fill.points[2].x},{fill.points[2].y} {fill.points[3]
							.x},{fill.points[3].y}"
						fill={fill.color}
						stroke={fill.color}
						stroke-width="0.5"
					/>
				{/each}
				{#each childBranchesByParent.get(branchIndex) ?? [] as { group: child, index: childIndex } (childIndex)}
					{@render branchGroupSnippet(child, childIndex)}
				{/each}
			</g>
		{/snippet}

		{#snippet canopyBlobSnippet(blob: (typeof geometry.canopyBlobs)[0], blobIndex: number)}
			<g
				class="canopy-blob"
				class:animate-canopy-sway={animateCanopySway}
				style="--sway-delay: {canopySwayDelay + blobIndex * 0.15}s; --sway-origin-x: {blob
					.center.x}px; --sway-origin-y: {blob.center.y}px;"
			>
				{#each blob.triangles as tri (tri)}
					<polygon
						points="{tri.points[0].x},{tri.points[0].y} {tri.points[1].x},{tri.points[1]
							.y} {tri.points[2].x},{tri.points[2].y}"
						fill={tri.color}
						stroke={tri.color}
						stroke-width="0.5"
					/>
				{/each}
			</g>
		{/snippet}

		<!-- REQ-EV2-Z-04: 5-layer rendering for branching shapes -->
		<!-- Layer 1: Back branches (behind trunk) -->
		{#if showBranches && backRootBranches.length > 0}
			<g class="back-branches">
				{#each backRootBranches as { group, index: groupIndex } (groupIndex)}
					{@render branchGroupSnippet(group, groupIndex)}
				{/each}
			</g>
		{/if}

		<!-- Layer 2: Trunk -->
		{#if showTrunk}
			<g class="trunk">
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

		<!-- Layer 3: Front branches -->
		{#if showBranches}
			<g class="branches">
				{#each frontRootBranches as { group, index: groupIndex } (groupIndex)}
					{@render branchGroupSnippet(group, groupIndex)}
				{/each}
			</g>
		{/if}

		<!-- Layer 4: Back canopy blobs -->
		{#if showCanopy && backCanopyBlobs.length > 0}
			<g class="back-canopy">
				{#each backCanopyBlobs as { blob, index: blobIndex } (blob)}
					{@render canopyBlobSnippet(blob, blobIndex)}
				{/each}
			</g>
		{/if}

		<!-- Layer 5: Front canopy blobs -->
		{#if showCanopy}
			<g class="canopy">
				{#each frontCanopyBlobs as { blob, index: blobIndex } (blob)}
					{@render canopyBlobSnippet(blob, blobIndex)}
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

		{#if showFruit && fruitComponent && geometry.fruitSlots.length > 0}
			{@const FruitSvg = fruitComponent}
			<g class="fruit">
				{#each geometry.fruitSlots as slot (slot)}
					<g transform="translate({slot.x},{slot.y}) scale({FRUIT_RENDER_SCALE})">
						<FruitSvg />
					</g>
				{/each}
			</g>
		{/if}

		{#if flowerComponent && geometry.flowerSlots.length > 0}
			{@const FlowerSvg = flowerComponent}
			<g class="flowers">
				{#each geometry.flowerSlots as slot (slot)}
					<g transform="translate({slot.x},{slot.y})">
						<FlowerSvg />
					</g>
				{/each}
			</g>
		{/if}

		{#if fallingLeaves.length > 0}
			<g class="falling-leaves">
				{#each fallingLeaves as leaf, i (i)}
					<g
						class="falling-leaf"
						style="--leaf-start-x: {leaf.x}px; --leaf-start-y: {leaf.y}px; --leaf-delay: {leaf.delay}s; --leaf-duration: {leaf.duration}s; --leaf-rotation: {leaf.rotation}deg;"
					>
						<path d="M0,-2 L1.5,0 L0,2 L-1.5,0 Z" fill={leaf.color} opacity="0.85" />
					</g>
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
							{reviewerCount}
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
			transform: scaleY(0.05) scaleX(1);
		}

		100% {
			transform: scaleY(1) scaleX(1);
		}
	}

	@keyframes leaf-fall {
		0% {
			transform: translate(var(--leaf-start-x), var(--leaf-start-y)) rotate(0deg);
			opacity: 0.85;
		}

		50% {
			opacity: 0.7;
		}

		100% {
			transform: translate(calc(var(--leaf-start-x) + 10px), calc(var(--leaf-start-y) + 60px))
				rotate(var(--leaf-rotation));
			opacity: 0;
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

	.falling-leaf {
		animation: leaf-fall var(--leaf-duration) ease-in-out infinite;
		animation-delay: var(--leaf-delay);
		will-change: transform, opacity;
	}
</style>
