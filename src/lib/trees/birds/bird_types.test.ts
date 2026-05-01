import { describe, it, expect } from 'vitest';
import { BIRD_SPECIES, type BirdConfig } from './bird_types.js';

describe('BIRD_SPECIES', () => {
	it('has exactly 6 species', () => {
		expect(Object.values(BIRD_SPECIES)).toHaveLength(6);
	});

	it('contains owl, robin, sparrow, cardinal, hummingbird, parrot', () => {
		expect(BIRD_SPECIES.owl).toBe('owl');
		expect(BIRD_SPECIES.robin).toBe('robin');
		expect(BIRD_SPECIES.sparrow).toBe('sparrow');
		expect(BIRD_SPECIES.cardinal).toBe('cardinal');
		expect(BIRD_SPECIES.hummingbird).toBe('hummingbird');
		expect(BIRD_SPECIES.parrot).toBe('parrot');
	});
});

describe('BirdConfig', () => {
	it('can be constructed with just type', () => {
		const config: BirdConfig = { type: 'owl' };
		expect(config.type).toBe('owl');
		expect(config.label).toBeUndefined();
		expect(config.active).toBeUndefined();
	});

	it('can include label and active', () => {
		const config: BirdConfig = { type: 'robin', label: 'Test bird', active: false };
		expect(config.type).toBe('robin');
		expect(config.label).toBe('Test bird');
		expect(config.active).toBe(false);
	});
});
