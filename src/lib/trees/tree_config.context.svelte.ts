import {
	DEFAULT_TREE_CONFIG,
	TREE_SHAPES,
	FRUIT_TYPES,
	type CustomBlob,
	type TreeConfig,
	type FruitType,
} from './types.js';

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
	return new TreeConfigState();
}
