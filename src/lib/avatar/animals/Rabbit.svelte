<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg viewBox="0 0 64 64" fill="currentColor" class={className} xmlns="http://www.w3.org/2000/svg">
	<ellipse cx="24" cy="14" rx="5" ry="14" />
	<ellipse cx="40" cy="14" rx="5" ry="14" />
	<ellipse cx="24" cy="14" rx="2.5" ry="10" fill="white" opacity="0.3" />
	<ellipse cx="40" cy="14" rx="2.5" ry="10" fill="white" opacity="0.3" />
	<ellipse cx="32" cy="40" rx="16" ry="14" />
	<circle cx="26" cy="36" r="2.5" fill="white" />
	<circle cx="38" cy="36" r="2.5" fill="white" />
	<ellipse cx="32" cy="42" rx="2" ry="1.5" />
	<path d="M30 44q2 2 4 0" stroke="currentColor" fill="none" stroke-width="1.5" />
	<circle cx="24" cy="42" r="3" fill="white" opacity="0.3" />
	<circle cx="40" cy="42" r="3" fill="white" opacity="0.3" />
</svg>
