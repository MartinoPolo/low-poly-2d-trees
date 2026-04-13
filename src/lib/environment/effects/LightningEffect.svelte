<script lang="ts">
	let flashOpacity = $state(0);

	$effect(() => {
		let timeoutId: ReturnType<typeof setTimeout>;
		let flashTimeoutId: ReturnType<typeof setTimeout>;
		let active = true;

		function scheduleFlash() {
			if (!active) {
				return;
			}
			const delay = 5000 + Math.random() * 10000;
			timeoutId = setTimeout(() => {
				if (!active) {
					return;
				}
				flashOpacity = 0.3;
				flashTimeoutId = setTimeout(
					() => {
						if (!active) {
							return;
						}
						flashOpacity = 0;
						scheduleFlash();
					},
					100 + Math.random() * 100,
				);
			}, delay);
		}

		scheduleFlash();

		return () => {
			active = false;
			clearTimeout(timeoutId);
			clearTimeout(flashTimeoutId);
		};
	});
</script>

<div data-testid="lightning-overlay" class="lightning-container" style="opacity: {flashOpacity};">
	<div class="lightning-flash"></div>
</div>

<style>
	.lightning-container {
		position: absolute;
		inset: 0;
		pointer-events: none;
		transition: opacity 0.05s ease-out;
		will-change: opacity;
	}

	.lightning-flash {
		position: absolute;
		inset: 0;
		background: white;
	}

	@media (prefers-reduced-motion: reduce) {
		.lightning-container {
			display: none;
		}
	}
</style>
