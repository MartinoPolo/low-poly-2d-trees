export const BIRD_SPECIES = {
	owl: 'owl',
	robin: 'robin',
	sparrow: 'sparrow',
	cardinal: 'cardinal',
	hummingbird: 'hummingbird',
	parrot: 'parrot',
} as const;

export type BirdSpecies = (typeof BIRD_SPECIES)[keyof typeof BIRD_SPECIES];

export interface BirdConfig {
	readonly type: BirdSpecies;
	readonly label?: string;
	readonly active?: boolean;
}
