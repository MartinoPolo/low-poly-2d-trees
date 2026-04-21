<script lang="ts">
	import LowPolyTree from '$lib/trees/LowPolyTree.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import SectionCard from '$lib/components/composed/SectionCard.svelte';
	import LabeledSlider from '$lib/components/composed/LabeledSlider.svelte';
	import LabeledCheckbox from '$lib/components/composed/LabeledCheckbox.svelte';
	import CanopyColorCard from '$lib/components/composed/CanopyColorCard.svelte';
	import TrunkColorCard from '$lib/components/composed/TrunkColorCard.svelte';
	import ShapeCard from '$lib/components/composed/ShapeCard.svelte';
	import CanopyCard from '$lib/components/composed/CanopyCard.svelte';
	import TrunkCard from '$lib/components/composed/TrunkCard.svelte';
	import BranchesCard from '$lib/components/composed/BranchesCard.svelte';
	import LightingCard from '$lib/components/composed/LightingCard.svelte';
	import DebugCard from '$lib/components/composed/DebugCard.svelte';
	import {
		DEFAULT_TREE_CONFIG,
		SHAPE_DEFAULTS,
		isTreeStage,
		isTreeShape,
		type TreeShape,
	} from '$lib/trees/types.js';
	import {
		SCENE_SHAPE_RANDOM,
		SCENE_LIMITS,
		isSceneShapeSelection,
	} from '$lib/scene/scene_config.js';
	import {
		createDefaultToolVisibility,
		type ToolVisibility,
	} from '$lib/trees/tools/tool_types.js';
	import ToolAccessoriesCard from '$lib/components/composed/ToolAccessoriesCard.svelte';
	import OverlaysCard from '$lib/components/composed/OverlaysCard.svelte';
	import AnimationsCard from '$lib/components/composed/AnimationsCard.svelte';
	import { createTreeConfigContext } from '$lib/trees/tree_config.context.svelte.js';
	import { createSceneConfigContext } from '$lib/scene/scene_config.context.svelte.js';
	import { generateSceneLayout, computeGroundHeightPercent } from '$lib/scene/scene_layout.js';
	import { createEnvironmentConfigContext } from '$lib/environment/environment_config.context.svelte.js';
	import { ENVIRONMENT_LIMITS } from '$lib/environment/environment_config.js';
	import EnvironmentOverlay from '$lib/environment/EnvironmentOverlay.svelte';
	import { createOverlayConfigContext } from '$lib/trees/overlays/overlay_config.context.svelte.js';
	import SceneBackground from '$lib/scene/SceneBackground.svelte';
	import RootConnection from '$lib/scene/RootConnection.svelte';
	import { CONNECTION_STATES } from '$lib/scene/root_connection_types.js';
	import type { Point2D } from '$lib/trees/types/core.js';
	import { SvelteMap } from 'svelte/reactivity';
	import SceneFloatingButtons from '$lib/components/app-shell/SceneFloatingButtons.svelte';
	import SettingsTierControl from '$lib/components/composed/SettingsTierControl.svelte';
	import { use_settings_tier, tierAtLeast } from '$lib/context/settings_tier.context.svelte.js';
	import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
	import { isValidBoolean } from '$lib/config/validators.js';

	const USE_PER_SHAPE_DEFAULTS_KEY = 'use-per-shape-defaults';

	const treeConfig = createTreeConfigContext();
	const sceneConfig = createSceneConfigContext();
	const environmentConfig = createEnvironmentConfigContext();
	const overlayConfig = createOverlayConfigContext();
	const { tier } = use_settings_tier();

	const ENVIRONMENT_TOGGLES: ReadonlyArray<{
		readonly key:
			| 'lightningEnabled'
			| 'snowEnabled'
			| 'firefliesEnabled'
			| 'windParticlesEnabled'
			| 'sunRaysEnabled'
			| 'cloudsEnabled';
		readonly label: string;
		readonly testId: string;
	}> = [
		{ key: 'lightningEnabled', label: 'Lightning', testId: 'env-lightning-toggle' },
		{ key: 'snowEnabled', label: 'Snow', testId: 'env-snow-toggle' },
		{ key: 'firefliesEnabled', label: 'Fireflies', testId: 'env-fireflies-toggle' },
		{ key: 'windParticlesEnabled', label: 'Wind Particles', testId: 'env-wind-toggle' },
		{ key: 'sunRaysEnabled', label: 'Sun Rays', testId: 'env-sun-rays-toggle' },
		{ key: 'cloudsEnabled', label: 'Clouds', testId: 'env-clouds-toggle' },
	];

	const usePerShapeDefaults = new Persisted<boolean>({
		key: USE_PER_SHAPE_DEFAULTS_KEY,
		serde: jsonSerde(isValidBoolean),
		defaultValue: true,
	});
	let showAnchors = $state(false);
	let showViewBox = $state(false);
	let showCanopy = $state(true);
	let showBranches = $state(true);
	let showTrunk = $state(true);
	let animateCanopySway = $state(false);
	let animateBranches = $state(false);
	let animateGrowth = $state(false);
	let growthVariance = $state(50);
	let toolVisibility: ToolVisibility = $state(createDefaultToolVisibility());
	let animateTools = $state(false);
	let showRootConnections = $state(false);
	let treeAnchorsMap = new SvelteMap<number, { roots: Point2D }>();

	const isIntermediate = $derived(tierAtLeast(tier.current, 'intermediate'));
	const isAdvanced = $derived(tierAtLeast(tier.current, 'advanced'));

	const sceneShapeIsRandom = $derived(sceneConfig.sceneShape === SCENE_SHAPE_RANDOM);

	const scenePlacements = $derived(
		generateSceneLayout({
			treeCount: sceneConfig.treeCount,
			depthSpread: sceneConfig.depthSpread,
			baseSeed: treeConfig.current.seed,
			sceneShape: sceneConfig.sceneShape,
		}),
	);

	const groundHeightPercent = $derived(
		computeGroundHeightPercent(sceneConfig.depthSpread, sceneConfig.treeCount),
	);

	function randomizeSeed() {
		treeConfig.current.seed = Math.floor(Math.random() * 100000);
	}

	function onStageChange(value: string) {
		if (!isTreeStage(value)) {
			return;
		}
		treeConfig.current.stage = value;
	}

	function onSceneShapeChange(value: string) {
		if (value === SCENE_SHAPE_RANDOM) {
			sceneConfig.sceneShape = SCENE_SHAPE_RANDOM;
			return;
		}
		if (!isSceneShapeSelection(value)) {
			return;
		}
		sceneConfig.sceneShape = value;
		// Reset treeConfig to new shape defaults
		if (isTreeShape(value)) {
			treeConfig.current.shape = value;
			treeConfig.applyShapeDefaults(value as Exclude<TreeShape, 'custom'>);
		}
	}

	function resetAll() {
		treeConfig.resetToShapeDefaults();
		sceneConfig.resetToDefaults();
		environmentConfig.resetToDefaults();
		usePerShapeDefaults.setDefaultValue();
	}
