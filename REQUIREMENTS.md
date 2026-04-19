# Low-Poly 2D Tree Generator — Requirements

Extracted from grilling sessions (PLAN.md–PLAN3.md + Plan v4 grilling + Engine v2 grilling 2026-04-15).
Plan v4 supersedes all previous plans where they conflict. Engine v2 (§13–14) supersedes §4
where they conflict. Intended as a stable basis for PRD and test authoring.

---

## 1. Rendering

### 1.1 SVG output

- [ ] **REQ-R-01** Each tree is rendered as a single `<svg>` element with a fixed viewBox of `200×300`.
      SVG overflow is hidden — content beyond the viewBox is clipped.
- [ ] **REQ-R-02** _(Superseded by REQ-EV2-Z-01 for branching shapes)_ The SVG contains exactly
      three top-level `<g>` layers rendered in painter's order (back-to-front): `trunk`, `branches`,
      `canopy`. Engine v2 introduces five z-order layers for branching shapes; branchless shapes
      retain this 3-layer model.
- [ ] **REQ-R-03** The `canopy` group contains one `<g>` child per blob/tier, ordered back-to-front
      by depth index (blobs rendered later appear in front).
- [ ] **REQ-R-04** Each polygon in the output has a `color` expressed as a hex string (`#rrggbb`),
      a `group` tag (`'canopy' | 'trunk' | 'branch'`), and either three (`Triangle`) or four
      (`Quad`) `Point2D` vertices. Engine v2 trunk/branch segments produce quads, not triangles.

### 1.2 Generation must be deterministic

- [ ] **REQ-R-05** Given the same `seed` and the same `TreeConfig`, the generator must always
      produce the exact same `TreeGeometry` output (no `Math.random()`).

---

## 2. Configuration Parameters (`TreeConfig`)

All parameters are read-only. Defaults apply when a value is omitted.

### 2.1 Core parameters

| ID       | Parameter           | Type                                                         | Default   | Range        | Step  | UI display              |
| -------- | ------------------- | ------------------------------------------------------------ | --------- | ------------ | ----- | ----------------------- |
| REQ-P-01 | `shape`             | `'oak'\|'pine'\|'birch'\|'fir'\|'maple'\|'willow'\|'custom'` | `'oak'`   | 7 options    | —     | Select dropdown         |
| REQ-P-02 | `seed`              | `number`                                                     | `42`      | 0 – 999 999  | 1     | Number + Randomize      |
| REQ-P-03 | `canopyPolygons`    | `number`                                                     | `50`      | 10 – 150     | 1     | "50"                    |
| REQ-P-04 | ~~`trunkPolygons`~~ | ~~`number`~~                                                 | ~~`30`~~  | ~~10 – 100~~ | ~~1~~ | **REMOVED** (Engine v2) |
| REQ-P-12 | `lightAngle`        | `number`                                                     | `130`     | 0 – 360      | 1     | "130°"                  |
| REQ-P-13 | `blobCount`         | `number`                                                     | per-shape | 1 – 8        | 1     | "5"                     |
| REQ-P-14 | `branchCount`       | `number`                                                     | per-shape | 0 – 20       | 1     | "2"                     |
| REQ-P-15 | `depthVariance`     | `number`                                                     | `1.0`     | 0.0 – 2.0    | 0.1   | "1.0"                   |
| REQ-P-16 | `blobSizeVariance`  | `number`                                                     | `3.0`     | 1.0 – 10.0   | 0.1   | "3.0x"                  |
| REQ-P-17 | `blobCloseness`     | `number`                                                     | `50`      | 20 – 80      | 1     | "50 %"                  |
| REQ-P-18 | `trunkThickness`    | `number`                                                     | `100`     | 25 – 400     | 5     | "100 %"                 |
| REQ-P-19 | `branchThickness`   | `number`                                                     | `100`     | 25 – 400     | 5     | "100 %"                 |
| REQ-P-20 | `canopySize`        | `number`                                                     | `100`     | 25 – 200     | 5     | "100 %"                 |
| REQ-P-21 | `trunkHeight`       | `number`                                                     | `100`     | 30 – 150     | 5     | "100 %"                 |
| REQ-P-22 | `trunkBranchRatio`  | `number`                                                     | `70`      | 40 – 80      | 5     | "70 %"                  |

### 2.2 New parameters (Plan v4)

| ID       | Parameter              | Type     | Default   | Range             | Step | UI display |
| -------- | ---------------------- | -------- | --------- | ----------------- | ---- | ---------- |
| REQ-P-23 | `branchLength`         | `number` | `100`     | 25 – 400          | 5    | "100 %"    |
| REQ-P-24 | `branchLengthVariance` | `number` | `50`      | 0 – 100           | 5    | "50 %"     |
| REQ-P-25 | `trunkLean`            | `number` | `0`       | -45 – 45          | 1    | "0°"       |
| REQ-P-26 | `trunkSegments`        | `number` | per-shape | min enforced – 10 | 1    | "5"        |
| REQ-P-27 | `trunkCrookedness`     | `number` | per-shape | 0 – 100           | 5    | "0 %"      |

### 2.2a New parameters (Engine v2 — 2026-04-15)

| ID       | Parameter             | Type     | Default | Range   | Step | UI display     | Tier     |
| -------- | --------------------- | -------- | ------- | ------- | ---- | -------------- | -------- |
| REQ-P-40 | `trunkStripCount`     | `number` | `3`     | 2 – 4   | 1    | "Trunk Strips" | Advanced |
| REQ-P-41 | `trunkTwist`          | `number` | `10`    | 0 – 100 | 5    | "10 %"         | Advanced |
| REQ-P-42 | `branchWidthVariance` | `number` | `25`    | 0 – 50  | 5    | "25 %"         | Advanced |

- **REQ-P-40** `trunkStripCount` — Number of visible strip faces on the trunk cross-section.
  Total cross-section faces = `2 × trunkStripCount`. Default 3 (hexagonal). UI label: "Trunk Strips".
- **REQ-P-41** `trunkTwist` — default changed from 0 to 10. Controls cumulative rotational
  drift of strips along the trunk. At 100%, faces can fully rotate in/out of view.
- **REQ-P-42** `branchWidthVariance` — Controls spread of individual branch widths. At 0%:
  all branches at same width ratio. At 50%: ±50% random spread. Disabled when `branchDepth === 0`.
- **REQ-P-43-REMOVED** `branchDepthTaper` removed — dead code; actual depth-based tapering uses
  hardcoded multipliers (L1=1.0x, L2=0.85x, L3=0.35x). Remove from `TreeConfig`,
  `DEFAULT_TREE_CONFIG`, UI, `disabled_params`, and all references.
- **REQ-P-04-REMOVED** `trunkPolygons` removed — dead code from old Delaunay trunk triangulation.
  Remove from `TreeConfig`, `DEFAULT_TREE_CONFIG`, `SHAPE_DEFAULTS`, UI, and all references.

### 2.3 Canopy color parameters (Plan v4 — replaces old HSL sliders)

| ID       | Parameter          | Type     | Default   | UI display          |
| -------- | ------------------ | -------- | --------- | ------------------- |
| REQ-P-30 | `canopyLightColor` | `string` | per-shape | Native color picker |
| REQ-P-31 | `canopyDarkColor`  | `string` | per-shape | Native color picker |

These **replace** the old `canopyHue`, `canopyHueSpread`, `canopySaturation`, `canopyLightness`
parameters (REQ-P-05 through REQ-P-08 are removed).

### 2.4 Trunk color parameters (unchanged HSL + swatches)

| ID       | Parameter         | Type     | Default   | Range   | Step | UI display |
| -------- | ----------------- | -------- | --------- | ------- | ---- | ---------- |
| REQ-P-09 | `trunkHue`        | `number` | per-shape | 0 – 360 | 1    | "25°"      |
| REQ-P-10 | `trunkSaturation` | `number` | per-shape | 0 – 100 | 1    | "50 %"     |
| REQ-P-11 | `trunkLightness`  | `number` | per-shape | 5 – 60  | 1    | "25 %"     |

Trunk color UI includes preset swatch buttons that set all three HSL sliders at once.

### 2.5 Per-shape defaults

| Shape    | `blobCount` | `branchCount` | `blobSizeVariance` | `blobCloseness` | `trunkSegments` | `trunkCrookedness` | `branchThickness` |
| -------- | ----------- | ------------- | ------------------ | --------------- | --------------- | ------------------ | ----------------- |
| `oak`    | 5           | 2             | 3.0                | 50              | 1               | 0                  | 100               |
| `pine`   | 3           | 0             | 3.0                | 50              | 1               | 0                  | 100               |
| `birch`  | 3           | 1             | 3.0                | 50              | 1               | 0                  | 100               |
| `fir`    | 4           | 0             | 3.0                | 50              | 1               | 0                  | 100               |
| `maple`  | 5           | 5             | 2.0                | 30              | 1               | 0                  | 100               |
| `willow` | 4           | 4             | 3.0                | 50              | 3               | 40                 | 150               |

### 2.6 Per-shape default colors

