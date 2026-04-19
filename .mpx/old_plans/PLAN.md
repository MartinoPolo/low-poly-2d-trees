# Low-Poly 2D Tree Generator — Implementation Plan

## Overview

A procedural low-poly 2D tree generator for a Tauri+Svelte application. Trees serve as visual
metaphors for Git worktrees; tools (shovel, kettle, etc.) can be pinned to anchor points on
the tree. Output is static SVG per tree, rendered via a reusable `<LowPolyTree>` Svelte component.

---

## Agreed Decisions

| Decision        | Choice                                                    |
| --------------- | --------------------------------------------------------- |
| Render target   | SVG (one `<svg>` per tree)                                |
| Generation      | Fully procedural (no source images)                       |
| Geometry groups | `canopy`, `trunk`, `branch` — separate `<g>` elements     |
| Interaction     | Static SVG initially; hover effects later                 |
| Component model | Per-tree: `<LowPolyTree ...props />`                      |
| Dependency      | `delaunator` (already installed)                          |
| Seeded RNG      | `mulberry32` (already implemented)                        |
| ViewBox         | Fixed `200×300` for all tree shapes                       |
| Color model     | HSL hue-based with hue spread, saturation, lightness      |
| Lighting        | Hemisphere mapping for canopy, cylinder mapping for trunk |
| Shape types     | 3 initial: `oak`, `pine`, `bushy`                         |

---

## Current State (What Exists)

All core files exist under `src/lib/trees/`:

- `types.ts` — types, constants, defaults
- `generate.ts` — orchestrator: silhouette → points → triangulate → color
- `shapes.ts` — blob-based silhouette generation per tree type
- `lighting.ts` — hemisphere/cylinder pseudo-3D lighting
- `prng.ts` — seeded PRNG + Poisson sampling
- `LowPolyTree.svelte` — SVG rendering component

Showcase pages exist:

- `src/routes/showcase/+page.svelte` — single tree editor with all controls
- `src/routes/showcase/scene/+page.svelte` — 3-tree scene with shared controls

---

## Issues To Fix & Features To Add

### 1. Separate canopy and trunk polygon counts

**Files:** `types.ts`, `generate.ts`, UI pages
**Change:** Replace single `polygonCount` with `canopyPolygons` (default 50, range 10–150) and `trunkPolygons` (default 30, range 10–100). Each budget is used directly for its respective geometry group.

---

### 2. Add `depthVariance` parameter

Controls how deep/shallow the hemisphere is, affecting the range of dark-to-light shading.
Higher values = more dramatic shadows; lower values = flatter look.

**Type definition:**

```ts
// in TreeConfig
readonly depthVariance: number; // 0.0–2.0, default 1.0
```

**Behavior:**

- `0.0` = completely flat (no 3D effect, uniform lighting)
- `1.0` = standard hemisphere depth (current behavior)
- `2.0` = exaggerated depth (deep shadows, bright highlights)

**Implementation in `lighting.ts`:**
Multiply the hemisphere z-component by `depthVariance`:

```
z = sqrt(1 - r²) * depthVariance
```

This stretches or flattens the virtual dome.

**UI:** Add slider on both showcase pages, range 0.0–2.0, step 0.1.

---

### 3. Fewer boundary vertices + irregular angles on canopy outline

**Problem:** Current boundary sampling uses too many evenly-spaced points, creating an
overly smooth, circular outline. Reference images show irregular, angular outlines with
relatively few vertices on the outside.

**Changes to `generate.ts` and `shapes.ts`:**

- Reduce boundary point ratio from 30% to ~15% of canopy budget
  (e.g., for 100 polygons → ~12 boundary points instead of ~25)
- Boundary points should NOT be evenly spaced — use irregular angular sampling
- Add angular jitter: each boundary point's angle is offset by a random amount
  (±15° to ±30°) from a uniform distribution
- Radial jitter: each boundary point's distance from the blob center varies by ±10-20%
- The boundary should not be perfectly convex; allow concavities between blobs

**Recommended boundary vertex count by polygon budget:**
| Polygon count | Boundary vertices |
|---|---|
| 50 | 8–10 |
| 100 | 10–14 |
| 200 | 14–20 |
| 500 | 20–30 |

