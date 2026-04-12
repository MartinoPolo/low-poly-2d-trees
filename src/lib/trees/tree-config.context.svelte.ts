import { getContext, setContext } from 'svelte';
import { DEFAULT_TREE_CONFIG, TREE_SHAPES, type CustomBlob, type TreeConfig } from './types.js';

const CONTEXT_KEY = Symbol.for('tree-config');

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
		this.current = { ...config };
		this.customBlobs = config.customBlobs ?? [];
	}
}

export function create_tree_config_context() {
	return new TreeConfigState();
}

export function set_tree_config_context() {
	const ctx = create_tree_config_context();
	setContext(CONTEXT_KEY, ctx);
	return ctx;
}

export function use_tree_config(): TreeConfigState {
	return getContext(CONTEXT_KEY);
}

export type TreeConfigContext = ReturnType<typeof create_tree_config_context>;
