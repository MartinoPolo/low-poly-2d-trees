import { createContext } from 'svelte';
import { browser } from '$app/environment';
import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { isValidSceneConfig } from '$lib/config/validators/index.js';
import {
	SCENE_DEFAULTS,
	SCENE_LIMITS,
	SCENE_SHAPE_RANDOM,
	type SceneConfig,
	type SceneShapeSelection,
} from './scene_config.js';

type SceneConfigContext = ReturnType<typeof createSceneConfigContext>;

const [, setSceneConfigInternal] = createContext<SceneConfigContext>();

export function setSceneConfigContext() {
	const ctx = createSceneConfigContext();
	setSceneConfigInternal(ctx);
	return ctx;
}

function createSceneConfigContext() {
	const persisted = new Persisted<SceneConfig>({
		key: 'scene-config',
		serde: jsonSerde(isValidSceneConfig),
		defaultValue: SCENE_DEFAULTS,
	});
	const init = persisted.current;

	const treeCount = new StateRaw(init.treeCount, { isEqual: Object.is });
	const depthSpread = new StateRaw(Math.min(init.depthSpread, SCENE_LIMITS.depthSpreadMax), {
		isEqual: Object.is,
	});
	const baseSeed = new StateRaw(init.baseSeed, { isEqual: Object.is });
	const sceneShape = new StateRaw<SceneShapeSelection>(init.sceneShape ?? SCENE_SHAPE_RANDOM, {
		isEqual: Object.is,
	});

	if (browser) {
		$effect(() => {
			persisted.current = {
				treeCount: treeCount.current,
				depthSpread: depthSpread.current,
				baseSeed: baseSeed.current,
				sceneShape: sceneShape.current,
			};
		});
		$effect(() => {
			const snap = persisted.current;
			treeCount.current = snap.treeCount;
			depthSpread.current = snap.depthSpread;
			baseSeed.current = snap.baseSeed;
			sceneShape.current = snap.sceneShape ?? SCENE_SHAPE_RANDOM;
		});
	}

	function resetToDefaults() {
		treeCount.current = SCENE_DEFAULTS.treeCount;
		depthSpread.current = SCENE_DEFAULTS.depthSpread;
		baseSeed.current = SCENE_DEFAULTS.baseSeed;
		sceneShape.current = SCENE_DEFAULTS.sceneShape;
	}

	return { treeCount, depthSpread, baseSeed, sceneShape, resetToDefaults };
}
