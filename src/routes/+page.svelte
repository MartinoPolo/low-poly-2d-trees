<script lang="ts">
	import LowPolyTree from '$lib/trees/LowPolyTree.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import SectionCard from '$lib/components/composed/SectionCard.svelte';
	import LabeledRangeSlider from '$lib/components/composed/LabeledRangeSlider.svelte';
	import CanopyColorCard from '$lib/components/composed/CanopyColorCard.svelte';
	import TrunkColorCard from '$lib/components/composed/TrunkColorCard.svelte';
	import { SHAPE_DEFAULTS } from '$lib/trees/types.js';
	import { isParamDisabled } from '$lib/trees/disabled_params.js';
	import {
		TOOL_OPTIONS,
		DEFAULT_TOOL_VISIBILITY,
		type ToolVisibility,
	} from '$lib/trees/tools/tool_types.js';
	import { createTreeConfigContext } from '$lib/trees/tree_config.context.svelte.js';
	import { createSceneConfigContext } from '$lib/scene/scene_config.context.svelte.js';
	import { generateSceneLayout } from '$lib/scene/scene_layout.js';
	import { SCENE_LIMITS } from '$lib/scene/scene_config.js';
	import { createEnvironmentConfigContext } from '$lib/environment/environment_config.context.svelte.js';
	import { ENVIRONMENT_LIMITS } from '$lib/environment/environment_config.js';
	import EnvironmentOverlay from '$lib/environment/EnvironmentOverlay.svelte';
	import Shuffle from '@lucide/svelte/icons/shuffle';

	const treeConfig = createTreeConfigContext();
	const sceneConfig = createSceneConfigContext();
	const environmentConfig = createEnvironmentConfigContext();

	let usePerShapeDefaults = $state(false);
	let showAnchors = $state(false);
	let showCanopy = $state(true);
	let showBranches = $state(true);
	let showTrunk = $state(true);
	let animateCanopySway = $state(false);
	let animateBranches = $state(false);
	let animateGrowth = $state(false);
	let toolVisibility: ToolVisibility = $state({ ...DEFAULT_TOOL_VISIBILITY });
	let animateTools = $state(false);

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
</script>

<svelte:head>
	<title>Scene Editor</title>
</svelte:head>

