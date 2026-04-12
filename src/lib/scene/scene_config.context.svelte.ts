import { SCENE_DEFAULTS } from './scene_config.js';

class SceneConfigState {
	treeCount = $state(SCENE_DEFAULTS.treeCount);
	depthSpread = $state(SCENE_DEFAULTS.depthSpread);
	baseSeed = $state(SCENE_DEFAULTS.baseSeed);
}

export function createSceneConfigContext() {
	return new SceneConfigState();
}
