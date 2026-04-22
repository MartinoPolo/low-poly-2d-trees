<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<svg viewBox="0 0 64 64" fill="currentColor" class={className} xmlns="http://www.w3.org/2000/svg">
	<path d="M12 6l6 20h-4l18 18 18-18h-4L52 6l-10 14H22L12 6z" />
	<ellipse cx="32" cy="40" rx="14" ry="10" />
	<circle cx="25" cy="34" r="2.5" fill="white" />
	<circle cx="39" cy="34" r="2.5" fill="white" />
	<path d="M32 42l-3 3h6l-3-3z" />
	<circle cx="32" cy="42" r="1.5" fill="white" />
</svg>
