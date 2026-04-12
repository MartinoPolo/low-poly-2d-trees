<script lang="ts">
	import TreePine from '@lucide/svelte/icons/tree-pine';

	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();
</script>

<main class="bg-muted flex min-h-screen items-center justify-center px-6 py-12">
	<div class="w-full max-w-sm space-y-6">
		<div class="flex items-center justify-center gap-2">
			<TreePine class="text-primary size-6" />
			<span class="text-lg font-semibold">Low-Poly Trees</span>
		</div>
		{@render children()}
	</div>
</main>
