export interface GroundPlacement {
	readonly x: number;
	readonly y: number;
	readonly type: 'stone' | 'grass';
	readonly variant: number;
	readonly scale: number;
	readonly rotation: number;
}

export const GROUND_ELEMENT_COUNTS = {
	stones: 3,
	grass: 2,
} as const;
