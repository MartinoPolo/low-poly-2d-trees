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
	readonly trees?: readonly SceneTreeInput[];
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

/** Maximum number of trees in the front row before overflow to back. */
export const FRONT_ROW_CAPACITY = 10;

/** Minimum scale for back-row trees. */
export const BACK_SCALE_MIN = 0.65;

/** Maximum scale for back-row trees. */
export const BACK_SCALE_MAX = 0.8;

/** Minimum back-row depth when depthSpread is 0. */
export const BACK_DEPTH_FALLBACK = 15;

/** Input descriptor for a tree in the scene, before layout. */
export interface SceneTreeInput {
	readonly id?: string;
	/** 0 = background (always back row), 1 = foreground (front row preferred). Defaults to 1. */
	readonly priority?: 0 | 1;
	/** ID of another tree this one must be placed behind (y >= blocker's y). */
	readonly blockedBy?: string;
}

/** A positioned tree in the scene, ready for rendering. */
export interface SceneTreePlacement {
	readonly id?: string;
	readonly shape: SceneTreeShape;
	readonly seed: number;
	/** Horizontal position as percentage [0, 100]. */
	readonly x: number;
	/** Depth position — 0 = front (baseline), higher y = further from viewer (back). */
	readonly y: number;
	/** Scale factor derived from depth: 1.0 at front, ~0.65 at back. */
	readonly scale: number;
}
