<script lang="ts">
	interface Props {
		color: string;
	}

	let { color }: Props = $props();
</script>

<path d="M0,-2 L1.5,0 L0,2 L-1.5,0 Z" fill={color} opacity="0.85" />
