import { browser } from '$app/environment';
import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
import { isValidTreeConfig } from '$lib/config/validators.js';
import {
	DEFAULT_TREE_CONFIG,
	SHAPE_DEFAULTS,
	TREE_SHAPES,
	FRUIT_TYPES,
	type CustomBlob,
	type TreeConfig,
	type TreeShape,
	type FruitType,
} from './types.js';

const TREE_CONFIG_KEY = 'tree-config';

/** Strip readonly from all properties so `bind:value` can write through the deep proxy. */
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

class TreeConfigState {
	current: Mutable<TreeConfig> = $state({ ...DEFAULT_TREE_CONFIG });
	/**
	 * Custom blobs stored separately with `$state.raw` because the array is
	 * replaced wholesale (never mutated in place) and is read-heavy.
	 */
	customBlobs = $state.raw<readonly CustomBlob[]>([]);

	/** Snapshot for serialization boundaries (save, JSON.stringify). */
	snapshot(): TreeConfig {
		return {
			...$state.snapshot(this.current),
			customBlobs: this.current.shape === TREE_SHAPES.custom ? this.customBlobs : undefined,
		} as TreeConfig;
	}

	/** Config including customBlobs, for passing to LowPolyTree. */
	get configForTree(): TreeConfig {
		return {
			...this.current,
			customBlobs: this.current.shape === TREE_SHAPES.custom ? this.customBlobs : undefined,
		} as TreeConfig;
	}

	/** Reset all params to full defaults for the current species, preserving seed and shape. */
	resetToShapeDefaults() {
		const shape = this.current.shape;
		if (shape === TREE_SHAPES.custom) {
			return;
		}
		const defaults = SHAPE_DEFAULTS[shape as Exclude<TreeShape, 'custom'>];
		const seed = this.current.seed;
		this.current = { ...DEFAULT_TREE_CONFIG, ...defaults, seed, shape } as Mutable<TreeConfig>;
	}

	/**
	 * Assign all shape-relevant fields from SHAPE_DEFAULTS[shape] onto `current`.
	 * Does not touch `seed` or `stage` (user-controlled, not shape defaults).
	 * Intended for callers that need to keep other `current` state references intact
	 * (as opposed to `resetToShapeDefaults` which replaces the whole object).
	 */
	applyShapeDefaults(shape: Exclude<TreeShape, 'custom'>) {
		const defaults = { ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS[shape] };
		this.current.blobCount = defaults.blobCount;
		this.current.branchDepth = defaults.branchDepth;
		this.current.branchesLevel1Range = [...defaults.branchesLevel1Range];
		this.current.branchesLevel2Range = [...defaults.branchesLevel2Range];
		this.current.branchesLevel3Range = [...defaults.branchesLevel3Range];
		this.current.branchAngle = defaults.branchAngle;
		this.current.blobSizeVariance = defaults.blobSizeVariance;
		this.current.blobCloseness = defaults.blobCloseness;
		this.current.branchThickness = defaults.branchThickness;
		this.current.trunkSegments = defaults.trunkSegments;
		this.current.trunkCrookedness = defaults.trunkCrookedness;
		this.current.crookednessMode = defaults.crookednessMode;
		this.current.branchLength = defaults.branchLength;
		this.current.branchLengthVariance = defaults.branchLengthVariance;
		this.current.canopyLightColor = defaults.canopyLightColor;
		this.current.canopyDarkColor = defaults.canopyDarkColor;
		this.current.trunkHue = defaults.trunkHue;
		this.current.trunkSaturation = defaults.trunkSaturation;
		this.current.trunkLightness = defaults.trunkLightness;
		this.current.trunkTwist = defaults.trunkTwist;
		this.current.branchMirroring = defaults.branchMirroring;
		this.current.trunkFork = defaults.trunkFork;
		this.current.fruitType = defaults.fruitType;
		this.current.fruitCount = defaults.fruitCount;
		this.current.trunkStripCount = defaults.trunkStripCount;
		this.current.branchWidthVariance = defaults.branchWidthVariance;
	}

	applyConfig(config: TreeConfig) {
		// Migrate old saved configs that used branchCount/trunkBranchRatio
		const legacy = config as TreeConfig & {
			branchCount?: number;
			trunkBranchRatio?: number;
		};
		const migrated = { ...DEFAULT_TREE_CONFIG, ...config };
		if (legacy.branchCount !== undefined && !('branchesLevel1Range' in config)) {
			migrated.branchesLevel1Range = [legacy.branchCount, legacy.branchCount];
		}
		// Migrate removed fruit types from old configs
		const validFruitTypes = new Set<string>(Object.values(FRUIT_TYPES));
		if (!validFruitTypes.has(migrated.fruitType)) {
			migrated.fruitType = FRUIT_TYPES.none as FruitType;
		}
		this.current = migrated;
		this.customBlobs = config.customBlobs ?? [];
	}
}

export function createTreeConfigContext() {
	const persisted = new Persisted<TreeConfig>({
		key: TREE_CONFIG_KEY,
		serde: jsonSerde(isValidTreeConfig),
		defaultValue: DEFAULT_TREE_CONFIG,
	});

	const state = new TreeConfigState();
	state.applyConfig(persisted.current);

	if (browser) {
		$effect(() => {
			persisted.current = state.snapshot();
		});

		$effect(() => {
			const handler = (e: StorageEvent) => {
				if (e.key === TREE_CONFIG_KEY) {
					state.applyConfig(persisted.current);
				}
			};
			window.addEventListener('storage', handler);
			return () => window.removeEventListener('storage', handler);
		});
	}

	return state;
}