---

### 4. Trunk and branches must touch the canopy

**Problem:** Branches may currently terminate in empty space if the blob configuration
doesn't extend low enough. Trunk top may not visually connect to canopy.

**Fix in `shapes.ts` → `generateBranches()`:**

- Each branch endpoint (`x2, y2`) must be verified to lie inside the canopy blobs
- If not, extend the branch along its direction until it enters a blob, or adjust the
  blob positions to cover branch tips
- The trunk's `trunkTop` Y-coordinate must be ≤ the lowest point of the canopy blobs'
  bounding box (i.e., trunk enters the canopy)

**Fix in shape definitions:**

- Ensure each shape's `trunkTop` is positioned so that it overlaps with the canopy blobs
  by at least 10-20px (already roughly the case, but verify for all blob configurations)

**Critical shape definition changes:**

- Oak: `trunkTop` must be at H \* 0.45 (was 0.55) so trunk enters deep into canopy. Blobs must spread around canopy center with visible separation.
- Pine: `trunkTop` must be at H \* 0.55 (was 0.72) so trunk enters the tiered canopy.
- Bushy: `trunkTop` must be at H \* 0.42 (was 0.55) so trunk enters the wide bushy canopy.
- All shapes: after generating blobs, dynamically adjust trunkTop to be at least 15px below the lowest blob bottom (maxY of blobs bounding box).

---

### 5. Branches thicker at trunk side, thinner at tip

**Problem:** Current `BranchSegment` has a single `width` value.

**Change `BranchSegment` interface:**

```ts
interface BranchSegment {
	readonly x1: number; // trunk-side start
	readonly y1: number;
	readonly x2: number; // tip end (inside canopy)
	readonly y2: number;
	readonly widthStart: number; // width at trunk (thicker)
	readonly widthEnd: number; // width at tip (thinner)
}
```

**Generation defaults:**

- `widthStart`: 4–7px (random)
- `widthEnd`: 1–3px (random, always < widthStart)

**Point sampling in `generate.ts`:**
At each segment step, interpolate width: `w = widthStart + t * (widthEnd - widthStart)`
where `t` goes 0→1 from trunk to tip.

---

### 6. Not enough dark areas — improve depth contrast

**Problems identified:**

1. Ambient component too high (0.2 in current code) — shadows never get truly dark
2. Lightness spread too narrow — `(lighting - 0.5) * 50` may not be enough
3. Need the `depthVariance` parameter (item 2 above) to amplify this

**Changes to `lighting.ts` → `computeCanopyColor()`:**

- Reduce ambient from 0.2 to 0.15: `lighting = 0.15 + 0.85 * diffuse`
- Increase lightness spread from 50 to 60: `(lighting - 0.5) * 60`
- Apply `depthVariance` multiplier to the hemisphere z-component
- Shadowed faces (low lighting) should shift hue toward blue-green (cooler)
- Lit faces should shift hue toward yellow-green (warmer)
- Increase saturation boost on shadowed faces: `(0.5 - lighting) * 20` (was 15)

**Target color ranges for green canopy (hue=120, sat=60, light=40):**

- Brightest triangles: `hsl(140, 50%, 65%)` — bright lime-green
- Mid-tone triangles: `hsl(125, 60%, 40%)` — standard green
- Darkest triangles: `hsl(110, 70%, 18%)` — deep forest/teal

---

## Complete Parameter Specification

### `TreeConfig` — all parameters

