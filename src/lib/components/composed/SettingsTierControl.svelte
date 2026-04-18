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

<div data-testid="settings-tier-control" class="pb-4">
	<ToggleGroup.Root
		type="single"
		value={tier.current}
		{onValueChange}
		variant="outline"
		class="w-full"
	>
		{#each Object.values(SETTINGS_TIERS) as tierValue (tierValue)}
			<ToggleGroup.Item value={tierValue} class="flex-1 capitalize">
				{tierValue}
			</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>
</div>
