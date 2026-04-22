<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg viewBox="0 0 64 64" fill="currentColor" class={className} xmlns="http://www.w3.org/2000/svg">
	<path d="M14 12l4 10-6 4 20 2 20-2-6-4 4-10-10 8H24L14 12z" />
	<ellipse cx="32" cy="36" rx="18" ry="16" />
	<circle cx="24" cy="32" r="7" fill="white" />
	<circle cx="40" cy="32" r="7" fill="white" />
	<circle cx="24" cy="32" r="3.5" />
	<circle cx="40" cy="32" r="3.5" />
	<path d="M30 40l2 3 2-3z" />
	<path d="M20 46q12 6 24 0" stroke="currentColor" fill="none" stroke-width="1.5" />
</svg>
