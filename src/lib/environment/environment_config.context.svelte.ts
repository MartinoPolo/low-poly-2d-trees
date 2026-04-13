import { ENVIRONMENT_DEFAULTS } from './environment_config.js';

class EnvironmentConfigState {
	rainEnabled = $state(ENVIRONMENT_DEFAULTS.rainEnabled);
	lightningEnabled = $state(ENVIRONMENT_DEFAULTS.lightningEnabled);
	firefliesEnabled = $state(ENVIRONMENT_DEFAULTS.firefliesEnabled);
	windParticlesEnabled = $state(ENVIRONMENT_DEFAULTS.windParticlesEnabled);
	snowEnabled = $state(ENVIRONMENT_DEFAULTS.snowEnabled);
	sunRaysEnabled = $state(ENVIRONMENT_DEFAULTS.sunRaysEnabled);
	cloudsEnabled = $state(ENVIRONMENT_DEFAULTS.cloudsEnabled);
	rainIntensity = $state(ENVIRONMENT_DEFAULTS.rainIntensity);
}

export function createEnvironmentConfigContext() {
	return new EnvironmentConfigState();
}
