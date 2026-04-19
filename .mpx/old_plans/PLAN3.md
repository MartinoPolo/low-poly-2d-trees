# Low-Poly 2D Tree Generator — Plan v3

Builds on [PLAN2.md](PLAN2.md) and [REQUIREMENTS.md](REQUIREMENTS.md). This plan addresses
visual bugs, introduces new parameters, replaces the "bushy" shape with "birch," and
establishes a real-value UI convention for all sliders.

---

## Summary of Changes from Plan v2

| Area                    | Plan v2                                      | Plan v3                                                                                  |
| ----------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Tree shapes             | `oak`, `pine`, `bushy`                       | `oak`, `pine`, `birch` (bushy replaced by tall/narrow birch)                             |
| Branch triangulation    | All branches pooled into one Delaunator call | Each branch segment triangulated independently                                           |
| Branch angle constraint | None                                         | ≥ 30° divergence from parent axis (trunk or parent branch)                               |
| Branch/trunk split      | Fixed 70% ratio                              | `trunkBranchRatio` parameter (40–80 %, default 70 %)                                     |
| Branch thickness        | Coupled to trunk                             | Separate `branchThickness` parameter (50–200 %, default 100 %)                           |
| Trunk thickness         | Fixed per-shape                              | `trunkThickness` parameter (50–200 %, default 100 %)                                     |
| Canopy size             | Fixed per-shape                              | `canopySize` parameter (50–200 %, default 100 %) — scales blob radii AND spread distance |
| Trunk height            | Fixed per-shape                              | `trunkHeight` parameter (30–150 %, default 100 %) — canopy moves proportionally          |
| Blob closeness          | Hardcoded spread radius                      | `blobCloseness` parameter (20–80 %, default 50 %) — pine overlap / oak-birch spread      |
| Blob size variance      | Abstract 0–1 range                           | Ratio-based 1.0x–10.0x range; pine: controls tier width ratio                            |
| Canopy centering        | Blob 0 offset rightward for blobCount=1      | Blob 0 snapped to trunk axis; odd counts balanced left/right                             |
| Pine tier alignment     | Independent of trunk lean                    | Tiers follow trunk lean axis                                                             |
| Debug toggles           | Only `showAnchors`                           | `showCanopy`, `showBranches`, `showTrunk` display props                                  |
| UI convention           | Abstract 0–1 sliders                         | Real-world values: percentages, multipliers ("Nx"), degrees                              |

---

## Decisions from Grilling Session

### D1 — Per-branch triangulation

**Problem:** All branch control points were pooled into a single Delaunator call, producing
triangles that span across different branches — branches "cut into" each other.

**Fix:** Triangulate each `BranchSegment` independently. Each branch produces its own
trapezoid mesh. The branch meshes are concatenated into the `<g class="branches">` layer.

### D2 — Branch angle constraint (≥ 30°)

Every branch's axis must diverge by at least 30° from the axis of its parent (trunk center
line or parent branch direction). During `generateBranches()`, reject candidate angles that
violate this and re-roll until the constraint is met (with a max-attempts guard).

### D3 — `trunkBranchRatio` parameter

Controls what fraction of `branchCount` originates from the trunk vs. from existing
branches.

| Property       | Value                      |
| -------------- | -------------------------- |
| Internal name  | `trunkBranchRatio`         |
| Internal range | 40 – 80                    |
| Unit           | percent (integer)          |
| Default        | 70                         |
| UI label       | "Trunk Branch Ratio: 70 %" |
| Step           | 5                          |

`trunkBranches = round(branchCount × trunkBranchRatio / 100)`,
`subBranches = branchCount − trunkBranches`.

### D4 — Separate `trunkThickness` and `branchThickness`

Both are percentage multipliers applied to the shape definition's base widths.

| Property       | `trunkThickness`         | `branchThickness`         |
| -------------- | ------------------------ | ------------------------- |
| Internal range | 50 – 200                 | 50 – 200                  |
| Unit           | percent (integer)        | percent (integer)         |
| Default        | 100                      | 100                       |
| UI label       | "Trunk Thickness: 100 %" | "Branch Thickness: 100 %" |
| Step           | 5                        | 5                         |

**Trunk:** `effectiveBaseWidth = shapeDef.trunkBaseWidth × trunkThickness / 100`,
`effectiveTopWidth = shapeDef.trunkTopWidth × trunkThickness / 100`.

