import { browser } from '$app/environment';
import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
import { isValidSceneConfig } from '$lib/config/validators.js';
import {
	SCENE_DEFAULTS,
	SCENE_SHAPE_RANDOM,
	type SceneConfig,
	type SceneShapeSelection,
} from './scene_config.js';

const SCENE_CONFIG_KEY = 'scene-config';

class SceneConfigState {
	treeCount = $state(SCENE_DEFAULTS.treeCount);
	depthSpread = $state(SCENE_DEFAULTS.depthSpread);
	baseSeed = $state(SCENE_DEFAULTS.baseSeed);
	sceneShape: SceneShapeSelection = $state(SCENE_DEFAULTS.sceneShape);

	snapshot(): SceneConfig {
		return {
			treeCount: this.treeCount,
			depthSpread: this.depthSpread,
			baseSeed: this.baseSeed,
			sceneShape: this.sceneShape,
		};
	}

	apply(config: SceneConfig) {
		this.treeCount = config.treeCount;
		this.depthSpread = config.depthSpread;
		this.baseSeed = config.baseSeed;
		this.sceneShape = config.sceneShape ?? SCENE_SHAPE_RANDOM;
	}

	resetToDefaults() {
		this.apply(SCENE_DEFAULTS);
	}
}

export function createSceneConfigContext() {
	const persisted = new Persisted<SceneConfig>({
		key: SCENE_CONFIG_KEY,
		serde: jsonSerde(isValidSceneConfig),
		defaultValue: SCENE_DEFAULTS,
	});

	const state = new SceneConfigState();
	state.apply(persisted.current);

	if (browser) {
		$effect(() => {
			persisted.current = state.snapshot();
		});

		$effect(() => {
			const handler = (e: StorageEvent) => {
				if (e.key === SCENE_CONFIG_KEY) {
					state.apply(persisted.current);
				}
			};
			window.addEventListener('storage', handler);
			return () => window.removeEventListener('storage', handler);
		});
	}

	return state;
}
