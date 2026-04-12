<script lang="ts">
	import LowPolyTree from '$lib/trees/LowPolyTree.svelte';
	import LabeledSelect from '$lib/components/composed/LabeledSelect.svelte';
	import LabeledRangeSlider from '$lib/components/composed/LabeledRangeSlider.svelte';
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
		isTreeStage,
		type TreeShape,
	} from '$lib/trees/types.js';
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
	let animateCanopySway = $state(false);
	let animateBranches = $state(false);
	let animateGrowth = $state(false);

	const branchCountDisabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'branchCount', {}),
	);
	const trunkBranchRatioDisabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'trunkBranchRatio', {}),
	);
	const trunkCrookednessDisabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'trunkCrookedness', {
			trunkSegments: treeConfig.current.trunkSegments,
		}),
	);

	const savedId = $derived(page.url.searchParams.get('saved'));
	const savedTreeQuery = $derived(savedId === null ? null : getSavedTree(savedId));
	let hydratedId = $state<string | null>(null);

	function isTreeShape(value: string): value is TreeShape {
		return (Object.values(TREE_SHAPES) as readonly string[]).includes(value);
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
		treeConfig.current.branchCount = defaults.branchCount;
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
	}

	function onBlobCountInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const next = Number(target.value);
		treeConfig.current.blobCount = next;
		if (treeConfig.current.shape === TREE_SHAPES.custom) {
			treeConfig.customBlobs = growCustomBlobs(
				treeConfig.customBlobs,
				next,
				treeConfig.current.seed,
				treeConfig.current.blobCloseness,
			);
		}
	}

	function randomizeSeed() {
		treeConfig.current.seed = Math.floor(Math.random() * 100000);
	}

	// Hydrate state from saved tree when ?saved=id is present.
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
						<LabeledRangeSlider
							label="Canopy Polygons"
							min={10}
							max={150}
							bind:value={treeConfig.current.canopyPolygons}
						/>
						<LabeledRangeSlider
							label="Trunk Polygons"
							min={10}
							max={100}
							bind:value={treeConfig.current.trunkPolygons}
						/>
						<LabeledRangeSlider
							label="Blob Count"
							min={1}
							max={8}
							value={treeConfig.current.blobCount}
							oninput={onBlobCountInput}
						/>
						<LabeledRangeSlider
							label="Branches"
							min={0}
							max={20}
							bind:value={treeConfig.current.branchCount}
							disabled={branchCountDisabled}
						/>
						<LabeledRangeSlider
							label="Blob Size Variance"
							min={1}
							max={10}
							step={0.1}
							format={(v) => v.toFixed(1)}
							unit="x"
							bind:value={treeConfig.current.blobSizeVariance}
						/>
						<LabeledRangeSlider
							label="Blob Closeness"
							min={0}
							max={100}
							unit="%"
							bind:value={treeConfig.current.blobCloseness}
						/>
						<LabeledRangeSlider
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
						<Card.Title>Trunk & Branches</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<LabeledRangeSlider
							label="Trunk Height"
							min={50}
							max={150}
							unit="%"
							bind:value={treeConfig.current.trunkHeight}
						/>
						<LabeledRangeSlider
							label="Trunk Thickness"
							min={25}
							max={400}
							step={5}
							unit="%"
							bind:value={treeConfig.current.trunkThickness}
						/>
						<LabeledRangeSlider
							label="Branch Thickness"
							min={25}
							max={400}
							step={5}
							unit="%"
							bind:value={treeConfig.current.branchThickness}
						/>
						<LabeledRangeSlider
							label="Trunk/Branch Ratio"
							min={30}
							max={100}
							unit="%"
							bind:value={treeConfig.current.trunkBranchRatio}
							disabled={trunkBranchRatioDisabled}
						/>
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
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Lighting</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<LabeledRangeSlider
							label="Light Angle"
							min={0}
							max={360}
							unit="°"
							bind:value={treeConfig.current.lightAngle}
						/>
						<LabeledRangeSlider
							label="Depth Variance"
							min={0}
							max={2}
							step={0.1}
							format={(v) => v.toFixed(1)}
							bind:value={treeConfig.current.depthVariance}
						/>
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
					{showAnchors}
					{animateCanopySway}
					{animateBranches}
					{animateGrowth}
					class="h-auto w-full"
				/>
			</div>
		</div>
	</div>
</main>
