# Low-Poly 2D Tree Generator — Requirements

Extracted from grilling sessions (PLAN.md + PLAN2.md). Plan v2 supersedes Plan v1 where
they conflict. Intended as a stable basis for test authoring.

---

## 1. Rendering

### 1.1 SVG output

- [ ] **REQ-R-01** Each tree is rendered as a single `<svg>` element with a fixed viewBox of `200×300`.
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

| ID       | Parameter          | Type                         | Default   | Range       | Step | UI display         |
| -------- | ------------------ | ---------------------------- | --------- | ----------- | ---- | ------------------ |
| REQ-P-01 | `shape`            | `'oak' \| 'pine' \| 'birch'` | `'oak'`   | 3 options   | —    | Select dropdown    |
| REQ-P-02 | `seed`             | `number`                     | `42`      | 0 – 999 999 | 1    | Number + Randomize |
| REQ-P-03 | `canopyPolygons`   | `number`                     | `50`      | 10 – 150    | 1    | "50"               |
| REQ-P-04 | `trunkPolygons`    | `number`                     | `30`      | 10 – 100    | 1    | "30"               |
| REQ-P-05 | `canopyHue`        | `number`                     | `120`     | 0 – 360     | 1    | "120°"             |
| REQ-P-06 | `canopyHueSpread`  | `number`                     | `40`      | 0 – 80      | 1    | "40"               |
| REQ-P-07 | `canopySaturation` | `number`                     | `60`      | 0 – 100     | 1    | "60 %"             |
| REQ-P-08 | `canopyLightness`  | `number`                     | `40`      | 10 – 80     | 1    | "40 %"             |
| REQ-P-09 | `trunkHue`         | `number`                     | `25`      | 0 – 360     | 1    | "25°"              |
| REQ-P-10 | `trunkSaturation`  | `number`                     | `50`      | 0 – 100     | 1    | "50 %"             |
| REQ-P-11 | `trunkLightness`   | `number`                     | `25`      | 10 – 80     | 1    | "25 %"             |
| REQ-P-12 | `lightAngle`       | `number`                     | `315`     | 0 – 360     | 1    | "315°"             |
| REQ-P-13 | `blobCount`        | `number`                     | per-shape | 1 – 8       | 1    | "5"                |
| REQ-P-14 | `branchCount`      | `number`                     | per-shape | 0 – 20      | 1    | "2"                |
| REQ-P-15 | `depthVariance`    | `number`                     | `1.0`     | 0.0 – 2.0   | 0.1  | "1.0"              |
| REQ-P-16 | `blobSizeVariance` | `number`                     | `3.0`     | 1.0 – 10.0  | 0.1  | "3.0x"             |
| REQ-P-17 | `blobCloseness`    | `number`                     | `50`      | 20 – 80     | 1    | "50 %"             |
| REQ-P-18 | `trunkThickness`   | `number`                     | `100`     | 50 – 200    | 5    | "100 %"            |
| REQ-P-19 | `branchThickness`  | `number`                     | `100`     | 50 – 200    | 5    | "100 %"            |
| REQ-P-20 | `canopySize`       | `number`                     | `100`     | 50 – 200    | 5    | "100 %"            |
| REQ-P-21 | `trunkHeight`      | `number`                     | `100`     | 30 – 150    | 5    | "100 %"            |
| REQ-P-22 | `trunkBranchRatio` | `number`                     | `70`      | 40 – 80     | 5    | "70 %"             |

### Per-shape defaults

| Shape   | `blobCount` | `branchCount` | `blobSizeVariance` | `blobCloseness` |
| ------- | ----------- | ------------- | ------------------ | --------------- |
| `oak`   | 5           | 2             | 3.0                | 50              |
| `pine`  | 3           | 0             | 3.0                | 50              |
| `birch` | 3           | 1             | 3.0                | 50              |

---

## 3. Canopy Generation

### 3.1 Blob system (oak, birch)

- [ ] **REQ-C-01** Canopy is composed of `blobCount` overlapping ellipses. Blob 0 is always the
      largest blob and is positioned on or very near the trunk axis.
- [ ] **REQ-C-01a** When `blobCount = 1`, blob 0 is placed directly on the trunk axis
      (`cx = trunkCenterX`).
- [ ] **REQ-C-01b** When `blobCount > 1`, blob 0 stays on/near the trunk axis. Remaining blobs are
      split evenly left/right: odd indices (1, 3, 5 …) go left, even indices (2, 4, 6 …) go right.
      Each side-blob gets a random offset constrained to its side.
- [ ] **REQ-C-02** `blobSizeVariance` stores the largest-to-smallest ratio (1.0x–10.0x). At `1.0`
      all blobs are the same size; at `10.0` the largest blob is 10× the area of the smallest.
      `minScale = 1 / blobSizeVariance`;
      `blobScale[i] = lerp(1.0, minScale, i / (blobCount − 1))`.
