<script lang="ts">
	import type { Point2D } from '$lib/trees/types/core.js';
	import { TOOL_SVG_DATA } from '$lib/trees/tools/tool_svg_data.js';
	import { TOOL_ANIMATIONS } from '$lib/trees/tools/tool_animations.js';
	import type { ToolType } from '$lib/trees/tools/tool_types.js';

	interface Props {
		tool: ToolType;
		anchor: Point2D;
		size: number;
		animate: boolean;
	}

	let { tool, anchor, size, animate }: Props = $props();

	const svgData = $derived(TOOL_SVG_DATA[tool]);
	const animationConfig = $derived(TOOL_ANIMATIONS[tool]);

	const cssClass = $derived(
		tool === 'wateringCan'
			? 'tool-watering-can'
			: tool === 'birdNest'
				? 'tool-bird-nest'
				: `tool-${tool}`,
	);
</script>

<!-- Outer <g> for positioning (translate + scale) — not animated -->
<g data-tool={tool} transform="translate({anchor.x}, {anchor.y}) scale({size})">
	<!-- Inner <g> for CSS animation — does not affect positioning -->
	<g
		class="tool-anim {cssClass}"
		class:animate-tool={animate}
		style="--tool-duration: {animationConfig.duration}s;"
	>
		{#each svgData.polygons as polygon (polygon)}
			<polygon
				points={polygon.points}
				fill={polygon.fill}
				stroke={polygon.fill}
				stroke-width="0.3"
			/>
		{/each}
	</g>
</g>

<style>
	@keyframes tool-shovel-idle {
		0%,
		100% {
			transform: translateY(0);
		}

		50% {
			transform: translateY(-3px);
		}
	}

	@keyframes tool-ladder-idle {
		0%,
		100% {
			transform: rotate(0deg);
		}

		25% {
			transform: rotate(2deg);
		}

		75% {
			transform: rotate(-2deg);
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
			transform: rotate(12deg);
		}

		70% {
			transform: rotate(15deg);
		}

		85% {
			transform: rotate(8deg);
		}
	}

	@keyframes tool-bird-nest-idle {
		0%,
		100% {
			transform: translateY(0);
		}

		50% {
			transform: translateY(-2px);
		}
	}

	.tool-anim.animate-tool {
		animation: var(--tool-animation-name) var(--tool-duration) ease-in-out infinite;
		will-change: transform;
	}

	.tool-shovel.animate-tool {
		--tool-animation-name: tool-shovel-idle;
	}

	.tool-ladder.animate-tool {
		--tool-animation-name: tool-ladder-idle;
	}

	.tool-watering-can.animate-tool {
		--tool-animation-name: tool-watering-can-idle;
	}

	.tool-bird-nest.animate-tool {
		--tool-animation-name: tool-bird-nest-idle;
	}
</style>
