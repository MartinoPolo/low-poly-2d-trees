export interface EnvironmentConfig {
	readonly rainEnabled: boolean;
	readonly lightningEnabled: boolean;
	readonly firefliesEnabled: boolean;
	readonly windParticlesEnabled: boolean;
	readonly snowEnabled: boolean;
	readonly sunRaysEnabled: boolean;
	readonly cloudsEnabled: boolean;
	readonly rainIntensity: number;
}

export const ENVIRONMENT_DEFAULTS: EnvironmentConfig = {
	rainEnabled: false,
	lightningEnabled: false,
	firefliesEnabled: false,
	windParticlesEnabled: false,
	snowEnabled: false,
	sunRaysEnabled: false,
	cloudsEnabled: false,
	rainIntensity: 50,
} as const;

export const ENVIRONMENT_LIMITS = {
	rainIntensityMin: 10,
	rainIntensityMax: 200,
} as const;

/** Shared viewport dimensions for all environment effect SVGs. */
export const ENVIRONMENT_VIEW_WIDTH = 800;
export const ENVIRONMENT_VIEW_HEIGHT = 600;

/** Per-effect seeds for deterministic generation. */
export const ENVIRONMENT_SEEDS = {
	rain: 123,
	snow: 99,
	fireflies: 77,
	wind: 55,
	clouds: 33,
} as const;