- [ ] **REQ-C-02a** For pine, `blobSizeVariance` controls the ratio of top tier base width to
      bottom tier base width. At 1.0x: equal widths. At 10.0x: bottom tier is 10× wider.
- [ ] **REQ-C-03** Depth ordering: if blob A fully contains blob B, blob B must always render in
      front of blob A (higher depth index). Otherwise depth is assigned randomly (seeded).
- [ ] **REQ-C-03a** `blobCloseness` (20–80 %) controls how tightly blobs cluster. For oak/birch:
      higher values = tighter clustering around the trunk axis. Main blob (blob 0) is affected at
      1/10th the magnitude of other blobs.
- [ ] **REQ-C-03b** `canopySize` (50–200 %) scales all blob radii AND the blob spread distance
      proportionally.

### 3.2 Pine tier system

- [ ] **REQ-C-04** For `shape = 'pine'`, canopy is composed of `blobCount` triangular tiers
      (isoceles triangles pointing upward), not ellipses.
- [ ] **REQ-C-05** Tiers stack from top (smallest, narrowest) to bottom (widest). Each tier's
      base is wider than the tier above. `blobCloseness` controls how much each tier's tip extends
      into the tier above: `overlapFraction = blobCloseness / 100` (20 % to 80 % of tier height).
- [ ] **REQ-C-05a** Pine tier centers follow the trunk lean axis:
      `offsetX = trunkLean × (1 − (tierY − trunkTop) / (trunkBottom − trunkTop))`.
- [ ] **REQ-C-06** Point-in-canopy tests for pine use a point-in-triangle test (`isPointInTier()`),
      not a point-in-ellipse test.

### 3.3 Per-blob triangulation

- [ ] **REQ-C-07** Each blob/tier is triangulated independently. The `canopyPolygons` budget is
      distributed across blobs proportional to their area.
- [ ] **REQ-C-08** Boundary point count for each blob is approximately 15% of its allocated polygon
      budget (not 30%). Boundary points use irregular angular spacing with ±15–30° jitter and ±10–20%
      radial jitter — they are never evenly spaced.
- [ ] **REQ-C-09** Recommended boundary vertex counts by polygon budget: 50 → 8–10, 100 → 10–14,
      200 → 14–20, 500 → 20–30.
- [ ] **REQ-C-10** Interior points are sampled with Poisson-disk rejection sampling inside each blob.
- [ ] **REQ-C-11** After triangulation, only triangles whose centroid lies inside the blob are kept.

### 3.4 Canopy outline smoothing

- [ ] **REQ-C-12** For `oak` and `birch`: after boundary sampling, post-process boundary points so
      that no interior angle at any boundary vertex is acute (< 90°). Acute vertices are either moved
      outward radially or removed.
- [ ] **REQ-C-13** For `pine`: the acute-angle smoothing is skipped at tier tips (acute angles are
      desired). Non-tip edges of each tier may still be smoothed.

---

## 4. Trunk & Branch Generation

### 4.1 Trunk

- [ ] **REQ-T-01** The trunk is triangulated independently in its own `<g class="trunk">` layer and
      has no shared vertices with branches or canopy.
- [ ] **REQ-T-02** The trunk tapers linearly from `trunkBaseWidth` at the bottom to `trunkTopWidth`
      at the top. Both are scaled by `trunkThickness / 100`.
- [ ] **REQ-T-02a** `trunkHeight` (30–150 %) controls trunk length:
      `effectiveTrunkTop = trunkBottom − (trunkBottom − defaultTrunkTop) × trunkHeight / 100`.
      The canopy Y position shifts proportionally with the trunk top.
- [ ] **REQ-T-03** `trunkTop` is dynamically computed to enter the largest canopy blob by at least
      15 px (at least 15 px below the lowest blob-bounding-box bottom and inside that blob).
- [ ] **REQ-T-04** The `trunkTop` Y-coordinate satisfies: `trunkTop ≤ lowestBlobY − 15`.

### 4.2 Branches

- [ ] **REQ-T-05** Branches are rendered in their own `<g class="branches">` layer, in front of
      the trunk and behind the canopy.
- [ ] **REQ-T-05a** Each branch segment is triangulated independently (not pooled). Branch meshes
      are concatenated into the branches layer.
- [ ] **REQ-T-05b** Every branch's axis must diverge by at least 30° from the axis of its parent
      (trunk center line or parent branch direction). Candidate angles violating this are re-rolled.
- [ ] **REQ-T-06** Each branch is represented as a `BranchSegment` with `(x1, y1)` at the
      trunk-side origin and `(x2, y2)` at the tip, plus `widthStart` (thicker, 4–7 px) and
      `widthEnd` (thinner, 1–3 px, always < `widthStart`). All widths are scaled by
      `branchThickness / 100`.
