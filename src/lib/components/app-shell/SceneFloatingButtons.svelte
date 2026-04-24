<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { mergeProps } from 'bits-ui';
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
					aria-label={m.tooltip_theme()}
					data-testid="floating-theme-toggle"
					{...mergeProps(props, { onclick: cycleTheme })}
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
		<Tooltip.Content side="left">{m.tooltip_theme()}</Tooltip.Content>
	</Tooltip.Root>

	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button
					variant="outline"
					size="icon"
					aria-label={m.tooltip_reset()}
					data-testid="floating-reset"
					{...mergeProps(props, { onclick: onReset })}
				>
					<RotateCcw />
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="left">{m.tooltip_reset()}</Tooltip.Content>
	</Tooltip.Root>

	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button
					variant="outline"
					size="icon"
					aria-label={m.tooltip_randomize()}
					data-testid="floating-randomize"
					{...mergeProps(props, { onclick: onRandomize })}
				>
					<Shuffle />
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="left">{m.tooltip_randomize()}</Tooltip.Content>
	</Tooltip.Root>

	{#if showSave}
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						variant="default"
						size="icon"
						aria-label={m.tooltip_save()}
						data-testid="floating-save"
						disabled={saveDisabled}
						{...mergeProps(props, { onclick: onSave })}
					>
						<Save />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content side="left">{m.tooltip_save()}</Tooltip.Content>
		</Tooltip.Root>
	{/if}
</div>
