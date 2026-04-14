import type { TreeShape } from '$lib/trees/types.js';

/** Non-custom tree shapes eligible for random scene assignment. */
export type SceneTreeShape = Exclude<TreeShape, 'custom'>;

/** Shapes eligible for random scene assignment (excludes 'custom'). */
export const SCENE_SHAPES: readonly SceneTreeShape[] = [
	'oak',
	'pine',
	'birch',
	'fir',
	'maple',
	'willow',
	'cypress',
	'apple',
	'cherry',
	'bush',
	'baobab',
	'acacia',
] as const;

export interface SceneConfig {
	readonly treeCount: number;
	readonly depthSpread: number;
	readonly baseSeed: number;
}

export const SCENE_DEFAULTS: SceneConfig = {
	treeCount: 3,
	depthSpread: 0,
	baseSeed: 42,
} as const;

export const SCENE_LIMITS = {
	treeCountMin: 3,
	treeCountMax: 100,
	depthSpreadMin: 0,
	depthSpreadMax: 100,
} as const;

/** A positioned tree in the scene, ready for rendering. */
export interface SceneTreePlacement {
	readonly shape: SceneTreeShape;
	readonly seed: number;
	/** Horizontal position as percentage [0, 100]. */
	readonly x: number;
	/** Depth position — higher y = closer to viewer (front). */
	readonly y: number;
	/** Scale factor derived from depth: 1.0 at front, ~0.65 at back. */
	readonly scale: number;
}
