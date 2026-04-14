<script lang="ts">
	import LowPolyTree from '$lib/trees/LowPolyTree.svelte';
	import LabeledSelect from '$lib/components/composed/LabeledSelect.svelte';
	import LabeledSlider from '$lib/components/composed/LabeledSlider.svelte';
	import LabeledRangeSliderDual from '$lib/components/composed/LabeledRangeSliderDual.svelte';

	import CustomBlobsEditor from '$lib/components/composed/CustomBlobsEditor.svelte';
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
		TREE_STAGE_OPTIONS,
		SHAPE_DEFAULTS,
		FRUIT_TYPES,
		FRUIT_TYPE_OPTIONS,
		isTreeStage,
		type TreeShape,
		type FruitType,
	} from '$lib/trees/types.js';
	import {
		createDefaultToolVisibility,
		type ToolVisibility,
	} from '$lib/trees/tools/tool_types.js';
	import ToolAccessoriesCard from '$lib/components/composed/ToolAccessoriesCard.svelte';
	import { growCustomBlobs } from '$lib/trees/shapes.js';
	import { isParamDisabled } from '$lib/trees/disabled_params.js';
	import { getSavedTree, saveTree } from '$lib/trees/saved_trees.remote.js';
	import { createTreeConfigContext } from '$lib/trees/tree_config.context.svelte.js';
	import { page } from '$app/state';
	import Shuffle from '@lucide/svelte/icons/shuffle';
	import Save from '@lucide/svelte/icons/save';

	const user = $derived(page.data.user);
	const signedIn = $derived(user !== null);

	const treeConfig = createTreeConfigContext();

	let showAnchors = $state(false);
	let showCanopy = $state(true);
	let showBranches = $state(true);
	let showTrunk = $state(true);
	let showFruit = $state(true);
	let animateCanopySway = $state(false);
	let animateBranches = $state(false);
	let animateGrowth = $state(false);
	let toolVisibility: ToolVisibility = $state(createDefaultToolVisibility());
	let animateTools = $state(false);
	let showAdvancedControls = $state(false);

	const trunkCrookednessDisabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'trunkCrookedness', {
			trunkSegments: treeConfig.current.trunkSegments,
		}),
	);
	const branchCrookednessDisabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'branchCrookedness', {
			branchSegments: treeConfig.current.branchSegments,
		}),
	);
	const fruitCountDisabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'fruitCount', {
			fruitType: treeConfig.current.fruitType,
		}),
	);
	const level1Disabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'branchesLevel1Range', {
			branchDepth: treeConfig.current.branchDepth,
		}),
	);
	const level2Disabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'branchesLevel2Range', {
			branchDepth: treeConfig.current.branchDepth,
		}),
	);
	const level3Disabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'branchesLevel3Range', {
			branchDepth: treeConfig.current.branchDepth,
		}),
	);

	const savedId = $derived(page.url.searchParams.get('saved'));
	const savedTreeQuery = $derived(savedId === null ? null : getSavedTree(savedId));
	let hydratedId = $state<string | null>(null);

	function isTreeShape(value: string): value is TreeShape {
		return (Object.values(TREE_SHAPES) as readonly string[]).includes(value);
	}

	function isFruitType(value: string): value is FruitType {
		return (Object.values(FRUIT_TYPES) as readonly string[]).includes(value);
	}

	function onFruitTypeChange(value: string) {
		if (!isFruitType(value)) {
			return;
		}
		treeConfig.current.fruitType = value;
		if (value === FRUIT_TYPES.none) {
			treeConfig.current.fruitCount = 0;
		}
	}

	function onStageChange(value: string) {
		if (!isTreeStage(value)) {
			return;
		}
		treeConfig.current.stage = value;
	}

	function onShapeChange(value: string) {
		if (!isTreeShape(value)) {
			return;
		}
		treeConfig.current.shape = value;
		if (value === TREE_SHAPES.custom) {
			treeConfig.customBlobs = growCustomBlobs(
				treeConfig.customBlobs,
				treeConfig.current.blobCount,
				treeConfig.current.seed,
				treeConfig.current.blobCloseness,
			);
			return;
		}
		const defaults = SHAPE_DEFAULTS[value];
		treeConfig.current.blobCount = defaults.blobCount;
		treeConfig.current.branchDepth = defaults.branchDepth;
		treeConfig.current.branchesLevel1Range = [...defaults.branchesLevel1Range];
		treeConfig.current.branchesLevel2Range = [...defaults.branchesLevel2Range];
		treeConfig.current.branchesLevel3Range = [...defaults.branchesLevel3Range];
		treeConfig.current.branchAngle = defaults.branchAngle;
		treeConfig.current.blobSizeVariance = defaults.blobSizeVariance;
		treeConfig.current.blobCloseness = defaults.blobCloseness;
		treeConfig.current.branchThickness = defaults.branchThickness;
		treeConfig.current.trunkSegments = defaults.trunkSegments;
		treeConfig.current.trunkCrookedness = defaults.trunkCrookedness;
		treeConfig.current.branchLength = defaults.branchLength;
		treeConfig.current.branchLengthVariance = defaults.branchLengthVariance;
		treeConfig.current.canopyLightColor = defaults.canopyLightColor;
		treeConfig.current.canopyDarkColor = defaults.canopyDarkColor;
		treeConfig.current.trunkHue = defaults.trunkHue;
		treeConfig.current.trunkSaturation = defaults.trunkSaturation;
		treeConfig.current.trunkLightness = defaults.trunkLightness;
		treeConfig.current.fruitType = defaults.fruitType;
		treeConfig.current.fruitCount = defaults.fruitCount;
	}

	function onBlobCountChange(value: number) {
		treeConfig.current.blobCount = value;
		if (treeConfig.current.shape === TREE_SHAPES.custom) {
			treeConfig.customBlobs = growCustomBlobs(
				treeConfig.customBlobs,
				value,
				treeConfig.current.seed,
				treeConfig.current.blobCloseness,
			);
		}
	}

	function randomizeSeed() {
		treeConfig.current.seed = Math.floor(Math.random() * 100000);
	}

	$effect(() => {
		if (!savedTreeQuery) {
			return;
		}
		const currentSavedId = savedId;
		if (currentSavedId === null || hydratedId === currentSavedId) {
			return;
		}
		void (async () => {
			const data = await savedTreeQuery;
			if (currentSavedId !== savedId) {
				return;
			}
			treeConfig.applyConfig(data.config);
			hydratedId = currentSavedId;
		})();
	});
