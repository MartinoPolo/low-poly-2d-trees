<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
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
	<div class="flex items-center gap-2">
		<Checkbox
			data-testid="overlay-storm-cloud"
			checked={overlayConfig.stormCloudEnabled}
			onCheckedChange={(v) => (overlayConfig.stormCloudEnabled = v === true)}
		/>
		<Label>Storm Cloud</Label>
	</div>
	{#if overlayConfig.stormCloudEnabled}
		<div class="ml-6 flex items-center gap-2">
			<Checkbox
				data-testid="overlay-storm-rain"
				checked={overlayConfig.stormCloudShowRain}
				onCheckedChange={(v) => (overlayConfig.stormCloudShowRain = v === true)}
			/>
			<Label class="text-xs">Show Rain</Label>
		</div>
	{/if}

	<div class="flex items-center gap-2">
		<Checkbox
			data-testid="overlay-speech-bubble"
			checked={overlayConfig.speechBubbleEnabled}
			onCheckedChange={(v) => (overlayConfig.speechBubbleEnabled = v === true)}
		/>
		<Label>Speech Bubble</Label>
	</div>
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

	<div class="flex items-center gap-2">
		<Checkbox
			data-testid="overlay-wilting"
			checked={overlayConfig.wiltingEnabled}
			onCheckedChange={(v) => (overlayConfig.wiltingEnabled = v === true)}
		/>
		<Label>Wilting</Label>
	</div>

	<div class="flex items-center gap-2">
		<Checkbox
			data-testid="overlay-glow"
			checked={overlayConfig.glowEnabled}
			onCheckedChange={(v) => (overlayConfig.glowEnabled = v === true)}
		/>
		<Label>Glow</Label>
	</div>
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
			<div class="flex items-center gap-2">
				<Checkbox
					data-testid="overlay-glow-pulse"
					checked={overlayConfig.glowPulse}
					onCheckedChange={(v) => (overlayConfig.glowPulse = v === true)}
				/>
				<Label class="text-xs">Pulse</Label>
			</div>
		</div>
	{/if}

	<div class="flex items-center gap-2">
		<Checkbox
			data-testid="overlay-ground"
			checked={overlayConfig.groundEnabled}
			onCheckedChange={(v) => (overlayConfig.groundEnabled = v === true)}
		/>
		<Label>Ground Elements</Label>
	</div>
</SectionCard>
