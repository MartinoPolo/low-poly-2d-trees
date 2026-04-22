<!--
	Speech Bubble SVG — rectangular bubble with rounded corners and curved bezier tail.
	Local (0,0) is at the tail tip (snap point), bubble extends upward.
	Accepts optional text prop for multi-line display.
	Static — no animation.
-->
<script lang="ts">
	interface Props {
		text?: string;
	}

	let { text = '' }: Props = $props();

	const bubbleWidth = 80;
	const bubbleHeight = 50;
	const cornerRadius = 8;
	const tailHeight = 12;

	// Bubble body positioned above the tail tip (0,0)
	const bubbleX = -bubbleWidth / 2;
	const bubbleY = -(bubbleHeight + tailHeight);

	// Curved bezier tail from bubble bottom to tip at (0,0)
	const tailPath = `M${-8},${-tailHeight} Q${-2},${-tailHeight / 2} 0,0 Q${2},${-tailHeight / 2} ${8},${-tailHeight}`;

	const textLines = $derived(text.split('\n').filter((line) => line.length > 0));
</script>

<g class="speech-bubble">
	<!-- Bubble body -->
	<rect
		x={bubbleX}
		y={bubbleY}
		width={bubbleWidth}
		height={bubbleHeight}
		rx={cornerRadius}
		ry={cornerRadius}
		fill="white"
		stroke="#555"
		stroke-width="1"
		opacity="0.95"
	/>

	<!-- Curved tail -->
	<path d={tailPath} fill="white" stroke="#555" stroke-width="1" opacity="0.95" />
	<!-- Cover the stroke where tail meets bubble -->
	<rect x={-9} y={-tailHeight - 1} width={18} height={3} fill="white" opacity="0.95" />

	{#if textLines.length > 0}
		<text
			x={0}
			y={bubbleY + bubbleHeight / 2}
			text-anchor="middle"
			dominant-baseline="central"
			font-size="8"
			fill="#333"
		>
			{#each textLines as line, i (i)}
				<tspan x={0} dy={i === 0 ? 0 : 11}>{line}</tspan>
			{/each}
		</text>
	{/if}
</g>
