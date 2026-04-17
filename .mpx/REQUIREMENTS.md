# Requirements

Canonical source of truth for what the system should do.
GitHub issues track execution; this file tracks the specification.
Sections marked **[NOT IMPLEMENTED]** are planned but not yet built.

> **Backup:** Previous requirements in `REQUIREMENTS_backup.md` for traceability.

---

## Architecture & Tech Stack

- SvelteKit + Svelte 5 runes, TypeScript strict, Tailwind CSS, shadcn-svelte
- SVG-based rendering with CSS animations (GPU accelerated via `will-change: transform`)
- Seeded PRNG for deterministic generation — same seed = same tree
- Drizzle ORM (PostgreSQL, strict mode)
- better-auth with passkey, Google/GitHub OAuth, email/password
- No BamGit-specific logic (git concepts, issue states) — pure visualization
- No canvas or WebGL — SVG only

---

## Tree Shapes

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

## Trunk & Branches

### Trunk Rendering

- Stacked quadrilaterals (trapezoids) split by a vertical centerline
- Each trunk segment (between crookedness junctions) = one quad
- Centerline bisects each quad into left/right halves for two-tone shading
- Rectangle edges ARE the trunk silhouette — no clip-path needed
- Tapers from `trunkBaseWidth` to `trunkTopWidth`
- Trunk height range: 10%-150%, thickness range: 25%-400%

### Two-Tone Shading

- Light side / dark side per quad half, based on `lightAngle`
- Flat color per half (no gradient within each half)
- Uses HSL trunk color parameters (hue, saturation, lightness)
- Changing `lightAngle` visibly flips which half is lighter
- Same model for trunk and branches

### Branch System

- Same quad + centerline rendering as trunk
- Centerline follows branch direction (not always vertical)
- Per-level count via dual-thumb range sliders: `branchesLevel1Range`, `branchesLevel2Range`, `branchesLevel3Range`
- Sub-branches originate from upper 50-100% of parent (not tip-only)
- Independent segments and crookedness per branch
- `branchDepthTaper` (30-80%, default 55%) controls depth-to-depth thickness
- Dynamic slider maximums based on available trunk/parent length
- `branchAngle` (0-100%) controls spread: 0% = wide horizontal, 100% = narrow upward

### Crookedness

- Max 90 deg per junction at 100% crookedness
- 50% jitter reduction (45-90 deg range at 100%)
- Random L/R direction per junction — enables S-curves, zigzags
- Self-intersection prevention: absolute angle from vertical clamped to +/-85 deg
- Separate trunk and branch crookedness sliders

### Branch Rules (A-K)

- **A** Every branch starts on trunk or another branch
- **B** Every canopy blob must overlap another blob OR have a branch leading into it
- **C** >=5px of every branch visible outside canopy; <5px rejected
- **D** Branches do not cross trunk centerline
- **E** Angle divergence 30-60 deg from parent direction; `branchAngle` slider shifts range
- **F** Overlap only checked between same-depth siblings
- **G** Floating blob fallback: emergency branch from trunk center to unconnected blob
- **H** Level-1 branches from upper half of trunk only
- **I** Level-1 branches alternate L/R with random starting side (seeded)
- **J** Hard cap 25 branches total across all levels
- **K** Child branch length = 20-80% of parent, default center 50%

### Maple Unification

- No separate `generateMapleBranches()` — maple uses generic branch system
- Distinct look from blob layout (arc distribution) and config defaults only

### Branch Junction Fill

- Fill polygon at every parent-child junction to eliminate wedge gaps
- Color: parent branch dark-side color

---

## Canopy

- `polygonsPerBlob` controls per-blob polygon density (replaces old `canopyPolygons`)
- Polygon count scales proportionally with blob area (2x bigger = ~2x more polygons)
- Changing `blobCount` does NOT affect per-blob density
- Blobs attach at branch endpoints (not floating disconnected)

---

## Colors & Lighting

- 2-color canopy picker + trunk color swatches + per-shape color defaults
- HSL-based color system for trunk and canopy
- `lightAngle` controls hemisphere lighting direction
- Canopy triangle lighting from same hemisphere model as trunk
- Two-tone trunk/branch shading responds to `lightAngle`

---

## Fruits & Flowers

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

### Flowers

- Each tree type has unique flower SVG in `assets/flowers/`
- `flowering` stage renders flowers at `fruitSlots[]` positions
- Earlier stages (sprouting, sapling) can render flowers at available slots
- "Flower" removed from FRUIT_TYPES — flowers are lifecycle-only, not a fruit selection