**Branches:** `effectiveWidthStart = widthStart × branchThickness / 100`,
`effectiveWidthEnd = widthEnd × branchThickness / 100`.

### D5 — `canopySize` parameter

Scales all blob radii (or tier widths/heights for pine) and also the blob spread distance
proportionally.

| Property       | Value                |
| -------------- | -------------------- |
| Internal range | 50 – 200             |
| Unit           | percent (integer)    |
| Default        | 100                  |
| UI label       | "Canopy Size: 100 %" |
| Step           | 5                    |

Applied after blob/tier generation, before triangulation:

```
blob.rx *= canopySize / 100
blob.ry *= canopySize / 100
spreadDistance *= canopySize / 100  // for oak/birch
tierBaseHalfWidth *= canopySize / 100  // for pine
tierHeight *= canopySize / 100  // for pine
```

### D6 — `trunkHeight` parameter

Controls the trunk length. The canopy moves proportionally with the trunk top.

| Property       | Value                 |
| -------------- | --------------------- |
| Internal range | 30 – 150              |
| Unit           | percent (integer)     |
| Default        | 100                   |
| UI label       | "Trunk Height: 100 %" |
| Step           | 5                     |

```
effectiveTrunkTop = trunkBottom − (trunkBottom − defaultTrunkTop) × trunkHeight / 100
canopyCenterY adjusted proportionally to effectiveTrunkTop
```

At 30 %: very short trunk, canopy near ground. At 150 %: tall trunk, canopy pushed up.

### D7 — `blobCloseness` parameter

Controls how tightly canopy elements cluster together.

| Property       | Value                  |
| -------------- | ---------------------- |
| Internal range | 20 – 80                |
| Unit           | percent (integer)      |
| Default        | 50                     |
| UI label       | "Blob Closeness: 50 %" |
| Step           | 1                      |

**Pine:** `overlapFraction = blobCloseness / 100`. Each tier's tip extends into the tier
above by `overlapFraction × tierHeight`. At 20 %: tiers barely overlap. At 80 %: heavy
overlap.

**Oak / birch:** Controls blob spread distance.
`maxSpread = lerp(spreadRadius × 0.9, spreadRadius × 0.3, (blobCloseness − 20) / 60)`.
At 20 %: blobs far apart. At 80 %: tightly clustered.

**Main blob (blob 0):** Affected by closeness at 1/10th the magnitude of other blobs.
It may shift slightly off the trunk axis but never significantly.

### D8 — `blobSizeVariance` reworked to ratio-based

| Property       | Value                      |
| -------------- | -------------------------- |
| Internal range | 1.0 – 10.0                 |
| Unit           | ratio (largest / smallest) |
| Default        | 3.0                        |
| UI label       | "Blob Size Ratio: 3.0x"    |
| Step           | 0.1                        |

**Oak / birch:** `minScale = 1 / blobSizeVariance`. Blob 0 is full size; blob N is scaled
by `lerp(1.0, minScale, i / (blobCount − 1))`.

**Pine:** Controls the ratio of top tier base width to bottom tier base width. At 1.0x: all
tiers have equal width. At 10.0x: bottom tier is 10× wider than top tier.

### D9 — Canopy centering & balanced blob distribution

**Problem:** Blob 0 was placed using `cos(0) × dist` → always offset rightward.

**Fix:**

1. **blobCount = 1:** Blob 0 is placed directly on the trunk axis (`cx = trunkCenterX`).
2. **blobCount > 1:** Blob 0 stays on/near the trunk axis. Remaining blobs are split
   evenly left/right:
    - Odd indices (1, 3, 5 …) go left of center.
    - Even indices (2, 4, 6 …) go right of center.
    - Each side-blob gets a random radial offset constrained to its side.

### D10 — Pine tiers follow trunk lean

After `trunkLean` is computed, each tier's `tipX` and base midpoint are offset by:

```
offsetX = trunkLean × (1 − (tierY − trunkTop) / (trunkBottom − trunkTop))
```

This makes the pine tree lean coherently with its trunk instead of being independent.

### D11 — Replace "bushy" with "birch"

**Bushy** is removed. **Birch** is introduced as a tall, narrow canopy tree.

