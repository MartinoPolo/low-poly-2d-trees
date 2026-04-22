<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg viewBox="0 0 64 64" fill="currentColor" class={className} xmlns="http://www.w3.org/2000/svg">
	<path d="M10 8l8 18h-4l18 14 18-14h-4L54 8l-12 12H22L10 8z" />
	<ellipse cx="32" cy="38" rx="16" ry="14" />
	<circle cx="25" cy="33" r="2.5" fill="white" />
	<circle cx="39" cy="33" r="2.5" fill="white" />
	<ellipse cx="32" cy="40" rx="4" ry="3" fill="white" opacity="0.3" />
	<ellipse cx="32" cy="39" rx="2.5" ry="1.5" />
	<path d="M28 44q4 2 8 0" stroke="currentColor" fill="none" stroke-width="1.5" />
</svg>
