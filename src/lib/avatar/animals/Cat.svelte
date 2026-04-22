<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg viewBox="0 0 64 64" fill="currentColor" class={className} xmlns="http://www.w3.org/2000/svg">
	<path d="M16 8l-4 16h4l-2 8c4-2 8-4 12-4s8 2 12 4l-2-8h4L36 8l-4 6-6-2-6 2-4-6z" />
	<ellipse cx="32" cy="38" rx="14" ry="12" />
	<circle cx="26" cy="35" r="2.5" fill="white" />
	<circle cx="38" cy="35" r="2.5" fill="white" />
	<ellipse cx="32" cy="40" rx="2" ry="1.5" />
	<path d="M30 42q2 2 4 0" stroke="currentColor" fill="none" stroke-width="1.5" />
	<path
		d="M18 39h-8M46 39h8M18 42h-7M46 42h7"
		stroke="currentColor"
		stroke-width="1"
		fill="none"
	/>
</svg>