| Shape    | `canopyLightColor` | `canopyDarkColor` | `trunkHue` | `trunkSaturation` | `trunkLightness` |
| -------- | ------------------ | ----------------- | ---------- | ----------------- | ---------------- |
| `oak`    | `#a8d84e`          | `#1a472a`         | 25         | 50                | 25               |
| `pine`   | `#4a9e5c`          | `#0d2b1a`         | 20         | 45                | 20               |
| `birch`  | `#b8e065`          | `#2d5e3a`         | 40         | 15                | 80               |
| `fir`    | `#3d8b50`          | `#0a2418`         | 22         | 50                | 28               |
| `maple`  | `#e8a028`          | `#8b2010`         | 30         | 20                | 35               |
| `willow` | `#7cc45a`          | `#1a4020`         | 25         | 40                | 22               |

### 2.7 Trunk color preset swatches

| Swatch      | `trunkHue` | `trunkSaturation` | `trunkLightness` |
| ----------- | ---------- | ----------------- | ---------------- |
| Light birch | 40         | 20                | 75               |
| Warm brown  | 25         | 50                | 35               |
| Dark brown  | 20         | 55                | 20               |
| Red-brown   | 10         | 45                | 30               |
| Gray        | 0          | 5                 | 45               |
| White       | 0          | 0                 | 90               |

---

## 3. Canopy Generation

### 3.1 Blob system (oak, birch, maple, willow)

- [ ] **REQ-C-01** Canopy is composed of `blobCount` overlapping shapes. Blob 0 is always the
      largest blob and is positioned on or very near the trunk axis.
- [ ] **REQ-C-01a** When `blobCount = 1`, blob 0 is placed directly on the trunk axis
      (`cx = trunkCenterX`).
- [ ] **REQ-C-01b** When `blobCount > 1`, blob 0 stays on/near the trunk axis. Remaining blobs are
      distributed radially around the main blob, not just left/right. Non-primary blobs maintain a
      minimum distance from the center axis.
- [ ] **REQ-C-02** `blobSizeVariance` stores the largest-to-smallest ratio (1.0x–10.0x). At `1.0`
      all blobs are the same size; at `10.0` the largest blob is 10× the area of the smallest.
      `minScale = 1 / blobSizeVariance`;
      `blobScale[i] = lerp(1.0, minScale, i / (blobCount − 1))`.
- [ ] **REQ-C-02a** For pine/fir, `blobSizeVariance` controls the ratio of top tier base width to
      bottom tier base width. At 1.0x: equal widths. At 10.0x: bottom tier is 10× wider.
- [ ] **REQ-C-03** Depth ordering: if blob A fully contains blob B, blob B must always render in
      front of blob A (higher depth index). Otherwise depth is assigned randomly (seeded).
- [ ] **REQ-C-03a** `blobCloseness` (20–80 %) controls how tightly blobs cluster. For oak/birch:
      higher values = tighter clustering around the trunk axis. Main blob (blob 0) is affected at
      1/10th the magnitude of other blobs.
- [ ] **REQ-C-03b** `canopySize` (25–400 %) scales all blob radii AND the blob spread distance
      proportionally. SVG overflow is clipped at viewBox edges for extreme values.

### 3.2 Base value scaling (Plan v4)

- [ ] **REQ-C-14** Internal base values for blob radii, trunk widths, and branch widths are scaled
      up by 1.75× relative to Plan v3 values. This makes the previous 175% visual output the new
      100% default. No runtime multiplication — constants are baked into shape definitions.
- [ ] **REQ-C-14a** Slider ranges for `canopySize`, `trunkThickness`, `branchThickness`, and
      `branchLength` are expanded to 25–400%.

### 3.3 Blob boundary shapes

- [ ] **REQ-C-15** Blob boundaries can be one of: `circle` (default for oak/birch/maple/willow),
      `teardrop` (fir top blob), `egg`, `isoscelesTriangle`, or `equilateralTriangle` (the last
      three are available for custom tree).
- [ ] **REQ-C-15a** **Teardrop shape**: an ellipse where the top half is compressed to a point via
      a parametric power curve. For vertical parameter `t ∈ [-1, +1]` (−1 = pointy top,
      +1 = rounded bottom): top half (`t < 0`) → `x(t) = rx·√(1 − t²)·(1 + t)^p` with `p = 0.6`;
      bottom half (`t ≥ 0`) → `x(t) = rx·√(1 − t²)` (standard ellipse). `y(t) = ry·t`. Pointy at
      the top, smoothly rounded at the bottom.
- [ ] **REQ-C-15b** **Egg shape**: slightly narrower top half, wider bottom half, no sharp point.
      For vertical parameter `t ∈ [-1, +1]`: top half (`t < 0`) → `x(t) = rx·√(1 − t²)·(1 − α·|t|)`
      with `α = 0.15` (narrows the top); bottom half (`t ≥ 0`) → `x(t) = rx·√(1 − t²)·(1 + β·t)`
      with `β = 0.15` (widens the bottom). `y(t) = ry·t`. α and β may be tuned for visual fit
      during implementation.
- [ ] **REQ-C-15c** All non-circle boundaries support an arbitrary rotation angle (0–360°).
      Triangulation uses the custom boundary for point-in-shape tests and boundary sampling.
      Rotation is applied to sampled `(x, y)` pairs via a standard 2D rotation matrix.
- [ ] **REQ-C-15d** **Isosceles triangle boundary**: fixed 40° apex angle (70°/70° base). Tip
      points up at `(0, -ry)`; base corners flank the bottom. No per-shape apex angle control.
- [ ] **REQ-C-15e** **Equilateral triangle boundary**: 60°/60°/60° angles, vertices on a circle
      of radius `rx`; `ry` scales the vertical axis independently (allows squashing).
- [ ] **REQ-C-15f** The boundary shape dispatch lives in a dedicated module
      (`src/lib/trees/boundaries.ts`) that exports one entry per boundary kind with
      `{ kind, sample, contains, rotate }`. Blob generators in `shapes.ts` dispatch on each blob's
      `boundaryKind`.

### 3.4 Pine tier system

- [ ] **REQ-C-04** For `shape = 'pine'`, canopy is composed of `blobCount` triangular tiers
      (isoceles triangles pointing upward), not ellipses.
- [ ] **REQ-C-05** Tiers stack from top (smallest, narrowest) to bottom (widest). Each tier's
      base is wider than the tier above. `blobCloseness` controls how much each tier's tip extends
      into the tier above: `overlapFraction = blobCloseness / 100` (20 % to 80 % of tier height).
- [ ] **REQ-C-05a** Pine tier centers follow the trunk lean axis:
      `offsetX = trunkLean × (1 − (tierY − trunkTop) / (trunkBottom − trunkTop))`.
- [ ] **REQ-C-06** Point-in-canopy tests for pine use a point-in-triangle test (`isPointInTier()`),
      not a point-in-ellipse test.

### 3.5 Fir tree canopy (new — Plan v4)

- [ ] **REQ-C-16** For `shape = 'fir'`, canopy has `blobCount` blobs (default 4). Blob 0 (top) uses
      a teardrop boundary shape — pointy at top, rounded at bottom. Remaining blobs use circle
      boundary and cluster below the top blob, accumulating at the bottom of the canopy.
- [ ] **REQ-C-16a** The top teardrop blob is placed on the trunk axis, larger than the bottom
      blobs, with `rx ≈ W×0.18` and `ry ≈ H×0.28`. The 3 bottom circle blobs are arranged in a
      **horizontal row** at the bottom of the canopy region: center blob on trunk axis, left/right
      blobs at `cx = trunkCenterX ± (0.25 – 0.40)·W` with seeded jitter. All three bottom blobs
      share a common `cy` near the canopy bottom with small ±5–10 px vertical jitter. Bottom blob
      `rx/ry` ranges: `W × 0.22 – W × 0.32` / `H × 0.14 – H × 0.20` (wider than the top teardrop).

### 3.6 Maple tree canopy (new — Plan v4)

- [ ] **REQ-C-17** For `shape = 'maple'`, canopy has `blobCount` blobs (default 5) spread in a
      half-circle from left to right at the top. Each blob gets its own dedicated branch from the
      trunk. `blobCloseness` is low (default 30) so blobs are visually separated with room for
      branches.
- [ ] **REQ-C-17a** Blobs are distributed radially in a 180° arc above the trunk, evenly spaced.
- [ ] **REQ-C-17b** Maple branches are generated via a **shape-specific branch path** (not the
      generic `generateBranches()`): for each maple blob, emit exactly one branch whose origin is
      sampled on the trunk near the canopy base and whose tip is aimed toward that blob's
      `(cx, cy)`. Branch count equals blob count. Length and thickness follow existing branch
      defaults. The generic branch generator is untouched for oak/birch/willow/custom.

### 3.7 Oak blob spread improvement (Plan v4)

- [ ] **REQ-C-18** For `shape = 'oak'`, secondary blobs (indices 1+) are distributed radially
      (360° around main blob), not just left/right of center axis. Non-primary blobs maintain a
      minimum distance from the trunk center axis of `|cx − trunkCenterX| ≥ 0.15·W` to reduce
      excessive overlap near the trunk. Rejected samples are re-rolled up to 5 times before being
      clamped outward.

### 3.8 Birch canopy width (Plan v4)

