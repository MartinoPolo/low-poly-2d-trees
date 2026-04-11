<script lang="ts">
	import LowPolyTree from '$lib/trees/LowPolyTree.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import SectionCard from '$lib/components/composed/SectionCard.svelte';
	import { DEFAULT_TREE_CONFIG, SHAPE_DEFAULTS } from '$lib/trees/types.js';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
	import { resolve } from '$app/paths';
	import Shuffle from '@lucide/svelte/icons/shuffle';

	let seed = $state(DEFAULT_TREE_CONFIG.seed);
	let canopyPolygons = $state(DEFAULT_TREE_CONFIG.canopyPolygons);
	let trunkPolygons = $state(DEFAULT_TREE_CONFIG.trunkPolygons);
	let canopyHue = $state(DEFAULT_TREE_CONFIG.canopyHue);
	let canopyHueSpread = $state(DEFAULT_TREE_CONFIG.canopyHueSpread);
	let canopySaturation = $state(DEFAULT_TREE_CONFIG.canopySaturation);
	let canopyLightness = $state(DEFAULT_TREE_CONFIG.canopyLightness);
	let trunkHue = $state(DEFAULT_TREE_CONFIG.trunkHue);
	let trunkSaturation = $state(DEFAULT_TREE_CONFIG.trunkSaturation);
	let trunkLightness = $state(DEFAULT_TREE_CONFIG.trunkLightness);
	let lightAngle = $state(DEFAULT_TREE_CONFIG.lightAngle);
	let depthVariance = $state(DEFAULT_TREE_CONFIG.depthVariance);
	let blobSizeVariance = $state(DEFAULT_TREE_CONFIG.blobSizeVariance);
	let blobCloseness = $state(DEFAULT_TREE_CONFIG.blobCloseness);
	let trunkThickness = $state(DEFAULT_TREE_CONFIG.trunkThickness);
	let branchThickness = $state(DEFAULT_TREE_CONFIG.branchThickness);
	let canopySize = $state(DEFAULT_TREE_CONFIG.canopySize);
	let trunkHeight = $state(DEFAULT_TREE_CONFIG.trunkHeight);
	let trunkBranchRatio = $state(DEFAULT_TREE_CONFIG.trunkBranchRatio);
	let showAnchors = $state(false);
	let showCanopy = $state(true);
	let showBranches = $state(true);
	let showTrunk = $state(true);

	function randomizeSeed() {
		seed = Math.floor(Math.random() * 100000);
	}

	// Scene currently previews oak/pine/birch only. REQ-S-06 (all 6 non-custom
	// shapes side by side) lands with issue #8, when fir/maple/willow get real
	// generators. The placeholder generators for those shapes would render as
	// oak clones, which would be misleading in the scene preview.
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
				</SectionCard>

				<SectionCard title="Canopy" contentClass="space-y-4">
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
				</SectionCard>

				<SectionCard title="Trunk & Branches" contentClass="space-y-4">
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
					<div class="space-y-2">
						<Label>Trunk/Branch Ratio: {trunkBranchRatio}%</Label>
						<input
							type="range"
							min="30"
							max="100"
							bind:value={trunkBranchRatio}
							class="w-full accent-primary"
						/>
					</div>
				</SectionCard>

				<SectionCard title="Canopy Color" contentClass="space-y-4">
					<div class="space-y-2">
						<Label>Hue: {canopyHue}°</Label>
						<input
							type="range"
							min="0"
							max="360"
							bind:value={canopyHue}
							class="w-full accent-primary"
						/>
					</div>
					<div class="space-y-2">
						<Label>Hue Spread: {canopyHueSpread}</Label>
						<input
							type="range"
							min="0"
							max="80"
							bind:value={canopyHueSpread}
							class="w-full accent-primary"
						/>
					</div>
					<div class="space-y-2">
						<Label>Saturation: {canopySaturation}%</Label>
						<input
							type="range"
							min="0"
							max="100"
							bind:value={canopySaturation}
							class="w-full accent-primary"
						/>
					</div>
					<div class="space-y-2">
						<Label>Lightness: {canopyLightness}%</Label>
						<input
							type="range"
							min="10"
							max="80"
							bind:value={canopyLightness}
							class="w-full accent-primary"
						/>
					</div>
				</SectionCard>

				<SectionCard title="Trunk Color" contentClass="space-y-4">
					<div class="space-y-2">
						<Label>Hue: {trunkHue}°</Label>
						<input
							type="range"
							min="0"
							max="360"
							bind:value={trunkHue}
							class="w-full accent-primary"
						/>
					</div>
					<div class="space-y-2">
						<Label>Saturation: {trunkSaturation}%</Label>
						<input
							type="range"
							min="0"
							max="100"
							bind:value={trunkSaturation}
							class="w-full accent-primary"
						/>
					</div>
					<div class="space-y-2">
						<Label>Lightness: {trunkLightness}%</Label>
						<input
							type="range"
							min="5"
							max="60"
							bind:value={trunkLightness}
							class="w-full accent-primary"
						/>
					</div>
				</SectionCard>

				<SectionCard title="Lighting" contentClass="space-y-4">
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
						{canopyHue}
						{canopyHueSpread}
						{canopySaturation}
						{canopyLightness}
						{trunkHue}
						{trunkSaturation}
						{trunkLightness}
						{lightAngle}
						{depthVariance}
						{blobSizeVariance}
						{blobCloseness}
						{trunkThickness}
						{branchThickness}
						{canopySize}
						{trunkHeight}
						{trunkBranchRatio}
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
