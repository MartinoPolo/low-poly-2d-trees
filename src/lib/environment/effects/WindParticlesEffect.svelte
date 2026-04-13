<script lang="ts">
	import { generateWindParticles } from '../environment_generators.js';
	import {
		ENVIRONMENT_SEEDS,
		ENVIRONMENT_VIEW_HEIGHT,
		ENVIRONMENT_VIEW_WIDTH,
	} from '../environment_config.js';

	const particles = generateWindParticles(
		15,
		ENVIRONMENT_SEEDS.wind,
		ENVIRONMENT_VIEW_WIDTH,
		ENVIRONMENT_VIEW_HEIGHT,
	);
</script>

<svg
	data-testid="wind-overlay"
	class="wind-container"
	viewBox="0 0 {ENVIRONMENT_VIEW_WIDTH} {ENVIRONMENT_VIEW_HEIGHT}"
	preserveAspectRatio="none"
	xmlns="http://www.w3.org/2000/svg"
>
	{#each particles as particle, index (index)}
		<path
			data-testid="wind-particle"
			d="M0,-{particle.size} C{particle.size / 2},-{particle.size / 2} {particle.size /
				2},{particle.size / 2} 0,{particle.size} C-{particle.size / 3},0 -{particle.size /
				3},0 0,-{particle.size}Z"
			fill="rgba(139,119,101,0.4)"
			class="wind-particle"
			style="
				transform: translate({particle.x}px, {particle.y}px) rotate({particle.rotation}deg);
				animation-delay: {particle.delay}s;
			"
		/>
	{/each}
</svg>

<style>
	.wind-container {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.wind-particle {
		animation: wind-drift 4s ease-in-out infinite;
		opacity: 0.6;
		will-change: transform;
	}

	@keyframes wind-drift {
		0% {
			translate: 0 0;
		}

		25% {
			translate: 60px -15px;
		}

		50% {
			translate: 120px 5px;
		}

		75% {
			translate: 180px -10px;
		}

		100% {
			translate: 240px 0;
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wind-particle {
			animation: none;
		}
	}
</style>
