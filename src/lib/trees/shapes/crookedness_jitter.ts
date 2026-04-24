import type { CrookednessMode } from '../types.js';
import { CROOKEDNESS_MODES } from '../types.js';
import { randomInRange } from '../prng.js';

interface JitterResult {
	readonly angleRad: number;
	readonly alternatingSign: number;
}

export function applyJunctionJitter(
	rng: () => number,
	crookednessMode: CrookednessMode,
	maxJitterDeg: number,
	maxAbsoluteRad: number,
	currentAngleRad: number,
	alternatingSign: number,
): JitterResult {
	const jitterReduction = 0.5 + rng() * 0.5;
	const effectiveMaxJitter = maxJitterDeg * jitterReduction;

	let newAlternatingSign = alternatingSign;
	let jitterSign: number;
	if (crookednessMode === CROOKEDNESS_MODES.alternating) {
		newAlternatingSign *= -1;
		jitterSign = newAlternatingSign;
	} else {
		jitterSign = rng() < 0.5 ? -1 : 1;
	}

	const jitterDeg = randomInRange(rng, effectiveMaxJitter * 0.3, effectiveMaxJitter) * jitterSign;
	let newAngleRad = currentAngleRad + (jitterDeg * Math.PI) / 180;
	newAngleRad = Math.max(-maxAbsoluteRad, Math.min(maxAbsoluteRad, newAngleRad));

	return { angleRad: newAngleRad, alternatingSign: newAlternatingSign };
}
