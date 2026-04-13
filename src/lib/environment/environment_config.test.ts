import { describe, expect, it } from 'vitest';
import {
	ENVIRONMENT_DEFAULTS,
	ENVIRONMENT_LIMITS,
	type EnvironmentConfig,
} from './environment_config.js';

describe('EnvironmentConfig', () => {
	it('defaults all toggles to false', () => {
		const toggleKeys: (keyof EnvironmentConfig)[] = [
			'rainEnabled',
			'lightningEnabled',
			'firefliesEnabled',
			'windParticlesEnabled',
			'snowEnabled',
			'sunRaysEnabled',
			'cloudsEnabled',
		];
		for (const key of toggleKeys) {
			expect(ENVIRONMENT_DEFAULTS[key]).toBe(false);
		}
	});

	it('defaults rainIntensity to 50', () => {
		expect(ENVIRONMENT_DEFAULTS.rainIntensity).toBe(50);
	});

	it('defines rain intensity limits', () => {
		expect(ENVIRONMENT_LIMITS.rainIntensityMin).toBe(10);
		expect(ENVIRONMENT_LIMITS.rainIntensityMax).toBe(200);
	});

	it('has exactly 7 toggle keys plus rainIntensity', () => {
		const keys = Object.keys(ENVIRONMENT_DEFAULTS);
		expect(keys).toHaveLength(8);
		expect(keys.filter((k) => k.endsWith('Enabled'))).toHaveLength(7);
		expect(keys).toContain('rainIntensity');
	});
});
