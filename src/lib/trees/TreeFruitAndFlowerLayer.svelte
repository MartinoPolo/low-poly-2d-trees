<script lang="ts">
	import type { Component } from 'svelte';
	import type { TreeGeometry, Point2D } from '$lib/trees/types/core.js';

	interface Props {
		geometry: TreeGeometry;
		showFruit: boolean;
		fruitComponent: Component | null;
		fruitScale?: number;
		fruitOriginOffset?: Point2D;
		flowerComponent: Component | null;
		flowerScale?: number;
		flowerOriginOffset?: Point2D;
	}

	let {
		geometry,
		showFruit,
		fruitComponent,
		fruitScale = 1,
		fruitOriginOffset = { x: 0, y: 0 },
		flowerComponent,
		flowerScale = 1,
		flowerOriginOffset = { x: 0, y: 0 },
	}: Props = $props();
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
			<g
				transform="translate({slot.x + fruitOriginOffset.x},{slot.y +
					fruitOriginOffset.y}) scale({fruitScale})"
			>
				<FruitSvg />
			</g>
		{/each}
	</g>
{/if}

{#if flowerComponent && geometry.flowerSlots.length > 0}
	{@const FlowerSvg = flowerComponent}
	<g class="flowers">
		{#each geometry.flowerSlots as slot (slot)}
			<g
				transform="translate({slot.x + flowerOriginOffset.x},{slot.y +
					flowerOriginOffset.y}) scale({flowerScale})"
			>
				<FlowerSvg />
			</g>
		{/each}
	</g>
{/if}
