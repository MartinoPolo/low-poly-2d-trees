<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import TreePine from '@lucide/svelte/icons/tree-pine';
	import Trees from '@lucide/svelte/icons/trees';
	import Images from '@lucide/svelte/icons/images';
	import Settings from '@lucide/svelte/icons/settings';
	import LogIn from '@lucide/svelte/icons/log-in';
	import LogOut from '@lucide/svelte/icons/log-out';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Monitor from '@lucide/svelte/icons/monitor';
	import { userPrefersMode, setMode } from 'mode-watcher';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const rootPath = resolve('/');
	const editorPath = resolve('/editor');
	const galleryPath = resolve('/gallery');
	const settingsPath = resolve('/settings');
	const authPath = resolve('/auth');
	const signOutPath = resolve('/auth/sign-out');

	const THEME_MODES = ['light', 'system', 'dark'] as const;
	type ThemeMode = (typeof THEME_MODES)[number];

	const user = $derived(page.data.user);

	let signOutFormElement = $state<HTMLFormElement>();
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
											<div
												class="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden"
											>
												<span class="truncate font-medium">{user.name}</span
												>
												<span class="truncate text-xs text-muted-foreground"
													>{user.email}</span
												>
											</div>
											<ChevronsUpDown
												class="ml-auto size-4 group-data-[collapsible=icon]:hidden"
											/>
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
							<DropdownMenu.Separator />
							<DropdownMenu.Sub>
								<DropdownMenu.SubTrigger data-testid="sidebar-dropdown-theme">
									{#if userPrefersMode.current === 'light'}
										<Sun />
									{:else if userPrefersMode.current === 'dark'}
										<Moon />
									{:else}
										<Monitor />
									{/if}
									Theme
								</DropdownMenu.SubTrigger>
								<DropdownMenu.SubContent>
									<DropdownMenu.RadioGroup
										value={userPrefersMode.current}
										onValueChange={(value) => {
											if (
												typeof value === 'string' &&
												(THEME_MODES as readonly string[]).includes(value)
											)
												setMode(value as ThemeMode);
										}}
									>
										<DropdownMenu.RadioItem
											value="light"
											data-testid="sidebar-dropdown-theme-light"
										>
											<Sun />
											Light
										</DropdownMenu.RadioItem>
										<DropdownMenu.RadioItem
											value="system"
											data-testid="sidebar-dropdown-theme-system"
										>
											<Monitor />
											System
										</DropdownMenu.RadioItem>
										<DropdownMenu.RadioItem
											value="dark"
											data-testid="sidebar-dropdown-theme-dark"
										>
											<Moon />
											Dark
										</DropdownMenu.RadioItem>
									</DropdownMenu.RadioGroup>
								</DropdownMenu.SubContent>
							</DropdownMenu.Sub>
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
