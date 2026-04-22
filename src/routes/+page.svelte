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
	import { setTreeConfigContext } from '$lib/trees/tree_config.context.svelte.js';
	import { setSceneConfigContext } from '$lib/scene/scene_config.context.svelte.js';
	import { generateSceneLayout, computeGroundHeightPercent } from '$lib/scene/scene_layout.js';
	import { setEnvironmentConfigContext } from '$lib/environment/environment_config.context.svelte.js';
	import { ENVIRONMENT_LIMITS } from '$lib/environment/environment_config.js';
	import EnvironmentOverlay from '$lib/environment/EnvironmentOverlay.svelte';
	import { setOverlayConfigContext } from '$lib/trees/overlays/overlay_config.context.svelte.js';
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
	import { PaneGroup, Pane, Handle } from '$lib/components/ui/resizable/index.js';

	const USE_PER_SHAPE_DEFAULTS_KEY = 'use-per-shape-defaults';

	const treeConfig = setTreeConfigContext();
	const sceneConfig = setSceneConfigContext();
	const environmentConfig = setEnvironmentConfigContext();
	const overlayConfig = setOverlayConfigContext();
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

	const sceneShapeIsRandom = $derived(sceneConfig.sceneShape.current === SCENE_SHAPE_RANDOM);

	const scenePlacements = $derived(
		generateSceneLayout({
			treeCount: sceneConfig.treeCount.current,
			depthSpread: sceneConfig.depthSpread.current,
			baseSeed: treeConfig.current.seed,
			sceneShape: sceneConfig.sceneShape.current,
		}),
	);

	const groundHeightPercent = $derived(
		computeGroundHeightPercent(sceneConfig.depthSpread.current, sceneConfig.treeCount.current),
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
			sceneConfig.sceneShape.current = SCENE_SHAPE_RANDOM;
			return;
		}
		if (!isSceneShapeSelection(value)) {
			return;
		}
		sceneConfig.sceneShape.current = value;
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

<main class="h-dvh overflow-hidden bg-background text-foreground">
	<PaneGroup direction="vertical" autoSaveId="scene-editor-resize">
		<Pane defaultSize={30} minSize={15}>
			<!-- Scene Preview -->
			<div
				data-testid="scene-canvas"
				class="relative h-full overflow-hidden border border-border"
			>
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
											branchLengthVariance:
												shapeDefaults.branchLengthVariance,
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
							overlayConfig={overlayConfig.config.current}
							groundElements={overlayConfig.groundEnabled.current}
							groundElementCount={overlayConfig.groundElementCount.current}
							groundElementSize={overlayConfig.groundElementSize.current}
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

				<EnvironmentOverlay
					config={environmentConfig.config.current}
					lightAngle={treeConfig.current.lightAngle}
				/>

				<SceneFloatingButtons onReset={resetAll} onRandomize={randomizeSeed} />
			</div>
		</Pane>
		<Handle withHandle />
		<Pane defaultSize={70}>
			<!-- Shared Controls -->
			<aside
				data-testid="scene-controls"
				class="h-full select-none overflow-y-auto px-6 pb-6"
			>
				<SettingsTierControl />
				<div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 p-px">
					<!-- Scene Layout -->
					<SectionCard title="Scene" contentClass="space-y-4">
						<LabeledSlider
							label="Tree Count"
							min={SCENE_LIMITS.treeCountMin}
							max={SCENE_LIMITS.treeCountMax}
							bind:value={sceneConfig.treeCount.current}
							id="tree-count"
						/>
						{#if isIntermediate}
							<LabeledSlider
								label="Depth Spread"
								min={SCENE_LIMITS.depthSpreadMin}
								max={SCENE_LIMITS.depthSpreadMax}
								bind:value={sceneConfig.depthSpread.current}
								id="depth-spread"
							/>
						{/if}
					</SectionCard>

					<!-- Shape -->
					<ShapeCard
						mode="scene"
						sceneShapeSelection={sceneConfig.sceneShape.current}
						bind:usePerShapeDefaults={usePerShapeDefaults.current}
						{onSceneShapeChange}
						{onStageChange}
						onRandomizeSeed={randomizeSeed}
					/>

					<CanopyCard
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

					<TrunkCard mode="scene" {sceneShapeIsRandom} />

					<BranchesCard mode="scene" {sceneShapeIsRandom} />

					<LightingCard
						bind:lightAngle={treeConfig.current.lightAngle}
						bind:depthVariance={treeConfig.current.depthVariance}
					/>

					{#if isIntermediate}
						<SectionCard title="Environment" contentClass="space-y-4">
							<div class="flex items-center gap-2">
								<Checkbox
									data-testid="env-rain-toggle"
									checked={environmentConfig.rainEnabled.current}
									onCheckedChange={(v) =>
										(environmentConfig.rainEnabled.current = v === true)}
								/>
								<Label>Rain</Label>
							</div>
							{#if isAdvanced && environmentConfig.rainEnabled.current}
								<LabeledSlider
									label="Rain Intensity"
									min={ENVIRONMENT_LIMITS.rainIntensityMin}
									max={ENVIRONMENT_LIMITS.rainIntensityMax}
									bind:value={environmentConfig.rainIntensity.current}
									id="rain-intensity"
								/>
							{/if}
							{#each ENVIRONMENT_TOGGLES as toggle (toggle.key)}
								<div class="flex items-center gap-2">
									<Checkbox
										data-testid={toggle.testId}
										checked={environmentConfig[toggle.key].current}
										onCheckedChange={(v) =>
											(environmentConfig[toggle.key].current = v === true)}
									/>
									<Label>{toggle.label}</Label>
								</div>
							{/each}
						</SectionCard>
					{/if}

					<ToolAccessoriesCard bind:toolVisibility />

					<AnimationsCard
						bind:animateCanopySway
						bind:animateBranches
						bind:animateGrowth
						bind:growthVariance
						bind:animateTools
					/>

					<DebugCard
						mode="scene"
						bind:showCanopy
						bind:showBranches
						bind:showTrunk
						bind:showAnchors
						bind:showViewBox
					/>

					<OverlaysCard />

					<SectionCard title="Connections" contentClass="space-y-4">
						<LabeledCheckbox
							label="Root Connections"
							testId="root-connections-toggle"
							bind:checked={showRootConnections}
						/>
					</SectionCard>
				</div>
			</aside>
		</Pane>
	</PaneGroup>
</main>