- [ ] **REQ-C-19** For `shape = 'birch'`, blob horizontal radius (`rx`) ranges are doubled compared
      to Plan v3: `rx` range is `W × 0.12 – W × 0.24` (was `W × 0.06 – W × 0.12`).

### 3.9 Per-blob triangulation

- [ ] **REQ-C-07** Each blob/tier is triangulated independently. The `canopyPolygons` budget is
      distributed across blobs proportional to their area.
- [ ] **REQ-C-08** Boundary point count for each blob is approximately 15% of its allocated polygon
      budget (not 30%). Boundary points use irregular angular spacing with ±15–30° jitter and ±10–20%
      radial jitter — they are never evenly spaced.
- [ ] **REQ-C-09** Recommended boundary vertex counts by polygon budget: 50 → 8–10, 100 → 10–14,
      200 → 14–20, 500 → 20–30.
- [ ] **REQ-C-10** Interior points are sampled with Poisson-disk rejection sampling inside each blob.
- [ ] **REQ-C-11** After triangulation, only triangles whose centroid lies inside the blob are kept.

### 3.10 Canopy outline smoothing

- [ ] **REQ-C-12** For `oak`, `birch`, `maple`, `willow`: after boundary sampling, post-process
      boundary points so that no interior angle at any boundary vertex is acute (< 90°). Acute
      vertices are either moved outward radially or removed.
- [ ] **REQ-C-13** For `pine`/`fir`: the acute-angle smoothing is skipped at tier tips / teardrop
      tips (acute angles are desired). Non-tip edges may still be smoothed.

---

## 4. Trunk & Branch Generation (Plan v4 — partially superseded by §13–14)

> **Engine v2 supersedes:** REQ-T-01 (shared vertices now required at forks), REQ-T-02 (linear
> taper replaced by hybrid taper), REQ-T-05 (z-ordering replaces fixed layer order),
> REQ-T-08 (branch width now fork-derived), REQ-T-12 (segment distribution now two-zone).
> Requirements below remain valid for context and for branchless shapes. For branching shapes,
> see §13 (Phase 1) and §14 (Phase 2).

### 4.1 Trunk

- [ ] **REQ-T-01** The trunk is triangulated independently in its own `<g class="trunk">` layer and
      has no shared vertices with branches or canopy.
- [ ] **REQ-T-02** The trunk tapers linearly from `trunkBaseWidth` at the bottom to `trunkTopWidth`
      at the top. Both are scaled by `trunkThickness / 100`. Internal base widths are 1.75× the
      Plan v3 values (baked into shape definitions).
- [ ] **REQ-T-02a** `trunkHeight` (30–150 %) controls trunk length:
      `effectiveTrunkTop = trunkBottom − (trunkBottom − defaultTrunkTop) × trunkHeight / 100`.
      The canopy Y position shifts proportionally with the trunk top.
- [ ] **REQ-T-02b** When `trunkHeight` changes, all canopy blob `cy` values (and tier positions for
      pine/fir) are shifted by the delta `effectiveTrunkTop − defaultTrunkTop`. This ensures the
      canopy moves with the trunk.
- [ ] **REQ-T-03** `trunkTop` is dynamically computed to enter the largest canopy blob by at least
      15 px (at least 15 px below the lowest blob-bounding-box bottom and inside that blob).
- [ ] **REQ-T-04** The `trunkTop` Y-coordinate satisfies: `trunkTop ≤ lowestBlobY − 15`.

### 4.2 Trunk lean (Plan v4)

- [ ] **REQ-T-11** `trunkLean` is an explicit user-controlled parameter (-45° to +45°), replacing
      the old random lean value. At 0°: perfectly vertical. Positive: leans right. Negative: left.
- [ ] **REQ-T-11a** The trunk lean value is exact — no random jitter is added on top. Other seed-
      based variation provides organic feel.
- [ ] **REQ-T-11b** The lean in pixels is derived from the angle:
      `leanPx = tan(trunkLean × π / 180) × trunkHeight`.

### 4.3 Multi-segment trunk (Plan v4)

- [ ] **REQ-T-12** `trunkSegments` (1–5, default per-shape) controls how many linear segments
      compose the trunk. At 1: straight trunk (current behavior).
- [ ] **REQ-T-12a** `trunkCrookedness` (0–100 %, default per-shape) controls the max angle jitter
      per segment junction. At 0 %: all segments are aligned (straight). At 100 %: up to ±20°
      deviation per junction.
- [ ] **REQ-T-12b** The crookedness angle per junction is seeded:
      `maxJitter = lerp(5, 20, crookedness / 100)`,
      `junctionAngle = randomInRange(rng, -maxJitter, +maxJitter)`.
- [ ] **REQ-T-12c** Trunk crookedness is independent of trunk lean. Lean controls the angle from
      base to the first segment. Crookedness adds relative deviations between subsequent segments.
- [ ] **REQ-T-12d** The topmost segment's end position determines where the canopy sits. Canopy
      center is positioned relative to the top of the trunk.
- [ ] **REQ-T-12e** Willow tree defaults to `trunkSegments: 3`, `trunkCrookedness: 40`.

### 4.4 Branches

- [ ] **REQ-T-05** Branches are rendered in their own `<g class="branches">` layer, in front of
      the trunk and behind the canopy.
- [ ] **REQ-T-05a** Each branch segment is triangulated independently (not pooled). Branch meshes
      are concatenated into the branches layer.
- [ ] **REQ-T-05b** Every branch's axis must diverge by at least 30° from the axis of its parent
      (trunk center line or parent branch direction). Candidate angles violating this are re-rolled.
- [ ] **REQ-T-06** Each branch is represented as a `BranchSegment` with `(x1, y1)` at the
      trunk-side origin and `(x2, y2)` at the tip, plus `widthStart` (thicker) and `widthEnd`
      (thinner, always < `widthStart`). All widths are internally 1.75× the Plan v3 base values
      (baked in) and then scaled by `branchThickness / 100`.
- [ ] **REQ-T-07** Width is interpolated linearly along the branch: `w(t) = widthStart + t × (widthEnd − widthStart)` where `t ∈ [0, 1]` from trunk to tip.
- [ ] **REQ-T-08** Branches may originate from the trunk (thicker: `widthStart` ~9–14 px) or from
      another branch (thinner: `widthStart` ~4–7 px) — hierarchical branching is supported.
      `trunkBranchRatio` (40–80 %, default 70 %) controls what fraction originate from the trunk.
- [ ] **REQ-T-09** If a branch endpoint is above the canopy bottom, it must terminate inside a
      canopy blob (hidden by the canopy layer). If below the canopy bottom, it may end in open air.

### 4.5 Branch visibility (Plan v4)

- [ ] **REQ-T-13** Every branch segment must have at least 15 px of its length visible (not covered
      by any canopy blob). Visibility is computed geometrically — trace the branch segment and
      calculate total length outside all canopy blobs.
- [ ] **REQ-T-13a** For trunk-originating branches: the origin does not have to be below all blobs.
      A branch originating between side blobs is valid as long as ≥15 px is uncovered.
- [ ] **REQ-T-13b** For blob-connecting branches (floating-blob fix): the segment between the two
      blobs must have ≥15 px of visible length in the gap.
- [ ] **REQ-T-13c** For sub-branches: at least ≥10 px must be outside canopy.
- [ ] **REQ-T-13d** If a branch has insufficient visible length after placement, its origin is
      adjusted to increase visibility.

### 4.6 Branches cannot cross trunk (Plan v4)

- [ ] **REQ-T-14** No branch segment may cross the trunk center axis. A branch originating on the
      left side must stay on the left (and vice versa):
      `sign(endX − trunkCenterX) === sign(startX − trunkCenterX)`, or the endpoint is on the axis.
- [ ] **REQ-T-14a** Branches must not overlap each other. If a candidate branch would overlap an
      existing branch, it is re-rolled.

### 4.7 Branch length parameters (Plan v4)

- [ ] **REQ-T-15** `branchLength` (25–400 %, default 100 %) scales the base random length range.
      Trunk-originating branches use the upper end of the range; sub-branches use the lower end.
- [ ] **REQ-T-15a** `branchLengthVariance` (0–100 %, default 50 %) controls the spread between
      shortest and longest branches. At 0 %: all branches are the same length. At 100 %: maximum
      variation.

### 4.8 No-floating-blobs invariant

- [ ] **REQ-T-10** Every canopy blob must either overlap with at least one other blob OR have at
      least one branch endpoint inside it. After generation, isolated blobs without a connecting
      branch must receive an extended or new branch.

---

## 5. Lighting & Colour

### 5.1 Canopy lighting (Plan v4 — two-color gradient system)

- [ ] **REQ-L-01** Canopy lighting uses a two-color interpolation system. `canopyLightColor` (hex)
      is the color for fully lit faces. `canopyDarkColor` (hex) is the color for fully shadowed
      faces. The lighting factor (0–1) interpolates between these in HSL space.
- [ ] **REQ-L-01a** Each canopy blob uses hemisphere lighting mapped to that blob's own center and
      radii — not global canopy bounds.
- [ ] **REQ-L-02** Ambient component is `0.15`; diffuse component is `0.85 × diffuse`:
      `lighting = 0.15 + 0.85 × diffuse`.
