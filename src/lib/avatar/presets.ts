export const ANIMAL_PRESETS = [
	'cat',
	'dog',
	'fox',
	'owl',
	'bear',
	'rabbit',
	'penguin',
	'deer',
	'wolf',
	'frog',
] as const;

export type AnimalPreset = (typeof ANIMAL_PRESETS)[number];

export const PRESET_COLORS = [
	'#F4A6A0',
	'#A8D8B9',
	'#A0C4E8',
	'#F5D6A8',
	'#C4B0E0',
	'#F0B8D0',
	'#B0D8D8',
	'#E8C8A0',
	'#A0B8D8',
	'#D8D0A0',
] as const;

type PresetColor = (typeof PRESET_COLORS)[number];

export function getRandomPreset(): AnimalPreset {
	return ANIMAL_PRESETS[Math.floor(Math.random() * ANIMAL_PRESETS.length)];
}

export function getRandomColor(): PresetColor {
	return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

export function isValidPreset(value: string): value is AnimalPreset {
	return (ANIMAL_PRESETS as readonly string[]).includes(value);
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isValidColor(value: string): boolean {
	return HEX_COLOR_PATTERN.test(value);
}
