import type { EditorViewState } from '$lib/config/editor_view_state.js';
import { isObject, hasBoolean, hasNumber } from './helpers.js';

export function isValidEditorViewState(value: unknown): value is EditorViewState {
	if (!isObject(value)) {
		return false;
	}
	return (
		hasBoolean(value, 'showCanopy') &&
		hasBoolean(value, 'showBranches') &&
		hasBoolean(value, 'showTrunk') &&
		hasBoolean(value, 'showFruit') &&
		hasBoolean(value, 'showAnchors') &&
		hasBoolean(value, 'showEnvelope') &&
		hasBoolean(value, 'showViewBox') &&
		hasBoolean(value, 'animateCanopySway') &&
		hasBoolean(value, 'animateBranches') &&
		hasBoolean(value, 'animateGrowth') &&
		hasNumber(value, 'growthVariance') &&
		hasBoolean(value, 'animateTools')
	);
}
