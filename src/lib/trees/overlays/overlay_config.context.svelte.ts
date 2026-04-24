import { createContext } from 'svelte';
import { browser } from '$app/environment';
import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { Derived } from '$lib/reactivity/derived.svelte.js';
import { isValidOverlayPersistedState } from '$lib/config/validators.js';
import {
	OVERLAY_PERSISTED_DEFAULTS,
	type OverlayConfig,
	type OverlayPersistedState,
} from './overlay_types.js';
import { GROUND_LIMITS } from '$lib/trees/ground/ground_types.js';

const STALE_OVERLAY_KEYS = [
	'stormCloudEnabled',
	'stormCloudShowRain',
	'speechBubbleEnabled',
	'speechBubbleText',
] as const;

function migrateStaleOverlayKeys() {
	if (!browser) {
		return;
	}
	const raw = localStorage.getItem('overlay-config');
	if (raw === null) {
		return;
	}
	try {
		const parsed = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null) {
			return;
		}
		let changed = false;
		for (const key of STALE_OVERLAY_KEYS) {
			if (key in parsed) {
				delete parsed[key];
				changed = true;
			}
		}
		if (changed) {
			localStorage.setItem('overlay-config', JSON.stringify(parsed));
		}
	} catch {
		// corrupt JSON — Persisted will handle fallback to defaults
	}
}

type OverlayConfigContext = ReturnType<typeof createOverlayConfigContext>;

const [useOverlayConfig, setOverlayConfigInternal] = createContext<OverlayConfigContext>();
export { useOverlayConfig };

export function setOverlayConfigContext() {
	const ctx = createOverlayConfigContext();
	setOverlayConfigInternal(ctx);
	return ctx;
}

function createOverlayConfigContext() {
	migrateStaleOverlayKeys();

	const persisted = new Persisted<OverlayPersistedState>({
		key: 'overlay-config',
		serde: jsonSerde(isValidOverlayPersistedState),
		defaultValue: OVERLAY_PERSISTED_DEFAULTS,
	});
	const init = persisted.current;

	const glowEnabled = new StateRaw(init.glowEnabled, { isEqual: Object.is });
	const glowColor = new StateRaw(init.glowColor, { isEqual: Object.is });
	const glowIntensity = new StateRaw(init.glowIntensity, { isEqual: Object.is });
	const glowPulse = new StateRaw(init.glowPulse, { isEqual: Object.is });
	const groundEnabled = new StateRaw(init.groundEnabled, { isEqual: Object.is });
	const groundElementCount = new StateRaw(init.groundElementCount ?? GROUND_LIMITS.countDefault, {
		isEqual: Object.is,
	});
	const groundElementSize = new StateRaw(init.groundElementSize ?? GROUND_LIMITS.sizeDefault, {
		isEqual: Object.is,
	});

	const config = new Derived<OverlayConfig>(() => ({
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
				glowEnabled: glowEnabled.current,
				glowColor: glowColor.current,
				glowIntensity: glowIntensity.current,
				glowPulse: glowPulse.current,
				groundEnabled: groundEnabled.current,
				groundElementCount: groundElementCount.current,
				groundElementSize: groundElementSize.current,
			};
		});
		$effect(() => {
			const snap = persisted.current;
			glowEnabled.current = snap.glowEnabled;
			glowColor.current = snap.glowColor;
			glowIntensity.current = snap.glowIntensity;
			glowPulse.current = snap.glowPulse;
			groundEnabled.current = snap.groundEnabled;
			groundElementCount.current = snap.groundElementCount ?? GROUND_LIMITS.countDefault;
			groundElementSize.current = snap.groundElementSize ?? GROUND_LIMITS.sizeDefault;
		});
	}

	return {
		glowEnabled,
		glowColor,
		glowIntensity,
		glowPulse,
		groundEnabled,
		groundElementCount,
		groundElementSize,
		config,
	};
}
