import type { OverlayPersistedState } from '$lib/trees/overlays/overlay_types.js';
import { isObject, hasBoolean, hasString, hasNumber } from './helpers.js';

export function isValidOverlayPersistedState(value: unknown): value is OverlayPersistedState {
	if (!isObject(value)) {
		return false;
	}
	return (
		hasBoolean(value, 'glowEnabled') &&
		hasString(value, 'glowColor') &&
		hasNumber(value, 'glowIntensity') &&
		hasBoolean(value, 'glowPulse') &&
		hasBoolean(value, 'groundEnabled')
	);
}
