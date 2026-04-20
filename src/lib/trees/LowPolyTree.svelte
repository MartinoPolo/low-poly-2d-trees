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
		computeGrowthScales,
		GROWTH_DURATION_SECONDS,
		createFallingLeaf,
		advanceFallingLeaves,
		FALLING_LEAF_STATES,
		FALLING_LEAF_CONFIG,
		type FallingLeaf,
	} from '$lib/trees/animation.js';
	import { GROUND_LINE_Y } from '$lib/trees/stages/constants.js';
	import TreeTool from '$lib/trees/TreeTool.svelte';
	import {
		TOOL_TYPES,
		TOOL_ANCHOR_MAP,
		type ToolVisibility,
	} from '$lib/trees/tools/tool_types.js';
	import { FRUIT_SVG_COMPONENTS } from '$lib/trees/shapes/fruit_geometry.js';
	import { FLOWER_SVG_COMPONENTS } from '$lib/trees/shapes/flower_geometry.js';
	import { SvelteMap } from 'svelte/reactivity';
	import TreeOverlay from '$lib/trees/overlays/TreeOverlay.svelte';
	import GlowEffect from '$lib/trees/overlays/GlowEffect.svelte';
	import WiltingEffect from '$lib/trees/overlays/WiltingEffect.svelte';
	import GroundElements from '$lib/trees/ground/GroundElements.svelte';
	import { SeedSvg, SproutingSvg, StumpSvg } from '$lib/trees/assets/stages/index.js';
	import LeafSvg from '$lib/trees/assets/overlays/LeafSvg.svelte';
	import {
		OVERLAY_DEFAULTS,
		OVERLAY_VIEWBOX_HEADROOM,
		needsViewboxExpansion,
		type OverlayConfig,
	} from '$lib/trees/overlays/overlay_types.js';

	const FRUIT_RENDER_SCALE = 2;

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
		reviewerCount?: number;
		overlayConfig?: OverlayConfig;
		groundElements?: boolean;
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
		reviewerCount = 0,
		overlayConfig = OVERLAY_DEFAULTS,
		groundElements = false,
		class: className = '',
		onanchors,
	}: Props = $props();

	const geometry = $derived(generateTree(config));
	const hasReadyGlow = $derived(config.stage === TREE_STAGES.ready);
	const hasOverlayGlow = $derived(overlayConfig.glow.enabled);

	const stageSvgComponent = $derived(
		config.stage === TREE_STAGES.seed
			? SeedSvg
			: config.stage === TREE_STAGES.sprouting
				? SproutingSvg
				: config.stage === TREE_STAGES.stump
					? StumpSvg
					: null,
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

	let fallingLeaves = $state<FallingLeaf[]>([]);
	let leafIdCounter = 0;

	$effect(() => {
		if (!geometry.showFallingLeaves) {
			fallingLeaves = [];
			leafIdCounter = 0;
			return;
		}

		const canopyBottom = computeCanopyBottomY(geometry.canopyBlobs);
		const crownCenter = geometry.anchors.crownCenter;
		const seed = config.seed;

		const interval = setInterval(() => {
			const now = Date.now();
			let updated = advanceFallingLeaves(fallingLeaves, now);

			if (updated.length < FALLING_LEAF_CONFIG.maxLeaves) {
				const newLeaf = createFallingLeaf(
					leafIdCounter,
					crownCenter,
					canopyBottom,
					GROUND_LINE_Y,
					seed,
					now,
				);
				updated = [...updated, newLeaf];
				leafIdCounter++;
			}

			fallingLeaves = updated;
		}, FALLING_LEAF_CONFIG.spawnIntervalMs);

		return () => clearInterval(interval);
	});

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
	filter={hasOverlayGlow ? `url(#${glowFilterId})` : undefined}
>
	<GlowEffect config={overlayConfig.glow} filterId={glowFilterId} />
	{#if showViewBox}
		<rect
			x="0"
			y="0"
			width={geometry.viewBox.width}
			height={geometry.viewBox.height}
			fill="none"
			stroke="red"
			stroke-width="2"
			stroke-dasharray="8 4"
			opacity="0.5"
		/>
		<line
			x1={geometry.viewBox.width / 2}
			y1="0"
			x2={geometry.viewBox.width / 2}
			y2={geometry.viewBox.height}
			stroke="red"
			stroke-width="1"
			stroke-dasharray="4 4"
			opacity="0.3"
		/>
		<line
			x1="0"
			y1={geometry.viewBox.height * 0.95}
			x2={geometry.viewBox.width}
			y2={geometry.viewBox.height * 0.95}
			stroke="green"
			stroke-width="1"
			stroke-dasharray="4 4"
			opacity="0.5"
		/>
	{/if}
	<g class="tree-root">
		{#snippet branchGroupSnippet(branchGroup: BranchGeometry, branchIndex: number)}
			<g
				class="branch-group"
				class:animate-branch-sway={animateBranches}
				class:animate-branch-growth={shouldAnimateGrowth}
				style="--branch-duration: {branchDurations[
					branchIndex
				]}s; --branch-delay: {branchDelays[branchIndex]}s; --branch-origin-x: {branchGroup
					.origin.x}px; --branch-origin-y: {branchGroup.origin
					.y}px; --growth-min-scale: {growthScales.minScale}; --growth-max-scale: {growthScales.maxScale}; --growth-duration: {GROWTH_DURATION_SECONDS}s;"
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
				class:animate-canopy-pulse={shouldAnimateGrowth}
				style="--sway-delay: {canopySwayDelay + blobIndex * 0.15}s; --sway-origin-x: {blob
					.center.x}px; --sway-origin-y: {blob.center
					.y}px; --canopy-min-scale: {growthScales.canopyMinScale}; --canopy-max-scale: {growthScales.canopyMaxScale}; --growth-duration: {GROWTH_DURATION_SECONDS}s;"
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
				{#if stageSvgComponent}
					{@const StageSvg = stageSvgComponent}
					<g
						transform="translate({geometry.anchors.trunkBase.x},{geometry.anchors
							.trunkBase.y})"
					>
						<StageSvg />
					</g>
				{:else}
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
							points="{tri.points[0].x},{tri.points[0].y} {tri.points[1].x},{tri
								.points[1].y} {tri.points[2].x},{tri.points[2].y}"
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
		{#if showCanopy && !stageSvgComponent && backCanopyBlobs.length > 0}
			<WiltingEffect enabled={overlayConfig.wilting.enabled}>
				<g class="back-canopy">
					{#each backCanopyBlobs as { blob, index: blobIndex } (blob)}
						{@render canopyBlobSnippet(blob, blobIndex)}
					{/each}
				</g>
			</WiltingEffect>
		{/if}

		<!-- Layer 5: Front canopy blobs -->
		{#if showCanopy && !stageSvgComponent}
			<WiltingEffect enabled={overlayConfig.wilting.enabled}>
				<g class="canopy">
					{#each frontCanopyBlobs as { blob, index: blobIndex } (blob)}
						{@render canopyBlobSnippet(blob, blobIndex)}
					{/each}
				</g>
			</WiltingEffect>
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
				{#each fallingLeaves as leaf (leaf.id)}
					<g
						class="falling-leaf"
						class:falling-leaf-landed={leaf.state === FALLING_LEAF_STATES.landed}
						class:falling-leaf-fading={leaf.state === FALLING_LEAF_STATES.fading}
						style="--leaf-start-x: {leaf.x}px; --leaf-start-y: {leaf.y}px; --leaf-land-y: {leaf.landedY}px; --leaf-land-x: {leaf.x +
							leaf.scatterX}px; --leaf-duration: {leaf.fallDuration}s; --leaf-rotation: {leaf.rotation}deg; --leaf-fade-duration: {FALLING_LEAF_CONFIG.fadeDurationMs}ms;"
					>
						<LeafSvg color={leaf.color} />
					</g>
				{/each}
			</g>
		{/if}

		{#if groundElements}
			<GroundElements seed={config.seed} trunkBase={geometry.anchors.trunkBase} />
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

		<TreeOverlay
			config={overlayConfig}
			anchors={geometry.anchors}
			seed={config.seed}
			treeWidth={geometry.viewBox.width}
		/>

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

		{#if showEnvelope && geometry.canopyEnvelope}
			<g class="envelope-debug">
				<ellipse
					cx={geometry.canopyEnvelope.centerX}
					cy={geometry.canopyEnvelope.centerY}
					rx={geometry.canopyEnvelope.radiusX}
					ry={geometry.canopyEnvelope.radiusY}
					fill="none"
					stroke="#ef4444"
					stroke-width="1"
					stroke-dasharray="4 3"
					opacity="0.7"
				/>
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

	@keyframes branch-growth-oscillation {
		0%,
		100% {
			transform: scale(var(--growth-min-scale));
		}

		50% {
			transform: scale(var(--growth-max-scale));
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

	@keyframes leaf-fall {
		0% {
			transform: translate(var(--leaf-start-x), var(--leaf-start-y)) rotate(0deg);
			opacity: 0.85;
		}

		50% {
			opacity: 0.7;
		}

		100% {
			transform: translate(var(--leaf-land-x), var(--leaf-land-y))
				rotate(var(--leaf-rotation));
			opacity: 0.85;
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

	.branch-group.animate-branch-growth {
		animation: branch-growth-oscillation var(--growth-duration) ease-in-out infinite;
		animation-delay: 0s;
		transform-origin: var(--branch-origin-x) var(--branch-origin-y);
		will-change: transform;
	}

	.canopy-blob.animate-canopy-pulse {
		animation: canopy-pulse var(--growth-duration) ease-in-out infinite;
		animation-delay: 0s;
		transform-origin: var(--sway-origin-x) var(--sway-origin-y);
		will-change: transform;
	}

	.falling-leaf {
		animation: leaf-fall var(--leaf-duration) ease-in forwards;
		will-change: transform, opacity;
	}

	.falling-leaf.falling-leaf-landed {
		transform: translate(var(--leaf-land-x), var(--leaf-land-y)) rotate(var(--leaf-rotation));
		opacity: 0.85;
		animation: none;
	}

	.falling-leaf.falling-leaf-fading {
		transform: translate(var(--leaf-land-x), var(--leaf-land-y)) rotate(var(--leaf-rotation));
		opacity: 0;
		animation: none;
		transition: opacity var(--leaf-fade-duration) ease-out;
	}
</style>
