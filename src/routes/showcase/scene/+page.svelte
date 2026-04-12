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
	import { DEFAULT_TREE_CONFIG, SHAPE_DEFAULTS } from '$lib/trees/types.js';
	import { isParamDisabled } from '$lib/trees/disabled_params.js';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
	import { resolve } from '$app/paths';
	import Shuffle from '@lucide/svelte/icons/shuffle';

	let seed = $state(DEFAULT_TREE_CONFIG.seed);
	let canopyPolygons = $state(DEFAULT_TREE_CONFIG.canopyPolygons);
	let trunkPolygons = $state(DEFAULT_TREE_CONFIG.trunkPolygons);
	let canopyLightColor = $state(DEFAULT_TREE_CONFIG.canopyLightColor);
	let canopyDarkColor = $state(DEFAULT_TREE_CONFIG.canopyDarkColor);
	let trunkHue = $state(DEFAULT_TREE_CONFIG.trunkHue);
	let trunkSaturation = $state(DEFAULT_TREE_CONFIG.trunkSaturation);
	let trunkLightness = $state(DEFAULT_TREE_CONFIG.trunkLightness);
	let usePerShapeDefaults = $state(false);
	let lightAngle = $state(DEFAULT_TREE_CONFIG.lightAngle);
	let depthVariance = $state(DEFAULT_TREE_CONFIG.depthVariance);
	let blobSizeVariance = $state(DEFAULT_TREE_CONFIG.blobSizeVariance);
	let blobCloseness = $state(DEFAULT_TREE_CONFIG.blobCloseness);
	let trunkThickness = $state(DEFAULT_TREE_CONFIG.trunkThickness);
	let branchThickness = $state(DEFAULT_TREE_CONFIG.branchThickness);
	let canopySize = $state(DEFAULT_TREE_CONFIG.canopySize);
	let trunkHeight = $state(DEFAULT_TREE_CONFIG.trunkHeight);
	let trunkBranchRatio = $state(DEFAULT_TREE_CONFIG.trunkBranchRatio);
	let trunkLean = $state(DEFAULT_TREE_CONFIG.trunkLean);
	let trunkSegments = $state(DEFAULT_TREE_CONFIG.trunkSegments);
	let trunkCrookedness = $state(DEFAULT_TREE_CONFIG.trunkCrookedness);
	let branchLength = $state(DEFAULT_TREE_CONFIG.branchLength);
	let branchLengthVariance = $state(DEFAULT_TREE_CONFIG.branchLengthVariance);
	let showAnchors = $state(false);
	let showCanopy = $state(true);
	let showBranches = $state(true);
	let showTrunk = $state(true);

	// Scene sliders apply uniformly to all trees, so no single shape drives the
	// disable rule — pass 'custom' (empty per-shape disable list) to evaluate
	// only the cross-param rule (trunkCrookedness disabled when segments=1).
	const trunkCrookednessDisabled = $derived(
		isParamDisabled('custom', 'trunkCrookedness', { trunkSegments }),
	);

	function randomizeSeed() {
		seed = Math.floor(Math.random() * 100000);
	}

	// Scene previews oak/pine/birch. Expanding to all 6 non-custom shapes
	// (REQ-S-06) is tracked separately — issue #9 scope is color overhaul only.
	const trees = [
		{ shape: 'oak' as const, ...SHAPE_DEFAULTS.oak, seedOffset: 0 },
		{ shape: 'pine' as const, ...SHAPE_DEFAULTS.pine, seedOffset: 1000 },
		{ shape: 'birch' as const, ...SHAPE_DEFAULTS.birch, seedOffset: 2000 },
	] as const;
</script>

