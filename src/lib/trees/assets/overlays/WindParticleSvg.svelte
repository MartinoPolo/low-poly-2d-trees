<script lang="ts">
	interface Props {
		size: number;
	}

	let { size }: Props = $props();
</script>

<path
	d="M0,-{size} C{size / 2},-{size / 2} {size / 2},{size / 2} 0,{size} C-{size / 3},0 -{size /
		3},0 0,-{size}Z"
	fill="rgba(139,119,101,0.4)"
/>
