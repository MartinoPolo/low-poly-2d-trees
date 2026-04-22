<!--
	Flame SVG — animated teardrop/organic flame shape.
	Props: animationDelay (seconds) for staggered animation.
	Animation activates only when parent has .animate-tool class.
-->
<script lang="ts">
	interface Props {
		animationDelay?: number;
	}

	let { animationDelay = 0 }: Props = $props();
</script>

<g class="flame" style="--flame-delay: {animationDelay}s;">
	<!-- Outer flame (orange) -->
	<path
		d="M0,-8 C-3,-4 -4,0 -3,3 C-2,5 -1,6 0,6 C1,6 2,5 3,3 C4,0 3,-4 0,-8Z"
		fill="#F97316"
		opacity="0.9"
	/>
	<!-- Inner flame (yellow) -->
	<path
		d="M0,-5 C-2,-2 -2.5,0 -2,2 C-1.5,3.5 -0.5,4.5 0,4.5 C0.5,4.5 1.5,3.5 2,2 C2.5,0 2,-2 0,-5Z"
		fill="#FBBF24"
		opacity="0.85"
	/>
	<!-- Core (bright yellow-white) -->
	<path
		d="M0,-2 C-1,0 -1,1 -0.5,2.5 C0,3.5 0.5,2.5 0.5,2.5 C1,1 1,0 0,-2Z"
		fill="#FDE68A"
		opacity="0.8"
	/>
</g>

<style>
	@keyframes flame-flicker {
		0%,
		100% {
			opacity: 0.3;
			transform: translateX(0);
		}

		25% {
			opacity: 0.8;
			transform: translateX(-2px);
		}

		50% {
			opacity: 1;
			transform: translateX(0);
		}

		75% {
			opacity: 0.7;
			transform: translateX(2px);
		}
	}

	.flame {
		display: none;
	}

	:global(.animate-tool) .flame {
		display: block;
		animation: flame-flicker 1.5s ease-in-out infinite;
		animation-delay: var(--flame-delay);
		animation-fill-mode: both;
	}
</style>
