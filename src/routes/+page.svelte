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
	import { create_tree_config_context } from '$lib/trees/tree-config.context.svelte.js';
	import Shuffle from '@lucide/svelte/icons/shuffle';

	const treeConfig = create_tree_config_context();

	let usePerShapeDefaults = $state(false);
	let showAnchors = $state(false);
	let showCanopy = $state(true);
	let showBranches = $state(true);
	let showTrunk = $state(true);

	const trunkCrookednessDisabled = $derived(
		isParamDisabled('custom', 'trunkCrookedness', {
			trunkSegments: treeConfig.current.trunkSegments,
		}),
	);

	function randomizeSeed() {
		treeConfig.current.seed = Math.floor(Math.random() * 100000);
	}

	const trees = [
		{ shape: 'oak' as const, ...SHAPE_DEFAULTS.oak, seedOffset: 0 },
		{ shape: 'pine' as const, ...SHAPE_DEFAULTS.pine, seedOffset: 1000 },
		{ shape: 'birch' as const, ...SHAPE_DEFAULTS.birch, seedOffset: 2000 },
	] as const;
</script>

<svelte:head>
	<title>Scene Editor</title>
</svelte:head>

<main class="grid h-dvh grid-rows-[1fr] bg-background text-foreground">
	<div class="grid grid-cols-[1fr_320px] overflow-hidden xl:grid-cols-[1fr_640px]">
		<!-- Scene Preview -->
		<div
			data-testid="scene-canvas"
			class="flex items-center justify-center gap-8 rounded-xl border border-border bg-muted/30 p-8"
		>
			{#each trees as tree (tree.shape)}
				<div class="flex w-full max-w-[200px] flex-col items-center gap-2">
					<LowPolyTree
						config={{
							...treeConfig.current,
							shape: tree.shape,
							seed: treeConfig.current.seed + tree.seedOffset,
							blobCount: tree.blobCount,
							branchCount: tree.branchCount,
							blobSizeVariance: tree.blobSizeVariance,
							blobCloseness: tree.blobCloseness,
							branchThickness: tree.branchThickness,
							trunkSegments: tree.trunkSegments,
							trunkCrookedness: tree.trunkCrookedness,
							branchLength: tree.branchLength,
							branchLengthVariance: tree.branchLengthVariance,
							canopyLightColor: usePerShapeDefaults
								? tree.canopyLightColor
								: treeConfig.current.canopyLightColor,
							canopyDarkColor: usePerShapeDefaults
								? tree.canopyDarkColor
								: treeConfig.current.canopyDarkColor,
							trunkHue: usePerShapeDefaults
								? tree.trunkHue
								: treeConfig.current.trunkHue,
							trunkSaturation: usePerShapeDefaults
								? tree.trunkSaturation
								: treeConfig.current.trunkSaturation,
							trunkLightness: usePerShapeDefaults
								? tree.trunkLightness
								: treeConfig.current.trunkLightness,
						}}
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

		<!-- Shared Controls -->
		<aside data-testid="scene-controls" class="select-none overflow-y-auto p-6">
			<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<SectionCard title="Scene Settings" contentClass="space-y-4">
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
	</div>
</main>
