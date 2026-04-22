<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg viewBox="0 0 64 64" fill="currentColor" class={className} xmlns="http://www.w3.org/2000/svg">
	<circle cx="16" cy="16" r="8" />
	<circle cx="48" cy="16" r="8" />
	<ellipse cx="32" cy="34" rx="20" ry="18" />
	<circle cx="24" cy="30" r="2.5" fill="white" />
	<circle cx="40" cy="30" r="2.5" fill="white" />
	<ellipse cx="32" cy="38" rx="6" ry="5" fill="white" opacity="0.3" />
	<ellipse cx="32" cy="36" rx="3" ry="2" />
	<path d="M29 40q3 2 6 0" stroke="currentColor" fill="none" stroke-width="1.5" />
</svg>
