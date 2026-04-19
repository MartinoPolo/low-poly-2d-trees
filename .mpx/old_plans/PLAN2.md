# Low-Poly 2D Tree Generator — Plan v2

Builds on [PLAN.md](PLAN.md). This plan addresses visual quality issues and architectural
changes identified after the first implementation round.

---

## Summary of Changes from Plan v1

| Area              | Plan v1                                                                  | Plan v2                                                                     |
| ----------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Canopy rendering  | Single Delaunay triangulation over all blobs, single hemisphere lighting | Per-blob triangulation + per-blob hemisphere lighting with depth ordering   |
| Pine shape        | Elliptical blobs stacked vertically                                      | Triangular tier system (Christmas tree silhouette)                          |
| Trunk/branch mesh | Unified point cloud → single triangulation                               | Separate SVG layers: trunk, branches, canopy blobs (back-to-front)          |
| Trunk taper       | Linear (was accidentally broken by trunk not reaching canopy)            | Linear (confirmed correct), ensure trunk enters biggest blob                |
| Canopy outline    | Random jitter on boundary points                                         | Post-processed boundary: no acute angles for oak/bushy; acute tips for pine |
| Blob depth        | None                                                                     | Depth parameter per blob; contained blobs always in front                   |
| Blob sizing       | Uniform random                                                           | `blobSizeVariance` parameter (0–1) controlling smallest-to-largest ratio    |
| Branch spawning   | From trunk only, count 0–5                                               | From trunk or other branches, count 0–20, visible zone only                 |
| UI layout         | Page scroll, single column controls                                      | `100dvh` grid; scrollable multi-column controls; sticky tree preview        |

---

## New Parameters

| Parameter          | Type     | Default | Range     | Step  | Description                                                                                                                         |
| ------------------ | -------- | ------- | --------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `blobSizeVariance` | `number` | `0.5`   | `0.0–1.0` | `0.1` | Controls ratio between largest and smallest blob. At 0: all blobs same size. At 1: smallest blob is 1/10th the area of the largest. |

Unchanged from Plan v1: `canopyPolygons`, `trunkPolygons`, `blobCount`, `branchCount`,
`depthVariance`, all color/lighting params.

Updated range: `branchCount` max increased from 5 → 20.

---

## Architecture

### SVG Layer Order (painter's algorithm, back-to-front)

```
1. Trunk        <g class="trunk">
2. Branches     <g class="branches">
3. Canopy blobs <g class="canopy">
   └─ blob N (furthest back)
   └─ blob N-1
   └─ ...
   └─ blob 0 (closest to viewer)
```

Each canopy blob is a separate `<g>` element containing its own triangulated triangles.
SVG painter's algorithm means later elements paint over earlier ones — no clipping or
z-buffer needed for overlap resolution.

---

## Issue Fixes

### 1. Per-blob triangulation and lighting

**Problem:** All blobs blended into one hemisphere, producing a single smooth canopy with
no visible blob separation.

**Fix:**

1. Generate blobs as before (per shape definition).
2. Assign depth index to each blob:
    - If blob A fully contains blob B → B gets a higher depth (rendered later = in front).
    - Otherwise, depth is assigned randomly (seeded).
3. Distribute `canopyPolygons` budget across blobs proportional to their area.
4. For each blob independently:
   a. Sample boundary points around that blob's ellipse (or triangle for pine tiers).
   b. Sample interior points via Poisson disk within that blob.
   c. Triangulate those points with Delaunator.
   d. Filter triangles to those whose centroid is inside that blob.
   e. Color each triangle using hemisphere lighting mapped to **that blob's** center/radii.
5. Render blob groups in depth order (back-to-front).

**Result:** Each blob has its own shading gradient, creating visible "bumps" in the canopy.
Overlapping regions are resolved by depth ordering — front blob's triangles cover back
blob's triangles.

### 2. Blob depth ordering rules

