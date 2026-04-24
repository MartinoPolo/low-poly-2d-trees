<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import LowPolyTree from '$lib/trees/LowPolyTree.svelte';
	import { DEFAULT_TREE_CONFIG, TREE_STAGES, type TreeConfig } from '$lib/trees/types.js';
	import { TOOL_TYPES, TOOL_OPTIONS, type ToolType } from '$lib/trees/tools/tool_types.js';
	import { TOOL_DEFINITIONS, type ToolAnchorKey } from '$lib/trees/tools/tool_definitions.js';
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
	import { onMount, type Component } from 'svelte';
	import Upload from '@lucide/svelte/icons/upload';
	import Save from '@lucide/svelte/icons/save';
	import { m } from '$lib/paraglide/messages.js';
	import PageLayout from '$lib/components/app-shell/PageLayout.svelte';
	import { SHAPE_LABELS, FRUIT_LABELS } from '$lib/i18n/option_labels.js';

	interface AssetOption {
		readonly value: string;
		readonly label: string;
	}

	const TOOL_LABELS: Record<string, () => string> = {
		shovel: () => m.tool_shovel(),
		wateringCan: () => m.tool_watering_can(),
		ladder: () => m.tool_ladder(),
		axe: () => m.tool_axe(),
		rake: () => m.tool_rake(),
		woodpecker: () => m.tool_woodpecker(),
		grill: () => m.tool_grill(),
		speechBubble: () => m.tool_speech_bubble(),
		stormCloud: () => m.tool_storm_cloud(),
	};

	const CATEGORY_ASSET_OPTIONS = {
		tools: TOOL_OPTIONS.map((o) => ({
			value: o.value,
			label: TOOL_LABELS[o.value]?.() ?? o.label,
		})),
		fruits: FRUIT_TYPE_OPTIONS.filter((o) => o.value !== 'none').map((o) => ({
			value: o.value,
			label: FRUIT_LABELS[o.value]?.() ?? o.label,
		})),
		flowers: TREE_SHAPE_OPTIONS.filter((o) => o.value !== 'custom').map((o) => ({
			value: o.value,
			label: m.point_editor_shape_flower({ shape: SHAPE_LABELS[o.value]?.() ?? o.label }),
		})),
		ground: [
			{ value: 'grass', label: m.point_editor_ground_grass() },
			{ value: 'stone', label: m.point_editor_ground_stone() },
		],
		stages: [
			{ value: 'seed', label: m.point_editor_stage_seed() },
			{ value: 'sprouting', label: m.point_editor_stage_sprouting() },
			{ value: 'stump', label: m.point_editor_stage_stump() },
		],
		overlays: [
			{ value: 'leaf', label: m.point_editor_overlay_leaf() },
			{ value: 'raindrop', label: m.point_editor_overlay_raindrop() },
			{ value: 'snowflake', label: m.point_editor_overlay_snowflake() },
			{ value: 'windParticle', label: m.point_editor_overlay_wind_particle() },
			{ value: 'firefly', label: m.point_editor_overlay_firefly() },
			{ value: 'cloud', label: m.point_editor_overlay_cloud() },
		],
	} as const satisfies Record<string, readonly AssetOption[]>;

	type AssetCategory = keyof typeof CATEGORY_ASSET_OPTIONS;

	const SESSION_KEY = 'point-editor-state';

	interface PersistedEditorState {
		activeTab: AssetCategory;
		selectedAssets: Record<AssetCategory, string>;
		snapOffset: { x: number; y: number };
		pivotPoint: { x: number; y: number };
		assetScale: number;
		anchorTarget: ToolAnchorKey;
		showAnchorOverlay: boolean;
	}

	const EDITOR_VIEWBOX_SIZE = 200;
	const EDITOR_CENTER = EDITOR_VIEWBOX_SIZE / 2;
	const EDITOR_DISPLAY_SCALE_FACTOR = 2;

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
	let anchorTarget = $state<ToolAnchorKey>('trunkBase');
	let showAnchorOverlay = $state(false);
	let svgEditorElement = $state<SVGSVGElement>();
	let isDraggingSnap = $state(false);
	let isDraggingPivot = $state(false);
	let fileInputElement = $state<HTMLInputElement>();
	let uploadStatus = $state<string | null>(null);
	let applyStatus = $state<string | null>(null);

	const selectedAsset = $derived(selectedAssets[activeTab]);
	const assetOptions = $derived(CATEGORY_ASSET_OPTIONS[activeTab]);
	const isDev = import.meta.env.DEV;

	function selectAsset(value: string) {
		selectedAssets[activeTab] = value;
		loadAssetConfig(activeTab, value);
	}

	function loadAssetConfig(category: AssetCategory, assetKey: string) {
		if (category === 'tools' && assetKey in TOOL_DEFINITIONS) {
			const toolDef = TOOL_DEFINITIONS[assetKey as keyof typeof TOOL_DEFINITIONS];
			snapOffset = { ...toolDef.snapOffset };
			pivotPoint = { ...toolDef.pivotPoint };
			assetScale = 1;
			anchorTarget = toolDef.anchorTarget;
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
			visibility[selectedAsset as keyof typeof visibility] = {
				visible: true,
				size: assetScale,
			};
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

	const previewToolSnapOffsetOverride = $derived(
		activeTab === 'tools'
			? { toolType: selectedAsset as ToolType, offset: snapOffset }
			: undefined,
	);

	const previewToolAnchorTargetOverride = $derived(
		activeTab === 'tools' ? { toolType: selectedAsset as ToolType, anchorTarget } : undefined,
	);

	const previewFruitScaleOverride = $derived(activeTab === 'fruits' ? assetScale : undefined);
	const previewFruitOriginOffsetOverride = $derived(
		activeTab === 'fruits' ? snapOffset : undefined,
	);

	const previewFlowerScaleOverride = $derived(activeTab === 'flowers' ? assetScale : undefined);
	const previewFlowerOriginOffsetOverride = $derived(
		activeTab === 'flowers' ? snapOffset : undefined,
	);

	const editorDisplayScale = $derived(
		activeTab === 'tools' ? assetScale * EDITOR_DISPLAY_SCALE_FACTOR : 1,
	);

	function handleUploadSvg() {
		fileInputElement?.click();
	}

	async function handleFileSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			return;
		}

		uploadStatus = 'Uploading...';
		const formData = new FormData();
		formData.append('file', file);
		formData.append('assetName', selectedAsset);
		formData.append('category', activeTab);

		try {
			const response = await fetch('/api/dev/upload-svg', { method: 'POST', body: formData });
			const result = await response.json();
			if (response.ok) {
				uploadStatus = `Uploaded to ${result.outputPath}`;
				setTimeout(() => (uploadStatus = null), 3000);
			} else {
				uploadStatus = `Error: ${result.error}`;
			}
		} catch {
			uploadStatus = 'Upload failed';
		}
		input.value = '';
	}

	async function handleApplyDefinition() {
		applyStatus = 'Applying...';
		const offsetKey =
			activeTab === 'tools'
				? 'snapOffset'
				: activeTab === 'stages'
					? 'positionOffset'
					: 'originOffset';

		const values: Record<string, unknown> = { scale: assetScale };
		values[offsetKey] = snapOffset;
		if (activeTab === 'tools') {
			values.anchorTarget = anchorTarget;
			values.pivotPoint = pivotPoint;
		}

		try {
			const response = await fetch('/api/dev/apply-definition', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ category: activeTab, assetName: selectedAsset, values }),
			});
			const result = await response.json();
			if (response.ok) {
				applyStatus = 'Applied!';
				setTimeout(() => (applyStatus = null), 2000);
			} else {
				applyStatus = `Error: ${result.error}`;
			}
		} catch {
			applyStatus = 'Apply failed';
		}
	}

	function handleEditorPointerDown(event: PointerEvent, handleType: 'snap' | 'pivot') {
		if (handleType === 'snap') {
			isDraggingSnap = true;
		} else {
			isDraggingPivot = true;
		}
		(event.currentTarget as SVGElement).ownerSVGElement?.setPointerCapture(event.pointerId);
	}

	function handleEditorPointerMove(event: PointerEvent) {
		if (!isDraggingSnap && !isDraggingPivot) {
			return;
		}

		const svgEl = event.currentTarget as SVGSVGElement;
		const rect = svgEl.getBoundingClientRect();
		const svgX = ((event.clientX - rect.left) / rect.width) * EDITOR_VIEWBOX_SIZE;
		const svgY = ((event.clientY - rect.top) / rect.height) * EDITOR_VIEWBOX_SIZE;

		const displayScale = activeTab === 'tools' ? assetScale * EDITOR_DISPLAY_SCALE_FACTOR : 1;
		const offsetX = Math.round((svgX - EDITOR_CENTER) / displayScale);
		const offsetY = Math.round((svgY - EDITOR_CENTER) / displayScale);

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

	let sessionRestored = false;

	onMount(() => {
		const raw = sessionStorage.getItem(SESSION_KEY);
		if (raw === null) {
			loadAssetConfig(activeTab, selectedAssets[activeTab]);
			sessionRestored = true;
			return;
		}
		try {
			const parsed = JSON.parse(raw) as PersistedEditorState;
			if (parsed.activeTab in CATEGORY_ASSET_OPTIONS) {
				activeTab = parsed.activeTab;
				selectedAssets = parsed.selectedAssets;
				snapOffset = parsed.snapOffset;
				pivotPoint = parsed.pivotPoint;
				assetScale = parsed.assetScale;
				anchorTarget = parsed.anchorTarget;
				showAnchorOverlay = parsed.showAnchorOverlay;
			} else {
				loadAssetConfig(activeTab, selectedAssets[activeTab]);
			}
		} catch {
			loadAssetConfig(activeTab, selectedAssets[activeTab]);
		}
		sessionRestored = true;
	});

	$effect(() => {
		if (!sessionRestored) {
			return;
		}
		const state: PersistedEditorState = {
			activeTab,
			selectedAssets: $state.snapshot(selectedAssets),
			snapOffset,
			pivotPoint,
			assetScale,
			anchorTarget,
			showAnchorOverlay,
		};
		sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
	});
</script>

<PageLayout heading={m.point_editor_heading()}>
	<Tabs.Root value={activeTab} onValueChange={handleTabChange}>
		<Tabs.List>
			<Tabs.Trigger value="tools">{m.point_editor_tab_tools()}</Tabs.Trigger>
			<Tabs.Trigger value="fruits">{m.point_editor_tab_fruits()}</Tabs.Trigger>
			<Tabs.Trigger value="flowers">{m.point_editor_tab_flowers()}</Tabs.Trigger>
			<Tabs.Trigger value="ground">{m.point_editor_tab_ground()}</Tabs.Trigger>
			<Tabs.Trigger value="stages">{m.point_editor_tab_stages()}</Tabs.Trigger>
			<Tabs.Trigger value="overlays">{m.point_editor_tab_overlays()}</Tabs.Trigger>
		</Tabs.List>

		{#each Object.keys(CATEGORY_ASSET_OPTIONS) as category (category)}
			<Tabs.Content value={category}>
				<div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
					<!-- Left Panel: Demo Tree -->
					<Card.Root>
						<Card.Header>
							<Card.Title>{m.point_editor_preview()}</Card.Title>
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
									toolSnapOffsetOverride={previewToolSnapOffsetOverride}
									toolAnchorTargetOverride={previewToolAnchorTargetOverride}
									showAnchorOverlay={activeTab === 'tools' && showAnchorOverlay}
									fruitScaleOverride={previewFruitScaleOverride}
									fruitOriginOffsetOverride={previewFruitOriginOffsetOverride}
									flowerScaleOverride={previewFlowerScaleOverride}
									flowerOriginOffsetOverride={previewFlowerOriginOffsetOverride}
									class="h-full w-full"
								/>
							</div>
						</Card.Content>
					</Card.Root>

					<!-- Right Panel: SVG Editor + Controls -->
					<div class="flex flex-col gap-4 lg:col-span-2">
						<!-- SVG Editor with Draggable Handles -->
						<Card.Root>
							<Card.Header>
								<Card.Title>{m.point_editor_snap_pivot()}</Card.Title>
							</Card.Header>
							<Card.Content>
								<div class="mb-4 flex items-center gap-4">
									<Label>{m.point_editor_asset()}</Label>
									<Select.Root
										type="single"
										value={selectedAsset}
										onValueChange={selectAsset}
									>
										<Select.Trigger class="w-[200px]">
											{assetOptions.find((o) => o.value === selectedAsset)
												?.label ?? m.placeholder_select()}
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
										<input
											bind:this={fileInputElement}
											type="file"
											accept=".svg"
											class="hidden"
											onchange={handleFileSelected}
										/>
										<Button
											variant="outline"
											size="sm"
											onclick={handleUploadSvg}
										>
											<Upload class="mr-2 size-4" />
											{m.action_upload_svg()}
										</Button>
										{#if uploadStatus}
											<span class="text-xs text-muted-foreground"
												>{uploadStatus}</span
											>
										{/if}
									{/if}
								</div>

								<div class="flex gap-6">
									<!-- SVG Viewport -->
									<div class="w-1/2 flex-none">
										<svg
											bind:this={svgEditorElement}
											viewBox="0 0 {EDITOR_VIEWBOX_SIZE} {EDITOR_VIEWBOX_SIZE}"
											class="aspect-square w-full rounded-md border bg-muted/20"
											role="application"
											aria-label={m.point_editor_svg_editor()}
											onpointermove={handleEditorPointerMove}
											onpointerup={handleEditorPointerUp}
											onpointercancel={handleEditorPointerUp}
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
												cx={EDITOR_CENTER +
													snapOffset.x * editorDisplayScale}
												cy={EDITOR_CENTER +
													snapOffset.y * editorDisplayScale}
												r="6"
												fill="rgba(239,68,68,0.7)"
												stroke="white"
												stroke-width="1.5"
												class="cursor-grab"
												role="img"
												aria-label={m.point_editor_snap_handle()}
												onpointerdown={(e) =>
													handleEditorPointerDown(e, 'snap')}
											/>
											<text
												x={EDITOR_CENTER +
													snapOffset.x * editorDisplayScale +
													10}
												y={EDITOR_CENTER +
													snapOffset.y * editorDisplayScale +
													4}
												font-size="10"
												fill="rgba(239,68,68,0.9)"
												pointer-events="none"
												style="user-select: none"
											>
												snap
											</text>

											<!-- Pivot Point Handle (blue) -->
											<circle
												cx={EDITOR_CENTER +
													pivotPoint.x * editorDisplayScale}
												cy={EDITOR_CENTER +
													pivotPoint.y * editorDisplayScale}
												r="6"
												fill="rgba(59,130,246,0.7)"
												stroke="white"
												stroke-width="1.5"
												class="cursor-grab"
												role="img"
												aria-label={m.point_editor_pivot_handle()}
												onpointerdown={(e) =>
													handleEditorPointerDown(e, 'pivot')}
											/>
											<text
												x={EDITOR_CENTER +
													pivotPoint.x * editorDisplayScale +
													10}
												y={EDITOR_CENTER +
													pivotPoint.y * editorDisplayScale +
													4}
												font-size="10"
												fill="rgba(59,130,246,0.9)"
												pointer-events="none"
												style="user-select: none"
											>
												pivot
											</text>
										</svg>
									</div>

									<!-- Numeric Controls -->
									<div class="flex w-48 flex-col gap-4">
										<div>
											<Label class="text-xs font-semibold text-red-500"
												>{m.point_editor_snap_offset()}</Label
											>
											<div class="mt-1 grid grid-cols-2 gap-2">
												<div>
													<Label class="text-xs">{m.label_x()}</Label>
													<Input
														type="number"
														bind:value={snapOffset.x}
														class="h-8"
													/>
												</div>
												<div>
													<Label class="text-xs">{m.label_y()}</Label>
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
												>{m.point_editor_pivot_point()}</Label
											>
											<div class="mt-1 grid grid-cols-2 gap-2">
												<div>
													<Label class="text-xs">{m.label_x()}</Label>
													<Input
														type="number"
														bind:value={pivotPoint.x}
														class="h-8"
													/>
												</div>
												<div>
													<Label class="text-xs">{m.label_y()}</Label>
													<Input
														type="number"
														bind:value={pivotPoint.y}
														class="h-8"
													/>
												</div>
											</div>
										</div>

										<div>
											<Label class="text-xs font-semibold"
												>{m.point_editor_scale()}</Label
											>
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

										{#if category === 'tools'}
											<div>
												<Label class="text-xs font-semibold"
													>{m.point_editor_anchor_target()}</Label
												>
												<Select.Root
													type="single"
													value={anchorTarget}
													onValueChange={(v) =>
														(anchorTarget = v as ToolAnchorKey)}
												>
													<Select.Trigger class="mt-1 h-8 w-full text-xs">
														{anchorTarget}
													</Select.Trigger>
													<Select.Content>
														{#each ['trunkBase', 'trunkMiddle', 'trunkTop', 'crownCenter', 'crownTop', 'roots'] as anchor (anchor)}
															<Select.Item value={anchor}
																>{anchor}</Select.Item
															>
														{/each}
													</Select.Content>
												</Select.Root>
											</div>

											<div class="flex items-center gap-2">
												<Checkbox
													id="show-anchors"
													bind:checked={showAnchorOverlay}
												/>
												<Label for="show-anchors" class="text-xs"
													>{m.point_editor_show_anchors()}</Label
												>
											</div>
										{/if}

										{#if isDev}
											<Button
												size="sm"
												class="mt-auto"
												onclick={handleApplyDefinition}
											>
												<Save class="mr-2 size-4" />
												{applyStatus ?? m.action_apply()}
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
</PageLayout>
