<script lang="ts">
	interface Props {
		variant: number;
	}

	let { variant }: Props = $props();
</script>

<g>
	{#if variant === 0}
		<polygon
			points="-4,0 -2,-3 2,-4 5,-1 3,2 -1,2"
			fill="#8a8a7a"
			stroke="#7a7a6a"
			stroke-width="0.3"
		/>
	{:else if variant === 1}
		<polygon
			points="-3,0 -1,-3 3,-2 4,1 0,2"
			fill="#9a9080"
			stroke="#8a8070"
			stroke-width="0.3"
		/>
	{:else}
		<polygon
			points="-5,1 -3,-2 0,-3 4,-1 3,2 -2,2"
			fill="#7a7a6a"
			stroke="#6a6a5a"
			stroke-width="0.3"
		/>
	{/if}
</g>
