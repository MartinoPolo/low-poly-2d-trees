# Requirements

Canonical source of truth for what the system should do.
GitHub issues track execution; this file tracks the specification.
Sections marked **[NOT IMPLEMENTED]** are planned but not yet built.

---

## 1. Architecture & Tech Stack

- SvelteKit + Svelte 5 runes, TypeScript strict, Tailwind CSS, shadcn-svelte
- SVG-only rendering with CSS animations (GPU accelerated via `will-change: transform`)
- Seeded PRNG for deterministic generation — same seed = same tree
- Drizzle ORM (PostgreSQL, strict mode)
- better-auth with passkey, Google/GitHub OAuth
- Pure visualization library — no external concept dependencies (git, issue states, etc.)

---

## 2. Rendering

### 2.1 SVG Output

- **REQ-R-01** Render each tree as a single `<svg>` element with a fixed viewBox of `500x500`.
  SVG overflow is hidden — content beyond the viewBox is clipped.
  Geometry constants are scaled to 300-equivalent so visual size is unchanged; the larger
  viewBox provides headroom for overlays.
- **REQ-R-02** The SVG contains five z-order render layers for branching shapes (painter's order):
  back branches, trunk quads, front branches, back canopy blobs, front canopy blobs.
  Branchless shapes retain the original 3-layer model: `trunk`, `branches`, `canopy`.
  (See REQ-EV2-Z-04 for full z-ordering specification.)
- **REQ-R-03** The `canopy` group contains one `<g>` child per blob/tier, ordered back-to-front
  by depth index (blobs rendered later appear in front).
- **REQ-R-04** Each polygon in the output has a `color` expressed as a hex string (`#rrggbb`),
  a `group` tag (`'canopy' | 'trunk' | 'branch'`), and either three (`Triangle`) or four
  (`Quad`) `Point2D` vertices. Trunk/branch segments produce quads.

### 2.2 Deterministic Generation

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
- **REQ-P-41** `trunkTwist` — default 10. Controls cumulative rotational
  drift of strips along the trunk. At 100%, faces can fully rotate in/out of view.
- **REQ-P-42** `branchWidthVariance` — Controls spread of individual branch widths. At 0%:
  all branches at same width ratio. At 50%: +/-50% random spread. Disabled when `branchDepth === 0`.

### 3.4 Branch Parameters

| Parameter             | Type                        | Default         | Range   | Notes                                      |
| --------------------- | --------------------------- | --------------- | ------- | ------------------------------------------ |
| `branchDepth`         | `number`                    | per-shape       | 0 – 3   | Max branching depth                        |
| `branchesLevel1Range` | `[min, max]`                | per-shape       | —       | Dual-thumb range slider for L1 count       |
| `branchesLevel2Range` | `[min, max]`                | per-shape       | —       | Dual-thumb range slider for L2 count       |
| `branchesLevel3Range` | `[min, max]`                | per-shape       | —       | Dual-thumb range slider for L3 count       |
| `branchAngle`         | `number`                    | per-shape       | 0 – 100 | 0% = wide horizontal, 100% = narrow upward |
| `branchSegments`      | `number`                    | per-shape       | 1 – 3   | Segments per branch                        |
| `branchCrookedness`   | `number`                    | per-shape       | 0 – 100 | Per-branch crookedness                     |
| `crookednessMode`     | `'alternating' \| 'random'` | `'alternating'` | —       | Alternating S-curves vs random direction   |

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

### 3.7 Per-Shape Defaults

| Shape    | `blobCount` | `branchCount` | `blobSizeVariance` | `blobCloseness` | `trunkSegments` | `trunkCrookedness` | `branchThickness` |
| -------- | ----------- | ------------- | ------------------ | --------------- | --------------- | ------------------ | ----------------- |
| `oak`    | 5           | 2             | 3.0                | 50              | 1               | 0                  | 100               |
| `pine`   | 3           | 0             | 3.0                | 60              | 1               | 0                  | 100               |
| `birch`  | 3           | 1             | 3.0                | 50              | 1               | 0                  | 100               |
| `fir`    | 4           | 0             | 3.0                | 50              | 1               | 0                  | 100               |
| `maple`  | 5           | 5             | 2.0                | 30              | 1               | 0                  | 100               |
| `willow` | 4           | 4             | 3.0                | 50              | 3               | 40                 | 150               |

Additional shapes (cypress, apple, cherry, bush, baobab, acacia, custom) have defaults tuned per shape — see section 4.

### 3.8 Per-Shape Default Colors

| Shape    | `canopyLightColor` | `canopyDarkColor` | `trunkHue` | `trunkSaturation` | `trunkLightness` |
| -------- | ------------------ | ----------------- | ---------- | ----------------- | ---------------- |
| `oak`    | `#a8d84e`          | `#1a472a`         | 25         | 50                | 25               |
| `pine`   | `#4a9e5c`          | `#0d2b1a`         | 20         | 45                | 20               |
| `birch`  | `#b8e065`          | `#2d5e3a`         | 40         | 15                | 80               |
| `fir`    | `#3d8b50`          | `#0a2418`         | 22         | 50                | 28               |
| `maple`  | `#e8a028`          | `#8b2010`         | 30         | 20                | 35               |
| `willow` | `#7cc45a`          | `#1a4020`         | 25         | 40                | 22               |

### 3.9 Trunk Color Preset Swatches

| Swatch      | `trunkHue` | `trunkSaturation` | `trunkLightness` |
| ----------- | ---------- | ----------------- | ---------------- |
| Light birch | 40         | 20                | 75               |
| Warm brown  | 25         | 50                | 35               |
| Dark brown  | 20         | 55                | 20               |
| Red-brown   | 10         | 45                | 30               |
| Gray        | 0          | 5                 | 45               |
| White       | 0          | 0                 | 90               |

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
  with `a = 0.15` (narrows the top); bottom half (`t >= 0`) -> `x(t) = rx * sqrt(1 - t^2) * (1 + b * t)`
  with `b = 0.15` (widens the bottom). `y(t) = ry * t`. a and b may be tuned for visual fit
  during implementation.
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
  (360 deg around main blob). Non-primary blobs maintain a
  minimum distance from the trunk center axis of `|cx - trunkCenterX| >= 0.15*W` to reduce
  excessive overlap near the trunk. Rejected samples are re-rolled up to 5 times before being
  clamped outward.

### 5.8 Birch Canopy Width

- **REQ-C-19** For `shape = 'birch'`, blob horizontal radius (`rx`) range is
  `W * 0.12 - W * 0.24`.

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

### 5.11 Per-Species Canopy Envelope Retuning

- Increase envelope base radii (`baseRadiusX`, `baseRadiusY`) to 1.8x for all leafy/branching-canopy trees: oak, birch, maple, willow, apple, cherry, baobab, acacia
- Pine/fir: reduce tier width constants to produce narrower canopy — adjust the `baseHalfWidth` formula coefficients in `tiers.ts`
- The `canopySize` slider default stays at 100% for all species — the underlying generation constants change so 100% produces the correct canopy
- Ensure default envelope radii do not cause canopy blobs to overflow the 300x300 viewbox; users can push past bounds via the slider

### 5.12 Floating Blob Repositioning

- Enable floating blob detection for branching-canopy shapes (oak, birch, maple, willow, apple, cherry, baobab, acacia)
- Reposition isolated blobs toward their nearest overlapping neighbor blob until they overlap (instead of creating emergency fallback branches)
- A blob is "isolated" if it does not overlap any other blob AND no branch tip reaches it

### 5.13 Branch Tip Trimming to Canopy Boundary

- After clustering, trim branch tip endpoints that extend past their associated canopy blob boundary
- Project the tip back onto the blob ellipse along the branch direction
- Branches visually "go into" the canopy but do not poke out the other side

### 5.14 L2/L3 Branch Length Reduction

- Reduce L2 branch length by 15% (change `CHILD_LENGTH_RATIO_MAX` from 0.8 -> ~0.68 or apply a 0.85 multiplier)
- Reduce L3 branch length by 30-40% — L3 branches are noticeably short stubs
- Ensure the reduction is compatible with `branchLength` and `branchLengthVariance` slider ranges

### 5.15 Pine-Specific Tuning

- Pine default `blobCloseness` = 60 for better tier overlap
- Slightly increase tier `ry` (vertical thickness) so tiers visually overlap without gaps
- Tier width reduction via `baseHalfWidth` constants (see envelope retuning above)

### 5.16 Blob Count Slider Expansion

- Blob count slider max = 25 for all species
- The existing inverse-sqrt scaling (`targetRadius = sqrt(envelopeArea / blobCount / pi)`) handles sizing
- Enforce a minimum blob radius so blobs remain visible at high counts
- Keep per-species default blob counts unchanged (oak=5, birch=6, etc.)

### 5.17 Reset to Defaults Button

- Add a "Reset to [Species] defaults" button below the Tree Type dropdown in the Shape card
- Label updates dynamically based on current species (e.g., "Reset to Oak defaults")
- Reset all parameters (geometry, colors, branch config, fruit) to `SHAPE_DEFAULTS` for the current species
- Preserve the species itself and the seed

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
- **L** Trunk tip connects to a Level-1 branch or the nearest canopy blob — trunk always ends with a visual connection to canopy. For shapes with `branchDepth=0` (bush, cypress, pine, fir), trunk tip connects directly to lowest/nearest blob. Complements Rule G.

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
  accumulate: - **Base randomness** — always present. Even at `trunkTwist=0`, strip widths are non-uniform
  (organic, not mechanical 25/50/25). Seeded per-junction. - **Twist** — cumulative rotational drift from base to tip, plus a per-junction random
  perturbation. `trunkTwist` slider controls magnitude of both drift rate and perturbation.
  At `trunkTwist=0` only base randomness applies. At `trunkTwist=100%` both are at maximum.

- **REQ-EV2-S-03** The twist model is **hybrid cumulative**: a base angle starts at a seeded
  random value and drifts at each junction by a small twist delta (proportional to
  `trunkTwist`). On top of the cumulative drift, each junction gets an additional random
  perturbation. This produces organic spirals rather than mechanical rotation.

### 6.9 Cross-Section Model

- **REQ-EV2-X-01** The trunk is modeled as a regular polygon cross-section projected onto the
  screen plane. The number of visible (front-facing) strip faces = `trunkStripCount` (config
  param REQ-P-40, range 2-4, default 3). The total number of cross-section faces =
  `2 * trunkStripCount`.

- **REQ-EV2-X-02** At maximum twist, strip faces can fully rotate out of view (width -> 0) and
  new faces can appear on the opposite side. Buffer strips on each side of the visible range
  are maintained at 0 width by default and grow positive when another strip rotates out. This
  is analogous to a cylinder rotating — faces cycle in and out of the viewer-facing hemisphere.

- **REQ-EV2-X-03** `trunkTwist` default is **10%**. This gives all trees
  subtle strip variation out of the box. Per-shape SHAPE_DEFAULTS override as appropriate.

### 6.10 Junction Geometry

- **REQ-EV2-J-01** At each internal trunk junction, the segment boundary is perpendicular to
  the **angle bisector** between the incoming and outgoing segment directions. This tilts the
  boundary at crooked junctions, producing natural-looking bends instead of horizontal cuts.
  Base junction (no incoming segment): boundary perpendicular to first segment direction.
  Tip junction (no outgoing segment): boundary perpendicular to last segment direction.

- **REQ-EV2-J-02** All junction points — outer edges AND internal strip split points — are
  **shared** by both adjacent segments. Zero gaps guaranteed by construction. Both the segment
  below and the segment above reference the exact same 4+ Point2D values at each junction.

- **REQ-EV2-J-03** Trunk width at each junction is measured **perpendicular to the bisector
  direction**, not horizontally. This prevents the trunk from appearing to pinch or bulge at
  bends.

### 6.11 Trunk Taper

- **REQ-EV2-T-01** Trunk taper uses a **hybrid** model with two narrowing forces: - **Gentle base taper** — slow natural conical narrowing along the full trunk length,
  present even on branchless trunks. Much less aggressive than linear taper. - **Fork taper** — discrete width reduction at each branch junction, proportional to
  branch depth (see REQ-EV2-F-04).
  Both compound. A branchless trunk narrows gently; a heavily-branched trunk narrows faster.

- **REQ-EV2-T-02** The existing `trunkTopWidth` in shape definitions becomes the **minimum
  floor**. The trunk can never narrow below this value regardless of how many forks occur.
  The actual top width = result of base taper + accumulated fork reductions, clamped to floor.

- **REQ-EV2-T-03** The `trunkThickness` slider continues to scale the base width. It does NOT
  scale the fork reductions — only the starting width.

### 6.12 Two-Zone Trunk Segments

- **REQ-EV2-TZ-01** The trunk is divided into two zones: - **Upper zone (branch zone)** — contains junctions where L1 branches can spawn. Segment
  count = `max(branchesLevel1Range[1], 2)` (enough junctions for max L1 branch count,
  minimum 2). - **Lower zone (bare trunk)** — below the branch zone. Gets the remaining segments. Minimum
  1 segment. Still has twist variation and crookedness.
  The boundary between zones IS the branch zone boundary — branches can ONLY spawn at
  upper-zone junctions.

- **REQ-EV2-TZ-02** `trunkSegments` slider minimum is enforced:
  `trunkSegments >= upperZoneSegments + 1`. The user can add more segments for visual detail
  but cannot go below the minimum.

- **REQ-EV2-TZ-03** Updated SHAPE_DEFAULTS for `trunkSegments`:

| Shape   | Max L1 | Default | Zone Split (lower + upper) |
| ------- | ------ | ------- | -------------------------- |
| oak     | 3      | 5       | 1 + 4                      |
| maple   | 5      | 7       | 2 + 5                      |
| willow  | 5      | 7       | 2 + 5                      |
| cherry  | 4      | 6       | 1 + 5                      |
| birch   | 2      | 4       | 1 + 3                      |
| apple   | 2      | 3       | 1 + 2                      |
| baobab  | 3      | 5       | 1 + 4                      |
| acacia  | 3      | 5       | 1 + 4                      |
| pine    | 0      | 3       | unchanged (no branches)    |
| fir     | 0      | 3       | unchanged (no branches)    |
| cypress | 0      | 3       | unchanged (no branches)    |
| bush    | 0      | 3       | unchanged (no branches)    |

### 6.13 Bottom-Up Sequential Generation

- **REQ-EV2-G-01** Build the tree from base to tip in a **single bottom-up pass**: 1. Compute junction positions from crookedness + lean settings. 2. Starting from the base junction, process each junction upward. 3. At each upper-zone junction, determine if a branch spawns (pre-determined by seed). 4. If a branch spawns: compute fork width reduction, compute centerline displacement
  (trunk leans away from branch), update remaining trunk width. 5. Continue to next junction with updated width and position.

- **REQ-EV2-G-02** **Trunk reaction to branching:** at each fork, the trunk centerline above
  the fork displaces slightly **opposite** to the branch direction. Displacement is 2-5 px,
  proportional to the branch width fraction. Automatic physics — no slider.
  Alternating left-right branches (Rule I) naturally produce balanced trunks.

- **REQ-EV2-G-03** Branches can **only** spawn at trunk junctions in the upper zone. The number
  of potential L1 branch positions = number of upper-zone junctions. The fork point
  IS a junction with fully computed shared vertices.

### 6.14 Branch Fork Model

- **REQ-EV2-F-01** When a branch spawns, it emerges from the trunk via a **shared-vertex
  fork**. The branch's base quad outer corners coincide exactly with the trunk edge vertices
  at the fork height. Trunk strip count is preserved above the junction.
  The branch generates its own independent `trunkStripCount`-face strip system starting from
  the attachment.

- **REQ-EV2-F-02** **No junction collar by default.** The shared-vertex construction closes
  the junction without a transitional polygon. `junctionFills` remains part of the
  `BranchGeometry` type but is emitted empty for ordinary forks. If a visible V-wedge appears
  at wide-angle forks, a single interpolated fill triangle MAY be inserted with color
  `lerp(trunkStripColorAtForkHeight, branchStripColorAtBase, 0.5)`. Ship without the fill
  first and only reintroduce it if the wedge is visible.

- **REQ-EV2-F-03** **Same-junction forks:** when two branches share a junction (e.g.,
  alternating left+right from Rule I), they fork **sequentially** with a slight vertical
  stagger (few pixels offset). Each shared-vertex fork uses the trunk edge vertices at its
  own staggered height; the trunk-width reduction from the first fork is applied before the
  second fork reads the trunk edge.

- **REQ-EV2-F-04** **Fork width economics — depth-dependent fraction:** - L1 branches take ~15-20% of trunk width at the fork point. - L2 branches take ~10-15% of their parent L1 branch width at the fork point. - Width calculation is **sequential**: branch N's width is derived from trunk width at its
  attachment height, which already accounts for base taper + all forks below it. - Each branch gets randomness around the center fraction: `branchWidthVariance` (REQ-P-42)
  controls the spread. Individual branch width =
  `parentWidthAtForkPoint * (depthFraction +/- branchWidthVariance * random)`.

- **REQ-EV2-F-05** **Trunk tip behavior** is shape-dependent: - Shapes where trunk continues into canopy (oak, birch, maple, cherry, willow): trunk
  continues above the last fork at its remaining width. - Shapes where trunk terminates at a fork (baobab, acacia): trunk ends at uppermost fork. - Determined by existing `defaultTrunkTop` in shape definitions.

### 6.15 Branch Strip System

- **REQ-EV2-B-01** **L1 and L2 branches** use the full shared-vertex fork model (REQ-EV2-F-01):
  trunk/parent strip count preserved across the fork, branch starts an independent strip
  system at the attachment, width reduction applied at sub-branch forks.

- **REQ-EV2-B-02** **L3 branches** use a simplified model: plain quads attached at the parent
  branch's silhouette edge. No strip system, no fork geometry. L3 branches are too small for
  strip detail to be perceptible.

- **REQ-EV2-B-03** Branches inherit `trunkStripCount` from the trunk (same number of visible
  faces). Twist is **attenuated per depth**: L1 gets full `trunkTwist`, L2 gets ~50% of
  `trunkTwist`, L3 has no twist.

- **REQ-EV2-B-04** `branchSegments` is **auto-reduced per depth**: L1 gets the slider value,
  L2 gets `max(branchSegments - 1, 1)`, L3 always gets 1. Branch segment count minimum is
  enforced by sub-branch count (same logic as trunk).

### 6.16 Branch Angle & Width Variability

- **REQ-EV2-V-01** `branchAngle` slider controls the **center angle**. Each individual branch
  gets **+/-15 deg random variation** around the center. Shape-specific defaults via
  SHAPE_DEFAULTS inheritance (e.g., willow=30% -> branches range ~15-45 deg from horizontal).

- **REQ-EV2-V-02** Depth-based tapering uses hardcoded multipliers (L1=1.0x, L2=0.85x,
  L3=0.35x). `branchWidthVariance` (REQ-P-42) controls spread. Individual branch widths
  are seeded — no two L1 branches on the same tree have the same width.

- **REQ-EV2-V-03** Branch width variance produces visible but not extreme differences.
  A branch at the center ratio +/-50% (at max variance) still looks like a natural branch.
  The randomness is symmetric around the center ratio.

### 6.17 Rule L — Trunk Tip Connection

- **REQ-EV2-L-01** **Rule L enforced:** trunk tip always connects to a branch or canopy
  blob. For branchDepth=0 shapes (bush, cypress, pine, fir), trunk tip connects to the
  lowest/nearest canopy blob or tier.

- **REQ-EV2-L-02** Rule L is implemented as a post-generation validation step in
  `generateTree()`. If the trunk tip is exposed (no branch and not inside canopy), an
  emergency branch or connection is generated. Complements existing Rule G.

### 6.18 Disabled Params Updates

- **REQ-EV2-D-01** `trunkStripCount`: disabled for bush (bush disables all trunk controls).
- **REQ-EV2-D-02** `branchWidthVariance`: disabled when `branchDepth === 0`. Added to
  disabled lists for pine, fir, cypress, bush.

### 6.19 Tri-Split Face Lighting

- **REQ-EV2-LT-01** Each trunk/branch segment's strip faces get independent colors computed
  via dot-product lighting. Face normals are derived from the polygonal cross-section model
  (hexagonal for 3-strip, octagonal for 4-strip, etc.). - Left/right normals: segment perpendicular at 60 deg from forward (for 3-strip hex model).
  Adjusted for other strip counts. - Center normal: front-facing with seeded random +/-0.15 xy-perturbation for organic variety. - Lightness offset formula: `-10 + ((dot + 1) / 2) * 22` maps dot product to [-10, +12].

- **REQ-EV2-LT-02** Lighting is consistent across connected segments. Because strip ratios
  are junction-based and continuous, the color computation for adjacent segments at a shared
  junction produces consistent results. No visible color "seams" at segment boundaries.

- **REQ-EV2-LT-03** Branch lighting uses the same face-normal model as the trunk. The branch's
  segment direction determines the face normals. At a fork the shared-vertex construction
  joins trunk and branch without a tinted transition polygon; any optional fill added later
  (REQ-EV2-F-02) is colored by interpolation between trunk and branch strip colors.

### 6.20 Z-Ordering

- **REQ-EV2-Z-01** Classify branches as **front** (in front of trunk) or **back**
  (behind trunk) using light-angle-biased randomness: - Branches on the **lit side** (facing `lightAngle`): 70% chance of front placement. - Branches on the **shadow side**: 30% chance of front placement. - Classification is seeded for determinism.

- **REQ-EV2-Z-02** Back branches render **before** trunk quads in SVG order and receive a
  **-3 lightness offset** (subtle darkness for depth cue). Front branches render after trunk
  (no offset).

- **REQ-EV2-Z-03** L2 branches inherit their parent L1's front/back status by default, with
  a small seeded chance (~20%) of flipping.

- **REQ-EV2-Z-04** Five z-order render layers for branching shapes (painter's order): 1. Back branches (behind trunk) 2. Trunk quads 3. Front branches (in front of trunk) 4. Back canopy blobs (connected to back branches) 5. Front canopy blobs (connected to front/trunk branches)
  Branchless shapes retain the original 3-layer model (REQ-R-02).

- **REQ-EV2-Z-05** Each container geometry element (`Quad`, `BranchGeometry`,
  `BlobGeometry`) gains a `zOrder` field. The renderer sorts by z-order layer.
  **`Triangle` is explicitly waived** — triangles always inherit ordering from their parent
  `BlobGeometry` (whose `zOrder` governs the whole blob), or render in fixed pipeline slots
  (trunk/fruit/flower/stake). Per-triangle z-order has no consumer in the renderer.

### 6.21 Revised Generation Pipeline

- **REQ-EV2-P-01** For branching shapes, the generation pipeline is: 1. Build trunk path with two-zone segments (bottom-up, with fork reactions) 2. Fork L1 branches from trunk at upper-zone junctions 3. Fork L2 branches from L1 branches using same model 4. Generate L3 branches (simplified) 5. **Cluster branch tips into blob groups** 6. **Generate canopy blobs around cluster centroids** 7. **Assign z-order to all geometry elements**

- **REQ-EV2-P-02** Branchless shapes (pine, fir, cypress, bush) keep their **current
  generation system entirely**. Tier-based canopy for pine/fir, blob generators for
  bush/cypress.

### 6.22 Branch-Driven Canopy Blob Placement

- **REQ-EV2-BC-01** Given N branch tips (L1 + L2 + optional trunk tip), cluster them into M
  groups where M = `blobCount` slider value. Use a clustering algorithm (e.g., k-means or
  similar seeded algorithm). Each blob is centered on its cluster's centroid. - Tips close together share a blob (wide canopy supported by multiple branches). - Tips far apart get individual blobs. - `blobCount` slider meaning shifts from "number of ellipses" to "number of canopy
  clusters" — more intuitive.

- **REQ-EV2-BC-02** The trunk tip is included as a cluster point. For shapes like oak, the
  trunk tip has **higher weight** in the clustering (attracts a blob to itself = central
  crown). For shapes like maple, the trunk tip has low/zero weight (no central blob — maple's
  trunk tip is a fork point, not a canopy anchor).

- **REQ-EV2-BC-03** **Key visual requirement:** branches go into the **middle** of their
  blob. If a branch tip lands at the edge of a blob, the blob shifts to center on the tip.

- **REQ-EV2-BC-04** Weaker branches (higher depth levels) get **smaller blobs**. An L3 branch
  tip never anchors the biggest blob. Blob size correlates with the branch
  level/thickness of its strongest contributing branch tip.

### 6.23 Blob Sizing

- **REQ-EV2-BS-01** Blob base radius is determined by two factors combined: - **Cluster size** — more branch tips in a cluster -> larger blob radius. - **Branch thickness** — thicker branches (L1) produce larger blobs than thinner (L2, L3).
  `blobSizeVariance` adds seeded randomness on top.

- **REQ-EV2-BS-02** `canopySize` slider scales the **canopy envelope** smartly: - Adapts cluster boundaries so branches remain visible. - Small `canopySize` -> tight envelope, fewer tips covered, more bare branches visible
  (good for sapling/young tree stages). - Large `canopySize` -> wider envelope, more tips covered, lush canopy. - Branches remain visible at all canopy sizes.

### 6.24 Canopy Envelope

- **REQ-EV2-CE-01** Each shape defines a **canopy envelope** — a bounding region where blobs
  exist. Derived from the spatial patterns of blob generators.

- **REQ-EV2-CE-02** `canopySize` scales the envelope from its center (grows outward/upward,
  not downward into the trunk).

- **REQ-EV2-CE-03** The canopy envelope grows freely with `canopySize`. SVG overflow clipping
  (REQ-R-01) handles viewport bounds. `canopySize` slider capped at 200%.

- **REQ-EV2-CE-04** Branch tips **outside** the envelope: their blob is pulled back to the
  envelope edge (smaller blob at boundary). Tips very far outside get no blob — just bare
  branch poking out. Tips near the envelope center get larger blobs.

- **REQ-EV2-CE-05** The envelope serves as the "recommended space" for blobs. It adapts to
  `canopySize` and viewport, providing a smart boundary that prevents both overflow and
  branch-hiding.

### 6.25 Shape Style Parameters

- **REQ-EV2-SS-01** Each shape definition retains **style parameters** that control how
  branch-tip-derived blobs look: - `blobRxRyRatio`: controls blob shape (1.0 = round, 3.0+ = flat like acacia parasol). - `blobVerticalOffset`: shifts blobs relative to tip position (positive = droop downward,
  since SVG Y increases downward — used by willow). - `blobBoundary`: circle or teardrop (for cypress-style). - `blobClusterBehavior`: how aggressively nearby tips merge into shared blobs.

- **REQ-EV2-SS-02** Shape-specific identity preserved via style parameters:

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

- **REQ-EV2-SS-03** Some branch tips naturally lack blobs — those that fall outside
  the canopy envelope. This is acceptable and realistic (bare branch poking out of canopy).

### 6.26 Canopy Z-Ordering

- **REQ-EV2-CZ-01** Each canopy blob inherits z-order from its cluster's branches: - Single-branch cluster: blob gets that branch's front/back status. - Multi-branch cluster with mixed front/back: blob defaults to front. - Trunk-tip blob (e.g., oak center): always front.

- **REQ-EV2-CZ-02** Back canopy blobs render in layer 4, front canopy blobs in layer 5
  (per REQ-EV2-Z-04).

### 6.27 Branch Symmetry

Add a 3-state dropdown "Branch Mirroring" to the branch controls section:

- **Off** — current behavior: L1 branches alternate left/right, random junctions, overlap rejection as-is
- **Allowed** — relaxes same-junction overlap rejection for branches on opposite sides: same-point pairs more likely but not forced
- **Preferred** — actively generates L1 branches in pairs from the same trunk junction: one left, one right. Angle and length differ slightly between the pair (controlled by existing `branchAngle` and `branchLengthVariance` sliders)

When "Preferred": L1 branch count minimum becomes 2; if `branchesLevel1Range` min is < 2, treat as 2. L2 sub-branches also generate in pairs from L1 tips (branch-level forking), with L2 count minimum of 2.

Per-species defaults:

| Species | Branch Mirroring Default |
| ------- | ------------------------ |
| Oak     | Off                      |
| Birch   | Off                      |
| Maple   | Off                      |
| Willow  | Off                      |
| Cherry  | Preferred                |
| Acacia  | Preferred                |
| Apple   | Off                      |
| Baobab  | Off                      |

### 6.28 Trunk Fork (Y-Split)

Add a "Trunk Fork" checkbox to the branch controls section.

When enabled:

- Trunk flares (widens) at the last 1-2 segments — width increases by ~30-50% at the top
- Two L1 branches are forced from the topmost trunk junction, diverging symmetrically (with natural variance from existing `branchAngle` slider)
- Each fork arm has `widthStart ~ trunkTopWidth * 0.6-0.7` (combined width > trunk width at split point)
- Fork arms are standard L1 branches — they support L2/L3 sub-branches, canopy blob clustering, everything downstream
- L1 branch count minimum becomes 2 (fork arms count as L1 branches)

When combined with "Preferred" mirror symmetry: fork arms are the primary mirror pair; additional L1 branches (if any from slider) also mirror.

Branch-level forking: when mirror symmetry is "Preferred," L1 branch tips also fork into paired L2s with the same flare + thick-pair logic.

Per-species defaults:

| Species    | Trunk Fork Default |
| ---------- | ------------------ |
| Acacia     | On                 |
| All others | Off                |

Works correctly with `branchAngle` slider (shifting fork angle up/down), `branchDepth` (fork arms respect depth limits), and all branch count sliders.

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

- **REQ-L-09** Each tree shape has default `canopyLightColor`, `canopyDarkColor`, and trunk
  HSL values (see section 3.8). When the user selects a shape in the single tree editor, the color
  controls initialize to the shape's defaults.
- **REQ-L-09a** In the scene editor, a "Use per-shape default colors" toggle controls whether
  each tree uses its own shape defaults (toggle on) or all trees use the shared color pickers
  (toggle off, default). When the toggle is on, the shared color pickers are disabled.
- **REQ-L-09b** The per-shape-defaults toggle is only visible in the scene editor.

### 7.3 Trunk / Branch Lighting

- **REQ-L-08** Trunk and branch triangles use cylinder-mapping (horizontal position only) for
  lighting, not hemisphere mapping.

---

## 8. Output (`TreeGeometry`)

- **REQ-O-01** `TreeGeometry` has the shape:
    ```ts
    { triangles: Triangle[]; anchors: TreeAnchors; viewBox: { width: 500; height: 500 } }
    ```
- **REQ-O-02** `TreeAnchors` exposes four points:
    - `trunkTop` — where trunk meets canopy (top of trunk geometry).
    - `trunkMiddle` — vertically centred between `trunkTop` and `trunkBottom`.
    - `trunkBottom` — base of trunk geometry.
    - `canopyCenter` — centroid of the canopy bounding box.

---

## 9. Lifecycle Stages

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

---

## 10. Anchors

### Scalar Anchors

| Anchor        | Computation                   | Purpose                      |
| ------------- | ----------------------------- | ---------------------------- |
| `crownCenter` | center of canopy bounding box | overlays, decorations        |
| `crownTop`    | min(y) across all canopy      | floating elements above tree |
| `trunkMiddle` | midpoint along trunk path     | ladder, woodpecker snap      |
| `trunkBase`   | trunk-ground junction         | shovel, watering can snap    |
| `roots`       | trunkBase.y + offset          | root connection endpoints    |

### Array Anchors

| Anchor         | Computation                             | Purpose                       |
| -------------- | --------------------------------------- | ----------------------------- |
| `branchTips[]` | endpoint of each branch                 | wind particles, leaf-shedding |
| `fruitSlots[]` | 5-7 Poisson-sampled positions in canopy | fruit/flower placement        |

- Dynamically computed from generated geometry
- `fruitSlots[]` deterministic per seed
- `branchTips[]` length matches actual branch count
- Anchors update reactively when config changes

### Future: `crownPerimeter[]`

Sample points along outer boundary of merged canopy silhouette. For leaf placement on canopy surface, celebration particle origins. Not yet implemented.

---

## 11. Animations

- **Canopy sway** — CSS transform rotation, 2-3s cycle, per-tree phase offset, ~2-3 deg amplitude. Per-blob stagger (blobIndex \* 0.15s) for within-tree variety. Startup delay reduced to 0-0.5s so sway begins almost immediately when toggled.
- **Branch movement** — individual CSS animation per branch, 1.5-4s range, transform origin at branch base. Nest child branch `<g>` elements inside parent's animated group so children inherit parent rotation + add their own. Render structure: `trunk -> L1 animated group -> L2 animated group (nested)`. Child branches stay physically connected to parent at all times during animation.
- **Growth animation** — `growthProgress` (0->1): trunk height x progress, branch length x progress, canopy at full size from start (revealed as trunk grows).
- **Tool animations** — each tool has distinct idle animation with `transform-origin` at snap point (see Tools). "Animate tools" checkbox toggles all visible tool idle animations.
- **Falling leaves** — leaf particles originate from canopy bottom boundary (bottom edge of lowest canopy blob), fall downward toward ground.
- All toggleable via checkboxes, loop while checked
- No performance degradation at 100 trees

---

## 12. Fruits & Flowers

### Fruits

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

### Fruit Size

- Double the rendered size of all fruit SVG components
- Apply uniform scale factor (2x) to fruit `<g>` transform or increase SVG local coordinates
- Check containment boundary — may need to adjust `nx^2 + ny^2 <= 0.85` inset

### Flowers

- Each tree type has unique flower SVG in `assets/flowers/`
- `flowering` stage renders flowers at `fruitSlots[]` positions
- Earlier stages (sprouting, sapling) can render flowers at available slots
- Flowers are lifecycle-only — not selectable as a fruit type

---

## 13. Tools & Accessories

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

### Watering Can Tilt

- Watering can SVG is tilted (rotated) as if pouring water
- Apply a static rotation to the watering can's resting/idle position

### Woodpecker

- Represents code review (tree-doctor bird metaphor)
- Clings to trunk side at `trunkMiddle`
- Positioned at trunk center (trunkMiddle anchor) — flush against trunk
- Numeric badge (1-6) for active reviewer count
- Badge hidden when count is 0 or undefined

---

## 14. SVG Asset Pipeline

- Asset folder: `src/lib/trees/assets/` with subfolders: `tools/`, `fruits/`, `flowers/`, `stages/`, `ground/`
- Consistent import pattern across codebase
- Placeholder SVGs created in code, replaced with Recraft AI-generated finals
- SVG sourcing: Recraft AI for direct SVG, Vectorizer.AI for PNG to SVG conversion

---

## 15. Special Trees

### Potted Plant

- Separate `generatePottedPlant()` returning standard `TreeGeometry`
- Wide planter pot (SVG asset), one universal design
- 5 stages: `pot-with-soil -> sprout -> small-plant -> flowering -> dried`
- Same 200x300 viewBox, pot occupies bottom 60%
- Exports same `TreeAnchors` interface

### Oak/PRD Tree

- Wrapper over `generateTree` with scaled-up oak config
- `completionRatio` via branch-to-blob mapping:
    - Branch count = issue count
    - Only resolved branches have canopy blobs
    - Bare branches = open issues
- Physically larger viewBox (300x450+)
- Stone nameplate below `trunkBase` (oak-only), omitted when no name prop

---

## 16. Scene

- Tree count slider: 3-100, default 3
- Each tree gets random shape + seed (varied tree types mixed)
- Depth positioning: continuous y-offset, back trees scale to ~65%
- SVG painter's algorithm: back-to-front rendering for occlusion
- Depth spread slider: 0 = flat row, max = full depth range
- Deterministic given same seed

### Priority-Based Scene Layout

- Replace current random scene positioning with structured layout
- Trees have optional `priority` (0=background, 1=foreground) and `blockedBy?: treeId`
- **Front row** (priority=1 or default): largest trees placed at scene baseline, equidistant from each other
- **Back rows** (priority=0 or overflow >10 trees): slightly elevated, smaller (perspective scale), semi-random horizontal placement behind their blockers
- Only when >10 trees are back rows populated
- Metadata display: optional slot/overlay per tree (consuming app decides content)
- Generic priority/blocked API — no external concept dependencies

---

## 17. Environment Effects [NOT IMPLEMENTED -- #66]

7 effects, all scene-wide and independently toggleable:

- **Rain** — CSS-animated SVG lines, intensity slider (light to heavy), diagonal fall
- **Lightning** — random flashes 5-15s, 100-200ms white overlay, optional bolt SVG; accessibility-safe flash rate
- **Fireflies** — glowing dots, random walk + pulse, ~2/sec spawn, ~8s lifetime
- **Wind particles** — leaf/petal sprites drifting horizontally, rotation, varied size/opacity
- **Snow** — slow-falling white flakes, gentle horizontal drift, no accumulation
- **Sun rays** — semi-transparent diagonal gradient lines from upper corner, golden tone; works with `lightAngle`
- **Clouds** — low-poly polygon shapes (3-5 triangles), slow horizontal drift, sky area only

---

## 18. Overlay Primitives [NOT IMPLEMENTED -- #66]

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

## 19. Root Connections [NOT IMPLEMENTED -- #66]

- SVG bezier curves between trees' `roots` anchors
- Organic/curved paths with slight randomness
- Visual states: connected (solid), disconnected (dashed/faded)
- Rendered below tree layer
- For sub-tree to oak/PRD tree connections

---

## 20. Ground Elements [NOT IMPLEMENTED -- #66]

- Toggle per tree: `groundElements: true/false`
- Random 2-3 stones + grass tufts via seeded PRNG
- SVG assets in `assets/ground/`
- Keep clear of trunk base and tools
- Deterministic per seed

---

## 21. LowPolyTree Component

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
| `onanchors`    | `(anchors: TreeAnchors) => void` | ---     | Callback fired when anchors are computed                           |

Note: `showCanopy`, `showBranches`, `showTrunk` are display-only toggles. Generation still
runs for all layers so that anchors remain correct.

---

## 22. UI & Editor Controls

### Single Tree Editor

- Simple/advanced controls toggle
    - **Simple:** branchDepth, branchesLevel1Range, branchAngle, trunkSegments, trunkCrookedness, trunkHeight, trunkThickness, branchThickness
    - **Advanced:** adds branchesLevel2/3Range, branchSegments, branchCrookedness, branchLength, branchLengthVariance
- All sliders use shadcn-svelte Slider component
- Dual-thumb sliders for per-level branch count ranges
- Per-shape defaults load when shape changes

### Scene Editor

- **REQ-S-06** Right column displays one tree of each non-custom shape side by side.
- **REQ-S-07** Controls organized into cards:
    - **Scene Settings**: seed input + Randomize, `canopyPolygons`
    - **Canopy**: `blobSizeVariance`, `blobCloseness`, `canopySize`
    - **Trunk & Branches**: `trunkHeight`, `trunkThickness`, `trunkLean`, `trunkSegments`,
      `trunkCrookedness`, `branchThickness`, `branchLength`, `branchLengthVariance`, `trunkBranchRatio`
    - **Canopy Color**: 2 color pickers + "Use per-shape defaults" toggle
    - **Trunk Color**: swatches + HSL sliders + per-shape defaults toggle
    - **Lighting**: `lightAngle`, `depthVariance`
    - **Debug**: Show Canopy, Show Branches, Show Trunk, Show Anchors checkboxes
- **REQ-S-08** Individual seeds are offset from the base seed: `seed`, `seed + 1000`, etc.
- **REQ-S-09** `branchCount` and `blobCount` are per-shape (not adjustable in scene mode).

### Showcase Layout

- **REQ-S-01** Both showcase pages use a `100dvh` CSS grid layout — the tree preview never
  scrolls with the page.
- **REQ-S-02** Left column: tree preview — centred, scaled to fit, sticky.
  Right column: scrollable controls panel (`overflow-y: auto`).
- **REQ-S-03** Controls panel uses a 2-column card grid when viewport width >= 1200 px;
  single column below that.
- **REQ-S-05** Preview shows a single tree rendered at large size.
- **REQ-S-10** The root page (`/`) contains navigation links to `/showcase` and `/showcase/scene`.
- **REQ-S-11** The entire controls panel (`<aside>`) has `user-select: none` (Tailwind
  `select-none`) applied to prevent text selection from interfering with slider dragging.

### 3-Tier Settings Control (Basic / Intermediate / Advanced)

Replace current binary "Advanced" checkbox with 3-tier segmented control at top of settings panel.
Use shadcn-svelte component (Tabs or ToggleGroup) for the switcher.
Tiers are **additive** — higher tiers show all controls from lower tiers plus their own.
Persistent per session.

**Basic** (casual users, quick results):

- Shape, Stage, Seed
- Trunk Height, Trunk Thickness
- Canopy Size, Blob Count
- Colors (canopy light/dark + trunk)
- Fruit Count

**Intermediate** (tuning proportions):

- All Basic controls +
- Trunk Segments, Trunk Crookedness
- Branch Depth, Branch Angle
- Branch/Trunk Length Ratio, Branch/Trunk Thickness Ratio
- Light Angle

**Advanced** (full control):

- All Intermediate controls +
- Trunk Lean, Crookedness Mode (alternating/random)
- Branch Segments, Branch Crookedness
- Branch Length Variance
- Polygons Per Blob, Blob Closeness
- Per-blob custom editor (custom shape only)

### Disabled Sliders

- **REQ-S-12** When a parameter has no effect for the selected shape, its slider is visually
  disabled (grayed out, not interactive). Examples:
    - Pine: `branchCount` disabled (always 0)
    - Fir: `branchCount` disabled (always 0)
    - Pine/Fir: `trunkBranchRatio` disabled
    - `trunkCrookedness` disabled when `trunkSegments = 1`
    - `blobCloseness` disabled for branching shapes (oak, birch, maple, willow, apple, cherry,
      baobab, acacia) — closeness is moot when blob positions are driven by branch-tip clusters

### Color Picker UI

- **REQ-S-13** Canopy color pickers use native `<input type="color">` styled to match shadcn
  design. Each picker shows a colored swatch preview + hex value text.
- **REQ-S-14** Trunk color preset swatches are rendered as small colored buttons in a row.
  Clicking a swatch sets the 3 trunk HSL sliders simultaneously.

### Settings Panel Position

- Scene editor: `grid-cols-[1fr_320px]` (controls right)
- Single editor: `grid-cols-[1fr_320px]` — controls on right
- Preview/canvas on left, settings panel on right, both pages consistent

### Viewport Size

- `VIEWBOX_WIDTH` = 300, `VIEWBOX_HEIGHT` = 300
- Uniform square viewport for all stages
- `GROUND_LINE_Y` = `300 * 0.95 = 285`
- Audit all hardcoded coordinates (seed/stump geometry, tool snap offsets, fruit slots) for new viewport
- OakTree/PRD variant: scale proportionally from new base

### Settings Visible When Signed Out

- All tree editing controls are fully functional without sign-in
- Only save/load/gallery features require authentication

---

## 23. Custom Tree

- **REQ-CUSTOM-01** A 7th shape option `'custom'` is available only in the single tree editor
  (not in scene mode).
- **REQ-CUSTOM-02** `blobCount` (1-8) controls how many blobs are visible and editable. Each
  blob gets its own collapsible UI section in a card (shadcn-svelte Accordion with
  `type="multiple"` so multiple blob sub-cards can be expanded simultaneously).
- **REQ-CUSTOM-03** Each custom blob is represented by a `CustomBlob` record with exactly
  these fields, stored in `TreeConfig.customBlobs?: CustomBlob[]` (populated only when
  `shape === 'custom'`):
    - `boundaryKind`: one of `'circle' | 'egg' | 'teardrop' | 'isoscelesTriangle' | 'equilateralTriangle'`
    - `rotationDeg`: `number` in `[0, 360]`, step 5
    - `sizeScale`: `number` in `[0.5, 2.0]`, step 0.05 (UI shows 50 %-200 %); scales `rx` and `ry` uniformly
    - `position`: `{ x: number; y: number }` with each axis in `[-1, +1]`, step 0.05 — see REQ-CUSTOM-03a
- **REQ-CUSTOM-03a** Position is **normalized** relative to canopy half-extent. `x = -1` ->
  left edge of canopy spread; `x = +1` -> right edge; `y = -1` -> top; `y = +1` -> bottom. At
  render time: `cx = canopyCenterX + position.x * spreadRadius`,
  `cy = canopyCenterY + position.y * spreadRadius`. Resolution-independent — survives
  `canopySize` slider changes without retuning.
- **REQ-CUSTOM-03b** Per-blob UI in the Custom Blobs card shows exactly 5 controls per blob:
    1. Boundary shape `<Select>` (5 options)
    2. Rotation `<input type="range" min="0" max="360" step="5">`
    3. Size `<input type="range" min="0.5" max="2" step="0.05">`
    4. Position X `<input type="range" min="-1" max="1" step="0.05">`
    5. Position Y `<input type="range" min="-1" max="1" step="0.05">`
- **REQ-CUSTOM-04** The `customBlobs` array is grown lazily. When UI
  `blobCount = M`, only indices `[0, M)` are rendered and editable. When the user increases
  `blobCount` past `customBlobs.length`, append new seeded entries (random position via
  `createPrng(seed)` + `blobCloseness`, `boundaryKind = 'circle'`, `rotationDeg = 0`,
  `sizeScale = 1.0`). When the user decreases `blobCount`, **trailing entries are preserved
  in memory** — growing back reveals the previously tuned values.
- **REQ-CUSTOM-04a** Custom tree generation is deterministic: seeded random is used **only**
  to initialize newly appended `customBlobs` entries and for non-overridden triangulation
  jitter. Once a blob has user-set field values, those values are authoritative and override
  any seeded random on subsequent generation.
- **REQ-CUSTOM-05** All other tree parameters (branches, trunk, lighting, colors) apply
  normally. Custom trees use the generic `generateBranches()`.
- **REQ-CUSTOM-06** `SHAPE_DEFAULTS` has no entry for `'custom'` — the
  custom editor retains whatever the user has configured. When the user switches TO custom,
  current `TreeConfig` values carry through unchanged and `customBlobs` is lazily seeded for
  the current `blobCount`. When switching AWAY from custom, `customBlobs` is preserved but
  unused (forward-preservation across round trips).
- **REQ-CUSTOM-07** Custom shape is excluded from scene-editor shape lists and
  shape-cycling helpers (per REQ-S-04b and REQ-S-06).

---

## 24. Authentication

- **REQ-AUTH-01** Implement BetterAuth for user authentication.
- **REQ-AUTH-02** Supported auth methods:
    - Google OAuth
    - GitHub OAuth
    - Passkey (WebAuthn)

- **REQ-AUTH-02a** Sign-in and sign-up collapse to a **single flow** for all enabled
  providers: first successful OAuth/Passkey auth creates the user row; subsequent auths
  sign the user in.
- **REQ-AUTH-03** Auth state is available server-side via hooks and client-side via auth client.
- **REQ-AUTH-04** User session data is stored in the database (PostgreSQL via Drizzle ORM).
- **REQ-AUTH-05** The `/auth` route is a single page containing three primary buttons:
    1. "Continue with Google" -> `authClient.signIn.social({ provider: 'google' })`
    2. "Continue with GitHub" -> `authClient.signIn.social({ provider: 'github' })`
    3. "Continue with Passkey" -> `authClient.signIn.passkey()` (falls back to registration
       flow for new users)
- **REQ-AUTH-06** Sign-out is a server action at `/auth/sign-out` (POST) that calls
  `auth.api.signOut()` and redirects to `/`.
- **REQ-AUTH-07** Required environment variables: `AUTH_SECRET`, `ORIGIN`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
  Document in `.env.example`.
- **REQ-AUTH-08** Drizzle auth schema lives in `src/lib/server/db/auth.schema.ts` and
  includes the Passkey plugin tables. Schema is generated via
  `pnpm dlx @better-auth/cli generate` and committed alongside a Drizzle migration.

### Sign-In Reliability

- Sign-in flow (Google OAuth, GitHub OAuth, passkey) has intermittent failures
- Investigate: session persistence, OAuth callback handling, redirect logic

---

## 25. Sidebar Navigation

- **REQ-NAV-01** The application uses the shadcn-svelte **`sidebar-07`** block with
  `collapsible="offcanvas"` (full-hide — sidebar disappears completely when collapsed, not
  icon-only). Integrated into `src/routes/+layout.svelte` wrapping `{@render children()}`.
  Collapsed/expanded state persisted in a cookie (`+layout.server.ts` reads it on load).
- **REQ-NAV-02** Sidebar includes links to all pages:
    - Single Tree Editor (`/showcase`)
    - Scene Editor (`/showcase/scene`)
    - Gallery (`/gallery`)
- **REQ-NAV-03** Sidebar has a bottom user section:
    - When signed out: guest avatar dropdown with "Sign in" link to `/auth`
    - When signed in: user avatar, name, sign-out button (posts to `/auth/sign-out`)
    - Both signed-in and guest dropdowns include a theme submenu (Light / Dark / System) via
      `mode-watcher`. Selecting a theme applies immediately.
- **REQ-NAV-05** The sidebar toggle is a floating trigger in the page inset (not in the
  sidebar header). Icon switches between `PanelLeft` (collapsed) and `PanelLeftClose`
  (expanded).
- **REQ-NAV-04** The sidebar renders on **every route**, including `/`, `/auth`, `/showcase`,
  `/showcase/scene`, and `/gallery`. Navigation links are always visible; the Gallery link
  redirects anonymous users to `/auth` server-side. The bottom user section swaps based on
  auth state.

### User Dropdown

- User dropdown: avatar + username + email + ChevronsUpDown trigger
- Dropdown contents: user info, settings link, theme submenu (Light/System/Dark via mode-watcher), sign out
- Collapsed sidebar: avatar remains as trigger
- When not signed in: "Sign in" button links to `/auth/sign-in`

---

## 26. Gallery & Persistence

### 26.1 Save Mechanism

- **REQ-SAVE-01** A "Save" button in the single tree editor (placed at the top of the
  controls panel beside the shape picker) saves the current `TreeConfig` to the database.
  The button is present only in the single tree editor.
- **REQ-SAVE-02** Saved trees are associated with the authenticated user. Anonymous users
  cannot save — the button is disabled with a "Sign in to save" tooltip when no session
  is present.
- **REQ-SAVE-03** Each saved tree stores: all `TreeConfig` fields as a JSONB snapshot, an
  auto-generated name, creation timestamp, `updatedAt` timestamp, and the user ID.
  The row is identified by a nanoid primary key.
- **REQ-SAVE-03a** **Auto-name format**: on save, name is
  **`"{Shape} #{N}"`** where `Shape` is the capitalized tree shape (`"Oak"`, `"Pine"`,
  `"Birch"`, `"Fir"`, `"Maple"`, `"Willow"`, `"Custom"`) and `N` is the next sequential
  integer scoped to that user + that shape. Examples: `"Oak #1"`, `"Pine #1"`, `"Oak #2"`,
  `"Maple #1"`. Auto-named immediately — the user can rename later in the gallery.
- **REQ-SAVE-04** The `saved_trees` table has the following Drizzle schema:
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
- **REQ-SAVE-05** **Forward-compatibility**: `TreeConfig` has no `configVersion` field.
  On restore, the stored JSONB is merged with `DEFAULT_TREE_CONFIG`:
  `{ ...DEFAULT_TREE_CONFIG, ...stored.config }`. New fields added to `TreeConfig` in the
  future inherit defaults on old saved rows. Field renames/removals are handled as explicit
  data migrations when they occur.

### 26.2 Gallery Page

- **REQ-GALLERY-01** A `/gallery` page displays the authenticated user's saved trees.
  Anonymous access redirects to `/auth`.
- **REQ-GALLERY-02** Each saved tree is rendered as a preview thumbnail using the
  existing `<LowPolyTree>` component spread with the stored config:
  `<LowPolyTree {...savedTree.config} />`. Thumbnails are sized to a fixed 200x200 aspect
  square with `overflow: hidden`. No reduced polygon count — SVG scales cheaply.
  Display the tree name (inline-editable) and a relative creation date
  (e.g., "2 hours ago" via `Intl.RelativeTimeFormat`).
- **REQ-GALLERY-03** Clicking a saved tree navigates to **`/showcase?saved=<id>`**. The
  `src/routes/showcase/+page.server.ts` `load()` function reads the `saved` query param,
  fetches the `saved_trees` row by id (404 if not owned by the current user), merges
  `config` with `DEFAULT_TREE_CONFIG`, and passes to the page as `data.initialConfig`.
  The page initializes its reactive form state from `initialConfig`. The URL retains
  `?saved=<id>` until the user modifies a slider.
- **REQ-GALLERY-04** Users can delete saved trees from the gallery via a small trash icon
  (top-right of the card). Delete triggers a confirmation dialog
  ("Delete {name}? This cannot be undone.") before the server delete action runs.
- **REQ-GALLERY-05** Gallery is user-specific — users only see their own saved trees.
  The `load()` query scopes by `event.locals.user.id` and the delete/rename actions
  enforce ownership server-side.
- **REQ-GALLERY-06** Gallery cells are laid out in a CSS grid:
  `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` for a responsive flow.
- **REQ-GALLERY-07** Inline rename: single-click on the tree name turns it into an
  `<input>`; blur or Enter commits the new name via a rename server action with ownership
  check. Escape cancels.

### 26.3 Server CRUD Module

- **REQ-SAVE-06** All `saved_trees` database access goes through a single module
  `src/lib/server/saved-trees.ts` exporting:
    - `createSavedTree({ userId, shape, config })` — computes auto-name + inserts
    - `listSavedTrees(userId)` — returns rows ordered by `created_at DESC`
    - `getSavedTree(id, userId)` — returns single row scoped to user (404 on mismatch)
    - `deleteSavedTree(id, userId)` — deletes with ownership check
    - `renameSavedTree(id, userId, name)` — updates name with ownership check

---

## 27. Tree-Specific Visual Bugs

### Birch Stripe Markings

- Birch trunk displays dark horizontal bars (black/dark-grey stripes)
- Stripes are characteristic birch visual
- Render as additional SVG elements overlaid on trunk quads or as pattern within trunk rendering

### Pine Trunk Height Bug

- At `trunkHeight=10%`, pine tree still displays approximately half of the original trunk height
- Likely a calculation bug in how percentage maps to actual height for pine shape

### Dead Stage — Crookedness + Lean

- Dead stage applies both crookedness AND lean:
    - `trunkCrookedness=50`, `trunkLean=15`, `trunkSegments=5`
    - Use `random` crookedness mode for a broken/twisted look
    - No canopy, desaturated colors (existing)

### Willow Branch Drooping

- Willow branches reach lower blob positions, creating visual droop
- Current `branchAngle=30%` already set low for willow shape defaults
- May need tuning of blob placement (lower positions) and branch endpoint targeting

---

## 28. Library API [NOT IMPLEMENTED -- #67]

- Local workspace dependency (pnpm workspace `"workspace:*"`)
- Explicit barrel exports, no internal path reaching
- Exports:
    - `generateTree(config)` -> `TreeGeometry`
    - `<LowPolyTree>`, `<PottedPlant>`, `<OakTree>`, `<TreeScene>` components
    - Overlay primitive components
    - Tool accessory components
    - Environment effect components
    - All TypeScript types (`TreeConfig`, `TreeGeometry`, `TreeAnchors`, `LifecycleStage`, etc.)
- JSDoc on all exports, strict types, no `any` leakage
- Single entry point for all exports

---

## 29. PRD-7: Engine, Animation & UI Improvements

### 29.1 Branch Symmetry Default Change

- **REQ-PRD7-01** Change `branchMirroring` default from `off` to `allowed` for all branching species currently defaulting to `off` (oak, birch, maple, willow, apple, baobab).
- Cherry and acacia retain `preferred` default.
- `allowed` relaxes same-junction overlap rejection for opposite-side branches — pairs more likely but not forced.

**Acceptance criteria:**

- `SHAPE_DEFAULTS` updated for oak, birch, maple, willow, apple, baobab → `branchMirroring: 'allowed'`
- `DEFAULT_TREE_CONFIG.branchMirroring` changed to `'allowed'`
- Cherry/acacia unchanged at `preferred`

### 29.2 Trunk Fork — Terminate at Fork Point

- **REQ-PRD7-02** When `trunkFork=true`, the trunk terminates at the fork junction. No trunk geometry renders above the Y-split. The two fork arms ARE the continuation — they replace the trunk tip entirely.
- Applies to all species when `trunkFork` is enabled.

**Acceptance criteria:**

- With `trunkFork=true`, no trunk quads exist above the topmost fork junction
- Fork arms originate from the fork junction and diverge symmetrically
- Trunk tip anchor moves to the fork junction point
- Works correctly with all branching species

### 29.3 Settings Tier Switcher Styling

- **REQ-PRD7-03** The settings tier switcher (Basic/Intermediate/Advanced) must:
    - Be **sticky** at the top of the scrollable settings panel
    - Have a **solid background** matching the panel background (not transparent)
    - Span the full width of the settings panel with horizontal padding matching the cards
    - Have **equal vertical spacing** above (to the scene/preview) and below (to the first card), so it sits visually centered between those elements
    - Ensure scrolled card content is fully hidden behind the switcher — no card peeking above the switcher in default (non-scrolled) state
    - Bottom padding large enough that cards are always obscured when scrolling beneath

**Acceptance criteria:**

- Switcher has solid opaque background
- Sticky positioning within scrollable panel
- No card content visible above or behind the switcher in any scroll position
- Equal visual spacing above and below the switcher

### 29.4 Floating Buttons Not Working

- **REQ-PRD7-04** Fix all floating action buttons (Theme toggle, Reset, Randomize Seed, Save) — currently none respond to clicks.
- Investigate the `Tooltip.Trigger` child snippet pattern in `SceneFloatingButtons.svelte` — the `{...props}` spread may override `onclick` handlers.
- The Settings panel button works; only the floating overlay buttons are broken.

**Acceptance criteria:**

- Theme toggle cycles through light/dark/system modes visibly
- Reset button resets tree config to defaults
- Randomize Seed button generates a new random seed and re-renders the tree
- Save button triggers save action (single editor, authenticated)
- All buttons provide visual feedback on click

### 29.5 Theme Switcher

- **REQ-PRD7-05** Theme switcher button in floating menu must cycle through light → dark → system themes and apply the change immediately.
- Uses `mode-watcher` library (`setMode()`).
- Root cause is likely the same as REQ-PRD7-04 (floating buttons not responding to clicks).

**Acceptance criteria:**

- Clicking theme button visibly changes the color scheme
- Cycle order: light → dark → system → light
- Theme persists across page navigation

### 29.6 Desktop Sidebar Expand Toggle

- **REQ-PRD7-06** Add a **visible toggle icon/button** for expanding the sidebar on desktop. The current `Sidebar.Rail` (4px hover border) is too subtle and undiscoverable.
- Mobile sidebar works correctly (off-canvas sheet).

**Acceptance criteria:**

- A visible expand/collapse icon appears in the collapsed sidebar on desktop
- Clicking it expands the sidebar to show full labels
- Clicking again collapses back to icon-only mode
- Does not interfere with mobile sidebar behavior

### 29.7 Remove Duplicate Buttons from Settings Panel

- **REQ-PRD7-07** Remove Randomize Seed, Reset, and Save buttons from the settings panel. These actions live exclusively in the floating button menu (`SceneFloatingButtons`).
- The settings panel should only contain tree configuration controls.

**Acceptance criteria:**

- No Randomize, Reset, or Save buttons in the settings panel
- Floating buttons are the sole source for these actions
- Floating buttons are functional (depends on REQ-PRD7-04)

### 29.8 Viewport Increase to 500x500

- **REQ-PRD7-08** Increase SVG viewport from 300x300 to 500x500.
    - `VIEWBOX_WIDTH` = 500, `VIEWBOX_HEIGHT` = 500
    - `GROUND_LINE_Y` scales proportionally (285 → 475)
    - Tree remains horizontally centered and vertically anchored at bottom
    - Tree size unchanged — the extra viewport space allows room for effects (clouds, larger canopies, overlays)
    - All coordinate constants, shape definitions, trunk widths, blob radii, tool snap offsets, fruit slot positions, seed/stump/sprouting stage geometry must be audited and scaled proportionally

**Acceptance criteria:**

- `VIEWBOX_WIDTH=500`, `VIEWBOX_HEIGHT=500` in config
- All hardcoded coordinates scaled by 500/300 (≈1.667x)
- Tree visual size and proportions unchanged
- Ground line at y=475
- No floating trunks, misaligned tools, or off-screen canopies
- All 13 tree shapes render correctly at default settings

### 29.9 Sidebar Icon Alignment

- **REQ-PRD7-09** Fix sidebar icon sizing and centering:
    - Navigation icons (Scene Editor, Single Editor, Gallery) should match the visual weight/size of floating button icons
    - Icons must be **horizontally centered** within the collapsed sidebar — currently shifted right within their containers
    - Equal padding/distance from icon to left and right sidebar borders

**Acceptance criteria:**

- Icons visually centered in collapsed sidebar
- Equal left/right spacing from sidebar edges
- Consistent icon size between sidebar and floating buttons

### 29.10 Scene Row Shift Algorithm

- **REQ-PRD7-10** Replace the current 50% even-layer stagger with a pseudo-random row shift system:
    - Front row (layer 1) has **zero shift** — trees equidistant at predictable positions
    - Rows 2+ get a **seeded random horizontal shift between 15-45%** of inter-tree spacing
    - **Constraint:** No row's resulting shift position may be within 10% of any row within ±3 rows
    - If a generated shift violates the constraint, re-roll (up to 5 attempts) then clamp to nearest valid position
    - All rows maintain equidistant internal tree spacing (same inter-tree distance as row 1)
    - Shifts are deterministic per scene seed

**Acceptance criteria:**

- Front row always at 0% shift
- Background rows shifted 15-45% with seeded randomness
- No two rows within ±3 of each other share similar shift positions (within 10%)
- Trees within each row are equidistant
- Scene looks organic, not gridded
- Deterministic per seed

### 29.11 Consolidate Asset Folders

- **REQ-PRD7-11** Clean up asset folder structure:
    - Remove all `.gitkeep` files from folders that contain actual files (flowers, fruits, ground, stages)
    - Add barrel `index.ts` files to folders missing them: `ground/`, `overlays/`, `tools/`
    - Existing index files in `flowers/`, `fruits/`, `stages/` remain
    - `src/lib/assets/` (favicon only) stays separate from `src/lib/trees/assets/`

**Acceptance criteria:**

- No `.gitkeep` files in populated asset directories
- All 6 asset subdirectories have consistent barrel `index.ts` exports
- No broken imports after consolidation

### 29.12 Growth Animation Overhaul

- **REQ-PRD7-12** Fix growth animation to be coherent and connected:

    **A. Branch tip-only animation:** Animate branch length by extending tips outward. Branch origins stay fixed at their trunk/parent attachment point. `transform-origin` at branch base, scaling along branch axis only. No disconnection from trunk.

    **B. Canopy follows branch tips:** When growth animation changes branch length, canopy blob position follows the animated branch tip. Canopy `cx/cy` derived from animated tip position.

    **C. Synchronized timing:** All branches and canopy blobs share the same animation duration and start simultaneously. No per-branch stagger or individual timing. Single `growthProgress` value drives both branch length and canopy scale.

    **D. Canopy-branch scale sync:** Canopy scale and branch length use the same oscillation curve. When branches shrink, canopy shrinks proportionally. No independent canopy breathing.

**Acceptance criteria:**

- Branch bases stay attached to trunk at all animation phases
- Canopy blobs move with their associated branch tips
- All branches grow/shrink simultaneously with uniform duration
- Canopy size changes in lockstep with branch length changes
- No visual disconnection between any tree elements during animation

### 29.13 Full Reset to Defaults

- **REQ-PRD7-13** The "Reset to defaults" button resets ALL config values, not just shape-specific overrides:
    - Apply `DEFAULT_TREE_CONFIG` first (full baseline reset)
    - Overlay `SHAPE_DEFAULTS[currentShape]` on top (shape-specific tuning)
    - Preserve only `seed` and `shape`
    - Formula: `{ ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS[shape], seed, shape }`

**Acceptance criteria:**

- Clicking Reset reverts every parameter to its default value for the current shape
- Parameters not in `SHAPE_DEFAULTS` reset to `DEFAULT_TREE_CONFIG` values
- Seed and shape preserved
- Works for all species (skips custom)

### 29.14 Stage Selector in Scene Editor

- **REQ-PRD7-14** Add a lifecycle stage selector to the scene editor.
    - Controls the stage for **all trees** in the scene simultaneously
    - Uses the same `TREE_STAGE_OPTIONS` as the single tree editor
    - Placed in the **Scene Settings** card alongside seed and tree count
    - Default stage: `leafy`

**Acceptance criteria:**

- Stage dropdown visible in scene editor Scene Settings card
- Changing stage updates all trees in the scene
- All 12 stages work correctly in scene mode
- Default is `leafy`

### 29.15 Falling Leaves Land and Accumulate

- **REQ-PRD7-15** Falling leaf particles land on the ground and accumulate:
    - Each leaf animation ends at `GROUND_LINE_Y` (stops falling, doesn't loop immediately)
    - Leaf stays visible on the ground for ~10 seconds, then fades out
    - Multiple leaves accumulate over time, creating a visible pile effect
    - Landed leaves get **±10-20px horizontal jitter** from their fall endpoint (scatter effect)
    - Maximum **15-20 visible ground leaves** per tree at any time (cap to prevent clutter)
    - New leaves continue spawning from canopy while old leaves fade from ground

**Acceptance criteria:**

- Leaves stop at ground level instead of looping
- Leaves remain visible on ground for ~10s before fading
- Ground leaves have horizontal scatter
- Pile is capped at ~15-20 leaves
- Continuous cycle: spawn → fall → land → accumulate → fade

### 29.16 Double Ground Elements

- **REQ-PRD7-16** When ground elements toggle is enabled, generate **twice as many** elements (4-6 stones + grass tufts instead of 2-3).
    - Elements may overlap each other but by **less than 50%** of their width
    - Minimum spacing: `element_width × 0.5` between any two ground elements

**Acceptance criteria:**

- Ground element count doubled when enabled
- No element overlaps more than half of its neighbor's width
- Elements still avoid trunk base and tool areas
- Deterministic per seed

### 29.17 Sky Gradient and Ground for Both Editors

- **REQ-PRD7-17** Add sky gradient background and ground representation to both editors:

    **Single tree editor:**
    - Same sky gradient as scene editor (`bg-linear-to-b from-sky-200 to-white`, dark mode: `from-[#0a1628] to-[#1a2744]`)
    - Simple horizontal ground band at `GROUND_LINE_Y` — earth-colored rectangle filling the bottom of the viewport
    - Subtle gradient: earth/grass color at bottom, fading to transparent ~20% up

    **Scene editor ground:**
    - Ground level at the baseline of the front row (largest trees)
    - Back row trunks sit above the ground line (naturally higher due to perspective positioning)
    - No trunk boxes floating in the air — all trees visually grounded
    - Ground rendered as a gradient band: earth/grass color at bottom, fading to transparent ~20% up

**Acceptance criteria:**

- Single tree editor has sky gradient matching scene editor
- Single tree editor has visible ground plane
- Scene editor ground line aligns with front-row tree bases
- No floating trunks in any row
- Ground and sky respect dark/light theme
