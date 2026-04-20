<script lang="ts">
	interface Props {
		groundHeightPercent?: number;
	}

	const { groundHeightPercent = 18 }: Props = $props();
</script>

<div
	class="pointer-events-none absolute inset-0 bg-linear-to-b from-sky-200 to-white dark:from-[#0a1628] dark:to-[#1a2744]"
></div>
<div
	class="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-[#4a3528] to-[#4a7c3f] dark:from-[#1a0e08] dark:to-[#2d4a25]"
	style="height: {groundHeightPercent}%"
></div>
