<script lang="ts">
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import {
		SETTINGS_TIERS,
		isSettingsTier,
		use_settings_tier,
	} from '$lib/context/settings_tier.context.svelte.js';

	const { tier } = use_settings_tier();

	function onValueChange(value: string | undefined) {
		if (value !== undefined && isSettingsTier(value)) {
			tier.current = value;
		}
	}
</script>

<div
	data-testid="settings-tier-control"
	class="tier-toggle sticky top-0 z-10 bg-background py-4 px-px"
>
	<ToggleGroup.Root
		type="single"
		value={tier.current}
		{onValueChange}
		variant="outline"
		class="w-full rounded-xl ring-1 ring-foreground/10 shadow-none"
	>
		{#each Object.values(SETTINGS_TIERS) as tierValue (tierValue)}
			<ToggleGroup.Item value={tierValue} class="flex-1 capitalize">
				{tierValue}
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>
</div>

<style>
	.tier-toggle :global([data-slot='toggle-group-item']:first-child) {
		border-top-left-radius: var(--radius-xl);
		border-bottom-left-radius: var(--radius-xl);
	}

	.tier-toggle :global([data-slot='toggle-group-item']:last-child) {
		border-top-right-radius: var(--radius-xl);
		border-bottom-right-radius: var(--radius-xl);
	}

	.tier-toggle :global([data-slot='toggle-group-item']) {
		border-color: transparent;
		box-shadow: none;
	}
</style>
