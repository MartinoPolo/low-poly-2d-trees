import { describe, expect, it } from 'vitest';
import {
	SETTINGS_TIERS,
	TIER_RANK,
	isSettingsTier,
	tierAtLeast,
	type SettingsTier,
} from './settings_tier.context.svelte.js';

describe('SETTINGS_TIERS', () => {
	it('has exactly three tiers', () => {
		const values = Object.values(SETTINGS_TIERS);
		expect(values).toHaveLength(3);
		expect(values).toContain('basic');
		expect(values).toContain('intermediate');
		expect(values).toContain('advanced');
	});
});

describe('TIER_RANK', () => {
	it('ranks basic < intermediate < advanced', () => {
		expect(TIER_RANK.basic).toBeLessThan(TIER_RANK.intermediate);
		expect(TIER_RANK.intermediate).toBeLessThan(TIER_RANK.advanced);
	});
});

describe('isSettingsTier', () => {
	it('returns true for valid tiers', () => {
		expect(isSettingsTier('basic')).toBe(true);
		expect(isSettingsTier('intermediate')).toBe(true);
		expect(isSettingsTier('advanced')).toBe(true);
	});

	it('returns false for invalid values', () => {
		expect(isSettingsTier('expert')).toBe(false);
		expect(isSettingsTier('')).toBe(false);
		expect(isSettingsTier(42)).toBe(false);
		expect(isSettingsTier(null)).toBe(false);
		expect(isSettingsTier(undefined)).toBe(false);
	});
});

describe('tierAtLeast', () => {
	it('basic tier satisfies only basic', () => {
		const current: SettingsTier = 'basic';
		expect(tierAtLeast(current, 'basic')).toBe(true);
		expect(tierAtLeast(current, 'intermediate')).toBe(false);
		expect(tierAtLeast(current, 'advanced')).toBe(false);
	});

	it('intermediate tier satisfies basic and intermediate', () => {
		const current: SettingsTier = 'intermediate';
		expect(tierAtLeast(current, 'basic')).toBe(true);
		expect(tierAtLeast(current, 'intermediate')).toBe(true);
		expect(tierAtLeast(current, 'advanced')).toBe(false);
	});

	it('advanced tier satisfies all tiers', () => {
		const current: SettingsTier = 'advanced';
		expect(tierAtLeast(current, 'basic')).toBe(true);
		expect(tierAtLeast(current, 'intermediate')).toBe(true);
		expect(tierAtLeast(current, 'advanced')).toBe(true);
	});
});
