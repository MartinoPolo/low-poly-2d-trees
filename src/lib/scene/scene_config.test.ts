import { describe, expect, it } from 'vitest';
import { SCENE_LIMITS } from './scene_config.js';

describe('SCENE_LIMITS', () => {
	it('depthSpreadMax equals 30', () => {
		expect(SCENE_LIMITS.depthSpreadMax).toBe(30);
	});
});
