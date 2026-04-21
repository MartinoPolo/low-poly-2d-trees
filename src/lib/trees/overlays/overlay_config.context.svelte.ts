import { createContext } from 'svelte';
import { browser } from '$app/environment';
import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { Derived } from '$lib/reactivity/derived.svelte.js';
import { isValidOverlayPersistedState } from '$lib/config/validators.js';
import {
	OVERLAY_DEFAULTS,
	OVERLAY_PERSISTED_DEFAULTS,
	type OverlayConfig,
	type OverlayPersistedState,
} from './overlay_types.js';

type OverlayConfigContext = ReturnType<typeof createOverlayConfigContext>;

const [useOverlayConfig, setOverlayConfigInternal] = createContext<OverlayConfigContext>();
export { useOverlayConfig };

export function setOverlayConfigContext() {
	const ctx = createOverlayConfigContext();
	setOverlayConfigInternal(ctx);
	return ctx;
}

function createOverlayConfigContext() {
	const persisted = new Persisted<OverlayPersistedState>({
		key: 'overlay-config',
		serde: jsonSerde(isValidOverlayPersistedState),
		defaultValue: OVERLAY_PERSISTED_DEFAULTS,
	});
	const init = persisted.current;

	const stormCloudEnabled = new StateRaw(init.stormCloudEnabled, { isEqual: Object.is });
	const stormCloudShowRain = new StateRaw(init.stormCloudShowRain, { isEqual: Object.is });
	const speechBubbleEnabled = new StateRaw(init.speechBubbleEnabled, { isEqual: Object.is });
	const speechBubbleText = new StateRaw(
		init.speechBubbleText ?? OVERLAY_DEFAULTS.speechBubble.text,
		{ isEqual: Object.is },
	);
	const wiltingEnabled = new StateRaw(init.wiltingEnabled, { isEqual: Object.is });
	const glowEnabled = new StateRaw(init.glowEnabled, { isEqual: Object.is });
	const glowColor = new StateRaw(init.glowColor, { isEqual: Object.is });
	const glowIntensity = new StateRaw(init.glowIntensity, { isEqual: Object.is });
	const glowPulse = new StateRaw(init.glowPulse, { isEqual: Object.is });
	const groundEnabled = new StateRaw(init.groundEnabled, { isEqual: Object.is });

	const config = new Derived<OverlayConfig>(() => ({
		stormCloud: { enabled: stormCloudEnabled.current, showRain: stormCloudShowRain.current },
		speechBubble: { enabled: speechBubbleEnabled.current, text: speechBubbleText.current },
		wilting: { enabled: wiltingEnabled.current },
		glow: {
			enabled: glowEnabled.current,
			color: glowColor.current,
			intensity: glowIntensity.current,
			pulse: glowPulse.current,
		},
	}));

	if (browser) {
		$effect(() => {
			persisted.current = {
				stormCloudEnabled: stormCloudEnabled.current,
				stormCloudShowRain: stormCloudShowRain.current,
				speechBubbleEnabled: speechBubbleEnabled.current,
				speechBubbleText: speechBubbleText.current,
				wiltingEnabled: wiltingEnabled.current,
				glowEnabled: glowEnabled.current,
				glowColor: glowColor.current,
				glowIntensity: glowIntensity.current,
				glowPulse: glowPulse.current,
				groundEnabled: groundEnabled.current,
			};
		});
		$effect(() => {
			const snap = persisted.current;
			stormCloudEnabled.current = snap.stormCloudEnabled;
			stormCloudShowRain.current = snap.stormCloudShowRain;
			speechBubbleEnabled.current = snap.speechBubbleEnabled;
			speechBubbleText.current = snap.speechBubbleText ?? OVERLAY_DEFAULTS.speechBubble.text;
			wiltingEnabled.current = snap.wiltingEnabled;
			glowEnabled.current = snap.glowEnabled;
			glowColor.current = snap.glowColor;
			glowIntensity.current = snap.glowIntensity;
			glowPulse.current = snap.glowPulse;
			groundEnabled.current = snap.groundEnabled;
		});
	}

	return {
		stormCloudEnabled,
		stormCloudShowRain,
		speechBubbleEnabled,
		speechBubbleText,
		wiltingEnabled,
		glowEnabled,
		glowColor,
		glowIntensity,
		glowPulse,
		groundEnabled,
		config,
	};
}
