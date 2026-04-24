<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		heading: string;
		subtitle?: string;
		children: Snippet;
	}

	let { heading, subtitle, children }: Props = $props();
</script>

<main class="flex h-full flex-col gap-4 p-4">
	<header class="pl-10">
		<h1 class="text-2xl font-bold tracking-tight">{heading}</h1>
		{#if subtitle}
			<p class="text-sm text-muted-foreground">{subtitle}</p>
		{/if}
	</header>
	{@render children()}
</main>
