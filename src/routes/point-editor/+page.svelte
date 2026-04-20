<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import LowPolyTree from '$lib/trees/LowPolyTree.svelte';
	import { DEFAULT_TREE_CONFIG, TREE_STAGES, type TreeConfig } from '$lib/trees/types.js';
	import { TOOL_TYPES, TOOL_OPTIONS } from '$lib/trees/tools/tool_types.js';
	import { TOOL_DEFINITIONS } from '$lib/trees/tools/tool_definitions.js';
	import {
		FRUIT_TYPES as FRUIT_TYPE_CONSTANTS,
		FRUIT_TYPE_OPTIONS,
	} from '$lib/trees/types/fruit.js';
	import { TREE_SHAPE_OPTIONS, TREE_SHAPES as SHAPES } from '$lib/trees/types/config.js';
	import { FRUIT_DEFINITIONS } from '$lib/trees/shapes/fruit_definitions.js';
	import { FLOWER_DEFINITIONS } from '$lib/trees/shapes/flower_definitions.js';
	import { GROUND_DEFINITIONS } from '$lib/trees/ground/ground_definitions.js';
	import { STAGE_DEFINITIONS } from '$lib/trees/stages/stage_definitions.js';
	import { OVERLAY_DEFINITIONS } from '$lib/trees/overlays/overlay_definitions.js';
	import {
		createDefaultToolVisibility,
		type ToolVisibility,
	} from '$lib/trees/tools/tool_types.js';
	import type { Component } from 'svelte';
	import Upload from '@lucide/svelte/icons/upload';
	import Save from '@lucide/svelte/icons/save';

	interface AssetOption {
		readonly value: string;
		readonly label: string;
	}

	const CATEGORY_ASSET_OPTIONS = {
		tools: TOOL_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
		fruits: FRUIT_TYPE_OPTIONS.filter((o) => o.value !== 'none').map((o) => ({
			value: o.value,
			label: o.label,
		})),
		flowers: TREE_SHAPE_OPTIONS.filter((o) => o.value !== 'custom').map((o) => ({
			value: o.value,
			label: `${o.label} Flower`,
		})),
		ground: [
			{ value: 'grass', label: 'Grass' },
			{ value: 'stone', label: 'Stone' },
		],
		stages: [
			{ value: 'seed', label: 'Seed' },
			{ value: 'sprouting', label: 'Sprouting' },
			{ value: 'stump', label: 'Stump' },
		],
		overlays: [
			{ value: 'leaf', label: 'Leaf' },
			{ value: 'raindrop', label: 'Raindrop' },
			{ value: 'snowflake', label: 'Snowflake' },
			{ value: 'windParticle', label: 'Wind Particle' },
			{ value: 'firefly', label: 'Firefly' },
			{ value: 'cloud', label: 'Cloud' },
		],
	} as const satisfies Record<string, readonly AssetOption[]>;

	type AssetCategory = keyof typeof CATEGORY_ASSET_OPTIONS;

	let activeTab = $state<AssetCategory>('tools');
	let selectedAssets = $state<Record<AssetCategory, string>>({
		tools: TOOL_TYPES.shovel,
		fruits: FRUIT_TYPE_CONSTANTS.acorn,
		flowers: SHAPES.oak,
		ground: 'grass',
		stages: 'seed',
		overlays: 'leaf',
	});

	let snapOffset = $state({ x: 0, y: 0 });
	let pivotPoint = $state({ x: 0, y: 0 });
	let assetScale = $state(1);

	const selectedAsset = $derived(selectedAssets[activeTab]);
	const assetOptions = $derived(CATEGORY_ASSET_OPTIONS[activeTab]);

	function selectAsset(value: string) {
		selectedAssets[activeTab] = value;
		loadAssetConfig(activeTab, value);
	}

	function loadAssetConfig(category: AssetCategory, assetKey: string) {
		if (category === 'tools' && assetKey in TOOL_DEFINITIONS) {
			const toolDef = TOOL_DEFINITIONS[assetKey as keyof typeof TOOL_DEFINITIONS];
			snapOffset = { ...toolDef.snapOffset };
			pivotPoint = { x: 0, y: 0 };
			assetScale = 1;
		} else if (category === 'fruits' && assetKey in FRUIT_DEFINITIONS) {
			const def = FRUIT_DEFINITIONS[assetKey as keyof typeof FRUIT_DEFINITIONS];
			snapOffset = { ...def.originOffset };
			pivotPoint = { x: 0, y: 0 };
			assetScale = def.scale;
		} else if (category === 'flowers' && assetKey in FLOWER_DEFINITIONS) {
			const def = FLOWER_DEFINITIONS[assetKey as keyof typeof FLOWER_DEFINITIONS];
			snapOffset = { ...def.originOffset };
			pivotPoint = { x: 0, y: 0 };
			assetScale = def.scale;
		} else if (category === 'ground' && assetKey in GROUND_DEFINITIONS) {
			const def = GROUND_DEFINITIONS[assetKey as keyof typeof GROUND_DEFINITIONS];
			snapOffset = { x: 0, y: 0 };
			pivotPoint = { x: 0, y: 0 };
			assetScale = (def.scaleRange.min + def.scaleRange.max) / 2;
		} else if (category === 'stages' && assetKey in STAGE_DEFINITIONS) {
			const def = STAGE_DEFINITIONS[assetKey as keyof typeof STAGE_DEFINITIONS];
			snapOffset = { ...def.positionOffset };
			pivotPoint = { x: 0, y: 0 };
			assetScale = def.scale;
		} else if (category === 'overlays' && assetKey in OVERLAY_DEFINITIONS) {
			const def = OVERLAY_DEFINITIONS[assetKey as keyof typeof OVERLAY_DEFINITIONS];
			snapOffset = { x: 0, y: 0 };
			pivotPoint = { x: 0, y: 0 };
			assetScale = def.scale;
		} else {
			snapOffset = { x: 0, y: 0 };
			pivotPoint = { x: 0, y: 0 };
			assetScale = 1;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const selectedAssetComponent = $derived.by((): Component<any> | null => {
		if (activeTab === 'tools' && selectedAsset in TOOL_DEFINITIONS) {
			return TOOL_DEFINITIONS[selectedAsset as keyof typeof TOOL_DEFINITIONS].svgComponent;
		}
		if (activeTab === 'fruits' && selectedAsset in FRUIT_DEFINITIONS) {
			return FRUIT_DEFINITIONS[selectedAsset as keyof typeof FRUIT_DEFINITIONS].svgComponent;
		}
		if (activeTab === 'flowers' && selectedAsset in FLOWER_DEFINITIONS) {
			return FLOWER_DEFINITIONS[selectedAsset as keyof typeof FLOWER_DEFINITIONS]
				.svgComponent;
		}
		if (activeTab === 'ground' && selectedAsset in GROUND_DEFINITIONS) {
			return GROUND_DEFINITIONS[selectedAsset as keyof typeof GROUND_DEFINITIONS]
				.svgComponent;
		}
		if (activeTab === 'stages' && selectedAsset in STAGE_DEFINITIONS) {
			return STAGE_DEFINITIONS[selectedAsset as keyof typeof STAGE_DEFINITIONS].svgComponent;
		}
		if (activeTab === 'overlays' && selectedAsset in OVERLAY_DEFINITIONS) {
			return OVERLAY_DEFINITIONS[selectedAsset as keyof typeof OVERLAY_DEFINITIONS]
				.svgComponent;
		}
		return null;
	});

	const demoToolVisibility = $derived.by((): ToolVisibility | undefined => {
		if (activeTab !== 'tools') {
			return undefined;
		}
		const visibility = createDefaultToolVisibility();
		if (selectedAsset in visibility) {
			visibility[selectedAsset as keyof typeof visibility] = { visible: true, size: 1 };
		}
		return visibility;
	});

	const demoTreeConfig = $derived.by((): TreeConfig => {
		const base = { ...DEFAULT_TREE_CONFIG };
		switch (activeTab) {
			case 'tools':
				return base;
			case 'fruits':
				return {
					...base,
					stage: TREE_STAGES.fruiting,
					fruitType: selectedAsset as typeof base.fruitType,
					fruitCount: 5,
				};
			case 'flowers':
				return {
					...base,
					stage: TREE_STAGES.flowering,
					shape: selectedAsset as typeof base.shape,
				};
			case 'stages': {
				const stageMap: Record<string, typeof base.stage> = {
					seed: TREE_STAGES.seed,
					sprouting: TREE_STAGES.sprouting,
					stump: TREE_STAGES.stump,
				};
				return { ...base, stage: stageMap[selectedAsset] ?? TREE_STAGES.leafy };
			}
			default:
				return base;
		}
	});

	const isDev = import.meta.env.DEV;

	let svgEditorElement = $state<SVGSVGElement>();
	let isDraggingSnap = $state(false);
	let isDraggingPivot = $state(false);

	const EDITOR_VIEWBOX_SIZE = 200;
	const EDITOR_CENTER = EDITOR_VIEWBOX_SIZE / 2;
	const EDITOR_DISPLAY_SCALE_FACTOR = 2;

	function handleEditorPointerDown(event: PointerEvent, handleType: 'snap' | 'pivot') {
		if (handleType === 'snap') {
			isDraggingSnap = true;
		} else {
			isDraggingPivot = true;
		}
		(event.target as SVGElement).setPointerCapture(event.pointerId);
	}

	function handleEditorPointerMove(event: PointerEvent) {
		if (!isDraggingSnap && !isDraggingPivot) {
			return;
		}
		if (!svgEditorElement) {
			return;
		}

		const ctm = svgEditorElement.getScreenCTM();
		if (!ctm) {
			return;
		}

		const svgX = (event.clientX - ctm.e) / ctm.a;
		const svgY = (event.clientY - ctm.f) / ctm.d;

		const offsetX = Math.round(svgX - EDITOR_CENTER);
		const offsetY = Math.round(svgY - EDITOR_CENTER);

		if (isDraggingSnap) {
			snapOffset = { x: offsetX, y: offsetY };
		} else if (isDraggingPivot) {
			pivotPoint = { x: offsetX, y: offsetY };
		}
	}

	function handleEditorPointerUp() {
		isDraggingSnap = false;
		isDraggingPivot = false;
	}

	function handleTabChange(value: string) {
		activeTab = value as AssetCategory;
		loadAssetConfig(activeTab, selectedAssets[activeTab]);
	}
</script>

<div class="flex h-full flex-col gap-4 p-4">
	<h1 class="text-2xl font-bold pl-10">Point Editor</h1>

	<Tabs.Root value={activeTab} onValueChange={handleTabChange}>
		<Tabs.List>
			<Tabs.Trigger value="tools">Tools</Tabs.Trigger>
			<Tabs.Trigger value="fruits">Fruits</Tabs.Trigger>
			<Tabs.Trigger value="flowers">Flowers</Tabs.Trigger>
			<Tabs.Trigger value="ground">Ground</Tabs.Trigger>
			<Tabs.Trigger value="stages">Stages</Tabs.Trigger>
			<Tabs.Trigger value="overlays">Overlays</Tabs.Trigger>
		</Tabs.List>

		{#each Object.keys(CATEGORY_ASSET_OPTIONS) as category (category)}
			<Tabs.Content value={category}>
				<div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
					<!-- Left Panel: Demo Tree -->
					<Card.Root>
						<Card.Header>
							<Card.Title>Demo Preview</Card.Title>
						</Card.Header>
						<Card.Content>
							<div
								class="flex aspect-square items-center justify-center rounded-md border bg-muted/30"
							>
								<LowPolyTree
									config={demoTreeConfig}
									showFruit={activeTab === 'fruits'}
									groundElements={activeTab === 'ground'}
									toolVisibility={demoToolVisibility}
									class="h-full w-full"
								/>
							</div>
						</Card.Content>
					</Card.Root>

					<!-- Right Panel: SVG Editor + Controls -->
					<div class="flex flex-col gap-4 lg:col-span-2">
						<!-- Asset Selector -->
						<Card.Root>
							<Card.Content class="pt-4">
								<div class="flex items-center gap-4">
									<Label>Asset</Label>
									<Select.Root
										type="single"
										value={selectedAsset}
										onValueChange={selectAsset}
									>
										<Select.Trigger class="w-[200px]">
											{assetOptions.find((o) => o.value === selectedAsset)
												?.label ?? 'Select...'}
										</Select.Trigger>
										<Select.Content>
											{#each assetOptions as option (option.value)}
												<Select.Item value={option.value}
													>{option.label}</Select.Item
												>
											{/each}
										</Select.Content>
									</Select.Root>

									{#if isDev}
										<Button variant="outline" size="sm">
											<Upload class="mr-2 size-4" />
											Upload SVG
										</Button>
									{/if}
								</div>
							</Card.Content>
						</Card.Root>

						<!-- SVG Editor with Draggable Handles -->
						<Card.Root>
							<Card.Header>
								<Card.Title>Snap & Pivot Points</Card.Title>
							</Card.Header>
							<Card.Content>
								<div class="flex gap-6">
									<!-- SVG Viewport -->
									<div class="flex-1">
										<svg
											bind:this={svgEditorElement}
											viewBox="0 0 {EDITOR_VIEWBOX_SIZE} {EDITOR_VIEWBOX_SIZE}"
											class="aspect-square w-full rounded-md border bg-muted/20"
											role="application"
											aria-label="SVG point editor"
											onpointermove={handleEditorPointerMove}
											onpointerup={handleEditorPointerUp}
										>
											<!-- Grid lines -->
											<line
												x1={EDITOR_CENTER}
												y1="0"
												x2={EDITOR_CENTER}
												y2={EDITOR_VIEWBOX_SIZE}
												stroke="currentColor"
												stroke-opacity="0.1"
												stroke-dasharray="4 4"
											/>
											<line
												x1="0"
												y1={EDITOR_CENTER}
												x2={EDITOR_VIEWBOX_SIZE}
												y2={EDITOR_CENTER}
												stroke="currentColor"
												stroke-opacity="0.1"
												stroke-dasharray="4 4"
											/>

											<!-- Asset SVG (centered) -->
											<g
												transform="translate({EDITOR_CENTER}, {EDITOR_CENTER}) scale({assetScale *
													EDITOR_DISPLAY_SCALE_FACTOR})"
											>
												{#if selectedAssetComponent}
													{@const AssetSvg = selectedAssetComponent}
													<AssetSvg />
												{:else}
													<rect
														x="-15"
														y="-15"
														width="30"
														height="30"
														fill="none"
														stroke="currentColor"
														stroke-opacity="0.2"
														stroke-dasharray="2 2"
													/>
												{/if}
											</g>

											<!-- Snap Point Handle (red) -->
											<circle
												cx={EDITOR_CENTER + snapOffset.x}
												cy={EDITOR_CENTER + snapOffset.y}
												r="6"
												fill="rgba(239,68,68,0.7)"
												stroke="white"
												stroke-width="1.5"
												class="cursor-grab"
												role="img"
												aria-label="Snap point handle"
												onpointerdown={(e) =>
													handleEditorPointerDown(e, 'snap')}
											/>
											<text
												x={EDITOR_CENTER + snapOffset.x + 10}
												y={EDITOR_CENTER + snapOffset.y + 4}
												font-size="10"
												fill="rgba(239,68,68,0.9)"
											>
												snap
											</text>

											<!-- Pivot Point Handle (blue) -->
											<circle
												cx={EDITOR_CENTER + pivotPoint.x}
												cy={EDITOR_CENTER + pivotPoint.y}
												r="6"
												fill="rgba(59,130,246,0.7)"
												stroke="white"
												stroke-width="1.5"
												class="cursor-grab"
												role="img"
												aria-label="Pivot point handle"
												onpointerdown={(e) =>
													handleEditorPointerDown(e, 'pivot')}
											/>
											<text
												x={EDITOR_CENTER + pivotPoint.x + 10}
												y={EDITOR_CENTER + pivotPoint.y + 4}
												font-size="10"
												fill="rgba(59,130,246,0.9)"
											>
												pivot
											</text>
										</svg>
									</div>

									<!-- Numeric Controls -->
									<div class="flex w-48 flex-col gap-4">
										<div>
											<Label class="text-xs font-semibold text-red-500"
												>Snap Offset</Label
											>
											<div class="mt-1 grid grid-cols-2 gap-2">
												<div>
													<Label class="text-xs">X</Label>
													<Input
														type="number"
														bind:value={snapOffset.x}
														class="h-8"
													/>
												</div>
												<div>
													<Label class="text-xs">Y</Label>
													<Input
														type="number"
														bind:value={snapOffset.y}
														class="h-8"
													/>
												</div>
											</div>
										</div>

										<div>
											<Label class="text-xs font-semibold text-blue-500"
												>Pivot Point</Label
											>
											<div class="mt-1 grid grid-cols-2 gap-2">
												<div>
													<Label class="text-xs">X</Label>
													<Input
														type="number"
														bind:value={pivotPoint.x}
														class="h-8"
													/>
												</div>
												<div>
													<Label class="text-xs">Y</Label>
													<Input
														type="number"
														bind:value={pivotPoint.y}
														class="h-8"
													/>
												</div>
											</div>
										</div>

										<div>
											<Label class="text-xs font-semibold">Scale</Label>
											<div class="mt-1 flex items-center gap-2">
												<Input
													type="number"
													bind:value={assetScale}
													step={0.1}
													min={0.1}
													max={5}
													class="h-8"
												/>
											</div>
										</div>

										{#if isDev}
											<Button size="sm" class="mt-auto">
												<Save class="mr-2 size-4" />
												Apply
											</Button>
										{/if}
									</div>
								</div>
							</Card.Content>
						</Card.Root>
					</div>
				</div>
			</Tabs.Content>
		{/each}
	</Tabs.Root>
</div>
