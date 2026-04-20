import { browser } from '$app/environment';
import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
import { isValidEditorViewState } from '$lib/config/validators.js';
import { EDITOR_VIEW_DEFAULTS, type EditorViewState } from './editor_view_state.js';

const EDITOR_VIEW_STATE_KEY = 'editor-view-state';

class EditorViewConfigState {
	showCanopy = $state(EDITOR_VIEW_DEFAULTS.showCanopy);
	showBranches = $state(EDITOR_VIEW_DEFAULTS.showBranches);
	showTrunk = $state(EDITOR_VIEW_DEFAULTS.showTrunk);
	showFruit = $state(EDITOR_VIEW_DEFAULTS.showFruit);
	showAnchors = $state(EDITOR_VIEW_DEFAULTS.showAnchors);
	showEnvelope = $state(EDITOR_VIEW_DEFAULTS.showEnvelope);
	showViewBox = $state(EDITOR_VIEW_DEFAULTS.showViewBox);
	animateCanopySway = $state(EDITOR_VIEW_DEFAULTS.animateCanopySway);
	animateBranches = $state(EDITOR_VIEW_DEFAULTS.animateBranches);
	animateGrowth = $state(EDITOR_VIEW_DEFAULTS.animateGrowth);
	growthVariance = $state(EDITOR_VIEW_DEFAULTS.growthVariance);
	animateTools = $state(EDITOR_VIEW_DEFAULTS.animateTools);

	snapshot(): EditorViewState {
		return {
			showCanopy: this.showCanopy,
			showBranches: this.showBranches,
			showTrunk: this.showTrunk,
			showFruit: this.showFruit,
			showAnchors: this.showAnchors,
			showEnvelope: this.showEnvelope,
			showViewBox: this.showViewBox,
			animateCanopySway: this.animateCanopySway,
			animateBranches: this.animateBranches,
			animateGrowth: this.animateGrowth,
			growthVariance: this.growthVariance,
			animateTools: this.animateTools,
		};
	}

	apply(state: EditorViewState) {
		this.showCanopy = state.showCanopy;
		this.showBranches = state.showBranches;
		this.showTrunk = state.showTrunk;
		this.showFruit = state.showFruit;
		this.showAnchors = state.showAnchors;
		this.showEnvelope = state.showEnvelope;
		this.showViewBox = state.showViewBox;
		this.animateCanopySway = state.animateCanopySway;
		this.animateBranches = state.animateBranches;
		this.animateGrowth = state.animateGrowth;
		this.growthVariance = state.growthVariance;
		this.animateTools = state.animateTools;
	}
}

export function createEditorViewStateContext() {
	const persisted = new Persisted<EditorViewState>({
		key: EDITOR_VIEW_STATE_KEY,
		serde: jsonSerde(isValidEditorViewState),
		defaultValue: EDITOR_VIEW_DEFAULTS,
	});

	const state = new EditorViewConfigState();
	state.apply(persisted.current);

	if (browser) {
		$effect(() => {
			persisted.current = state.snapshot();
		});

		$effect(() => {
			const handler = (e: StorageEvent) => {
				if (e.key === EDITOR_VIEW_STATE_KEY) {
					state.apply(persisted.current);
				}
			};
			window.addEventListener('storage', handler);
			return () => window.removeEventListener('storage', handler);
		});
	}

	return state;
}