---

## Lifecycle Stages

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

## Anchors

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

- Dynamically computed from generated geometry (not hardcoded)
- `fruitSlots[]` deterministic per seed
- `branchTips[]` length matches actual branch count
- Anchors update reactively when config changes

### Future: `crownPerimeter[]`

Sample points along outer boundary of merged canopy silhouette. For leaf placement on canopy surface, celebration particle origins. Not yet implemented.

---

## Animations

- **Canopy sway** — CSS transform rotation, 2-3s cycle, per-tree phase offset, ~2-3 deg amplitude
- **Branch movement** — individual CSS animation per branch, 1.5-4s range, transform origin at branch base
- **Growth animation** — `growthProgress` (0->1): trunk height x progress, branch length x progress, canopy at full size from start (revealed as trunk grows); replaces old uniform `scale(0.05->1)`
- **Tool animations** — each tool has distinct idle animation with `transform-origin` at snap point (see Tools)
- All toggleable via checkboxes, loop while checked
- No performance degradation at 100 trees

---

## Tools & Accessories

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
- `snapOffset` defined per tool in config (not hardcoded in component)

### Woodpecker

- Represents code review (tree-doctor bird metaphor)
- Clings to trunk side at `trunkMiddle`
- Numeric badge (1-6) for active reviewer count
- Badge hidden when count is 0 or undefined

---

## Special Trees

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

## Scene

- Tree count slider: 3-100, default 3
- Each tree gets random shape + seed (varied tree types mixed)
- Depth positioning: continuous y-offset, back trees scale to ~65%
- SVG painter's algorithm: back-to-front rendering for occlusion
- Depth spread slider: 0 = flat row, max = full depth range
- Deterministic given same seed

---

## Environment Effects [NOT IMPLEMENTED -- #66]

7 effects, all scene-wide and independently toggleable:

- **Rain** — CSS-animated SVG lines, intensity slider (light to heavy), diagonal fall
- **Lightning** — random flashes 5-15s, 100-200ms white overlay, optional bolt SVG; not epilepsy-inducing
- **Fireflies** — glowing dots, random walk + pulse, ~2/sec spawn, ~8s lifetime
- **Wind particles** — leaf/petal sprites drifting horizontally, rotation, varied size/opacity
- **Snow** — slow-falling white flakes, gentle horizontal drift, no accumulation
- **Sun rays** — semi-transparent diagonal gradient lines from upper corner, golden tone; works with `lightAngle`
- **Clouds** — low-poly polygon shapes (3-5 triangles), slow horizontal drift, sky area only

---

## Overlay Primitives [NOT IMPLEMENTED -- #66]

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

## Root Connections [NOT IMPLEMENTED -- #66]

- SVG bezier curves between trees' `roots` anchors
- Organic/curved paths with slight randomness
- Visual states: connected (solid), disconnected (dashed/faded)
- Rendered below tree layer
- For sub-tree to oak/PRD tree connections

---

## Ground Elements [NOT IMPLEMENTED -- #66]

- Toggle per tree: `groundElements: true/false`
- Random 2-3 stones + grass tufts via seeded PRNG
- SVG assets in `assets/ground/`
- Must not obscure trunk base or tools
- Deterministic per seed

---

## UI & Editor Controls

### Single Tree Editor

- Simple/advanced controls toggle
    - **Simple:** branchDepth, branchesLevel1Range, branchAngle, trunkSegments, trunkCrookedness, trunkHeight, trunkThickness, branchThickness
    - **Advanced:** adds branchesLevel2/3Range, branchSegments, branchCrookedness, branchDepthTaper, branchLength, branchLengthVariance
- All sliders use shadcn-svelte Slider component
- Dual-thumb sliders for per-level branch count ranges
- Per-shape defaults load when shape changes

### Sidebar

- User dropdown: avatar + username + email + ChevronsUpDown trigger
- Dropdown contents: user info, settings link, theme submenu (Light/System/Dark via mode-watcher), sign out
- Collapsed sidebar: avatar remains as trigger
- Not signed in: "Sign in" button links to `/auth/sign-in`

---

## Authentication

- better-auth: email/password, Google OAuth, GitHub OAuth, passkey
- Sign-in page (`/auth/sign-in`): centered card, social buttons (Google, GitHub, Passkey) + email/password fields
- Sign-up page (`/auth/sign-up`): centered card, social buttons (no passkey) + name/email/password fields
- Cross-links between sign-in and sign-up
- Redirect authenticated users away from auth pages

