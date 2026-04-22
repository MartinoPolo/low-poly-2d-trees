<script lang="ts">
	import LowPolyTree from '$lib/trees/LowPolyTree.svelte';
	import SceneBackground from '$lib/scene/SceneBackground.svelte';

	import CustomBlobsEditor from '$lib/components/composed/CustomBlobsEditor.svelte';
	import CanopyColorCard from '$lib/components/composed/CanopyColorCard.svelte';
	import TrunkColorCard from '$lib/components/composed/TrunkColorCard.svelte';
	import ShapeCard from '$lib/components/composed/ShapeCard.svelte';
	import CanopyCard from '$lib/components/composed/CanopyCard.svelte';
	import TrunkCard from '$lib/components/composed/TrunkCard.svelte';
	import BranchesCard from '$lib/components/composed/BranchesCard.svelte';
	import LightingCard from '$lib/components/composed/LightingCard.svelte';
	import GrowablesCard from '$lib/components/composed/GrowablesCard.svelte';
	import DebugCard from '$lib/components/composed/DebugCard.svelte';
	import ToolAccessoriesCard from '$lib/components/composed/ToolAccessoriesCard.svelte';
	import OverlaysCard from '$lib/components/composed/OverlaysCard.svelte';
	import AnimationsCard from '$lib/components/composed/AnimationsCard.svelte';

	import {
		TREE_SHAPES,
		FRUIT_TYPES,
		isTreeStage,
		isTreeShape,
		isFruitType,
		type TreeShape,
	} from '$lib/trees/types.js';
	import {
		createDefaultToolVisibility,
		type ToolVisibility,
	} from '$lib/trees/tools/tool_types.js';
	import { growCustomBlobs } from '$lib/trees/shapes.js';
	import { getSavedTree, saveTree } from '$lib/trees/saved_trees.remote.js';
	import { setTreeConfigContext } from '$lib/trees/tree_config.context.svelte.js';
	import { setOverlayConfigContext } from '$lib/trees/overlays/overlay_config.context.svelte.js';
	import { setEditorViewStateContext } from '$lib/config/editor_view_state.context.svelte.js';
	import { page } from '$app/state';
	import SceneFloatingButtons from '$lib/components/app-shell/SceneFloatingButtons.svelte';
	import SettingsTierControl from '$lib/components/composed/SettingsTierControl.svelte';
	import { use_settings_tier, tierAtLeast } from '$lib/context/settings_tier.context.svelte.js';
	import { PaneGroup, Pane, Handle } from '$lib/components/ui/resizable/index.js';

	const overlayConfig = setOverlayConfigContext();
	const treeConfig = setTreeConfigContext();
	const editorView = setEditorViewStateContext();
	const { tier } = use_settings_tier();

	const user = $derived(page.data.user);
	const signedIn = $derived(user !== null);
	let toolVisibility: ToolVisibility = $state(createDefaultToolVisibility());
	let saveFormElement = $state<HTMLFormElement>();
	const isIntermediate = $derived(tierAtLeast(tier.current, 'intermediate'));
	const isAdvanced = $derived(tierAtLeast(tier.current, 'advanced'));

	const savedId = $derived(page.url.searchParams.get('saved'));
	const savedTreeQuery = $derived(savedId === null ? null : getSavedTree(savedId));
	let hydratedId = $state<string | null>(null);

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
			treeConfig.customBlobs.current = growCustomBlobs(
				treeConfig.customBlobs.current,
				treeConfig.current.blobCount,
				treeConfig.current.seed,
				treeConfig.current.blobCloseness,
			);
			return;
		}
		treeConfig.applyShapeDefaults(value as Exclude<TreeShape, 'custom'>);
	}

	function onBlobCountChange(value: number) {
		treeConfig.current.blobCount = value;
		if (treeConfig.current.shape === TREE_SHAPES.custom) {
			treeConfig.customBlobs.current = growCustomBlobs(
				treeConfig.customBlobs.current,
				value,
				treeConfig.current.seed,
				treeConfig.current.blobCloseness,
			);
		}
	}

	function randomizeSeed() {
		treeConfig.current.seed = Math.floor(Math.random() * 100000);
	}

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
			try {
				const data = await savedTreeQuery;
				if (currentSavedId !== savedId) {
					return;
				}
				treeConfig.applyConfig(data.config);
				hydratedId = currentSavedId;
			} catch {
				hydratedId = currentSavedId;
			}
		})();
	});
