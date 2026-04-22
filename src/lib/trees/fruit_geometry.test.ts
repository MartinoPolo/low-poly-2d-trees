import { describe, it, expect } from 'vitest';
import { FRUIT_TYPES, FRUIT_TYPE_OPTIONS } from './types.js';
import { GEOMETRY_GROUPS } from './types.js';

// ============================================================================
// Fruit type definitions
// ============================================================================

describe('Fruit type definitions', () => {
	it('FRUIT_TYPES has 13 entries (none + 12 fruit types)', () => {
		expect(Object.keys(FRUIT_TYPES)).toHaveLength(13);
	});

	it('FRUIT_TYPES includes all expected keys', () => {
		expect(FRUIT_TYPES).toEqual({
			none: 'none',
			acorn: 'acorn',
			catkin_birch: 'catkin_birch',
			samara: 'samara',
			pine_cone: 'pine_cone',
			fir_cone: 'fir_cone',
			catkin_willow: 'catkin_willow',
			small_cone: 'small_cone',
			apple: 'apple',
			cherry_pair: 'cherry_pair',
			berry: 'berry',
			baobab_fruit: 'baobab_fruit',
			seed_pod: 'seed_pod',
		});
	});

	it('FRUIT_TYPE_OPTIONS has 13 entries', () => {
		expect(FRUIT_TYPE_OPTIONS).toHaveLength(13);
	});

	it('FRUIT_TYPE_OPTIONS provides labeled options for LabeledSelect', () => {
		for (const option of FRUIT_TYPE_OPTIONS) {
			expect(typeof option.value).toBe('string');
			expect(typeof option.label).toBe('string');
		}
		// Verify first and last
		expect(FRUIT_TYPE_OPTIONS[0]).toEqual({ value: 'none', label: 'None' });
		expect(FRUIT_TYPE_OPTIONS[FRUIT_TYPE_OPTIONS.length - 1]).toEqual({
			value: 'seed_pod',
			label: 'Seed Pod',
		});
	});
});

// ============================================================================
// GEOMETRY_GROUPS includes fruit and flower
// ============================================================================

describe('GEOMETRY_GROUPS includes fruit and flower', () => {
	it('has a fruit group', () => {
		expect(GEOMETRY_GROUPS.fruit).toBe('fruit');
	});

	it('has a flower group', () => {
		expect(GEOMETRY_GROUPS.flower).toBe('flower');
	});
});
