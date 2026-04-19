import type { Component } from 'svelte';
import GrassSvg from '../assets/ground/GrassSvg.svelte';
import StoneSvg from '../assets/ground/StoneSvg.svelte';

export const GROUND_TYPES = {
	grass: 'grass',
	stone: 'stone',
} as const;

export type GroundType = (typeof GROUND_TYPES)[keyof typeof GROUND_TYPES];

export interface GroundDefinition {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly svgComponent: Component<any>;
	readonly scaleRange: { readonly min: number; readonly max: number };
	readonly rotationRange: { readonly min: number; readonly max: number };
}

export const GROUND_DEFINITIONS = {
	[GROUND_TYPES.grass]: {
		svgComponent: GrassSvg,
		scaleRange: { min: 0.8, max: 1.2 },
		rotationRange: { min: -15, max: 15 },
	},
	[GROUND_TYPES.stone]: {
		svgComponent: StoneSvg,
		scaleRange: { min: 0.8, max: 1.2 },
		rotationRange: { min: -15, max: 15 },
	},
} as const satisfies Record<GroundType, GroundDefinition>;
