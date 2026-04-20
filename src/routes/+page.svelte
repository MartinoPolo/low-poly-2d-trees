<script lang="ts">
	import LowPolyTree from '$lib/trees/LowPolyTree.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import SectionCard from '$lib/components/composed/SectionCard.svelte';
	import LabeledSlider from '$lib/components/composed/LabeledSlider.svelte';
	import LabeledSelect from '$lib/components/composed/LabeledSelect.svelte';
	import CanopyColorCard from '$lib/components/composed/CanopyColorCard.svelte';
	import TrunkColorCard from '$lib/components/composed/TrunkColorCard.svelte';
	import { SHAPE_DEFAULTS, TREE_STAGE_OPTIONS, isTreeStage } from '$lib/trees/types.js';
	import { isParamDisabled } from '$lib/trees/disabled_params.js';
	import {
		createDefaultToolVisibility,
		type ToolVisibility,
	} from '$lib/trees/tools/tool_types.js';
	import ToolAccessoriesCard from '$lib/components/composed/ToolAccessoriesCard.svelte';
	import OverlaysCard from '$lib/components/composed/OverlaysCard.svelte';
	import { createTreeConfigContext } from '$lib/trees/tree_config.context.svelte.js';
	import { createSceneConfigContext } from '$lib/scene/scene_config.context.svelte.js';
	import { generateSceneLayout } from '$lib/scene/scene_layout.js';
	import { SCENE_LIMITS } from '$lib/scene/scene_config.js';
	import { createEnvironmentConfigContext } from '$lib/environment/environment_config.context.svelte.js';
	import { ENVIRONMENT_LIMITS } from '$lib/environment/environment_config.js';
	import EnvironmentOverlay from '$lib/environment/EnvironmentOverlay.svelte';
	import { createOverlayConfigContext } from '$lib/trees/overlays/overlay_config.context.svelte.js';
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

	const usePerShapeDefaults = new Persisted<boolean>({
		key: USE_PER_SHAPE_DEFAULTS_KEY,
		serde: jsonSerde(isValidBoolean),
		defaultValue: true,
	});
	let showAnchors = $state(false);
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

	const { tier } = use_settings_tier();
	const isIntermediate = $derived(tierAtLeast(tier.current, 'intermediate'));
	const isAdvanced = $derived(tierAtLeast(tier.current, 'advanced'));

	const trunkCrookednessDisabled = $derived(
		isParamDisabled('custom', 'trunkCrookedness', {
			trunkSegments: treeConfig.current.trunkSegments,
		}),
	);

	const scenePlacements = $derived(
		generateSceneLayout({
			treeCount: sceneConfig.treeCount,
			depthSpread: sceneConfig.depthSpread,
			baseSeed: treeConfig.current.seed,
		}),
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
	<div
		data-testid="scene-canvas"
		class="relative overflow-hidden border border-border bg-linear-to-b from-sky-200 to-white dark:from-[#0a1628] dark:to-[#1a2744]"
	>
		{#each scenePlacements as placement, index (index)}
			{@const shapeDefaults = SHAPE_DEFAULTS[placement.shape]}
			<div
				data-testid="scene-tree"
				class="absolute bottom-0"
				style="
						left: {placement.x}%;
						bottom: {placement.y}%;
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
						branchLength: shapeDefaults.branchLength,
						branchLengthVariance: shapeDefaults.branchLengthVariance,
						canopyLightColor: usePerShapeDefaults.current
							? shapeDefaults.canopyLightColor
							: treeConfig.current.canopyLightColor,
						canopyDarkColor: usePerShapeDefaults.current
							? shapeDefaults.canopyDarkColor
							: treeConfig.current.canopyDarkColor,
						trunkHue: usePerShapeDefaults.current
							? shapeDefaults.trunkHue
							: treeConfig.current.trunkHue,
						trunkSaturation: usePerShapeDefaults.current
							? shapeDefaults.trunkSaturation
							: treeConfig.current.trunkSaturation,
						trunkLightness: usePerShapeDefaults.current
							? shapeDefaults.trunkLightness
							: treeConfig.current.trunkLightness,
					}}
					{showCanopy}
					{showBranches}
					{showTrunk}
					{showAnchors}
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

		<div
			class="pointer-events-none absolute inset-x-0 bottom-0 h-[12%] bg-linear-to-t from-[#5c4033]/80 to-transparent dark:from-[#2d1b0e]/80 dark:to-transparent"
		></div>

		<EnvironmentOverlay config={environmentConfig} lightAngle={treeConfig.current.lightAngle} />

		<SceneFloatingButtons onReset={resetAll} onRandomize={randomizeSeed} />
	</div>

	<!-- Shared Controls -->
	<aside data-testid="scene-controls" class="select-none overflow-y-auto px-6 pb-6">
		<SettingsTierControl />
		<div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 p-px">
			<SectionCard title="Scene Settings" contentClass="space-y-4">
				<LabeledSelect
					label="Life Stage"
					options={TREE_STAGE_OPTIONS}
					value={treeConfig.current.stage}
					onValueChange={onStageChange}
				/>
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
				{#if isAdvanced}
					<div class="space-y-2">
						<Label>Base Seed</Label>
						<Input type="number" bind:value={treeConfig.current.seed} />
					</div>
					<div class="space-y-2">
						<Label>Polygons Per Blob: {treeConfig.current.polygonsPerBlob}</Label>
						<input
							type="range"
							min="4"
							max="30"
							bind:value={treeConfig.current.polygonsPerBlob}
							class="w-full accent-primary"
						/>
					</div>
					<div class="space-y-2">
						<Label>Trunk Strips: {treeConfig.current.trunkStripCount}</Label>
						<input
							type="range"
							min="2"
							max="4"
							bind:value={treeConfig.current.trunkStripCount}
							class="w-full accent-primary"
						/>
					</div>
				{/if}
			</SectionCard>

			<SectionCard title="Canopy" contentClass="space-y-4">
				<div class="space-y-2">
					<Label>Canopy Size: {treeConfig.current.canopySize}%</Label>
					<input
						type="range"
						min="25"
						max="400"
						step="5"
						bind:value={treeConfig.current.canopySize}
						class="w-full accent-primary"
					/>
				</div>
				{#if isAdvanced}
					<div class="space-y-2">
						<Label>
							Blob Size Variance: {treeConfig.current.blobSizeVariance.toFixed(1)}x
						</Label>
						<input
							type="range"
							min="1"
							max="10"
							step="0.1"
							bind:value={treeConfig.current.blobSizeVariance}
							class="w-full accent-primary"
						/>
					</div>
					<div class="space-y-2">
						<Label>Blob Closeness: {treeConfig.current.blobCloseness}%</Label>
						<input
							type="range"
							min="0"
							max="100"
							bind:value={treeConfig.current.blobCloseness}
							class="w-full accent-primary"
						/>
					</div>
				{/if}
			</SectionCard>

			<SectionCard title="Trunk" contentClass="space-y-4">
				<div class="space-y-2">
					<Label>Trunk Height: {treeConfig.current.trunkHeight}%</Label>
					<input
						type="range"
						min="50"
						max="150"
						bind:value={treeConfig.current.trunkHeight}
						class="w-full accent-primary"
					/>
				</div>
				<div class="space-y-2">
					<Label>Trunk Thickness: {treeConfig.current.trunkThickness}%</Label>
					<input
						type="range"
						min="25"
						max="400"
						step="5"
						bind:value={treeConfig.current.trunkThickness}
						class="w-full accent-primary"
					/>
				</div>
				{#if isIntermediate}
					<LabeledSlider
						label="Trunk Lean"
						min={-45}
						max={45}
						step={1}
						unit="°"
						bind:value={treeConfig.current.trunkLean}
					/>
					<LabeledSlider
						label="Trunk Segments"
						min={1}
						max={5}
						step={1}
						bind:value={treeConfig.current.trunkSegments}
					/>
					<LabeledSlider
						label="Trunk Crookedness"
						min={0}
						max={100}
						step={5}
						unit="%"
						bind:value={treeConfig.current.trunkCrookedness}
						disabled={trunkCrookednessDisabled}
					/>
				{/if}
			</SectionCard>

			{#if isIntermediate}
				<SectionCard title="Branches" contentClass="space-y-4">
					<div class="space-y-2">
						<Label>Branch Thickness: {treeConfig.current.branchThickness}%</Label>
						<input
							type="range"
							min="25"
							max="400"
							step="5"
							bind:value={treeConfig.current.branchThickness}
							class="w-full accent-primary"
						/>
					</div>
					<LabeledSlider
						label="Branch Length"
						min={25}
						max={400}
						step={5}
						unit="%"
						bind:value={treeConfig.current.branchLength}
					/>
					<LabeledSlider
						label="Branch Length Variance"
						min={0}
						max={100}
						step={5}
						unit="%"
						bind:value={treeConfig.current.branchLengthVariance}
					/>
					{#if isAdvanced}
						<LabeledSlider
							label="Depth Variance"
							min={0}
							max={2}
							step={0.1}
							format={(v) => v.toFixed(1)}
							bind:value={treeConfig.current.depthVariance}
						/>
					{/if}
				</SectionCard>
			{/if}

			<SectionCard title="Lighting" contentClass="space-y-4">
				<div class="space-y-2">
					<Label>Light Angle: {treeConfig.current.lightAngle}°</Label>
					<input
						type="range"
						min="0"
						max="360"
						bind:value={treeConfig.current.lightAngle}
						class="w-full accent-primary"
					/>
				</div>
			</SectionCard>

			<SectionCard title="Color Mode" contentClass="space-y-4">
				<div class="flex items-center gap-2">
					<Checkbox
						id="use-per-shape-defaults"
						checked={usePerShapeDefaults.current}
						onCheckedChange={(v) => (usePerShapeDefaults.current = v === true)}
					/>
					<Label for="use-per-shape-defaults">Use per-shape default colors</Label>
				</div>
				<p class="text-xs text-muted-foreground">
					When enabled, each tree uses its shape's default palette and the shared color
					controls below are disabled.
				</p>
			</SectionCard>

			<CanopyColorCard
				bind:lightColor={treeConfig.current.canopyLightColor}
				bind:darkColor={treeConfig.current.canopyDarkColor}
				disabled={usePerShapeDefaults.current}
			/>

			<TrunkColorCard
				bind:hue={treeConfig.current.trunkHue}
				bind:saturation={treeConfig.current.trunkSaturation}
				bind:lightness={treeConfig.current.trunkLightness}
				disabled={usePerShapeDefaults.current}
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
					<div class="flex items-center gap-2">
						<Checkbox
							data-testid="env-lightning-toggle"
							checked={environmentConfig.lightningEnabled}
							onCheckedChange={(v) =>
								(environmentConfig.lightningEnabled = v === true)}
						/>
						<Label>Lightning</Label>
					</div>
					<div class="flex items-center gap-2">
						<Checkbox
							data-testid="env-snow-toggle"
							checked={environmentConfig.snowEnabled}
							onCheckedChange={(v) => (environmentConfig.snowEnabled = v === true)}
						/>
						<Label>Snow</Label>
					</div>
					<div class="flex items-center gap-2">
						<Checkbox
							data-testid="env-fireflies-toggle"
							checked={environmentConfig.firefliesEnabled}
							onCheckedChange={(v) =>
								(environmentConfig.firefliesEnabled = v === true)}
						/>
						<Label>Fireflies</Label>
					</div>
					<div class="flex items-center gap-2">
						<Checkbox
							data-testid="env-wind-toggle"
							checked={environmentConfig.windParticlesEnabled}
							onCheckedChange={(v) =>
								(environmentConfig.windParticlesEnabled = v === true)}
						/>
						<Label>Wind Particles</Label>
					</div>
					<div class="flex items-center gap-2">
						<Checkbox
							data-testid="env-sun-rays-toggle"
							checked={environmentConfig.sunRaysEnabled}
							onCheckedChange={(v) => (environmentConfig.sunRaysEnabled = v === true)}
						/>
						<Label>Sun Rays</Label>
					</div>
					<div class="flex items-center gap-2">
						<Checkbox
							data-testid="env-clouds-toggle"
							checked={environmentConfig.cloudsEnabled}
							onCheckedChange={(v) => (environmentConfig.cloudsEnabled = v === true)}
						/>
						<Label>Clouds</Label>
					</div>
				</SectionCard>
			{/if}

			<ToolAccessoriesCard bind:toolVisibility bind:animateTools />

			<SectionCard title="Debug" contentClass="space-y-4">
				<div class="flex items-center gap-2">
					<Checkbox
						checked={showCanopy}
						onCheckedChange={(v) => (showCanopy = v === true)}
					/>
					<Label>Show Canopy</Label>
				</div>
				<div class="flex items-center gap-2">
					<Checkbox
						checked={showBranches}
						onCheckedChange={(v) => (showBranches = v === true)}
					/>
					<Label>Show Branches</Label>
				</div>
				<div class="flex items-center gap-2">
					<Checkbox
						checked={showTrunk}
						onCheckedChange={(v) => (showTrunk = v === true)}
					/>
					<Label>Show Trunk</Label>
				</div>
				<div class="flex items-center gap-2">
					<Checkbox
						checked={showAnchors}
						onCheckedChange={(v) => (showAnchors = v === true)}
					/>
					<Label>Show Anchor Points</Label>
				</div>
			</SectionCard>

			<SectionCard title="Animations" contentClass="space-y-4">
				<div data-testid="animation-controls">
					<div class="flex items-center gap-2">
						<Checkbox
							data-testid="animate-canopy-sway"
							checked={animateCanopySway}
							onCheckedChange={(v) => (animateCanopySway = v === true)}
						/>
						<Label>Canopy Sway</Label>
					</div>
					<div class="mt-4 flex items-center gap-2">
						<Checkbox
							data-testid="animate-branches"
							checked={animateBranches}
							onCheckedChange={(v) => (animateBranches = v === true)}
						/>
						<Label>Branch Movement</Label>
					</div>
					<div class="mt-4 flex items-center gap-2">
						<Checkbox
							data-testid="animate-growth"
							checked={animateGrowth}
							onCheckedChange={(v) => (animateGrowth = v === true)}
						/>
						<Label>Growth</Label>
					</div>
					{#if animateGrowth}
						<LabeledSlider
							label="Growth Variance"
							min={0}
							max={100}
							step={5}
							unit="%"
							bind:value={growthVariance}
						/>
					{/if}
				</div>
			</SectionCard>

			<OverlaysCard {overlayConfig} />

			<SectionCard title="Connections" contentClass="space-y-4">
				<div class="flex items-center gap-2">
					<Checkbox
						data-testid="root-connections-toggle"
						checked={showRootConnections}
						onCheckedChange={(v) => (showRootConnections = v === true)}
					/>
					<Label>Root Connections</Label>
				</div>
			</SectionCard>
		</div>
	</aside>
</main>