---

## Gallery & Persistence

- Tree saving/loading via database (Drizzle + PostgreSQL)
- Gallery page showing saved trees
- Sidebar navigation between editor, scene, gallery

---

## SVG Asset Pipeline

- Asset folder: `src/lib/trees/assets/` with subfolders: `tools/`, `fruits/`, `flowers/`, `stages/`, `ground/`
- Consistent import pattern across codebase
- Placeholder SVGs created in code, replaced with Recraft AI-generated finals
- SVG sourcing: Recraft AI for direct SVG, Vectorizer.AI for PNG to SVG conversion

---

## Library API [NOT IMPLEMENTED -- #67]

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

## Trunk & Branch Rendering Overhaul

> Visual target: low-poly 3D-style trees with faceted trunks, seamless branch junctions, and canopy blobs sitting on branch tips. Reference: 3-tree illustration (bare, leafy, full canopy) showing tri-split shading, alternating S-curve crookedness, and natural branch emergence.

### Tri-Split Trunk/Branch Shading

- Replace current 2-part centerline split with 3-face rendering: left-dark, center-light, right-medium
- Suggests hexagonal cross-section (low-poly 3D aesthetic)
- Center strip width varies by `lightAngle` to indicate light direction
- Always visible — even on straight trunks with crookedness=0
- Same tri-split system applies to branches (3 quads per segment instead of 2)
- Each face color derived from HSL trunk/branch color + `lightAngle` dot product with face normal
- **Acceptance:** trunk and branches show 3 distinct shading faces at any crookedness level; changing `lightAngle` visibly shifts which face is brightest

### Branch-Trunk Shared Vertices

- Branches must share vertices with trunk quads at junction points — no overlap rendering
- Branch quad starts exactly at the trunk edge polygon, creating a clean geometric seam
- Shading is seamless across junction but respects per-segment light angle (branches naturally get slightly different shade due to their angle vs trunk)
- Replaces current system where branches render as independent overlapping polygons
- **Acceptance:** no visible gap or overlap at branch-trunk junctions; zooming in shows shared edge between trunk quad and branch quad

### Crookedness Alternation

- Default mode: **alternating** — if segment N bends left, segment N+1 bends right (natural S-curves)
- Secondary mode: **random** — current behavior, kept for edge cases (dead stage, extreme crookedness)
- `crookednesMode: 'alternating' | 'random'` config param, default `'alternating'`
- Segment length variation: each segment ±30% of average segment length (allows one long + several short segments)
- Self-intersection prevention still applies (absolute angle clamped ±85°)
- **Acceptance:** default trunk shows clear S-curve pattern; random mode available via advanced controls

### Updated Default Segments & Crookedness Per Shape

| Shape  | trunkSegments | trunkCrookedness | Notes                  |
| ------ | ------------- | ---------------- | ---------------------- |
| Oak    | 5             | 15%              | Gnarly, character-rich |
| Maple  | 3             | 20%              | Moderate twist         |
| Birch  | 3             | 10%              | Elegant, subtle        |
| Willow | 5             | 20%              | Droopy, winding        |
| Cherry | 3             | 10%              | Elegant                |
| Baobab | 3             | 10%              | Thick, slight twist    |
| Acacia | 3             | 10%              | Moderate               |
| Others | 3             | 10%              | Reasonable default     |

### Branch-to-Trunk Ratio Controls

- Replace separate `branchLength` and `branchThickness` sliders with ratio-based controls:
    - `branchLengthRatio` (% of trunk length, e.g., 55%) — replaces `branchLength`
    - `branchThicknessRatio` (% of trunk thickness, e.g., 45%) — replaces `branchThickness`
- Prevents disproportionate branches; simpler mental model
- Per-shape defaults set reasonable ratios
- `branchDepthTaper` remains for level-to-level thinning within branch hierarchy
- `branchLengthVariance` remains in advanced tier
- **Acceptance:** no separate absolute branch length/thickness sliders; ratio sliders produce proportional branches across all trunk sizes

### Rule L: Trunk-to-Canopy Connection

- New enforced rule: trunk tip must either spawn a Level-1 branch or directly connect to the nearest canopy blob
- Trunk never ends in empty space with no visual connection to canopy
- For shapes with `branchDepth=0` (bush, cypress, pine, fir), trunk tip connects directly to lowest/nearest blob
- Complements existing Rule G (floating blob fallback)
- **Acceptance:** no configuration produces a trunk tip that ends in void with no branch or blob attached

---

