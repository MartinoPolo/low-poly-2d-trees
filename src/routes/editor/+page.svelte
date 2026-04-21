<script lang="ts">
	import LowPolyTree from '$lib/trees/LowPolyTree.svelte';
	import SceneBackground from '$lib/scene/SceneBackground.svelte';
	import LabeledSelect from '$lib/components/composed/LabeledSelect.svelte';
	import LabeledSlider from '$lib/components/composed/LabeledSlider.svelte';
	import LabeledRangeSliderDual from '$lib/components/composed/LabeledRangeSliderDual.svelte';

	import CustomBlobsEditor from '$lib/components/composed/CustomBlobsEditor.svelte';
	import SectionCard from '$lib/components/composed/SectionCard.svelte';
	import CanopyColorCard from '$lib/components/composed/CanopyColorCard.svelte';
	import TrunkColorCard from '$lib/components/composed/TrunkColorCard.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import {
		TREE_SHAPES,
		TREE_SHAPE_OPTIONS,
		TREE_STAGE_OPTIONS,
		SHAPE_DEFAULTS,
		DEFAULT_TREE_CONFIG,
		CROOKEDNESS_MODES,
		CROOKEDNESS_MODE_OPTIONS,
		BRANCH_MIRRORING,
		BRANCH_MIRRORING_OPTIONS,
		FRUIT_TYPES,
		FRUIT_TYPE_OPTIONS,
		isTreeStage,
		type TreeShape,
		type FruitType,
		type BranchMirroring,
	} from '$lib/trees/types.js';
	import {
		createDefaultToolVisibility,
		type ToolVisibility,
	} from '$lib/trees/tools/tool_types.js';
	import ToolAccessoriesCard from '$lib/components/composed/ToolAccessoriesCard.svelte';
	import OverlaysCard from '$lib/components/composed/OverlaysCard.svelte';
	import { growCustomBlobs, computeMaxBranches, clampBranchMaximums } from '$lib/trees/shapes.js';
	import { isParamDisabled } from '$lib/trees/disabled_params.js';
	import { getSavedTree, saveTree } from '$lib/trees/saved_trees.remote.js';
	import { createTreeConfigContext } from '$lib/trees/tree_config.context.svelte.js';
	import { createOverlayConfigContext } from '$lib/trees/overlays/overlay_config.context.svelte.js';
	import { createEditorViewStateContext } from '$lib/config/editor_view_state.context.svelte.js';
	import { page } from '$app/state';
	import SceneFloatingButtons from '$lib/components/app-shell/SceneFloatingButtons.svelte';
	import SettingsTierControl from '$lib/components/composed/SettingsTierControl.svelte';
	import { use_settings_tier, tierAtLeast } from '$lib/context/settings_tier.context.svelte.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import Shuffle from '@lucide/svelte/icons/shuffle';

	const user = $derived(page.data.user);
	const signedIn = $derived(user !== null);

	const overlayConfig = createOverlayConfigContext();

	const treeConfig = createTreeConfigContext();

	const editorView = createEditorViewStateContext();

	let toolVisibility: ToolVisibility = $state(createDefaultToolVisibility());

	const { tier } = use_settings_tier();
	const isIntermediate = $derived(tierAtLeast(tier.current, 'intermediate'));
	const isAdvanced = $derived(tierAtLeast(tier.current, 'advanced'));

	const trunkCrookednessDisabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'trunkCrookedness', {
			trunkSegments: treeConfig.current.trunkSegments,
		}),
	);
	const crookednessModeDisabled = $derived(
		isParamDisabled(treeConfig.current.shape, 'crookednessMode', {
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

	const branchMaximums = $derived.by(() => {
		const raw = computeMaxBranches(treeConfig.current.shape, treeConfig.current.trunkHeight);
		return clampBranchMaximums(
			raw,
			treeConfig.current.branchMirroring,
			treeConfig.current.trunkFork,
		);
	});

	function clampBranchRangesToMaximums() {
		const raw = computeMaxBranches(treeConfig.current.shape, treeConfig.current.trunkHeight);
		const maxes = clampBranchMaximums(
			raw,
			treeConfig.current.branchMirroring,
			treeConfig.current.trunkFork,
		);

		if (treeConfig.current.branchesLevel1Range[1] > maxes.maxLevel1) {
			treeConfig.current.branchesLevel1Range = [
				Math.min(treeConfig.current.branchesLevel1Range[0], maxes.maxLevel1),
				maxes.maxLevel1,
			];
		}
		if (treeConfig.current.branchesLevel2Range[1] > maxes.maxLevel2) {
			treeConfig.current.branchesLevel2Range = [
				Math.min(treeConfig.current.branchesLevel2Range[0], maxes.maxLevel2),
				maxes.maxLevel2,
			];
		}
		if (treeConfig.current.branchesLevel3Range[1] > maxes.maxLevel3) {
			treeConfig.current.branchesLevel3Range = [
				Math.min(treeConfig.current.branchesLevel3Range[0], maxes.maxLevel3),
				maxes.maxLevel3,
			];
		}
	}

	const savedId = $derived(page.url.searchParams.get('saved'));
	const savedTreeQuery = $derived(savedId === null ? null : getSavedTree(savedId));
	let hydratedId = $state<string | null>(null);

	function isTreeShape(value: string): value is TreeShape {
		return (Object.values(TREE_SHAPES) as readonly string[]).includes(value);
	}

	function isBranchMirroring(value: string): value is BranchMirroring {
		return (Object.values(BRANCH_MIRRORING) as readonly string[]).includes(value);
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
		const defaults = { ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS[value] };
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
		treeConfig.current.crookednessMode = defaults.crookednessMode;
		treeConfig.current.branchLength = defaults.branchLength;
		treeConfig.current.branchLengthVariance = defaults.branchLengthVariance;
		treeConfig.current.canopyLightColor = defaults.canopyLightColor;
		treeConfig.current.canopyDarkColor = defaults.canopyDarkColor;
		treeConfig.current.trunkHue = defaults.trunkHue;
		treeConfig.current.trunkSaturation = defaults.trunkSaturation;
		treeConfig.current.trunkLightness = defaults.trunkLightness;
		treeConfig.current.trunkTwist = defaults.trunkTwist;
		treeConfig.current.branchMirroring = defaults.branchMirroring;
		treeConfig.current.trunkFork = defaults.trunkFork;
		treeConfig.current.fruitType = defaults.fruitType;
		treeConfig.current.fruitCount = defaults.fruitCount;
		treeConfig.current.trunkStripCount = defaults.trunkStripCount;
		treeConfig.current.branchWidthVariance = defaults.branchWidthVariance;
		clampBranchRangesToMaximums();
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

	let saveFormElement = $state<HTMLFormElement>();

	function triggerSave() {
		saveFormElement?.requestSubmit();
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
			clampBranchRangesToMaximums();
			hydratedId = currentSavedId;
		})();
	});

	clampBranchRangesToMaximums();
</script>

<svelte:head>
	<title>Single Editor</title>
</svelte:head>

<main class="grid h-dvh grid-rows-[1fr_1fr] overflow-hidden bg-background text-foreground">
	<!-- Preview -->
	<div class="relative flex items-center justify-center overflow-hidden border border-border p-8">
		<SceneBackground />
		<div class="relative w-full" style="max-width: min(576px, calc(50dvh - 4rem))">
			<LowPolyTree
				config={treeConfig.configForTree}
				showCanopy={editorView.showCanopy}
				showBranches={editorView.showBranches}
				showTrunk={editorView.showTrunk}
				showFruit={editorView.showFruit}
				showAnchors={editorView.showAnchors}
				showEnvelope={editorView.showEnvelope}
				showViewBox={editorView.showViewBox}
				animateCanopySway={editorView.animateCanopySway}
				animateBranches={editorView.animateBranches}
				animateGrowth={editorView.animateGrowth}
				growthVariance={editorView.growthVariance}
				{toolVisibility}
				animateTools={editorView.animateTools}
				overlayConfig={overlayConfig.config}
				groundElements={overlayConfig.groundEnabled}
				class="h-auto w-full"
			/>
		</div>

		<SceneFloatingButtons
			onReset={() => {
				treeConfig.resetToShapeDefaults();
				clampBranchRangesToMaximums();
			}}
			onRandomize={randomizeSeed}
			showSave={true}
			onSave={triggerSave}
			saveDisabled={!signedIn}
		/>
	</div>

	<!-- Controls -->
	<aside class="select-none overflow-y-auto px-6 pb-6">
		<SettingsTierControl />
		<div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 p-px">
			<Card.Root>
				<Card.Header>
					<Card.Title>Shape</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<form bind:this={saveFormElement} {...saveTree} class="hidden">
						<input
							type="hidden"
							name="config"
							value={JSON.stringify(treeConfig.snapshot())}
						/>
					</form>
					{#if saveTree.result?.success}
						<p class="text-xs text-muted-foreground" role="status">
							Saved as {saveTree.result.name}
						</p>
					{/if}
					{#if saveTree.result && !saveTree.result.success}
						<p class="text-xs text-destructive" role="alert">Failed to save tree</p>
					{/if}

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

					{#if isAdvanced}
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
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Geometry</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<LabeledSlider
						label="Blob Count"
						min={1}
						max={25}
						value={treeConfig.current.blobCount}
						onValueChange={onBlobCountChange}
					/>
					<LabeledSlider
						label="Canopy Size"
						min={25}
						max={200}
						step={5}
						unit="%"
						bind:value={treeConfig.current.canopySize}
					/>
					{#if isAdvanced}
						<LabeledSlider
							label="Polygons Per Blob"
							min={4}
							max={30}
							bind:value={treeConfig.current.polygonsPerBlob}
						/>
						<LabeledSlider
							label="Trunk Strips"
							min={2}
							max={4}
							bind:value={treeConfig.current.trunkStripCount}
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
					{/if}
				</Card.Content>
			</Card.Root>

			{#if isAdvanced && treeConfig.current.shape === TREE_SHAPES.custom}
				<CustomBlobsEditor
					customBlobs={treeConfig.customBlobs}
					blobCount={treeConfig.current.blobCount}
					onchange={(blobs) => (treeConfig.customBlobs = blobs)}
				/>
			{/if}

			{#if treeConfig.current.shape === TREE_SHAPES.custom}
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
					<Card.Title>Trunk</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<LabeledSlider
						label="Trunk Height"
						min={10}
						max={150}
						unit="%"
						bind:value={treeConfig.current.trunkHeight}
						onValueChange={() => clampBranchRangesToMaximums()}
					/>
					<LabeledSlider
						label="Trunk Thickness"
						min={25}
						max={400}
						step={5}
						unit="%"
						bind:value={treeConfig.current.trunkThickness}
					/>

					{#if isIntermediate}
						<LabeledSlider
							label="Trunk Segments"
							min={1}
							max={10}
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

					{#if isAdvanced}
						<LabeledSlider
							label="Trunk Lean"
							min={-45}
							max={45}
							step={1}
							unit="°"
							bind:value={treeConfig.current.trunkLean}
						/>
						<LabeledSlider
							label="Trunk Twist"
							min={0}
							max={100}
							step={5}
							unit="%"
							bind:value={treeConfig.current.trunkTwist}
							disabled={isParamDisabled(
								treeConfig.current.shape,
								'trunkTwist',
								treeConfig.current,
							)}
						/>
						<LabeledSelect
							label="Crookedness Mode"
							options={CROOKEDNESS_MODE_OPTIONS}
							value={treeConfig.current.crookednessMode}
							onValueChange={(v) => {
								if (v in CROOKEDNESS_MODES) {
									treeConfig.current.crookednessMode =
										v as (typeof CROOKEDNESS_MODES)[keyof typeof CROOKEDNESS_MODES];
								}
							}}
							disabled={crookednessModeDisabled}
						/>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Branches</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#if isIntermediate}
						<LabeledSlider
							label="Branch Thickness"
							min={25}
							max={400}
							step={5}
							unit="%"
							bind:value={treeConfig.current.branchThickness}
						/>
						<LabeledSlider
							label="Branch Depth"
							min={0}
							max={3}
							bind:value={treeConfig.current.branchDepth}
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
						<LabeledSlider
							label="Branch Length"
							min={25}
							max={400}
							step={5}
							unit="%"
							bind:value={treeConfig.current.branchLength}
						/>
						<LabeledSelect
							label="Branch Mirroring"
							options={BRANCH_MIRRORING_OPTIONS}
							value={treeConfig.current.branchMirroring}
							onValueChange={(v) => {
								if (isBranchMirroring(v)) {
									treeConfig.current.branchMirroring = v;
									clampBranchRangesToMaximums();
								}
							}}
							disabled={level1Disabled}
						/>
						<div class="flex items-center gap-2">
							<Checkbox
								checked={treeConfig.current.trunkFork}
								onCheckedChange={(v) => {
									treeConfig.current.trunkFork = v === true;
									clampBranchRangesToMaximums();
								}}
								disabled={level1Disabled}
							/>
							<Label>Trunk Fork</Label>
						</div>

						{#if treeConfig.current.branchDepth >= 1}
							<LabeledRangeSliderDual
								label="L1 Branches"
								min={0}
								max={branchMaximums.maxLevel1}
								value={[...treeConfig.current.branchesLevel1Range]}
								onValueChange={(v) => (treeConfig.current.branchesLevel1Range = v)}
								disabled={level1Disabled}
							/>
						{/if}
						{#if treeConfig.current.branchDepth >= 2}
							<LabeledRangeSliderDual
								label="L2 Branches"
								min={0}
								max={branchMaximums.maxLevel2}
								value={[...treeConfig.current.branchesLevel2Range]}
								onValueChange={(v) => (treeConfig.current.branchesLevel2Range = v)}
								disabled={level2Disabled}
							/>
						{/if}
						{#if treeConfig.current.branchDepth >= 3}
							<LabeledRangeSliderDual
								label="L3 Branches"
								min={0}
								max={branchMaximums.maxLevel3}
								value={[...treeConfig.current.branchesLevel3Range]}
								onValueChange={(v) => (treeConfig.current.branchesLevel3Range = v)}
								disabled={level3Disabled}
							/>
						{/if}
					{/if}

					{#if isAdvanced}
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
							label="Branch Width Variance"
							min={0}
							max={50}
							step={5}
							bind:value={treeConfig.current.branchWidthVariance}
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

			<SectionCard title="Lighting" contentClass="space-y-4">
				<LabeledSlider
					label="Light Angle"
					min={0}
					max={360}
					unit="°"
					bind:value={treeConfig.current.lightAngle}
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

			{#if isIntermediate}
				<ToolAccessoriesCard
					bind:toolVisibility
					bind:animateTools={editorView.animateTools}
				/>
			{/if}

			<Card.Root>
				<Card.Header>
					<Card.Title>Debug</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="flex items-center gap-2">
						<Checkbox
							checked={editorView.showCanopy}
							onCheckedChange={(v) => (editorView.showCanopy = v === true)}
						/>
						<Label>Show Canopy</Label>
					</div>
					<div class="flex items-center gap-2">
						<Checkbox
							checked={editorView.showBranches}
							onCheckedChange={(v) => (editorView.showBranches = v === true)}
						/>
						<Label>Show Branches</Label>
					</div>
					<div class="flex items-center gap-2">
						<Checkbox
							checked={editorView.showTrunk}
							onCheckedChange={(v) => (editorView.showTrunk = v === true)}
						/>
						<Label>Show Trunk</Label>
					</div>
					<div class="flex items-center gap-2">
						<Checkbox
							checked={editorView.showFruit}
							onCheckedChange={(v) => (editorView.showFruit = v === true)}
						/>
						<Label>Show Fruit</Label>
					</div>
					<div class="flex items-center gap-2">
						<Checkbox
							checked={editorView.showAnchors}
							onCheckedChange={(v) => (editorView.showAnchors = v === true)}
						/>
						<Label>Show Anchor Points</Label>
					</div>
					<div class="flex items-center gap-2">
						<Checkbox
							checked={editorView.showEnvelope}
							onCheckedChange={(v) => (editorView.showEnvelope = v === true)}
						/>
						<Label>Show Envelope</Label>
					</div>
					<div class="flex items-center gap-2">
						<Checkbox
							checked={editorView.showViewBox}
							onCheckedChange={(v) => (editorView.showViewBox = v === true)}
						/>
						<Label>Show View Box</Label>
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
								checked={editorView.animateCanopySway}
								onCheckedChange={(v) => (editorView.animateCanopySway = v === true)}
							/>
							<Label>Canopy Sway</Label>
						</div>
						<div class="mt-4 flex items-center gap-2">
							<Checkbox
								data-testid="animate-branches"
								checked={editorView.animateBranches}
								onCheckedChange={(v) => (editorView.animateBranches = v === true)}
							/>
							<Label>Branch Movement</Label>
						</div>
						<div class="mt-4 flex items-center gap-2">
							<Checkbox
								data-testid="animate-growth"
								checked={editorView.animateGrowth}
								onCheckedChange={(v) => (editorView.animateGrowth = v === true)}
							/>
							<Label>Growth</Label>
						</div>
						{#if editorView.animateGrowth}
							<LabeledSlider
								label="Growth Variance"
								min={0}
								max={100}
								step={5}
								unit="%"
								bind:value={editorView.growthVariance}
							/>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>

			<OverlaysCard {overlayConfig} />
		</div>
	</aside>
</main>
