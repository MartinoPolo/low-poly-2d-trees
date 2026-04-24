<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="flex h-full items-center justify-center p-4 pl-10">
	<div class="text-center">
		<h1 class="text-4xl font-bold">{page.status}</h1>
		<p class="mt-2 text-muted-foreground">{page.error?.message}</p>
	</div>
</div>
