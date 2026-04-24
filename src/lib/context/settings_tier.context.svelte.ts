import { getContext, setContext } from 'svelte';
import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
import { CONTEXT_KEYS } from './context_keys.js';

export const SETTINGS_TIERS = {
	basic: 'basic',
	intermediate: 'intermediate',
	advanced: 'advanced',
} as const;

export type SettingsTier = (typeof SETTINGS_TIERS)[keyof typeof SETTINGS_TIERS];

export const TIER_RANK = {
	basic: 0,
	intermediate: 1,
	advanced: 2,
} as const satisfies Record<SettingsTier, number>;

export function isSettingsTier(value: unknown): value is SettingsTier {
	return (
		typeof value === 'string' &&
		(Object.values(SETTINGS_TIERS) as readonly string[]).includes(value)
	);
}

export function tierAtLeast(current: SettingsTier, minimum: SettingsTier): boolean {
	return TIER_RANK[current] >= TIER_RANK[minimum];
}

function create_settings_tier_context() {
	const tier = new Persisted<SettingsTier>({
		key: 'settings-tier',
		serde: jsonSerde(isSettingsTier),
		defaultValue: SETTINGS_TIERS.basic,
	});
	return { tier };
}

// fallow-ignore-next-line unused-type
export type SettingsTierContext = ReturnType<typeof create_settings_tier_context>;

export function set_settings_tier_context() {
	const context = create_settings_tier_context();
	setContext(CONTEXT_KEYS.settings_tier, context);
	return context;
}

export function use_settings_tier() {
	return getContext<SettingsTierContext>(CONTEXT_KEYS.settings_tier);
}
