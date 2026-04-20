<script lang="ts">
	import LowPolyTree from '$lib/trees/LowPolyTree.svelte';
	import PottedPlant from '$lib/trees/PottedPlant.svelte';
	import OakTree from '$lib/trees/OakTree.svelte';
	import LabeledSelect from '$lib/components/composed/LabeledSelect.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		DEFAULT_TREE_CONFIG,
		SHAPE_DEFAULTS,
		TREE_SHAPES,
		TREE_STAGES,
		TREE_STAGE_OPTIONS,
		TREE_SHAPE_OPTIONS,
		SHAPE_FRUIT_MAP,
		POTTED_PLANT_STAGES,
		isTreeStage,
		type TreeConfig,
		type TreeShape,
		type TreeStage,
	} from '$lib/trees/types.js';

	const allStages = Object.values(TREE_STAGES);
	const allShapes = Object.values(TREE_SHAPES).filter(
		(s): s is Exclude<TreeShape, 'custom'> => s !== 'custom',
	);
	const allPlantStages = Object.values(POTTED_PLANT_STAGES);

	const shapeOptions = TREE_SHAPE_OPTIONS.filter((o) => o.value !== 'custom');

	let selectedStage = $state<TreeStage>(TREE_STAGES.leafy);
	let selectedShape = $state<Exclude<TreeShape, 'custom'>>('oak');
	let seed = $state(42);

	function onStageChange(value: string) {
		if (!isTreeStage(value)) {
			return;
		}
		selectedStage = value;
	}

	function onShapeChange(value: string) {
		const shapes = Object.values(TREE_SHAPES) as string[];
		if (!shapes.includes(value) || value === 'custom') {
			return;
		}
		selectedShape = value as Exclude<TreeShape, 'custom'>;
	}

	function randomizeSeed() {
		seed = Math.floor(Math.random() * 100000);
	}

	const previewConfig = $derived<TreeConfig>({
		...DEFAULT_TREE_CONFIG,
		...SHAPE_DEFAULTS[selectedShape],
		shape: selectedShape,
		stage: selectedStage,
		fruitType: SHAPE_FRUIT_MAP[selectedShape],
		fruitCount: 3,
		seed,
	});

	const stageConfigs = $derived<ReadonlyMap<TreeStage, TreeConfig>>(
		new Map(
			allStages.map((stage) => [
				stage,
				{
					...DEFAULT_TREE_CONFIG,
					...SHAPE_DEFAULTS[selectedShape],
					shape: selectedShape,
					fruitType: SHAPE_FRUIT_MAP[selectedShape],
					fruitCount: 3,
					stage,
					seed,
				},
			]),
		),
	);

	const shapeConfigs = $derived<ReadonlyMap<Exclude<TreeShape, 'custom'>, TreeConfig>>(
		new Map(
			allShapes.map((shape) => [
				shape,
				{
					...DEFAULT_TREE_CONFIG,
					...SHAPE_DEFAULTS[shape],
					shape,
					stage: selectedStage,
					fruitType: SHAPE_FRUIT_MAP[shape],
					fruitCount: 3,
					seed,
				},
			]),
		),
	);

	const oakCompletionRatios = [0, 0.25, 0.5, 0.75, 1.0];
</script>

<svelte:head>
	<title>Tree Showcase</title>
</svelte:head>

<main class="flex h-full flex-col gap-4 p-4">
	<h1 class="text-2xl font-bold pl-10">Tree Showcase</h1>
	<div class="mx-auto max-w-7xl space-y-8">
		<div class="flex items-end gap-4">
			<div class="w-48">
				<LabeledSelect
					label="Stage"
					options={TREE_STAGE_OPTIONS}
					value={selectedStage}
					onValueChange={onStageChange}
				/>
			</div>
			<div class="w-48">
				<LabeledSelect
					label="Shape"
					options={shapeOptions}
					value={selectedShape}
					onValueChange={onShapeChange}
				/>
			</div>
			<Button variant="outline" onclick={randomizeSeed}>Randomize</Button>
		</div>

		<div
			class="flex items-center justify-center rounded-xl border border-border bg-muted/30 p-8"
		>
			<div class="w-full max-w-xs">
				<LowPolyTree config={previewConfig} class="h-auto w-full" />
			</div>
		</div>

		<h2 class="text-xl font-semibold">All Stages</h2>

		<div class="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
			{#each allStages as stage (stage)}
				<button
					class="flex flex-col items-center gap-2 cursor-pointer"
					onclick={() => (selectedStage = stage)}
				>
					<div
						class="w-full rounded-lg border p-2 transition-colors {stage ===
						selectedStage
							? 'border-primary bg-primary/10'
							: 'border-border bg-muted/20 hover:border-primary/50'}"
					>
						<LowPolyTree config={stageConfigs.get(stage)!} class="h-auto w-full" />
					</div>
					<span class="text-xs font-medium capitalize text-muted-foreground">{stage}</span
					>
				</button>
			{/each}
		</div>

		<h2 class="text-xl font-semibold">All Shapes</h2>

		<div class="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
			{#each allShapes as shape (shape)}
				<button
					class="flex flex-col items-center gap-2 cursor-pointer"
					onclick={() => (selectedShape = shape)}
				>
					<div
						class="w-full rounded-lg border p-2 transition-colors {shape ===
						selectedShape
							? 'border-primary bg-primary/10'
							: 'border-border bg-muted/20 hover:border-primary/50'}"
					>
						<LowPolyTree config={shapeConfigs.get(shape)!} class="h-auto w-full" />
					</div>
					<span class="text-xs font-medium capitalize text-muted-foreground">{shape}</span
					>
				</button>
			{/each}
		</div>

		<h2 class="text-xl font-semibold">Potted Plants</h2>

		<div class="grid grid-cols-3 gap-4 sm:grid-cols-5">
			{#each allPlantStages as plantStage (plantStage)}
				<div class="flex flex-col items-center gap-2">
					<div class="w-full rounded-lg border border-border bg-muted/20 p-2">
						<PottedPlant stage={plantStage} class="h-auto w-full" />
					</div>
					<span class="text-xs font-medium capitalize text-muted-foreground"
						>{plantStage}</span
					>
				</div>
			{/each}
		</div>

		<h2 class="text-xl font-semibold">Oak PRD Tree (Completion Tracking)</h2>

		<div class="grid grid-cols-3 gap-4 sm:grid-cols-5">
			{#each oakCompletionRatios as ratio (ratio)}
				<div class="flex flex-col items-center gap-2">
					<div class="w-full rounded-lg border border-border bg-muted/20 p-2">
						<OakTree completionRatio={ratio} issueCount={10} class="h-auto w-full" />
					</div>
					<span class="text-xs font-medium text-muted-foreground"
						>{Math.round(ratio * 100)}%</span
					>
				</div>
			{/each}
		</div>

		<h2 class="text-xl font-semibold">Oak PRD Tree with Nameplate</h2>

		<div
			class="flex items-center justify-center rounded-xl border border-border bg-muted/30 p-8"
		>
			<div class="w-full max-w-xs">
				<OakTree
					completionRatio={0.7}
					issueCount={15}
					name="My PRD"
					class="h-auto w-full"
				/>
			</div>
		</div>
	</div>
</main>