| Parameter          | Type                         | Default   | Range     | UI Control                      | Description                                              |
| ------------------ | ---------------------------- | --------- | --------- | ------------------------------- | -------------------------------------------------------- |
| `shape`            | `'oak' \| 'pine' \| 'bushy'` | `'oak'`   | 3 options | Select                          | Tree silhouette type                                     |
| `seed`             | `number`                     | `42`      | 0–999999  | Number input + Randomize button | Deterministic generation seed                            |
| `canopyPolygons`   | `number`                     | `50`      | 10–150    | Slider                          | Triangle count for canopy                                |
| `trunkPolygons`    | `number`                     | `30`      | 10–100    | Slider                          | Triangle count for trunk + branches                      |
| `canopyHue`        | `number`                     | `120`     | 0–360     | Slider                          | Base canopy hue (120=green)                              |
| `canopyHueSpread`  | `number`                     | `40`      | 0–80      | Slider                          | Hue variation range across triangles                     |
| `canopySaturation` | `number`                     | `60`      | 0–100     | Slider                          | Base canopy saturation %                                 |
| `canopyLightness`  | `number`                     | `40`      | 10–80     | Slider                          | Base canopy lightness %                                  |
| `trunkHue`         | `number`                     | `25`      | 0–360     | Slider                          | Base trunk hue (25=brown)                                |
| `trunkSaturation`  | `number`                     | `50`      | 0–100     | Slider                          | Base trunk saturation %                                  |
| `trunkLightness`   | `number`                     | `25`      | 10–80     | Slider                          | Base trunk lightness %                                   |
| `lightAngle`       | `number`                     | `315`     | 0–360     | Slider                          | Light source angle in degrees (315=upper-left)           |
| `blobCount`        | `number`                     | per-shape | 1–8       | Slider                          | Number of overlapping ellipses forming canopy silhouette |
| `branchCount`      | `number`                     | per-shape | 0–5       | Slider                          | Number of visible branches extending into canopy         |
| `depthVariance`    | `number`                     | `1.0`     | 0.0–2.0   | Slider (step 0.1)               | Hemisphere depth multiplier; higher = more 3D contrast   |

### Per-shape defaults

| Shape   | `blobCount` | `branchCount` |
| ------- | ----------- | ------------- |
| `oak`   | 5           | 2             |
| `pine`  | 3           | 0             |
| `bushy` | 4           | 1             |

### `LowPolyTree` component props

All `TreeConfig` fields as individual props (with defaults from `DEFAULT_TREE_CONFIG`), plus:

| Prop          | Type                             | Default | Description                             |
| ------------- | -------------------------------- | ------- | --------------------------------------- |
| `showAnchors` | `boolean`                        | `false` | Render colored dots at anchor positions |
| `class`       | `string`                         | `''`    | CSS class for the `<svg>` element       |
| `onanchors`   | `(anchors: TreeAnchors) => void` | —       | Callback when anchors are computed      |

### `TreeAnchors` — output anchor points

| Anchor         | Description               | Computation                                          |
| -------------- | ------------------------- | ---------------------------------------------------- |
| `trunkTop`     | Where trunk meets canopy  | Top of trunk geometry, adjusted for lean             |
| `trunkMiddle`  | Midpoint of visible trunk | Vertically centered between trunkTop and trunkBottom |
| `trunkBottom`  | Base of tree              | Bottom of trunk geometry                             |
| `canopyCenter` | Center of canopy mass     | Centroid of canopy bounding box                      |

### `TreeGeometry` — output structure

```ts
{
  triangles: Triangle[]      // all triangles with color and group tag
  anchors: TreeAnchors       // computed anchor points
  viewBox: { width: 200, height: 300 }
}
```

Each `Triangle`:

```ts
{
	points: [Point2D, Point2D, Point2D]; // three vertices
	color: string; // hex color (#rrggbb)
	group: 'canopy' | 'trunk' | 'branch'; // semantic tag
}
```

---

## File Changes Required

### Modified files

1. **`src/lib/trees/types.ts`**
    - Add `depthVariance` to `TreeConfig` (default: `1.0`)
    - Replace `polygonCount` with `canopyPolygons` (default: `50`) and `trunkPolygons` (default: `30`)

2. **`src/lib/trees/lighting.ts`**
    - Accept `depthVariance` in lighting config
    - Apply depth variance to hemisphere z-component
    - Reduce ambient from 0.2 → 0.15
    - Increase lightness spread from 50 → 60
    - Increase saturation boost on shadows from 15 → 20

3. **`src/lib/trees/shapes.ts`**
    - Change `BranchSegment.width` to `widthStart` + `widthEnd`
    - Ensure branch endpoints lie inside canopy blobs
    - Ensure trunk overlaps with canopy