- [ ] **REQ-L-04** `depthVariance` scales the hemisphere z-component:
      `z = sqrt(1 − r²) × depthVariance`. At `0.0` lighting is uniform; at `1.0` standard; at `2.0`
      exaggerated.
- [ ] **REQ-L-07** Target colour range for a green canopy (default oak): brightest faces use
      `canopyLightColor`, mid-tones interpolate 50 %, darkest faces use `canopyDarkColor`.

### 5.2 Per-shape default colors (Plan v4)

- [ ] **REQ-L-09** Each tree shape has default `canopyLightColor`, `canopyDarkColor`, and trunk
      HSL values (see §2.6). When the user selects a shape in the single tree editor, the color
      controls initialize to the shape's defaults.
- [ ] **REQ-L-09a** In the scene editor, a "Use per-shape default colors" toggle controls whether
      each tree uses its own shape defaults (toggle on) or all trees use the shared color pickers
      (toggle off, default). When the toggle is on, the shared color pickers are disabled.
- [ ] **REQ-L-09b** The per-shape-defaults toggle is only visible in the scene editor, not in the
      single tree editor.

### 5.3 Trunk / branch lighting

- [ ] **REQ-L-08** Trunk and branch triangles use cylinder-mapping (horizontal position only) for
      lighting, not hemisphere mapping.

---

## 6. Output (`TreeGeometry`)

- [ ] **REQ-O-01** `TreeGeometry` has the shape:
    ```ts
    { triangles: Triangle[]; anchors: TreeAnchors; viewBox: { width: 200; height: 300 } }
    ```
- [ ] **REQ-O-02** `TreeAnchors` exposes four points:
    - `trunkTop` — where trunk meets canopy (top of trunk geometry).
    - `trunkMiddle` — vertically centred between `trunkTop` and `trunkBottom`.
    - `trunkBottom` — base of trunk geometry.
    - `canopyCenter` — centroid of the canopy bounding box.

---

## 7. `<LowPolyTree>` Component

- [ ] **REQ-UI-01** The component accepts all `TreeConfig` fields as individual props with defaults
      from `DEFAULT_TREE_CONFIG`.
- [ ] **REQ-UI-02** Additional props:

    | Prop           | Type                             | Default | Description                              |
    | -------------- | -------------------------------- | ------- | ---------------------------------------- |
    | `showAnchors`  | `boolean`                        | `false` | Render coloured dots at anchor positions |
    | `showCanopy`   | `boolean`                        | `true`  | Toggle `<g class="canopy">` rendering    |
    | `showBranches` | `boolean`                        | `true`  | Toggle `<g class="branches">` rendering  |
    | `showTrunk`    | `boolean`                        | `true`  | Toggle `<g class="trunk">` rendering     |
    | `class`        | `string`                         | `''`    | CSS class forwarded to `<svg>`           |
    | `onanchors`    | `(anchors: TreeAnchors) => void` | —       | Callback fired when anchors are computed |

    Note: `showCanopy`, `showBranches`, `showTrunk` are display-only toggles. Generation still
    runs for all layers so that anchors remain correct.

---

## 8. Showcase Pages

### 8.1 Slider UX fix (Plan v4)

- [ ] **REQ-S-11** The entire controls panel (`<aside>`) has `user-select: none` (Tailwind
      `select-none`) applied to prevent text selection from interfering with slider dragging.

### 8.2 Layout (both pages)

- [ ] **REQ-S-01** Both showcase pages use a `100dvh` CSS grid layout — the tree preview never
      scrolls with the page.
- [ ] **REQ-S-02** Left column: scrollable controls panel (`overflow-y: auto`).
      Right column: tree preview — centred, scaled to fit, sticky.
- [ ] **REQ-S-03** Controls panel uses a 2-column card grid when viewport width ≥ 1200 px;
      single column below that.

### 8.3 `/showcase` — Single Tree Editor

- [ ] **REQ-S-04** Controls organized into cards:
    - **Shape**: shape selector dropdown, seed input + Randomize button
    - **Canopy**: `blobCount` slider, `blobSizeVariance` slider, `blobCloseness` slider, `canopySize` slider
    - **Trunk & Branches**: `trunkHeight` slider, `trunkThickness` slider, `trunkLean` slider,
      `trunkSegments` slider, `trunkCrookedness` slider, `branchCount` slider, `branchThickness`
      slider, `branchLength` slider, `branchLengthVariance` slider, `trunkBranchRatio` slider
    - **Canopy Color**: 2 native color pickers (`canopyLightColor`, `canopyDarkColor`)
    - **Trunk Color**: preset swatch buttons + 3 HSL sliders (`trunkHue`, `trunkSaturation`, `trunkLightness`)
    - **Geometry**: `canopyPolygons` slider, `trunkPolygons` slider
    - **Lighting**: `lightAngle` slider, `depthVariance` slider
    - **Debug**: Show Anchors, Show Canopy, Show Branches, Show Trunk checkboxes
- [ ] **REQ-S-04a** All sliders display real-world values: percentages, multipliers ("Nx"),
      degrees ("°"). No abstract 0–1 ranges.
- [ ] **REQ-S-04b** The `custom` shape is available only in the single tree editor. When selected,
      per-blob controls appear (see §9).
- [ ] **REQ-S-05** Preview shows a single tree rendered at large size.

### 8.4 `/showcase/scene` — Multi-Tree Scene

- [ ] **REQ-S-06** Right column displays one tree of each non-custom shape side by side
      (`oak`, `pine`, `birch`, `fir`, `maple`, `willow`).
- [ ] **REQ-S-07** Controls organized into cards matching single editor categories:
    - **Scene Settings**: seed input + Randomize, `canopyPolygons`, `trunkPolygons`
    - **Canopy**: `blobSizeVariance`, `blobCloseness`, `canopySize`
    - **Trunk & Branches**: `trunkHeight`, `trunkThickness`, `trunkLean`, `trunkSegments`,
      `trunkCrookedness`, `branchThickness`, `branchLength`, `branchLengthVariance`, `trunkBranchRatio`
    - **Canopy Color**: 2 color pickers + "Use per-shape defaults" toggle
    - **Trunk Color**: swatches + HSL sliders + per-shape defaults toggle
    - **Lighting**: `lightAngle`, `depthVariance`
    - **Debug**: Show Canopy, Show Branches, Show Trunk, Show Anchors checkboxes
- [ ] **REQ-S-08** Individual seeds are offset from the base seed: `seed`, `seed + 1000`,
      etc.
- [ ] **REQ-S-09** `branchCount` and `blobCount` are per-shape (not adjustable in scene mode).

### 8.5 Disabled sliders (Plan v4)

- [ ] **REQ-S-12** When a parameter has no effect for the selected shape, its slider is visually
      disabled (grayed out, not interactive). Examples:
    - Pine: `branchCount` disabled (always 0)
    - Fir: `branchCount` disabled (always 0)
    - Pine/Fir: `trunkBranchRatio` disabled
    - `trunkCrookedness` disabled when `trunkSegments = 1`
    - `blobCloseness` disabled for branching shapes (oak, birch, maple, willow, apple, cherry,
      baobab, acacia) — closeness is moot when blob positions are driven by branch-tip clusters

### 8.6 Color picker UI

- [ ] **REQ-S-13** Canopy color pickers use native `<input type="color">` styled to match shadcn
      design. Each picker shows a colored swatch preview + hex value text.
- [ ] **REQ-S-14** Trunk color preset swatches are rendered as small colored buttons in a row.
      Clicking a swatch sets the 3 trunk HSL sliders simultaneously.

### 8.7 Root page

- [ ] **REQ-S-10** The root page (`/`) contains navigation links to `/showcase` and `/showcase/scene`.

---

## 9. Custom Tree (separate task — single editor only)

- [ ] **REQ-CUSTOM-01** A 7th shape option `'custom'` is available only in the single tree editor
      (not in scene mode).
- [ ] **REQ-CUSTOM-02** `blobCount` (1–8) controls how many blobs are visible and editable. Each
      blob gets its own collapsible UI section in a card (shadcn-svelte Accordion with
      `type="multiple"` so multiple blob sub-cards can be expanded simultaneously).
- [ ] **REQ-CUSTOM-03** Each custom blob is represented by a `CustomBlob` record with exactly
      these fields, stored in `TreeConfig.customBlobs?: CustomBlob[]` (populated only when
      `shape === 'custom'`):
    - `boundaryKind`: one of `'circle' | 'egg' | 'teardrop' | 'isoscelesTriangle' | 'equilateralTriangle'`
    - `rotationDeg`: `number` in `[0, 360]`, step 5
    - `sizeScale`: `number` in `[0.5, 2.0]`, step 0.05 (UI shows 50 %–200 %); scales `rx` and `ry` uniformly
    - `position`: `{ x: number; y: number }` with each axis in `[-1, +1]`, step 0.05 — see REQ-CUSTOM-03a
- [ ] **REQ-CUSTOM-03a** Position is **normalized** relative to canopy half-extent. `x = -1` →
      left edge of canopy spread; `x = +1` → right edge; `y = -1` → top; `y = +1` → bottom. At
      render time: `cx = canopyCenterX + position.x · spreadRadius`,
      `cy = canopyCenterY + position.y · spreadRadius`. Resolution-independent — survives
      `canopySize` slider changes without retuning.
