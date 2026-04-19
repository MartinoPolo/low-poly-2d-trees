import { browser } from '$app/environment';
import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
import { isValidEnvironmentConfig } from '$lib/config/validators.js';
import { ENVIRONMENT_DEFAULTS, type EnvironmentConfig } from './environment_config.js';

const ENVIRONMENT_CONFIG_KEY = 'environment-config';

class EnvironmentConfigState {
	rainEnabled = $state(ENVIRONMENT_DEFAULTS.rainEnabled);
	lightningEnabled = $state(ENVIRONMENT_DEFAULTS.lightningEnabled);
	firefliesEnabled = $state(ENVIRONMENT_DEFAULTS.firefliesEnabled);
	windParticlesEnabled = $state(ENVIRONMENT_DEFAULTS.windParticlesEnabled);
	snowEnabled = $state(ENVIRONMENT_DEFAULTS.snowEnabled);
	sunRaysEnabled = $state(ENVIRONMENT_DEFAULTS.sunRaysEnabled);
	cloudsEnabled = $state(ENVIRONMENT_DEFAULTS.cloudsEnabled);
	rainIntensity = $state(ENVIRONMENT_DEFAULTS.rainIntensity);

	snapshot(): EnvironmentConfig {
		return {
			rainEnabled: this.rainEnabled,
			lightningEnabled: this.lightningEnabled,
			firefliesEnabled: this.firefliesEnabled,
			windParticlesEnabled: this.windParticlesEnabled,
			snowEnabled: this.snowEnabled,
			sunRaysEnabled: this.sunRaysEnabled,
			cloudsEnabled: this.cloudsEnabled,
			rainIntensity: this.rainIntensity,
		};
	}

	apply(config: EnvironmentConfig) {
		this.rainEnabled = config.rainEnabled;
		this.lightningEnabled = config.lightningEnabled;
		this.firefliesEnabled = config.firefliesEnabled;
		this.windParticlesEnabled = config.windParticlesEnabled;
		this.snowEnabled = config.snowEnabled;
		this.sunRaysEnabled = config.sunRaysEnabled;
		this.cloudsEnabled = config.cloudsEnabled;
		this.rainIntensity = config.rainIntensity;
	}

	resetToDefaults() {
		this.apply(ENVIRONMENT_DEFAULTS);
	}
}

export function createEnvironmentConfigContext() {
	const persisted = new Persisted<EnvironmentConfig>({
		key: ENVIRONMENT_CONFIG_KEY,
		serde: jsonSerde(isValidEnvironmentConfig),
		defaultValue: ENVIRONMENT_DEFAULTS,
	});

	const state = new EnvironmentConfigState();
	state.apply(persisted.current);

	if (browser) {
		$effect(() => {
			persisted.current = state.snapshot();
		});

		$effect(() => {
			const handler = (e: StorageEvent) => {
				if (e.key === ENVIRONMENT_CONFIG_KEY) {
					state.apply(persisted.current);
				}
			};
			window.addEventListener('storage', handler);
			return () => window.removeEventListener('storage', handler);
		});
	}

	return state;
}
