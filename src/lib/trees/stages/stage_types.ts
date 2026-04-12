import type { TreeConfig, TreeGeometry } from '../types.js';

export type StageResult =
	| {
			readonly kind: 'modifiedConfig';
			readonly config: TreeConfig;
			readonly addStakes: boolean;
			readonly addFruit: boolean;
	  }
	| { readonly kind: 'directGeometry'; readonly geometry: TreeGeometry };