</script>

<svelte:head>
	<title>Scene Editor</title>
</svelte:head>

<main class="grid h-dvh grid-rows-[1fr_1fr] overflow-hidden bg-background text-foreground">
	<!-- Scene Preview -->
	<div data-testid="scene-canvas" class="relative overflow-hidden border border-border">
		<SceneBackground {groundHeightPercent} />

		{#each scenePlacements as placement, index (index)}
			{@const useDefaults = sceneShapeIsRandom}
			{@const shapeDefaults = useDefaults
				? { ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS[placement.shape] }
				: null}
			<div
				data-testid="scene-tree"
				class="absolute bottom-0"
				style="
						left: {placement.x}%;
						bottom: calc({placement.y}% + 30px);
						transform: scale({placement.scale}) translateX(-50%);
						transform-origin: bottom center;
						width: {320 * placement.scale}px;
					"
			>
				<LowPolyTree
					config={{
						...treeConfig.current,
						shape: placement.shape,
						seed: placement.seed,
						...(useDefaults && shapeDefaults
							? {
									blobCount: shapeDefaults.blobCount,
									branchDepth: shapeDefaults.branchDepth,
									branchesLevel1Range: shapeDefaults.branchesLevel1Range,
									branchesLevel2Range: shapeDefaults.branchesLevel2Range,
									branchesLevel3Range: shapeDefaults.branchesLevel3Range,
									branchAngle: shapeDefaults.branchAngle,
									blobSizeVariance: shapeDefaults.blobSizeVariance,
									blobCloseness: shapeDefaults.blobCloseness,
									branchThickness: shapeDefaults.branchThickness,
									trunkSegments: shapeDefaults.trunkSegments,
									trunkCrookedness: shapeDefaults.trunkCrookedness,
									trunkTwist: shapeDefaults.trunkTwist,
									crookednessMode: shapeDefaults.crookednessMode,
									branchLength: shapeDefaults.branchLength,
									branchLengthVariance: shapeDefaults.branchLengthVariance,
								}
							: {}),
						canopyLightColor:
							usePerShapeDefaults.current && useDefaults
								? (shapeDefaults?.canopyLightColor ??
									treeConfig.current.canopyLightColor)
								: treeConfig.current.canopyLightColor,
						canopyDarkColor:
							usePerShapeDefaults.current && useDefaults
								? (shapeDefaults?.canopyDarkColor ??
									treeConfig.current.canopyDarkColor)
								: treeConfig.current.canopyDarkColor,
						trunkHue:
							usePerShapeDefaults.current && useDefaults
								? (shapeDefaults?.trunkHue ?? treeConfig.current.trunkHue)
								: treeConfig.current.trunkHue,
						trunkSaturation:
							usePerShapeDefaults.current && useDefaults
								? (shapeDefaults?.trunkSaturation ??
									treeConfig.current.trunkSaturation)
								: treeConfig.current.trunkSaturation,
						trunkLightness:
							usePerShapeDefaults.current && useDefaults
								? (shapeDefaults?.trunkLightness ??
									treeConfig.current.trunkLightness)
								: treeConfig.current.trunkLightness,
					}}
					{showCanopy}
					{showBranches}
					{showTrunk}
					{showAnchors}
					{showViewBox}
					{animateCanopySway}
					{animateBranches}
					{animateGrowth}
					{growthVariance}
					{toolVisibility}
					{animateTools}
					overlayConfig={overlayConfig.config}
					groundElements={overlayConfig.groundEnabled}
					onanchors={(anchors) => {
						treeAnchorsMap.set(index, { roots: anchors.roots });
					}}
					class="h-auto w-full"
				/>
			</div>
		{/each}

		{#if showRootConnections && scenePlacements.length >= 2}
			<svg class="pointer-events-none absolute inset-0 h-full w-full">
				{#each scenePlacements.slice(1) as connectedPlacement, i (connectedPlacement.seed)}
					{@const fromAnchors = treeAnchorsMap.get(0)}
					{@const toAnchors = treeAnchorsMap.get(i + 1)}
					{#if fromAnchors && toAnchors}
						<RootConnection
							from={fromAnchors.roots}
							to={toAnchors.roots}
							state={CONNECTION_STATES.connected}
							seed={i * 1000}
						/>
					{/if}
				{/each}
			</svg>
		{/if}

		<EnvironmentOverlay config={environmentConfig} lightAngle={treeConfig.current.lightAngle} />

		<SceneFloatingButtons onReset={resetAll} onRandomize={randomizeSeed} />
	</div>

	<!-- Shared Controls -->
	<aside data-testid="scene-controls" class="select-none overflow-y-auto px-6 pb-6">
		<SettingsTierControl />
		<div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 p-px">
			<!-- Scene Layout -->
			<SectionCard title="Scene" contentClass="space-y-4">
				<LabeledSlider
					label="Tree Count"
					min={SCENE_LIMITS.treeCountMin}
					max={SCENE_LIMITS.treeCountMax}
					bind:value={sceneConfig.treeCount}
					id="tree-count"
				/>
				{#if isIntermediate}
					<LabeledSlider
						label="Depth Spread"
						min={SCENE_LIMITS.depthSpreadMin}
						max={SCENE_LIMITS.depthSpreadMax}
						bind:value={sceneConfig.depthSpread}
						id="depth-spread"
					/>
				{/if}
			</SectionCard>

			<!-- Shape -->
			<ShapeCard
				{treeConfig}
				mode="scene"
				sceneShapeSelection={sceneConfig.sceneShape}
				bind:usePerShapeDefaults={usePerShapeDefaults.current}
				{onSceneShapeChange}
				{onStageChange}
				onRandomizeSeed={randomizeSeed}
			/>

			<CanopyCard
				{treeConfig}
				mode="scene"
				{sceneShapeIsRandom}
				onBlobCountChange={(v) => (treeConfig.current.blobCount = v)}
			/>

			<CanopyColorCard
				bind:lightColor={treeConfig.current.canopyLightColor}
				bind:darkColor={treeConfig.current.canopyDarkColor}
				disabled={usePerShapeDefaults.current && sceneShapeIsRandom}
			/>

			<TrunkColorCard
				bind:hue={treeConfig.current.trunkHue}
				bind:saturation={treeConfig.current.trunkSaturation}
				bind:lightness={treeConfig.current.trunkLightness}
				disabled={usePerShapeDefaults.current && sceneShapeIsRandom}
			/>

			<TrunkCard {treeConfig} mode="scene" {sceneShapeIsRandom} />

			<BranchesCard {treeConfig} mode="scene" {sceneShapeIsRandom} />

			<LightingCard
				bind:lightAngle={treeConfig.current.lightAngle}
				bind:depthVariance={treeConfig.current.depthVariance}
			/>

			{#if isIntermediate}
				<SectionCard title="Environment" contentClass="space-y-4">
					<div class="flex items-center gap-2">
						<Checkbox
							data-testid="env-rain-toggle"
							checked={environmentConfig.rainEnabled}
							onCheckedChange={(v) => (environmentConfig.rainEnabled = v === true)}
						/>
						<Label>Rain</Label>
					</div>
					{#if isAdvanced && environmentConfig.rainEnabled}
						<LabeledSlider
							label="Rain Intensity"
							min={ENVIRONMENT_LIMITS.rainIntensityMin}
							max={ENVIRONMENT_LIMITS.rainIntensityMax}
							bind:value={environmentConfig.rainIntensity}
							id="rain-intensity"
						/>
					{/if}
					{#each ENVIRONMENT_TOGGLES as toggle (toggle.key)}
						<div class="flex items-center gap-2">
							<Checkbox
								data-testid={toggle.testId}
								checked={environmentConfig[toggle.key]}
								onCheckedChange={(v) =>
									(environmentConfig[toggle.key] = v === true)}
							/>
							<Label>{toggle.label}</Label>
						</div>
					{/each}
				</SectionCard>
			{/if}

			<ToolAccessoriesCard bind:toolVisibility bind:animateTools />

			<DebugCard
				mode="scene"
				bind:showCanopy
				bind:showBranches
				bind:showTrunk
				bind:showAnchors
				bind:showViewBox
			/>

			<AnimationsCard
				bind:animateCanopySway
				bind:animateBranches
				bind:animateGrowth
				bind:growthVariance
			/>

			<OverlaysCard {overlayConfig} />

			<SectionCard title="Connections" contentClass="space-y-4">
				<LabeledCheckbox
					label="Root Connections"
					testId="root-connections-toggle"
					bind:checked={showRootConnections}
				/>
			</SectionCard>
		</div>
	</aside>
</main>
