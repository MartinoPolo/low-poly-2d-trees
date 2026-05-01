<!--
	Pruning Shears SVG -- low-poly garden secateurs with snipping animation.
	Local (0,0) is at the top-left; snap point is handle bottoms (~15, 55).
	Snipping animation gated by :global(.animate-tool) CSS class.
-->
<script lang="ts">
</script>

<g class="pruning-shears">
	<!-- Pivot bolt -->
	<circle cx="17" cy="20" r="2.5" fill="#4a4a4a" />

	<!-- Upper blade (rotates around pivot) -->
	<g class="shears-upper-blade">
		<path d="M17,20 Q10,10 8,2 Q14,4 17,20 Z" fill="#7a7a7a" stroke="#555" stroke-width="0.5" />
	</g>

	<!-- Lower blade (rotates around pivot) -->
	<g class="shears-lower-blade">
		<path
			d="M17,20 Q24,10 26,2 Q20,4 17,20 Z"
			fill="#8a8a8a"
			stroke="#555"
			stroke-width="0.5"
		/>
	</g>

	<!-- Red handle -->
	<path
		d="M17,20 Q12,30 8,42 Q10,44 14,42 Q16,32 17,20 Z"
		fill="#cc3333"
		stroke="#993333"
		stroke-width="0.5"
	/>

	<!-- Orange handle -->
	<path
		d="M17,20 Q22,30 26,42 Q24,44 20,42 Q18,32 17,20 Z"
		fill="#cc6633"
		stroke="#994422"
		stroke-width="0.5"
	/>

	<!-- Spring between handles -->
	<path
		d="M13,32 Q17,28 21,32"
		fill="none"
		stroke="#888888"
		stroke-width="1"
		stroke-linecap="round"
	/>
</g>

<style>
	@keyframes shears-snip-upper {
		0%,
		100% {
			transform: rotate(0deg);
		}

		40% {
			transform: rotate(8deg);
		}

		50% {
			transform: rotate(-5deg);
		}

		60% {
			transform: rotate(3deg);
		}
	}

	@keyframes shears-snip-lower {
		0%,
		100% {
			transform: rotate(0deg);
		}

		40% {
			transform: rotate(-8deg);
		}

		50% {
			transform: rotate(5deg);
		}

		60% {
			transform: rotate(-3deg);
		}
	}

	.shears-upper-blade,
	.shears-lower-blade {
		transform-origin: 17px 20px;
	}

	:global(.animate-tool) .shears-upper-blade {
		animation: shears-snip-upper 1.5s ease-in-out infinite;
	}

	:global(.animate-tool) .shears-lower-blade {
		animation: shears-snip-lower 1.5s ease-in-out infinite;
	}
</style>
