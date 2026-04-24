<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import LabeledCheckbox from '$lib/components/composed/LabeledCheckbox.svelte';
	import LabeledSlider from '$lib/components/composed/LabeledSlider.svelte';
	import SectionCard from '$lib/components/composed/SectionCard.svelte';
	import { useOverlayConfig } from '$lib/trees/overlays/overlay_config.context.svelte.js';
	import { GLOW_LIMITS } from '$lib/trees/overlays/overlay_types.js';
	import { GROUND_LIMITS } from '$lib/trees/ground/ground_types.js';
	import { m } from '$lib/paraglide/messages.js';

	const overlayConfig = useOverlayConfig();
</script>

<SectionCard title={m.section_overlays()} contentClass="space-y-4">
	<LabeledCheckbox
		label={m.label_glow()}
		id="input-glow"
		checked={overlayConfig.glowEnabled.current}
		onchange={(v) => (overlayConfig.glowEnabled.current = v)}
		testId="overlay-glow"
	/>
	{#if overlayConfig.glowEnabled.current}
		<div class="ml-6 space-y-2">
			<LabeledSlider
				label={m.label_glow_intensity()}
				id="input-intensity"
				min={GLOW_LIMITS.intensityMin}
				max={GLOW_LIMITS.intensityMax}
				step={0.5}
				bind:value={overlayConfig.glowIntensity.current}
			/>
			<div class="flex items-center gap-2">
				<Label class="text-xs">{m.label_glow_color()}</Label>
				<input
					type="color"
					bind:value={overlayConfig.glowColor.current}
					class="h-6 w-8 cursor-pointer rounded border"
				/>
			</div>
			<LabeledCheckbox
				label={m.label_pulse()}
				id="input-pulse"
				checked={overlayConfig.glowPulse.current}
				onchange={(v) => (overlayConfig.glowPulse.current = v)}
				testId="overlay-glow-pulse"
				labelClass="text-xs"
			/>
		</div>
	{/if}

	<LabeledCheckbox
		label={m.label_ground_elements()}
		id="input-ground-elements"
		checked={overlayConfig.groundEnabled.current}
		onchange={(v) => (overlayConfig.groundEnabled.current = v)}
		testId="overlay-ground"
	/>
	{#if overlayConfig.groundEnabled.current}
		<div class="ml-6 space-y-2">
			<LabeledSlider
				label={m.label_element_count()}
				id="input-element-count"
				min={GROUND_LIMITS.countMin}
				max={GROUND_LIMITS.countMax}
				bind:value={overlayConfig.groundElementCount.current}
			/>
			<LabeledSlider
				label={m.label_element_size()}
				id="input-element-size"
				min={GROUND_LIMITS.sizeMin}
				max={GROUND_LIMITS.sizeMax}
				step={GROUND_LIMITS.sizeStep}
				bind:value={overlayConfig.groundElementSize.current}
			/>
		</div>
	{/if}
</SectionCard>