## Animation Fixes

### Reduce Canopy Sway Delay

- Current: `computeAnimationDelay(seed)` returns 0–3s per-tree delay before sway starts
- Change: reduce range to 0–0.5s so sway begins almost immediately when toggled
- Per-blob stagger (blobIndex × 0.15s) remains for within-tree variety
- **Acceptance:** sway visibly starts within 0.5s of toggling the checkbox

### Hierarchical Branch Animation

- Current: each branch animates independently with its own CSS rotation — child branches detach from parents
- Change: nest child branch `<g>` elements inside parent's animated group so children inherit parent rotation + add their own
- Render structure: `trunk → L1 animated group → L2 animated group (nested)`
- Child branches stay physically connected to parent at all times during animation
- **Acceptance:** during branch sway animation, no branch visually detaches from its parent; sub-branches follow parent movement

### Animate Tools Fix

- "Animate tools" checkbox does not trigger any tool animations
- Investigate and fix: tool animation CSS classes may not be applied when checkbox is toggled
- **Acceptance:** toggling "Animate tools" starts/stops all visible tool idle animations

### Falling Leaves Start Position

- Current: falling leaf particles start from top of viewport
- Change: particles originate from canopy bottom boundary (bottom edge of lowest canopy blob)
- Leaves fall downward from canopy, not from sky
- **Acceptance:** leaf particles spawn at/near canopy bottom edge and fall toward ground

---

## UI & Layout Fixes

### Settings Panel Position — Both Editors on Right

- Scene editor: already `grid-cols-[1fr_320px]` (controls right) — no change
- Single editor: change from `grid-cols-[320px_1fr]` to `grid-cols-[1fr_320px]` — move controls to right
- Preview/canvas on left, settings panel on right, both pages consistent
- **Acceptance:** both editor pages have settings on the right side

### 3-Tier Settings Control (Basic / Intermediate / Advanced)

- Replace current binary "Advanced" checkbox with 3-tier segmented control at top of settings panel
- Use shadcn-svelte component (Tabs or ToggleGroup) for the switcher
- Tiers are **additive** — higher tiers show all controls from lower tiers plus their own
- Persistent per session (not per page load)

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
- Branch Depth Taper, Branch Length Variance
- Polygons Per Blob, Blob Closeness
- Per-blob custom editor (custom shape only)

- **Acceptance:** 3-segment switcher visible at top of settings; each tier shows correct subset; selection persists during session

### Remove Trunk Polygons Slider

- Remove `trunkPolygons` slider from UI
- Clean up all related code, types, and config properties
- **Acceptance:** no references to `trunkPolygons` in codebase

### Viewport Size — All Stages 300×300

- Change `VIEWBOX_WIDTH` from 200 to 300, `VIEWBOX_HEIGHT` from 300 to 300
- Uniform square viewport for all stages
- Adjust `GROUND_LINE_Y` proportionally (currently `H*0.95 = 285`, new: `300*0.95 = 285` — stays same)
- Audit all hardcoded coordinates (seed/stump geometry, tool snap offsets, fruit slots) for new viewport
- OakTree/PRD variant: scale proportionally from new base
- **Acceptance:** all trees render in 300×300 viewBox; no clipping on crooked/leaning trees; dead stage has room for twisted trunk

### Settings Visible When Signed Out

- Currently some settings/controls may be hidden or non-functional when user is not authenticated
- All tree editing controls should be fully functional without sign-in
- Only save/load/gallery features require authentication
- **Acceptance:** unauthenticated users can access and use all editor controls; only persistence features are gated

---

## Tree-Specific Visual Bugs

### Birch Stripe Markings

- Birch trunk must display dark horizontal bars (black/dark-grey stripes)
- Stripes are characteristic birch visual — deferred from shape redesign PR
- Render as additional SVG elements overlaid on trunk quads or as pattern within trunk rendering
- **Acceptance:** birch shape shows visible horizontal dark stripes on the white/grey trunk

### Pine Trunk Height Bug

- At `trunkHeight=10%`, pine tree still displays approximately half of the original trunk height
- Likely a calculation bug in how percentage maps to actual height for pine shape
- **Acceptance:** `trunkHeight=10%` on pine produces a very short trunk (~10% of the available vertical space)

### Dead Stage — Crookedness + Lean

- Current: dead stage only sets `trunkLean=30`, trunk stays straight
- Change: dead stage applies both crookedness AND lean
    - `trunkCrookedness=50`, `trunkLean=15`, `trunkSegments=5`
    - Use `random` crookedness mode (not alternating) for a broken/twisted look
    - No canopy, desaturated colors (existing)
