# Low-Poly 2D Tree Generator — Requirements

Extracted from grilling sessions (PLAN.md–PLAN3.md + Plan v4 grilling). Plan v4 supersedes
all previous plans where they conflict. Intended as a stable basis for PRD and test authoring.

---

## 1. Rendering

### 1.1 SVG output

- [ ] **REQ-R-01** Each tree is rendered as a single `<svg>` element with a fixed viewBox of `200×300`.
      SVG overflow is hidden — content beyond the viewBox is clipped.
- [ ] **REQ-R-02** The SVG contains exactly three top-level `<g>` layers rendered in painter's
      order (back-to-front): `trunk`, `branches`, `canopy`.
- [ ] **REQ-R-03** The `canopy` group contains one `<g>` child per blob/tier, ordered back-to-front
      by depth index (blobs rendered later appear in front).
- [ ] **REQ-R-04** Each triangle in the output has a `color` expressed as a hex string (`#rrggbb`),
      a `group` tag (`'canopy' | 'trunk' | 'branch'`), and exactly three `Point2D` vertices.

### 1.2 Generation must be deterministic

- [ ] **REQ-R-05** Given the same `seed` and the same `TreeConfig`, the generator must always
      produce the exact same `TreeGeometry` output (no `Math.random()`).

---

## 2. Configuration Parameters (`TreeConfig`)

All parameters are read-only. Defaults apply when a value is omitted.

### 2.1 Core parameters

| ID       | Parameter          | Type                                                         | Default   | Range       | Step | UI display         |
| -------- | ------------------ | ------------------------------------------------------------ | --------- | ----------- | ---- | ------------------ |
| REQ-P-01 | `shape`            | `'oak'\|'pine'\|'birch'\|'fir'\|'maple'\|'willow'\|'custom'` | `'oak'`   | 7 options   | —    | Select dropdown    |
| REQ-P-02 | `seed`             | `number`                                                     | `42`      | 0 – 999 999 | 1    | Number + Randomize |
| REQ-P-03 | `canopyPolygons`   | `number`                                                     | `50`      | 10 – 150    | 1    | "50"               |
| REQ-P-04 | `trunkPolygons`    | `number`                                                     | `30`      | 10 – 100    | 1    | "30"               |
| REQ-P-12 | `lightAngle`       | `number`                                                     | `130`     | 0 – 360     | 1    | "130°"             |
| REQ-P-13 | `blobCount`        | `number`                                                     | per-shape | 1 – 8       | 1    | "5"                |
| REQ-P-14 | `branchCount`      | `number`                                                     | per-shape | 0 – 20      | 1    | "2"                |
| REQ-P-15 | `depthVariance`    | `number`                                                     | `1.0`     | 0.0 – 2.0   | 0.1  | "1.0"              |
| REQ-P-16 | `blobSizeVariance` | `number`                                                     | `3.0`     | 1.0 – 10.0  | 0.1  | "3.0x"             |
| REQ-P-17 | `blobCloseness`    | `number`                                                     | `50`      | 20 – 80     | 1    | "50 %"             |
| REQ-P-18 | `trunkThickness`   | `number`                                                     | `100`     | 25 – 400    | 5    | "100 %"            |
| REQ-P-19 | `branchThickness`  | `number`                                                     | `100`     | 25 – 400    | 5    | "100 %"            |
| REQ-P-20 | `canopySize`       | `number`                                                     | `100`     | 25 – 400    | 5    | "100 %"            |
| REQ-P-21 | `trunkHeight`      | `number`                                                     | `100`     | 30 – 150    | 5    | "100 %"            |
| REQ-P-22 | `trunkBranchRatio` | `number`                                                     | `70`      | 40 – 80     | 5    | "70 %"             |

### 2.2 New parameters (Plan v4)

| ID       | Parameter              | Type     | Default   | Range    | Step | UI display |
| -------- | ---------------------- | -------- | --------- | -------- | ---- | ---------- |
| REQ-P-23 | `branchLength`         | `number` | `100`     | 25 – 400 | 5    | "100 %"    |
| REQ-P-24 | `branchLengthVariance` | `number` | `50`      | 0 – 100  | 5    | "50 %"     |
| REQ-P-25 | `trunkLean`            | `number` | `0`       | -45 – 45 | 1    | "0°"       |
| REQ-P-26 | `trunkSegments`        | `number` | per-shape | 1 – 5    | 1    | "1"        |
| REQ-P-27 | `trunkCrookedness`     | `number` | per-shape | 0 – 100  | 5    | "0 %"      |

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
      `teardrop` (fir top blob), or `egg` (available for custom tree).
- [ ] **REQ-C-15a** **Teardrop shape**: an ellipse where the top half is compressed to a point via
      a parametric power curve. Pointy at the top, smoothly rounded at the bottom.
