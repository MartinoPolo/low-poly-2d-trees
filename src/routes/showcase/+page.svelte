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
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import {
		TREE_SHAPES,
		TREE_SHAPE_OPTIONS,
		SHAPE_DEFAULTS,
		DEFAULT_TREE_CONFIG,
		CUSTOM_BLOB_BOUNDARY_OPTIONS,
		CUSTOM_BLOB_POSITION_MAX,
		CUSTOM_BLOB_POSITION_MIN,
		CUSTOM_BLOB_POSITION_STEP,
		CUSTOM_BLOB_ROTATION_STEP,
		CUSTOM_BLOB_SIZE_MAX,
		CUSTOM_BLOB_SIZE_MIN,
		CUSTOM_BLOB_SIZE_STEP,
		type CustomBlob,
		type CustomBlobBoundaryKind,
		type TreeShape,
	} from '$lib/trees/types.js';
	import { growCustomBlobs } from '$lib/trees/shapes.js';
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
	// Use `$state.raw` because the array is replaced wholesale (never mutated
	// in place) and is read-heavy — per-entry proxy wrapping adds no value.
	let customBlobs = $state.raw<readonly CustomBlob[]>([]);
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
			// Lazily seed enough blobs for the current blobCount so switching
			// into the custom editor never shows an empty canopy. Existing
			// entries are preserved (growCustomBlobs never truncates).
			customBlobs = growCustomBlobs(customBlobs, blobCount, seed, blobCloseness);
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

	function onBlobCountInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const next = Number(target.value);
		blobCount = next;
		if (shape === TREE_SHAPES.custom) {
			customBlobs = growCustomBlobs(customBlobs, next, seed, blobCloseness);
		}
	}

	interface CustomBlobPatch {
		readonly boundaryKind?: CustomBlobBoundaryKind;
		readonly rotationDeg?: number;
		readonly sizeScale?: number;
		readonly position?: { readonly x?: number; readonly y?: number };
	}

	function updateCustomBlob(index: number, patch: CustomBlobPatch): void {
		if (index < 0 || index >= customBlobs.length) {
			return;
		}
		const current = customBlobs[index]!;
		const next: CustomBlob = {
			boundaryKind: patch.boundaryKind ?? current.boundaryKind,
			rotationDeg: patch.rotationDeg ?? current.rotationDeg,
			sizeScale: patch.sizeScale ?? current.sizeScale,
			position: {
				x: patch.position?.x ?? current.position.x,
				y: patch.position?.y ?? current.position.y,
			},
		};
		const updated = [...customBlobs];
		updated[index] = next;
		customBlobs = updated;
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
								value={blobCount}
								oninput={onBlobCountInput}
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

				{#if shape === TREE_SHAPES.custom}
					<Card.Root class="xl:col-span-2">
						<Card.Header>
							<Card.Title>Custom Blobs</Card.Title>
						</Card.Header>
						<Card.Content>
							<Accordion.Root type="multiple" class="w-full">
								{#each customBlobs.slice(0, blobCount) as blob, i (i)}
									<Accordion.Item value={`blob-${i}`}>
										<Accordion.Trigger>
											<span
												class="flex flex-1 items-center justify-between pr-2"
											>
												<span class="font-medium">Blob {i + 1}</span>
												<span class="text-xs text-muted-foreground">
													{CUSTOM_BLOB_BOUNDARY_OPTIONS.find(
														(o) => o.value === blob.boundaryKind,
													)?.label ?? blob.boundaryKind}
												</span>
											</span>
										</Accordion.Trigger>
										<Accordion.Content>
											<div class="space-y-4 pt-2">
												<LabeledSelect
													label="Boundary"
													options={CUSTOM_BLOB_BOUNDARY_OPTIONS}
													value={blob.boundaryKind}
													onValueChange={(value) =>
														updateCustomBlob(i, {
															boundaryKind:
																value as CustomBlobBoundaryKind,
														})}
												/>
												<div class="space-y-2">
													<Label>Rotation: {blob.rotationDeg}°</Label>
													<input
														type="range"
														min="0"
														max="360"
														step={CUSTOM_BLOB_ROTATION_STEP}
														value={blob.rotationDeg}
														oninput={(e) =>
															updateCustomBlob(i, {
																rotationDeg: Number(
																	(
																		e.currentTarget as HTMLInputElement
																	).value,
																),
															})}
														class="w-full accent-primary"
													/>
												</div>
												<div class="space-y-2">
													<Label
														>Size: {Math.round(
															blob.sizeScale * 100,
														)}%</Label
													>
													<input
														type="range"
														min={CUSTOM_BLOB_SIZE_MIN}
														max={CUSTOM_BLOB_SIZE_MAX}
														step={CUSTOM_BLOB_SIZE_STEP}
														value={blob.sizeScale}
														oninput={(e) =>
															updateCustomBlob(i, {
																sizeScale: Number(
																	(
																		e.currentTarget as HTMLInputElement
																	).value,
																),
															})}
														class="w-full accent-primary"
													/>
												</div>
												<div class="space-y-2">
													<Label>X: {blob.position.x.toFixed(2)}</Label>
													<input
														type="range"
														min={CUSTOM_BLOB_POSITION_MIN}
														max={CUSTOM_BLOB_POSITION_MAX}
														step={CUSTOM_BLOB_POSITION_STEP}
														value={blob.position.x}
														oninput={(e) =>
															updateCustomBlob(i, {
																position: {
																	x: Number(
																		(
																			e.currentTarget as HTMLInputElement
																		).value,
																	),
																},
															})}
														class="w-full accent-primary"
													/>
												</div>
												<div class="space-y-2">
													<Label>Y: {blob.position.y.toFixed(2)}</Label>
													<input
														type="range"
														min={CUSTOM_BLOB_POSITION_MIN}
														max={CUSTOM_BLOB_POSITION_MAX}
														step={CUSTOM_BLOB_POSITION_STEP}
														value={blob.position.y}
														oninput={(e) =>
															updateCustomBlob(i, {
																position: {
																	y: Number(
																		(
																			e.currentTarget as HTMLInputElement
																		).value,
																	),
																},
															})}
														class="w-full accent-primary"
													/>
												</div>
											</div>
										</Accordion.Content>
									</Accordion.Item>
								{/each}
							</Accordion.Root>
						</Card.Content>
					</Card.Root>
				{/if}

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
					{customBlobs}
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
