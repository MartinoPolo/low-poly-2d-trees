import type { TreeGeometry, Triangle, BlobGeometry, Point2D, TreeAnchors } from './types.js';
import { GEOMETRY_GROUPS, VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from './types.js';
import { GROUND_LINE_Y } from './stages/constants.js';
import type { PottedPlantConfig } from './types/potted_plant_types.js';
import { POTTED_PLANT_STAGES } from './types/potted_plant_types.js';
import { createPrng, randomInRange } from './prng.js';

const POT_COLOR = '#c2754a';
const POT_DARK_COLOR = '#a0603d';
const SOIL_COLOR = '#6B4226';
const STEM_COLOR = '#5C4400';

const DEFAULT_CANOPY_LIGHT = '#a8d84e';
const DEFAULT_CANOPY_DARK = '#1a472a';

const DRIED_CANOPY_LIGHT = '#b8860b';
const DRIED_CANOPY_DARK = '#8b6914';

const POT_TOP_WIDTH = VIEWBOX_WIDTH * 0.6;
const POT_BOTTOM_WIDTH = VIEWBOX_WIDTH * 0.5;
const POT_HEIGHT = 40;
const STEM_HEIGHT = 50;

/** Build the trapezoidal pot + soil surface triangles. */
function buildPotTriangles(cx: number, potTopY: number, potBottomY: number): Triangle[] {
	const halfTopW = POT_TOP_WIDTH / 2;
	const halfBotW = POT_BOTTOM_WIDTH / 2;

	return [
		{
			points: [
				{ x: cx - halfTopW, y: potTopY },
				{ x: cx + halfTopW, y: potTopY },
				{ x: cx + halfBotW, y: potBottomY },
			],
			color: POT_COLOR,
			group: GEOMETRY_GROUPS.pot,
		},
		{
			points: [
				{ x: cx - halfTopW, y: potTopY },
				{ x: cx + halfBotW, y: potBottomY },
				{ x: cx - halfBotW, y: potBottomY },
			],
			color: POT_DARK_COLOR,
			group: GEOMETRY_GROUPS.pot,
		},
		{
			points: [
				{ x: cx - halfTopW + 4, y: potTopY },
				{ x: cx + halfTopW - 4, y: potTopY },
				{ x: cx, y: potTopY - 4 },
			],
			color: SOIL_COLOR,
			group: GEOMETRY_GROUPS.pot,
		},
	];
}

/** Build a thin stem triangle from pot rim upward. */
function buildStemTriangle(cx: number, potTopY: number, stemTopY: number): Triangle {
	return {
		points: [
			{ x: cx - 2, y: potTopY },
			{ x: cx + 2, y: potTopY },
			{ x: cx, y: stemTopY },
		],
		color: STEM_COLOR,
		group: GEOMETRY_GROUPS.trunk,
	};
}

/** Build 2 leaf triangles (sprout-style) as a single BlobGeometry. */
function buildSproutLeaves(
	cx: number,
	stemTopY: number,
	lightColor: string,
	darkColor: string,
): BlobGeometry {
	const leafTriangles: Triangle[] = [
		{
			points: [
				{ x: cx, y: stemTopY + 4 },
				{ x: cx - 12, y: stemTopY - 4 },
				{ x: cx - 2, y: stemTopY - 10 },
			],
			color: lightColor,
			group: GEOMETRY_GROUPS.canopy,
		},
		{
			points: [
				{ x: cx, y: stemTopY + 4 },
				{ x: cx + 12, y: stemTopY - 4 },
				{ x: cx + 2, y: stemTopY - 10 },
			],
			color: darkColor,
			group: GEOMETRY_GROUPS.canopy,
		},
	];

	return {
		triangles: leafTriangles,
		center: { x: cx, y: stemTopY - 3 },
		depth: 0,
	};
}

/** Build a fan-shaped canopy blob with triangles radiating from center. */
function buildCanopyBlob(
	center: Point2D,
	radius: number,
	triangleCount: number,
	lightColor: string,
	darkColor: string,
	rng: () => number,
	depth: number,
): BlobGeometry {
	const triangles: Triangle[] = [];
	const angleStep = (Math.PI * 2) / triangleCount;

	for (let i = 0; i < triangleCount; i++) {
		const angle1 = i * angleStep;
		const angle2 = (i + 1) * angleStep;
		const r1 = radius * (0.8 + rng() * 0.4);
		const r2 = radius * (0.8 + rng() * 0.4);
		const color = rng() > 0.5 ? lightColor : darkColor;

		triangles.push({
			points: [
				{ x: center.x, y: center.y },
				{
					x: center.x + Math.cos(angle1) * r1,
					y: center.y + Math.sin(angle1) * r1,
				},
				{
					x: center.x + Math.cos(angle2) * r2,
					y: center.y + Math.sin(angle2) * r2,
				},
			],
			color,
			group: GEOMETRY_GROUPS.canopy,
		});
	}

	return { triangles, center, depth };
}

/** Generate fruit slot positions around the canopy area. */
function generateFruitSlotPositions(
	cx: number,
	stemTopY: number,
	count: number,
	rng: () => number,
): Point2D[] {
	const slots: Point2D[] = [];
	const radius = 20;

	for (let i = 0; i < count; i++) {
		const angle = (i / count) * Math.PI * 2;
		const r = radius * (0.6 + rng() * 0.4);
		slots.push({
			x: cx + Math.cos(angle) * r,
			y: stemTopY - 10 + Math.sin(angle) * r,
		});
	}

	return slots;
}

export function generatePottedPlant(config: PottedPlantConfig): TreeGeometry {
	const rng = createPrng(config.seed);
	const cx = VIEWBOX_WIDTH / 2;
	const potBottomY = GROUND_LINE_Y;
	const potTopY = potBottomY - POT_HEIGHT;
	const stemTopY = potTopY - STEM_HEIGHT;

	const isDried = config.stage === POTTED_PLANT_STAGES.dried;
	const canopyLight = isDried
		? DRIED_CANOPY_LIGHT
		: (config.canopyLightColor ?? DEFAULT_CANOPY_LIGHT);
	const canopyDark = isDried
		? DRIED_CANOPY_DARK
		: (config.canopyDarkColor ?? DEFAULT_CANOPY_DARK);

	const trunkTriangles: Triangle[] = buildPotTriangles(cx, potTopY, potBottomY);
	const canopyBlobs: BlobGeometry[] = [];
	let fruitSlots: Point2D[] = [];

	const hasStem = config.stage !== POTTED_PLANT_STAGES.potWithSoil;

	if (hasStem) {
		trunkTriangles.push(buildStemTriangle(cx, potTopY, stemTopY));
	}

	if (config.stage === POTTED_PLANT_STAGES.sprout) {
		canopyBlobs.push(buildSproutLeaves(cx, stemTopY, canopyLight, canopyDark));
	}

	if (config.stage === POTTED_PLANT_STAGES.smallPlant) {
		// 1-2 small canopy blobs with ~6 triangles each
		const blobCount = rng() > 0.5 ? 2 : 1;
		for (let i = 0; i < blobCount; i++) {
			const offsetX = blobCount === 2 ? (i === 0 ? -15 : 15) : 0;
			const offsetY = blobCount === 2 ? randomInRange(rng, -5, 5) : 0;
			const blobCenter: Point2D = { x: cx + offsetX, y: stemTopY - 10 + offsetY };
			canopyBlobs.push(buildCanopyBlob(blobCenter, 18, 6, canopyLight, canopyDark, rng, i));
		}
		// 1-2 fruit slots
		const slotCount = rng() > 0.5 ? 2 : 1;
		fruitSlots = generateFruitSlotPositions(cx, stemTopY, slotCount, rng);
	}

	if (
		config.stage === POTTED_PLANT_STAGES.flowering ||
		config.stage === POTTED_PLANT_STAGES.dried
	) {
		// 2-3 canopy blobs
		const blobCount = rng() > 0.5 ? 3 : 2;
		for (let i = 0; i < blobCount; i++) {
			const angle = (i / blobCount) * Math.PI * 2;
			const offsetX = Math.cos(angle) * 15;
			const offsetY = Math.sin(angle) * 10;
			const blobCenter: Point2D = { x: cx + offsetX, y: stemTopY - 15 + offsetY };
			canopyBlobs.push(buildCanopyBlob(blobCenter, 22, 7, canopyLight, canopyDark, rng, i));
		}
		// 3-5 fruit slots
		const slotCount = 3 + Math.floor(rng() * 3); // 3, 4, or 5
		fruitSlots = generateFruitSlotPositions(cx, stemTopY, slotCount, rng);
		// Flowers are now rendered as SVG overlays via flowerSlots
	}

	// Compute anchors
	const effectiveStemTop = hasStem ? stemTopY : potTopY;
	const hasCanopy = canopyBlobs.length > 0;
	const crownCenterY = hasCanopy
		? canopyBlobs.reduce((sum, b) => sum + b.center.y, 0) / canopyBlobs.length
		: effectiveStemTop;
	const crownTopY = hasCanopy
		? Math.min(...canopyBlobs.map((b) => b.center.y - 20))
		: effectiveStemTop;

	const anchors: TreeAnchors = {
		trunkTop: { x: cx, y: effectiveStemTop },
		trunkMiddle: { x: cx, y: (potTopY + effectiveStemTop) / 2 },
		trunkBase: { x: cx, y: potTopY },
		crownCenter: { x: cx, y: crownCenterY },
		crownTop: { x: cx, y: crownTopY },
		roots: { x: cx, y: potBottomY },
		branchTips: [],
		fruitSlots,
	};

	return {
		trunkQuads: [],
		trunkTriangles,
		branchGroups: [],
		canopyBlobs,
		fruitTriangles: [],
		stakeTriangles: [],
		fruitSlots,
		flowerSlots: fruitSlots,
		showFallingLeaves: false,
		anchors,
		viewBox: { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT },
	};
}
