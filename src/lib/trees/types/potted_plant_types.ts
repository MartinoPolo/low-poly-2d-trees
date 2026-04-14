export const POTTED_PLANT_STAGES = {
	potWithSoil: 'pot-with-soil',
	sprout: 'sprout',
	smallPlant: 'small-plant',
	flowering: 'flowering',
	dried: 'dried',
} as const;

export type PottedPlantStage = (typeof POTTED_PLANT_STAGES)[keyof typeof POTTED_PLANT_STAGES];

export interface PottedPlantConfig {
	readonly stage: PottedPlantStage;
	readonly seed: number;
	readonly canopyLightColor?: string;
	readonly canopyDarkColor?: string;
}

export const DEFAULT_POTTED_PLANT_CONFIG: PottedPlantConfig = {
	stage: POTTED_PLANT_STAGES.flowering,
	seed: 42,
	canopyLightColor: '#a8d84e',
	canopyDarkColor: '#1a472a',
} as const;
