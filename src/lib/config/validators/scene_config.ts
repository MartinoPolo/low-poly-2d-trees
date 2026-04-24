import { isSceneShapeSelection, type SceneConfig } from '$lib/scene/scene_config.js';
import { isObject, hasNumber } from './helpers.js';

export function isValidSceneConfig(value: unknown): value is SceneConfig {
	if (!isObject(value)) {
		return false;
	}
	return (
		hasNumber(value, 'treeCount') &&
		hasNumber(value, 'depthSpread') &&
		hasNumber(value, 'baseSeed') &&
		(value.sceneShape === undefined || isSceneShapeSelection(value.sceneShape))
	);
}