| Property              | Value                                     |
| --------------------- | ----------------------------------------- |
| Blob aspect ratio     | Tall: `rx` 6–12 % of W, `ry` 12–22 % of H |
| Blob stacking         | More vertical than horizontal             |
| Canopy center         | Higher up: H × 0.25                       |
| Default `blobCount`   | 3                                         |
| Default `branchCount` | 1                                         |
| Trunk widths          | `trunkBaseWidth` 10, `trunkTopWidth` 6    |

### D12 — Debug display toggles

Three new **display-only** props on `<LowPolyTree>` (not part of `TreeConfig`):

| Prop           | Type      | Default | Description                           |
| -------------- | --------- | ------- | ------------------------------------- |
| `showCanopy`   | `boolean` | `true`  | Toggle `<g class="canopy">` rendering |
| `showBranches` | `boolean` | `true`  | Toggle `<g class="branches">`         |
| `showTrunk`    | `boolean` | `true`  | Toggle `<g class="trunk">`            |

These control SVG layer visibility only — generation still runs for all layers (so anchors
remain correct). The showcase UI gets three checkboxes in the Lighting/Debug card.

### D13 — UI convention: show real values

All sliders display their real-world value, not abstract 0–1 ranges.

| Parameter          | UI format               | Example            |
| ------------------ | ----------------------- | ------------------ |
| `blobCloseness`    | integer percent         | "50 %"             |
| `blobSizeVariance` | ratio with "x" suffix   | "3.0x"             |
| `trunkThickness`   | integer percent         | "100 %"            |
| `branchThickness`  | integer percent         | "100 %"            |
| `canopySize`       | integer percent         | "100 %"            |
| `trunkHeight`      | integer percent         | "100 %"            |
| `trunkBranchRatio` | integer percent         | "70 %"             |
| `depthVariance`    | decimal multiplier      | "1.0" (keep as-is) |
| Color hues         | degrees with "°" suffix | "120°"             |
| Color sat/light    | percent with "%" suffix | "60 %"             |
| `lightAngle`       | degrees with "°" suffix | "315°"             |

---

## Updated `TreeConfig`

| ID   | Parameter          | Type                         | Default   | Range       | Step | UI display         |
| ---- | ------------------ | ---------------------------- | --------- | ----------- | ---- | ------------------ |
| P-01 | `shape`            | `'oak' \| 'pine' \| 'birch'` | `'oak'`   | 3 options   | —    | Select dropdown    |
| P-02 | `seed`             | `number`                     | `42`      | 0 – 999 999 | 1    | Number + Randomize |
| P-03 | `canopyPolygons`   | `number`                     | `50`      | 10 – 150    | 1    | "50"               |
| P-04 | `trunkPolygons`    | `number`                     | `30`      | 10 – 100    | 1    | "30"               |
| P-05 | `canopyHue`        | `number`                     | `120`     | 0 – 360     | 1    | "120°"             |
| P-06 | `canopyHueSpread`  | `number`                     | `40`      | 0 – 80      | 1    | "40"               |
| P-07 | `canopySaturation` | `number`                     | `60`      | 0 – 100     | 1    | "60 %"             |
| P-08 | `canopyLightness`  | `number`                     | `40`      | 10 – 80     | 1    | "40 %"             |
| P-09 | `trunkHue`         | `number`                     | `25`      | 0 – 360     | 1    | "25°"              |
| P-10 | `trunkSaturation`  | `number`                     | `50`      | 0 – 100     | 1    | "50 %"             |
| P-11 | `trunkLightness`   | `number`                     | `25`      | 10 – 80     | 1    | "25 %"             |
| P-12 | `lightAngle`       | `number`                     | `315`     | 0 – 360     | 1    | "315°"             |
| P-13 | `blobCount`        | `number`                     | per-shape | 1 – 8       | 1    | "5"                |
| P-14 | `branchCount`      | `number`                     | per-shape | 0 – 20      | 1    | "2"                |
| P-15 | `depthVariance`    | `number`                     | `1.0`     | 0.0 – 2.0   | 0.1  | "1.0"              |
| P-16 | `blobSizeVariance` | `number`                     | `3.0`     | 1.0 – 10.0  | 0.1  | "3.0x"             |
| P-17 | `blobCloseness`    | `number`                     | `50`      | 20 – 80     | 1    | "50 %"             |
| P-18 | `trunkThickness`   | `number`                     | `100`     | 50 – 200    | 5    | "100 %"            |
| P-19 | `branchThickness`  | `number`                     | `100`     | 50 – 200    | 5    | "100 %"            |
| P-20 | `canopySize`       | `number`                     | `100`     | 50 – 200    | 5    | "100 %"            |
| P-21 | `trunkHeight`      | `number`                     | `100`     | 30 – 150    | 5    | "100 %"            |
| P-22 | `trunkBranchRatio` | `number`                     | `70`      | 40 – 80     | 5    | "70 %"             |