- **Containment rule:** If blob A's ellipse fully contains blob B's ellipse, B is always
  in front of A. This prevents "dead" invisible blobs.
- **Default rule:** If no containment relationship, assign random depth (seeded by blob
  index and tree seed).
- **Trunk connection:** The largest blob must be in the bottom half of the canopy, and the
  trunk top must enter this blob. Enforce by adjusting `trunkTop` to enter the largest blob
  (already partially implemented via `computeTrunkTop`).

### 3. Blob sizing variability

- `blobSizeVariance` parameter controls the size spread.
- Blob 0 (the "main" blob) is always the largest — full size.
- Subsequent blobs scale down progressively:
    ```
    minScale = 1.0 - blobSizeVariance * 0.9   // at variance=1: minScale=0.1
    blobScale[i] = lerp(1.0, minScale, i / (blobCount - 1))
    ```
- Applied to both `rx` and `ry` of each blob after generation.
- The main blob is positioned so the trunk connects to it.

### 4. No floating blobs

Every blob must be structurally connected to the tree:

- Either the blob overlaps with at least one other blob, OR
- At least one branch reaches into that blob.

After generating blobs and branches, validate this invariant. If an isolated blob exists
with no branch reaching it, extend an existing branch toward it or add a new branch.

### 5. Pine tree — triangular tier system

**Problem:** Elliptical blobs produce a bulbous shape that doesn't look like a pine/conifer.

**Fix:** Replace elliptical blobs with triangular tiers for the `pine` shape.

**Tier definition:**

```ts
interface Tier {
	// Isoceles triangle pointing up
	tipX: number;
	tipY: number;
	baseLeftX: number;
	baseLeftY: number;
	baseRightX: number;
	baseRightY: number;
}
```

**Generation:**

- `blobCount` controls number of tiers (default 3 for pine).
- Tiers stack from top (smallest, narrowest) to bottom (widest).
- Each tier's base is wider than the one above.
- Tiers overlap slightly — each tier's tip extends into the tier above.
- Overall silhouette creates the classic zigzag Christmas tree shape.

**Containment test:** `isPointInTier()` — standard point-in-triangle test.

**Boundary sampling:** Trace the tier's triangle outline. Tips produce acute angles
naturally. Non-tip edges can be subdivided for more polygons.

**Lighting:** Per-tier hemisphere lighting (same system as blobs). Each tier is treated
as its own hemisphere. May iterate to unified lighting if per-tier doesn't look right.

### 6. Trunk mesh — separate layer, linear taper

**Problem:** Branch vertices interfered with trunk triangulation, creating "cut-off"
artifacts. Trunk appeared to not reach canopy.

**Fix:**

- Trunk is its own SVG `<g>` layer with its own triangulation — completely independent of
  branch and canopy geometry.
