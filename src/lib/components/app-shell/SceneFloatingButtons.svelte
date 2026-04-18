<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Shuffle from '@lucide/svelte/icons/shuffle';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Save from '@lucide/svelte/icons/save';
	import { userPrefersMode, setMode } from 'mode-watcher';

	interface Props {
		onReset: () => void;
		onRandomize: () => void;
		showSave?: boolean;
		onSave?: () => void;
		saveDisabled?: boolean;
	}

	let { onReset, onRandomize, showSave = false, onSave, saveDisabled = false }: Props = $props();

	const THEME_CYCLE = ['light', 'dark', 'system'] as const;

	function cycleTheme() {
		const current = userPrefersMode.current ?? 'system';
		const currentIndex = THEME_CYCLE.indexOf(current as (typeof THEME_CYCLE)[number]);
		const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
		setMode(THEME_CYCLE[nextIndex]);
	}
</script>

<div data-testid="scene-floating-buttons" class="absolute top-4 right-4 z-10 flex flex-col gap-2">
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button
					variant="outline"
					size="icon"
					aria-label="Toggle theme"
					data-testid="floating-theme-toggle"
					onclick={cycleTheme}
					{...props}
				>
					{#if userPrefersMode.current === 'light'}
						<Sun />
					{:else if userPrefersMode.current === 'dark'}
						<Moon />
					{:else}
						<Monitor />
					{/if}
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="left">Theme</Tooltip.Content>
	</Tooltip.Root>

	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button
					variant="outline"
					size="icon"
					aria-label="Reset to defaults"
					data-testid="floating-reset"
					onclick={onReset}
					{...props}
				>
					<RotateCcw />
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="left">Reset to defaults</Tooltip.Content>
	</Tooltip.Root>

	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button
					variant="outline"
					size="icon"
					aria-label="Randomize seed"
					data-testid="floating-randomize"
					onclick={onRandomize}
					{...props}
				>
					<Shuffle />
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="left">Randomize seed</Tooltip.Content>
	</Tooltip.Root>

	{#if showSave}
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						variant="default"
						size="icon"
						aria-label="Save tree"
						data-testid="floating-save"
						onclick={onSave}
						disabled={saveDisabled}
						{...props}
					>
						<Save />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content side="left">Save tree</Tooltip.Content>
		</Tooltip.Root>
	{/if}
</div>
