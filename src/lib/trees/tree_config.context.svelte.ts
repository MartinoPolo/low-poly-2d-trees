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

	/** Reset all params to SHAPE_DEFAULTS for the current species, preserving seed and shape. */
	resetToShapeDefaults() {
		const shape = this.current.shape;
		if (shape === TREE_SHAPES.custom) {
			return;
		}
		const defaults = SHAPE_DEFAULTS[shape as Exclude<TreeShape, 'custom'>];
		const seed = this.current.seed;
		for (const [key, value] of Object.entries(defaults)) {
			(this.current as Record<string, unknown>)[key] = Array.isArray(value)
				? [...value]
				: value;
		}
		this.current.seed = seed;
		this.current.shape = shape;
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
