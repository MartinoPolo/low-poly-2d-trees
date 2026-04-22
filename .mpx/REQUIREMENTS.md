# Requirements

Canonical source of truth for what the system should do.
GitHub issues track execution; this file tracks the specification.

---

## 1. Architecture & Tech Stack

- SvelteKit + Svelte 5 runes, TypeScript strict, Tailwind CSS, shadcn-svelte
- SVG-only rendering with CSS animations (GPU accelerated via `will-change: transform`)
- Seeded PRNG for deterministic generation — same seed = same tree
- Drizzle ORM (PostgreSQL, strict mode)
- better-auth with passkey, Google/GitHub OAuth
- Pure visualization library — no external concept dependencies (git, issue states, etc.)

---

## 2. Rendering & SVG Output

### 2.1 SVG Structure

- **REQ-R-01** Render each tree as a single `<svg>` element with a fixed viewBox of `500×500`.
  SVG overflow is hidden — content beyond the viewBox is clipped.
  Geometry constants are scaled to 300-equivalent so visual size is unchanged; the larger
  viewBox provides headroom for overlays. `TREE_SCALE = 0.6` is applied via helper functions
  `treeY()`, `treeSizeW()`, `treeSizeH()` in `blob_generators.ts`. Hard-coded pixel constants
  (trunk widths, branch widths, stage offsets) use pre-500 values — helpers apply the scaling.
  `GROUND_LINE_Y = VIEWBOX_HEIGHT * 0.95 = 475`.
