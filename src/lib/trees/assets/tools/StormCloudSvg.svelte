<!--
	Storm Cloud SVG — overlapping ellipses with rain animation.
	Local (0,0) is at cloud bottom-center (where rain falls from), cloud body above.
	Rain animation gated by .animate-tool CSS class (same pattern as FlameSvg).
-->
<script lang="ts">
	import { generateRainLines } from '$lib/trees/overlays/overlay_generators.js';

	const rainLines = generateRainLines(42, 12, 120);
</script>

<g class="storm-cloud">
	<!-- Cloud body: overlapping ellipses -->
	<g>
		<ellipse cx="0" cy="-36" rx="40" ry="24" fill="#4a4a5a" />
		<ellipse cx="-28" cy="-28" rx="28" ry="20" fill="#3a3a4a" />
		<ellipse cx="28" cy="-28" rx="28" ry="20" fill="#3a3a4a" />
		<ellipse cx="0" cy="-20" rx="48" ry="16" fill="#4a4a5a" />
	</g>

	<!-- Rain lines -->
	<g class="storm-rain">
		{#each rainLines as line, i (i)}
			<line
				x1={line.x - 60}
				y1={line.y}
				x2={line.x - 61}
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
			transform: translateY(50px);
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
