import type { Component } from 'svelte';
import type { BirdSpecies } from './bird_types.js';
import { BIRD_SPECIES } from './bird_types.js';
import OwlSvg from '$lib/trees/assets/birds/OwlSvg.svelte';
import RobinSvg from '$lib/trees/assets/birds/RobinSvg.svelte';
import SparrowSvg from '$lib/trees/assets/birds/SparrowSvg.svelte';
import CardinalSvg from '$lib/trees/assets/birds/CardinalSvg.svelte';
import HummingbirdSvg from '$lib/trees/assets/birds/HummingbirdSvg.svelte';
import ParrotSvg from '$lib/trees/assets/birds/ParrotSvg.svelte';

export interface BirdDefinition {
	readonly svgComponent: Component;
	readonly defaultScale: number;
}

export const BIRD_DEFINITIONS = {
	[BIRD_SPECIES.owl]: { svgComponent: OwlSvg, defaultScale: 1.2 },
	[BIRD_SPECIES.robin]: { svgComponent: RobinSvg, defaultScale: 0.9 },
	[BIRD_SPECIES.sparrow]: { svgComponent: SparrowSvg, defaultScale: 0.7 },
	[BIRD_SPECIES.cardinal]: { svgComponent: CardinalSvg, defaultScale: 1.0 },
	[BIRD_SPECIES.hummingbird]: { svgComponent: HummingbirdSvg, defaultScale: 0.6 },
	[BIRD_SPECIES.parrot]: { svgComponent: ParrotSvg, defaultScale: 1.1 },
} as const satisfies Record<BirdSpecies, BirdDefinition>;
