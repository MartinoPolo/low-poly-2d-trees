<script lang="ts">
	import LowPolyTree from '$lib/trees/LowPolyTree.svelte';
	import LabeledSelect from '$lib/components/composed/LabeledSelect.svelte';
	import LabeledRangeSlider from '$lib/components/composed/LabeledRangeSlider.svelte';
	import CanopyColorCard from '$lib/components/composed/CanopyColorCard.svelte';
	import TrunkColorCard from '$lib/components/composed/TrunkColorCard.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import {
		TREE_SHAPES,
		TREE_SHAPE_OPTIONS,
		SHAPE_DEFAULTS,
		DEFAULT_TREE_CONFIG,
		type TreeShape,
	} from '$lib/trees/types.js';
	import { isParamDisabled } from '$lib/trees/disabled_params.js';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
	import { resolve } from '$app/paths';
	import Shuffle from '@lucide/svelte/icons/shuffle';

	let shape = $state<TreeShape>(DEFAULT_TREE_CONFIG.shape);
	let seed = $state(DEFAULT_TREE_CONFIG.seed);
	let canopyPolygons = $state(DEFAULT_TREE_CONFIG.canopyPolygons);
	let trunkPolygons = $state(DEFAULT_TREE_CONFIG.trunkPolygons);
	let canopyLightColor = $state(DEFAULT_TREE_CONFIG.canopyLightColor);
	let canopyDarkColor = $state(DEFAULT_TREE_CONFIG.canopyDarkColor);
	let trunkHue = $state(DEFAULT_TREE_CONFIG.trunkHue);
	let trunkSaturation = $state(DEFAULT_TREE_CONFIG.trunkSaturation);
	let trunkLightness = $state(DEFAULT_TREE_CONFIG.trunkLightness);
	let lightAngle = $state(DEFAULT_TREE_CONFIG.lightAngle);
	let blobCount = $state(DEFAULT_TREE_CONFIG.blobCount);
	let branchCount = $state(DEFAULT_TREE_CONFIG.branchCount);
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
	let depthVariance = $state(DEFAULT_TREE_CONFIG.depthVariance);
	let showAnchors = $state(false);
	let showCanopy = $state(true);
	let showBranches = $state(true);
	let showTrunk = $state(true);

	const branchCountDisabled = $derived(isParamDisabled(shape, 'branchCount', {}));
	const trunkBranchRatioDisabled = $derived(isParamDisabled(shape, 'trunkBranchRatio', {}));
	const trunkCrookednessDisabled = $derived(
		isParamDisabled(shape, 'trunkCrookedness', { trunkSegments }),
	);

	function isTreeShape(value: string): value is TreeShape {
		return (Object.values(TREE_SHAPES) as readonly string[]).includes(value);
	}

	function onShapeChange(value: string) {
		if (!isTreeShape(value)) {
			return;
		}
		shape = value;
		if (value === TREE_SHAPES.custom) {
			return;
		}
		const defaults = SHAPE_DEFAULTS[value];
		blobCount = defaults.blobCount;
		branchCount = defaults.branchCount;
		blobSizeVariance = defaults.blobSizeVariance;
		blobCloseness = defaults.blobCloseness;
		branchThickness = defaults.branchThickness;
		trunkSegments = defaults.trunkSegments;
		trunkCrookedness = defaults.trunkCrookedness;
		branchLength = defaults.branchLength;
		branchLengthVariance = defaults.branchLengthVariance;
		canopyLightColor = defaults.canopyLightColor;
		canopyDarkColor = defaults.canopyDarkColor;
		trunkHue = defaults.trunkHue;
		trunkSaturation = defaults.trunkSaturation;
		trunkLightness = defaults.trunkLightness;
	}

	function randomizeSeed() {
		seed = Math.floor(Math.random() * 100000);
	}
</script>

