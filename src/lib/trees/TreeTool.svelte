<script lang="ts">
	import type { Point2D } from '$lib/trees/types/core.js';
	import { TOOL_DEFINITIONS, type ToolDefinition } from '$lib/trees/tools/tool_definitions.js';
	import { TOOL_ANIMATIONS } from '$lib/trees/tools/tool_animations.js';
	import { TOOL_TYPES, type ToolType } from '$lib/trees/tools/tool_types.js';

	interface Props {
		tool: ToolType;
		anchor: Point2D;
		size: number;
		animate: boolean;
		reviewerCount?: number;
		snapOffsetOverride?: { x: number; y: number };
	}

	let { tool, anchor, size, animate, reviewerCount = 0, snapOffsetOverride }: Props = $props();

	const definition: ToolDefinition = $derived(TOOL_DEFINITIONS[tool]);
	const animationConfig = $derived(TOOL_ANIMATIONS[tool]);
	const snapOffset = $derived(snapOffsetOverride ?? definition.snapOffset);

	const posX = $derived(anchor.x - snapOffset.x * size);
	const posY = $derived(anchor.y - snapOffset.y * size);

	const SvgComponent = $derived(definition.svgComponent);

	const showBadge = $derived(tool === TOOL_TYPES.woodpecker && reviewerCount > 0);
</script>

<!-- Outer <g> for positioning (translate + scale) — not animated -->
<g data-tool={tool} transform="translate({posX}, {posY}) scale({size})">
	<!-- Inner <g> for CSS animation — pivots around configured pivot point -->
	<g
		class="tool-anim"
		class:animate-tool={animate}
		data-tool-type={tool}
		style="--tool-duration: {animationConfig.duration}s; --pivot-x: {animationConfig.pivotPoint
			.x}px; --pivot-y: {animationConfig.pivotPoint.y}px;"
	>
		<SvgComponent />
	</g>

	<!-- Woodpecker review badge -->
	{#if showBadge}
		<g class="woodpecker-badge" transform="translate({snapOffset.x + 10}, {snapOffset.y - 22})">
			<circle r="7" fill="#ef4444" stroke="white" stroke-width="1" />
			<text
				text-anchor="middle"
				dominant-baseline="central"
				fill="white"
				font-size="9"
				font-weight="bold">{reviewerCount}</text
			>
		</g>
	{/if}
</g>

<style>
	@keyframes tool-shovel-idle {
		0%,
		100% {
			transform: rotate(0deg);
		}

		50% {
			transform: rotate(-15deg);
		}
	}

	@keyframes tool-watering-can-idle {
		0%,
		100% {
			transform: rotate(0deg);
		}

		20% {
			transform: rotate(5deg);
		}

		50% {
			transform: rotate(20deg);
		}

		70% {
			transform: rotate(15deg);
		}

		85% {
			transform: rotate(8deg);
		}
	}

	@keyframes tool-ladder-idle {
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

	@keyframes tool-axe-idle {
		0%,
		100% {
			transform: rotate(0deg);
		}

		30% {
			transform: rotate(25deg);
		}

		60% {
			transform: rotate(-5deg);
		}
	}

	@keyframes tool-rake-idle {
		0%,
		100% {
			transform: translateX(0);
		}

		25% {
			transform: translateX(-4px);
		}

		75% {
			transform: translateX(4px);
		}
	}

	@keyframes tool-woodpecker-idle {
		0%,
		100% {
			transform: rotate(0deg);
		}

		15% {
			transform: rotate(3deg) translateX(2px);
		}

		30% {
			transform: rotate(-1deg) translateX(-1px);
		}

		45% {
			transform: rotate(3deg) translateX(2px);
		}

		60% {
			transform: rotate(-1deg) translateX(-1px);
		}

		75% {
			transform: rotate(0deg);
		}
	}

	@keyframes tool-grill-idle {
		0%,
		100% {
			transform: rotate(0deg);
		}

		50% {
			transform: rotate(0.5deg);
		}
	}

	.tool-anim.animate-tool {
		transform-origin: var(--pivot-x) var(--pivot-y);
		will-change: transform;
	}

	.tool-anim.animate-tool[data-tool-type='shovel'] {
		animation: tool-shovel-idle var(--tool-duration) ease-in-out infinite;
	}

	.tool-anim.animate-tool[data-tool-type='wateringCan'] {
		animation: tool-watering-can-idle var(--tool-duration) ease-in-out infinite;
	}

	.tool-anim.animate-tool[data-tool-type='ladder'] {
		animation: tool-ladder-idle var(--tool-duration) ease-in-out infinite;
	}

	.tool-anim.animate-tool[data-tool-type='axe'] {
		animation: tool-axe-idle var(--tool-duration) ease-in-out infinite;
	}

	.tool-anim.animate-tool[data-tool-type='rake'] {
		animation: tool-rake-idle var(--tool-duration) ease-in-out infinite;
	}

	.tool-anim.animate-tool[data-tool-type='woodpecker'] {
		animation: tool-woodpecker-idle var(--tool-duration) ease-in-out infinite;
	}

	.tool-anim.animate-tool[data-tool-type='grill'] {
		animation: tool-grill-idle var(--tool-duration) ease-in-out infinite;
	}

	.woodpecker-badge text {
		user-select: none;
		pointer-events: none;
	}
</style>
