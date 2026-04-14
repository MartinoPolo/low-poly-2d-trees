export interface OakPrdConfig {
	readonly completionRatio: number;
	readonly issueCount: number;
	readonly seed: number;
	readonly name?: string;
}

export const OAK_PRD_VIEWBOX = {
	width: 300,
	height: 450,
} as const;

export const DEFAULT_OAK_PRD_CONFIG: OakPrdConfig = {
	completionRatio: 0,
	issueCount: 10,
	seed: 42,
} as const;
