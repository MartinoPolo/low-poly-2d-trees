<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import TreePine from '@lucide/svelte/icons/tree-pine';
	import Trees from '@lucide/svelte/icons/trees';
	import Images from '@lucide/svelte/icons/images';
	import Settings from '@lucide/svelte/icons/settings';
	import LogIn from '@lucide/svelte/icons/log-in';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';

	const rootPath = resolve('/');
	const editorPath = resolve('/editor');
	const galleryPath = resolve('/gallery');
	const settingsPath = resolve('/settings');
	const authPath = resolve('/auth');
	const signOutPath = resolve('/auth/sign-out');

	const user = $derived(page.data.user);
</script>

<Sidebar.Root collapsible="icon">
	<Sidebar.Header>
		<div class="flex items-center gap-2 px-2 py-1.5">
			<TreePine class="size-5 text-primary" />
			<span class="font-semibold group-data-[collapsible=icon]:hidden">Low-Poly Trees</span>
		</div>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname === rootPath}
							tooltipContent="Scene Editor"
						>
							{#snippet child({ props })}
								<a href={rootPath} {...props}>
									<Trees />
									<span>Scene Editor</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname === editorPath}
							tooltipContent="Single Editor"
						>
							{#snippet child({ props })}
								<a href={resolve('/editor')} {...props}>
									<TreePine />
									<span>Single Editor</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname === galleryPath}
							tooltipContent="Gallery"
						>
							{#snippet child({ props })}
								<a href={resolve('/gallery')} {...props}>
									<Images />
									<span>Gallery</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer>
		<div class="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
			<DarkModeToggle />
		</div>
		{#if user}
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						isActive={page.url.pathname === settingsPath}
						tooltipContent="Settings"
					>
						{#snippet child({ props })}
							<a href={settingsPath} {...props}>
								<Settings />
								<span>Settings</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
				<Sidebar.MenuItem>
					<div
						class="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:hidden"
					>
						{#if user.image}
							<img
								src={user.image}
								alt={user.name}
								class="size-8 rounded-full object-cover"
							/>
						{:else}
							<div
								class="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold"
							>
								{user.name.slice(0, 2).toUpperCase()}
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{user.name}</p>
							<p class="truncate text-xs text-muted-foreground">{user.email}</p>
						</div>
					</div>
					<form method="POST" action={signOutPath}>
						<Sidebar.MenuButton
							data-testid="sidebar-sign-out"
							tooltipContent="Sign out"
						>
							{#snippet child({ props })}
								<button type="submit" {...props}>
									<LogOut />
									<span>Sign out</span>
								</button>
							{/snippet}
						</Sidebar.MenuButton>
					</form>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		{:else}
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton data-testid="sidebar-sign-in" tooltipContent="Sign in">
						{#snippet child({ props })}
							<a href={authPath} {...props}>
								<LogIn />
								<span>Sign in</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		{/if}
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
