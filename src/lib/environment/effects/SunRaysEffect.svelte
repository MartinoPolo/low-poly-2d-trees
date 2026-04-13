<script lang="ts">
	interface Props {
		lightAngle: number;
	}

	const { lightAngle }: Props = $props();

	const rayAngle = $derived(lightAngle - 90);
</script>

<div data-testid="sun-rays-overlay" class="sun-rays-container">
	{#each [0, 1, 2] as rayIndex (rayIndex)}
		<div
			class="sun-ray"
			style="
				transform: rotate({rayAngle}deg);
				left: {20 + rayIndex * 25}%;
				animation-delay: {rayIndex * 0.5}s;
			"
		></div>
	{/each}
</div>

<style>
	.sun-rays-container {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.sun-ray {
		position: absolute;
		top: -20%;
		width: 80px;
		height: 140%;
		background: linear-gradient(
			180deg,
			rgb(255 215 0 / 15%) 0%,
			rgb(255 215 0 / 5%) 50%,
			transparent 100%
		);
		transform-origin: top center;
		animation: ray-shimmer 4s ease-in-out infinite alternate;
	}

	@keyframes ray-shimmer {
		0% {
			opacity: 0.5;
		}

		100% {
			opacity: 0.8;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sun-ray {
			animation: none;
			opacity: 0.6;
		}
	}
</style>
