import { createContext } from 'svelte';
import { browser } from '$app/environment';
import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { isValidEditorViewState } from '$lib/config/validators.js';
import { EDITOR_VIEW_DEFAULTS, type EditorViewState } from './editor_view_state.js';

type EditorViewStateContext = ReturnType<typeof createEditorViewStateContext>;

const [useEditorViewState, setEditorViewStateInternal] = createContext<EditorViewStateContext>();
// fallow-ignore-next-line unused-export
export { useEditorViewState };

export function setEditorViewStateContext() {
	const ctx = createEditorViewStateContext();
	setEditorViewStateInternal(ctx);
	return ctx;
}

function createEditorViewStateContext() {
	const persisted = new Persisted<EditorViewState>({
		key: 'editor-view-state',
		serde: jsonSerde(isValidEditorViewState),
		defaultValue: EDITOR_VIEW_DEFAULTS,
	});
	const init = persisted.current;

	const showCanopy = new StateRaw(init.showCanopy, { isEqual: Object.is });
	const showBranches = new StateRaw(init.showBranches, { isEqual: Object.is });
	const showTrunk = new StateRaw(init.showTrunk, { isEqual: Object.is });
	const showFruit = new StateRaw(init.showFruit, { isEqual: Object.is });
	const showAnchors = new StateRaw(init.showAnchors, { isEqual: Object.is });
	const showEnvelope = new StateRaw(init.showEnvelope, { isEqual: Object.is });
	const showViewBox = new StateRaw(init.showViewBox, { isEqual: Object.is });
	const animateCanopySway = new StateRaw(init.animateCanopySway, { isEqual: Object.is });
	const animateBranches = new StateRaw(init.animateBranches, { isEqual: Object.is });
	const animateGrowth = new StateRaw(init.animateGrowth, { isEqual: Object.is });
	const growthVariance = new StateRaw(init.growthVariance, { isEqual: Object.is });
	const animateTools = new StateRaw(init.animateTools, { isEqual: Object.is });

	if (browser) {
		$effect(() => {
			persisted.current = {
				showCanopy: showCanopy.current,
				showBranches: showBranches.current,
				showTrunk: showTrunk.current,
				showFruit: showFruit.current,
				showAnchors: showAnchors.current,
				showEnvelope: showEnvelope.current,
				showViewBox: showViewBox.current,
				animateCanopySway: animateCanopySway.current,
				animateBranches: animateBranches.current,
				animateGrowth: animateGrowth.current,
				growthVariance: growthVariance.current,
				animateTools: animateTools.current,
			};
		});
		$effect(() => {
			const snap = persisted.current;
			showCanopy.current = snap.showCanopy;
			showBranches.current = snap.showBranches;
			showTrunk.current = snap.showTrunk;
			showFruit.current = snap.showFruit;
			showAnchors.current = snap.showAnchors;
			showEnvelope.current = snap.showEnvelope;
			showViewBox.current = snap.showViewBox;
			animateCanopySway.current = snap.animateCanopySway;
			animateBranches.current = snap.animateBranches;
			animateGrowth.current = snap.animateGrowth;
			growthVariance.current = snap.growthVariance;
			animateTools.current = snap.animateTools;
		});
	}

	return {
		showCanopy,
		showBranches,
		showTrunk,
		showFruit,
		showAnchors,
		showEnvelope,
		showViewBox,
		animateCanopySway,
		animateBranches,
		animateGrowth,
		growthVariance,
		animateTools,
	};
}
