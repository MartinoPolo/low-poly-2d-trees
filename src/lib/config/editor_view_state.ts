export interface EditorViewState {
	readonly showCanopy: boolean;
	readonly showBranches: boolean;
	readonly showTrunk: boolean;
	readonly showFruit: boolean;
	readonly showAnchors: boolean;
	readonly showEnvelope: boolean;
	readonly showViewBox: boolean;
	readonly animateCanopySway: boolean;
	readonly animateBranches: boolean;
	readonly animateGrowth: boolean;
	readonly growthVariance: number;
	readonly animateTools: boolean;
}

export const EDITOR_VIEW_DEFAULTS: EditorViewState = {
	showCanopy: true,
	showBranches: true,
	showTrunk: true,
	showFruit: true,
	showAnchors: false,
	showEnvelope: false,
	showViewBox: false,
	animateCanopySway: false,
	animateBranches: false,
	animateGrowth: false,
	growthVariance: 50,
	animateTools: false,
} as const;
