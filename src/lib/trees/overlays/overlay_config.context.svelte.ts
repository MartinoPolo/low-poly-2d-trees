import { browser } from '$app/environment';
import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
import { isValidOverlayPersistedState } from '$lib/config/validators.js';
import {
	OVERLAY_DEFAULTS,
	OVERLAY_PERSISTED_DEFAULTS,
	type OverlayConfig,
	type OverlayPersistedState,
} from './overlay_types.js';

const OVERLAY_CONFIG_KEY = 'overlay-config';

class OverlayConfigState {
	stormCloudEnabled = $state(OVERLAY_DEFAULTS.stormCloud.enabled);
	stormCloudShowRain = $state(OVERLAY_DEFAULTS.stormCloud.showRain);
	speechBubbleEnabled = $state(OVERLAY_DEFAULTS.speechBubble.enabled);
	speechBubbleText = $state(OVERLAY_DEFAULTS.speechBubble.text);
	wiltingEnabled = $state(OVERLAY_DEFAULTS.wilting.enabled);
	glowEnabled = $state(OVERLAY_DEFAULTS.glow.enabled);
	glowColor = $state(OVERLAY_DEFAULTS.glow.color);
	glowIntensity = $state(OVERLAY_DEFAULTS.glow.intensity);
	glowPulse = $state(OVERLAY_DEFAULTS.glow.pulse);
	groundEnabled = $state(false);

	get config(): OverlayConfig {
		return {
			stormCloud: {
				enabled: this.stormCloudEnabled,
				showRain: this.stormCloudShowRain,
			},
			speechBubble: {
				enabled: this.speechBubbleEnabled,
				text: this.speechBubbleText,
			},
			wilting: {
				enabled: this.wiltingEnabled,
			},
			glow: {
				enabled: this.glowEnabled,
				color: this.glowColor,
				intensity: this.glowIntensity,
				pulse: this.glowPulse,
			},
		};
	}

	snapshot(): OverlayPersistedState {
		return {
			stormCloudEnabled: this.stormCloudEnabled,
			stormCloudShowRain: this.stormCloudShowRain,
			speechBubbleEnabled: this.speechBubbleEnabled,
			wiltingEnabled: this.wiltingEnabled,
			glowEnabled: this.glowEnabled,
			glowColor: this.glowColor,
			glowIntensity: this.glowIntensity,
			glowPulse: this.glowPulse,
			groundEnabled: this.groundEnabled,
		};
	}

	apply(state: OverlayPersistedState) {
		this.stormCloudEnabled = state.stormCloudEnabled;
		this.stormCloudShowRain = state.stormCloudShowRain;
		this.speechBubbleEnabled = state.speechBubbleEnabled;
		this.wiltingEnabled = state.wiltingEnabled;
		this.glowEnabled = state.glowEnabled;
		this.glowColor = state.glowColor;
		this.glowIntensity = state.glowIntensity;
		this.glowPulse = state.glowPulse;
		this.groundEnabled = state.groundEnabled;
	}
}

export function createOverlayConfigContext() {
	const persisted = new Persisted<OverlayPersistedState>({
		key: OVERLAY_CONFIG_KEY,
		serde: jsonSerde(isValidOverlayPersistedState),
		defaultValue: OVERLAY_PERSISTED_DEFAULTS,
	});

	const state = new OverlayConfigState();
	state.apply(persisted.current);

	if (browser) {
		$effect(() => {
			persisted.current = state.snapshot();
		});

		$effect(() => {
			const handler = (e: StorageEvent) => {
				if (e.key === OVERLAY_CONFIG_KEY) {
					state.apply(persisted.current);
				}
			};
			window.addEventListener('storage', handler);
			return () => window.removeEventListener('storage', handler);
		});
	}

	return state;
}
