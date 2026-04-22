import { describe, it, expect } from 'vitest';
import {
	ANIMAL_PRESETS,
	PRESET_COLORS,
	getRandomPreset,
	getRandomColor,
	isValidPreset,
	isValidColor,
} from './presets.js';

describe('ANIMAL_PRESETS', () => {
	it('contains exactly 10 animals', () => {
		expect(ANIMAL_PRESETS).toHaveLength(10);
	});

	it('contains the required animals', () => {
		const expected = [
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
		];
		expect([...ANIMAL_PRESETS]).toEqual(expect.arrayContaining(expected));
	});
});

describe('PRESET_COLORS', () => {
	it('contains exactly 10 colors', () => {
		expect(PRESET_COLORS).toHaveLength(10);
	});

	it('all values are valid hex colors', () => {
		for (const color of PRESET_COLORS) {
			expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
		}
	});
});

describe('getRandomPreset', () => {
	it('returns a value from ANIMAL_PRESETS', () => {
		for (let i = 0; i < 20; i++) {
			const result = getRandomPreset();
			expect(ANIMAL_PRESETS).toContain(result);
		}
	});
});

describe('getRandomColor', () => {
	it('returns a value from PRESET_COLORS', () => {
		for (let i = 0; i < 20; i++) {
			const result = getRandomColor();
			expect(PRESET_COLORS).toContain(result);
		}
	});
});

describe('isValidPreset', () => {
	it('returns true for valid presets', () => {
		expect(isValidPreset('cat')).toBe(true);
		expect(isValidPreset('frog')).toBe(true);
	});

	it('returns false for invalid presets', () => {
		expect(isValidPreset('unicorn')).toBe(false);
		expect(isValidPreset('')).toBe(false);
	});
});

describe('isValidColor', () => {
	it('returns true for preset colors', () => {
		expect(isValidColor(PRESET_COLORS[0])).toBe(true);
	});

	it('returns true for valid hex colors', () => {
		expect(isValidColor('#FF00AA')).toBe(true);
		expect(isValidColor('#abcdef')).toBe(true);
	});

	it('returns false for invalid colors', () => {
		expect(isValidColor('red')).toBe(false);
		expect(isValidColor('#GGG')).toBe(false);
		expect(isValidColor('')).toBe(false);
	});
});
