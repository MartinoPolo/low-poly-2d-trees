<script lang="ts">
	import type { Component } from 'svelte';
	import type { TreeGeometry } from '$lib/trees/types/core.js';

	const FRUIT_RENDER_SCALE = 2;

	interface Props {
		geometry: TreeGeometry;
		showFruit: boolean;
		fruitComponent: Component | null;
		flowerComponent: Component | null;
	}

	let { geometry, showFruit, fruitComponent, flowerComponent }: Props = $props();
</script>

{#if geometry.stakeTriangles.length > 0}
	<g class="stakes">
		{#each geometry.stakeTriangles as tri (tri)}
			<polygon
				points="{tri.points[0].x},{tri.points[0].y} {tri.points[1].x},{tri.points[1].y} {tri
					.points[2].x},{tri.points[2].y}"
				fill={tri.color}
				stroke={tri.color}
				stroke-width="0.5"
			/>
		{/each}
	</g>
{/if}

{#if showFruit && fruitComponent && geometry.fruitSlots.length > 0}
	{@const FruitSvg = fruitComponent}
	<g class="fruit">
		{#each geometry.fruitSlots as slot (slot)}
			<g transform="translate({slot.x},{slot.y}) scale({FRUIT_RENDER_SCALE})">
				<FruitSvg />
			</g>
		{/each}
	</g>
{/if}

{#if flowerComponent && geometry.flowerSlots.length > 0}
	{@const FlowerSvg = flowerComponent}
	<g class="flowers">
		{#each geometry.flowerSlots as slot (slot)}
			<g transform="translate({slot.x},{slot.y})">
				<FlowerSvg />
			</g>
		{/each}
	</g>
{/if}
