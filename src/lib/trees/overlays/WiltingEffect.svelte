<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		enabled: boolean;
		children: Snippet;
	}

	let { enabled, children }: Props = $props();
</script>

<g class="wilting-wrapper" class:wilting-active={enabled}>
	{@render children()}
</g>

<style>
	.wilting-wrapper.wilting-active {
		filter: hue-rotate(40deg) saturate(0.4);
		transform: skewY(3deg);
		transform-origin: center top;
	}
</style>
