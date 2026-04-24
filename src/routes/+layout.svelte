<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import AppSidebar from '$lib/components/app-shell/AppSidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import favicon from '$lib/assets/favicon.svg';
	import figtreeLatinUrl from '@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2?url';
	import notoSansLatinUrl from '@fontsource-variable/noto-sans/files/noto-sans-latin-wght-normal.woff2?url';
	import { set_settings_tier_context } from '$lib/context/settings_tier.context.svelte.js';
	import { set_avatar_context } from '$lib/context/avatar.context.svelte.js';
	import { afterNavigate, preloadCode } from '$app/navigation';
	import { onMount } from 'svelte';

	// Tab title prefix — injected at dev-server start from git branch (vite.config.ts define).
	// Lets you tell apart multiple worktrees/branches running simultaneously in the browser.
	function shortBranch(full: string): string {
		const stripped = full.replace(/^[^/]+\//, ''); // strip feature/, fix/, etc.
		return stripped.split(/[-_]/).slice(0, 2).join('-'); // first two segments
	}
	let { data, children } = $props();

	set_settings_tier_context();
	const avatarCtx = set_avatar_context({ preset: null, color: null });

	$effect(() => {
		avatarCtx.avatar.current = {
			preset: data.user?.avatarPreset ?? null,
			color: data.user?.avatarColor ?? null,
		};
	});

	// afterNavigate fires after SvelteKit applies <svelte:head><title> from the page,
	// so we can safely prepend without the page overwriting us again.
	// Port is read here (browser-only) so each worktree's port is included.
	onMount(() => {
		void Promise.all([
			preloadCode('/editor'),
			preloadCode('/gallery'),
			preloadCode('/showcase'),
			preloadCode('/settings'),
		]);
	});

	afterNavigate(() => {
		if (document.title && !document.title.startsWith('[')) {
			const branch = shortBranch(__GIT_BRANCH__);
			const port = window.location.port;
			const prefix = port ? `[${branch}:${port}]` : `[${branch}]`;
			document.title = `${prefix} ${document.title}`;
		}
	});
</script>

<ModeWatcher />

<svelte:head>
	<link rel="icon" href={favicon} />
	<link
		rel="preload"
		href={figtreeLatinUrl}
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	<link
		rel="preload"
		href={notoSansLatinUrl}
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
</svelte:head>

<Sidebar.Provider open={data.sidebarOpen}>
	<AppSidebar />
	<Sidebar.Inset>
		<Sidebar.Trigger
			data-testid="mobile-sidebar-trigger"
			class="fixed top-2 left-2 z-50 md:hidden"
		/>
		<Sidebar.Trigger
			data-testid="desktop-sidebar-trigger"
			variant="ghost"
			size="icon"
			class="hidden md:flex absolute top-3 left-3 z-10"
		/>
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
