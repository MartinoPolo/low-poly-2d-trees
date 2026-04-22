<script lang="ts">
	import { GROWTH_DURATION_SECONDS } from '$lib/trees/animation.js';
	import type { BranchGeometry } from '$lib/trees/types/core.js';
	import type { IndexedBranchGroup } from '$lib/trees/tree_z_ordering.js';

	interface Props {
		rootBranches: readonly IndexedBranchGroup[];
		childBranchesByParent: ReadonlyMap<number, IndexedBranchGroup[]>;
		branchDurations: readonly number[];
		branchDelays: readonly number[];
		growthScales: { minScale: number; maxScale: number };
		animateBranches: boolean;
		shouldAnimateGrowth: boolean;
	}

	let {
		rootBranches,
		childBranchesByParent,
		branchDurations,
		branchDelays,
		growthScales,
		animateBranches,
		shouldAnimateGrowth,
	}: Props = $props();
</script>

{#snippet branchGroupSnippet(branchGroup: BranchGeometry, branchIndex: number)}
	<g
		class="branch-group"
		class:animate-branch-sway={animateBranches}
		class:animate-branch-growth={shouldAnimateGrowth}
		style="--branch-duration: {branchDurations[branchIndex]}s; --branch-delay: {branchDelays[
			branchIndex
		]}s; --branch-origin-x: {branchGroup.origin.x}px; --branch-origin-y: {branchGroup.origin
			.y}px; --growth-min-scale: {growthScales.minScale}; --growth-max-scale: {growthScales.maxScale}; --growth-duration: {GROWTH_DURATION_SECONDS}s;"
	>
		{#each branchGroup.quads as quad (quad)}
			<polygon
				points="{quad.points[0].x},{quad.points[0].y} {quad.points[1].x},{quad.points[1]
					.y} {quad.points[2].x},{quad.points[2].y} {quad.points[3].x},{quad.points[3].y}"
				fill={quad.color}
				stroke={quad.color}
				stroke-width="0.5"
			/>
		{/each}
		{#each branchGroup.junctionFills as fill (fill)}
			<polygon
				points="{fill.points[0].x},{fill.points[0].y} {fill.points[1].x},{fill.points[1]
					.y} {fill.points[2].x},{fill.points[2].y} {fill.points[3].x},{fill.points[3].y}"
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

{#each rootBranches as { group, index: groupIndex } (groupIndex)}
	{@render branchGroupSnippet(group, groupIndex)}
{/each}

<style>
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
</style>