- [ ] **REQ-CUSTOM-03b** Per-blob UI in the Custom Blobs card shows exactly 5 controls per blob:
    1. Boundary shape `<Select>` (5 options)
    2. Rotation `<input type="range" min="0" max="360" step="5">`
    3. Size `<input type="range" min="0.5" max="2" step="0.05">`
    4. Position X `<input type="range" min="-1" max="1" step="0.05">`
    5. Position Y `<input type="range" min="-1" max="1" step="0.05">`
- [ ] **REQ-CUSTOM-04** The `customBlobs` array is grown lazily and never truncated. When UI
      `blobCount = M`, only indices `[0, M)` are rendered and editable. When the user increases
      `blobCount` past `customBlobs.length`, append new seeded entries (random position via
      `createPrng(seed)` + `blobCloseness`, `boundaryKind = 'circle'`, `rotationDeg = 0`,
      `sizeScale = 1.0`). When the user decreases `blobCount`, **trailing entries are preserved
      in memory**; growing back reveals the previously tuned values. Never lose user tuning on
      accidental shrink.
- [ ] **REQ-CUSTOM-04a** Custom tree generation is deterministic: seeded random is used **only**
      to initialize newly appended `customBlobs` entries and for non-overridden triangulation
      jitter. Once a blob has user-set field values, those values are authoritative and override
      any seeded random on subsequent generation.
- [ ] **REQ-CUSTOM-05** All other tree parameters (branches, trunk, lighting, colors) apply
      normally. Custom trees use the generic `generateBranches()` — no per-blob branch coupling
      (unlike maple, REQ-C-17b).
- [ ] **REQ-CUSTOM-06** `SHAPE_DEFAULTS` does **not** contain an entry for `'custom'` — the
      custom editor retains whatever the user has configured. When the user switches TO custom,
      current `TreeConfig` values carry through unchanged and `customBlobs` is lazily seeded for
      the current `blobCount`. When switching AWAY from custom, `customBlobs` is preserved but
      unused (forward-preservation across round trips).
- [ ] **REQ-CUSTOM-07** Custom shape is excluded from scene-editor shape lists and
      shape-cycling helpers (per REQ-S-04b and REQ-S-06).

---

## 10. Authentication (separate task)

- [ ] **REQ-AUTH-01** Implement BetterAuth for user authentication.
- [ ] **REQ-AUTH-02** Supported auth methods (v4 — simplified from original plan):
    - Google OAuth
    - GitHub OAuth
    - Passkey (WebAuthn)

    > **Deviation note:** Email + password was explicitly dropped during Plan v4 HITL
    > resolution to avoid standing up transactional email infrastructure (verification + reset
    > flows) for a tree-drawing app. No email verification, no password reset, no email
    > templates, no SMTP/Resend dependency. OAuth + Passkey provide sufficient sign-in coverage.

- [ ] **REQ-AUTH-02a** Sign-in and sign-up collapse to a **single flow** for all enabled
      providers: first successful OAuth/Passkey auth creates the user row; subsequent auths
      sign the user in. No separate "Sign up" route.
- [ ] **REQ-AUTH-03** Auth state is available server-side via hooks and client-side via auth client.
- [ ] **REQ-AUTH-04** User session data is stored in the database (PostgreSQL via Drizzle ORM).
- [ ] **REQ-AUTH-05** The `/auth` route is a single page containing three primary buttons:
    1. "Continue with Google" → `authClient.signIn.social({ provider: 'google' })`
    2. "Continue with GitHub" → `authClient.signIn.social({ provider: 'github' })`
    3. "Continue with Passkey" → `authClient.signIn.passkey()` (falls back to registration
       flow for new users)
- [ ] **REQ-AUTH-06** Sign-out is a server action at `/auth/sign-out` (POST) that calls
      `auth.api.signOut()` and redirects to `/`.
