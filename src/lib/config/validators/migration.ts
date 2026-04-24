const LEGACY_STAGE_MAP: Record<string, string> = {
	autumn: 'seasonal',
	ready: 'wilting',
};

export function migrateStageValue(stage: string): string {
	return LEGACY_STAGE_MAP[stage] ?? stage;
}
