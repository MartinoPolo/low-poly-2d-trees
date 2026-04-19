<script lang="ts">
	interface Props {
		variant: number;
	}

	let { variant }: Props = $props();
</script>

<g>
	{#if variant === 0}
		<path d="M0,0 L-1,-6 L0,-4 L1,-7 L2,-3 L1,-5 L2,0" fill="#5a8a3a" stroke="none" />
	{:else}
		<path d="M0,0 L-2,-5 L-1,-3 L0,-7 L1,-4 L2,-6 L1,0" fill="#4a7a2a" stroke="none" />
	{/if}
</g>
