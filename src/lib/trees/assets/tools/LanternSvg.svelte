<!--
	Lantern SVG -- low-poly kerosene lantern with warm glow.
	Local (0,0) is at the top-left; snap point is base bottom-center (~20, 60).
	Glow animation gated by :global(.animate-tool) CSS class.
-->
<script lang="ts">
</script>

<g class="lantern">
	<!-- Glow effect behind glass -->
	<ellipse class="lantern-glow" cx="20" cy="35" rx="22" ry="18" fill="#f5a623" opacity="0.3" />

	<!-- Handle arc -->
	<path
		d="M12,12 Q20,0 28,12"
		fill="none"
		stroke="#3a3a3a"
		stroke-width="2"
		stroke-linecap="round"
	/>

	<!-- Metal top cap -->
	<rect x="14" y="12" width="12" height="4" rx="1" fill="#3a3a3a" />

	<!-- Glass body (hexagonal) -->
	<polygon
		points="14,16 12,28 14,42 26,42 28,28 26,16"
		fill="#f5a623"
		fill-opacity="0.7"
		stroke="#4a4a4a"
		stroke-width="1"
	/>

	<!-- Metal frame lines -->
	<line x1="14" y1="16" x2="14" y2="42" stroke="#4a4a4a" stroke-width="0.5" />
	<line x1="26" y1="16" x2="26" y2="42" stroke="#4a4a4a" stroke-width="0.5" />
	<line x1="12" y1="28" x2="28" y2="28" stroke="#4a4a4a" stroke-width="0.5" />

	<!-- Inner flame (teardrop) -->
	<path d="M20,24 Q22,28 20,34 Q18,28 20,24 Z" fill="#ff6b00" />

	<!-- Base trapezoid -->
	<polygon points="12,42 10,50 30,50 28,42" fill="#3a3a3a" />
</g>

<style>
	@keyframes lantern-glow {
		0%,
		100% {
			opacity: 0.2;
		}

		50% {
			opacity: 0.5;
		}
	}

	.lantern-glow {
		display: none;
	}

	:global(.animate-tool) .lantern-glow {
		display: block;
		animation: lantern-glow 3s ease-in-out infinite;
	}
</style>