- **Acceptance:** dead trees look twisted and broken, not just tilted

### Willow Branch Drooping

- Willow branches should reach lower blob positions, creating visual droop
- Current `branchAngle=30%` already set low for willow shape defaults
- May need tuning of blob placement (lower positions) and branch endpoint targeting
- **Acceptance:** willow has visibly drooping branches compared to other tree shapes

---

## Canopy & Defaults Retuning

> Fix default canopy sizing across all tree species so trees look rich and full out of the box. Address floating blobs, branches poking through canopy, and pine-specific tuning.

### Per-Species Canopy Envelope Retuning

- Increase envelope base radii (`baseRadiusX`, `baseRadiusY`) to 1.8× current values for all leafy/branching-canopy trees: oak, birch, maple, willow, apple, cherry, baobab, acacia
- Pine/fir: reduce tier width constants to produce canopy equivalent to previous 80% `canopySize` — adjust the `baseHalfWidth` formula coefficients in `tiers.ts`, NOT just the default `canopySize` slider value
- The `canopySize` slider default stays at 100% for all species — the underlying generation constants change so 100% produces the correct canopy
- Ensure default envelope radii do not cause canopy blobs to overflow the 300×300 viewbox; users can push past bounds via the slider
- **Acceptance:** oak/maple at default 100% canopySize look as rich as the previous 200%; pine at default 100% looks like previous ~80%; no default configuration causes viewbox overflow

### Floating Blob Repositioning

- Enable floating blob detection for branching-canopy shapes (oak, birch, maple, willow, apple, cherry, baobab, acacia) — currently `validateNoFloatingBlobs()` is skipped for these
- Instead of creating emergency fallback branches, reposition isolated blobs toward their nearest overlapping neighbor blob until they overlap
- A blob is "isolated" if it doesn't overlap any other blob AND no branch tip reaches it
- **Acceptance:** no canopy blob floats disconnected from the rest of the canopy mass at any seed with default settings

### Branch Tip Trimming to Canopy Boundary

- After clustering, trim branch tip endpoints that extend past their associated canopy blob boundary
- Project the tip back onto the blob ellipse along the branch direction
- Branches visually "go into" the canopy but never poke out the other side
- **Acceptance:** no branch segment visibly extends past its canopy blob boundary at default settings

### L2/L3 Branch Length Reduction

- Reduce L2 branch length by 15% (change `CHILD_LENGTH_RATIO_MAX` from 0.8 → ~0.68 or apply a 0.85 multiplier)
- Reduce L3 branch length by 30-40% — L3 branches should be noticeably short stubs
- Ensure the reduction doesn't conflict with existing `branchLength` and `branchLengthVariance` slider ranges
- **Acceptance:** L2 branches are visibly shorter than current; L3 branches are very short stubs; sliders still function correctly at all values

### Pine-Specific Tuning

- Increase pine default `blobCloseness` from 30 → 60 for better tier overlap
- Slightly increase tier `ry` (vertical thickness) so tiers visually overlap without gaps
- Tier width reduction via `baseHalfWidth` constants (see envelope retuning above)
- Pine trunk height bug remains tracked in issue #85 as a separate fix
- **Acceptance:** pine tiers always visually overlap (no gaps); pine silhouette is narrower than current default

### Blob Count Slider Expansion

- Increase blob count slider max from 8 → 25 for all species
- The existing inverse-sqrt scaling (`targetRadius = sqrt(envelopeArea / blobCount / π)`) already handles sizing
- Enforce a minimum blob radius so blobs remain visible at high counts (not invisible dots)
- Keep per-species default blob counts unchanged (oak=5, birch=6, etc.)
- **Acceptance:** slider goes to 25; at 20+ blobs, each blob is small but visible; tree renders correctly

### Reset to Defaults Button

- Add a "Reset to [Species] defaults" button below the Tree Type dropdown in the Shape card
- Label updates dynamically based on current species (e.g., "Reset to Oak defaults")
- Resets all parameters (geometry, colors, branch config, fruit) to `SHAPE_DEFAULTS` for the current species
- Does NOT change the species itself or the seed
- **Acceptance:** clicking reset restores all parameters to the species' preset values; seed and species are preserved

---

## Branch Symmetry & Trunk Fork

> Add natural-looking symmetry options for branch placement and trunk forking. Some trees (acacia, cherry) benefit from mirrored branching and Y-fork trunk splits.

