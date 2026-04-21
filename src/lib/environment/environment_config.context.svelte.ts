import { createContext } from 'svelte';
import { browser } from '$app/environment';
import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { Derived } from '$lib/reactivity/derived.svelte.js';
import { isValidEnvironmentConfig } from '$lib/config/validators.js';
import { ENVIRONMENT_DEFAULTS, type EnvironmentConfig } from './environment_config.js';

type EnvironmentConfigContext = ReturnType<typeof createEnvironmentConfigContext>;

const [useEnvironmentConfig, setEnvironmentConfigInternal] =
	createContext<EnvironmentConfigContext>();
/** @knipignore */
export { useEnvironmentConfig };

export function setEnvironmentConfigContext() {
	const ctx = createEnvironmentConfigContext();
	setEnvironmentConfigInternal(ctx);
	return ctx;
}

function createEnvironmentConfigContext() {
	const persisted = new Persisted<EnvironmentConfig>({
		key: 'environment-config',
		serde: jsonSerde(isValidEnvironmentConfig),
		defaultValue: ENVIRONMENT_DEFAULTS,
	});
	const init = persisted.current;

	const rainEnabled = new StateRaw(init.rainEnabled, { isEqual: Object.is });
	const lightningEnabled = new StateRaw(init.lightningEnabled, { isEqual: Object.is });
	const firefliesEnabled = new StateRaw(init.firefliesEnabled, { isEqual: Object.is });
	const windParticlesEnabled = new StateRaw(init.windParticlesEnabled, { isEqual: Object.is });
	const snowEnabled = new StateRaw(init.snowEnabled, { isEqual: Object.is });
	const sunRaysEnabled = new StateRaw(init.sunRaysEnabled, { isEqual: Object.is });
	const cloudsEnabled = new StateRaw(init.cloudsEnabled, { isEqual: Object.is });
	const rainIntensity = new StateRaw(init.rainIntensity, { isEqual: Object.is });

	const config = new Derived<EnvironmentConfig>(() => ({
		rainEnabled: rainEnabled.current,
		lightningEnabled: lightningEnabled.current,
		firefliesEnabled: firefliesEnabled.current,
		windParticlesEnabled: windParticlesEnabled.current,
		snowEnabled: snowEnabled.current,
		sunRaysEnabled: sunRaysEnabled.current,
		cloudsEnabled: cloudsEnabled.current,
		rainIntensity: rainIntensity.current,
	}));

	if (browser) {
		$effect(() => {
			persisted.current = {
				rainEnabled: rainEnabled.current,
				lightningEnabled: lightningEnabled.current,
				firefliesEnabled: firefliesEnabled.current,
				windParticlesEnabled: windParticlesEnabled.current,
				snowEnabled: snowEnabled.current,
				sunRaysEnabled: sunRaysEnabled.current,
				cloudsEnabled: cloudsEnabled.current,
				rainIntensity: rainIntensity.current,
			};
		});
		$effect(() => {
			const snap = persisted.current;
			rainEnabled.current = snap.rainEnabled;
			lightningEnabled.current = snap.lightningEnabled;
			firefliesEnabled.current = snap.firefliesEnabled;
			windParticlesEnabled.current = snap.windParticlesEnabled;
			snowEnabled.current = snap.snowEnabled;
			sunRaysEnabled.current = snap.sunRaysEnabled;
			cloudsEnabled.current = snap.cloudsEnabled;
			rainIntensity.current = snap.rainIntensity;
		});
	}

	function resetToDefaults() {
		rainEnabled.current = ENVIRONMENT_DEFAULTS.rainEnabled;
		lightningEnabled.current = ENVIRONMENT_DEFAULTS.lightningEnabled;
		firefliesEnabled.current = ENVIRONMENT_DEFAULTS.firefliesEnabled;
		windParticlesEnabled.current = ENVIRONMENT_DEFAULTS.windParticlesEnabled;
		snowEnabled.current = ENVIRONMENT_DEFAULTS.snowEnabled;
		sunRaysEnabled.current = ENVIRONMENT_DEFAULTS.sunRaysEnabled;
		cloudsEnabled.current = ENVIRONMENT_DEFAULTS.cloudsEnabled;
		rainIntensity.current = ENVIRONMENT_DEFAULTS.rainIntensity;
	}

	return {
		rainEnabled,
		lightningEnabled,
		firefliesEnabled,
		windParticlesEnabled,
		snowEnabled,
		sunRaysEnabled,
		cloudsEnabled,
		rainIntensity,
		config,
		resetToDefaults,
	};
}
