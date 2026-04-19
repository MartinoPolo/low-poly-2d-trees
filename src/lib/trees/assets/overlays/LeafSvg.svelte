<script lang="ts">
	interface Props {
		color: string;
	}

	let { color }: Props = $props();
</script>

<path d="M0,-4 L3,0 L0,4 L-3,0 Z" fill={color} opacity="0.85" />