### Branch Mirror Symmetry Dropdown

- Add a 3-state dropdown "Branch Mirroring" to the branch controls section:
    - **Off** — current behavior: L1 branches alternate left/right, random junctions, overlap rejection as-is
    - **Allowed** — relaxes same-junction overlap rejection for branches on opposite sides: same-point pairs more likely but not forced
    - **Preferred** — actively generates L1 branches in pairs from the same trunk junction: one left, one right. Angle and length differ slightly between the pair (controlled by existing `branchAngle` and `branchLengthVariance` sliders — no new variance parameters)
- When "Preferred": L1 branch count minimum becomes 2; if `branchesLevel1Range` min is < 2, treat as 2
- When "Preferred" on L1 branches: L2 sub-branches also generate in pairs from L1 tips (branch-level forking), with L2 count minimum of 2
- Must not conflict with existing branch count sliders — if user sets L1 range to [1,1] and symmetry is "Preferred," the minimum is bumped to 2 transparently
- Per-species defaults:

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

- **Acceptance:** "Off" produces current behavior; "Allowed" allows more same-junction pairs; "Preferred" produces visibly paired branches with natural variation; all combinations with existing sliders work without errors

### Trunk Fork (Y-Split)

- Add a "Trunk Fork" checkbox to the branch controls section
- When enabled:
    - Trunk flares (widens) at the last 1-2 segments — width increases by ~30-50% at the top
    - Two L1 branches are forced from the topmost trunk junction, diverging symmetrically (with natural variance from existing `branchAngle` slider)
    - Each fork arm has `widthStart ≈ trunkTopWidth × 0.6-0.7` (combined width > trunk width at split point)
    - Fork arms are standard L1 branches — they support L2/L3 sub-branches, canopy blob clustering, everything downstream
    - L1 branch count minimum becomes 2 (fork arms count as L1 branches)
- When combined with "Preferred" mirror symmetry: fork arms are the primary mirror pair; additional L1 branches (if any from slider) also mirror
- Branch-level forking: when mirror symmetry is "Preferred," L1 branch tips also fork into paired L2s with the same flare + thick-pair logic
- Per-species defaults:

| Species    | Trunk Fork Default |
| ---------- | ------------------ |
| Acacia     | On                 |
| All others | Off                |

- Must work correctly with `branchAngle` slider (shifting fork angle up/down), `branchDepth` (fork arms respect depth limits), and all branch count sliders
- **Acceptance:** trunk visually thickens and splits into two substantial arms; fork arms support sub-branches and canopy; toggling trunk fork on/off produces visually distinct results; acacia default shows characteristic Y-fork umbrella shape

---

## SVG Accessories & Fruit

### Watering Can Tilt

- Watering can SVG should be tilted (rotated) as if pouring water
- Apply a static rotation to the watering can's resting/idle position
- **Acceptance:** watering can visually appears tilted/pouring, not upright

### Woodpecker Positioning

- Keep feet/claws as snap point
- Reposition to trunk center (trunkMiddle anchor) — ensure it's flush against trunk, not offset
- **Acceptance:** woodpecker sits directly on trunk center, facing the trunk

### Fruit Size 2×

- Double the rendered size of all fruit SVG components
- Apply uniform scale factor (2×) to fruit `<g>` transform or increase SVG local coordinates
- Check containment boundary — may need to adjust `nx^2 + ny^2 <= 0.85` inset
- **Acceptance:** fruits are visually twice as large as current rendering

---

## Authentication

### Sign-In Reliability

- Sign-in flow (email/password, Google OAuth, GitHub OAuth, passkey) has intermittent failures
- Investigate: session persistence, OAuth callback handling, redirect logic
- **Acceptance:** all sign-in methods work reliably; no silent failures or stuck states

---

## Scene Positioning Overhaul

### Priority-Based Scene Layout

- Replace current random scene positioning with structured layout
- Trees have optional `priority` (0=background, 1=foreground) and `blockedBy?: treeId`
- **Front row** (priority=1 or default): largest trees placed at scene baseline, equidistant from each other
- **Back rows** (priority=0 or overflow >10 trees): slightly elevated, smaller (perspective scale), semi-random horizontal placement behind their blockers
- Only when >10 trees should back rows be populated
- Metadata display: optional slot/overlay per tree (consuming app decides content)
- No BamGit-specific concepts in the tree library — generic priority/blocked API
- **Acceptance:** ≤10 trees all appear in equidistant front row; >10 trees overflow to scaled-down back row; `blockedBy` trees always appear behind their blocker
