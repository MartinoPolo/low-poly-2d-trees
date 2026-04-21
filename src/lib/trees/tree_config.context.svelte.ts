import { createContext } from 'svelte';
import { browser } from '$app/environment';
import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { Derived } from '$lib/reactivity/derived.svelte.js';
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

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

type TreeConfigContext = ReturnType<typeof createTreeConfigContext>;

const [useTreeConfig, setTreeConfigInternal] = createContext<TreeConfigContext>();
export { useTreeConfig };

export function setTreeConfigContext() {
	const ctx = createTreeConfigContext();
	setTreeConfigInternal(ctx);
	return ctx;
}

function createTreeConfigContext() {
	const persisted = new Persisted<TreeConfig>({
		key: 'tree-config',
		serde: jsonSerde(isValidTreeConfig),
		defaultValue: DEFAULT_TREE_CONFIG,
	});

	let current: Mutable<TreeConfig> = $state({ ...DEFAULT_TREE_CONFIG });
	const customBlobs = new StateRaw<readonly CustomBlob[]>([], { isEqual: Object.is });

	const configForTree = new Derived<TreeConfig>(
		() =>
			({
				...current,
				customBlobs: current.shape === TREE_SHAPES.custom ? customBlobs.current : undefined,
			}) as TreeConfig,
	);

	function snapshot(): TreeConfig {
		return {
			...$state.snapshot(current),
			customBlobs: current.shape === TREE_SHAPES.custom ? customBlobs.current : undefined,
		} as TreeConfig;
	}

	function resetToShapeDefaults() {
		const shape = current.shape;
		if (shape === TREE_SHAPES.custom) {
			return;
		}
		const defaults = SHAPE_DEFAULTS[shape as Exclude<TreeShape, 'custom'>];
		const seed = current.seed;
		current = { ...DEFAULT_TREE_CONFIG, ...defaults, seed, shape } as Mutable<TreeConfig>;
	}

	function applyShapeDefaults(shape: Exclude<TreeShape, 'custom'>) {
		const defaults = { ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS[shape] };
		current.blobCount = defaults.blobCount;
		current.branchDepth = defaults.branchDepth;
		current.branchesLevel1Range = [...defaults.branchesLevel1Range];
		current.branchesLevel2Range = [...defaults.branchesLevel2Range];
		current.branchesLevel3Range = [...defaults.branchesLevel3Range];
		current.branchAngle = defaults.branchAngle;
		current.blobSizeVariance = defaults.blobSizeVariance;
		current.blobCloseness = defaults.blobCloseness;
		current.branchThickness = defaults.branchThickness;
		current.trunkSegments = defaults.trunkSegments;
		current.trunkCrookedness = defaults.trunkCrookedness;
		current.crookednessMode = defaults.crookednessMode;
		current.branchLength = defaults.branchLength;
		current.branchLengthVariance = defaults.branchLengthVariance;
		current.canopyLightColor = defaults.canopyLightColor;
		current.canopyDarkColor = defaults.canopyDarkColor;
		current.trunkHue = defaults.trunkHue;
		current.trunkSaturation = defaults.trunkSaturation;
		current.trunkLightness = defaults.trunkLightness;
		current.trunkTwist = defaults.trunkTwist;
		current.branchMirroring = defaults.branchMirroring;
		current.trunkFork = defaults.trunkFork;
		current.fruitType = defaults.fruitType;
		current.fruitCount = defaults.fruitCount;
		current.trunkStripCount = defaults.trunkStripCount;
		current.branchWidthVariance = defaults.branchWidthVariance;
	}

	function applyConfig(config: TreeConfig) {
		const legacy = config as TreeConfig & {
			branchCount?: number;
			trunkBranchRatio?: number;
		};
		const migrated = { ...DEFAULT_TREE_CONFIG, ...config };
		if (legacy.branchCount !== undefined && !('branchesLevel1Range' in config)) {
			migrated.branchesLevel1Range = [legacy.branchCount, legacy.branchCount];
		}
		const validFruitTypes = new Set<string>(Object.values(FRUIT_TYPES));
		if (!validFruitTypes.has(migrated.fruitType)) {
			migrated.fruitType = FRUIT_TYPES.none as FruitType;
		}
		current = migrated;
		customBlobs.current = config.customBlobs ?? [];
	}

	applyConfig(persisted.current);

	if (browser) {
		$effect(() => {
			persisted.current = snapshot();
		});
		$effect(() => {
			const handler = (e: StorageEvent) => {
				if (e.key === 'tree-config') {
					applyConfig(persisted.current);
				}
			};
			window.addEventListener('storage', handler);
			return () => window.removeEventListener('storage', handler);
		});
	}

	return {
		get current() {
			return current;
		},
		set current(v: Mutable<TreeConfig>) {
			current = v;
		},
		customBlobs,
		configForTree,
		snapshot,
		resetToShapeDefaults,
		applyShapeDefaults,
		applyConfig,
	};
}
