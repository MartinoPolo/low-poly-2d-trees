<script lang="ts">
	import LabeledSlider from './LabeledSlider.svelte';
	import SectionCard from './SectionCard.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { hslToHex } from '$lib/trees/color.js';
	import { m } from '$lib/paraglide/messages.js';

	interface TrunkPreset {
		readonly id: string;
		readonly hue: number;
		readonly saturation: number;
		readonly lightness: number;
	}

	// .mpx/REQUIREMENTS.md §3.9 — Trunk color preset swatches.
	const TRUNK_PRESETS: readonly TrunkPreset[] = [
		{ id: 'light_birch', hue: 40, saturation: 20, lightness: 75 },
		{ id: 'warm_brown', hue: 25, saturation: 50, lightness: 35 },
		{ id: 'dark_brown', hue: 20, saturation: 55, lightness: 20 },
		{ id: 'red_brown', hue: 10, saturation: 45, lightness: 30 },
		{ id: 'gray', hue: 0, saturation: 5, lightness: 45 },
		{ id: 'white', hue: 0, saturation: 0, lightness: 90 },
		{ id: 'black', hue: 0, saturation: 0, lightness: 10 },
		{ id: 'dark_charcoal', hue: 0, saturation: 5, lightness: 20 },
		{ id: 'golden', hue: 45, saturation: 50, lightness: 50 },
		{ id: 'pale_yellow', hue: 50, saturation: 35, lightness: 65 },
	] as const;

	const PRESET_NAMES: Record<string, () => string> = {
		light_birch: () => m.preset_light_birch(),
		warm_brown: () => m.preset_warm_brown(),
		dark_brown: () => m.preset_dark_brown(),
		red_brown: () => m.preset_red_brown(),
		gray: () => m.preset_gray(),
		white: () => m.preset_white(),
		black: () => m.preset_black(),
		dark_charcoal: () => m.preset_dark_charcoal(),
		golden: () => m.preset_golden(),
		pale_yellow: () => m.preset_pale_yellow(),
	};

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

<SectionCard title={m.section_trunk_color()} contentClass="space-y-4">
	<div class="space-y-2">
		<Label>{m.label_presets()}</Label>
		<div class="flex flex-wrap gap-2">
			{#each TRUNK_PRESETS as preset (preset.id)}
				<button
					type="button"
					aria-label={PRESET_NAMES[preset.id]?.() ?? preset.id}
					title={PRESET_NAMES[preset.id]?.() ?? preset.id}
					data-trunk-preset={preset.id}
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
	<LabeledSlider
		label={m.label_hue()}
		id="input-hue"
		min={0}
		max={360}
		unit="°"
		bind:value={hue}
		{disabled}
	/>
	<LabeledSlider
		label={m.label_saturation()}
		id="input-saturation"
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
	<LabeledSlider
		label={m.label_lightness()}
		id="input-lightness"
		min={5}
		max={100}
		unit="%"
		bind:value={lightness}
		{disabled}
	/>
</SectionCard>
