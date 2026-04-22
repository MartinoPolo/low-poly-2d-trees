export const CROOKEDNESS_MODES = {
	alternating: 'alternating',
	random: 'random',
} as const;

export type CrookednessMode = (typeof CROOKEDNESS_MODES)[keyof typeof CROOKEDNESS_MODES];

export const CROOKEDNESS_MODE_OPTIONS: readonly { value: CrookednessMode; label: string }[] = [
	{ value: CROOKEDNESS_MODES.alternating, label: 'Alternating' },
	{ value: CROOKEDNESS_MODES.random, label: 'Random' },
] as const;

export const BRANCH_MIRRORING = {
	off: 'off',
	allowed: 'allowed',
	preferred: 'preferred',
} as const;

export type BranchMirroring = (typeof BRANCH_MIRRORING)[keyof typeof BRANCH_MIRRORING];

export const BRANCH_MIRRORING_OPTIONS: readonly { value: BranchMirroring; label: string }[] = [
	{ value: BRANCH_MIRRORING.off, label: 'Off' },
	{ value: BRANCH_MIRRORING.allowed, label: 'Allowed' },
	{ value: BRANCH_MIRRORING.preferred, label: 'Preferred' },
] as const;
