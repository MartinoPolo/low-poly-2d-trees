<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import SectionCard from './SectionCard.svelte';

	interface Props {
		lightColor: string;
		darkColor: string;
		disabled?: boolean;
	}

	let { lightColor = $bindable(), darkColor = $bindable(), disabled = false }: Props = $props();
</script>

<SectionCard title="Canopy Color" contentClass="space-y-4">
	<div class="space-y-2">
		<Label for="canopy-light-color">Light Color</Label>
		<div class="flex items-center gap-3">
			<input
				type="color"
				id="canopy-light-color"
				bind:value={lightColor}
				{disabled}
				class="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
			/>
			<span class="font-mono text-sm tabular-nums text-muted-foreground">{lightColor}</span>
		</div>
	</div>
	<div class="space-y-2">
		<Label for="canopy-dark-color">Dark Color</Label>
		<div class="flex items-center gap-3">
			<input
				type="color"
				id="canopy-dark-color"
				bind:value={darkColor}
				{disabled}
				class="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
			/>
			<span class="font-mono text-sm tabular-nums text-muted-foreground">{darkColor}</span>
		</div>
	</div>
</SectionCard>
