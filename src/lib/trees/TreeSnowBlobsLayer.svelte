<script lang="ts">
	import type { BlobGeometry, Point2D } from '$lib/trees/types/core.js';
	import { createPrng } from '$lib/trees/prng.js';

	interface Props {
		canopyBlobs: readonly BlobGeometry[];
		seed: number;
	}

	let { canopyBlobs, seed }: Props = $props();

	interface SnowEllipse {
		readonly cx: number;
		readonly cy: number;
		readonly rx: number;
		readonly ry: number;
		readonly opacity: number;
	}

	const snowEllipses = $derived.by(() => {
		const rng = createPrng(seed + 55555);
		const ellipses: SnowEllipse[] = [];

		for (const blob of canopyBlobs) {
			if (blob.triangles.length === 0) {
				continue;
			}

			const bounds = computeBlobBounds(blob.triangles.map((t) => t.points).flat());
			const blobWidth = bounds.maxX - bounds.minX;
			const blobHeight = bounds.maxY - bounds.minY;

			const rx = blobWidth * 0.35;
			const ry = blobHeight * 0.18;

			if (rx < 1 || ry < 1) {
				continue;
			}

			ellipses.push({
				cx: blob.center.x,
				cy: blob.center.y - blobHeight * 0.15,
				rx,
				ry,
				opacity: 0.6 + rng() * 0.2,
			});
		}

		return ellipses;
	});

	function computeBlobBounds(points: readonly Point2D[]): {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
	} {
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		for (const p of points) {
			if (p.x < minX) {
				minX = p.x;
			}
			if (p.y < minY) {
				minY = p.y;
			}
			if (p.x > maxX) {
				maxX = p.x;
			}
			if (p.y > maxY) {
				maxY = p.y;
			}
		}
		return { minX, minY, maxX, maxY };
	}
</script>

<g class="snow-blobs">
	{#each snowEllipses as ellipse (ellipse)}
		<ellipse
			cx={ellipse.cx}
			cy={ellipse.cy}
			rx={ellipse.rx}
			ry={ellipse.ry}
			fill="white"
			opacity={ellipse.opacity}
		/>
	{/each}
</g>
