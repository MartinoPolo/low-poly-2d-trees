import type { Component } from 'svelte';
import LeafSvg from '../assets/overlays/LeafSvg.svelte';
import RaindropSvg from '../assets/overlays/RaindropSvg.svelte';
import SnowflakeSvg from '../assets/overlays/SnowflakeSvg.svelte';
import WindParticleSvg from '../assets/overlays/WindParticleSvg.svelte';
import FireflySvg from '../assets/overlays/FireflySvg.svelte';
import CloudSvg from '../assets/overlays/CloudSvg.svelte';

export const OVERLAY_PARTICLE_TYPES = {
	leaf: 'leaf',
	raindrop: 'raindrop',
	snowflake: 'snowflake',
	windParticle: 'windParticle',
	firefly: 'firefly',
	cloud: 'cloud',
} as const;

type OverlayParticleType = (typeof OVERLAY_PARTICLE_TYPES)[keyof typeof OVERLAY_PARTICLE_TYPES];

interface OverlayDefinition {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly svgComponent: Component<any>;
	readonly scale: number;
	readonly defaultColor: string | null;
}

export const OVERLAY_DEFINITIONS = {
	[OVERLAY_PARTICLE_TYPES.leaf]: {
		svgComponent: LeafSvg,
		scale: 1,
		defaultColor: '#4a7a2a',
	},
	[OVERLAY_PARTICLE_TYPES.raindrop]: {
		svgComponent: RaindropSvg,
		scale: 1,
		defaultColor: '#4488cc',
	},
	[OVERLAY_PARTICLE_TYPES.snowflake]: {
		svgComponent: SnowflakeSvg,
		scale: 1,
		defaultColor: '#e8f0ff',
	},
	[OVERLAY_PARTICLE_TYPES.windParticle]: {
		svgComponent: WindParticleSvg,
		scale: 1,
		defaultColor: null,
	},
	[OVERLAY_PARTICLE_TYPES.firefly]: {
		svgComponent: FireflySvg,
		scale: 1,
		defaultColor: '#ffd700',
	},
	[OVERLAY_PARTICLE_TYPES.cloud]: {
		svgComponent: CloudSvg,
		scale: 1,
		defaultColor: null,
	},
} as const satisfies Record<OverlayParticleType, OverlayDefinition>;