</script>

<svelte:head>
	<title>Single Editor</title>
</svelte:head>

<main class="h-dvh overflow-hidden bg-background text-foreground">
	<PaneGroup direction="vertical" autoSaveId="single-editor-resize">
		<Pane defaultSize={50} minSize={15}>
			<!-- Preview -->
			<div
				class="relative flex h-full items-center justify-center overflow-hidden border border-border p-8"
			>
				<SceneBackground />
				<div class="relative w-full" style="max-width: min(576px, calc(50dvh - 4rem))">
					<LowPolyTree
						config={treeConfig.configForTree.current}
						showCanopy={editorView.showCanopy.current}
						showBranches={editorView.showBranches.current}
						showTrunk={editorView.showTrunk.current}
						showFruit={editorView.showFruit.current}
						showAnchors={editorView.showAnchors.current}
						showEnvelope={editorView.showEnvelope.current}
						showViewBox={editorView.showViewBox.current}
						animateCanopySway={editorView.animateCanopySway.current}
						animateBranches={editorView.animateBranches.current}
						animateGrowth={editorView.animateGrowth.current}
						growthVariance={editorView.growthVariance.current}
						{toolVisibility}
						animateTools={editorView.animateTools.current}
						overlayConfig={overlayConfig.config.current}
						groundElements={overlayConfig.groundEnabled.current}
						groundElementCount={overlayConfig.groundElementCount.current}
						groundElementSize={overlayConfig.groundElementSize.current}
						class="h-auto w-full"
					/>
				</div>

				<SceneFloatingButtons
					onReset={() => {
						treeConfig.resetToShapeDefaults();
					}}
					onRandomize={randomizeSeed}
					showSave={true}
					onSave={triggerSave}
					saveDisabled={!signedIn}
				/>
			</div>
		</Pane>
		<Handle withHandle />
		<Pane defaultSize={50}>
			<!-- Controls -->
			<aside class="h-full select-none overflow-y-auto px-6 pb-6">
				<SettingsTierControl />
				<div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 p-px">
					<ShapeCard
						mode="single"
						{onShapeChange}
						{onStageChange}
						onRandomizeSeed={randomizeSeed}
					>
						{#snippet saveForm()}
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
								<p class="text-xs text-destructive" role="alert">
									Failed to save tree
								</p>
							{/if}
						{/snippet}
					</ShapeCard>

					<CanopyCard mode="single" {onBlobCountChange} />

					{#if isAdvanced && treeConfig.current.shape === TREE_SHAPES.custom}
						<CustomBlobsEditor
							customBlobs={treeConfig.customBlobs.current}
							blobCount={treeConfig.current.blobCount}
							onchange={(blobs) => (treeConfig.customBlobs.current = blobs)}
						/>
					{/if}

					{#if treeConfig.current.shape === TREE_SHAPES.custom}
						<GrowablesCard {onFruitTypeChange} />
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

					<TrunkCard mode="single" />

					<BranchesCard mode="single" />

					<LightingCard
						bind:lightAngle={treeConfig.current.lightAngle}
						bind:depthVariance={treeConfig.current.depthVariance}
					/>

					{#if isIntermediate}
						<ToolAccessoriesCard bind:toolVisibility />
					{/if}

					<AnimationsCard
						bind:animateCanopySway={editorView.animateCanopySway.current}
						bind:animateBranches={editorView.animateBranches.current}
						bind:animateGrowth={editorView.animateGrowth.current}
						bind:growthVariance={editorView.growthVariance.current}
						bind:animateTools={editorView.animateTools.current}
					/>

					<DebugCard
						mode="single"
						bind:showCanopy={editorView.showCanopy.current}
						bind:showBranches={editorView.showBranches.current}
						bind:showTrunk={editorView.showTrunk.current}
						bind:showFruit={editorView.showFruit.current}
						bind:showAnchors={editorView.showAnchors.current}
						bind:showEnvelope={editorView.showEnvelope.current}
						bind:showViewBox={editorView.showViewBox.current}
					/>

					<OverlaysCard />
				</div>
			</aside>
		</Pane>
	</PaneGroup>
</main>