<main class="grid h-dvh grid-rows-[auto_1fr] bg-background text-foreground">
	<header class="border-b border-border">
		<div class="flex items-center justify-between px-6 py-4">
			<div class="flex items-center gap-4">
				<h1 class="text-xl font-bold tracking-tight">Low-Poly Tree Generator</h1>
				<a
					href={resolve('/showcase/scene')}
					class="text-sm text-muted-foreground underline-offset-4 hover:underline"
				>
					Scene View
				</a>
			</div>
			<DarkModeToggle />
		</div>
	</header>

	<div class="grid grid-cols-[320px_1fr] overflow-hidden xl:grid-cols-[640px_1fr]">
		<!-- Controls -->
		<aside class="select-none overflow-y-auto p-6">
			<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<Card.Root>
					<Card.Header>
						<Card.Title>Shape</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<LabeledSelect
							label="Tree Type"
							options={TREE_SHAPE_OPTIONS}
							value={shape}
							onValueChange={onShapeChange}
						/>

						<div class="space-y-2">
							<Label>Seed</Label>
							<div class="flex gap-2">
								<Input type="number" bind:value={seed} class="flex-1" />
								<Button variant="outline" size="icon" onclick={randomizeSeed}>
									<Shuffle />
								</Button>
							</div>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Geometry</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-2">
							<Label>Canopy Polygons: {canopyPolygons}</Label>
							<input
								type="range"
								min="10"
								max="150"
								bind:value={canopyPolygons}
								class="w-full accent-primary"
							/>
						</div>
						<div class="space-y-2">
							<Label>Trunk Polygons: {trunkPolygons}</Label>
							<input
								type="range"
								min="10"
								max="100"
								bind:value={trunkPolygons}
								class="w-full accent-primary"
							/>
						</div>
						<div class="space-y-2">
							<Label>Blob Count: {blobCount}</Label>
							<input
								type="range"
								min="1"
								max="8"
								bind:value={blobCount}
								class="w-full accent-primary"
							/>
						</div>
						<LabeledRangeSlider
							label="Branches"
							min={0}
							max={20}
							bind:value={branchCount}
							disabled={branchCountDisabled}
						/>
						<div class="space-y-2">
							<Label>Blob Size Variance: {blobSizeVariance.toFixed(1)}x</Label>
							<input
								type="range"
								min="1"
								max="10"
								step="0.1"
								bind:value={blobSizeVariance}
								class="w-full accent-primary"
							/>
						</div>
						<div class="space-y-2">
							<Label>Blob Closeness: {blobCloseness}%</Label>
							<input
								type="range"
								min="0"
								max="100"
								bind:value={blobCloseness}
								class="w-full accent-primary"
							/>
						</div>
						<div class="space-y-2">
							<Label>Canopy Size: {canopySize}%</Label>
							<input
								type="range"
								min="25"
								max="400"
								step="5"
								bind:value={canopySize}
								class="w-full accent-primary"
							/>
						</div>
					</Card.Content>
				</Card.Root>

				<CanopyColorCard
					bind:lightColor={canopyLightColor}
					bind:darkColor={canopyDarkColor}
				/>

				<TrunkColorCard
					bind:hue={trunkHue}
					bind:saturation={trunkSaturation}
					bind:lightness={trunkLightness}
				/>

				<Card.Root>
					<Card.Header>
						<Card.Title>Trunk & Branches</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-2">
							<Label>Trunk Height: {trunkHeight}%</Label>
							<input
								type="range"
								min="50"
								max="150"
								bind:value={trunkHeight}
								class="w-full accent-primary"
							/>
						</div>
						<div class="space-y-2">
							<Label>Trunk Thickness: {trunkThickness}%</Label>
							<input
								type="range"
								min="25"
								max="400"
								step="5"
								bind:value={trunkThickness}
								class="w-full accent-primary"
							/>
						</div>
						<div class="space-y-2">
							<Label>Branch Thickness: {branchThickness}%</Label>
							<input
								type="range"
								min="25"
								max="400"
								step="5"
								bind:value={branchThickness}
								class="w-full accent-primary"
							/>
						</div>
						<LabeledRangeSlider
							label="Trunk/Branch Ratio"
							min={30}
							max={100}
							unit="%"
							bind:value={trunkBranchRatio}
							disabled={trunkBranchRatioDisabled}
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
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Lighting</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="space-y-2">
							<Label>Light Angle: {lightAngle}°</Label>
							<input
								type="range"
								min="0"
								max="360"
								bind:value={lightAngle}
								class="w-full accent-primary"
							/>
						</div>
						<div class="space-y-2">
							<Label>Depth Variance: {depthVariance.toFixed(1)}</Label>
							<input
								type="range"
								min="0"
								max="2"
								step="0.1"
								bind:value={depthVariance}
								class="w-full accent-primary"
							/>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Debug</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
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
					</Card.Content>
				</Card.Root>
			</div>
		</aside>

		<!-- Preview -->
		<div
			class="flex items-center justify-center rounded-xl border border-border bg-muted/30 p-8"
		>
			<div class="w-full max-w-sm">
				<LowPolyTree
					{shape}
					{seed}
					{canopyPolygons}
					{trunkPolygons}
					{canopyLightColor}
					{canopyDarkColor}
					{trunkHue}
					{trunkSaturation}
					{trunkLightness}
					{lightAngle}
					{blobCount}
					{branchCount}
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
					{depthVariance}
					{showCanopy}
					{showBranches}
					{showTrunk}
					{showAnchors}
					class="h-auto w-full"
				/>
			</div>
		</div>
	</div>
</main>