- Linear taper from `trunkBaseWidth` at bottom to `trunkTopWidth` at top.
- `trunkTop` is dynamically computed to enter the largest canopy blob (at least 15px into
  the blob's bounding box).
- Optional: slightly flared base (wider bottom triangle) for a natural root look, if
  trivial to implement. Not required.

### 7. Branch system — separate layer, hierarchical

**Problem:** Branches merged with trunk mesh caused artifacts. Branch endpoints visible
outside canopy.

**Fix:**

- Branches rendered as a separate SVG `<g>` layer, in front of trunk, behind canopy.
- Branches can originate from:
    - The trunk (thicker, `widthStart` ~5–8px)
    - Another branch (thinner, `widthStart` ~2–4px)
- Branch endpoint rules:
    - If the endpoint is **above** the canopy bottom → it must end inside a canopy blob
      (hidden by canopy layer).
    - If the endpoint is **below** the canopy bottom → it may end in open air (bare branch
      visible below canopy, which is natural).
- `branchCount` range: 0–20 (default per shape: oak=2, pine=0, bushy=1).
- **Isolated blob targeting:** If a canopy blob has no overlap with any other blob, at
  least one branch must reach into it (no floating blobs).

### 8. Canopy outline smoothness

**Problem:** Acute angles on oak/bushy canopy boundary look unnatural.

**Fix:** Post-process boundary points after sampling:

1. Sort boundary points by angle from blob center.
2. For each consecutive triple of boundary points (A, B, C), compute the angle at B.
3. If the angle at B is acute (< 90°) for oak/bushy:
    - Move B outward along its radial direction until the angle is ≥ 90°, OR
    - Remove B and let A-C form the edge directly.
4. For pine tiers: skip this check at tier tips (acute angles desired). Apply smoothing
   only along the non-tip edges of each tier.

### 9. UI layout overhaul

**Problem:** Scrolling the page to adjust controls hides the tree preview.

**Fix:**

- Both showcase pages use `100dvh` CSS grid layout.
- **Grid structure:** Left column = scrollable controls panel. Right column = tree preview
  (centered, scaled to fit, never scrolls).
- **Controls panel:**
    - `overflow-y: auto` for independent scrolling.
    - 2-column card grid when viewport width ≥ 1200px, single column below.
- **Scene page:** Right column shows 3 trees side by side. Controls on left.
- **Root page:** Add a navigation button/link to `/showcase`.

---

## Render Pipeline (updated)

```
1. createPrng(seed)
2. getShapeDefinition(shape)
3. generateBlobs(rng, blobCount) — or generateTiers() for pine
4. Apply blobSizeVariance scaling
5. Ensure main blob is in bottom half, trunk enters it
6. computeTrunkTop(shapeDef, blobs)
7. generateBranches(rng, ...) — hierarchical, visible zone
8. Validate no-floating-blobs invariant
9. Generate trunk mesh (separate triangulation)
10. Generate branch mesh (separate triangulation)
11. For each blob/tier (sorted by depth, back-to-front):
    a. Allocate polygon budget proportional to blob area
    b. Sample boundary points (with angle smoothing for oak/bushy)
    c. Sample interior points (Poisson disk)
    d. Triangulate with Delaunator
    e. Filter to blob containment
    f. Color with per-blob hemisphere lighting
12. Assemble SVG layers: trunk → branches → canopy blobs (back-to-front)
13. Compute anchor points
```

---

## File Changes

| File                                     | Changes                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/trees/types.ts`                 | Add `blobSizeVariance` to `TreeConfig` and defaults. Add `Tier` type. Update `branchCount` max to 20.                                                                                                                                                                                                   |
| `src/lib/trees/shapes.ts`                | Add tier generation for pine. Add `isPointInTier()`. Update `generateBlobs()` to apply size variance and ensure main blob is bottom-half. Add blob depth assignment. Update `sampleCanopyBoundary()` with angle smoothing. Update `generateBranches()` for hierarchical branching (branch-from-branch). |
| `src/lib/trees/generate.ts`              | Rewrite to per-blob triangulation pipeline. Separate trunk/branch/canopy into independent meshes. Render each blob as its own `<g>`. Distribute polygon budget per blob.                                                                                                                                |
| `src/lib/trees/lighting.ts`              | `computeCanopyColor()` now takes per-blob bounds (not global canopy bounds). No algorithmic change — just scoped to individual blob.                                                                                                                                                                    |
| `src/lib/trees/LowPolyTree.svelte`       | Update SVG to render separate `<g>` layers for trunk, branches, and per-blob canopy groups.                                                                                                                                                                                                             |
| `src/routes/+page.svelte`                | Add navigation button/link to `/showcase`.                                                                                                                                                                                                                                                              |
| `src/routes/showcase/+page.svelte`       | Add `blobSizeVariance` slider. `branchCount` max → 20. Rework layout to `100dvh` grid with scrollable controls panel (2-column cards on wide viewports).                                                                                                                                                |
| `src/routes/showcase/scene/+page.svelte` | Same parameter + layout changes as single editor.                                                                                                                                                                                                                                                       |