- **REQ-R-02** The SVG contains five z-order render layers for branching shapes (painter's order):
  back branches, trunk quads, front branches, back canopy blobs, front canopy blobs.
  Branchless shapes retain the original 3-layer model: `trunk`, `branches`, `canopy`.
  (See REQ-EV2-Z-04 for full z-ordering specification.)
- **REQ-R-03** The `canopy` group contains one `<g>` child per blob/tier, ordered back-to-front
  by depth index (blobs rendered later appear in front).
- **REQ-R-04** Each polygon in the output has a `color` expressed as a hex string (`#rrggbb`),
  a `group` tag (`'canopy' | 'trunk' | 'branch'`), and either three (`Triangle`) or four
  (`Quad`) `Point2D` vertices. Trunk/branch segments produce quads.

### 2.2 TreeGeometry Output

- **REQ-O-01** `TreeGeometry` has the shape:
    ```ts
    { triangles: Triangle[]; anchors: TreeAnchors; viewBox: { width: 500; height: 500 } }
    ```
- **REQ-O-02** `TreeAnchors` exposes four points:
    - `trunkTop` — where trunk meets canopy (top of trunk geometry).
    - `trunkMiddle` — vertically centred between `trunkTop` and `trunkBottom`.
    - `trunkBottom` — base of trunk geometry.
    - `canopyCenter` — centroid of the canopy bounding box.

### 2.3 Anchors

| Anchor         | Computation                             | Purpose                       |
| -------------- | --------------------------------------- | ----------------------------- |
| `crownCenter`  | center of canopy bounding box           | overlays, decorations         |
| `crownTop`     | min(y) across all canopy                | floating elements above tree  |
| `trunkMiddle`  | midpoint along trunk path               | ladder, woodpecker snap       |
| `trunkBase`    | trunk-ground junction                   | shovel, watering can snap     |
| `roots`        | trunkBase.y + offset                    | root connection endpoints     |
| `branchTips[]` | endpoint of each branch                 | wind particles, leaf-shedding |
| `fruitSlots[]` | 5-7 Poisson-sampled positions in canopy | fruit/flower placement        |

- Anchors are dynamically computed from generated geometry and update reactively when config changes
- `fruitSlots[]` is deterministic per seed; `branchTips[]` length matches actual branch count
- `crownPerimeter[]` — sample points along outer boundary of merged canopy silhouette, for leaf
  placement and particle origins.

### 2.4 Deterministic Generation

- **REQ-R-05** Given the same `seed` and the same `TreeConfig`, the generator always
  produces the exact same `TreeGeometry` output. Use seeded PRNG exclusively.

---

## 3. Configuration Parameters (`TreeConfig`)

All parameters are read-only. Defaults apply when a value is omitted.

### 3.1 Core Parameters

| ID       | Parameter          | Type                                                         | Default   | Range       | Step | UI display         |
| -------- | ------------------ | ------------------------------------------------------------ | --------- | ----------- | ---- | ------------------ |
| REQ-P-01 | `shape`            | `'oak'\|'pine'\|'birch'\|'fir'\|'maple'\|'willow'\|'custom'` | `'oak'`   | 7 options   | —    | Select dropdown    |
| REQ-P-02 | `seed`             | `number`                                                     | `42`      | 0 – 999 999 | 1    | Number + Randomize |
| REQ-P-03 | `polygonsPerBlob`  | `number`                                                     | per-shape | —           | —    | —                  |
| REQ-P-12 | `lightAngle`       | `number`                                                     | `130`     | 0 – 360     | 1    | "130°"             |
| REQ-P-13 | `blobCount`        | `number`                                                     | per-shape | 1 – 25      | 1    | "5"                |
| REQ-P-14 | `branchCount`      | `number`                                                     | per-shape | 0 – 20      | 1    | "2"                |
| REQ-P-15 | `depthVariance`    | `number`                                                     | `1.0`     | 0.0 – 2.0   | 0.1  | "1.0"              |
| REQ-P-16 | `blobSizeVariance` | `number`                                                     | `3.0`     | 1.0 – 10.0  | 0.1  | "3.0x"             |
| REQ-P-17 | `blobCloseness`    | `number`                                                     | `50`      | 20 – 80     | 1    | "50 %"             |
| REQ-P-18 | `trunkThickness`   | `number`                                                     | `100`     | 25 – 400    | 5    | "100 %"            |
| REQ-P-19 | `branchThickness`  | `number`                                                     | `100`     | 25 – 400    | 5    | "100 %"            |
| REQ-P-20 | `canopySize`       | `number`                                                     | `100`     | 25 – 200    | 5    | "100 %"            |
| REQ-P-21 | `trunkHeight`      | `number`                                                     | `100`     | 30 – 150    | 5    | "100 %"            |
| REQ-P-22 | `trunkBranchRatio` | `number`                                                     | `70`      | 40 – 80     | 5    | "70 %"             |

### 3.2 Geometry Parameters

| ID       | Parameter              | Type     | Default   | Range             | Step | UI display |
| -------- | ---------------------- | -------- | --------- | ----------------- | ---- | ---------- |
| REQ-P-23 | `branchLength`         | `number` | `100`     | 25 – 400          | 5    | "100 %"    |
| REQ-P-24 | `branchLengthVariance` | `number` | `50`      | 0 – 100           | 5    | "50 %"     |
| REQ-P-25 | `trunkLean`            | `number` | `0`       | -45 – 45          | 1    | "0°"       |
| REQ-P-26 | `trunkSegments`        | `number` | per-shape | min enforced – 10 | 1    | "5"        |
| REQ-P-27 | `trunkCrookedness`     | `number` | per-shape | 0 – 100           | 5    | "0 %"      |

### 3.3 Strip & Branch Variance Parameters

| ID       | Parameter             | Type     | Default | Range   | Step | UI display     | Tier     |
| -------- | --------------------- | -------- | ------- | ------- | ---- | -------------- | -------- |
| REQ-P-40 | `trunkStripCount`     | `number` | `3`     | 2 – 4   | 1    | "Trunk Strips" | Advanced |
| REQ-P-41 | `trunkTwist`          | `number` | `10`    | 0 – 100 | 5    | "10 %"         | Advanced |
| REQ-P-42 | `branchWidthVariance` | `number` | `25`    | 0 – 50  | 5    | "25 %"         | Advanced |

- **REQ-P-40** `trunkStripCount` — Number of visible strip faces on the trunk cross-section.
  Total cross-section faces = `2 * trunkStripCount`. Default 3 (hexagonal). UI label: "Trunk Strips".
- **REQ-P-41** `trunkTwist` — default 10. Controls cumulative rotational drift of strips along
  the trunk. At 100%, faces can fully rotate in/out of view.
- **REQ-P-42** `branchWidthVariance` — Controls spread of individual branch widths. At 0%:
  all branches at same width ratio. At 50%: +/-50% random spread. Disabled when `branchDepth === 0`.

### 3.4 Branch Parameters

| Parameter             | Type                                | Default         | Range   | Notes                                      |
| --------------------- | ----------------------------------- | --------------- | ------- | ------------------------------------------ |
| `branchDepth`         | `number`                            | per-shape       | 0 – 3   | Max branching depth                        |
| `branchesLevel1Range` | `[min, max]`                        | per-shape       | —       | Dual-thumb range slider for L1 count       |
| `branchesLevel2Range` | `[min, max]`                        | per-shape       | —       | Dual-thumb range slider for L2 count       |
| `branchesLevel3Range` | `[min, max]`                        | per-shape       | —       | Dual-thumb range slider for L3 count       |
| `branchAngle`         | `number`                            | per-shape       | 0 – 100 | 0% = wide horizontal, 100% = narrow upward |
| `branchSegments`      | `number`                            | per-shape       | 1 – 3   | Segments per branch                        |
| `branchCrookedness`   | `number`                            | per-shape       | 0 – 100 | Per-branch crookedness                     |
| `crookednessMode`     | `'alternating' \| 'random'`         | `'alternating'` | —       | Alternating S-curves vs random direction   |
| `branchMirroring`     | `'off' \| 'allowed' \| 'preferred'` | `'allowed'`     | —       | See section 6.27                           |
| `trunkFork`           | `boolean`                           | per-shape       | —       | See section 6.28                           |

### 3.5 Canopy Color Parameters

| ID       | Parameter          | Type     | Default   | UI display          |
| -------- | ------------------ | -------- | --------- | ------------------- |
| REQ-P-30 | `canopyLightColor` | `string` | per-shape | Native color picker |
| REQ-P-31 | `canopyDarkColor`  | `string` | per-shape | Native color picker |

### 3.6 Trunk Color Parameters (HSL + swatches)

| ID       | Parameter         | Type     | Default   | Range   | Step | UI display |
| -------- | ----------------- | -------- | --------- | ------- | ---- | ---------- |
| REQ-P-09 | `trunkHue`        | `number` | per-shape | 0 – 360 | 1    | "25°"      |
| REQ-P-10 | `trunkSaturation` | `number` | per-shape | 0 – 100 | 1    | "50 %"     |
| REQ-P-11 | `trunkLightness`  | `number` | per-shape | 5 – 60  | 1    | "25 %"     |

Trunk color UI includes preset swatch buttons that set all three HSL sliders at once.

### 3.7 Trunk Color Preset Swatches

| Swatch      | `trunkHue` | `trunkSaturation` | `trunkLightness` |
| ----------- | ---------- | ----------------- | ---------------- |
| Light birch | 40         | 20                | 75               |
| Warm brown  | 25         | 50                | 35               |
| Dark brown  | 20         | 55                | 20               |
| Red-brown   | 10         | 45                | 30               |
| Gray        | 0          | 5                 | 45               |
| White       | 0          | 0                 | 90               |

### 3.8 Per-Shape Defaults

| Shape    | `blobCount` | `branchCount` | `blobSizeVariance` | `blobCloseness` | `trunkSegments` | `trunkCrookedness` | `branchThickness` |
| -------- | ----------- | ------------- | ------------------ | --------------- | --------------- | ------------------ | ----------------- |
| `oak`    | 5           | 2             | 3.0                | 50              | 5               | 0                  | 100               |
| `pine`   | 3           | 0             | 3.0                | 60              | 3               | 0                  | 100               |
| `birch`  | 3           | 1             | 3.0                | 50              | 4               | 0                  | 100               |
| `fir`    | 4           | 0             | 3.0                | 50              | 3               | 0                  | 100               |
| `maple`  | 5           | 5             | 2.0                | 30              | 7               | 0                  | 100               |
| `willow` | 4           | 4             | 3.0                | 50              | 7               | 40                 | 150               |

Two-zone trunk segment defaults:

| Shape   | Max L1 | Default `trunkSegments` | Zone Split (lower + upper) |
| ------- | ------ | ----------------------- | -------------------------- |
| oak     | 3      | 5                       | 1 + 4                      |
| maple   | 5      | 7                       | 2 + 5                      |
| willow  | 5      | 7                       | 2 + 5                      |
| cherry  | 4      | 6                       | 1 + 5                      |
| birch   | 2      | 4                       | 1 + 3                      |
| apple   | 2      | 3                       | 1 + 2                      |
| baobab  | 3      | 5                       | 1 + 4                      |
| acacia  | 3      | 5                       | 1 + 4                      |
| pine    | 0      | 3                       | unchanged (no branches)    |
| fir     | 0      | 3                       | unchanged (no branches)    |
| cypress | 0      | 3                       | unchanged (no branches)    |
| bush    | 0      | 3                       | unchanged (no branches)    |

Additional shapes (cypress, apple, cherry, bush, baobab, acacia, custom) have defaults tuned per shape.

### 3.9 Per-Shape Default Colors

| Shape    | `canopyLightColor` | `canopyDarkColor` | `trunkHue` | `trunkSaturation` | `trunkLightness` |
| -------- | ------------------ | ----------------- | ---------- | ----------------- | ---------------- |
| `oak`    | `#a8d84e`          | `#1a472a`         | 25         | 50                | 25               |
| `pine`   | `#4a9e5c`          | `#0d2b1a`         | 20         | 45                | 20               |
| `birch`  | `#b8e065`          | `#2d5e3a`         | 40         | 15                | 80               |
| `fir`    | `#3d8b50`          | `#0a2418`         | 22         | 50                | 28               |
| `maple`  | `#e8a028`          | `#8b2010`         | 30         | 20                | 35               |
| `willow` | `#7cc45a`          | `#1a4020`         | 25         | 40                | 22               |

---

## 4. Tree Shapes

13 shapes, each with tuned config defaults producing characteristic silhouettes. All use the unified trunk/branch system.

| Shape   | Trunk                                    | Branch Depth | Blobs                  | Key Visual                          |
| ------- | ---------------------------------------- | ------------ | ---------------------- | ----------------------------------- |
| Oak     | thick, short-medium, slight crookedness  | 2            | 4-6 large round        | wide rounded crown                  |
| Birch   | thin, white/grey + dark horizontal marks | 2-3          | 5-7 varied             | elegant spread                      |
| Maple   | medium, Y-forking                        | 2            | 4-5 at tips            | arc blob layout, orange-red default |
| Pine    | very short (10-20%)                      | 0-1          | 4-6 angular tiers      | consistent tips, pointed top        |
| Fir     | short                                    | similar      | narrow cone tiers      | differentiated from pine            |
| Willow  | medium, slight lean                      | 2            | small clusters at tips | drooping branches                   |
| Cypress | thin, straight                           | 0-1          | 1-2 teardrop           | tall narrow column                  |
| Apple   | short, thick                             | 1            | 1 large round          | compact fruit tree                  |
| Cherry  | medium, elegant                          | 2            | 3-5 wide               | pink canopy, spreading              |
| Bush    | none or very short stub                  | 0            | 1-2 on ground          | no trunk, small footprint           |
| Baobab  | very thick, barrel-shaped                | short at top | 2-3 small at top       | trunk is the visual feature         |
| Acacia  | tall, relatively thin                    | 1-2          | horizontal band        | flat-topped umbrella                |
| Custom  | user-controlled                          | user         | per-blob editor        | full parameter access, egg boundary |

- Shape selection auto-sets fruit type (locked except custom)
- All shapes work with all 12 lifecycle stages
- Custom shape retains per-blob editor

### Shape-Specific Visual Requirements

**Birch** — trunk displays dark horizontal bars (black/dark-grey stripes) as characteristic markings.
Render as additional SVG elements overlaid on trunk quads.

**Pine** — `trunkHeight` percentage must map correctly to actual trunk height. At `trunkHeight=10%`,
the displayed trunk height must be ~10% of maximum trunk height.

**Willow** — branches reach lower blob positions for visual droop. Default `branchAngle=30%`.
Blob placement targets lower positions relative to trunk tip.

---

## 5. Canopy Generation

### 5.1 Blob System (oak, birch, maple, willow)

- **REQ-C-01** Canopy is composed of `blobCount` overlapping shapes. Blob 0 is always the
  largest blob and is positioned on or very near the trunk axis.
- **REQ-C-01a** When `blobCount = 1`, blob 0 is placed directly on the trunk axis
  (`cx = trunkCenterX`).
- **REQ-C-01b** When `blobCount > 1`, blob 0 stays on/near the trunk axis. Remaining blobs are
  distributed radially around the main blob. Non-primary blobs maintain a
  minimum distance from the center axis.
- **REQ-C-02** `blobSizeVariance` stores the largest-to-smallest ratio (1.0x-10.0x). At `1.0`
  all blobs are the same size; at `10.0` the largest blob is 10x the area of the smallest.
  `minScale = 1 / blobSizeVariance`;
  `blobScale[i] = lerp(1.0, minScale, i / (blobCount - 1))`.
- **REQ-C-02a** For pine/fir, `blobSizeVariance` controls the ratio of top tier base width to
  bottom tier base width. At 1.0x: equal widths. At 10.0x: bottom tier is 10x wider.
- **REQ-C-03** Depth ordering: if blob A fully contains blob B, blob B renders in
  front of blob A (higher depth index). Otherwise depth is assigned randomly (seeded).
- **REQ-C-03a** `blobCloseness` (20-80 %) controls how tightly blobs cluster. For oak/birch:
  higher values = tighter clustering around the trunk axis. Main blob (blob 0) is affected at
  1/10th the magnitude of other blobs.
- **REQ-C-03b** `canopySize` (25-200 %) scales all blob radii AND the blob spread distance
  proportionally. SVG overflow is clipped at viewBox edges for extreme values.

### 5.2 Base Value Scaling

- **REQ-C-14** Internal base values for blob radii, trunk widths, and branch widths use a 1.75x
  scaling factor baked into shape definitions. No runtime multiplication — constants are
  baked into shape definitions.

### 5.3 Blob Boundary Shapes

- **REQ-C-15** Blob boundaries can be one of: `circle` (default for oak/birch/maple/willow),
  `teardrop` (fir top blob), `egg`, `isoscelesTriangle`, or `equilateralTriangle` (the last
  three are available for custom tree).
- **REQ-C-15a** **Teardrop shape**: an ellipse where the top half is compressed to a point via
  a parametric power curve. For vertical parameter `t in [-1, +1]` (-1 = pointy top,
  +1 = rounded bottom): top half (`t < 0`) -> `x(t) = rx * sqrt(1 - t^2) * (1 + t)^p` with `p = 0.6`;
  bottom half (`t >= 0`) -> `x(t) = rx * sqrt(1 - t^2)` (standard ellipse). `y(t) = ry * t`. Pointy at
  the top, smoothly rounded at the bottom.
- **REQ-C-15b** **Egg shape**: slightly narrower top half, wider bottom half, no sharp point.
  For vertical parameter `t in [-1, +1]`: top half (`t < 0`) -> `x(t) = rx * sqrt(1 - t^2) * (1 - a * |t|)`
  with `a = 0.15`; bottom half (`t >= 0`) -> `x(t) = rx * sqrt(1 - t^2) * (1 + b * t)` with `b = 0.15`.
  `y(t) = ry * t`. `a` and `b` may be tuned for visual fit during implementation.
- **REQ-C-15c** All non-circle boundaries support an arbitrary rotation angle (0-360 deg).
  Triangulation uses the custom boundary for point-in-shape tests and boundary sampling.
  Rotation is applied to sampled `(x, y)` pairs via a standard 2D rotation matrix.
- **REQ-C-15d** **Isosceles triangle boundary**: fixed 40 deg apex angle (70 deg/70 deg base). Tip
  points up at `(0, -ry)`; base corners flank the bottom. No per-shape apex angle control.
- **REQ-C-15e** **Equilateral triangle boundary**: 60 deg/60 deg/60 deg angles, vertices on a circle
  of radius `rx`; `ry` scales the vertical axis independently (allows squashing).
- **REQ-C-15f** The boundary shape dispatch lives in a dedicated module
  (`src/lib/trees/boundaries.ts`) that exports one entry per boundary kind with
  `{ kind, sample, contains, rotate }`. Blob generators in `shapes.ts` dispatch on each blob's
  `boundaryKind`.

### 5.4 Pine Tier System

- **REQ-C-04** For `shape = 'pine'`, canopy is composed of `blobCount` triangular tiers
  (isoceles triangles pointing upward), not ellipses.
- **REQ-C-05** Tiers stack from top (smallest, narrowest) to bottom (widest). Each tier's
  base is wider than the tier above. `blobCloseness` controls how much each tier's tip extends
  into the tier above: `overlapFraction = blobCloseness / 100` (20 % to 80 % of tier height).
- **REQ-C-05a** Pine tier centers follow the trunk lean axis:
  `offsetX = trunkLean * (1 - (tierY - trunkTop) / (trunkBottom - trunkTop))`.
- **REQ-C-06** Point-in-canopy tests for pine use a point-in-triangle test (`isPointInTier()`).

### 5.5 Fir Tree Canopy

- **REQ-C-16** For `shape = 'fir'`, canopy has `blobCount` blobs (default 4). Blob 0 (top) uses
  a teardrop boundary shape — pointy at top, rounded at bottom. Remaining blobs use circle
  boundary and cluster below the top blob, accumulating at the bottom of the canopy.
- **REQ-C-16a** The top teardrop blob is placed on the trunk axis, larger than the bottom
  blobs, with `rx ~ W*0.18` and `ry ~ H*0.28`. The 3 bottom circle blobs are arranged in a
  **horizontal row** at the bottom of the canopy region: center blob on trunk axis, left/right
  blobs at `cx = trunkCenterX +/- (0.25 - 0.40)*W` with seeded jitter. All three bottom blobs
  share a common `cy` near the canopy bottom with small +/-5-10 px vertical jitter. Bottom blob
  `rx/ry` ranges: `W * 0.22 - W * 0.32` / `H * 0.14 - H * 0.20` (wider than the top teardrop).

### 5.6 Maple Tree Canopy

- **REQ-C-17** For `shape = 'maple'`, canopy has `blobCount` blobs (default 5) spread in a
  half-circle from left to right at the top. Each blob gets its own dedicated branch from the
  trunk. `blobCloseness` is low (default 30) so blobs are visually separated with room for
  branches.
- **REQ-C-17a** Blobs are distributed radially in a 180 deg arc above the trunk, evenly spaced.

### 5.7 Oak Blob Spread

- **REQ-C-18** For `shape = 'oak'`, secondary blobs (indices 1+) are distributed radially
  (360 deg around main blob). Non-primary blobs maintain a minimum distance from the trunk
  center axis of `|cx - trunkCenterX| >= 0.15*W` to reduce excessive overlap near the trunk.
  Rejected samples are re-rolled up to 5 times before being clamped outward.

### 5.8 Birch Canopy Width

- **REQ-C-19** For `shape = 'birch'`, blob horizontal radius (`rx`) range is `W * 0.12 - W * 0.24`.

### 5.9 Per-Blob Triangulation

- **REQ-C-07** Each blob/tier is triangulated independently. The polygon budget is
  distributed across blobs proportional to their area.
- **REQ-C-08** Boundary point count for each blob is approximately 15% of its allocated polygon
  budget. Boundary points use irregular angular spacing with +/-15-30 deg jitter and +/-10-20%
  radial jitter.
- **REQ-C-09** Recommended boundary vertex counts by polygon budget: 50 -> 8-10, 100 -> 10-14,
  200 -> 14-20, 500 -> 20-30.
- **REQ-C-10** Interior points are sampled with Poisson-disk rejection sampling inside each blob.
- **REQ-C-11** After triangulation, only triangles whose centroid lies inside the blob are kept.

### 5.10 Canopy Outline Smoothing

- **REQ-C-12** For `oak`, `birch`, `maple`, `willow`: after boundary sampling, post-process
  boundary points so that no interior angle at any boundary vertex is acute (< 90 deg). Acute
  vertices are either moved outward radially or removed.
- **REQ-C-13** For `pine`/`fir`: the acute-angle smoothing is skipped at tier tips / teardrop
  tips (acute angles are desired). Non-tip edges may still be smoothed.

### 5.11 Per-Species Canopy Envelope

- Increase envelope base radii (`baseRadiusX`, `baseRadiusY`) to 1.8x for all leafy/branching-canopy
  trees: oak, birch, maple, willow, apple, cherry, baobab, acacia.
- Pine/fir: reduce tier width constants to produce narrower canopy — adjust `baseHalfWidth` formula
  coefficients in `tiers.ts`.
- `canopySize` slider default stays at 100% for all species — the underlying generation constants
  change so 100% produces the correct canopy.
- Default envelope radii produce canopy blobs within the viewbox; users push past bounds via slider.

### 5.12 Floating Blob Repositioning

- Enable floating blob detection for branching-canopy shapes (oak, birch, maple, willow, apple,
  cherry, baobab, acacia).
- Reposition isolated blobs toward their nearest overlapping neighbor blob until they overlap.
- A blob is "isolated" if it does not overlap any other blob AND no branch tip reaches it.

### 5.13 Branch Tip Trimming to Canopy Boundary

- After clustering, trim branch tip endpoints that extend past their associated canopy blob boundary.
- Project the tip back onto the blob ellipse along the branch direction.
- Branches visually enter the canopy but do not extend past the far side.

### 5.14 L2/L3 Branch Length Reduction

- Reduce L2 branch length by 15% (change `CHILD_LENGTH_RATIO_MAX` from 0.8 → ~0.68 or apply a
  0.85 multiplier).
- Reduce L3 branch length by 30-40% — L3 branches render as noticeably short stubs.
- Reduction is compatible with `branchLength` and `branchLengthVariance` slider ranges.

### 5.15 Pine-Specific Tuning

- Pine default `blobCloseness` = 60 for better tier overlap.
- Slightly increase tier `ry` (vertical thickness) so tiers visually overlap without gaps.
- Tier width reduction via `baseHalfWidth` constants (per envelope retuning above).

### 5.16 Blob Count

- Blob count slider max = 25 for all species.
- The existing inverse-sqrt scaling (`targetRadius = sqrt(envelopeArea / blobCount / pi)`) handles sizing.
- Enforce a minimum blob radius so blobs remain visible at high counts.
- Per-species default blob counts are unchanged (oak=5, birch=6, etc.).

---

## 6. Trunk & Branch Engine

### 6.1 Trunk Rendering

- Stacked quadrilaterals (trapezoids) split by a vertical centerline
- Each trunk segment (between crookedness junctions) = one quad
- Centerline bisects each quad into left/right halves for two-tone shading
- Rectangle edges ARE the trunk silhouette — no clip-path needed
- Tapers from `trunkBaseWidth` to `trunkTopWidth`
- Trunk height range: 10%-150%, thickness range: 25%-400%

### 6.2 Two-Tone Shading

- Light side / dark side per quad half, based on `lightAngle`
- Flat color per half (no gradient within each half)
- Uses HSL trunk color parameters (hue, saturation, lightness)
- Changing `lightAngle` visibly flips which half is lighter
- Same model for trunk and branches

### 6.3 Branch System

- Same quad + centerline rendering as trunk
- Centerline follows branch direction (not always vertical)
- Per-level count via dual-thumb range sliders: `branchesLevel1Range`, `branchesLevel2Range`, `branchesLevel3Range`
- Sub-branches originate from upper 50-100% of parent (not tip-only)
- Independent segments and crookedness per branch
- Dynamic slider maximums based on available trunk/parent length
- `branchAngle` (0-100%) controls spread: 0% = wide horizontal, 100% = narrow upward

### 6.4 Crookedness

- Max 90 deg per junction at 100% crookedness
- 50% jitter reduction (45-90 deg range at 100%)
- Random L/R direction per junction — enables S-curves, zigzags
- Self-intersection prevention: absolute angle from vertical clamped to +/-85 deg
- Separate trunk and branch crookedness sliders
- Default mode: **alternating** — if segment N bends left, segment N+1 bends right (natural S-curves)
- Secondary mode: **random** — for edge cases (dead stage, extreme crookedness)
- `crookednessMode: 'alternating' | 'random'` config param, default `'alternating'`
- Segment length variation: each segment +/-30% of average segment length

### 6.5 Branch Rules (A-L)

- **A** Every branch starts on trunk or another branch
- **B** Every canopy blob overlaps another blob OR has a branch leading into it
- **C** >=5px of every branch visible outside canopy; <5px rejected
- **D** Keep branches on their originating side of the trunk centerline
- **E** Angle divergence 30-60 deg from parent direction; `branchAngle` slider shifts range
- **F** Overlap only checked between same-depth siblings
- **G** Floating blob fallback: emergency branch from trunk center to unconnected blob
- **H** Level-1 branches from upper half of trunk only
- **I** Level-1 branches alternate L/R with random starting side (seeded)
- **J** Hard cap 25 branches total across all levels
- **K** Child branch length = 20-80% of parent, default center 50%
- **L** Trunk tip connects to a Level-1 branch or the nearest canopy blob — trunk always ends with a
  visual connection to canopy. For shapes with `branchDepth=0` (bush, cypress, pine, fir), trunk tip
  connects directly to lowest/nearest blob. Complements Rule G.

### 6.6 Maple Unification

- Maple uses the generic branch system — no separate `generateMapleBranches()`
- Distinct look comes from blob layout (arc distribution) and config defaults only

### 6.7 Branch Junction Fill

- Fill polygon at every parent-child junction to eliminate wedge gaps
- Color: parent branch dark-side color

### 6.8 Strip Continuity

- **REQ-EV2-S-01** Strip width ratios are computed at each trunk junction point (not per
  segment). For N trunk segments there are N+1 junction ratio sets. Each segment interpolates
  linearly between its bottom and top junction ratios. This guarantees continuity — adjacent
  segments share the same junction point data.
- **REQ-EV2-S-02** Strip width at each junction has two independent variation sources that
  accumulate: **Base randomness** — always present; even at `trunkTwist=0`, strip widths are
  non-uniform (organic, not mechanical 25/50/25), seeded per-junction. **Twist** — cumulative
  rotational drift from base to tip, plus a per-junction random perturbation. `trunkTwist`
  slider controls magnitude of both drift rate and perturbation. At `trunkTwist=0` only base
  randomness applies.
- **REQ-EV2-S-03** The twist model is **hybrid cumulative**: a base angle starts at a seeded
  random value and drifts at each junction by a small twist delta (proportional to `trunkTwist`).
  On top of the cumulative drift, each junction gets an additional random perturbation. This
  produces organic spirals rather than mechanical rotation.

### 6.9 Cross-Section Model

- **REQ-EV2-X-01** The trunk is modeled as a regular polygon cross-section projected onto the
  screen plane. The number of visible (front-facing) strip faces = `trunkStripCount` (REQ-P-40,
  range 2-4, default 3). The total number of cross-section faces = `2 * trunkStripCount`.
- **REQ-EV2-X-02** At maximum twist, strip faces can fully rotate out of view (width -> 0) and
  new faces can appear on the opposite side. Buffer strips on each side of the visible range are
  maintained at 0 width by default and grow positive when another strip rotates out.
- **REQ-EV2-X-03** `trunkTwist` default is **10%**, giving all trees subtle strip variation. Per-shape
  `SHAPE_DEFAULTS` override as appropriate.

### 6.10 Junction Geometry

- **REQ-EV2-J-01** At each internal trunk junction, the segment boundary is perpendicular to
  the **angle bisector** between the incoming and outgoing segment directions. This tilts the
  boundary at crooked junctions, producing natural-looking bends instead of horizontal cuts.
  Base junction (no incoming segment): boundary perpendicular to first segment direction.
  Tip junction (no outgoing segment): boundary perpendicular to last segment direction.
- **REQ-EV2-J-02** All junction points — outer edges AND internal strip split points — are
  **shared** by both adjacent segments. Zero gaps guaranteed by construction.
- **REQ-EV2-J-03** Trunk width at each junction is measured **perpendicular to the bisector
  direction**, not horizontally. This prevents the trunk from appearing to pinch or bulge at
  bends.

### 6.11 Trunk Taper

- **REQ-EV2-T-01** Trunk taper uses a **hybrid** model: **Gentle base taper** — slow natural
  conical narrowing along the full trunk length, present even on branchless trunks. **Fork taper**
  — discrete width reduction at each branch junction, proportional to branch depth (see
  REQ-EV2-F-04). Both compound.
- **REQ-EV2-T-02** The existing `trunkTopWidth` in shape definitions becomes the **minimum floor**.
  The trunk narrows to this value at most regardless of fork count.
- **REQ-EV2-T-03** The `trunkThickness` slider scales the base width only. It does not scale the
  fork reductions.

### 6.12 Two-Zone Trunk Segments

- **REQ-EV2-TZ-01** The trunk is divided into two zones: **Upper zone (branch zone)** — contains
  junctions where L1 branches can spawn; segment count = `max(branchesLevel1Range[1], 2)`.
  **Lower zone (bare trunk)** — below the branch zone; minimum 1 segment, still has twist
  variation and crookedness. Branches spawn only at upper-zone junctions.
- **REQ-EV2-TZ-02** `trunkSegments` minimum is enforced: `trunkSegments >= upperZoneSegments + 1`.
  The user can add more segments for visual detail but not go below the minimum.

### 6.13 Bottom-Up Sequential Generation

- **REQ-EV2-G-01** Build the tree from base to tip in a **single bottom-up pass**: (1) Compute
  junction positions from crookedness + lean. (2) Starting from the base junction, process each
  junction upward. (3) At each upper-zone junction, determine if a branch spawns (pre-determined
  by seed). (4) If a branch spawns: compute fork width reduction, compute centerline displacement,
  update remaining trunk width. (5) Continue to next junction with updated width and position.
- **REQ-EV2-G-02** At each fork, the trunk centerline above the fork displaces slightly
  **opposite** to the branch direction. Displacement is 2-5 px, proportional to the branch
  width fraction. Alternating left-right branches (Rule I) naturally produce balanced trunks.
- **REQ-EV2-G-03** Branches spawn only at trunk junctions in the upper zone. The fork point IS a
  junction with fully computed shared vertices.

### 6.14 Branch Fork Model

- **REQ-EV2-F-01** When a branch spawns, it emerges from the trunk via a **shared-vertex fork**.
  The branch's base quad outer corners coincide exactly with the trunk edge vertices at the fork
  height. The branch generates its own independent strip system starting from the attachment.
- **REQ-EV2-F-02** No junction collar by default. If a visible V-wedge appears at wide-angle forks,
  a single interpolated fill triangle MAY be inserted with color
  `lerp(trunkStripColorAtForkHeight, branchStripColorAtBase, 0.5)`. Ship without the fill first.
- **REQ-EV2-F-03** When two branches share a junction (alternating left+right from Rule I), they
  fork **sequentially** with a slight vertical stagger (few pixels offset). Each shared-vertex fork
  uses the trunk edge vertices at its own staggered height.
- **REQ-EV2-F-04** Fork width economics — depth-dependent fraction: L1 branches take ~15-20% of
  trunk width at the fork point. L2 branches take ~10-15% of their parent L1 width. Width
  calculation is sequential: branch N's width derives from trunk width at its attachment height,
  already accounting for base taper + all forks below it. Individual branch width =
  `parentWidthAtForkPoint * (depthFraction +/- branchWidthVariance * random)`.
- **REQ-EV2-F-05** Trunk tip behavior is shape-dependent: shapes where trunk continues into canopy
  (oak, birch, maple, cherry, willow) — trunk continues above the last fork at remaining width.
  Shapes where trunk terminates at a fork (baobab, acacia) — trunk ends at uppermost fork.

### 6.15 Branch Strip System

- **REQ-EV2-B-01** L1 and L2 branches use the full shared-vertex fork model (REQ-EV2-F-01):
  trunk/parent strip count preserved across the fork, branch starts an independent strip system.
- **REQ-EV2-B-02** L3 branches use a simplified model: plain quads attached at the parent
  branch's silhouette edge. No strip system, no fork geometry.
- **REQ-EV2-B-03** Branches inherit `trunkStripCount` from the trunk. Twist is attenuated per
  depth: L1 gets full `trunkTwist`, L2 gets ~50% of `trunkTwist`, L3 has no twist.
- **REQ-EV2-B-04** `branchSegments` is auto-reduced per depth: L1 gets the slider value, L2 gets
  `max(branchSegments - 1, 1)`, L3 always gets 1. Branch segment count minimum is enforced by
  sub-branch count.

### 6.16 Branch Angle & Width Variability

- **REQ-EV2-V-01** `branchAngle` slider controls the **center angle**. Each individual branch gets
  +/-15 deg random variation around the center.
- **REQ-EV2-V-02** Depth-based tapering uses hardcoded multipliers (L1=1.0x, L2=0.85x, L3=0.35x).
  `branchWidthVariance` (REQ-P-42) controls spread. Individual branch widths are seeded.
- **REQ-EV2-V-03** Branch width variance produces visible but not extreme differences. A branch at
  center ratio +/-50% (at max variance) still looks like a natural branch. Randomness is symmetric.

### 6.17 Rule L — Trunk Tip Connection

- **REQ-EV2-L-01** Trunk tip always connects to a branch or canopy blob. For `branchDepth=0`
  shapes (bush, cypress, pine, fir), trunk tip connects to the lowest/nearest canopy blob or tier.
- **REQ-EV2-L-02** Rule L is implemented as a post-generation validation step in `generateTree()`.
  If the trunk tip is exposed (no branch and not inside canopy), an emergency branch or connection
  is generated. Complements existing Rule G.

### 6.18 Disabled Parameters

- **REQ-EV2-D-01** `trunkStripCount`: disabled for bush (bush disables all trunk controls).
- **REQ-EV2-D-02** `branchWidthVariance`: disabled when `branchDepth === 0`. Added to disabled
  lists for pine, fir, cypress, bush.

### 6.19 Tri-Split Face Lighting

- **REQ-EV2-LT-01** Each trunk/branch segment's strip faces get independent colors computed via
  dot-product lighting. Face normals are derived from the polygonal cross-section model (hexagonal
  for 3-strip, octagonal for 4-strip, etc.). Left/right normals: segment perpendicular at 60 deg
  from forward (for 3-strip hex model), adjusted for other strip counts. Center normal: front-facing
  with seeded random +/-0.15 xy-perturbation. Lightness offset formula:
  `-10 + ((dot + 1) / 2) * 22` maps dot product to [-10, +12].
- **REQ-EV2-LT-02** Lighting is consistent across connected segments. No visible color seams at
  segment boundaries.
- **REQ-EV2-LT-03** Branch lighting uses the same face-normal model as the trunk.

### 6.20 Z-Ordering

- **REQ-EV2-Z-01** Classify branches as **front** (in front of trunk) or **back** using
  light-angle-biased randomness: branches on the **lit side** (facing `lightAngle`): 70% chance of
  front placement. Branches on the **shadow side**: 30% chance of front placement. Classification
  is seeded for determinism.
- **REQ-EV2-Z-02** Back branches render **before** trunk quads in SVG order and receive a
  **-3 lightness offset** (subtle darkness for depth cue). Front branches render after trunk.
- **REQ-EV2-Z-03** L2 branches inherit their parent L1's front/back status by default, with a
  small seeded chance (~20%) of flipping.
- **REQ-EV2-Z-04** Five z-order render layers for branching shapes (painter's order):
    1. Back branches (behind trunk)
    2. Trunk quads
    3. Front branches (in front of trunk)
    4. Back canopy blobs (connected to back branches)
    5. Front canopy blobs (connected to front/trunk branches)

    Branchless shapes retain the original 3-layer model (REQ-R-02).

- **REQ-EV2-Z-05** Each container geometry element (`Quad`, `BranchGeometry`, `BlobGeometry`)
  gains a `zOrder` field. The renderer sorts by z-order layer. `Triangle` is explicitly waived —
  triangles always inherit ordering from their parent `BlobGeometry`.

### 6.21 Generation Pipeline

- **REQ-EV2-P-01** For branching shapes, the generation pipeline is:
    1. Build trunk path with two-zone segments (bottom-up, with fork reactions)
    2. Fork L1 branches from trunk at upper-zone junctions
    3. Fork L2 branches from L1 branches using same model
    4. Generate L3 branches (simplified)
    5. Cluster branch tips into blob groups
    6. Generate canopy blobs around cluster centroids
    7. Assign z-order to all geometry elements
- **REQ-EV2-P-02** Branchless shapes (pine, fir, cypress, bush) keep their current generation
  system entirely.

### 6.22 Branch-Driven Canopy Blob Placement

- **REQ-EV2-BC-01** Given N branch tips (L1 + L2 + optional trunk tip), cluster them into M
  groups where M = `blobCount` slider value. Use a clustering algorithm (e.g., k-means, seeded).
  Tips close together share a blob; tips far apart get individual blobs.
- **REQ-EV2-BC-02** The trunk tip is included as a cluster point. For shapes like oak, the trunk
  tip has higher weight (attracts a blob to itself = central crown). For shapes like maple, the
  trunk tip has low/zero weight (no central blob).
- **REQ-EV2-BC-03** Branches go into the **middle** of their blob. If a branch tip lands at the
  edge of a blob, the blob shifts to center on the tip.
- **REQ-EV2-BC-04** Weaker branches (higher depth levels) get smaller blobs. Blob size correlates
  with the branch level/thickness of its strongest contributing branch tip.

### 6.23 Blob Sizing

- **REQ-EV2-BS-01** Blob base radius is determined by: **Cluster size** — more branch tips in a
  cluster -> larger blob radius. **Branch thickness** — thicker branches (L1) produce larger blobs
  than thinner (L2, L3). `blobSizeVariance` adds seeded randomness on top.
- **REQ-EV2-BS-02** `canopySize` slider scales the **canopy envelope**: small `canopySize` = tight
  envelope, fewer tips covered, more bare branches visible. Large `canopySize` = wider envelope,
  more tips covered, lush canopy. Branches remain visible at all canopy sizes.

### 6.24 Canopy Envelope

- **REQ-EV2-CE-01** Each shape defines a **canopy envelope** — a bounding region where blobs exist.
- **REQ-EV2-CE-02** `canopySize` scales the envelope from its center (grows outward/upward).
- **REQ-EV2-CE-03** The canopy envelope grows freely with `canopySize`. SVG overflow clipping
  (REQ-R-01) handles viewport bounds. `canopySize` slider capped at 200%.
- **REQ-EV2-CE-04** Branch tips outside the envelope: their blob is pulled back to the envelope
  edge (smaller blob at boundary). Tips very far outside get no blob — just bare branch.
- **REQ-EV2-CE-05** The envelope adapts to `canopySize` and viewport, preventing both overflow
  and branch-hiding.

### 6.25 Shape Style Parameters

- **REQ-EV2-SS-01** Each shape definition retains **style parameters**:
    - `blobRxRyRatio`: controls blob shape (1.0 = round, 3.0+ = flat like acacia parasol).
    - `blobVerticalOffset`: shifts blobs relative to tip position (positive = droop downward — used
      by willow).
    - `blobBoundary`: circle or teardrop (for cypress-style).
    - `blobClusterBehavior`: how aggressively nearby tips merge into shared blobs.
- **REQ-EV2-SS-02** Shape-specific identity is preserved via style parameters:

| Shape  | Key Characteristics                                                 |
| ------ | ------------------------------------------------------------------- |
| oak    | Round crown. Trunk tip high weight -> central blob. Balanced rx/ry. |
| maple  | Blobs on side branches. Trunk tip = fork, no blob. Medium blobs.    |
| willow | Blobs offset downward (droop). Branches at low angle. Low canopy.   |
| birch  | Alternating-side blobs. Airy canopy. Thin trunk.                    |
| cherry | Horizontal spread. Blobs in wide band. Pink coloring.               |
| baobab | Small blobs at very top. Dominant trunk. Short branches.            |
| acacia | Flat parasol. Very wide rx, tiny ry. Branches horizontal.           |
| apple  | Compact round canopy. Minimal branching. Large single blob.         |

- **REQ-EV2-SS-03** Branch tips that fall outside the canopy envelope have no blob — bare branch
  poking out is acceptable and realistic.

### 6.26 Canopy Z-Ordering

- **REQ-EV2-CZ-01** Each canopy blob inherits z-order from its cluster's branches:
  single-branch cluster: blob gets that branch's front/back status.
  Multi-branch cluster with mixed front/back: blob defaults to front.
  Trunk-tip blob (e.g., oak center): always front.
- **REQ-EV2-CZ-02** Back canopy blobs render in layer 4, front canopy blobs in layer 5 (per
  REQ-EV2-Z-04).

### 6.27 Branch Symmetry

- **REQ-PRD7-01** `DEFAULT_TREE_CONFIG.branchMirroring` = `'allowed'`.
  Per-species overrides: pine/fir/cypress/bush → `'off'`; cherry/acacia → `'preferred'`.
  Shapes inheriting the default (oak, birch, maple, willow, apple, baobab) omit `branchMirroring`
  from `SHAPE_DEFAULTS`.

The `branchMirroring` control is a 3-state dropdown "Branch Mirroring" in the branch controls section:

- **Off** — current behavior: L1 branches alternate left/right, random junctions, overlap rejection as-is
- **Allowed** — relaxes same-junction overlap rejection for branches on opposite sides: same-point
  pairs more likely but not forced
- **Preferred** — actively generates L1 branches in pairs from the same trunk junction: one left,
  one right. Angle and length differ slightly between the pair

When "Preferred": L1 branch count minimum becomes 2 (treat `branchesLevel1Range` min < 2 as 2).
L2 sub-branches also generate in pairs from L1 tips, with L2 count minimum of 2.

### 6.28 Trunk Fork (Y-Split)

A "Trunk Fork" checkbox in the branch controls section.

When enabled:

- Trunk flares (widens) at the last 1-2 segments — width increases by ~30-50% at the top
- Trunk terminates at the fork junction — no trunk quads render above the Y-split; fork arms replace
  the trunk tip entirely
- Two L1 branches are forced from the topmost trunk junction, diverging symmetrically (with natural
  variance from `branchAngle` slider)
- Each fork arm has `widthStart ~ trunkTopWidth * 0.6-0.7`
- Fork arms are standard L1 branches — they support L2/L3 sub-branches, canopy blob clustering
- L1 branch count minimum becomes 2 (fork arms count as L1 branches)
- Trunk tip anchor moves to the fork junction point

When combined with "Preferred" mirror symmetry: fork arms are the primary mirror pair; additional L1
branches (if any from slider) also mirror.

Per-species defaults:

| Species    | Trunk Fork Default |
| ---------- | ------------------ |
| Acacia     | On                 |
| All others | Off                |

Works with `branchAngle`, `branchDepth`, and all branch count sliders. **REQ-PRD7-02** applies to
all species when `trunkFork` is enabled.

---

## 7. Lighting & Color

### 7.1 Canopy Lighting (Two-Color Gradient System)

- **REQ-L-01** Canopy lighting uses a two-color interpolation system. `canopyLightColor` (hex)
  is the color for fully lit faces. `canopyDarkColor` (hex) is the color for fully shadowed
  faces. The lighting factor (0-1) interpolates between these in HSL space.
- **REQ-L-01a** Each canopy blob uses hemisphere lighting mapped to that blob's own center and
  radii — not global canopy bounds.
- **REQ-L-02** Ambient component is `0.15`; diffuse component is `0.85 * diffuse`:
  `lighting = 0.15 + 0.85 * diffuse`.
- **REQ-L-04** `depthVariance` scales the hemisphere z-component:
  `z = sqrt(1 - r^2) * depthVariance`. At `0.0` lighting is uniform; at `1.0` standard; at `2.0`
  exaggerated.
- **REQ-L-07** Target colour range for a green canopy (default oak): brightest faces use
  `canopyLightColor`, mid-tones interpolate 50 %, darkest faces use `canopyDarkColor`.

### 7.2 Per-Shape Default Colors

- **REQ-L-09** Each tree shape has default `canopyLightColor`, `canopyDarkColor`, and trunk HSL
  values (see section 3.9). When the user selects a shape in the single tree editor, color controls
  initialize to the shape's defaults.
- **REQ-L-09a** In the scene editor, a "Use per-shape default colors" toggle controls whether each
  tree uses its own shape defaults (on) or all trees use the shared color pickers (off, default).
  When the toggle is on, the shared color pickers are disabled.
- **REQ-L-09b** The per-shape-defaults toggle is only visible in the scene editor.

### 7.3 Trunk / Branch Lighting

- **REQ-L-08** Trunk and branch triangles use cylinder-mapping (horizontal position only) for
  lighting, not hemisphere mapping.

---

## 8. Lifecycle Stages

12 stages in order:

| Stage     | Visual                  | Notes                                  |
| --------- | ----------------------- | -------------------------------------- |
| seed      | seed on soil            | SVG asset, no trunk/canopy             |
| sprouting | seed + tiny shoot       | SVG asset, minimal stub                |
| sapling   | young small tree        | short trunk, sparse canopy             |
| growing   | medium-sized tree       | no stakes (simplified)                 |
| leafy     | full mature tree        | default generation output              |
| flowering | mature + flowers        | flowers at fruitSlots[], tree-specific |
| fruiting  | mature + fruit          | fruit at fruitSlots[], tree-specific   |
| autumn    | orange/red/brown canopy | warm colors + falling leaf particles   |
| ready     | full glowing tree       | subtle glow/highlight effect           |
| bare      | leafless winter         | trunk and branches only, no canopy     |
| dead      | fallen/tilted tree      | rotated, broken branches, grey/brown   |
| stump     | low tree stump          | SVG asset, very short, no branches     |

- `TreeConfig.stage` defaults to `'leafy'`
- All shapes support all stages

**Dead stage** applies both crookedness and lean: `trunkCrookedness=50`, `trunkLean=15`,
`trunkSegments=5`. Use `random` crookedness mode for a broken/twisted look. No canopy,
desaturated colors.

---

## 9. Animations

- **Canopy sway** — CSS transform rotation, 2-3s cycle, per-tree phase offset, ~2-3 deg amplitude. Per-blob
  stagger (blobIndex \* 0.15s) for within-tree variety. Startup delay 0-0.5s.
- **Branch movement** — individual CSS animation per branch, 1.5-4s range, transform origin at branch
  base. Nest child branch `<g>` elements inside parent's animated group so children inherit parent
  rotation + add their own. Render structure: `trunk -> L1 animated group -> L2 animated group (nested)`.
- **Growth animation** — **REQ-PRD7-12**: branch tip-only animation: animate branch length by extending
  tips outward; branch origins stay fixed at trunk/parent attachment point; `transform-origin` at branch
  base, scaling along branch axis only. Canopy blob position follows the animated branch tip.
  All branches and canopy blobs share the same animation duration and start simultaneously — no
  per-branch stagger. `growthVariance` (0-100%) controls amplitude: 0% = static (scale 1.0),
  100% = dramatic (branches 0.5–1.5x, canopy 0.92–1.08x). Duration: 3 seconds. Purely CSS animations.
- **Tool animations** — each tool has distinct idle animation with `transform-origin` at snap point.
  "Animate tools" checkbox toggles all visible tool idle animations. 6 tools with individual CSS
  keyframes (`tool-shovel-idle`, `tool-watering-can-idle`, etc.).
- **Falling leaves** — **REQ-PRD7-15**: leaf particles originate from midpoint between crown center and
  canopy bottom (`startY = (crownCenter.y + canopyBottomY) / 2`). Each leaf falls to `GROUND_LINE_Y`,
  then stays visible for ~10 seconds before fading out. Multiple leaves accumulate, creating a pile
  effect. Landed leaves get ±10-20px horizontal jitter. Maximum 15-20 visible ground leaves per tree.
  New leaves spawn while old leaves fade. Spawn interval: 800ms.
- All toggleable via checkboxes, loop while checked
- No performance degradation at 100 trees

---

## 10. Fruits, Flowers & Tools

### 10.1 Fruits

All fruits as static SVG assets in `assets/fruits/`. Type locked per tree shape:

| Tree    | Fruit        | Visual                  |
| ------- | ------------ | ----------------------- |
| Oak     | Acorn        | brown nut with cap      |
| Birch   | Catkin       | elongated yellow-green  |
| Maple   | Samara       | winged seed pair        |
| Pine    | Pine cone    | small brown cone        |
| Fir     | Fir cone     | upright cone            |
| Willow  | Catkin       | slender cluster         |
| Cypress | Small cone   | tiny round cone         |
| Apple   | Apple        | red/green round         |
| Cherry  | Cherry pair  | two red berries on stem |
| Bush    | Berry        | small round berry       |
| Baobab  | Baobab fruit | oblong pod              |
| Acacia  | Seed pod     | long flat brown pod     |

- Only custom shape allows fruit type selection via dropdown
- Fruit count capped at 7 per tree
- Containment boundary: `nx^2 + ny^2 <= 0.85` (15% inset from edge)
- Rendered size: 2x scale factor applied to all fruit `<g>` transforms

### 10.2 Flowers

- Each tree type has unique flower SVG in `assets/flowers/`
- `flowering` stage renders flowers at `fruitSlots[]` positions
- Earlier stages (sprouting, sapling) can render flowers at available slots
- Flowers are lifecycle-only — not selectable as a fruit type

### 10.3 Tools & Accessories

6 tools as static SVGs in `assets/tools/`:

| Tool         | Anchor        | Snap Point         | Animation            |
| ------------ | ------------- | ------------------ | -------------------- |
| Shovel       | `trunkBase`   | blade tip          | digging oscillation  |
| Watering Can | `trunkBase`   | spout tip          | tilt/pour rotation   |
| Ladder       | `trunkMiddle` | upper lean contact | subtle sway          |
| Axe          | `trunkBase`   | blade edge         | chopping oscillation |
| Rake         | `trunkBase`   | tine tips          | sweeping motion      |
| Woodpecker   | `trunkMiddle` | feet/claws         | head bob + body rock |

- Positioning: `translate(anchor - snapOffset)`
- `transform-origin` at snap point for animations
- Style: flat design, dark charcoal metal + warm tan wood
- Each toggled via individual checkbox
- `snapOffset` defined per tool in config
- Watering can is tilted (rotated) in its resting position as if pouring
- Woodpecker represents code review. Clings to trunk side at `trunkMiddle`, flush against trunk.
  Numeric badge (1-6) for active reviewer count. Badge hidden when count is 0 or undefined.

---

## 11. SVG Asset Pipeline

- Asset folder: `src/lib/trees/assets/` with subfolders: `tools/`, `fruits/`, `flowers/`, `stages/`,
  `ground/`, `overlays/`
- All 6 asset subdirectories have barrel `index.ts` exports — **REQ-PRD7-11**
- Populated directories contain only actual files (no `.gitkeep` placeholders)
- `src/lib/assets/` (favicon only) stays separate from `src/lib/trees/assets/`
- SVG sourcing: Recraft AI for direct SVG, Vectorizer.AI for PNG to SVG conversion

---

## 12. Special Trees

### 12.1 Potted Plant

- Separate `generatePottedPlant()` returning standard `TreeGeometry`
- Wide planter pot (SVG asset), one universal design
- 5 stages: `pot-with-soil -> sprout -> small-plant -> flowering -> dried`
- Same 200x300 viewBox, pot occupies bottom 60%
- Exports same `TreeAnchors` interface

### 12.2 Oak/PRD Tree

- Wrapper over `generateTree` with scaled-up oak config
- `completionRatio` via branch-to-blob mapping:
    - Branch count = issue count
    - Only resolved branches have canopy blobs
    - Bare branches = open issues
- Physically larger viewBox (300x450+)
- Stone nameplate below `trunkBase` (oak-only), omitted when no name prop

---

## 13. Scene

### 13.1 Overview

- Tree count slider: 3-100, default 10
- Per-shape default colors on by default (each tree uses its shape's color palette)
- Each tree gets random shape + seed (varied tree types mixed)
- SVG painter's algorithm: back-to-front rendering for occlusion
- Depth spread slider: 0 = flat row (no Y offset), max = full depth range
- Deterministic given same seed
- **REQ-S-08** Individual seeds are offset from the base seed: `seed`, `seed + 1000`, etc.
- **REQ-S-09** `branchCount` and `blobCount` are per-shape (not adjustable in scene mode)

### 13.2 10-Layer Scene Layout

- 10 layers × 10 trees per layer = 100 max trees
- Sequential filling: trees 1-10 → layer 1, 11-20 → layer 2, etc.
- Layer 1 is the front row (scale 1.0); layer 10 is the back (scale 0.65)
- Scale interpolation: linear from `SCALE_FRONT=1.0` to `SCALE_BACK=0.65` across layers
- Vertical offset per layer: `depthSpread * (layerNumber - 1) / 2`
- **REQ-PRD7-10** Row shift algorithm: front row (layer 1) has zero shift — trees equidistant at
  predictable positions. Rows 2+ get a seeded random horizontal shift between 15-45% of inter-tree
  spacing. No row within ±3 rows may share a similar shift position (within 10%). Re-roll up to 5
  attempts if constraint violated, then clamp to nearest valid position. All rows maintain
  equidistant internal tree spacing. Shifts are deterministic per scene seed.
- Output sorted descending by Y for painter's algorithm

### 13.3 Scene Ground Band

- Ground level at the baseline of the front row (largest trees)
- Back row trunks sit above the ground line (naturally higher due to perspective positioning)
- **REQ-PRD7-21** Ground band height: `computeGroundHeightPercent(depthSpread, treeCount)` using
  formula `Math.max(12, 12 + (depthSpread * (actualLayers - 1)) / 2)`. Light mode gradient:
  `#4a3528 → #4a7c3f` (brown to green, `bg-linear-to-t`). Dark mode: `#1a0e08 → #2d4a25`.

---

## 14. UI & Editor Controls

### 14.1 LowPolyTree Component

- **REQ-UI-01** The component accepts all `TreeConfig` fields as individual props with defaults
  from `DEFAULT_TREE_CONFIG`.
- **REQ-UI-02** Additional props:

| Prop           | Type                             | Default | Description                                                        |
| -------------- | -------------------------------- | ------- | ------------------------------------------------------------------ |
| `showAnchors`  | `boolean`                        | `false` | Render coloured dots at anchor positions                           |
| `showCanopy`   | `boolean`                        | `true`  | Toggle `<g class="canopy">` rendering                              |
| `showBranches` | `boolean`                        | `true`  | Toggle `<g class="branches">` rendering                            |
| `showTrunk`    | `boolean`                        | `true`  | Toggle `<g class="trunk">` rendering                               |
| `showViewBox`  | `boolean`                        | `false` | Debug overlay: red dashed viewBox border, center axis, ground line |
| `class`        | `string`                         | `''`    | CSS class forwarded to `<svg>`                                     |
| `onanchors`    | `(anchors: TreeAnchors) => void` | —       | Callback fired when anchors are computed                           |

`showCanopy`, `showBranches`, `showTrunk` are display-only toggles. Generation still runs for all
layers so that anchors remain correct.

### 14.2 Single Tree Editor

- All tree editing controls are fully functional without sign-in. Only save/load/gallery features
  require authentication.
- **REQ-S-05** Single editor preview shows one tree rendered at large size (max 576px).
- **REQ-S-10** The root page (`/`) is the scene editor. `/editor` is the single tree editor.

### 14.3 Scene Editor Controls

- **REQ-S-06** Right column displays one tree of each non-custom shape side by side.
- **REQ-S-07** Controls organized into cards:
    - **Scene Settings**: seed input (advanced tier only) + Randomize, `canopyPolygons`, lifecycle
      stage selector
    - **Canopy**: `blobSizeVariance`, `blobCloseness`, `canopySize`
    - **Trunk**: `trunkHeight`, `trunkThickness`, `trunkLean`, `trunkSegments`,
      `trunkCrookedness`, `trunkBranchRatio`
    - **Branches**: `branchThickness`, `branchLength`, `branchLengthVariance`
    - **Canopy Color**: 2 color pickers + "Use per-shape defaults" toggle
    - **Trunk Color**: swatches + HSL sliders + per-shape defaults toggle
    - **Lighting**: `lightAngle`, `depthVariance`
    - **Debug**: Show Canopy, Show Branches, Show Trunk, Show Anchors checkboxes
- **REQ-PRD7-14** Stage selector in the Scene Settings card controls the stage for **all trees**
  simultaneously. Default stage: `leafy`. Uses the same `TREE_STAGE_OPTIONS` as single tree editor.

### 14.4 Editor Layout

- **REQ-S-01** Both editor pages (`/` scene, `/editor` single tree) use a `100dvh` CSS grid
  with a **top/bottom 50:50 split** (`grid-rows-[1fr_1fr]`). Scene/preview in top half,
  settings panel in bottom half.
- **REQ-S-02** / **REQ-PRD7-18** Settings panel uses a flat responsive grid layout:
  `grid-cols-[repeat(auto-fill,minmax(280px,1fr))]`. All cards are direct grid items — no
  grouping wrappers or `col-span-full` containers.
- **REQ-S-03** / **REQ-PRD7-03** The tier toggle is **sticky** (`sticky top-0 z-10`) above the
  scrollable settings area. It has a **solid opaque background** matching the panel background,
  spans the full width with horizontal padding matching the cards, and has equal vertical spacing
  above (to the scene/preview) and below (to the first card). Scrolled card content is fully
  hidden behind the switcher at all scroll positions.
- **REQ-S-11** The entire controls panel has `user-select: none` (Tailwind `select-none`)
  applied to prevent text selection from interfering with slider dragging.
- **REQ-PRD7-17** Both editors have a sky gradient background (`bg-linear-to-b from-sky-200 to-white`,
  dark mode: `from-[#0a1628] to-[#1a2744]`) and a visible ground plane. Single tree editor: simple
  horizontal ground band at `GROUND_LINE_Y` — earth-colored rectangle filling the bottom of the
  viewport with a subtle gradient fading to transparent ~20% up. Both ground and sky respect
  dark/light theme.

### 14.5 Mobile Layout

- Below 768px: hamburger sidebar trigger (fixed top-left, `z-50`, `md:hidden`)
- Sidebar opens as sheet overlay (offcanvas mode)
- Settings and scene stack vertically
- All controls accessible in mobile layout

### 14.6 Floating Action Buttons

- **REQ-PRD7-04** / **REQ-PRD7-07** Randomize Seed, Reset, and Save actions live exclusively in
  the floating button menu (`SceneFloatingButtons`). The settings panel contains only tree
  configuration controls. Use `mergeProps` from bits-ui to compose `Tooltip.Trigger` props with
  `onclick` handlers, ensuring both tooltip behavior and user actions fire.
- Absolute-positioned div inside scene container, `top-4 right-4 z-10`, vertical flex column
- Buttons: theme cycle (Sun/Moon/Monitor icons), reset to defaults, randomize seed
- Save button shown in single editor only (not scene editor)
- Uses shadcn Button with `variant="outline" size="icon"`

### 14.7 3-Tier Settings Control (Basic / Intermediate / Advanced)

Segmented control at top of settings panel using shadcn-svelte Tabs or ToggleGroup.
Tiers are **additive** — higher tiers show all controls from lower tiers plus their own.
Persistent per session.

**Basic** (casual users, quick results):

- Shape, Stage
- Trunk Height, Trunk Thickness
- Canopy Size, Blob Count
- Colors (canopy light/dark + trunk)
- Fruit Count
- Light Angle

**Intermediate** (tuning proportions):

- All Basic controls +
- Trunk Segments, Trunk Crookedness
- Branch Depth, Branch Angle
- Branch/Trunk Length Ratio, Branch/Trunk Thickness Ratio

**Advanced** (full control):

- All Intermediate controls +
- Seed
- Trunk Lean, Crookedness Mode (alternating/random)
- Branch Segments, Branch Crookedness
- Branch Length Variance
- Polygons Per Blob, Blob Closeness
- Per-blob custom editor (custom shape only)

### 14.8 Disabled Sliders

- **REQ-S-12** When a parameter has no effect for the selected shape, its slider is visually
  disabled (grayed out, not interactive). Examples:
    - Pine: `branchCount` disabled (always 0)
    - Fir: `branchCount` disabled (always 0)
    - Pine/Fir: `trunkBranchRatio` disabled
    - `trunkCrookedness` disabled when `trunkSegments = 1`
    - `blobCloseness` disabled for branching shapes (oak, birch, maple, willow, apple, cherry,
      baobab, acacia) — closeness is moot when blob positions are driven by branch-tip clusters

### 14.9 Color Picker UI

- **REQ-S-13** Canopy color pickers use native `<input type="color">` styled to match shadcn
  design. Each picker shows a colored swatch preview + hex value text.
- **REQ-S-14** Trunk color preset swatches are rendered as small colored buttons in a row.
  Clicking a swatch sets the 3 trunk HSL sliders simultaneously.

### 14.10 Settings Persistence (localStorage)

- `Persisted<T>` class in `src/lib/reactivity/persisted.svelte.ts` handles localStorage + cross-tab sync
- One `Persisted` instance per config type with `jsonSerde` validator:
    - `'tree-config'` → TreeConfig
    - `'scene-config'` → SceneConfig (treeCount, depthSpread, baseSeed)
    - `'environment-config'` → EnvironmentConfig
    - `'editor-view-state'` → EditorViewState (debug toggles, animation toggles)
    - `'overlay-config'` → OverlayPersistedState
- Custom type-guard validators (`isValidTreeConfig`, etc.) in `src/lib/config/validators.ts`
- Cross-tab sync: each context listens for `StorageEvent` and applies changes from other tabs
- First visit falls back to defaults; reset button clears persisted values

### 14.11 Reset to Defaults

- **REQ-PRD7-13** A "Reset to [Species] defaults" button below the Tree Type dropdown in the
  Shape card. Label updates dynamically (e.g., "Reset to Oak defaults"). Reset formula:
  `{ ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS[shape], seed, shape }` — applies
  `DEFAULT_TREE_CONFIG` as full baseline then overlays shape-specific tuning. Preserves only
  `seed` and `shape`. Works for all species (skips custom).

### 14.12 All Sliders

- All sliders use shadcn-svelte Slider component
- Dual-thumb sliders for per-level branch count ranges
- Per-shape defaults load when shape changes

---

## 15. Navigation & Sidebar

### 15.1 Sidebar

- **REQ-NAV-01** / **REQ-PRD7-19** The application uses the shadcn-svelte **`sidebar-07`** block
  with `collapsible="offcanvas"` (full-hide — sidebar disappears completely when collapsed).
  Integrated into `src/routes/+layout.svelte`. Collapsed/expanded state persisted via
  `sidebar:state` cookie (7-day max-age), read in `+layout.server.ts`. Desktop defaults to
  expanded; mobile defaults to collapsed.
- **REQ-NAV-02** Sidebar includes links to all pages:
    - Single Tree Editor (`/showcase`)
    - Scene Editor (`/showcase/scene`)
    - Gallery (`/gallery`)
- **REQ-NAV-04** The sidebar renders on **every route**. The Gallery link redirects anonymous
  users to `/auth` server-side.
- **REQ-NAV-05** / **REQ-PRD7-06** / **REQ-PRD7-09** The sidebar has a visible `Sidebar.Trigger`
  icon button positioned outside the sidebar in `Sidebar.Inset`. Icon switches between
  `PanelLeft` (collapsed) and `PanelLeftClose` (expanded). Navigation icons are horizontally
  centered within the collapsed sidebar with equal padding from both side borders. Icon size
  matches the visual weight of floating button icons.

### 15.2 User Dropdown

- **REQ-NAV-03** / **REQ-PRD7-20** Sidebar has a bottom user section:
    - When signed out: Guest avatar (User icon) with "Guest" label, theme submenu, and "Sign in"
      link to `/auth`
    - When signed in: user avatar, name, sign-out button, theme submenu
    - Dropdown contents: user info, settings link, theme submenu (Light/System/Dark), sign out
    - Collapsed sidebar: avatar remains as trigger

### 15.3 Theme Switching

- **REQ-PRD7-05** Theme switcher cycles light → dark → system → light, applying changes
  immediately via `mode-watcher` (`setMode()`). Theme persists across page navigation.

---

## 16. Authentication

- **REQ-AUTH-01** Implement BetterAuth for user authentication.
- **REQ-AUTH-02** Supported auth methods: Google OAuth, GitHub OAuth, Passkey (WebAuthn).
- **REQ-AUTH-02a** Sign-in and sign-up collapse to a **single flow**: first successful
  OAuth/Passkey auth creates the user row; subsequent auths sign the user in.
- **REQ-AUTH-03** Auth state is available server-side via hooks and client-side via auth client.
- **REQ-AUTH-04** User session data is stored in the database (PostgreSQL via Drizzle ORM).
- **REQ-AUTH-05** The `/auth` route is a single page with three primary buttons:
    1. "Continue with Google" → `authClient.signIn.social({ provider: 'google' })`
    2. "Continue with GitHub" → `authClient.signIn.social({ provider: 'github' })`
    3. "Continue with Passkey" → `authClient.signIn.passkey()` (falls back to registration flow)
- **REQ-AUTH-06** Sign-out is a server action at `/auth/sign-out` (POST) that calls
  `auth.api.signOut()` and redirects to `/`.
- **REQ-AUTH-07** Required environment variables: `AUTH_SECRET`, `ORIGIN`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
  Document in `.env.example`.
- **REQ-AUTH-08** Drizzle auth schema in `src/lib/server/db/auth.schema.ts` includes Passkey
  plugin tables. Generated via `pnpm dlx @better-auth/cli generate` and committed alongside a
  Drizzle migration.
- **REQ-AUTH-09** Sign-in flow for all providers (Google OAuth, GitHub OAuth, passkey) must
  handle session persistence, OAuth callback handling, and redirect logic reliably without
  intermittent failures.

---

## 17. Gallery & Persistence

### 17.1 Save Mechanism

- **REQ-SAVE-01** A "Save" button in the single tree editor (placed at top of controls panel
  beside shape picker) saves the current `TreeConfig` to the database.
- **REQ-SAVE-02** Saved trees are associated with the authenticated user. Anonymous users
  cannot save — the button is disabled with a "Sign in to save" tooltip.
- **REQ-SAVE-03** Each saved tree stores: all `TreeConfig` fields as a JSONB snapshot, an
  auto-generated name, creation timestamp, `updatedAt` timestamp, and user ID. Row identified
  by a nanoid primary key.
- **REQ-SAVE-03a** Auto-name format: **`"{Shape} #{N}"`** where `Shape` is the capitalized tree
  shape and `N` is the next sequential integer scoped to that user + shape.
- **REQ-SAVE-04** The `saved_trees` table Drizzle schema:
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
    Lives in `src/lib/server/db/saved-trees.schema.ts`. A Drizzle migration is committed in
    `src/lib/server/db/migrations/`.
- **REQ-SAVE-05** Forward-compatibility: on restore, stored JSONB is merged with
  `DEFAULT_TREE_CONFIG`: `{ ...DEFAULT_TREE_CONFIG, ...stored.config }`. New fields inherit
  defaults on old saved rows.

### 17.2 Gallery Page

- **REQ-GALLERY-01** `/gallery` displays the authenticated user's saved trees. Anonymous access
  redirects to `/auth`.
- **REQ-GALLERY-02** Each saved tree is rendered as a preview thumbnail:
  `<LowPolyTree {...savedTree.config} />`, sized to a fixed 200x200 aspect square with
  `overflow: hidden`. Displays tree name (inline-editable) and relative creation date
  (e.g., "2 hours ago" via `Intl.RelativeTimeFormat`).
- **REQ-GALLERY-03** Clicking a saved tree navigates to **`/showcase?saved=<id>`**. The load
  function reads the `saved` query param, fetches the row by id (404 if not owned by current
  user), merges config with `DEFAULT_TREE_CONFIG`, and passes as `data.initialConfig`.
- **REQ-GALLERY-04** Users can delete saved trees via a trash icon. Delete triggers a confirmation
  dialog before the server delete action runs.
- **REQ-GALLERY-05** Gallery is user-specific — scoped by `event.locals.user.id`. Delete and rename
  actions enforce ownership server-side.
- **REQ-GALLERY-06** Gallery cells: `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`.
- **REQ-GALLERY-07** Inline rename: single-click on the tree name turns it into an `<input>`;
  blur or Enter commits via a rename server action with ownership check. Escape cancels.

### 17.3 Server CRUD Module

- **REQ-SAVE-06** All `saved_trees` database access goes through `src/lib/server/saved-trees.ts`:
    - `createSavedTree({ userId, shape, config })` — computes auto-name + inserts
    - `listSavedTrees(userId)` — returns rows ordered by `created_at DESC`
    - `getSavedTree(id, userId)` — returns single row scoped to user (404 on mismatch)
    - `deleteSavedTree(id, userId)` — deletes with ownership check
    - `renameSavedTree(id, userId, name)` — updates name with ownership check

---

## 18. Custom Tree

- **REQ-CUSTOM-01** The `'custom'` shape is available only in the single tree editor.
- **REQ-CUSTOM-02** `blobCount` (1-8) controls how many blobs are visible and editable. Each
  blob gets its own collapsible UI section in a card (shadcn-svelte Accordion with
  `type="multiple"`).
- **REQ-CUSTOM-03** Each custom blob is a `CustomBlob` record stored in
  `TreeConfig.customBlobs?: CustomBlob[]`:
    - `boundaryKind`: one of `'circle' | 'egg' | 'teardrop' | 'isoscelesTriangle' | 'equilateralTriangle'`
    - `rotationDeg`: `number` in `[0, 360]`, step 5
    - `sizeScale`: `number` in `[0.5, 2.0]`, step 0.05 (UI shows 50%-200%); scales `rx` and `ry` uniformly
    - `position`: `{ x: number; y: number }` with each axis in `[-1, +1]`, step 0.05
- **REQ-CUSTOM-03a** Position is **normalized** relative to canopy half-extent. `x = -1` →
  left edge; `x = +1` → right edge; `y = -1` → top; `y = +1` → bottom. At render time:
  `cx = canopyCenterX + position.x * spreadRadius`,
  `cy = canopyCenterY + position.y * spreadRadius`. Resolution-independent — survives
  `canopySize` slider changes without retuning.
- **REQ-CUSTOM-03b** Per-blob UI shows exactly 5 controls per blob:
    1. Boundary shape `<Select>` (5 options)
    2. Rotation `<input type="range" min="0" max="360" step="5">`
    3. Size `<input type="range" min="0.5" max="2" step="0.05">`
    4. Position X `<input type="range" min="-1" max="1" step="0.05">`
    5. Position Y `<input type="range" min="-1" max="1" step="0.05">`
- **REQ-CUSTOM-04** The `customBlobs` array is grown lazily. When UI `blobCount = M`, only
  indices `[0, M)` are rendered. When `blobCount` exceeds `customBlobs.length`, append new
  seeded entries (random position, `boundaryKind = 'circle'`, `rotationDeg = 0`,
  `sizeScale = 1.0`). Decreasing `blobCount` preserves trailing entries — growing back reveals
  previously tuned values.
- **REQ-CUSTOM-04a** Custom tree generation is deterministic. Seeded random is used **only** to
  initialize newly appended `customBlobs` entries. Once a blob has user-set values, those are
  authoritative and override seeded random on subsequent generation.
- **REQ-CUSTOM-05** All other tree parameters (branches, trunk, lighting, colors) apply normally.
  Custom trees use the generic `generateBranches()`.
- **REQ-CUSTOM-06** `SHAPE_DEFAULTS` has no entry for `'custom'`. When switching TO custom,
  current `TreeConfig` values carry through and `customBlobs` is lazily seeded. When switching
  AWAY, `customBlobs` is preserved but unused.
- **REQ-CUSTOM-07** Custom shape is excluded from scene-editor shape lists and shape-cycling
  helpers.

---

## 19. Library API

- Local workspace dependency (pnpm workspace `"workspace:*"`)
- Explicit barrel exports, no internal path reaching
- Exports:
    - `generateTree(config)` → `TreeGeometry`
    - `<LowPolyTree>`, `<PottedPlant>`, `<OakTree>`, `<TreeScene>` components
    - Overlay primitive components
    - Tool accessory components
    - Environment effect components
    - All TypeScript types (`TreeConfig`, `TreeGeometry`, `TreeAnchors`, `LifecycleStage`, etc.)
- JSDoc on all exports, strict types, no `any` leakage
- Single entry point for all exports

---

## 20. Environment Effects

7 effects, all scene-wide and independently toggleable:

- **Rain** — CSS-animated SVG lines, intensity slider (light to heavy), diagonal fall
- **Lightning** — random flashes 5-15s, 100-200ms white overlay, optional bolt SVG; accessibility-safe flash rate
- **Fireflies** — glowing dots, random walk + pulse, ~2/sec spawn, ~8s lifetime
- **Wind particles** — leaf/petal sprites drifting horizontally, rotation, varied size/opacity
- **Snow** — slow-falling white flakes, gentle horizontal drift, no accumulation
- **Sun rays** — semi-transparent diagonal gradient lines from upper corner, golden tone; works with `lightAngle`
- **Clouds** — low-poly polygon shapes (3-5 triangles), slow horizontal drift, sky area only

---

## 21. Overlay Primitives

Reusable SVG overlays. Visual shapes only — consumer applies semantics.

| Primitive      | Description                               | Snap Target       |
| -------------- | ----------------------------------------- | ----------------- |
| Storm Cloud    | dark low-poly cloud + optional rain drops | `crownTop`        |
| Speech Bubble  | rounded polygon with pointer              | `crownTop` offset |
| Celebration    | burst of confetti/sparkle particles       | `crownCenter`     |
| Wilting Effect | drooping/yellowing canopy modifier        | canopy group      |
| Glow Effect    | luminous outline around tree              | full tree group   |

- Standalone Svelte components, composable (multiple overlays per tree)
- Positioned relative to tree anchors

---

## 22. Root Connections

- SVG bezier curves between trees' `roots` anchors
- Organic/curved paths with slight randomness
- Visual states: connected (solid), disconnected (dashed/faded)
- Rendered below tree layer
- For sub-tree to oak/PRD tree connections

---

## 23. Ground Elements

- Toggle per tree: `groundElements: true/false`
- **REQ-PRD7-16** Generate 4-6 stones + grass tufts (twice the original 2-3) via seeded PRNG.
  Elements may overlap by less than 50% of their width (minimum spacing: `element_width × 0.5`).
- SVG assets in `assets/ground/`
- Elements avoid trunk base and tool areas
- Deterministic per seed

---

## 24. Grill Tool

- **REQ-PRD8-01** Add a "grill" tool (BBQ grill) to the tool system. Uses existing tool
  infrastructure: `ToolType`, `ToolDefinition`, snap point, pivot point, size slider.
- **REQ-PRD8-01a** Anchor target: `trunkBase` (same as shovel/axe/rake) with a slight x-offset
  so it sits beside the trunk.
- **REQ-PRD8-01b** Initial SVG is a placeholder (simple geometric shape — rectangle base with
  2-3 horizontal grate lines). Will be replaced with a polished SVG later.
- **REQ-PRD8-01c** Flame animation: 2-3 small SVG flame shapes above the grill. Flames fade
  in/out and sway slightly on a continuous loop. Activated by `animateTools` toggle (same as
  other tool animations). Each flame has slightly offset timing for organic feel.
- **REQ-PRD8-01d** Size range: 0.5-2.0 (same as existing tools). Default size: 1.0.
- **REQ-PRD8-01e** Follows all existing tool conventions: individual visibility checkbox in
  Tools & Accessories card, snap/pivot points editable via point editor.

**Acceptance Criteria:**

- Grill appears in tool list with visibility toggle
- Positioned at trunk base when visible
- Flame animation plays when `animateTools` is enabled
- Flames stop when `animateTools` is disabled
- Size slider controls grill scale
- Point editor supports grill snap/pivot point editing

---

## 25. Speech Bubble → Tool Migration

- **REQ-PRD8-02** Migrate speech bubble from overlay system to tool system. Remove from
  `OverlayPersistedState`; add to `ToolType` union and `ToolDefinition` map.
- **REQ-PRD8-02a** Shape: rectangular with rounded corners and a curved pointer/tail pointing
  downward toward the tree canopy top. The tail originates near the center or slightly to the
  right of the bubble, curves first to the right then back toward the canopy center. Replaces
  the current blob-shaped speech bubble.
- **REQ-PRD8-02b** Anchor target: `crownTop` (positioned above canopy). Has snap point, pivot
  point, and size controls like all other tools.
- **REQ-PRD8-02c** Text content: configurable via a text input in the tool settings area (appears
  when speech bubble tool is visible). Supports multi-line text via `\n`.
- **REQ-PRD8-02d** No animation for speech bubble (static tool).

**Acceptance Criteria:**

- Speech bubble appears in Tools & Accessories card (not Overlays card)
- Rectangular shape with rounded corners and curved tail pointing to canopy
- Text input visible when speech bubble is enabled
- Text renders inside the bubble
- Snap/pivot points editable in point editor
- Size slider works

---

## 26. Storm Cloud → Tool Migration

- **REQ-PRD8-03** Migrate storm cloud from overlay system to tool system. Remove from
  `OverlayPersistedState`; add to `ToolType` union and `ToolDefinition` map.
- **REQ-PRD8-03a** Redesign: replace current triangular procedural shape with 3-4 overlapping
  circles/ellipses in medium-dark gray. Style matches other tool SVGs (flat design, not
  necessarily low-poly).
- **REQ-PRD8-03b** Anchor target: `crownTop` (above canopy). Has snap point, pivot point, and
  size controls.
- **REQ-PRD8-03c** Rain is the tool's animation. When `animateTools` is enabled and storm cloud
  is visible, rain lines fall from the cloud. The separate `showRain` toggle is removed.
- **REQ-PRD8-03d** Rain animation: 12 lines falling from cloud bottom with staggered delays and
  variable speeds (reuse existing rain generation logic).

**Acceptance Criteria:**

- Storm cloud appears in Tools & Accessories card (not Overlays card)
- Cloud shape is circular/organic (not triangular)
- Rain plays as tool animation when `animateTools` is enabled
- No separate `showRain` toggle
- Snap/pivot points editable in point editor
- Size slider works

---

## 27. Seasonal Stage (Replaces Autumn)

- **REQ-PRD8-04** Replace the `autumn` stage with a `seasonal` stage. The `seasonal` stage
  renders differently based on whether the tree shape is evergreen or deciduous.
- **REQ-PRD8-04a** Tree classification:

    | Evergreen (→ snow)       | Deciduous (→ autumn colors)                                      |
    | ------------------------ | ---------------------------------------------------------------- |
    | pine, fir, cypress, bush | oak, birch, maple, willow, apple, cherry, baobab, acacia, custom |

- **REQ-PRD8-04b** Deciduous trees in `seasonal` stage: canopy colors shift to warm
  autumn tones (orange/red/brown). Uses existing autumn color logic (`canopyLightColor: #E8A028`,
  `canopyDarkColor: #8B2010`). Falling leaf particles active.
- **REQ-PRD8-04c** Evergreen trees in `seasonal` stage: snow rendering. White semi-transparent
  blobs/patches positioned on top of existing canopy blob positions. Canopy colors remain
  green (normal). No falling leaves.
- **REQ-PRD8-04d** Add an `isEvergreen` property to shape definitions (or derive from a
  lookup). Used by the `seasonal` stage modifier to branch rendering logic.
- **REQ-PRD8-04e** The `custom` shape defaults to deciduous behavior in `seasonal` stage.

**Acceptance Criteria:**

- `seasonal` stage replaces `autumn` in `TREE_STAGES` enum and UI
- Deciduous trees show autumn colors in seasonal stage
- Evergreen trees show snow patches in seasonal stage
- Each tree type gets a distinct visual change in seasonal stage
- Stage order: `...fruiting → seasonal → wilting → bare...`

---

## 28. Wilting Stage (Replaces Ready)

- **REQ-PRD8-05** Remove the `ready` stage. Add a `wilting` stage in its position
  (after `seasonal`, before `bare`).
- **REQ-PRD8-05a** Wilting stage applies: dramatic canopy color change to sickly yellow-brown
  (desaturated, hue-shifted), canopy size reduction to ~90% (signaling leaf loss has begun),
  and a slight 3° skew/droop via `skewY` transform. Affects all tree shapes.
- **REQ-PRD8-05b** Color change should be dramatic relative to `leafy` stage — clearly
  communicates "dying tree." Suggested colors: light `#c4a43a` (sickly yellow), dark `#5a3a1a`
  (dark brown).
- **REQ-PRD8-05c** Remove the wilting overlay from `OverlayPersistedState` and overlay
  components. Wilting is now exclusively a stage, not an overlay.
- **REQ-PRD8-05d** The glow effect remains as an overlay (not tied to any stage). Its existing
  API (`enabled`, `color`, `intensity`, `pulse`) is unchanged. BamGit uses it for hover
  effects or any other purpose.

**Acceptance Criteria:**

- `ready` stage removed from `TREE_STAGES`
- `wilting` stage added between `seasonal` and `bare`
- Wilting visuals: yellow-brown canopy, 90% canopy size, 3° droop
- Glow remains as an independent overlay
- Wilting overlay removed (functionality moved to stage)
- Stage lineup: seed → sprouting → sapling → growing → leafy → flowering → fruiting → seasonal → wilting → bare → dead → stump

---

## 29. Disabled Tree State

- **REQ-PRD8-06** Add a `disabled` boolean prop to `<LowPolyTree>` component. When `true`:
  CSS `filter: grayscale(1) opacity(0.5)` applied to the entire tree SVG, `pointer-events: none`
  set on the SVG element, no hover effects, no click handling.
- **REQ-PRD8-06a** Disabled trees render all their content (canopy, trunk, branches, tools,
  overlays) but everything appears greyed out.
- **REQ-PRD8-06b** `disabled` is independent of `stage` — any stage can be disabled.
- **REQ-PRD8-06c** In the showcase app, add a "Disable trees from row 2+" checkbox in the
  Debug card (scene editor only). When checked, all trees in rows 2-10 render with
  `disabled={true}`. Default: unchecked. This is a debug/demo feature.
- **REQ-PRD8-06d** The `disabled` prop is part of the library's public API surface for BamGit
  consumption.

**Acceptance Criteria:**

- `disabled` prop accepted by `<LowPolyTree>`
- Disabled trees are greyed out and non-interactive
- All content still renders (just visually muted)
- Debug checkbox in scene editor enables demo of disabled state
- Works with any stage

---

## 30. Avatar Settings

- **REQ-PRD8-07** Add user avatar settings: avatar preset selection (animal SVG) + background
  color. Stored in the database, tied to the authenticated user account.
- **REQ-PRD8-07a** Database: add two columns to the `user` table: `avatarPreset` (text, nullable,
  default null) and `avatarColor` (text, nullable, default null). Requires a Drizzle migration.
- **REQ-PRD8-07b** 10 animal avatar presets: cat, dog, fox, owl, bear, rabbit, penguin, deer,
  wolf, frog. Simple silhouette/outline style SVGs, uniform design language.
- **REQ-PRD8-07c** 10 preset background colors (muted/pastel tones suitable as avatar
  backgrounds) displayed as circular swatches. Plus a native `<input type="color">` picker as
  the 11th option for custom color. All swatches and the color picker trigger have the same size.
- **REQ-PRD8-07d** Avatar selection UI: new "Avatar" section on the Settings page. Animal
  presets displayed as circular swatches (matching the circular avatar shape in the sidebar).
  Color presets also displayed as circular swatches.
- **REQ-PRD8-07e** Sidebar display: when a user has an avatar set, the sidebar account circle
  shows the selected animal SVG on the chosen background color. Replaces the initials fallback.
- **REQ-PRD8-07f** Guest users: show a gray person silhouette (anonymous avatar) in the sidebar
  account circle. No avatar settings for guests. No localStorage fallback.
- **REQ-PRD8-07g** On account creation, assign a random animal preset + random color from the
  10 presets. Each new user gets a unique-looking default avatar.
- **REQ-PRD8-07h** Avatar changes persist immediately to the database (no separate save button —
  selecting a swatch triggers an update).

**Acceptance Criteria:**

- Avatar section visible on Settings page (authenticated users only)
- 10 animal presets displayed as circular swatches
- 10 color presets + color picker displayed as circular swatches
- All swatches same size
- Selected avatar + color renders in sidebar account circle
- Guest users see anonymous silhouette
- New accounts get random avatar
- Changes persist to database immediately

---

## 31. Point Editor Fixes

- **REQ-PRD8-08** Fix all outstanding point editor issues from #145 and user-reported bugs.
  The point editor must be fully functional.
- **REQ-PRD8-08a** **Drag handle persistence:** When dragging snap point or pivot point handles,
  the handle must remain visible throughout the drag operation. Currently handles disappear
  during drag. Handles must stay rendered and follow the cursor.
- **REQ-PRD8-08b** **Live preview reactivity:** All changes in the point editor (size slider,
  snap point position, pivot point position) must be immediately reflected in the preview panel
  (left side). The preview tree must re-render in real-time showing the tool at its updated
  position/size.
- **REQ-PRD8-08c** **SVG upload immediate display:** When an SVG file is uploaded via the Upload
  button, it must immediately appear in both the snap/pivot points editor card and the preview
  panel. No manual refresh required.
- **REQ-PRD8-08d** **Upload button wiring:** Wire the Upload button to a file picker and a
  dev-only server endpoint. The endpoint accepts an `.svg` file, runs conversion logic (strip
  outer `<svg>` tag, namespace IDs), and writes the resulting `.svelte` component file to disk.
  Page hot-reloads after write.
- **REQ-PRD8-08e** **Apply button wiring:** Wire the Apply button to a dev-only server endpoint.
  The endpoint receives updated definition values (snap offset, pivot point, scale) and writes
  them back to the appropriate TypeScript definition files (`tool_definitions.ts`,
  `fruit_definitions.ts`, etc.).
- **REQ-PRD8-08f** **Definition files as source of truth:** Refactor the rendering pipeline to
  consume definition files (`tool_definitions.ts`, `fruit_definitions.ts`, `flower_definitions.ts`,
  `ground_definitions.ts`, `stage_definitions.ts`, `overlay_definitions.ts`) as the single source
  of truth. Remove parallel component maps (`FRUIT_SVG_COMPONENTS`, `FLOWER_SVG_COMPONENTS`, etc.).
- **REQ-PRD8-08g** **CLI interface alignment:** Align the SVG conversion script CLI to use
  positional args (`pnpm run convert-svg <input> <name>`) as specified, or update documentation
  to match the current named-flag interface. Pick one and be consistent.
- **REQ-PRD8-08h** Rename the "Demo Preview" card/section to just "Preview."

**Acceptance Criteria:**

- Drag handles stay visible during drag operations
- Preview updates in real-time when snap/pivot points are dragged
- Preview updates in real-time when size slider changes
- Uploaded SVG appears immediately in editor and preview
- Upload button opens file picker and writes converted `.svelte` file
- Apply button writes updated definitions to TypeScript source files
- Rendering pipeline uses definition files (no parallel component maps)
- CLI interface is consistent with documentation
- Card renamed to "Preview"

---

## 32. Ground Element Controls

- **REQ-PRD8-09** Add a count slider to ground elements: range 1-20, default 4-6 (current
  generation count). Controls how many ground elements (grass + stones) spawn per tree.
- **REQ-PRD8-09a** Add a size slider to ground elements: range 0.5-2.0, step 0.1, default 1.0.
  Scales all ground element SVGs uniformly.
- **REQ-PRD8-09b** Ground elements remain in the overlay/ground system (not migrated to tools).
  The two new sliders appear in the ground elements config area within the Overlays card.
- **REQ-PRD8-09c** Both sliders are disabled when ground elements are toggled off.

**Acceptance Criteria:**

- Count slider (1-20) controls number of spawned elements
- Size slider (0.5-2.0) controls element scale
- Sliders appear in Overlays card ground section
- Sliders disabled when ground elements off
- Changes reflected in real-time preview

---

## 33. UI Layout: Resizable Panels

- **REQ-PRD8-10** Install `paneforge` via `npx shadcn-svelte@latest add resizable`. Use the
  shadcn-svelte `Resizable` component (PaneGroup + Pane + PaneResizeHandle) to create a
  draggable divider between the scene/preview area and the settings panel.
- **REQ-PRD8-10a** Scene editor (multi-tree, `/`): default ratio 30% scene / 70% settings.
- **REQ-PRD8-10b** Single tree editor (`/editor`): default ratio 50% scene / 50% settings.
- **REQ-PRD8-10c** Minimum scene height: defined as a pixel constant (e.g., `MIN_SCENE_HEIGHT = 180`)
  that can be easily adjusted. Enforced via `minSize` prop on the scene pane.
- **REQ-PRD8-10d** User's drag ratio persisted to localStorage (separate keys for scene editor
  and single tree editor). Restored on page load.
- **REQ-PRD8-10e** Direction: vertical (`direction="vertical"`) — divider is horizontal, user
  drags up/down.
- **REQ-PRD8-10f** Resize handle styled to match the app theme — subtle, non-intrusive.

**Acceptance Criteria:**

- Draggable divider between scene and settings on both editor pages
- Scene editor defaults to 30/70
- Single tree editor defaults to 50/50
- Minimum scene height enforced
- Ratio persisted in localStorage
- Keyboard accessible (paneforge built-in)

---

## 34. UI Layout: Card Reorder & Animate Tools Migration

- **REQ-PRD8-11** Move the "Animate Tools" checkbox from ToolAccessoriesCard into
  AnimationsCard. AnimationsCard controls become: Canopy Sway, Branch Movement, Growth,
  Growth Variance, Animate Tools.
- **REQ-PRD8-11a** Reorder settings cards so AnimationsCard is directly after ToolAccessoriesCard.
  New order (both editors): `...ToolAccessoriesCard → AnimationsCard → DebugCard → OverlaysCard`.
- **REQ-PRD8-11b** Apply the same card reorder and checkbox migration to both the single tree
  editor (`/editor`) and the scene editor (`/`).

**Acceptance Criteria:**

- "Animate Tools" checkbox removed from ToolAccessoriesCard
- "Animate Tools" checkbox added to AnimationsCard
- AnimationsCard immediately follows ToolAccessoriesCard in both editors
- No duplicate controls

---

## 35. UI: Color Swatch Sizing & Trunk Presets

- **REQ-PRD8-12** Unify color swatch sizes: all canopy color swatches and trunk color preset
  swatches use `h-9 w-9` (36×36px). This matches the measured height of the text input next
  to the canopy color swatches. Swatches remain square with rounded corners.
- **REQ-PRD8-12a** The color picker trigger (native `<input type="color">`) wrapper also uses
  `h-9 w-9` to match swatch sizes.
- **REQ-PRD8-12b** Add 4 new trunk color presets:

    | Swatch        | `trunkHue` | `trunkSaturation` | `trunkLightness` |
    | ------------- | ---------- | ----------------- | ---------------- |
    | Black         | 0          | 0                 | 10               |
    | Dark charcoal | 0          | 5                 | 20               |
    | Golden        | 45         | 50                | 50               |
    | Pale yellow   | 50         | 35                | 65               |

    Total trunk presets: 10 (6 existing + 4 new).

**Acceptance Criteria:**

- All canopy swatches are 36×36px (`h-9 w-9`)
- All trunk swatches are 36×36px (`h-9 w-9`)
- Color picker triggers are 36×36px
- 10 trunk color presets visible
- Swatches remain square with rounded corners

---

## 36. UI: Disabled Slider Styling

- **REQ-PRD8-13** Disabled sliders must show `cursor-not-allowed` on the entire slider track
  and thumb. The thumb (drag handle) must not show a highlight/hover effect when the slider
  is disabled.
- **REQ-PRD8-13a** Use the bits-ui `Slider` component's built-in `disabled` prop. Apply
  additional CSS via `data-disabled` attribute selectors: `data-[disabled]:cursor-not-allowed`
  on track and thumb, remove hover highlight on thumb when disabled.
- **REQ-PRD8-13b** Existing `data-disabled:opacity-50` behavior is preserved.

**Acceptance Criteria:**

- Disabled slider shows `cursor-not-allowed`
- Disabled slider thumb has no hover highlight
- Disabled slider remains visually dimmed (opacity 50%)
- Works for all disabled sliders across the app

---

## 37. Depth Spread Maximum

- **REQ-PRD8-14** Change `depthSpreadMax` from 100 to 30 in `scene_config.ts`. 30 is the new
  maximum for the depth spread slider in the scene editor.

**Acceptance Criteria:**

- Depth spread slider max is 30
- Existing persisted values > 30 are clamped to 30 on load

---

## 38. Library API Update

- **REQ-PRD8-15** Update issue #67 and the library boundary plan for the current state of the
  repository. Focus areas:
    - Tool components exported with their definitions (including new grill, migrated speech bubble,
      migrated storm cloud)
    - Overlay components exported (glow, celebration, ground elements)
    - Animation controls exported (canopy sway, branch movement, growth, tool animations)
    - `disabled` prop on `<LowPolyTree>` as part of public API
    - `seasonal` stage with `isEvergreen` classification exposed
- **REQ-PRD8-15a** All public API types must include the new tool types (`grill`, `speechBubble`,
  `stormCloud`), the `seasonal` stage, the `wilting` stage, and the `disabled` prop.
- **REQ-PRD8-15b** Library consumer should be able to:
    - Render a tree with any combination of tools visible
    - Control tool animations via a single boolean
    - Enable/disable glow overlay programmatically (for hover effects)
    - Set a tree to disabled state
    - Set any stage including seasonal (with automatic evergreen/deciduous behavior)
- **REQ-PRD8-15c** No BamGit-specific logic in the library. The `disabled` prop and glow
  overlay are generic — BamGit assigns meaning to them.

**Acceptance Criteria:**

- Issue #67 updated with current API surface
- All new tools/stages/props included in planned exports
- Consumer can control tools, overlays, animations, and disabled state from outside the library
