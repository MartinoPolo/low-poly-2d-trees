<script lang="ts">
	import LabeledSelect from './LabeledSelect.svelte';
	import LabeledRangeSlider from './LabeledRangeSlider.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import {
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
	} from '$lib/trees/types.js';

	interface CustomBlobPatch {
		readonly boundaryKind?: CustomBlobBoundaryKind;
		readonly rotationDeg?: number;
		readonly sizeScale?: number;
		readonly position?: { readonly x?: number; readonly y?: number };
	}

	interface Props {
		customBlobs: readonly CustomBlob[];
		blobCount: number;
		onchange: (blobs: readonly CustomBlob[]) => void;
	}

	let { customBlobs, blobCount, onchange }: Props = $props();

	function updateCustomBlob(index: number, patch: CustomBlobPatch): void {
		if (index < 0 || index >= customBlobs.length) {
			return;
		}
		const current = customBlobs[index]!;
		const updated = [...customBlobs];
		updated[index] = {
			boundaryKind: patch.boundaryKind ?? current.boundaryKind,
			rotationDeg: patch.rotationDeg ?? current.rotationDeg,
			sizeScale: patch.sizeScale ?? current.sizeScale,
			position: {
				x: patch.position?.x ?? current.position.x,
				y: patch.position?.y ?? current.position.y,
			},
		};
		onchange(updated);
	}
</script>

<Card.Root class="xl:col-span-2">
	<Card.Header>
		<Card.Title>Custom Blobs</Card.Title>
	</Card.Header>
	<Card.Content>
		<Accordion.Root type="multiple" class="w-full">
			{#each customBlobs as blob, i (i)}
				{#if i < blobCount}
					<Accordion.Item value={`blob-${i}`}>
						<Accordion.Trigger>
							<span class="flex flex-1 items-center justify-between pr-2">
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
											boundaryKind: value as CustomBlobBoundaryKind,
										})}
								/>
								<LabeledRangeSlider
									label="Rotation"
									min={0}
									max={360}
									step={CUSTOM_BLOB_ROTATION_STEP}
									value={blob.rotationDeg}
									unit="°"
									oninput={(e) =>
										updateCustomBlob(i, {
											rotationDeg: Number(
												(e.currentTarget as HTMLInputElement).value,
											),
										})}
								/>
								<LabeledRangeSlider
									label="Size"
									min={CUSTOM_BLOB_SIZE_MIN}
									max={CUSTOM_BLOB_SIZE_MAX}
									step={CUSTOM_BLOB_SIZE_STEP}
									value={blob.sizeScale}
									format={(v) => String(Math.round(v * 100))}
									unit="%"
									oninput={(e) =>
										updateCustomBlob(i, {
											sizeScale: Number(
												(e.currentTarget as HTMLInputElement).value,
											),
										})}
								/>
								<LabeledRangeSlider
									label="X"
									min={CUSTOM_BLOB_POSITION_MIN}
									max={CUSTOM_BLOB_POSITION_MAX}
									step={CUSTOM_BLOB_POSITION_STEP}
									value={blob.position.x}
									format={(v) => v.toFixed(2)}
									oninput={(e) =>
										updateCustomBlob(i, {
											position: {
												x: Number(
													(e.currentTarget as HTMLInputElement).value,
												),
											},
										})}
								/>
								<LabeledRangeSlider
									label="Y"
									min={CUSTOM_BLOB_POSITION_MIN}
									max={CUSTOM_BLOB_POSITION_MAX}
									step={CUSTOM_BLOB_POSITION_STEP}
									value={blob.position.y}
									format={(v) => v.toFixed(2)}
									oninput={(e) =>
										updateCustomBlob(i, {
											position: {
												y: Number(
													(e.currentTarget as HTMLInputElement).value,
												),
											},
										})}
								/>
							</div>
						</Accordion.Content>
					</Accordion.Item>
				{/if}
			{/each}
		</Accordion.Root>
	</Card.Content>
</Card.Root>