- [ ] **REQ-T-07** Width is interpolated linearly along the branch: `w(t) = widthStart + t × (widthEnd − widthStart)` where `t ∈ [0, 1]` from trunk to tip.
- [ ] **REQ-T-08** Branches may originate from the trunk (thicker: `widthStart` ~5–8 px) or from
      another branch (thinner: `widthStart` ~2–4 px) — hierarchical branching is supported.
      `trunkBranchRatio` (40–80 %, default 70 %) controls what fraction originate from the trunk.
- [ ] **REQ-T-09** If a branch endpoint is above the canopy bottom, it must terminate inside a
      canopy blob (hidden by the canopy layer). If below the canopy bottom, it may end in open air.

### 4.3 No-floating-blobs invariant

- [ ] **REQ-T-10** Every canopy blob must either overlap with at least one other blob OR have at
      least one branch endpoint inside it. After generation, isolated blobs without a connecting
      branch must receive an extended or new branch.

---

## 5. Lighting & Colour

### 5.1 Canopy lighting

- [ ] **REQ-L-01** Each canopy blob uses hemisphere lighting mapped to **that blob's own** center
      and radii — not global canopy bounds.
- [ ] **REQ-L-02** Ambient component is `0.15`; diffuse component is `0.85 × diffuse`:
      `lighting = 0.15 + 0.85 × diffuse`.
- [ ] **REQ-L-03** Lightness spread is `(lighting − 0.5) × 60` (not 50).
- [ ] **REQ-L-04** `depthVariance` scales the hemisphere z-component:
      `z = sqrt(1 − r²) × depthVariance`. At `0.0` lighting is uniform; at `1.0` standard; at `2.0`
      exaggerated.
- [ ] **REQ-L-05** Shadowed faces shift hue toward blue-green (cooler). Lit faces shift hue toward
      yellow-green (warmer).
- [ ] **REQ-L-06** Saturation boost on shadowed faces: `(0.5 − lighting) × 20`.
- [ ] **REQ-L-07** Target colour range for a green canopy (`hue=120, sat=60, light=40`): brightest
      triangles `hsl(140, 50%, 65%)`, mid-tone `hsl(125, 60%, 40%)`, darkest `hsl(110, 70%, 18%)`.

### 5.2 Trunk / branch lighting

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

### 8.1 Layout (both pages)

- [ ] **REQ-S-01** Both showcase pages use a `100dvh` CSS grid layout — the tree preview never
      scrolls with the page.
- [ ] **REQ-S-02** Left column: scrollable controls panel (`overflow-y: auto`).
      Right column: tree preview — centred, scaled to fit, sticky.
- [ ] **REQ-S-03** Controls panel uses a 2-column card grid when viewport width ≥ 1200 px;
      single column below that.

### 8.2 `/showcase` — Single Tree Editor

- [ ] **REQ-S-04** Controls: shape selector (dropdown); seed (number input + Randomize button);
      `canopyPolygons` slider (10–150); `trunkPolygons` slider (10–100); `depthVariance` slider
      (0.0–2.0, step 0.1); `blobSizeVariance` slider (1.0–10.0, step 0.1, label "Nx");
      `blobCloseness` slider (20–80, step 1, label "N %"); `trunkThickness` slider (50–200,
      step 5, label "N %"); `branchThickness` slider (50–200, step 5, label "N %"); `canopySize`
      slider (50–200, step 5, label "N %"); `trunkHeight` slider (30–150, step 5, label "N %");
      `trunkBranchRatio` slider (40–80, step 5, label "N %"); canopy group (hue, hue spread,
      saturation, lightness); trunk group (hue, saturation, lightness); `lightAngle` slider
      (0–360); `blobCount` slider (1–8); `branchCount` slider (0–20); Show Anchors checkbox;
      Show Canopy / Show Branches / Show Trunk debug checkboxes.
- [ ] **REQ-S-04a** All sliders display real-world values: percentages, multipliers ("Nx"),
      degrees ("°"). No abstract 0–1 ranges.
- [ ] **REQ-S-05** Preview shows a single tree rendered at large size.

### 8.3 `/showcase/scene` — Three-Tree Scene

- [ ] **REQ-S-06** Right column displays three trees side by side, one of each shape (`oak`, `pine`,
      `birch`).
- [ ] **REQ-S-07** Shared controls: seed, `canopyPolygons`, `trunkPolygons`, `depthVariance`,
      `blobSizeVariance`, `blobCloseness`, `trunkThickness`, `branchThickness`, `canopySize`,
      `trunkHeight`, `trunkBranchRatio`, canopy colours, trunk colours, `lightAngle`. No per-tree
      shape selector.
- [ ] **REQ-S-08** Individual seeds are offset from the base seed: `seed`, `seed + 1000`,
      `seed + 2000`.
- [ ] **REQ-S-09** `branchCount` max on this page is 20.

### 8.4 Root page

- [ ] **REQ-S-10** The root page (`/`) contains a navigation link/button to `/showcase`.
