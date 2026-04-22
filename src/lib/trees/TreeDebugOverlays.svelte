<script lang="ts">
	import type { TreeGeometry } from '$lib/trees/types/core.js';

	interface Props {
		geometry: TreeGeometry;
		showViewBox?: boolean;
		showAnchors?: boolean;
		showEnvelope?: boolean;
	}

	let {
		geometry,
		showViewBox = false,
		showAnchors = false,
		showEnvelope = false,
	}: Props = $props();
</script>

{#if showViewBox}
	<rect
		x="0"
		y="0"
		width={geometry.viewBox.width}
		height={geometry.viewBox.height}
		fill="none"
		stroke="red"
		stroke-width="2"
		stroke-dasharray="8 4"
		opacity="0.5"
	/>
	<line
		x1={geometry.viewBox.width / 2}
		y1="0"
		x2={geometry.viewBox.width / 2}
		y2={geometry.viewBox.height}
		stroke="red"
		stroke-width="1"
		stroke-dasharray="4 4"
		opacity="0.3"
	/>
	<line
		x1="0"
		y1={geometry.viewBox.height * 0.95}
		x2={geometry.viewBox.width}
		y2={geometry.viewBox.height * 0.95}
		stroke="green"
		stroke-width="1"
		stroke-dasharray="4 4"
		opacity="0.5"
	/>
{/if}

{#if showAnchors}
	<g class="anchors-group">
		<circle
			cx={geometry.anchors.trunkBase.x}
			cy={geometry.anchors.trunkBase.y}
			r="4"
			fill="#ef4444"
			stroke="white"
			stroke-width="1"
		/>
		<circle
			cx={geometry.anchors.trunkMiddle.x}
			cy={geometry.anchors.trunkMiddle.y}
			r="4"
			fill="#f97316"
			stroke="white"
			stroke-width="1"
		/>
		<circle
			cx={geometry.anchors.trunkTop.x}
			cy={geometry.anchors.trunkTop.y}
			r="4"
			fill="#eab308"
			stroke="white"
			stroke-width="1"
		/>
		<circle
			cx={geometry.anchors.crownCenter.x}
			cy={geometry.anchors.crownCenter.y}
			r="4"
			fill="#22c55e"
			stroke="white"
			stroke-width="1"
		/>
		<circle
			cx={geometry.anchors.crownTop.x}
			cy={geometry.anchors.crownTop.y}
			r="4"
			fill="#06b6d4"
			stroke="white"
			stroke-width="1"
		/>
		<circle
			cx={geometry.anchors.roots.x}
			cy={geometry.anchors.roots.y}
			r="4"
			fill="#a855f7"
			stroke="white"
			stroke-width="1"
		/>
		{#each geometry.anchors.branchTips as tip (tip)}
			<circle cx={tip.x} cy={tip.y} r="3" fill="#f43f5e" stroke="white" stroke-width="0.5" />
		{/each}
		{#each geometry.anchors.fruitSlots as slot (slot)}
			<circle
				cx={slot.x}
				cy={slot.y}
				r="3"
				fill="#10b981"
				stroke="white"
				stroke-width="0.5"
			/>
		{/each}
	</g>
{/if}

{#if showEnvelope && geometry.canopyEnvelope}
	<g class="envelope-debug">
		<ellipse
			cx={geometry.canopyEnvelope.centerX}
			cy={geometry.canopyEnvelope.centerY}
			rx={geometry.canopyEnvelope.radiusX}
			ry={geometry.canopyEnvelope.radiusY}
			fill="none"
			stroke="#ef4444"
			stroke-width="1"
			stroke-dasharray="4 3"
			opacity="0.7"
		/>
	</g>
{/if}
