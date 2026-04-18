<script lang="ts">
	import type { Point2D } from '$lib/trees/types/core.js';
	import { generateSpeechBubblePath } from './overlay_generators.js';
	import type { SpeechBubbleConfig } from './overlay_types.js';

	interface Props {
		anchor: Point2D;
		config: SpeechBubbleConfig;
	}

	let { anchor, config }: Props = $props();

	const bubbleWidth = 80;
	const bubbleHeight = 50;

	const geometry = $derived(generateSpeechBubblePath(bubbleWidth, bubbleHeight));

	const offsetX = $derived(anchor.x + 15);
	const offsetY = $derived(anchor.y - bubbleHeight / 2);

	const textLines = $derived(config.text.split('\n').filter((l) => l.length > 0));
</script>

<g class="speech-bubble-group" transform="translate({offsetX}, {offsetY})">
	<path d={geometry.path} fill="white" stroke="#555" stroke-width="1" opacity="0.95" />
	<path d={geometry.pointerPath} fill="white" stroke="#555" stroke-width="1" opacity="0.95" />

	{#if textLines.length > 0}
		<text
			x={bubbleWidth / 2}
			y={bubbleHeight / 2}
			text-anchor="middle"
			dominant-baseline="central"
			font-size="8"
			fill="#333"
		>
			{#each textLines as line, i (i)}
				<tspan x={bubbleWidth / 2} dy={i === 0 ? 0 : 11}>{line}</tspan>
			{/each}
		</text>
	{/if}
</g>
