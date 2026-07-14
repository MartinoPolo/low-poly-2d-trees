<script lang="ts">
	interface Props {
		color?: string;
	}

	const { color = '#9FFF50' }: Props = $props();
</script>

<g>
	<circle cx="0" cy="0" r="3" fill={color} filter="url(#firefly-glow)" />
</g>
