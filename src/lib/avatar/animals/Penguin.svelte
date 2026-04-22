<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg viewBox="0 0 64 64" fill="currentColor" class={className} xmlns="http://www.w3.org/2000/svg">
	<ellipse cx="32" cy="34" rx="16" ry="22" />
	<ellipse cx="32" cy="38" rx="10" ry="16" fill="white" opacity="0.3" />
	<circle cx="26" cy="26" r="2.5" fill="white" />
	<circle cx="38" cy="26" r="2.5" fill="white" />
	<path d="M30 32l2 3 2-3z" />
	<path d="M12 30q-4 14 6 18" stroke="currentColor" fill="none" stroke-width="3" />
	<path d="M52 30q4 14-6 18" stroke="currentColor" fill="none" stroke-width="3" />
</svg>