- [ ] **REQ-AUTH-07** Required environment variables: `AUTH_SECRET`, `ORIGIN`,
      `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
      No email provider vars. Document in `.env.example`.
- [ ] **REQ-AUTH-08** Drizzle auth schema lives in `src/lib/server/db/auth.schema.ts` and
      includes the Passkey plugin tables. Schema is generated via
      `pnpm dlx @better-auth/cli generate` and committed alongside a Drizzle migration.

> **Implementation note:** Reference project `C:\_MP_projects\CryptoKamosh` has a BetterAuth
> implementation with the passkey plugin wired up. Use Context7 MCP to fetch latest BetterAuth
> documentation before implementing.

---

## 11. Application Shell — Sidebar Navigation (separate task)

- [ ] **REQ-NAV-01** The application uses the shadcn-svelte **`sidebar-07`** block (icon-collapsible
      sidebar with a footer user section). Install via
      `pnpm dlx shadcn-svelte@latest add sidebar` and integrate into `src/routes/+layout.svelte`,
      wrapping `{@render children()}`.
- [ ] **REQ-NAV-02** Sidebar includes links to all pages:
    - Single Tree Editor (`/showcase`)
    - Scene Editor (`/showcase/scene`)
    - Gallery (`/gallery`)
- [ ] **REQ-NAV-03** Sidebar has a bottom user section:
    - When signed out: "Sign in" button linking to `/auth`
    - When signed in: user avatar, name, sign-out button (posts to `/auth/sign-out`)
- [ ] **REQ-NAV-04** The sidebar renders on **every route**, including `/`, `/auth`, `/showcase`,
      `/showcase/scene`, and `/gallery`. Navigation links are always visible; the Gallery link
      redirects anonymous users to `/auth` server-side. The bottom user section swaps based on
      auth state but no route is hidden behind a layout fork.

> **Implementation note:** Use Context7 MCP to fetch shadcn-svelte `sidebar-07` block
> documentation for the latest block structure before copying.

---

## 12. Tree Saving & Gallery (separate task)

### 12.1 Save mechanism

- [ ] **REQ-SAVE-01** A "Save" button in the single tree editor (placed at the top of the
      controls panel beside the shape picker) saves the current `TreeConfig` to the database.
      The button is **not** present in the scene editor.
- [ ] **REQ-SAVE-02** Saved trees are associated with the authenticated user. Anonymous users
      cannot save — the button is disabled with a "Sign in to save" tooltip when no session
      is present.
- [ ] **REQ-SAVE-03** Each saved tree stores: all `TreeConfig` fields as a JSONB snapshot, an
      auto-generated name, creation timestamp, `updatedAt` timestamp, and the user ID.
      The row is identified by a nanoid primary key.
- [ ] **REQ-SAVE-03a** **Auto-name format**: on save, new trees are named
      **`"{Shape} #{N}"`** where `Shape` is the capitalized tree shape (`"Oak"`, `"Pine"`,
      `"Birch"`, `"Fir"`, `"Maple"`, `"Willow"`, `"Custom"`) and `N` is the next sequential
      integer scoped to that user + that shape. Examples: `"Oak #1"`, `"Pine #1"`, `"Oak #2"`,
      `"Maple #1"`. No name-prompt dialog on save — the user can rename later in the gallery.
- [ ] **REQ-SAVE-04** The `saved_trees` table has the following Drizzle schema:
    ```ts
    export const savedTrees = pgTable('saved_trees', {
    	id: text('id').primaryKey(), // nanoid
    	userId: text('user_id')
    		.notNull()
    		.references(() => user.id, { onDelete: 'cascade' }),
    	name: text('name').notNull(),
    	config: jsonb('config').$type<TreeConfig>().notNull(),
    	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    });
    ```
    Lives in `src/lib/server/db/saved-trees.schema.ts` (separate file from `auth.schema.ts`).
    A Drizzle migration is committed in `src/lib/server/db/migrations/`.
- [ ] **REQ-SAVE-05** **Forward-compatibility**: `TreeConfig` has no `configVersion` field.
      On restore, the stored JSONB is merged with `DEFAULT_TREE_CONFIG`:
      `{ ...DEFAULT_TREE_CONFIG, ...stored.config }`. New fields added to `TreeConfig` in the
      future inherit defaults on old saved rows. Field renames/removals are handled as explicit
      data migrations when they occur — not pre-engineered.

### 12.2 Gallery page

- [ ] **REQ-GALLERY-01** A `/gallery` page displays the authenticated user's saved trees.
      Anonymous access redirects to `/auth`.
- [ ] **REQ-GALLERY-02** Each saved tree is rendered as a preview thumbnail using the
      existing `<LowPolyTree>` component spread with the stored config:
      `<LowPolyTree {...savedTree.config} />`. Thumbnails are sized to a fixed 200×200 aspect
      square with `overflow: hidden`. No reduced polygon count — SVG scales cheaply.
      Display the tree name (inline-editable) and a relative creation date
      (e.g., "2 hours ago" via `Intl.RelativeTimeFormat`).
- [ ] **REQ-GALLERY-03** Clicking a saved tree navigates to **`/showcase?saved=<id>`**. The
      `src/routes/showcase/+page.server.ts` `load()` function reads the `saved` query param,
      fetches the `saved_trees` row by id (404 if not owned by the current user), merges
      `config` with `DEFAULT_TREE_CONFIG`, and passes to the page as `data.initialConfig`.
      The page initializes its reactive form state from `initialConfig`. The URL retains
      `?saved=<id>` until the user modifies a slider.
- [ ] **REQ-GALLERY-04** Users can delete saved trees from the gallery via a small trash icon
      (top-right of the card). Delete triggers a confirmation dialog
      ("Delete {name}? This cannot be undone.") before the server delete action runs.
- [ ] **REQ-GALLERY-05** Gallery is user-specific — users only see their own saved trees.
      The `load()` query scopes by `event.locals.user.id` and the delete/rename actions
      enforce ownership server-side.
- [ ] **REQ-GALLERY-06** Gallery cells are laid out in a CSS grid:
      `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` for a responsive flow.
- [ ] **REQ-GALLERY-07** Inline rename: single-click on the tree name turns it into an
      `<input>`; blur or Enter commits the new name via a rename server action with ownership
      check. Escape cancels.

### 12.3 Server CRUD module

- [ ] **REQ-SAVE-06** All `saved_trees` database access goes through a single module
      `src/lib/server/saved-trees.ts` exporting:
    - `createSavedTree({ userId, shape, config })` — computes auto-name + inserts
    - `listSavedTrees(userId)` — returns rows ordered by `created_at DESC`
    - `getSavedTree(id, userId)` — returns single row scoped to user (404 on mismatch)
    - `deleteSavedTree(id, userId)` — deletes with ownership check
    - `renameSavedTree(id, userId, name)` — updates name with ownership check

---

## 13. Trunk & Branch Engine v2 — Phase 1: Strip Engine + Fork Model

> Origin: Grilling session 2026-04-15 on PR #94 visual issues. Supersedes issue #81
> (branch-trunk shared vertices) and partially #82 (ratio controls). Updates PRD #77 Modules
> 1, 2, 4.

### 13.1 Strip Continuity — Junction-Based Ratios

- [ ] **REQ-EV2-S-01** Strip width ratios are computed at each trunk junction point (not per
      segment). For N trunk segments there are N+1 junction ratio sets. Each segment interpolates
      linearly between its bottom and top junction ratios. This guarantees continuity — adjacent
      segments share the same junction point data.

- [ ] **REQ-EV2-S-02** Strip width at each junction has two independent variation sources that
      accumulate: - **Base randomness** — always present. Even at `trunkTwist=0`, strip widths are non-uniform
      (organic, not mechanical 25/50/25). Seeded per-junction. - **Twist** — cumulative rotational drift from base to tip, plus a per-junction random
      perturbation. `trunkTwist` slider controls magnitude of both drift rate and perturbation.
      At `trunkTwist=0` only base randomness applies. At `trunkTwist=100%` both are at maximum.

- [ ] **REQ-EV2-S-03** The twist model is **hybrid cumulative**: a base angle starts at a seeded
      random value and drifts at each junction by a small twist delta (proportional to
      `trunkTwist`). On top of the cumulative drift, each junction gets an additional random
      perturbation. This produces organic spirals rather than mechanical rotation.

### 13.2 Cross-Section Model

- [ ] **REQ-EV2-X-01** The trunk is modeled as a regular polygon cross-section projected onto the
      screen plane. The number of visible (front-facing) strip faces = `trunkStripCount` (config
      param REQ-P-40, range 2–4, default 3). The total number of cross-section faces =
      `2 × trunkStripCount`.

- [ ] **REQ-EV2-X-02** At maximum twist, strip faces can fully rotate out of view (width → 0) and
      new faces can appear on the opposite side. Buffer strips on each side of the visible range
      are maintained at 0 width by default and grow positive when another strip rotates out. This
      is analogous to a cylinder rotating — faces cycle in and out of the viewer-facing hemisphere.

- [ ] **REQ-EV2-X-03** `trunkTwist` default is **10%** (changed from 0). This gives all trees
      subtle strip variation out of the box. Per-shape SHAPE_DEFAULTS override as appropriate.

### 13.3 Junction Geometry — Angle Bisectors

- [ ] **REQ-EV2-J-01** At each internal trunk junction, the segment boundary is perpendicular to
      the **angle bisector** between the incoming and outgoing segment directions. This tilts the
      boundary at crooked junctions, producing natural-looking bends instead of horizontal cuts. - Base junction (no incoming segment): boundary perpendicular to first segment direction. - Tip junction (no outgoing segment): boundary perpendicular to last segment direction.

- [ ] **REQ-EV2-J-02** All junction points — outer edges AND internal strip split points — are
      **shared** by both adjacent segments. Zero gaps guaranteed by construction. Both the segment
      below and the segment above reference the exact same 4+ Point2D values at each junction.

- [ ] **REQ-EV2-J-03** Trunk width at each junction is measured **perpendicular to the bisector
      direction**, not horizontally. This prevents the trunk from appearing to pinch or bulge at
      bends.

### 13.4 Trunk Taper — Hybrid Model

- [ ] **REQ-EV2-T-01** Trunk taper uses a **hybrid** model with two narrowing forces: - **Gentle base taper** — slow natural conical narrowing along the full trunk length,
      present even on branchless trunks. Much less aggressive than the old linear taper. - **Fork taper** — discrete width reduction at each branch junction, proportional to
      branch depth (see REQ-EV2-F-04).
      Both compound. A branchless trunk narrows gently; a heavily-branched trunk narrows faster.

- [ ] **REQ-EV2-T-02** The existing `trunkTopWidth` in shape definitions becomes the **minimum
      floor**. The trunk can never narrow below this value regardless of how many forks occur.
      The actual top width = result of base taper + accumulated fork reductions, clamped to floor.

- [ ] **REQ-EV2-T-03** The `trunkThickness` slider continues to scale the base width. It does NOT
      scale the fork reductions — only the starting width.

### 13.5 Two-Zone Trunk Segments

- [ ] **REQ-EV2-TZ-01** The trunk is divided into two zones: - **Upper zone (branch zone)** — contains junctions where L1 branches can spawn. Segment
      count = `max(branchesLevel1Range[1], 2)` (enough junctions for max L1 branch count,
      minimum 2). - **Lower zone (bare trunk)** — below the branch zone. Gets the remaining segments. Minimum
      1 segment. Still has twist variation and crookedness.
      The boundary between zones IS the branch zone boundary — branches can ONLY spawn at
      upper-zone junctions.

- [ ] **REQ-EV2-TZ-02** `trunkSegments` slider minimum is enforced:
      `trunkSegments >= upperZoneSegments + 1`. The user can add more segments for visual detail
      (more crookedness inflection points, more twist variation) but cannot go below the minimum.

- [ ] **REQ-EV2-TZ-03** Updated SHAPE_DEFAULTS for `trunkSegments`:

                                                                                                                                                                                                    | Shape   | Current | Max L1 | New Default | Zone Split (lower + upper) |
                                                                                                                                                                                                    |---------|---------|--------|-------------|---------------------------|
                                                                                                                                                                                                    | oak     | 5       | 3      | 5           | 1 + 4                     |
                                                                                                                                                                                                    | maple   | 3       | 5      | 7           | 2 + 5                     |
                                                                                                                                                                                                    | willow  | 5       | 5      | 7           | 2 + 5                     |
                                                                                                                                                                                                    | cherry  | 3       | 4      | 6           | 1 + 5                     |
                                                                                                                                                                                                    | birch   | 3       | 2      | 4           | 1 + 3                     |
                                                                                                                                                                                                    | apple   | 3       | 2      | 3           | 1 + 2                     |
                                                                                                                                                                                                    | baobab  | 3       | 3      | 5           | 1 + 4                     |
                                                                                                                                                                                                    | acacia  | 3       | 3      | 5           | 1 + 4                     |
                                                                                                                                                                                                    | pine    | 3       | 0      | 3           | unchanged (no branches)    |
                                                                                                                                                                                                    | fir     | 3       | 0      | 3           | unchanged (no branches)    |
                                                                                                                                                                                                    | cypress | 3       | 0      | 3           | unchanged (no branches)    |
                                                                                                                                                                                                    | bush    | 3       | 0      | 3           | unchanged (no branches)    |

### 13.6 Bottom-Up Sequential Generation

- [ ] **REQ-EV2-G-01** The tree is built from base to tip in a **single bottom-up pass**: 1. Compute junction positions from crookedness + lean settings. 2. Starting from the base junction, process each junction upward. 3. At each upper-zone junction, determine if a branch spawns (pre-determined by seed). 4. If a branch spawns: compute fork width reduction, compute centerline displacement
      (trunk leans away from branch), update remaining trunk width. 5. Continue to next junction with updated width and position.
      This eliminates the circular dependency between trunk path and branch positions.

- [ ] **REQ-EV2-G-02** **Trunk reaction to branching:** at each fork, the trunk centerline above
      the fork displaces slightly **opposite** to the branch direction. Displacement is 2–5 px,
      proportional to the branch width fraction. No new slider — this is automatic physics.
      Alternating left-right branches (Rule I) naturally produce balanced trunks.

- [ ] **REQ-EV2-G-03** Branches can **only** spawn at trunk junctions in the upper zone. They
      cannot spawn at arbitrary positions along a segment. The number of potential L1 branch
      positions = number of upper-zone junctions. This simplifies fork geometry — the fork point
      IS a junction with fully computed shared vertices.

### 13.7 Branch Fork Model — Shared-Vertex Fork (C2)

> **Supersedes the earlier peel-off + collar model (Q14/Q29 from the 2026-04-15 grilling).**
> Shipped collar (`generate.ts:621-642`, colored with `stripColors[0]`) produced a visible dark
> square at every fork because the peeled strip is the darkest face on the shadow side. Peel-off
> (C1) was also considered but rejected: incompatible with `trunkStripCount=2` and with shapes
> that spawn ≥4 one-side branches (oak, maple, willow), and ambiguous under twist where strip
> order rotates. The chosen model is the **Fork / River Split (C2)**.

- [ ] **REQ-EV2-F-01** When a branch spawns, it emerges from the trunk via a **shared-vertex
      fork**. The branch's base quad outer corners coincide exactly with the trunk edge vertices
      at the fork height. Trunk strip count is preserved above the junction (no strip peels off).
      The branch generates its own independent `trunkStripCount`-face strip system starting from
      the attachment.

- [ ] **REQ-EV2-F-02** **No junction collar by default.** The shared-vertex construction closes
      the junction without a transitional polygon. `junctionFills` remains part of the
      `BranchGeometry` type but is emitted empty for ordinary forks. The previous "dark peeled
      strip color" rule is removed. If, in a follow-up, a visible V-wedge appears at wide-angle
      forks, a single interpolated fill triangle MAY be inserted with color
      `lerp(trunkStripColorAtForkHeight, branchStripColorAtBase, 0.5)` — **never** a single
      strip's color. Ship without the fill first and only reintroduce it if the wedge is visible.

- [ ] **REQ-EV2-F-03** **Same-junction forks:** when two branches share a junction (e.g.,
      alternating left+right from Rule I), they fork **sequentially** with a slight vertical
      stagger (few pixels offset). Each shared-vertex fork uses the trunk edge vertices at its
      own staggered height; the trunk-width reduction from the first fork is applied before the
      second fork reads the trunk edge.

- [ ] **REQ-EV2-F-04** **Fork width economics — depth-dependent fraction:** - L1 branches take ~15–20% of trunk width at the fork point. - L2 branches take ~10–15% of their parent L1 branch width at the fork point. - Width calculation is **sequential**: branch N's width is derived from trunk width at its
      attachment height, which already accounts for base taper + all forks below it. - Each branch gets randomness around the center fraction: `branchWidthVariance` (REQ-P-42)
      controls the spread. Individual branch width =
      `parentWidthAtForkPoint × (depthFraction ± branchWidthVariance × random)`.

- [ ] **REQ-EV2-F-05** **Trunk tip behavior** is shape-dependent: - Shapes where trunk continues into canopy (oak, birch, maple, cherry, willow): trunk
      continues above the last fork at its remaining width. - Shapes where trunk terminates at a fork (baobab, acacia): trunk ends at uppermost fork. - Determined by existing `defaultTrunkTop` in shape definitions — shapes with trunkTop
      well inside canopy continue; shapes near canopy bottom terminate at fork zone.

### 13.8 Branch Strip System

- [ ] **REQ-EV2-B-01** **L1 and L2 branches** use the full shared-vertex fork model (REQ-EV2-F-01):
      trunk/parent strip count preserved across the fork, branch starts an independent strip
      system at the attachment, width reduction applied at sub-branch forks. They have their own
      junction-based strip continuity (same as trunk segments).

- [ ] **REQ-EV2-B-02** **L3 branches** use a simplified model: plain quads attached at the parent
      branch's silhouette edge. No strip system, no fork geometry. L3 branches are too small for
      strip detail to be perceptible.

- [ ] **REQ-EV2-B-03** Branches inherit `trunkStripCount` from the trunk (same number of visible
      faces). Twist is **attenuated per depth**: L1 gets full `trunkTwist`, L2 gets ~50% of
      `trunkTwist`, L3 has no twist.

- [ ] **REQ-EV2-B-04** `branchSegments` is **auto-reduced per depth**: L1 gets the slider value,
      L2 gets `max(branchSegments - 1, 1)`, L3 always gets 1. Branch segment count minimum is
      enforced by sub-branch count (same logic as trunk: need enough junctions for children).

### 13.9 Branch Angle & Width Variability

- [ ] **REQ-EV2-V-01** `branchAngle` slider controls the **center angle**. Each individual branch
      gets **±15° random variation** around the center. This produces organic variety without a
      new slider. Shape-specific defaults via SHAPE_DEFAULTS inheritance (e.g., willow=30% →
      branches range ~15°–45° from horizontal).

- [ ] **REQ-EV2-V-02** Depth-based tapering uses hardcoded multipliers (L1=1.0x, L2=0.85x,
      L3=0.35x). `branchWidthVariance` (REQ-P-42) controls spread. Individual branch widths
      are never identical — each gets seeded randomness. No two L1 branches on the same tree
      have the same width.

- [ ] **REQ-EV2-V-03** Branch width variance should produce visible but not extreme differences.
      A branch at the center ratio ±50% (at max variance) should still look like a natural branch,
      not a twig next to a log. The randomness is symmetric around the center ratio.

### 13.10 Rule L — Trunk Tip Connection (from #81)

- [ ] **REQ-EV2-L-01** **Rule L enforced:** trunk tip must always connect to a branch or canopy
      blob. For branchDepth=0 shapes (bush, cypress, pine, fir), trunk tip connects to the
      lowest/nearest canopy blob or tier.

- [ ] **REQ-EV2-L-02** Rule L is implemented as a post-generation validation step in
      `generateTree()`. If the trunk tip is exposed (no branch and not inside canopy), an
      emergency branch or connection is generated. Complements existing Rule G (floating blob
      fallback).

### 13.11 Disabled Params Updates

- [ ] **REQ-EV2-D-01** `trunkStripCount`: disabled for bush (bush disables all trunk controls).
- [ ] **REQ-EV2-D-02** `branchWidthVariance`: disabled when `branchDepth === 0`. Added to
      disabled lists for pine, fir, cypress, bush.
- [ ] **REQ-EV2-D-03** `trunkPolygons`: removed entirely from config, UI, and disabled params.

### 13.12 Lighting — Tri-Split Face Colors

- [ ] **REQ-EV2-LT-01** Each trunk/branch segment's strip faces get independent colors computed
      via dot-product lighting. Face normals are derived from the polygonal cross-section model
      (hexagonal for 3-strip, octagonal for 4-strip, etc.). - Left/right normals: segment perpendicular at 60° from forward (for 3-strip hex model).
      Adjusted for other strip counts. - Center normal: front-facing with seeded random ±0.15 xy-perturbation for organic variety. - Lightness offset formula: `−10 + ((dot + 1) / 2) × 22` maps dot product to [−10, +12].

- [ ] **REQ-EV2-LT-02** Lighting is consistent across connected segments. Because strip ratios
      are junction-based and continuous, the color computation for adjacent segments at a shared
      junction produces consistent results. No visible color "seams" at segment boundaries.

- [ ] **REQ-EV2-LT-03** Branch lighting uses the same face-normal model as the trunk. The branch's
      segment direction determines the face normals. At a fork the shared-vertex construction
      joins trunk and branch without a tinted transition polygon; any optional fill added later
      (REQ-EV2-F-02) must be colored by interpolation between trunk and branch strip colors,
      never by a single strip's color.

### 13.13 Cross-Phase Contract (Phase 1 → Phase 2)

Phase 1 must deliver these interfaces for Phase 2 to consume:

- [ ] **REQ-EV2-C-01** Junction point data: Phase 1 must expose junction positions, widths, and
      strip ratios at each junction via `TreeGeometry` or an intermediate data structure.
- [ ] **REQ-EV2-C-02** Branch tip positions: Phase 1's fork model must output branch tip
      coordinates and depths for Phase 2's clustering algorithm.
- [ ] **REQ-EV2-C-03** Z-order infrastructure: Phase 1 should prepare a `zOrder` field on geometry
      elements (defaulting to simple painter's order). Phase 2 fills in the actual values.
- [ ] **REQ-EV2-C-04** Canopy envelope interface: Phase 1 shape definitions should begin exporting
      envelope bounds (even if Phase 1 doesn't use them).
- [ ] **REQ-EV2-C-05** Phase 1 must NOT remove blob generator functions — Phase 2 references
      their spatial patterns for canopy envelope derivation.
- [ ] **REQ-EV2-C-06** Phase 1 must NOT hardcode assumptions about blob placement being
      independent of branches.

---

## 14. Trunk & Branch Engine v2 — Phase 2: Canopy-Branch Coupling + Z-Ordering

> Depends on Phase 1 (§13) completing first. Builds on the fork model and junction data
> structures established in Phase 1.

### 14.1 Z-Ordering — Front/Back Branch Placement

- [x] **REQ-EV2-Z-01** Branches are classified as **front** (in front of trunk) or **back**
      (behind trunk) using light-angle-biased randomness: - Branches on the **lit side** (facing `lightAngle`): 70% chance of front placement. - Branches on the **shadow side**: 30% chance of front placement. - Classification is seeded for determinism.

- [x] **REQ-EV2-Z-02** Back branches render **before** trunk quads in SVG order and receive a
      **−3 lightness offset** (subtle darkness for depth cue). Front branches render after trunk
      (current behavior, no offset).

- [x] **REQ-EV2-Z-03** L2 branches inherit their parent L1's front/back status by default, with
      a small seeded chance (~20%) of flipping. The L2→L1 depth relationship mirrors the L1→trunk
      relationship — consistent hierarchy.

- [x] **REQ-EV2-Z-04** Five z-order render layers for branching shapes (painter's order): 1. Back branches (behind trunk) 2. Trunk quads 3. Front branches (in front of trunk) 4. Back canopy blobs (connected to back branches) 5. Front canopy blobs (connected to front/trunk branches)
      Branchless shapes retain the original 3-layer model (REQ-R-02).

- [x] **REQ-EV2-Z-05** Each container geometry element (`Quad`, `BranchGeometry`,
      `BlobGeometry`) gains a `zOrder` field. The renderer sorts by z-order layer. This replaces
      the fixed array-based render order. **`Triangle` is explicitly waived** — triangles always
      inherit ordering from their parent `BlobGeometry` (whose `zOrder` governs the whole blob),
      or render in fixed pipeline slots (trunk/fruit/flower/stake). Per-triangle z-order has no
      consumer in the renderer and would add dead state on every triangle.

### 14.2 Revised Generation Pipeline

- [x] **REQ-EV2-P-01** For branching shapes, the generation pipeline is: 1. Build trunk path with two-zone segments (bottom-up, with fork reactions — from Phase 1) 2. Fork L1 branches from trunk at upper-zone junctions (Phase 1) 3. Fork L2 branches from L1 branches using same model (Phase 1) 4. Generate L3 branches (simplified, Phase 1) 5. **Cluster branch tips into blob groups** (new in Phase 2) 6. **Generate canopy blobs around cluster centroids** (new in Phase 2) 7. **Assign z-order to all geometry elements** (new in Phase 2)

- [x] **REQ-EV2-P-02** Branchless shapes (pine, fir, cypress, bush) keep their **current
      generation system entirely**. Tier-based canopy for pine/fir, blob generators for
      bush/cypress. No changes to branchless shape rendering.

### 14.3 Branch-Driven Canopy Blob Placement

- [x] **REQ-EV2-BC-01** Given N branch tips (L1 + L2 + optional trunk tip), cluster them into M
      groups where M = `blobCount` slider value. Use a clustering algorithm (e.g., k-means or
      similar seeded algorithm). Each blob is centered on its cluster's centroid. - Tips close together share a blob (wide canopy supported by multiple branches). - Tips far apart get individual blobs. - `blobCount` slider meaning shifts from "number of ellipses" to "number of canopy
      clusters" — more intuitive.

- [x] **REQ-EV2-BC-02** The trunk tip is included as a cluster point. For shapes like oak, the
      trunk tip has **higher weight** in the clustering (attracts a blob to itself = central
      crown). For shapes like maple, the trunk tip has low/zero weight (no central blob — maple's
      trunk tip is a fork point, not a canopy anchor).

- [x] **REQ-EV2-BC-03** **Key visual requirement:** branches must go into the **middle** of their
      blob. This is more important than strict geometric positioning rules. If a branch tip lands
      at the edge of a blob, the blob should shift to center on the tip, not the other way around.

- [x] **REQ-EV2-BC-04** Weaker branches (higher depth levels) get **smaller blobs**. An L3 branch
      tip should never anchor the biggest blob. Blob size correlates with the branch
      level/thickness of its strongest contributing branch tip.

### 14.4 Blob Sizing

- [x] **REQ-EV2-BS-01** Blob base radius is determined by two factors combined: - **Cluster size** — more branch tips in a cluster → larger blob radius. - **Branch thickness** — thicker branches (L1) produce larger blobs than thinner (L2, L3).
      `blobSizeVariance` adds seeded randomness on top.

- [x] **REQ-EV2-BS-02** `canopySize` slider scales the **canopy envelope** smartly: - Does NOT simply multiply all radii — adapts cluster boundaries so branches remain visible. - Small `canopySize` → tight envelope, fewer tips covered, more bare branches visible
      (good for sapling/young tree stages). - Large `canopySize` → wider envelope, more tips covered, lush canopy. - Branches should remain visible at all canopy sizes — the envelope grows to cover tips
      further out, it doesn't inflate blobs to hide nearby branches.

### 14.5 Canopy Envelope

- [x] **REQ-EV2-CE-01** Each shape defines a **canopy envelope** — a bounding region where blobs
      should exist. Derived from the spatial patterns of current blob generators (making implicit
      knowledge explicit).

- [x] **REQ-EV2-CE-02** `canopySize` scales the envelope from its center (grows outward/upward,
      not downward into the trunk).

- [x] **REQ-EV2-CE-03** ~~**Viewport clamp**~~ Removed (issue #106). The canopy envelope grows
      freely with `canopySize`. SVG overflow clipping (REQ-R-01) handles viewport bounds.
      `canopySize` slider capped at 200% to limit overflow.

- [x] **REQ-EV2-CE-04** Branch tips **outside** the envelope: their blob is pulled back to the
      envelope edge (smaller blob at boundary). Tips very far outside get no blob — just bare
      branch poking out (looks realistic for some shapes). Tips near the envelope center get
      larger blobs.

- [x] **REQ-EV2-CE-05** The envelope serves as the "recommended space" for blobs. It adapts to
      `canopySize` and viewport, providing a smart boundary that prevents both overflow and
      branch-hiding. This works well with stages like sapling (small canopySize = few small blobs)
      and mature (large canopySize = full coverage).

### 14.6 Shape Style Parameters

- [x] **REQ-EV2-SS-01** Each shape definition retains **style parameters** that control how
      branch-tip-derived blobs look. These replace the absolute blob placement of current
      generators while preserving each shape's visual identity: - `blobRxRyRatio`: controls blob shape (1.0 = round, 3.0+ = flat like acacia parasol). - `blobVerticalOffset`: shifts blobs relative to tip position (positive = droop downward, since SVG Y increases downward — used by willow). - `blobBoundary`: circle or teardrop (for cypress-style). - `blobClusterBehavior`: how aggressively nearby tips merge into shared blobs.

- [x] **REQ-EV2-SS-02** Shape-specific identity preserved via style parameters:

                                                                                                                                                                                                    | Shape   | Key Characteristics                                                 |
                                                                                                                                                                                                    |---------|---------------------------------------------------------------------|
                                                                                                                                                                                                    | oak     | Round crown. Trunk tip high weight → central blob. Balanced rx/ry.  |
                                                                                                                                                                                                    | maple   | Blobs on side branches. Trunk tip = fork, no blob. Medium blobs.    |
                                                                                                                                                                                                    | willow  | Blobs offset downward (droop). Branches at low angle. Low canopy.   |
                                                                                                                                                                                                    | birch   | Alternating-side blobs. Airy canopy. Thin trunk.                    |
                                                                                                                                                                                                    | cherry  | Horizontal spread. Blobs in wide band. Pink coloring.               |
                                                                                                                                                                                                    | baobab  | Small blobs at very top. Dominant trunk. Short branches.             |
                                                                                                                                                                                                    | acacia  | Flat parasol. Very wide rx, tiny ry. Branches horizontal.           |
                                                                                                                                                                                                    | apple   | Compact round canopy. Minimal branching. Large single blob.         |

- [x] **REQ-EV2-SS-03** Some branch tips will naturally not have blobs — those that fall outside
      the canopy envelope. This is acceptable and realistic (bare branch poking out of canopy).

### 14.7 Canopy Z-Ordering

- [x] **REQ-EV2-CZ-01** Each canopy blob inherits z-order from its cluster's branches: - Single-branch cluster: blob gets that branch's front/back status. - Multi-branch cluster with mixed front/back: blob defaults to front. - Trunk-tip blob (e.g., oak center): always front.

- [x] **REQ-EV2-CZ-02** Back canopy blobs render in layer 4, front canopy blobs in layer 5
      (per REQ-EV2-Z-04). This creates visible depth — some canopy clusters appear behind the
      trunk while others are in front.

### 14.8 Impact on Existing Issues

- [ ] **REQ-EV2-I-01** Issue #81 (Branch-trunk shared vertices + Rule L): **CLOSED — superseded.**
      Shared vertices are handled by the shared-vertex fork model (REQ-EV2-F-01). Rule L is
      REQ-EV2-L-01. Junction fills are empty by default (REQ-EV2-F-02); an optional interpolated
      fill may be reintroduced if a wedge becomes visible.

- [ ] **REQ-EV2-I-02** Issue #82 (Ratio-based branch controls + remove trunkPolygons):
      **CLOSED — merged.** `trunkPolygons` removal in REQ-P-04-REMOVED. Branch thickness is now
      fork-derived (REQ-EV2-F-04) rather than ratio-based. `branchLengthRatio` concept survives
      (branch length as % of trunk length). `branchThicknessRatio` replaced by fork width
      economics.

- [ ] **REQ-EV2-I-03** PRD #77: Modules 1 (Tri-Split), 2 (Junction), 4 (Ratio Controls) require
      major revision per this document. Module 1 → strip continuity + cross-section model.
      Module 2 → fork model. Module 4 → fork-driven width + length ratio.
