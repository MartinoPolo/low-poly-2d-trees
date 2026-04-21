<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import LabeledCheckbox from '$lib/components/composed/LabeledCheckbox.svelte';
	import LabeledSlider from '$lib/components/composed/LabeledSlider.svelte';
	import SectionCard from '$lib/components/composed/SectionCard.svelte';
	import type { createOverlayConfigContext } from '$lib/trees/overlays/overlay_config.context.svelte.js';
	import { GLOW_LIMITS } from '$lib/trees/overlays/overlay_types.js';

	interface Props {
		overlayConfig: ReturnType<typeof createOverlayConfigContext>;
	}

	let { overlayConfig }: Props = $props();
</script>

<SectionCard title="Overlays" contentClass="space-y-4">
	<LabeledCheckbox
		label="Storm Cloud"
		checked={overlayConfig.stormCloudEnabled}
		onchange={(v) => (overlayConfig.stormCloudEnabled = v)}
		testId="overlay-storm-cloud"
	/>
	{#if overlayConfig.stormCloudEnabled}
		<LabeledCheckbox
			label="Show Rain"
			checked={overlayConfig.stormCloudShowRain}
			onchange={(v) => (overlayConfig.stormCloudShowRain = v)}
			testId="overlay-storm-rain"
			labelClass="text-xs"
			class="ml-6"
		/>
	{/if}

	<LabeledCheckbox
		label="Speech Bubble"
		checked={overlayConfig.speechBubbleEnabled}
		onchange={(v) => (overlayConfig.speechBubbleEnabled = v)}
		testId="overlay-speech-bubble"
	/>
	{#if overlayConfig.speechBubbleEnabled}
		<div class="ml-6">
			<Input
				data-testid="overlay-speech-text"
				type="text"
				placeholder="Enter text..."
				bind:value={overlayConfig.speechBubbleText}
			/>
		</div>
	{/if}

	<LabeledCheckbox
		label="Wilting"
		checked={overlayConfig.wiltingEnabled}
		onchange={(v) => (overlayConfig.wiltingEnabled = v)}
		testId="overlay-wilting"
	/>

	<LabeledCheckbox
		label="Glow"
		checked={overlayConfig.glowEnabled}
		onchange={(v) => (overlayConfig.glowEnabled = v)}
		testId="overlay-glow"
	/>
	{#if overlayConfig.glowEnabled}
		<div class="ml-6 space-y-2">
			<LabeledSlider
				label="Intensity"
				min={GLOW_LIMITS.intensityMin}
				max={GLOW_LIMITS.intensityMax}
				step={0.5}
				bind:value={overlayConfig.glowIntensity}
			/>
			<div class="flex items-center gap-2">
				<Label class="text-xs">Color</Label>
				<input
					type="color"
					bind:value={overlayConfig.glowColor}
					class="h-6 w-8 cursor-pointer rounded border"
				/>
			</div>
			<LabeledCheckbox
				label="Pulse"
				checked={overlayConfig.glowPulse}
				onchange={(v) => (overlayConfig.glowPulse = v)}
				testId="overlay-glow-pulse"
				labelClass="text-xs"
			/>
		</div>
	{/if}

	<LabeledCheckbox
		label="Ground Elements"
		checked={overlayConfig.groundEnabled}
		onchange={(v) => (overlayConfig.groundEnabled = v)}
		testId="overlay-ground"
	/>
</SectionCard>
