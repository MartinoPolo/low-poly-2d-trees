<script lang="ts">
	import LabeledSlider from './LabeledSlider.svelte';
	import SectionCard from './SectionCard.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { hslToHex } from '$lib/trees/color.js';

	interface TrunkPreset {
		readonly name: string;
		readonly hue: number;
		readonly saturation: number;
		readonly lightness: number;
	}

	// .mpx/REQUIREMENTS.md §3.9 — Trunk color preset swatches.
	const TRUNK_PRESETS: readonly TrunkPreset[] = [
		{ name: 'Light birch', hue: 40, saturation: 20, lightness: 75 },
		{ name: 'Warm brown', hue: 25, saturation: 50, lightness: 35 },
		{ name: 'Dark brown', hue: 20, saturation: 55, lightness: 20 },
		{ name: 'Red-brown', hue: 10, saturation: 45, lightness: 30 },
		{ name: 'Gray', hue: 0, saturation: 5, lightness: 45 },
		{ name: 'White', hue: 0, saturation: 0, lightness: 90 },
		{ name: 'Black', hue: 0, saturation: 0, lightness: 10 },
		{ name: 'Dark charcoal', hue: 0, saturation: 5, lightness: 20 },
		{ name: 'Golden', hue: 45, saturation: 50, lightness: 50 },
		{ name: 'Pale yellow', hue: 50, saturation: 35, lightness: 65 },
	] as const;

	interface Props {
		hue: number;
		saturation: number;
		lightness: number;
		disabled?: boolean;
	}

	let {
		hue = $bindable(),
		saturation = $bindable(),
		lightness = $bindable(),
		disabled = false,
	}: Props = $props();

	function applyPreset(preset: TrunkPreset) {
		hue = preset.hue;
		saturation = preset.saturation;
		lightness = preset.lightness;
	}
</script>

<SectionCard title="Trunk Color" contentClass="space-y-4">
	<div class="space-y-2">
		<Label>Presets</Label>
		<div class="flex flex-wrap gap-2">
			{#each TRUNK_PRESETS as preset (preset.name)}
				<button
					type="button"
					aria-label={preset.name}
					title={preset.name}
					data-trunk-preset={preset.name}
					{disabled}
					onclick={() => applyPreset(preset)}
					style:background-color={hslToHex(
						preset.hue,
						preset.saturation,
						preset.lightness,
					)}
					class="h-9 w-9 rounded-md border border-input shadow-sm transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
				></button>
			{/each}
		</div>
	</div>
	<LabeledSlider label="Hue" min={0} max={360} unit="°" bind:value={hue} {disabled} />
	<LabeledSlider
		label="Saturation"
		min={0}
		max={100}
		unit="%"
		bind:value={saturation}
		{disabled}
	/>
	<!--
		Range kept at 5-100 so §2.6 birch default (80) and §2.7 "Light birch" (75) /
		"White" (90) presets land inside the slider. REQ-P-11 originally specified
		5-60 but the per-shape defaults table §2.6 and preset swatch table §2.7
		both exceed 60, so the slider bound is driven by data rather than the old
		control-range req.
	-->
	<LabeledSlider label="Lightness" min={5} max={100} unit="%" bind:value={lightness} {disabled} />
</SectionCard>
