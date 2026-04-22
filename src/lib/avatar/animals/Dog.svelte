<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg viewBox="0 0 64 64" fill="currentColor" class={className} xmlns="http://www.w3.org/2000/svg">
	<ellipse cx="32" cy="36" rx="16" ry="14" />
	<ellipse cx="16" cy="20" rx="6" ry="10" transform="rotate(-15 16 20)" />
	<ellipse cx="48" cy="20" rx="6" ry="10" transform="rotate(15 48 20)" />
	<circle cx="26" cy="33" r="2.5" fill="white" />
	<circle cx="38" cy="33" r="2.5" fill="white" />
	<ellipse cx="32" cy="39" rx="4" ry="3" />
	<circle cx="32" cy="38" r="2" fill="white" />
	<path d="M28 44q4 3 8 0" stroke="currentColor" fill="none" stroke-width="1.5" />
</svg>