<main class="grid h-dvh grid-rows-[1fr] bg-background text-foreground">
	<div class="grid grid-cols-[1fr_320px] overflow-hidden xl:grid-cols-[1fr_640px]">
		<!-- Scene Preview -->
		<div
			data-testid="scene-canvas"
			class="relative overflow-hidden rounded-xl border border-border bg-muted/30"
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
						width: {160 * placement.scale}px;
					"
				>
					<LowPolyTree
						config={{
							...treeConfig.current,
							shape: placement.shape,
							seed: placement.seed,
							blobCount: shapeDefaults.blobCount,
							branchCount: shapeDefaults.branchCount,
							blobSizeVariance: shapeDefaults.blobSizeVariance,
							blobCloseness: shapeDefaults.blobCloseness,
							branchThickness: shapeDefaults.branchThickness,
							trunkSegments: shapeDefaults.trunkSegments,
							trunkCrookedness: shapeDefaults.trunkCrookedness,
							branchLength: shapeDefaults.branchLength,
							branchLengthVariance: shapeDefaults.branchLengthVariance,
							canopyLightColor: usePerShapeDefaults
								? shapeDefaults.canopyLightColor
								: treeConfig.current.canopyLightColor,
							canopyDarkColor: usePerShapeDefaults
								? shapeDefaults.canopyDarkColor
								: treeConfig.current.canopyDarkColor,
							trunkHue: usePerShapeDefaults
								? shapeDefaults.trunkHue
								: treeConfig.current.trunkHue,
							trunkSaturation: usePerShapeDefaults
								? shapeDefaults.trunkSaturation
								: treeConfig.current.trunkSaturation,
							trunkLightness: usePerShapeDefaults
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
						{toolVisibility}
						{animateTools}
						class="h-auto w-full"
					/>
				</div>
			{/each}
			<EnvironmentOverlay
				config={environmentConfig}
				lightAngle={treeConfig.current.lightAngle}
			/>
		</div>

		<!-- Shared Controls -->
		<aside data-testid="scene-controls" class="select-none overflow-y-auto p-6">
			<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<SectionCard title="Scene Settings" contentClass="space-y-4">
					<LabeledRangeSlider
						label="Tree Count"
						min={SCENE_LIMITS.treeCountMin}
						max={SCENE_LIMITS.treeCountMax}
						bind:value={sceneConfig.treeCount}
						id="tree-count"
					/>
					<LabeledRangeSlider
						label="Depth Spread"
						min={SCENE_LIMITS.depthSpreadMin}
						max={SCENE_LIMITS.depthSpreadMax}
						bind:value={sceneConfig.depthSpread}
						id="depth-spread"
					/>
					<div class="space-y-2">
						<Label>Base Seed</Label>
						<div class="flex gap-2">
							<Input
								type="number"
								bind:value={treeConfig.current.seed}
								class="flex-1"
							/>
							<Button variant="outline" size="icon" onclick={randomizeSeed}>
								<Shuffle />
							</Button>
						</div>
					</div>
					<div class="space-y-2">
						<Label>Canopy Polygons: {treeConfig.current.canopyPolygons}</Label>
						<input
							type="range"
							min="10"
							max="150"
							bind:value={treeConfig.current.canopyPolygons}
							class="w-full accent-primary"
						/>
					</div>
					<div class="space-y-2">
						<Label>Trunk Polygons: {treeConfig.current.trunkPolygons}</Label>
						<input
							type="range"
							min="10"
							max="100"
							bind:value={treeConfig.current.trunkPolygons}
							class="w-full accent-primary"
						/>
					</div>
				</SectionCard>

				<SectionCard title="Canopy" contentClass="space-y-4">
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
				</SectionCard>

				<SectionCard title="Trunk & Branches" contentClass="space-y-4">
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
					<div class="space-y-2">
						<Label>
							Trunk/Branch Ratio: {treeConfig.current.trunkBranchRatio}%
						</Label>
						<input
							type="range"
							min="30"
							max="100"
							bind:value={treeConfig.current.trunkBranchRatio}
							class="w-full accent-primary"
						/>
					</div>
					<LabeledRangeSlider
						label="Trunk Lean"
						min={-45}
						max={45}
						step={1}
						unit="°"
						bind:value={treeConfig.current.trunkLean}
					/>
					<LabeledRangeSlider
						label="Trunk Segments"
						min={1}
						max={5}
						step={1}
						bind:value={treeConfig.current.trunkSegments}
					/>
					<LabeledRangeSlider
						label="Trunk Crookedness"
						min={0}
						max={100}
						step={5}
						unit="%"
						bind:value={treeConfig.current.trunkCrookedness}
						disabled={trunkCrookednessDisabled}
					/>
					<LabeledRangeSlider
						label="Branch Length"
						min={25}
						max={400}
						step={5}
						unit="%"
						bind:value={treeConfig.current.branchLength}
					/>
					<LabeledRangeSlider
						label="Branch Length Variance"
						min={0}
						max={100}
						step={5}
						unit="%"
						bind:value={treeConfig.current.branchLengthVariance}
					/>
				</SectionCard>

				<SectionCard title="Color Mode" contentClass="space-y-4">
					<div class="flex items-center gap-2">
						<Checkbox
							id="use-per-shape-defaults"
							checked={usePerShapeDefaults}
							onCheckedChange={(v) => (usePerShapeDefaults = v === true)}
						/>
						<Label for="use-per-shape-defaults">Use per-shape default colors</Label>
					</div>
					<p class="text-xs text-muted-foreground">
						When enabled, each tree uses its shape's default palette and the shared
						color controls below are disabled.
					</p>
				</SectionCard>

				<CanopyColorCard
					bind:lightColor={treeConfig.current.canopyLightColor}
					bind:darkColor={treeConfig.current.canopyDarkColor}
					disabled={usePerShapeDefaults}
				/>

				<TrunkColorCard
					bind:hue={treeConfig.current.trunkHue}
					bind:saturation={treeConfig.current.trunkSaturation}
					bind:lightness={treeConfig.current.trunkLightness}
					disabled={usePerShapeDefaults}
				/>

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
					<div class="space-y-2">
						<Label>
							Depth Variance: {treeConfig.current.depthVariance.toFixed(1)}
						</Label>
						<input
							type="range"
							min="0"
							max="2"
							step="0.1"
							bind:value={treeConfig.current.depthVariance}
							class="w-full accent-primary"
						/>
					</div>
				</SectionCard>

				<SectionCard title="Environment" contentClass="space-y-4">
					<div class="flex items-center gap-2">
						<Checkbox
							data-testid="env-rain-toggle"
							checked={environmentConfig.rainEnabled}
							onCheckedChange={(v) => (environmentConfig.rainEnabled = v === true)}
						/>
						<Label>Rain</Label>
					</div>
					{#if environmentConfig.rainEnabled}
						<LabeledRangeSlider
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

				<SectionCard title="Tools & Accessories" contentClass="space-y-4">
					{#each TOOL_OPTIONS as option (option.value)}
						<div class="flex items-center gap-2">
							<Checkbox
								data-testid="tool-{option.value}-visible"
								checked={toolVisibility[option.value].visible}
								onCheckedChange={(v) =>
									(toolVisibility[option.value] = {
										...toolVisibility[option.value],
										visible: v === true,
									})}
							/>
							<Label>{option.label}</Label>
						</div>
						{#if toolVisibility[option.value].visible}
							<LabeledRangeSlider
								label="{option.label} Size"
								min={0.5}
								max={2}
								step={0.1}
								bind:value={toolVisibility[option.value].size}
								id="tool-{option.value}-size"
							/>
						{/if}
					{/each}
					<div class="flex items-center gap-2">
						<Checkbox
							data-testid="animate-tools"
							checked={animateTools}
							onCheckedChange={(v) => (animateTools = v === true)}
						/>
						<Label>Animate Tools</Label>
					</div>
				</SectionCard>

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
					</div>
				</SectionCard>
			</div>
		</aside>
	</div>
</main>
