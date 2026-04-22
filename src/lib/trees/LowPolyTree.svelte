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
	} from '$lib/trees/types.js';
	import {
		computeAnimationDelay,
		computeBranchDuration,
		computeBranchDelay,
		computeGrowthScales,
	} from '$lib/trees/animation.js';
	import { FRUIT_SVG_COMPONENTS } from '$lib/trees/shapes/fruit_geometry.js';
	import { FLOWER_SVG_COMPONENTS } from '$lib/trees/shapes/flower_geometry.js';
	import TreeOverlay from '$lib/trees/overlays/TreeOverlay.svelte';
	import GlowEffect from '$lib/trees/overlays/GlowEffect.svelte';
	import GroundElements from '$lib/trees/ground/GroundElements.svelte';
	import TreeTool from '$lib/trees/TreeTool.svelte';
	import {
		TOOL_TYPES,
		TOOL_ANCHOR_MAP,
		type ToolVisibility,
	} from '$lib/trees/tools/tool_types.js';
	import {
		OVERLAY_DEFAULTS,
		OVERLAY_VIEWBOX_HEADROOM,
		needsViewboxExpansion,
		type OverlayConfig,
	} from '$lib/trees/overlays/overlay_types.js';
	import {
		splitRootBranchesByZOrder,
		splitCanopyBlobsByZOrder,
		type IndexedBranchGroup,
	} from '$lib/trees/tree_z_ordering.js';
	import { SvelteMap } from 'svelte/reactivity';
	import { createFallingLeavesState } from '$lib/trees/tree_falling_leaves_state.svelte.js';
	import TreeTrunkLayer from '$lib/trees/TreeTrunkLayer.svelte';
	import TreeBranchLayer from '$lib/trees/TreeBranchLayer.svelte';
	import TreeCanopyLayer from '$lib/trees/TreeCanopyLayer.svelte';
	import TreeFruitAndFlowerLayer from '$lib/trees/TreeFruitAndFlowerLayer.svelte';
	import TreeFallingLeavesLayer from '$lib/trees/TreeFallingLeavesLayer.svelte';
	import TreeDebugOverlays from '$lib/trees/TreeDebugOverlays.svelte';

	interface Props {
		config?: TreeConfig;
		showCanopy?: boolean;
		showBranches?: boolean;
		showTrunk?: boolean;
		showFruit?: boolean;
		showAnchors?: boolean;
		showEnvelope?: boolean;
		showViewBox?: boolean;
		animateCanopySway?: boolean;
		animateBranches?: boolean;
		animateGrowth?: boolean;
		growthVariance?: number;
		toolVisibility?: ToolVisibility;
		animateTools?: boolean;
		overlayConfig?: OverlayConfig;
		groundElements?: boolean;
		groundElementCount?: number;
		groundElementSize?: number;
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
		showEnvelope = false,
		showViewBox = false,
		animateCanopySway = false,
		animateBranches = false,
		animateGrowth = false,
		growthVariance = 50,
		toolVisibility,
		animateTools = false,
		overlayConfig = OVERLAY_DEFAULTS,
		groundElements = false,
		groundElementCount,
		groundElementSize,
		class: className = '',
		onanchors,
	}: Props = $props();

	const geometry = $derived(generateTree(config));
	const hasReadyGlow = $derived(config.stage === TREE_STAGES.ready);
	const hasOverlayGlow = $derived(overlayConfig.glow.enabled);

	const isStageSvgStage = $derived(
		config.stage === TREE_STAGES.seed ||
			config.stage === TREE_STAGES.sprouting ||
			config.stage === TREE_STAGES.stump,
	);

	const growthScales = $derived(computeGrowthScales(growthVariance));
	const shouldAnimateGrowth = $derived(animateGrowth && growthVariance > 0);

	const glowFilterId = $derived(`glow-${config.seed}`);
	const expandViewbox = $derived(needsViewboxExpansion(overlayConfig));
	const viewBoxY = $derived(expandViewbox ? -OVERLAY_VIEWBOX_HEADROOM : 0);
	const viewBoxHeight = $derived(
		geometry.viewBox.height + (expandViewbox ? OVERLAY_VIEWBOX_HEADROOM : 0),
	);

	const canopySwayDelay = $derived(computeAnimationDelay(config.seed));

	const branchDurations = $derived.by(() => {
		const count = geometry.branchGroups.length;
		const seed = config.seed;
		return Array.from({ length: count }, (_, i) => computeBranchDuration(seed, i));
	});

	const branchDelays = $derived.by(() => {
		const count = geometry.branchGroups.length;
		const seed = config.seed;
		return Array.from({ length: count }, (_, i) => computeBranchDelay(seed, i));
	});

	const rootBranches = $derived(
		geometry.branchGroups
			.map((group, index) => ({ group, index }))
			.filter(({ group }) => group.parentIndex === null),
	);

	const childBranchesByParent = $derived.by(() => {
		const map = new SvelteMap<number, IndexedBranchGroup[]>();
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

	const { backRootBranches, frontRootBranches } = $derived(
		splitRootBranchesByZOrder(rootBranches, hasZOrdering),
	);

	const { backCanopyBlobs, frontCanopyBlobs } = $derived(
		splitCanopyBlobsByZOrder(geometry.canopyBlobs, hasZOrdering),
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

	const fallingLeavesState = createFallingLeavesState(() => ({
		showFallingLeaves: geometry.showFallingLeaves,
		crownCenter: geometry.anchors.crownCenter,
		canopyBlobs: geometry.canopyBlobs,
		seed: config.seed,
	}));

	$effect(() => {
		onanchors?.(geometry.anchors);
	});
</script>

<svg
	viewBox="0 {viewBoxY} {geometry.viewBox.width} {viewBoxHeight}"
	xmlns="http://www.w3.org/2000/svg"
	overflow="hidden"
	class={className}
	style={hasReadyGlow && !hasOverlayGlow ? 'filter: drop-shadow(0 0 8px gold)' : undefined}
>
	<GlowEffect config={overlayConfig.glow} filterId={glowFilterId} />

	<g class="tree-root">
		<TreeDebugOverlays {geometry} {showViewBox} {showAnchors} {showEnvelope} />

		{#snippet treeBodyContent()}
			<!-- REQ-EV2-Z-04: 5-layer rendering for branching shapes -->
			<!-- Layer 1: Back branches (behind trunk) -->
			{#if showBranches && backRootBranches.length > 0}
				<g class="back-branches">
					<TreeBranchLayer
						rootBranches={backRootBranches}
						{childBranchesByParent}
						{branchDurations}
						{branchDelays}
						{growthScales}
						{animateBranches}
						{shouldAnimateGrowth}
					/>
				</g>
			{/if}

			<!-- Layer 2: Trunk -->
			{#if showTrunk}
				<TreeTrunkLayer {geometry} stage={config.stage} />
			{/if}

			<!-- Layer 3: Front branches -->
			{#if showBranches}
				<g class="branches">
					<TreeBranchLayer
						rootBranches={frontRootBranches}
						{childBranchesByParent}
						{branchDurations}
						{branchDelays}
						{growthScales}
						{animateBranches}
						{shouldAnimateGrowth}
					/>
				</g>
			{/if}

			<!-- Layer 4 + 5: Canopy blobs (back then front) -->
			{#if showCanopy && !isStageSvgStage}
				<TreeCanopyLayer
					{backCanopyBlobs}
					{frontCanopyBlobs}
					wiltingEnabled={overlayConfig.wilting.enabled}
					{animateCanopySway}
					{shouldAnimateGrowth}
					{canopySwayDelay}
					{growthScales}
				/>
			{/if}

			<TreeFruitAndFlowerLayer {geometry} {showFruit} {fruitComponent} {flowerComponent} />

			<TreeFallingLeavesLayer fallingLeaves={fallingLeavesState.leaves} />
		{/snippet}

		{#if hasOverlayGlow}
			<g filter="url(#{glowFilterId})" class:glow-pulse={overlayConfig.glow.pulse}>
				{@render treeBodyContent()}
			</g>
		{:else}
			{@render treeBodyContent()}
		{/if}

		{#if groundElements}
			<GroundElements
				seed={config.seed}
				trunkBase={geometry.anchors.trunkBase}
				count={groundElementCount}
				sizeMultiplier={groundElementSize}
			/>
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

		<TreeOverlay
			config={overlayConfig}
			anchors={geometry.anchors}
			seed={config.seed}
			treeWidth={geometry.viewBox.width}
		/>
	</g>
</svg>

<style>
	@keyframes glow-pulse {
		0%,
		100% {
			opacity: 1;
		}

		50% {
			opacity: 0.1;
		}
	}

	.glow-pulse {
		animation: glow-pulse 2s ease-in-out infinite;
	}
</style>
