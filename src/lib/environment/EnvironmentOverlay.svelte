<script lang="ts">
	import type { EnvironmentConfig } from './environment_config.js';
	import CloudsEffect from './effects/CloudsEffect.svelte';
	import SunRaysEffect from './effects/SunRaysEffect.svelte';
	import RainEffect from './effects/RainEffect.svelte';
	import SnowEffect from './effects/SnowEffect.svelte';
	import WindParticlesEffect from './effects/WindParticlesEffect.svelte';
	import FirefliesEffect from './effects/FirefliesEffect.svelte';
	import LightningEffect from './effects/LightningEffect.svelte';

	interface Props {
		config: EnvironmentConfig;
		lightAngle: number;
	}

	const { config, lightAngle }: Props = $props();
</script>

<div
	data-testid="environment-overlay"
	style="position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 10;"
>
	{#if config.cloudsEnabled}
		<CloudsEffect />
	{/if}
	{#if config.sunRaysEnabled}
		<SunRaysEffect {lightAngle} />
	{/if}
	{#if config.rainEnabled}
		<RainEffect intensity={config.rainIntensity} />
	{/if}
	{#if config.snowEnabled}
		<SnowEffect />
	{/if}
	{#if config.windParticlesEnabled}
		<WindParticlesEffect />
	{/if}
	{#if config.firefliesEnabled}
		<FirefliesEffect />
	{/if}
	{#if config.lightningEnabled}
		<LightningEffect />
	{/if}
</div>
