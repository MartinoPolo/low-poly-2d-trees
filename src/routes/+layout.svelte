<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { setShowcaseFormContext } from '$lib/context/showcase_form.context.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import figtreeLatinUrl from '@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2?url';
	import notoSansLatinUrl from '@fontsource-variable/noto-sans/files/noto-sans-latin-wght-normal.woff2?url';

	let { children } = $props();

	setShowcaseFormContext();
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

{@render children()}
