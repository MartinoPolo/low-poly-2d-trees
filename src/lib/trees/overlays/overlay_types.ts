import { GROUND_LIMITS } from '$lib/trees/ground/ground_types.js';

export interface GlowConfig {
	readonly enabled: boolean;
	readonly color: string;
	readonly intensity: number;
	readonly pulse: boolean;
}

export const GLOW_LIMITS = {
	intensityMin: 1,
	intensityMax: 5,
} as const;

export interface OverlayConfig {
	readonly glow: GlowConfig;
}

export const OVERLAY_DEFAULTS: OverlayConfig = {
	glow: { enabled: false, color: '#ffd700', intensity: 3, pulse: false },
} as const;

export interface OverlayPersistedState {
	readonly glowEnabled: boolean;
	readonly glowColor: string;
	readonly glowIntensity: number;
	readonly glowPulse: boolean;
	readonly groundEnabled: boolean;
	readonly groundElementCount?: number;
	readonly groundElementSize?: number;
}

export const OVERLAY_PERSISTED_DEFAULTS: OverlayPersistedState = {
	glowEnabled: false,
	glowColor: '#ffd700',
	glowIntensity: 3,
	glowPulse: false,
	groundEnabled: false,
	groundElementCount: GROUND_LIMITS.countDefault,
	groundElementSize: GROUND_LIMITS.sizeDefault,
} as const;

export interface RainLine {
	readonly x: number;
	readonly y: number;
	readonly length: number;
	readonly delay: number;
	readonly speed: number;
}

export const OVERLAY_VIEWBOX_HEADROOM = 40;

export function hasActiveOverlay(config: OverlayConfig): boolean {
	return config.glow.enabled;
}
