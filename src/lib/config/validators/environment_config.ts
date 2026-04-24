import type { EnvironmentConfig } from '$lib/environment/environment_config.js';
import { isObject, hasBoolean, hasNumber } from './helpers.js';

export function isValidEnvironmentConfig(value: unknown): value is EnvironmentConfig {
	if (!isObject(value)) {
		return false;
	}
	return (
		hasBoolean(value, 'rainEnabled') &&
		hasBoolean(value, 'lightningEnabled') &&
		hasBoolean(value, 'firefliesEnabled') &&
		hasBoolean(value, 'windParticlesEnabled') &&
		hasBoolean(value, 'snowEnabled') &&
		hasBoolean(value, 'sunRaysEnabled') &&
		hasBoolean(value, 'cloudsEnabled') &&
		hasNumber(value, 'rainIntensity')
	);
}
