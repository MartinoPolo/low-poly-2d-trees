<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import AppSidebar from '$lib/components/app-shell/AppSidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import favicon from '$lib/assets/favicon.svg';
	import figtreeLatinUrl from '@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2?url';
	import notoSansLatinUrl from '@fontsource-variable/noto-sans/files/noto-sans-latin-wght-normal.woff2?url';
	import { set_settings_tier_context } from '$lib/context/settings_tier.context.svelte.js';

	let { data, children } = $props();

	set_settings_tier_context();
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
