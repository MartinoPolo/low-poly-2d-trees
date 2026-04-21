import { TREE_SHAPE_OPTIONS, type TreeShape } from '$lib/trees/types.js';

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

export const SCENE_SHAPE_RANDOM = 'random' as const;

export type SceneShapeSelection = SceneTreeShape | typeof SCENE_SHAPE_RANDOM;

export const SCENE_SHAPE_OPTIONS: readonly { value: SceneShapeSelection; label: string }[] = [
	{ value: SCENE_SHAPE_RANDOM, label: 'Random' },
	...TREE_SHAPE_OPTIONS.filter(
		(o): o is { value: SceneTreeShape; label: string } => o.value !== 'custom',
	),
] as const;

const SCENE_SHAPE_VALUES = new Set<string>([SCENE_SHAPE_RANDOM, ...SCENE_SHAPES]);

export function isSceneShapeSelection(value: unknown): value is SceneShapeSelection {
	return typeof value === 'string' && SCENE_SHAPE_VALUES.has(value);
}

export interface SceneConfig {
	readonly treeCount: number;
	readonly depthSpread: number;
	readonly baseSeed: number;
	readonly sceneShape?: SceneShapeSelection;
	readonly trees?: readonly SceneTreeInput[];
}

export const SCENE_DEFAULTS: Required<
	Pick<SceneConfig, 'treeCount' | 'depthSpread' | 'baseSeed' | 'sceneShape'>
> = {
	treeCount: 10,
	depthSpread: 0,
	baseSeed: 42,
	sceneShape: SCENE_SHAPE_RANDOM,
} as const;

export const SCENE_LIMITS = {
	treeCountMin: 3,
	treeCountMax: 100,
	depthSpreadMin: 0,
	depthSpreadMax: 100,
} as const;

/** Total number of depth layers in the scene. */
export const LAYER_COUNT = 10;

/** Maximum trees per layer. */
export const TREES_PER_LAYER = 10;

/** Scale factor for front-most layer (layer 1). */
export const SCALE_FRONT = 1.0;

/** Scale factor for back-most layer (layer 10). */
export const SCALE_BACK = 0.65;

/** Input descriptor for a tree in the scene, before layout. */
export interface SceneTreeInput {
	readonly id?: string;
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
	/** Scale factor derived from depth: 1.0 at front, 0.65 at back. */
	readonly scale: number;
	/** Layer number (1 = front, 10 = back). */
	readonly layer: number;
}
