<!--
	Grill placeholder SVG — charcoal grill with grate lines and flames.
	Snap point at local (10, 20) — matching snapOffset.
	Flames animate only when parent has .animate-tool class.
-->
<script lang="ts">
	import FlameSvg from './FlameSvg.svelte';
</script>

<g>
	<!-- Grill body (bowl) -->
	<ellipse cx="10" cy="20" rx="14" ry="5" fill="#2A2A2A" />
	<rect x="-4" y="12" width="28" height="8" rx="2" fill="#333333" />

	<!-- Grate lines -->
	<line x1="-2" y1="12" x2="22" y2="12" stroke="#555555" stroke-width="1.5" />
	<line x1="-2" y1="15" x2="22" y2="15" stroke="#555555" stroke-width="1" />
	<line x1="-2" y1="18" x2="22" y2="18" stroke="#555555" stroke-width="1" />

	<!-- Legs -->
	<line x1="0" y1="20" x2="-2" y2="30" stroke="#444444" stroke-width="2" />
	<line x1="6" y1="20" x2="4" y2="30" stroke="#444444" stroke-width="2" />
	<line x1="14" y1="20" x2="16" y2="30" stroke="#444444" stroke-width="2" />
	<line x1="20" y1="20" x2="22" y2="30" stroke="#444444" stroke-width="2" />

	<!-- Flames above the grate -->
	<g transform="translate(4, 6)">
		<FlameSvg animationDelay={0} />
	</g>
	<g transform="translate(10, 4)">
		<FlameSvg animationDelay={0.3} />
	</g>
	<g transform="translate(16, 6)">
		<FlameSvg animationDelay={0.6} />
	</g>
</g>
