<!--
	Storm Cloud SVG — overlapping ellipses with rain animation.
	Local (0,0) is at cloud bottom-center (where rain falls from), cloud body above.
	Rain animation gated by .animate-tool CSS class (same pattern as FlameSvg).
-->
<script lang="ts">
	import { generateRainLines } from '$lib/trees/overlays/overlay_generators.js';

	const rainLines = generateRainLines(42, 12, 60);
</script>

<g class="storm-cloud">
	<!-- Cloud body: overlapping ellipses -->
	<g>
		<ellipse cx="0" cy="-18" rx="20" ry="12" fill="#4a4a5a" />
		<ellipse cx="-14" cy="-14" rx="14" ry="10" fill="#3a3a4a" />
		<ellipse cx="14" cy="-14" rx="14" ry="10" fill="#3a3a4a" />
		<ellipse cx="0" cy="-10" rx="24" ry="8" fill="#4a4a5a" />
	</g>

	<!-- Rain lines -->
	<g class="storm-rain">
		{#each rainLines as line, i (i)}
			<line
				x1={line.x - 30}
				y1={line.y}
				x2={line.x - 31}
				y2={line.y + line.length}
				stroke="#7a8aaa"
				stroke-width="0.8"
				opacity="0.6"
				class="rain-drop"
				style="--rain-delay: {line.delay}s; --rain-speed: {line.speed}s;"
			/>
		{/each}
	</g>
</g>

<style>
	@keyframes rain-fall {
		0% {
			transform: translateY(0);
			opacity: 0.6;
		}

		100% {
			transform: translateY(25px);
			opacity: 0;
		}
	}

	.rain-drop {
		display: none;
	}

	:global(.animate-tool) .rain-drop {
		display: block;
		animation: rain-fall var(--rain-speed) linear infinite;
		animation-delay: var(--rain-delay);
	}
</style>
