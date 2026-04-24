<script lang="ts">
	import LowPolyTree from '$lib/trees/LowPolyTree.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		deleteSavedTree,
		listSavedTrees,
		renameSavedTree,
	} from '$lib/trees/saved_trees.remote.js';
	import { formatRelative } from '$lib/utils/format_relative.js';
	import { goto } from '$app/navigation';
	import { localizedResolve } from '$lib/i18n/localized_resolve.js';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { m } from '$lib/paraglide/messages.js';
	import PageLayout from '$lib/components/app-shell/PageLayout.svelte';

	let renamingId = $state<string | null>(null);
	let renameValue = $state('');
	let operationError = $state<string | null>(null);

	function startRename(id: string, current: string) {
		renamingId = id;
		renameValue = current;
	}

	async function commitRename(id: string) {
		const trimmed = renameValue.trim();
		if (trimmed && trimmed.length <= 80) {
			try {
				await renameSavedTree({ id, name: trimmed });
				operationError = null;
			} catch {
				operationError = m.status_failed_rename_tree();
			}
		}
		renamingId = null;
	}

	async function confirmDelete(id: string, name: string) {
		const confirmed = globalThis.confirm(m.action_confirm_delete_tree({ name }));
		if (!confirmed) {
			return;
		}
		try {
			await deleteSavedTree(id);
			operationError = null;
		} catch {
			operationError = m.status_failed_delete_tree();
		}
	}

	function handleAuthError(error: unknown) {
		if (
			typeof error === 'object' &&
			error !== null &&
			'status' in error &&
			(error as { status: unknown }).status === 401
		) {
			void goto(localizedResolve('/auth/sign-in'));
		}
	}
</script>

<svelte:head>
	<title>{m.page_gallery()}</title>
</svelte:head>

<PageLayout heading={m.gallery_heading()} subtitle={m.gallery_subtitle()}>
	{#if operationError}
		<div class="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3">
			<p class="text-sm text-destructive">{operationError}</p>
		</div>
	{/if}

	<svelte:boundary onerror={handleAuthError}>
		{#snippet pending()}
			<p class="text-muted-foreground">{m.status_loading_gallery()}</p>
		{/snippet}

		{#snippet failed(error, reset)}
			{@const message = error instanceof Error ? error.message : 'Something went wrong'}
			<div class="rounded-md border border-destructive/40 bg-destructive/10 p-4">
				<p class="text-sm text-destructive">{m.status_error_prefix({ message })}</p>
				<Button variant="outline" class="mt-2" onclick={reset}>{m.action_retry()}</Button>
			</div>
		{/snippet}

		{@const trees = await listSavedTrees()}
		{#if trees.length === 0}
			<p class="text-muted-foreground" data-testid="gallery-empty">
				{m.gallery_empty_prefix()}
				<a href={localizedResolve('/editor')} class="underline">{m.gallery_empty_link()}</a>
				{m.gallery_empty_suffix()}
			</p>
		{:else}
			<div
				class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4"
				data-testid="gallery-grid"
			>
				{#each trees as tree (tree.id)}
					<article
						class="group relative flex flex-col rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
						data-testid="gallery-card"
						data-tree-id={tree.id}
					>
						<a
							href={`${localizedResolve('/editor')}?saved=${encodeURIComponent(tree.id)}`}
							class="block aspect-square overflow-hidden rounded-md bg-muted/30"
							aria-label={m.gallery_open_in_editor({ name: tree.name })}
						>
							<LowPolyTree config={tree.config} class="h-full w-full" />
						</a>
						<div class="mt-2 min-w-0 flex-1">
							{#if renamingId === tree.id}
								<Input
									bind:value={renameValue}
									onblur={() => commitRename(tree.id)}
									onkeydown={(event) => {
										if (event.key === 'Enter') {
											event.preventDefault();
											void commitRename(tree.id);
										} else if (event.key === 'Escape') {
											renamingId = null;
										}
									}}
									maxlength={80}
									autofocus
									class="h-7 text-sm"
									data-testid="gallery-rename-input"
								/>
							{:else}
								<button
									type="button"
									class="w-full truncate text-left text-sm font-medium hover:underline"
									onclick={() => startRename(tree.id, tree.name)}
									data-testid="gallery-card-name"
								>
									{tree.name}
								</button>
							{/if}
							<p class="text-xs text-muted-foreground">
								{formatRelative(new Date(tree.createdAt))}
							</p>
						</div>
						<Button
							variant="ghost"
							size="icon"
							class="absolute right-2 top-2 size-7 opacity-0 transition-opacity group-hover:opacity-100"
							data-testid="gallery-delete-button"
							onclick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								void confirmDelete(tree.id, tree.name);
							}}
							aria-label={m.gallery_delete({ name: tree.name })}
						>
							<Trash2 class="size-4" />
						</Button>
					</article>
				{/each}
			</div>
		{/if}
	</svelte:boundary>
</PageLayout>
