export interface GroundPlacement {
	readonly x: number;
	readonly y: number;
	readonly type: 'stone' | 'grass';
	readonly variant: number;
	readonly scale: number;
	readonly rotation: number;
}

export const GROUND_ELEMENT_COUNTS = {
	stones: 5,
	grass: 4,
} as const;

export const GROUND_MIN_SPACING_RATIO = 0.5;

export const GROUND_LIMITS = {
	countMin: 1,
	countMax: 20,
	countDefault: 9,
	sizeMin: 0.5,
	sizeMax: 2.0,
	sizeStep: 0.1,
	sizeDefault: 1.0,
} as const;
