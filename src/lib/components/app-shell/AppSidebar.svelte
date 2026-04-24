<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
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
	import { page } from '$app/state';
	import Globe from '@lucide/svelte/icons/globe';
	import { getLocale, locales, setLocale } from '$lib/paraglide/runtime.js';
	import { localizedResolve } from '$lib/i18n/localized_resolve.js';

	const rootPath = localizedResolve('/');
	const editorPath = localizedResolve('/editor');
	const galleryPath = localizedResolve('/gallery');
	const pointEditorPath = localizedResolve('/point-editor');
	const showcasePath = localizedResolve('/showcase');
	const settingsPath = localizedResolve('/settings');
	const authPath = localizedResolve('/auth/sign-in');
	const signOutPath = localizedResolve('/auth/sign-out');

	const user = $derived(page.data.user);
	const { avatar } = use_avatar();

	let signOutFormElement = $state<HTMLFormElement>();

	const LOCALE_LABELS: Record<string, string> = {
		en: 'English',
		cs: 'Čeština',
	};
</script>

{#snippet languageSwitcher()}
	<DropdownMenu.Sub>
		<DropdownMenu.SubTrigger>
			<Globe />
			{m.lang_switcher()}
		</DropdownMenu.SubTrigger>
		<DropdownMenu.SubContent>
			<DropdownMenu.RadioGroup
				value={getLocale()}
				onValueChange={(locale) => setLocale(locale as (typeof locales)[number])}
			>
				{#each locales as locale (locale)}
					<DropdownMenu.RadioItem value={locale}>
						{LOCALE_LABELS[locale] ?? locale}
					</DropdownMenu.RadioItem>
				{/each}
			</DropdownMenu.RadioGroup>
		</DropdownMenu.SubContent>
	</DropdownMenu.Sub>
{/snippet}

{#snippet themeSubmenu()}
	<DropdownMenu.Sub>
		<DropdownMenu.SubTrigger data-testid="sidebar-theme-trigger">
			<Sun />
			{m.theme()}
		</DropdownMenu.SubTrigger>
		<DropdownMenu.SubContent>
			<DropdownMenu.RadioGroup
				value={userPrefersMode.current}
				onValueChange={(v) => setMode(v as Parameters<typeof setMode>[0])}
			>
				<DropdownMenu.RadioItem value="light">{m.theme_light()}</DropdownMenu.RadioItem>
				<DropdownMenu.RadioItem value="dark">{m.theme_dark()}</DropdownMenu.RadioItem>
				<DropdownMenu.RadioItem value="system">{m.theme_system()}</DropdownMenu.RadioItem>
			</DropdownMenu.RadioGroup>
		</DropdownMenu.SubContent>
	</DropdownMenu.Sub>
{/snippet}

<Sidebar.Root collapsible="offcanvas">
	<Sidebar.Header>
		<a href={rootPath} class="flex items-center gap-2 px-2 py-1.5">
			<TreePine class="size-5 text-primary" />
			<span class="font-semibold">{m.app_name()}</span>
		</a>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname === rootPath}
							tooltipContent={m.nav_scene_editor()}
						>
							{#snippet child({ props })}
								<a href={rootPath} {...props}>
									<Trees />
									<span>{m.nav_scene_editor()}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname === editorPath}
							tooltipContent={m.nav_single_editor()}
						>
							{#snippet child({ props })}
								<a href={editorPath} {...props}>
									<TreePine />
									<span>{m.nav_single_editor()}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname === galleryPath}
							tooltipContent={m.nav_gallery()}
						>
							{#snippet child({ props })}
								<a href={galleryPath} {...props}>
									<Images />
									<span>{m.nav_gallery()}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname === pointEditorPath}
							tooltipContent={m.nav_point_editor()}
						>
							{#snippet child({ props })}
								<a href={pointEditorPath} {...props}>
									<Crosshair />
									<span>{m.nav_point_editor()}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname === showcasePath}
							tooltipContent={m.nav_showcase()}
						>
							{#snippet child({ props })}
								<a href={showcasePath} {...props}>
									<Presentation />
									<span>{m.nav_showcase()}</span>
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
								{m.nav_settings()}
							</DropdownMenu.Item>
							{@render themeSubmenu()}
							{@render languageSwitcher()}
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								data-testid="sidebar-dropdown-sign-out"
								onclick={() => signOutFormElement?.requestSubmit()}
							>
								<LogOut />
								{m.nav_sign_out()}
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
									tooltipContent={m.nav_guest()}
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
												<span class="truncate font-medium"
													>{m.nav_guest()}</span
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
							{@render themeSubmenu()}
							{@render languageSwitcher()}
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								data-testid="sidebar-dropdown-sign-in"
								onclick={() => goto(authPath)}
							>
								<LogIn />
								{m.nav_sign_in()}
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		{/if}
	</Sidebar.Footer>
</Sidebar.Root>