- [ ] **REQ-C-15b** **Egg shape**: slightly narrower top half, wider bottom half, no sharp point.
      Implemented as a parametric curve with different top/bottom exponents.
- [ ] **REQ-C-15c** Both teardrop and egg boundaries support an arbitrary rotation angle (0–360°).
      Triangulation uses the custom boundary for point-in-shape tests and boundary sampling.

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
- [ ] **REQ-C-16a** The top teardrop blob is larger than the bottom blobs. Bottom blobs are wider
      and spread more horizontally, offset from center axis.

### 3.6 Maple tree canopy (new — Plan v4)

- [ ] **REQ-C-17** For `shape = 'maple'`, canopy has `blobCount` blobs (default 5) spread in a
      half-circle from left to right at the top. Each blob gets its own branch from the trunk.
      `blobCloseness` is low (default 30) so blobs are visually separated with room for branches.
- [ ] **REQ-C-17a** Blobs are distributed radially in a 180° arc above the trunk, evenly spaced.

### 3.7 Oak blob spread improvement (Plan v4)

- [ ] **REQ-C-18** For `shape = 'oak'`, secondary blobs (indices 1+) are distributed radially
      (360° around main blob), not just left/right of center axis. Non-primary blobs maintain a
      minimum distance from the center axis to reduce excessive overlap.

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

## 4. Trunk & Branch Generation

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
- [ ] **REQ-CUSTOM-02** `blobCount` (1–8) controls how many blobs exist. Each blob gets its own
      collapsible UI section in a card.
- [ ] **REQ-CUSTOM-03** Per-blob controls:
    - **Boundary shape**: select from `circle`, `egg`, `teardrop`, `isoceles triangle`,
      `equilateral triangle`
    - **Rotation**: slider 0–360° (step 5)
    - **Relative size**: slider 50–200 % (step 5) — scales rx and ry
    - **Position**: x and y sliders relative to canopy center
- [ ] **REQ-CUSTOM-04** Blob positions are initially seeded random (with closeness). The user can
      then override positions per-blob via sliders.
- [ ] **REQ-CUSTOM-05** All other tree parameters (branches, trunk, lighting, colors) apply normally.

---

## 10. Authentication (separate task)

- [ ] **REQ-AUTH-01** Implement BetterAuth for user authentication.
- [ ] **REQ-AUTH-02** Supported auth methods:
    - Google OAuth
    - GitHub OAuth
    - Passkey (WebAuthn)
    - Email + password
- [ ] **REQ-AUTH-03** Auth state is available server-side via hooks and client-side via auth client.
- [ ] **REQ-AUTH-04** User session data is stored in the database (PostgreSQL via Drizzle ORM).

> **Implementation note:** Reference project `C:\_MP_projects\CryptoKamosh` has a BetterAuth
> implementation to take inspiration from. Use Context7 MCP to fetch latest BetterAuth
> documentation before implementing.

---

## 11. Application Shell — Sidebar Navigation (separate task)

- [ ] **REQ-NAV-01** The application has a sidebar navigation component (pick from shadcn-svelte
      blocks). It replaces the current inline header navigation.
- [ ] **REQ-NAV-02** Sidebar includes links to all pages:
    - Single Tree Editor (`/showcase`)
    - Scene Editor (`/showcase/scene`)
    - Gallery (`/gallery`)
- [ ] **REQ-NAV-03** Sidebar has a bottom user section:
    - When signed out: sign-in button
    - When signed in: user avatar, name, sign-out button

> **Implementation note:** Use Context7 MCP to fetch shadcn-svelte sidebar block documentation
> for the latest patterns and components.

---

## 12. Tree Saving & Gallery (separate task)

### 12.1 Save mechanism

- [ ] **REQ-SAVE-01** A "Save" button in the single tree editor saves the current `TreeConfig`
      (all parameters) to the database.
- [ ] **REQ-SAVE-02** Saved trees are associated with the authenticated user. Anonymous users
      cannot save.
- [ ] **REQ-SAVE-03** Each saved tree stores: all `TreeConfig` fields, a user-provided name
      (optional, defaults to "Tree #N"), creation timestamp, and the user ID.

### 12.2 Gallery page

- [ ] **REQ-GALLERY-01** A `/gallery` page displays the authenticated user's saved trees.
- [ ] **REQ-GALLERY-02** Each saved tree is rendered as a preview thumbnail (the SVG at small size)
      with the tree name and creation date.
- [ ] **REQ-GALLERY-03** Clicking a saved tree opens it in the single tree editor with all
      parameters restored.
- [ ] **REQ-GALLERY-04** Users can delete saved trees from the gallery.
- [ ] **REQ-GALLERY-05** Gallery is user-specific — users only see their own saved trees.