</script>

<svelte:head>
	<title>Single Editor</title>
</svelte:head>

<main class="grid h-dvh grid-rows-[1fr] bg-background text-foreground">
	<div class="grid grid-cols-[320px_1fr] overflow-hidden xl:grid-cols-[640px_1fr]">
		<!-- Controls -->
		<aside class="select-none overflow-y-auto p-6">
			<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<Card.Root>
					<Card.Header>
						<Card.Title>Shape</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<form {...saveTree} class="flex flex-col gap-2">
							<input
								type="hidden"
								name="config"
								value={JSON.stringify(treeConfig.snapshot())}
							/>
							<Button
								type="submit"
								disabled={!signedIn}
								data-testid="save-tree-button"
								class="w-full"
							>
								<Save class="mr-2 size-4" />
								{signedIn ? 'Save' : 'Sign in to save'}
							</Button>
							{#if saveTree.result?.success}
								<p class="text-xs text-muted-foreground" role="status">
									Saved as {saveTree.result.name}
								</p>
							{/if}
							{#if saveTree.result && !saveTree.result.success}
								<p class="text-xs text-destructive" role="alert">
									Failed to save tree
								</p>
							{/if}
						</form>

						<LabeledSelect
							label="Tree Type"
							options={TREE_SHAPE_OPTIONS}
							value={treeConfig.current.shape}
							onValueChange={onShapeChange}
						/>

						<LabeledSelect
							label="Life Stage"
							options={TREE_STAGE_OPTIONS}
							value={treeConfig.current.stage}
							onValueChange={onStageChange}
						/>

						<div class="space-y-2">
							<Label>Seed</Label>
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
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Geometry</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<LabeledSlider
							label="Polygons Per Blob"
							min={4}
							max={30}
							bind:value={treeConfig.current.polygonsPerBlob}
						/>
						<LabeledSlider
							label="Trunk Polygons"
							min={10}
							max={100}
							bind:value={treeConfig.current.trunkPolygons}
						/>
						<LabeledSlider
							label="Blob Count"
							min={1}
							max={8}
							value={treeConfig.current.blobCount}
							onValueChange={onBlobCountChange}
						/>
						<LabeledSlider
							label="Branch Depth"
							min={0}
							max={3}
							bind:value={treeConfig.current.branchDepth}
						/>
						<LabeledSlider
							label="Blob Size Variance"
							min={1}
							max={10}
							step={0.1}
							format={(v) => v.toFixed(1)}
							unit="x"
							bind:value={treeConfig.current.blobSizeVariance}
						/>
						<LabeledSlider
							label="Blob Closeness"
							min={0}
							max={100}
							unit="%"
							bind:value={treeConfig.current.blobCloseness}
						/>
						<LabeledSlider
							label="Canopy Size"
							min={25}
							max={400}
							step={5}
							unit="%"
							bind:value={treeConfig.current.canopySize}
						/>
					</Card.Content>
				</Card.Root>

				{#if treeConfig.current.shape === TREE_SHAPES.custom}
					<CustomBlobsEditor
						customBlobs={treeConfig.customBlobs}
						blobCount={treeConfig.current.blobCount}
						onchange={(blobs) => (treeConfig.customBlobs = blobs)}
					/>
				{/if}

				<Card.Root>
					<Card.Header>
						<Card.Title>Growables</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<LabeledSelect
							label="Fruit Type"
							options={FRUIT_TYPE_OPTIONS}
							value={treeConfig.current.fruitType}
							onValueChange={onFruitTypeChange}
						/>
						<LabeledSlider
							label="Fruit Count"
							min={0}
							max={7}
							bind:value={treeConfig.current.fruitCount}
							disabled={fruitCountDisabled}
						/>
					</Card.Content>
				</Card.Root>

				<CanopyColorCard
					bind:lightColor={treeConfig.current.canopyLightColor}
					bind:darkColor={treeConfig.current.canopyDarkColor}
				/>

				<TrunkColorCard
					bind:hue={treeConfig.current.trunkHue}
					bind:saturation={treeConfig.current.trunkSaturation}
					bind:lightness={treeConfig.current.trunkLightness}
				/>

				<Card.Root>
					<Card.Header>
						<div class="flex items-center justify-between">
							<Card.Title>Trunk & Branches</Card.Title>
							<div class="flex items-center gap-2">
								<Checkbox
									checked={showAdvancedControls}
									onCheckedChange={(v) => (showAdvancedControls = v === true)}
								/>
								<Label class="text-xs">Advanced</Label>
							</div>
						</div>
					</Card.Header>
					<Card.Content class="space-y-4">
						<!-- Simple controls (always visible) -->
						<LabeledSlider
							label="Trunk Height"
							min={10}
							max={150}
							unit="%"
							bind:value={treeConfig.current.trunkHeight}
						/>
						<LabeledSlider
							label="Trunk Thickness"
							min={25}
							max={400}
							step={5}
							unit="%"
							bind:value={treeConfig.current.trunkThickness}
						/>
						<LabeledSlider
							label="Branch Thickness"
							min={25}
							max={400}
							step={5}
							unit="%"
							bind:value={treeConfig.current.branchThickness}
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
						<LabeledSlider
							label="Trunk Lean"
							min={-45}
							max={45}
							step={1}
							unit="°"
							bind:value={treeConfig.current.trunkLean}
						/>
						<LabeledSlider
							label="Branch Angle"
							min={0}
							max={100}
							step={5}
							unit="%"
							bind:value={treeConfig.current.branchAngle}
							disabled={level1Disabled}
						/>

						<!-- Per-level branch count range sliders (BR-4) -->
						{#if treeConfig.current.branchDepth >= 1}
							<LabeledRangeSliderDual
								label="L1 Branches"
								min={0}
								max={10}
								value={[...treeConfig.current.branchesLevel1Range]}
								onValueChange={(v) => (treeConfig.current.branchesLevel1Range = v)}
								disabled={level1Disabled}
							/>
						{/if}
						{#if treeConfig.current.branchDepth >= 2}
							<LabeledRangeSliderDual
								label="L2 Branches"
								min={0}
								max={5}
								value={[...treeConfig.current.branchesLevel2Range]}
								onValueChange={(v) => (treeConfig.current.branchesLevel2Range = v)}
								disabled={level2Disabled}
							/>
						{/if}
						{#if treeConfig.current.branchDepth >= 3}
							<LabeledRangeSliderDual
								label="L3 Branches"
								min={0}
								max={3}
								value={[...treeConfig.current.branchesLevel3Range]}
								onValueChange={(v) => (treeConfig.current.branchesLevel3Range = v)}
								disabled={level3Disabled}
							/>
						{/if}

						<!-- Advanced controls (BR-14: toggle) -->
						{#if showAdvancedControls}
							<LabeledSlider
								label="Branch Segments"
								min={1}
								max={3}
								step={1}
								bind:value={treeConfig.current.branchSegments}
							/>
							<LabeledSlider
								label="Branch Crookedness"
								min={0}
								max={100}
								step={5}
								unit="%"
								bind:value={treeConfig.current.branchCrookedness}
								disabled={branchCrookednessDisabled}
							/>
							<LabeledSlider
								label="Branch Depth Taper"
								min={30}
								max={80}
								step={5}
								unit="%"
								bind:value={treeConfig.current.branchDepthTaper}
							/>
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
						{/if}
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Lighting</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<LabeledSlider
							label="Light Angle"
							min={0}
							max={360}
							unit="°"
							bind:value={treeConfig.current.lightAngle}
						/>
						<LabeledSlider
							label="Depth Variance"
							min={0}
							max={2}
							step={0.1}
							format={(v) => v.toFixed(1)}
							bind:value={treeConfig.current.depthVariance}
						/>
					</Card.Content>
				</Card.Root>

				<ToolAccessoriesCard bind:toolVisibility bind:animateTools />

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
								checked={showFruit}
								onCheckedChange={(v) => (showFruit = v === true)}
							/>
							<Label>Show Fruit</Label>
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

				<Card.Root>
					<Card.Header>
						<Card.Title>Animations</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
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
					config={treeConfig.configForTree}
					{showCanopy}
					{showBranches}
					{showTrunk}
					{showFruit}
					{showAnchors}
					{animateCanopySway}
					{animateBranches}
					{animateGrowth}
					{toolVisibility}
					{animateTools}
					class="h-auto w-full"
				/>
			</div>
		</div>
	</div>
</main>
