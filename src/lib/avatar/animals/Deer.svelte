<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg viewBox="0 0 64 64" fill="currentColor" class={className} xmlns="http://www.w3.org/2000/svg">
	<path d="M20 4v8l-4 4h4v4" stroke="currentColor" fill="none" stroke-width="2" />
	<path d="M16 8h-4M18 12h-6" stroke="currentColor" fill="none" stroke-width="2" />
	<path d="M44 4v8l4 4h-4v4" stroke="currentColor" fill="none" stroke-width="2" />
	<path d="M48 8h4M46 12h6" stroke="currentColor" fill="none" stroke-width="2" />
	<ellipse cx="32" cy="36" rx="14" ry="16" />
	<ellipse cx="20" cy="28" rx="4" ry="6" transform="rotate(-10 20 28)" />
	<ellipse cx="44" cy="28" rx="4" ry="6" transform="rotate(10 44 28)" />
	<circle cx="26" cy="32" r="2.5" fill="white" />
	<circle cx="38" cy="32" r="2.5" fill="white" />
	<ellipse cx="32" cy="40" rx="3" ry="2" />
</svg>
