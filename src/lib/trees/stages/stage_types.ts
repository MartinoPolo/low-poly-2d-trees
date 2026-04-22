import type { TreeConfig, TreeGeometry } from '../types.js';

export type StageResult =
	| {
			readonly kind: 'modifiedConfig';
			readonly config: TreeConfig;
			readonly addStakes: boolean;
			readonly addFruit: boolean;
			readonly addFlowers: boolean;
			readonly addFallingLeaves: boolean;
			readonly addSnowBlobs: boolean;
	  }
	| { readonly kind: 'directGeometry'; readonly geometry: TreeGeometry };
