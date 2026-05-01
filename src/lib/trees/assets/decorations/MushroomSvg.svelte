<script lang="ts">
	interface Props {
		variant: number;
	}

	let { variant }: Props = $props();
</script>

<!--
  Each variant draws 2-3 small mushrooms in a ~20x15 cluster.
  Origin (0,0) is at the attachment point (right edge, mid-height).
  Mushroom = stem (rect) + cap (ellipse).
-->
{#if variant === 0}
	<!-- Classic brown mushroom cluster (3 mushrooms) -->
	<g>
		<!-- Large mushroom -->
		<rect x={-14} y={-2} width={3} height={5} fill="#d4c5a0" />
		<ellipse cx={-12.5} cy={-3} rx={5} ry={3} fill="#8B6914" />
		<!-- Medium mushroom -->
		<rect x={-7} y={0} width={2.5} height={4} fill="#d4c5a0" />
		<ellipse cx={-5.8} cy={-1} rx={4} ry={2.5} fill="#7a5a10" />
		<!-- Small mushroom -->
		<rect x={-3} y={1} width={2} height={3} fill="#d4c5a0" />
		<ellipse cx={-2} cy={0.5} rx={3} ry={2} fill="#8B6914" />
	</g>
{:else if variant === 1}
	<!-- Amanita-style red mushroom cluster (2 mushrooms) -->
	<g>
		<!-- Large amanita -->
		<rect x={-12} y={-1} width={3} height={5} fill="#e8d8c0" />
		<ellipse cx={-10.5} cy={-2} rx={5.5} ry={3.5} fill="#cc4444" />
		<circle cx={-12} cy={-3} r={0.8} fill="white" />
		<circle cx={-9.5} cy={-3.5} r={0.6} fill="white" />
		<circle cx={-10.5} cy={-1.5} r={0.5} fill="white" />
		<!-- Small amanita -->
		<rect x={-5} y={1} width={2} height={3.5} fill="#e8d8c0" />
		<ellipse cx={-4} cy={0.5} rx={3.5} ry={2.5} fill="#cc4444" />
		<circle cx={-5} cy={0} r={0.5} fill="white" />
		<circle cx={-3} cy={-0.5} r={0.4} fill="white" />
	</g>
{:else}
	<!-- Shelf fungus cluster (3 shelves) -->
	<g>
		<!-- Large shelf -->
		<rect x={-13} y={-2} width={2} height={3} fill="#c8c8c8" />
		<ellipse cx={-11} cy={-1.5} rx={5} ry={2.5} fill="#7a8899" />
		<!-- Medium shelf -->
		<rect x={-8} y={1} width={1.5} height={2.5} fill="#c8c8c8" />
		<ellipse cx={-6.5} cy={1.5} rx={4} ry={2} fill="#6a7888" />
		<!-- Small shelf -->
		<rect x={-4} y={3} width={1.5} height={2} fill="#c8c8c8" />
		<ellipse cx={-3} cy={3.5} rx={3} ry={1.5} fill="#7a8899" />
	</g>
{/if}
