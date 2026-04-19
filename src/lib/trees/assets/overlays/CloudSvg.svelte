<script lang="ts">
	interface Props {
		triangles: readonly string[];
		opacity: number;
	}

	let { triangles, opacity }: Props = $props();
</script>

<g>
	{#each triangles as points (points)}
		<polygon {points} fill="rgba(220,220,230,{opacity})" />
	{/each}
</g>
