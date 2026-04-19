<script lang="ts">
	interface Props {
		size: number;
	}

	let { size }: Props = $props();
</script>

<circle cx="0" cy="0" r={size} fill="white" fill-opacity="0.8" />
