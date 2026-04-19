import * as v from 'valibot';
import {
	TREE_STAGES,
	TREE_SHAPES,
	CROOKEDNESS_MODES,
	BRANCH_MIRRORING,
	FRUIT_TYPES,
	CUSTOM_BLOB_BOUNDARY_KINDS,
	type TreeConfig,
} from '$lib/trees/types.js';
import type { SceneConfig } from '$lib/scene/scene_config.js';
import type { EnvironmentConfig } from '$lib/environment/environment_config.js';

const customBlobSchema = v.object({
	size: v.number(),
	x: v.number(),
	y: v.number(),
	rotation: v.number(),
	boundaryKind: v.picklist(Object.values(CUSTOM_BLOB_BOUNDARY_KINDS)),
});

const treeConfigSchema = v.object({
	stage: v.picklist(Object.values(TREE_STAGES)),
	shape: v.picklist(Object.values(TREE_SHAPES)),
	seed: v.number(),
	polygonsPerBlob: v.number(),
	canopyLightColor: v.string(),
	canopyDarkColor: v.string(),
	trunkHue: v.number(),
	trunkSaturation: v.number(),
	trunkLightness: v.number(),
	lightAngle: v.number(),
	blobCount: v.number(),
	depthVariance: v.number(),
	blobSizeVariance: v.number(),
	blobCloseness: v.number(),
	trunkThickness: v.number(),
	branchThickness: v.number(),
	canopySize: v.number(),
	trunkHeight: v.number(),
	trunkLean: v.number(),
	trunkSegments: v.number(),
	trunkCrookedness: v.number(),
	crookednessMode: v.picklist(Object.values(CROOKEDNESS_MODES)),
	branchLength: v.number(),
	branchLengthVariance: v.number(),
	branchDepth: v.number(),
	branchesLevel1Range: v.tuple([v.number(), v.number()]),
	branchesLevel2Range: v.tuple([v.number(), v.number()]),
	branchesLevel3Range: v.tuple([v.number(), v.number()]),
	branchSegments: v.number(),
	branchCrookedness: v.number(),
	branchDepthTaper: v.number(),
	branchAngle: v.number(),
	branchMirroring: v.picklist(Object.values(BRANCH_MIRRORING)),
	trunkFork: v.boolean(),
	trunkTwist: v.number(),
	trunkStripCount: v.number(),
	branchWidthVariance: v.number(),
	customBlobs: v.optional(v.array(customBlobSchema)),
	fruitType: v.picklist(Object.values(FRUIT_TYPES)),
	fruitCount: v.number(),
});

const sceneConfigSchema = v.object({
	treeCount: v.number(),
	depthSpread: v.number(),
	baseSeed: v.number(),
});

const environmentConfigSchema = v.object({
	rainEnabled: v.boolean(),
	lightningEnabled: v.boolean(),
	firefliesEnabled: v.boolean(),
	windParticlesEnabled: v.boolean(),
	snowEnabled: v.boolean(),
	sunRaysEnabled: v.boolean(),
	cloudsEnabled: v.boolean(),
	rainIntensity: v.number(),
});

export function isValidTreeConfig(value: unknown): value is TreeConfig {
	const result = v.safeParse(treeConfigSchema, value);
	return result.success;
}

export function debugTreeConfigValidation(value: unknown) {
	return v.safeParse(treeConfigSchema, value);
}

export function isValidSceneConfig(value: unknown): value is SceneConfig {
	return v.safeParse(sceneConfigSchema, value).success;
}

export function isValidEnvironmentConfig(value: unknown): value is EnvironmentConfig {
	return v.safeParse(environmentConfigSchema, value).success;
}

export function isValidBoolean(value: unknown): value is boolean {
	return typeof value === 'boolean';
}
