<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg viewBox="0 0 64 64" fill="currentColor" class={className} xmlns="http://www.w3.org/2000/svg">
	<circle cx="20" cy="18" r="8" />
	<circle cx="44" cy="18" r="8" />
	<circle cx="20" cy="18" r="4" fill="white" />
	<circle cx="44" cy="18" r="4" fill="white" />
	<circle cx="20" cy="18" r="2" />
	<circle cx="44" cy="18" r="2" />
	<ellipse cx="32" cy="38" rx="20" ry="14" />
	<path d="M22 42q10 6 20 0" stroke="currentColor" fill="none" stroke-width="2" />
	<circle cx="18" cy="36" r="1" />
	<circle cx="46" cy="36" r="1" />
</svg>
