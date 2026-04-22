import { GROUND_LIMITS } from '$lib/trees/ground/ground_types.js';

export interface StormCloudConfig {
	readonly enabled: boolean;
	readonly showRain: boolean;
}

export interface SpeechBubbleConfig {
	readonly enabled: boolean;
	readonly text: string;
}

export interface WiltingConfig {
	readonly enabled: boolean;
}

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
	readonly stormCloud: StormCloudConfig;
	readonly speechBubble: SpeechBubbleConfig;
	readonly wilting: WiltingConfig;
	readonly glow: GlowConfig;
}

export const OVERLAY_DEFAULTS: OverlayConfig = {
	stormCloud: { enabled: false, showRain: true },
	speechBubble: { enabled: false, text: '' },
	wilting: { enabled: false },
	glow: { enabled: false, color: '#ffd700', intensity: 3, pulse: false },
} as const;

export interface OverlayPersistedState {
	readonly stormCloudEnabled: boolean;
	readonly stormCloudShowRain: boolean;
	readonly speechBubbleEnabled: boolean;
	readonly speechBubbleText?: string;
	readonly wiltingEnabled: boolean;
	readonly glowEnabled: boolean;
	readonly glowColor: string;
	readonly glowIntensity: number;
	readonly glowPulse: boolean;
	readonly groundEnabled: boolean;
	readonly groundElementCount?: number;
	readonly groundElementSize?: number;
}

export const OVERLAY_PERSISTED_DEFAULTS: OverlayPersistedState = {
	stormCloudEnabled: false,
	stormCloudShowRain: true,
	speechBubbleEnabled: false,
	speechBubbleText: '',
	wiltingEnabled: false,
	glowEnabled: false,
	glowColor: '#ffd700',
	glowIntensity: 3,
	glowPulse: false,
	groundEnabled: false,
	groundElementCount: GROUND_LIMITS.countDefault,
	groundElementSize: GROUND_LIMITS.sizeDefault,
} as const;

export interface StormCloudTriangle {
	readonly points: string;
	readonly color: string;
}

export interface StormCloudGeometry {
	readonly triangles: readonly StormCloudTriangle[];
	readonly width: number;
	readonly height: number;
}

export interface RainLine {
	readonly x: number;
	readonly y: number;
	readonly length: number;
	readonly delay: number;
	readonly speed: number;
}

export interface SpeechBubbleGeometry {
	readonly path: string;
	readonly width: number;
	readonly height: number;
	readonly pointerPath: string;
}

export const OVERLAY_VIEWBOX_HEADROOM = 40;

export function hasActiveOverlay(config: OverlayConfig): boolean {
	return (
		config.stormCloud.enabled ||
		config.speechBubble.enabled ||
		config.wilting.enabled ||
		config.glow.enabled
	);
}

export function needsViewboxExpansion(config: OverlayConfig): boolean {
	return config.stormCloud.enabled;
}