### Per-shape defaults (updated)

| Shape   | `blobCount` | `branchCount` | `blobSizeVariance` | `blobCloseness` |
| ------- | ----------- | ------------- | ------------------ | --------------- |
| `oak`   | 5           | 2             | 3.0                | 50              |
| `pine`  | 3           | 0             | 3.0                | 50              |
| `birch` | 3           | 1             | 3.0                | 50              |

---

## Birch Shape Definition

```ts
birch: {
    trunkBaseWidth: 10,
    trunkTopWidth: 6,
    trunkBottom: H * 0.95,
    defaultTrunkTop: H * 0.45,
    generateBlobs(rng, blobCount) {
        // Tall, narrow ellipses stacked vertically
        // rx: 6–12% of W  (narrow)
        // ry: 12–22% of H (tall)
        // Canopy center: H * 0.25
        // Blobs distributed vertically with slight horizontal jitter
    }
}
```

---

## File Changes

| File                                     | Changes                                                                                                                                                                                                                                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/trees/types.ts`                 | Replace `bushy` → `birch`. Add P-17 through P-22 to `TreeConfig` and defaults. Change `blobSizeVariance` default from 0.5 to 3.0 and range from 0–1 to 1–10. Update `SHAPE_DEFAULTS`.                                                                                                                |
| `src/lib/trees/shapes.ts`                | Replace bushy shape def with birch. Per-branch triangulation in `generateBranches()`. 30° angle constraint. Canopy centering fix (blob 0 on trunk axis, balanced left/right). Pine tiers follow trunk lean. Apply `blobCloseness`, `canopySize`, `trunkThickness`, `branchThickness`, `trunkHeight`. |
| `src/lib/trees/generate.ts`              | Pass new params to shape/branch generation. Apply `trunkThickness` to trunk mesh. Apply `branchThickness` to branch mesh. Per-branch triangulation. Apply `trunkHeight` to trunk top / canopy Y offset. Apply `canopySize` scaling.                                                                  |
| `src/lib/trees/LowPolyTree.svelte`       | Add `showCanopy`, `showBranches`, `showTrunk` display props. Add new TreeConfig props. Conditionally render each `<g>` layer.                                                                                                                                                                        |
| `src/routes/showcase/+page.svelte`       | Add sliders for all new params with real-value labels. Add debug toggle checkboxes. Replace bushy references with birch.                                                                                                                                                                             |
| `src/routes/showcase/scene/+page.svelte` | Same parameter + UI changes as single editor. Replace bushy with birch.                                                                                                                                                                                                                              |

---

## Render Pipeline (updated from Plan v2)

```
 1. createPrng(seed)
 2. getShapeDefinition(shape)
 3. Apply trunkHeight → compute effectiveTrunkTop, shift canopy Y proportionally
 4. generateBlobs(rng, blobCount) — with centering fix (D9)
      OR generateTiers(rng, blobCount) — with trunk lean alignment (D10)
 5. Apply blobSizeVariance (ratio-based, D8)
 6. Apply canopySize scaling (D5) — radii AND spread
 7. Apply blobCloseness (D7) — spread distance or tier overlap
 8. Ensure main blob in bottom half, trunk enters it
 9. computeTrunkTop(shapeDef, blobs) with trunkThickness (D4)
10. generateBranches(rng, ...) — trunkBranchRatio (D3), 30° constraint (D2),
      branchThickness (D4)
11. Per-branch triangulation (D1)
12. Validate no-floating-blobs invariant
13. Generate trunk mesh (separate, with trunkThickness applied)
14. For each blob/tier (sorted by depth, back-to-front):
    a. Allocate polygon budget proportional to blob area
    b. Sample boundary points (with angle smoothing for oak/birch)
    c. Sample interior points (Poisson disk)
    d. Triangulate with Delaunator
    e. Filter to blob containment
    f. Color with per-blob hemisphere lighting
15. Assemble SVG layers (conditionally rendered per D12):
      trunk → branches → canopy blobs (back-to-front)
16. Compute anchor points
```
