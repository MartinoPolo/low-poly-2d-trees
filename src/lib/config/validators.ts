import {
	TREE_SHAPES,
	CROOKEDNESS_MODES,
	BRANCH_MIRRORING,
	FRUIT_TYPES,
	type TreeConfig,
} from '$lib/trees/types.js';
import type { SceneConfig } from '$lib/scene/scene_config.js';
import type { EnvironmentConfig } from '$lib/environment/environment_config.js';

const TREE_SHAPE_VALUES = new Set<string>(Object.values(TREE_SHAPES));
const CROOKEDNESS_MODE_VALUES = new Set<string>(Object.values(CROOKEDNESS_MODES));
const BRANCH_MIRRORING_VALUES = new Set<string>(Object.values(BRANCH_MIRRORING));
const FRUIT_TYPE_VALUES = new Set<string>(Object.values(FRUIT_TYPES));

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function hasNumber(obj: Record<string, unknown>, key: string): boolean {
	return typeof obj[key] === 'number';
}

function hasString(obj: Record<string, unknown>, key: string): boolean {
	return typeof obj[key] === 'string';
}

function hasBoolean(obj: Record<string, unknown>, key: string): boolean {
	return typeof obj[key] === 'boolean';
}

function hasNumberPair(obj: Record<string, unknown>, key: string): boolean {
	const val = obj[key];
	return (
		Array.isArray(val) &&
		val.length === 2 &&
		typeof val[0] === 'number' &&
		typeof val[1] === 'number'
	);
}

export function isValidTreeConfig(value: unknown): value is TreeConfig {
	if (!isObject(value)) {
		return false;
	}
	const o = value;
	return (
		hasString(o, 'stage') &&
		hasString(o, 'shape') &&
		TREE_SHAPE_VALUES.has(o.shape as string) &&
		hasNumber(o, 'seed') &&
		hasNumber(o, 'polygonsPerBlob') &&
		hasString(o, 'canopyLightColor') &&
		hasString(o, 'canopyDarkColor') &&
		hasNumber(o, 'trunkHue') &&
		hasNumber(o, 'trunkSaturation') &&
		hasNumber(o, 'trunkLightness') &&
		hasNumber(o, 'lightAngle') &&
		hasNumber(o, 'blobCount') &&
		hasNumber(o, 'depthVariance') &&
		hasNumber(o, 'blobSizeVariance') &&
		hasNumber(o, 'blobCloseness') &&
		hasNumber(o, 'trunkThickness') &&
		hasNumber(o, 'branchThickness') &&
		hasNumber(o, 'canopySize') &&
		hasNumber(o, 'trunkHeight') &&
		hasNumber(o, 'trunkLean') &&
		hasNumber(o, 'trunkSegments') &&
		hasNumber(o, 'trunkCrookedness') &&
		hasString(o, 'crookednessMode') &&
		CROOKEDNESS_MODE_VALUES.has(o.crookednessMode as string) &&
		hasNumber(o, 'branchLength') &&
		hasNumber(o, 'branchLengthVariance') &&
		hasNumber(o, 'branchDepth') &&
		hasNumberPair(o, 'branchesLevel1Range') &&
		hasNumberPair(o, 'branchesLevel2Range') &&
		hasNumberPair(o, 'branchesLevel3Range') &&
		hasNumber(o, 'branchSegments') &&
		hasNumber(o, 'branchCrookedness') &&
		hasNumber(o, 'branchAngle') &&
		hasString(o, 'branchMirroring') &&
		BRANCH_MIRRORING_VALUES.has(o.branchMirroring as string) &&
		hasBoolean(o, 'trunkFork') &&
		hasNumber(o, 'trunkTwist') &&
		hasNumber(o, 'trunkStripCount') &&
		hasNumber(o, 'branchWidthVariance') &&
		hasString(o, 'fruitType') &&
		FRUIT_TYPE_VALUES.has(o.fruitType as string) &&
		hasNumber(o, 'fruitCount')
	);
}

export function isValidSceneConfig(value: unknown): value is SceneConfig {
	if (!isObject(value)) {
		return false;
	}
	return (
		hasNumber(value, 'treeCount') &&
		hasNumber(value, 'depthSpread') &&
		hasNumber(value, 'baseSeed')
	);
}

export function isValidEnvironmentConfig(value: unknown): value is EnvironmentConfig {
	if (!isObject(value)) {
		return false;
	}
	return (
		hasBoolean(value, 'rainEnabled') &&
		hasBoolean(value, 'lightningEnabled') &&
		hasBoolean(value, 'firefliesEnabled') &&
		hasBoolean(value, 'windParticlesEnabled') &&
		hasBoolean(value, 'snowEnabled') &&
		hasBoolean(value, 'sunRaysEnabled') &&
		hasBoolean(value, 'cloudsEnabled') &&
		hasNumber(value, 'rainIntensity')
	);
}

export function isValidBoolean(value: unknown): value is boolean {
	return typeof value === 'boolean';
}
