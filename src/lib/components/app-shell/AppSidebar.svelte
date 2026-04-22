<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import TreePine from '@lucide/svelte/icons/tree-pine';
	import Trees from '@lucide/svelte/icons/trees';
	import Images from '@lucide/svelte/icons/images';
	import Crosshair from '@lucide/svelte/icons/crosshair';
	import Presentation from '@lucide/svelte/icons/presentation';
	import Settings from '@lucide/svelte/icons/settings';
	import LogIn from '@lucide/svelte/icons/log-in';
	import LogOut from '@lucide/svelte/icons/log-out';
	import User from '@lucide/svelte/icons/user';
	import Sun from '@lucide/svelte/icons/sun';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import AvatarCircle from '$lib/avatar/AvatarCircle.svelte';
	import { use_avatar } from '$lib/context/avatar.context.svelte.js';
	import { userPrefersMode, setMode } from 'mode-watcher';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const rootPath = resolve('/');
	const editorPath = resolve('/editor');
	const galleryPath = resolve('/gallery');
	const pointEditorPath = resolve('/point-editor');
	const showcasePath = resolve('/showcase');
	const settingsPath = resolve('/settings');
	const authPath = resolve('/auth/sign-in');
	const signOutPath = resolve('/auth/sign-out');

	const user = $derived(page.data.user);
	const { avatar } = use_avatar();

	let signOutFormElement = $state<HTMLFormElement>();
</script>

{#snippet themeSubmenu()}
	<DropdownMenu.Sub>
		<DropdownMenu.SubTrigger data-testid="sidebar-theme-trigger">
			<Sun />
			Theme
		</DropdownMenu.SubTrigger>
		<DropdownMenu.SubContent>
			<DropdownMenu.RadioGroup
				value={userPrefersMode.current}
				onValueChange={(v) => setMode(v as Parameters<typeof setMode>[0])}
			>
				<DropdownMenu.RadioItem value="light">Light</DropdownMenu.RadioItem>
				<DropdownMenu.RadioItem value="dark">Dark</DropdownMenu.RadioItem>
				<DropdownMenu.RadioItem value="system">System</DropdownMenu.RadioItem>
			</DropdownMenu.RadioGroup>
		</DropdownMenu.SubContent>
	</DropdownMenu.Sub>
{/snippet}

<Sidebar.Root collapsible="offcanvas">
	<Sidebar.Header>
		<a href={rootPath} class="flex items-center gap-2 px-2 py-1.5">
			<TreePine class="size-5 text-primary" />
			<span class="font-semibold">Low-Poly Trees</span>
		</a>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
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
								<a href={editorPath} {...props}>
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
								<a href={galleryPath} {...props}>
									<Images />
									<span>Gallery</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname === pointEditorPath}
							tooltipContent="Point Editor"
						>
							{#snippet child({ props })}
								<a href={pointEditorPath} {...props}>
									<Crosshair />
									<span>Point Editor</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname === showcasePath}
							tooltipContent="Showcase"
						>
							{#snippet child({ props })}
								<a href={showcasePath} {...props}>
									<Presentation />
									<span>Showcase</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer>
		{#if user}
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props: triggerProps })}
								<Sidebar.MenuButton
									size="lg"
									class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
									tooltipContent={user.name}
									{...triggerProps}
								>
									{#snippet child({ props })}
										<div data-testid="sidebar-user-trigger" {...props}>
											<AvatarCircle
												preset={avatar.current.preset}
												color={avatar.current.color}
												size="sm"
											/>
											<div
												class="grid flex-1 text-left text-sm leading-tight"
											>
												<span class="truncate font-medium">{user.name}</span
												>
												<span class="truncate text-xs text-muted-foreground"
													>{user.email}</span
												>
											</div>
											<ChevronsUpDown class="ml-auto size-4" />
										</div>
									{/snippet}
								</Sidebar.MenuButton>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content
							side="top"
							class="w-(--bits-dropdown-menu-anchor-width)"
						>
							<DropdownMenu.Label>
								<div class="flex flex-col">
									<span class="text-sm font-medium">{user.name}</span>
									<span class="text-xs text-muted-foreground">{user.email}</span>
								</div>
							</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								data-testid="sidebar-dropdown-settings"
								onclick={() => goto(settingsPath)}
							>
								<Settings />
								Settings
							</DropdownMenu.Item>
							{@render themeSubmenu()}
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								data-testid="sidebar-dropdown-sign-out"
								onclick={() => signOutFormElement?.requestSubmit()}
							>
								<LogOut />
								Sign out
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					<form
						bind:this={signOutFormElement}
						method="POST"
						action={signOutPath}
						class="hidden"
					></form>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		{:else}
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props: triggerProps })}
								<Sidebar.MenuButton
									size="lg"
									class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
									tooltipContent="Guest"
									{...triggerProps}
								>
									{#snippet child({ props })}
										<div data-testid="sidebar-guest-trigger" {...props}>
											<div
												class="flex size-8 items-center justify-center rounded-full bg-muted"
											>
												<User class="size-4 text-muted-foreground" />
											</div>
											<div
												class="grid flex-1 text-left text-sm leading-tight"
											>
												<span class="truncate font-medium">Guest</span>
											</div>
											<ChevronsUpDown class="ml-auto size-4" />
										</div>
									{/snippet}
								</Sidebar.MenuButton>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content
							side="top"
							class="w-(--bits-dropdown-menu-anchor-width)"
						>
							{@render themeSubmenu()}
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								data-testid="sidebar-dropdown-sign-in"
								onclick={() => goto(authPath)}
							>
								<LogIn />
								Sign in
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		{/if}
	</Sidebar.Footer>
</Sidebar.Root>