4. **`src/lib/trees/generate.ts`**
    - Use `canopyPolygons` directly for canopy budget, `trunkPolygons` for trunk budget
    - Pass `depthVariance` to lighting functions
    - Reduce boundary point ratio: 30% → 15%
    - Add angular jitter to boundary sampling
    - Add radial jitter to boundary sampling
    - Update branch point sampling for tapered width
    - Update `isPointInBranch` for variable width
    - Dynamically adjust trunkTop to overlap with canopy blobs

5. **`src/lib/trees/prng.ts`**
    - No changes needed

6. **`src/lib/trees/LowPolyTree.svelte`**
    - Add `depthVariance` prop

7. **`src/routes/showcase/+page.svelte`**
    - Add `depthVariance` slider (0.0–2.0, step 0.1)

8. **`src/routes/showcase/scene/+page.svelte`**
    - Add `depthVariance` slider (0.0–2.0, step 0.1)

---

## Algorithm Pipeline Summary

```
Input: TreeConfig
  │
  ├─ 1. Create seeded PRNG from seed
  ├─ 2. Get shape definition (oak/pine/bushy)
  ├─ 3. Generate canopy blobs (blobCount overlapping ellipses)
  ├─ 4. Generate trunk lean (random ±8px)
  ├─ 5. Generate branches (branchCount, tapered width, endpoints in canopy)
  │
  ├─ 6. Use canopyPolygons for canopy budget, trunkPolygons for trunk+branches budget
  │
  ├─ 7. Sample canopy boundary points (~15% of canopy budget)
  │     ├─ Irregular angular spacing (jitter ±15–30°)
  │     ├─ Radial jitter (±10–20% from blob edge)
  │     └─ NOT perfectly circular
  │
  ├─ 8. Sample canopy interior points (Poisson-disk rejection sampling)
  ├─ 9. Delaunay-triangulate all canopy points
  ├─ 10. Filter: keep only triangles whose centroid is inside blobs
  │
  ├─ 11. Sample trunk + branch edge points (tapered widths)
  ├─ 12. Delaunay-triangulate trunk points
  ├─ 13. Filter: keep only triangles inside trunk or branch regions
  │
  ├─ 14. Color each canopy triangle:
  │      ├─ Map centroid to hemisphere position
  │      ├─ Compute pseudo-normal from hemisphere (z scaled by depthVariance)
  │      ├─ Dot product with light direction → diffuse factor
  │      ├─ Apply rim darkening at edges
  │      ├─ Hue = baseHue + lighting-based shift + random jitter
  │      ├─ Saturation = baseSat + shadow boost + random jitter
  │      └─ Lightness = baseLight + lighting × 60 spread + random jitter
  │
  ├─ 15. Color each trunk/branch triangle:
  │      ├─ Cylinder mapping (horizontal position only)
  │      ├─ Diffuse from light direction
  │      └─ HSL with subtle variation
  │
  ├─ 16. Compute anchor points from geometry
  │
  └─ Output: TreeGeometry { triangles[], anchors, viewBox }
```

---

## Showcase Pages

### `/showcase` — Single Tree Editor

Layout: sidebar controls (320px) + preview area

- Shape selector (dropdown)
- Seed (number input + Randomize button)
- Polygon count slider (30–500, default 100)
- **Depth Variance slider (0.0–2.0, step 0.1, default 1.0)** ← NEW
- Canopy group: Hue, Hue Spread, Saturation, Lightness sliders
- Trunk group: Hue, Saturation, Lightness sliders
- Blob Count slider (1–8)
- Branch Count slider (0–5)
- Light Angle slider (0–360)
- Show Anchors checkbox
- Preview: single tree rendered at large size

### `/showcase/scene` — Three-Tree Scene

Layout: sidebar controls (280px) + preview area showing 3 trees side-by-side

- No shape selector (one of each type: oak, pine, bushy)
- Shared controls: seed, polygons, depth variance, canopy colors, trunk colors, light angle
- Each tree uses shape-specific blob/branch defaults
- Individual seeds offset from base: `seed`, `seed+1000`, `seed+2000`