<main class="grid h-dvh grid-rows-[auto_1fr] bg-background text-foreground">
	<header class="border-b border-border">
		<div class="flex items-center justify-between px-6 py-4">
			<div class="flex items-center gap-4">
				<h1 class="text-xl font-bold tracking-tight">Tree Scene</h1>
				<a
					href={resolve('/showcase')}
					class="text-sm text-muted-foreground underline-offset-4 hover:underline"
				>
					Single Editor
				</a>
			</div>
			<DarkModeToggle />
		</div>
	</header>

	<div class="grid grid-cols-[320px_1fr] overflow-hidden xl:grid-cols-[640px_1fr]">
		<!-- Shared Controls -->
		<aside class="select-none overflow-y-auto p-6">
			<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<SectionCard title="Scene Settings" contentClass="space-y-4">
					<div class="space-y-2">
						<Label>Base Seed</Label>
						<div class="flex gap-2">
							<Input type="number" bind:value={seed} class="flex-1" />
							<Button variant="outline" size="icon" onclick={randomizeSeed}>
								<Shuffle />
							</Button>
						</div>
					</div>
					<LabeledRangeSlider
						label="Canopy Polygons"
						min={10}
						max={150}
						bind:value={canopyPolygons}
					/>
					<LabeledRangeSlider
						label="Trunk Polygons"
						min={10}
						max={100}
						bind:value={trunkPolygons}
					/>
				</SectionCard>

				<SectionCard title="Canopy" contentClass="space-y-4">
					<LabeledRangeSlider
						label="Blob Size Variance"
						min={1}
						max={10}
						step={0.1}
						format={(v) => v.toFixed(1)}
						unit="x"
						bind:value={blobSizeVariance}
					/>
					<LabeledRangeSlider
						label="Blob Closeness"
						min={0}
						max={100}
						unit="%"
						bind:value={blobCloseness}
					/>
					<LabeledRangeSlider
						label="Canopy Size"
						min={25}
						max={400}
						step={5}
						unit="%"
						bind:value={canopySize}
					/>
				</SectionCard>

				<SectionCard title="Trunk & Branches" contentClass="space-y-4">
					<LabeledRangeSlider
						label="Trunk Height"
						min={50}
						max={150}
						unit="%"
						bind:value={trunkHeight}
					/>
					<LabeledRangeSlider
						label="Trunk Thickness"
						min={25}
						max={400}
						step={5}
						unit="%"
						bind:value={trunkThickness}
					/>
					<LabeledRangeSlider
						label="Branch Thickness"
						min={25}
						max={400}
						step={5}
						unit="%"
						bind:value={branchThickness}
					/>
					<LabeledRangeSlider
						label="Trunk/Branch Ratio"
						min={30}
						max={100}
						unit="%"
						bind:value={trunkBranchRatio}
					/>
					<LabeledRangeSlider
						label="Trunk Lean"
						min={-45}
						max={45}
						step={1}
						unit="°"
						bind:value={trunkLean}
					/>
					<LabeledRangeSlider
						label="Trunk Segments"
						min={1}
						max={5}
						step={1}
						bind:value={trunkSegments}
					/>
					<LabeledRangeSlider
						label="Trunk Crookedness"
						min={0}
						max={100}
						step={5}
						unit="%"
						bind:value={trunkCrookedness}
						disabled={trunkCrookednessDisabled}
					/>
					<LabeledRangeSlider
						label="Branch Length"
						min={25}
						max={400}
						step={5}
						unit="%"
						bind:value={branchLength}
					/>
					<LabeledRangeSlider
						label="Branch Length Variance"
						min={0}
						max={100}
						step={5}
						unit="%"
						bind:value={branchLengthVariance}
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
					bind:lightColor={canopyLightColor}
					bind:darkColor={canopyDarkColor}
					disabled={usePerShapeDefaults}
				/>

				<TrunkColorCard
					bind:hue={trunkHue}
					bind:saturation={trunkSaturation}
					bind:lightness={trunkLightness}
					disabled={usePerShapeDefaults}
				/>

				<SectionCard title="Lighting" contentClass="space-y-4">
					<LabeledRangeSlider
						label="Light Angle"
						min={0}
						max={360}
						unit="°"
						bind:value={lightAngle}
					/>
					<LabeledRangeSlider
						label="Depth Variance"
						min={0}
						max={2}
						step={0.1}
						format={(v) => v.toFixed(1)}
						bind:value={depthVariance}
					/>
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
			</div>
		</aside>

		<!-- Scene Preview -->
		<div
			class="flex items-center justify-center gap-8 rounded-xl border border-border bg-muted/30 p-8"
		>
			{#each trees as tree (tree.shape)}
				<div class="flex w-full max-w-[200px] flex-col items-center gap-2">
					<LowPolyTree
						shape={tree.shape}
						seed={seed + tree.seedOffset}
						{canopyPolygons}
						{trunkPolygons}
						canopyLightColor={usePerShapeDefaults
							? tree.canopyLightColor
							: canopyLightColor}
						canopyDarkColor={usePerShapeDefaults
							? tree.canopyDarkColor
							: canopyDarkColor}
						trunkHue={usePerShapeDefaults ? tree.trunkHue : trunkHue}
						trunkSaturation={usePerShapeDefaults
							? tree.trunkSaturation
							: trunkSaturation}
						trunkLightness={usePerShapeDefaults ? tree.trunkLightness : trunkLightness}
						{lightAngle}
						{depthVariance}
						{blobSizeVariance}
						{blobCloseness}
						{trunkThickness}
						{branchThickness}
						{canopySize}
						{trunkHeight}
						{trunkBranchRatio}
						{trunkLean}
						{trunkSegments}
						{trunkCrookedness}
						{branchLength}
						{branchLengthVariance}
						blobCount={tree.blobCount}
						branchCount={tree.branchCount}
						{showCanopy}
						{showBranches}
						{showTrunk}
						{showAnchors}
						class="h-auto w-full"
					/>
					<span class="text-sm font-medium capitalize text-muted-foreground">
						{tree.shape}
					</span>
				</div>
			{/each}
		</div>
	</div>
</main>
