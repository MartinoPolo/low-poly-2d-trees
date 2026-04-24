<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import ColorPickerInput from './ColorPickerInput.svelte';
	import SectionCard from './SectionCard.svelte';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		lightColor: string;
		darkColor: string;
		disabled?: boolean;
	}

	let { lightColor = $bindable(), darkColor = $bindable(), disabled = false }: Props = $props();
</script>

<SectionCard title={m.section_canopy_color()} contentClass="space-y-4">
	<div class="space-y-2">
		<Label for="canopy-light-color">{m.label_light_color()}</Label>
		<div class="relative flex items-center gap-3">
			<ColorPickerInput
				bind:value={lightColor}
				id="canopy-light-color"
				ariaLabel="Pick light canopy color"
				swatchTestId="canopy-light"
				hexTestId="canopy-light"
				{disabled}
			/>
		</div>
	</div>
	<div class="space-y-2">
		<Label for="canopy-dark-color">{m.label_dark_color()}</Label>
		<div class="relative flex items-center gap-3">
			<ColorPickerInput
				bind:value={darkColor}
				id="canopy-dark-color"
				ariaLabel="Pick dark canopy color"
				swatchTestId="canopy-dark"
				hexTestId="canopy-dark"
				{disabled}
			/>
		</div>
	</div>
</SectionCard>
