<!--
	Hummingbird SVG — tiny darting bird with long thin beak.
	Low-poly geometric style, ~20px wide.
	Origin (0,0) = center-bottom (feet position).
-->
<g>
	<!-- Body (iridescent green) -->
	<ellipse cx="0" cy="-5" rx="4" ry="5" fill="#2E8B57" />
	<!-- Belly (lighter) -->
	<ellipse cx="0" cy="-3" rx="3" ry="3" fill="#7EC8A0" />
	<!-- Head -->
	<circle cx="2" cy="-9" r="3" fill="#2E8B57" />
	<!-- Eye -->
	<circle cx="3.5" cy="-10" r="0.7" fill="#1A1A1A" />
	<!-- Long thin beak -->
	<path d="M5,-9 L14,-8 L5,-8" fill="#4A4A4A" />
	<!-- Wing (semi-transparent blur effect) -->
	<ellipse cx="-3" cy="-6" rx="5" ry="2.5" fill="#2E8B57" opacity="0.5" />
	<ellipse cx="-4" cy="-7" rx="4" ry="2" fill="#3CB371" opacity="0.3" />
	<!-- Tail -->
	<path d="M-2,0 L-5,3 L-1,2 Z" fill="#1E6B3E" />
	<!-- Tiny feet -->
	<path
		d="M-1,0 L-1,1.5 M0,0 L0,1.5"
		stroke="#4A4A4A"
		stroke-width="0.5"
		fill="none"
		stroke-linecap="round"
	/>
</g>
