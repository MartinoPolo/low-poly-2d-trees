# Requirements

Persistent project requirements. Updated via `/mp-grill-requirements`.
GitHub issues track execution state; this file tracks the full requirement set.

## Sidebar User Dropdown & Auth Pages Redesign

### 1. Sidebar Footer — User Dropdown Menu

Replace the current scattered sidebar footer (standalone theme toggle, Settings button, user info, sign-out button) with a consolidated user dropdown.

**Trigger row:** Avatar + username + email + ChevronsUpDown icon in a single SidebarMenuButton. Follows shadcn-svelte sidebar-07 block pattern.

**Dropdown contents (top to bottom):**

- User info label (name + email, non-interactive)
- Separator
- Settings link → navigates to /settings
- Separator
- Theme nested submenu (DropdownMenu.Sub): SubTrigger "Theme" → SubContent with RadioGroup (Light/System/Dark with Sun/Monitor/Moon icons). Bound to mode-watcher.
- Separator
- Sign out (POST to /auth/sign-out)

**Collapsed sidebar:** Avatar remains visible as dropdown trigger (currently user section hides entirely).

**Not signed in:** "Sign in" button links to /auth/sign-in.

**New shadcn component:** Add `dropdown-menu` to the project.

**Removes:** DarkModeToggle.svelte becomes unused after migration.

### 2. Auth Sign-In Page (login-03 style)

New route: `/auth/sign-in`

**Layout:** Centered card on muted background. TreePine icon + "Low-Poly Trees" branding above card.

**Card contents:**

- Title + description
- Social buttons: Google, GitHub, Passkey (3 buttons)
- Separator: "Or continue with email"
- Email + Password fields
- Submit button
- Error alert
- Cross-link: "Don't have an account? Sign up" → /auth/sign-up

**Auth:** better-auth client — email/password signIn, Google/GitHub socialProvider, passkey authenticate.

**Server:** Redirect authenticated users away.

### 3. Auth Sign-Up Page (signup-03 style)

New route: `/auth/sign-up`

**Layout:** Centered card on muted background. TreePine icon + "Low-Poly Trees" branding above card (matching sign-in).

**Card contents:**

- Title + description
- Social buttons: Google, GitHub (no passkey for sign-up — registered post-login in /settings)
- Separator: "Or continue with email"
- Name + Email + Password (min 8 chars) + Confirm Password fields
- Submit button
- Error alert
- Cross-link: "Already have an account? Sign in" → /auth/sign-in

### 4. Remove Old /auth Route

Delete `/auth/+page.svelte`. Route becomes 404. All references updated to /auth/sign-in or /auth/sign-up.

### Technical Context

- SvelteKit + Svelte 5 runes, TypeScript strict, Tailwind CSS, shadcn-svelte
- better-auth with passkey plugin, Google/GitHub OAuth, email/password
- mode-watcher for theming (userPrefersMode, setMode)
- Existing shadcn components: sidebar, button, card, input, label, select, separator, tooltip, sheet, alert, badge, checkbox, switch, textarea, accordion, skeleton
- Dropdown-menu component needs to be added

---

## Tree Visualization Library & Scene Enhancements

This section covers evolving low-poly-2d-trees into a comprehensive tree visualization library — both as a standalone showcase and as the rendering engine for [BamGit](C:/_MP_projects/BamGit)'s forest view. One PRD, phased delivery.

### Library Architecture

#### LIB-1. Package Boundary

Start as a **local workspace dependency** (pnpm workspace `"workspace:*"`). Design exports as if publishing to npm — explicit barrel exports, no internal path reaching. Graduate to npm package once API stabilizes.

**Acceptance criteria:**

- BamGit can import tree components and generation functions via a clean public API
- No BamGit-specific logic (git concepts, issue states) exists in this project
- All public types exported from a single entry point

#### LIB-2. Public API Surface

Export the following from the library:

- `generateTree(config)` → `TreeGeometry` (procedural generation)
- `<LowPolyTree>` component (SVG renderer)
- `<PottedPlant>` component (simplified plant renderer)
- `<OakTree>` component (large PRD/centerpiece tree)
- `<TreeScene>` component (multi-tree scene with positioning)
- Overlay primitive components (cloud, speech bubble, particle emitter)
- Tool accessory components (shovel, ladder, watering can, bird nest)
- Growable components (fruit/berry renderer)
- Environment effect components (rain, lightning, fireflies, wind, snow, clouds, sun rays)
- All TypeScript types (`TreeConfig`, `TreeGeometry`, `TreeAnchors`, `LifecycleStage`, etc.)

**Acceptance criteria:**

- Each export is documented with JSDoc
- Types are strict — no `any` leakage

---

### Scene Management

#### SCN-1. Tree Count Slider

Add a slider to the existing `/showcase/scene` page controlling how many trees render in the scene.

- Range: 3–100
- Default: 3
- Each tree gets a **random shape and seed** (different tree types mixed)
- Slider appears in the scene editor controls panel

**Acceptance criteria:**

- Slider value updates tree count in real-time
- Trees are visually distinct (varied shapes, seeds)
- No artificial performance cap — allow testing at 100 trees

#### SCN-2. Depth & Positioning System

Semi-random positioning that simulates trees at varying distances from the viewer.

- **Flat horizontal baseline** with vertical offset to simulate depth rows
- **Continuous depth** — each tree gets a random y-offset within a configurable range; scale derived from y-position
- **Back trees scale to ~65%** of front trees (linear interpolation based on y-position)
- **SVG painter's algorithm** — render back-to-front so front trees naturally occlude back trees (SVG stacking order)
- **One "depth spread" slider** controlling how much vertical/scale variation exists (0 = all same row, max = full depth range)

**Acceptance criteria:**

- Trees further back (higher y) appear smaller
- Front trees visually overlap/occlude trees behind them
- Depth spread slider produces smooth visual transition from flat to deep
- Deterministic given same seed — repositioning is stable

---

### Anchor System

#### ANC-1. Dynamic Anchor Computation

Replace hardcoded anchor points with **dynamically computed anchors** derived from actual generated geometry. All anchor points computed per-tree during generation.

##### Scalar Anchors (V1)

| Anchor        | Computation                           | Purpose                                                           |
| ------------- | ------------------------------------- | ----------------------------------------------------------------- |
| `crownCenter` | Center of canopy bounding box         | Overlays, decorations centered on canopy                          |
| `crownTop`    | `min(y)` across all canopy triangles  | Floating elements above tree (clouds, bubbles, status indicators) |
| `trunkMiddle` | Midpoint along trunk polyline path    | Ladder tool snap, mid-trunk attachments                           |
| `trunkBase`   | Trunk-ground junction point           | Shovel, watering can, companion saplings                          |
| `roots`       | `trunkBase.y + offset` (below ground) | Root connection line endpoints for BamGit                         |

##### Array Anchors (V1)

| Anchor         | Computation                                                                             | Purpose                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `branchTips[]` | Endpoint of each generated branch                                                       | Wind leaf particle origins, leaf-shedding animation origins. Data already computed internally — expose it. |
| `fruitSlots[]` | 5–7 deterministic Poisson-sampled positions within canopy boundary, seeded by tree seed | Fruit/berry placement for growables and BamGit session fruit                                               |

##### Array Anchors (V2)

| Anchor             | Computation                                                    | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- | -------------------------------------------------------------- |
| `crownPerimeter[]` | Sample points along outer boundary of merged canopy silhouette | Leaf placement on canopy surface, celebration particle origins |

**Acceptance criteria:**

- `TreeGeometry.anchors` contains all V1 scalar and array anchors
- Anchors update when tree config changes (reactive)
- `fruitSlots[]` are deterministic per seed — same seed produces same positions
- `branchTips[]` length matches actual branch count

---

### Tree Lifecycle Stages

#### LIF-1. Lifecycle Stage System

Implement **11 tree lifecycle stages** that produce visually distinct trees from the same generation pipeline. Each stage modifies generation parameters and visual presentation.

| Stage       | Visual Description          | Key Differences from Mature                                      |
| ----------- | --------------------------- | ---------------------------------------------------------------- |
| `seed`      | Seed sitting on soil        | No trunk, no canopy — small seed polygon on ground line          |
| `sprouting` | Seed with tiny green shoot  | Minimal trunk stub, 1–2 tiny leaf polygons                       |
| `sapling`   | Young small tree            | Short trunk, small sparse canopy, thin branches                  |
| `growing`   | Sapling with support stakes | Sapling + decorative stake polygons alongside trunk              |
| `leafy`     | Full mature tree            | Current default generation output                                |
| `fruiting`  | Tree with visible fruit     | Mature tree + fruit rendered at `fruitSlots[]`                   |
| `autumn`    | Orange/red/brown canopy     | Mature tree with warm HSL canopy colors + falling leaf particles |
| `ready`     | Full glowing tree           | Mature tree + subtle glow/highlight effect                       |
| `bare`      | Leafless winter tree        | Trunk and branches only, no canopy polygons                      |
| `dead`      | Fallen/tilted tree          | Rotated trunk, broken branches, brown/grey tones                 |
| `stump`     | Low tree stump              | Very short trunk, no branches, no canopy                         |

**Acceptance criteria:**

- `TreeConfig` accepts a `stage` field (defaults to `'leafy'` for backward compatibility)
- Each stage produces a visually distinct, recognizable tree
- Stages are demonstrated in the standalone showcase
- Stage transitions could be animated (stretch goal)

#### LIF-2. Potted Plant

Separate visualization type with 5 stages: `pot-with-soil`, `sprout`, `small-plant`, `flowering`, `dried`.

- Rendered in a pot/container (low-poly polygon pot shape)
- Smaller footprint than trees
- Own anchor points (crown, trunkBase, roots — relative to pot)
- Uses the same procedural generation pipeline where applicable (canopy polygons for flowering stage)

**Acceptance criteria:**

- `<PottedPlant stage={...}>` component renders all 5 stages
- Visually distinct from trees — clearly a potted houseplant
- Exports same anchor interface as trees

#### LIF-3. Oak / PRD Tree

Special large centerpiece tree for PRD/epic representation.

- Wider, taller canopy than standard trees (1.5–2x scale)
- Thicker trunk
- Accepts `completionRatio` prop (0.0–1.0) that controls canopy fullness (0 = bare structure, 1 = fully leafed)
- Optional stone nameplate at base (text prop)

**Acceptance criteria:**

- `<OakTree completionRatio={0.6} name="My PRD">` renders correctly
- Completion ratio visually maps to canopy density
- Looks proportionally larger when placed alongside regular trees in a scene

---

### Animations

#### ANI-1. Canopy Sway

Gentle side-to-side rotation of the canopy group.

- **CSS animation** on SVG group transforms (GPU accelerated)
- Cycle duration: 2–3 seconds
- Per-tree randomized phase offset (trees don't sway in sync)
- Enabled/disabled via checkbox in editor
- Subtle amplitude (~2–3 degrees rotation)

**Acceptance criteria:**

- Canopy moves naturally, not jerkily
- Multiple trees sway independently (different timing)
- Toggle checkbox starts/stops animation
- No performance degradation at 100 trees

#### ANI-2. Branch Movement

Individual branches sway independently.

- Each branch group gets its own CSS animation
- Slightly different frequency per branch (1.5–4 second range)
- Transform origin at branch base (where it meets trunk)
- Enabled/disabled via checkbox

**Acceptance criteria:**

- Branches move with different rhythms
- Movement is subtle and natural
- Toggle works independently of canopy sway

#### ANI-3. Growth Animation

Animated sequence showing tree growing from small to full size.

- Trunk extends upward, branches extend outward, canopy scales up
- **Triggered one-shot animation** — plays when checkbox is checked, cycles continuously while checked
- Duration: ~2 seconds per cycle
- CSS keyframe animation on scale/transform properties

**Acceptance criteria:**

- Smooth growth from seed-size to full tree
- Cycles continuously while checkbox is on
- Can be combined with sway animations

#### ANI-4. Tool Animations

Decorative tools have idle animations when visible.

- Shovel: subtle digging motion (small position oscillation at trunkBase)
- Watering can: gentle tilt/pour animation (rotation oscillation)
- Ladder: subtle sway (small rotation at base)
- Bird nest: gentle bobbing (vertical oscillation at crownCenter)

**Acceptance criteria:**

- Each tool has a distinct idle animation
- Animations are subtle and loop seamlessly
- Tools remain snapped to their anchor point during animation

---

### Growables (Fruit & Berries)

#### GRW-1. Fruit/Berry Types

Initial set of 3 growable types rendered as small low-poly shapes within the canopy:

| Type   | Color    | Shape                       | Polygon Count      |
| ------ | -------- | --------------------------- | ------------------ |
| Apple  | Red      | ~circular                   | 5–6 triangles      |
| Cherry | Dark red | Paired small circles, stems | 3–4 triangles each |
| Flower | Pink     | Diamond/petal               | 4 triangles        |

- Each fruit is a small low-poly polygon shape (matching project aesthetic)
- Positioned at `fruitSlots[]` anchor points (within canopy boundary)
- One type per tree, selected via dropdown

**Acceptance criteria:**

- All 3 types render correctly within canopy bounds
- Low-poly style matches tree aesthetic
- Never render outside canopy boundary

#### GRW-2. Fruit Count Slider

- Range: 0–20 per tree
- Fruits placed at computed `fruitSlots[]` positions
- When count exceeds available slots, additional slots are generated
- Slider in editor panel

**Acceptance criteria:**

- Slider updates fruit count in real-time
- Fruits don't overlap significantly
- 0 = no fruit visible

---

### Tools & Accessories

#### TLS-1. Tool Set

4 decorative SVG accessories that snap to tree anchor points:

| Tool         | Snap Anchor   | Style                                         |
| ------------ | ------------- | --------------------------------------------- |
| Shovel       | `trunkBase`   | Low-poly SVG, earth tones                     |
| Ladder       | `trunkMiddle` | Low-poly SVG, wood tones, leans against trunk |
| Watering Can | `trunkBase`   | Low-poly SVG, metallic tones                  |
| Bird Nest    | `crownCenter` | Low-poly SVG, brown twigs with eggs           |

- Each tool visible/hidden via individual checkbox
- Optional size slider per tool
- Low-poly SVG style consistent with tree rendering
- Each has idle animation (see ANI-4)

**Acceptance criteria:**

- Tools render at correct anchor positions
- Checkboxes toggle visibility independently
- Size slider scales tool proportionally
- Tools look stylistically consistent with trees

---

### Environment Effects

#### ENV-1. Rain

CSS-animated SVG lines falling across the scene.

- "Rain intensity" slider: light (few drops) → heavy (dense rain)
- Diagonal fall direction (slight wind angle)
- Scene-wide overlay layer above all trees
- Toggleable via checkbox

**Acceptance criteria:**

- Rain covers full viewport above tree line
- Intensity slider produces visible density change
- Performance acceptable at heavy + 100 trees

#### ENV-2. Lightning

Random flash effects during rain or independently.

- Random flashes every 5–15 seconds
- Brief white/bright overlay on background (100–200ms flash)
- Optional bolt SVG (jagged line from sky to tree line)
- No tree color change (keep simple)
- Toggleable via checkbox

**Acceptance criteria:**

- Flashes feel random and natural
- Not jarring or epilepsy-inducing (brief, not too bright)
- Works with or without rain active

#### ENV-3. Fireflies / Lightning Bugs

Small glowing dots with pulse animation.

- Slow drift movement (random walk)
- Subtle glow pulse (opacity + size oscillation)
- Spawn rate: ~2/second, lifetime ~8 seconds
- Scene-wide, concentrated around tree canopies
- Toggleable via checkbox

**Acceptance criteria:**

- Dots appear to float naturally
- Glow effect visible on both light and dark backgrounds
- Don't obscure trees at normal density

#### ENV-4. Wind Particles

Small leaf/petal sprites drifting across the scene.

- Horizontal drift with slight vertical oscillation
- Rotation animation on each particle
- Varied sizes and opacity
- Toggleable via checkbox

**Acceptance criteria:**

- Particles drift naturally from one side to the other
- Visual variety (not all identical)
- Integrates with canopy sway for cohesive wind feel

#### ENV-5. Snow

Slow-falling white dots/flakes.

- Gentle descent with slight horizontal drift
- Varied sizes (small flakes)
- Accumulation not required (just falling particles)
- Toggleable via checkbox

**Acceptance criteria:**

- Flakes fall slowly and naturally
- Distinct from rain (slower, rounder, white)

#### ENV-6. Sun Rays

Diagonal light beams through canopy gaps.

- Semi-transparent gradient lines from upper corner
- Subtle parallax or slow drift
- Golden/warm tone
- Toggleable via checkbox

**Acceptance criteria:**

- Rays appear to come from a light source direction
- Subtle enough not to obscure tree detail
- Works well with `lightAngle` tree parameter

#### ENV-7. Clouds

Low-poly cloud shapes drifting across the sky area.

- Simple polygon cloud shapes (3–5 triangles per cloud)
- Slow horizontal drift
- Varied sizes and heights
- Matches low-poly aesthetic
- Toggleable via checkbox

**Acceptance criteria:**

- Clouds are visually consistent with tree style
- Drift is smooth and continuous
- Don't obscure trees significantly (stay in sky area)

---

### Overlay Primitives

#### OVR-1. Generic Overlay Components

Reusable SVG overlay primitives for both standalone showcase and BamGit consumption. These are **visual shapes** — semantic meaning (e.g., "merge conflict") is applied by the consumer.

| Primitive      | Description                                  | Snap Target                 |
| -------------- | -------------------------------------------- | --------------------------- |
| Storm Cloud    | Dark low-poly cloud with optional rain drops | `crownTop` (floats above)   |
| Speech Bubble  | Rounded polygon bubble with pointer          | `crownTop` (offset to side) |
| Celebration    | Burst of small particles (confetti/sparkles) | `crownCenter`               |
| Wilting Effect | Drooping/yellowing modifier on canopy        | Applied to canopy group     |
| Glow Effect    | Subtle luminous outline around tree          | Applied to full tree group  |

- Each primitive is a standalone Svelte component
- Positioned relative to tree anchors (consumer passes anchor coords)
- Demonstrated in standalone showcase as toggleable decorations

**Acceptance criteria:**

- Each primitive renders independently
- Composable — multiple overlays can stack on one tree
- Low-poly style consistent with trees
- Showcase page demonstrates all overlays with checkboxes

---

### Root Connections

#### ROOT-1. Root Connection Line Primitives

SVG path components for drawing lines between trees (sub-trees to oak/PRD tree).

- Connect from one tree's `roots` anchor to another tree's `roots` anchor
- Organic/curved SVG paths (not straight lines) — bezier curves with slight randomness
- Visual states: connected (solid), disconnected (dashed/faded)
- Low-poly style optional (segmented line vs smooth curve)

**Acceptance criteria:**

- Path renders between two arbitrary anchor points
- Connected vs disconnected states are visually distinct
- Paths don't obscure trees (rendered below tree layer)
- Demonstrated in showcase with oak + sub-trees

---

### Technical Context (Library-wide)

- SvelteKit + Svelte 5 runes, TypeScript strict, Tailwind CSS
- SVG-based rendering (procedural Delaunay triangulation)
- CSS animations for motion (GPU accelerated)
- Seeded PRNG for deterministic generation
- All components must work in both standalone showcase and when imported by BamGit
- No git/GitHub domain concepts in this project — pure visualization

---

## Visual Quality Overhaul

Comprehensive rendering engine upgrade: new trunk/branch system, shape roster expansion from 7→13, SVG asset pipeline for tools/fruits/stages, and lifecycle stage improvements. This supersedes parts of the above requirements (noted inline).

### Trunk & Branch Rendering System

#### VQ-1. Hybrid Trunk Renderer

Replace the current Delaunay-triangulated trunk mesh with a **hybrid approach**: smooth SVG path silhouette for the trunk outline + interior triangles for low-poly shading.

- Trunk outline: SVG `<path>` defining a smooth, tapered shape (wider at base, narrower at top)
- Interior: A few triangles filling the outline, lit by the existing hemisphere lighting system
- Result: smooth outer silhouette with faceted 3D-like shading inside

**Acceptance criteria:**

- Trunk silhouette is smooth (no jagged triangle edges)
- Interior triangles provide visible low-poly shading
- Tapers naturally from base to top
- Works for all trunk heights (10%–150% range)

#### VQ-2. Light-Angle Responsive Trunk Shading

Trunk shading must respond to the `lightAngle` config parameter.

- At minimum: two-tone split (light side / dark side) that flips based on light direction
- Ideal: smooth gradient-like response where the lit face shifts as `lightAngle` changes
- Uses the same HSL trunk color parameters (hue, saturation, lightness)

**Acceptance criteria:**

- Changing `lightAngle` visibly shifts which side of the trunk is lighter
- Light/dark tones derived from existing trunk color config
- Consistent with canopy triangle lighting behavior

#### VQ-3. Recursive Branch System

Replace single-segment branches with a **recursive forking system**.

- Trunk → main branches → sub-branches → optional sub-sub-branches
- Branching depth configurable per shape (0 = no branches, 1 = trunk branches only, 2 = sub-branches, 3 = sub-sub-branches)
- Each fork point: branch splits into 1-3 child branches at configurable angle spread
- Branch thickness tapers with depth (main branches thicker than sub-branches)
- Uses same hybrid rendering as trunk (smooth silhouette + interior shading)
- Existing config params still apply: `branchCount`, `branchLength`, `branchLengthVariance`, `trunkBranchRatio`
- New config param: `branchDepth` (0–3, per-shape default)

**Acceptance criteria:**

- Branches fork naturally like real trees
- Depth 0 = no branches, depth 1 = simple branches, depth 2+ = sub-forking
- Branch thickness tapers at each depth level
- Blobs can attach at any branch tip (not just trunk-level branches)
- Per-shape defaults produce characteristic silhouettes

#### VQ-4. Branch Side Randomization

Currently first branch always goes right (even index = right). Randomize starting side using seeded PRNG.

- Keep alternating pattern for visual balance
- Randomize which side starts (left or right) per tree seed
- Same seed → same side → deterministic

**Acceptance criteria:**

- Single-branch trees appear on left ~50% of the time
- Multi-branch trees still alternate but with random starting side
- Deterministic per seed

#### VQ-5. Trunk Height Slider Range

Extend trunk height slider minimum from 50% to 10%.

- Current: `min={50} max={150}`
- New: `min={10} max={150}`
- Enables very short trunks for pine, bush shapes

**Acceptance criteria:**

- Slider allows 10% trunk height
- Tree renders correctly at extreme low values
- No visual artifacts at 10%

---

### Canopy System Improvements

#### VQ-6. Polygons Per Blob

Replace `canopyPolygons` (total across all blobs) with **per-blob polygon density**.

- New config param: `polygonsPerBlob` (e.g., 8–12)
- Polygon count per blob scales proportionally with blob area (a blob twice as large gets ~twice as many polygons)
- Changing `blobCount` does NOT affect polygon density per blob
- Changing `polygonsPerBlob` affects all blobs uniformly (density control)
- Remove or deprecate `canopyPolygons`

**Acceptance criteria:**

- Adding/removing blobs doesn't change existing blobs' triangle density
- Larger blobs have proportionally more triangles than smaller ones
- `polygonsPerBlob` slider provides intuitive density control
- Visual quality consistent across blob sizes

#### VQ-7. Fruit Slot Containment Inset

Shrink the fruit placement boundary by ~15% so fruits never protrude outside the canopy.

- Current: `nx² + ny² <= 1` (on the boundary)
- New: `nx² + ny² <= 0.85` (15% inset from edge)
- Provides ~5px minimum margin from canopy edge at typical blob sizes
- Applies to both initial 5-7 slots and any additional generation

**Acceptance criteria:**

- No fruit renders outside canopy boundary
- Fruits are visually contained with visible margin from canopy edge
- Works across all blob sizes and shapes

#### VQ-8. Fruit Count Cap

Cap fruit count at 7 per tree. Remove extra slot generation with loose distance.

- Current: slider 0-20 with loose `minDistance` for overflow slots
- New: slider 0-7, all slots use the standard Poisson distance
- Prevents crowding and boundary violations

**Acceptance criteria:**

- Maximum 7 fruits per tree
- All fruits well-spaced via consistent Poisson sampling
- UI slider range updated to 0-7

---

### Shape Roster Expansion & Redesign

13 total shapes (7 redesigned + 6 new). All shapes use the unified trunk/branch system (VQ-1, VQ-3) with per-shape config defaults.

#### VQ-9. Oak Redesign

Target: wide, rounded crown with thick trunk and visible branching (reference: Image #5 right tree, #15 left, #16, #21 row 2).

- Thick trunk, short-to-medium height, slight crookedness
- Branch depth 2 (fork + sub-fork)
- 4-6 large rounded blobs at branch tips and clustered above trunk
- Default colors: rich green canopy, warm brown trunk

#### VQ-10. Birch Redesign

Target: elegant spread with thin white trunk (reference: Image #18).

- Thin trunk, white/light grey with dark horizontal stripe markings
- Branch depth 2-3, spread wide
- 5-7 varied-size blobs at branch endpoints
- Default colors: light green canopy, white/grey trunk with dark accents

#### VQ-11. Maple Redesign

Target: branching trunk with blobs at tips (reference: Image #2, #3, #4).

- Medium trunk that visibly forks into Y-shaped branches
- Branch depth 2, clear Y-forks
- 4-5 blobs sitting at branch tips (not floating in space)
- Reduced `blobSizeVariance` (~0.5-0.8) so blobs stay similar size
- Default colors: signature orange-red canopy (`#e8a028` / `#8b2010`), brown trunk

#### VQ-12. Pine Redesign

Target: consistent tiered cone with short trunk (reference: Image #8).

- Very short trunk (10-20% of viewBox height)
- 0-1 branches below canopy
- 4-6 tiers, each a flat hexagonal/trapezoidal shape
- Consistent angular tips across all tiers (no mixed roundness)
- Overlapping by ~20%, narrowing toward top
- Pointed crown element at top
- Reduced randomness — controlled, consistent tier shapes
- Narrower overall silhouette than current

#### VQ-13. Fir Redesign

Target: narrow conical silhouette, differentiated from pine (reference: Image #7, #9).

- Short trunk
- Rounder/blobby tiers vs pine's angular tiers (if differentiation achievable)
- Alternatively: narrower and taller than pine with more tiers
- If differentiation proves difficult, two similar-but-distinct presets is acceptable

#### VQ-14. Willow Redesign

Target: weeping silhouette with drooping branches.

- Medium trunk, slight lean
- Branch depth 2, branches arc downward (below horizontal angle)
- Small blob clusters or leaf drapes at branch tips
- Characteristic "weeping" cascading shape

#### VQ-15. New Shape — Cypress

Tall, narrow, pointed tree (reference: Image #15 middle, #20 slim trees).

- Thin, straight trunk
- Branch depth 0-1
- 1-2 tall teardrop/pointed blobs
- Overall silhouette: tall and narrow column

#### VQ-16. New Shape — Apple

Round, compact fruit tree.

- Short, thick trunk
- Branch depth 1
- 1 large round blob (or 2-3 tightly clustered)
- Default fruit: apple

#### VQ-17. New Shape — Cherry

Wide spreading ornamental tree.

- Medium, elegant trunk
- Branch depth 2, spreading wide
- 3-5 blobs, wider than tall overall silhouette
- Default colors: pink-tinted canopy (sakura-inspired)
- Default fruit: cherry pairs

#### VQ-18. New Shape — Bush

Ground-level shrub (reference: Image #21 bottom row).

- No trunk or very short stub (<5% viewBox height)
- Branch depth 0
- 1-2 blobs sitting directly on ground
- Small overall footprint
- Useful for representing small tasks in BamGit

#### VQ-19. New Shape — Baobab

Iconic thick-trunked tree.

- Very thick trunk (barrel-shaped), widest at middle
- Short branches at top
- Small canopy relative to trunk size (2-3 small blobs at top)
- Distinctive silhouette — trunk is the visual feature

#### VQ-20. New Shape — Acacia

Flat-topped savanna tree.

- Tall, relatively thin trunk
- Branch depth 1-2, branches spread horizontally
- Wide, flat canopy (blobs arranged in a horizontal band, wider than tall)
- Characteristic umbrella/parasol silhouette

**Acceptance criteria (all shapes):**

- Each shape produces a visually distinct, recognizable silhouette
- Shape defaults are tuned for quality (not just parameter variation)
- All shapes work with the lifecycle stage system
- All shapes demonstrated in showcase
- Custom shape retained with per-blob editor

---

### SVG Asset System

#### VQ-21. Asset Folder Structure

Dedicated folder for all static SVG assets used by the tree system.

- Location: `src/lib/trees/assets/` (or `src/lib/assets/svg/`)
- Subfolders: `tools/`, `fruits/`, `flowers/`, `stages/`
- Each SVG is either a `.svelte` component wrapping inline SVG or a raw `.svg` file imported via Vite
- Consistent import pattern across the codebase

**Acceptance criteria:**

- All static SVGs live in the asset folder (not scattered in component files)
- Clear naming convention per asset type
- Easy to replace individual SVGs without touching component logic

#### VQ-22. Tool SVG Replacement

Replace current hardcoded polygon arrays with static SVG assets for all tools.

- Placeholder/fallback SVGs created initially
- User replaces with final SVGs generated via Recraft AI or similar
- Style: flat design, dark charcoal metal + warm tan wood, no outlines

**Tools (6 total):**

| Tool         | Description          | Anchor        | Snap Point                   |
| ------------ | -------------------- | ------------- | ---------------------------- |
| Shovel       | Garden spade         | `trunkBase`   | Blade tip (bottom)           |
| Watering Can | Metal can with spout | `trunkBase`   | Spout tip                    |
| Ladder       | Wooden step ladder   | `trunkMiddle` | Upper lean contact           |
| Axe          | Wood-cutting axe     | `trunkBase`   | Blade edge                   |
| Rake         | Garden rake          | `trunkBase`   | Tine tips                    |
| Woodpecker   | Tree-doctor bird     | `trunkMiddle` | Feet/claws (clings to trunk) |

#### VQ-23. Tool Snap Point System

Each tool defines a `snapOffset: { x: number, y: number }` in local SVG coordinates. Positioning formula: `translate(anchor.x - snapOffset.x, anchor.y - snapOffset.y)`.

- `transform-origin` set to snap point for rotation animations
- Snap offsets defined in tool config (not hardcoded in component)
- Placeholders initially, refined when final SVGs are integrated

**Acceptance criteria:**

- Tools snap to anchors via their functional point (not geometric center)
- Rotation animations pivot around the snap point
- Snap offsets are configurable per tool in a central config

#### VQ-24. Fruit SVG Assets

All fruit types rendered as static SVG assets (replacing procedural triangle fans).

- Placeholder SVGs created initially, replaced later with polished icons
- Each fruit is a small, simple SVG (1-3 path elements)
- Sized to ~4-6px in tree coordinate space

**Fruit types (12 total, one per tree shape):**

| Tree    | Fruit        | Visual                              |
| ------- | ------------ | ----------------------------------- |
| Oak     | Acorn        | Small brown nut with cap            |
| Birch   | Catkin       | Tiny elongated yellow-green cluster |
| Maple   | Samara       | Winged seed pair, tan/brown         |
| Pine    | Pine cone    | Small brown cone, hanging           |
| Fir     | Fir cone     | Upright cone                        |
| Willow  | Catkin       | Slender cluster                     |
| Cypress | Small cone   | Tiny round cone                     |
| Apple   | Apple        | Red/green round fruit               |
| Cherry  | Cherry pair  | Two red berries on stem             |
| Bush    | Berry        | Small round berry                   |
| Baobab  | Baobab fruit | Oblong pod                          |
| Acacia  | Seed pod     | Long flat brown pod                 |

#### VQ-25. Tree-Specific Fruit Mapping

Each tree shape has a **locked default fruit type**. Only the custom shape allows fruit type selection.

- Fruit type auto-selects when shape is chosen
- UI dropdown hidden or disabled for non-custom shapes
- Custom shape shows full dropdown of all fruit types

**Acceptance criteria:**

- Selecting "oak" automatically sets fruit to "acorn"
- Cannot change oak's fruit to "cherry" (locked)
- Custom shape allows any fruit type selection

#### VQ-26. Tree-Specific Flower Mapping

Each tree shape has a **unique flower SVG** used in the flowering lifecycle stage.

- Flowers rendered at fruit slot positions during flowering stage
- Each tree type has a distinct flower appearance
- Flower SVGs stored in `assets/flowers/`

#### VQ-27. Stage SVGs

Three direct-geometry stages replaced with hand-drawn SVG assets:

| Stage     | Current               | New                                  |
| --------- | --------------------- | ------------------------------------ |
| seed      | 3 hardcoded triangles | SVG: tiny seed + soil mound          |
| sprouting | 3 hardcoded triangles | SVG: thin stem + two small leaves    |
| stump     | 4 hardcoded triangles | SVG: short stump with optional rings |

- Placeholder SVGs created initially, replaced later
- Each still returns `TreeGeometry` with appropriate anchors

---

### Tool System Overhaul

_Supersedes TLS-1 and ANI-4 from above._

#### VQ-28. Updated Tool Roster

6 tools (replacing previous 4). Removed: bird nest, beehive. Added: axe, rake, woodpecker.

See VQ-22 for the full tool table.

#### VQ-29. Woodpecker Review Badge

The woodpecker tool includes a **numeric badge** showing active reviewer count.

- Small circle badge next to the woodpecker (similar to notification badges)
- Accepts a `count` prop (1-6)
- When count is 0 or undefined, no badge shown
- Pecking animation: head bob + slight body rock
- Clings to trunk side at `trunkMiddle`

**Acceptance criteria:**

- Badge displays count clearly at small scale
- Animation loops while woodpecker is visible
- Badge updates reactively when count changes

#### VQ-30. Tool Animations with Snap-Point Transform Origin

All tool idle animations use the snap point as `transform-origin`.

| Tool         | Animation                     | Pivot Point    |
| ------------ | ----------------------------- | -------------- |
| Shovel       | Digging oscillation (rocking) | Blade tip      |
| Watering Can | Tilt/pour rotation            | Spout tip      |
| Ladder       | Subtle sway                   | Ground contact |
| Axe          | Chopping oscillation          | Blade edge     |
| Rake         | Sweeping motion               | Tine tips      |
| Woodpecker   | Head bob + body rock          | Feet/claws     |

**Acceptance criteria:**

- Tools stay anchored at snap point during animation
- Animations are subtle and loop seamlessly
- Each tool has a distinct, recognizable idle motion

---

### Fruit & Flower System

_Supersedes GRW-1 and GRW-2 from above._

#### VQ-31. Fruit System Redesign

- All fruits as static SVG assets (VQ-24)
- Fruit type locked per tree shape (VQ-25)
- Fruit count capped at 7 (VQ-8)
- Containment boundary inset by 15% (VQ-7)
- Custom shape: full fruit type dropdown

#### VQ-32. Flowering Stage with Tree-Specific Flowers

- `flowering` stage added before `fruiting` in lifecycle order
- Uses the same `fruitSlots[]` positions
- Renders tree-specific flower SVGs at those positions instead of fruit
- Earlier stages (sprouting, sapling) can also render flowers at their available slots

**Acceptance criteria:**

- Flowering stage shows flowers (not fruits) at slot positions
- Each tree type has visually distinct flowers
- Sapling with 1-2 slots can show 1-2 flowers

#### VQ-33. Remove "Flower" Fruit Type

The current `flower` fruit type is removed from `FRUIT_TYPES`. Flowers are now exclusively a lifecycle stage overlay, not a fruit selection.

---

### Lifecycle Stage Updates

_Supersedes LIF-1 from above._

#### VQ-34. Updated Lifecycle — 12 Stages

New order: `seed → sprouting → sapling → growing → leafy → flowering → fruiting → autumn → ready → bare → dead → stump`

- `flowering` stage inserted between `leafy` and `fruiting`
- Stakes removed from `growing` stage (simplified to medium-sized tree)

#### VQ-35. Autumn Falling Leaves

The `autumn` stage includes a falling leaf particle effect.

- Small leaf-shaped particles drift downward from canopy area
- Orange/red/brown colors matching autumn canopy palette
- CSS-animated, similar to environment particle system
- Part of the stage rendering (not a separate environment toggle)

**Acceptance criteria:**

- Leaves visibly fall when tree is in `autumn` stage
- Particle count is subtle (not a blizzard)
- Colors match the autumn canopy color swap

#### VQ-36. Growth Animation Fix

_Supersedes ANI-3 from above._

Replace uniform `scale(0.05 → 1)` with **trunk height + branch length interpolation**.

- Pass `growthProgress` (0→1) to generation
- Trunk height multiplied by `growthProgress`
- Branch length multiplied by `growthProgress`
- Canopy renders at full size from the start (appears as trunk reaches it)
- Animation cycles: trunk grows upward, branches extend, canopy is revealed

**Acceptance criteria:**

- Trunk visibly extends upward during growth
- Branches extend outward as growth progresses
- Canopy appears at full size (not scaled)
- Smooth animation, loops while toggle is on

---

### Potted Plant

_Supersedes LIF-2 from above._

#### VQ-37. Potted Plant Generator

Separate `generatePottedPlant(config: PottedPlantConfig): TreeGeometry` function.

- Returns standard `TreeGeometry` (same triangle + anchors interface)
- Wide pot shape (planter style), rendered as SVG asset
- 5 stages: `pot-with-soil → sprout → small-plant → flowering → dried`

| Stage         | Rendering                                                | Flower Slots |
| ------------- | -------------------------------------------------------- | ------------ |
| pot-with-soil | SVG: wide pot + soil surface                             | None         |
| sprout        | SVG: pot + thin stem + 2 tiny leaves                     | None         |
| small-plant   | Procedural: pot SVG + stem + 1-2 small blobs             | 1-2          |
| flowering     | Procedural: pot SVG + stem + 2-3 blobs + generic flowers | 3-5          |
| dried         | Same as flowering, brown/yellow colors + CSS droop       | None         |

- One universal pot design
- Generic small flower for flowering stage
- Same viewBox (200×300), pot + plant occupies bottom 60%

**Acceptance criteria:**

- `<PottedPlant stage={...}>` renders all 5 stages
- Visually distinct from trees — clearly a potted plant
- Exports same `TreeAnchors` interface (anchors relative to pot)

---

### Oak / PRD Tree

_Supersedes LIF-3 from above._

#### VQ-38. Oak/PRD Tree with Branch-Based Completion

Wrapper component using `generateTree` with scaled-up oak config and a physically larger viewBox.

- `completionRatio` implemented via branch-to-blob mapping:
    - Number of branches = number of issues (passed as prop or derived)
    - Only resolved branches have canopy blobs attached
    - Unresolved branches are bare (visible wood, no canopy)
    - At ratio 0.0: all branches bare. At 1.0: all branches have blobs.
- Physically larger viewBox (e.g., 300×450 or 400×600)
- Thicker trunk, wider branching spread

**Acceptance criteria:**

- `<OakTree completionRatio={0.6} issueCount={20} name="My PRD">` renders 20 branches, 12 with blobs, 8 bare
- Visually obvious which branches are resolved vs open
- Looks proportionally larger than standard trees in a scene

#### VQ-39. Stone Nameplate (Oak Only)

SVG text element positioned below `trunkBase`.

- Rounded rectangle in stone-grey color
- Text rendered inside (tree/PRD name)
- Only available on OakTree component (not other tree types)

**Acceptance criteria:**

- Nameplate renders legibly below tree
- Text scales appropriately with tree size
- Omitted when no name prop provided

#### VQ-40. Ground Elements System

Decorative ground elements (stones, grass, bushes) at tree base.

- Simple toggle per tree: `groundElements: true/false`
- Random placement of 2-3 stones + grass tufts using seeded PRNG
- SVG assets in `assets/ground/`
- Lower priority — after core overhaul

**Acceptance criteria:**

- Toggle adds/removes ground decoration
- Elements don't obscure trunk base or tools
- Deterministic per seed

---

## Trunk & Branch System Overhaul v2

Follow-up to issue #60 (VQ-1, VQ-2, VQ-3). Replaces the Delaunay-triangulated trunk and limited branch forking with a rectangle-based rendering system, multi-level branching controls, and crookedness amplification. All changes under PRD #4.

Reference aesthetic: low-poly trees with stacked quadrilateral trunks/branches split by a visible centerline, creating clean left/right halves for two-tone shading (see reference Image: `trees.jpg`).

### Trunk Rendering

#### BR-1. Rectangle-Based Trunk Renderer

**Replaces VQ-1.** Replace the current Delaunay-triangulated trunk mesh + SVG clip-path silhouette with stacked quadrilaterals (trapezoids) split by a vertical centerline.

- Each trunk segment (between crookedness junctions) is one quadrilateral
- Each quad tapers from bottom width to top width (trapezoid shape)
- A centerline bisects each quad vertically, creating a left half and a right half
- The rectangle edges ARE the trunk silhouette — no separate SVG clip-path needed
- More trunk segments = more quads = more visual richness naturally
- Works for all trunk heights (10%–150%) and thicknesses (25%–400%)

**Acceptance criteria:**

- Trunk is composed of visible stacked trapezoids
- Centerline is co-linear with trunk sides and continuous through all segments
- No Delaunay triangulation or clip-path in trunk rendering
- Trunk taper from `trunkBaseWidth` to `trunkTopWidth` is visually smooth across quads
- All existing shapes render correctly with the new system

#### BR-2. Two-Tone Trunk Shading

**Replaces VQ-2.** Each trunk quad's left and right halves receive flat two-tone shading based on `lightAngle`.

- Light side: lighter trunk color. Dark side: darker trunk color
- Which side is light/dark flips based on `lightAngle` direction
- Flat color per half (no gradient within each half)
- Uses the same HSL trunk color parameters (hue, saturation, lightness)
- Consistent with how canopy triangle lighting works

**Acceptance criteria:**

- Changing `lightAngle` visibly flips which half of each trunk quad is lighter
- Two-tone shading is clean and matches the reference low-poly aesthetic
- No per-triangle cylinder-model computation needed

---

### Branch Rendering & Structure

#### BR-3. Rectangle-Based Branch Rendering

Branches use the same quad-based system as the trunk. Each branch segment is a quadrilateral split by a centerline running along the branch direction.

- Centerline runs along the branch's direction (not vertical) — it follows the branch angle
- Each branch segment tapers from start width to end width
- Two-tone shading per half, same light-angle model as trunk (BR-2)
- Branch quad edges form the branch silhouette directly

**Acceptance criteria:**

- Branches are visually consistent with trunk rendering (same quad + centerline system)
- Centerline follows the branch direction, not always vertical
- Shading responds to `lightAngle` (left-side branches lighter when light is from the left, etc.)
- Existing lighting behavior preserved: branches respect light direction per side of tree

#### BR-4. Per-Level Branch Count Range Sliders

**Replaces `branchCount` and `trunkBranchRatio`.** Introduce per-level branch count controls using dual-thumb range sliders.

- New config params: `branchesLevel1Range: [min, max]`, `branchesLevel2Range: [min, max]`, `branchesLevel3Range: [min, max]`
- Each slider appears only when `branchDepth >= N` for that level
- When min = max, the count is fixed. When min < max, count per parent branch is randomized within the range
- UI: shadcn-svelte `Slider` with `type="multiple"` (dual thumbs). Requires installing the `slider` component (`pnpm dlx shadcn-svelte@latest add slider`)
- Remove `branchCount` and `trunkBranchRatio` from config (replaced by per-level ranges)
- Default ranges per shape tuned for characteristic look (e.g., oak level-1: [3, 5], level-2: [1, 2])

**Acceptance criteria:**

- Slider shows two thumbs when range mode is needed
- Setting both thumbs to same value = fixed count
- Level-N slider only visible when `branchDepth >= N`
- Randomized count within range is seeded (deterministic per seed)
- `branchCount` and `trunkBranchRatio` fully removed

#### BR-5. Multi-Branch Sub-Branching

**Extends VQ-3.** Each branch at any depth can spawn multiple child branches, not just 1-2 from the tip.

- Level-2+ branches originate from the upper portion (50%–100%) of the parent branch length, not only from the tip
- The count of children per parent is determined by the level's range slider (BR-4)
- Children are distributed along the upper half of the parent, not all from the tip
- Each child branch independently gets its own segments, crookedness, and angle (randomized per branch)

**Acceptance criteria:**

- A level-1 branch with `branchesLevel2Range: [2, 3]` spawns 2-3 children distributed along its upper half
- Children originate from different points along the parent (not all from the tip)
- Multi-level nesting creates natural tree-like branching patterns
- Works up to depth 3

#### BR-6. Branch Segments & Crookedness

Branches have their own segment count and crookedness, independent of trunk.

- New config params: `branchSegments` (1–3, default matches trunk), `branchCrookedness` (0–100%, default = 50% of trunk value)
- Each individual branch's segment count and crookedness are randomized around these values (±1 segment, ±20% crookedness)
- One branch can be straight (1 segment), another crooked with 3 segments — per-branch variety
- Uses the same crookedness model as trunk (BR-8)

**Acceptance criteria:**

- `branchSegments` and `branchCrookedness` sliders appear in UI
- Individual branches visibly differ in crookedness
- Deterministic per seed

#### BR-7. Branch Depth Taper Slider

New config param controlling how much thinner each depth level is relative to its parent.

- `branchDepthTaper` (30%–80%, step 5%, default 55%)
- A child branch's start width = parent's end width × `branchDepthTaper / 100`
- Lower values = children much thinner than parents. Higher = closer in thickness
- Within-branch taper (start-to-end width) remains automatic based on branch length
- Candidate for advanced controls (see BR-14)

**Acceptance criteria:**

- Slider visibly changes thickness difference between branch depth levels
- At 30%: level-2 branches are very thin. At 80%: nearly as thick as level-1
- Default 55% creates clear visual hierarchy

#### BR-8. Branch Junction Fill

When a child branch meets its parent at an angle, fill the wedge gap with a polygon.

- Always add a fill polygon at every parent-child junction, regardless of angle
- Fill polygon color: parent branch's dark-side color (reads as junction shadow)
- The fill polygon connects the edges of the parent quad to the edges of the child quad at the junction point
- If the new rectangle-based system inherently eliminates gaps, this requirement is satisfied without extra polygons

**Acceptance criteria:**

- No visible wedge gaps between connected branches at any angle
- Junctions look physically connected, not floating apart
- Fill polygons blend naturally with branch shading

#### BR-9. Branch Angle Slider

New config param controlling whether branches spread wide (horizontal) or grow upward (vertical).

- `branchAngle` (0–100%, step 5%)
- 0% = maximum horizontal spread (wider canopy). 100% = maximum vertical/upward growth (narrow canopy)
- Maps to the underlying angle range for branch generation (currently hardcoded [0.3, 1.2] radians)
- Applies to level-1 branches. Deeper levels inherit a proportional angle relative to their parent's direction
- Per-shape defaults enable characteristic silhouettes (e.g., willow = low angle/wide, cypress = high angle/narrow)

**Acceptance criteria:**

- Slider visibly changes branch spread direction
- Low values create wide, spreading trees. High values create narrow, upright trees
- Per-shape defaults produce recognizable shapes

#### BR-10. Dynamic Branch Count Maximums

Slider maximums for per-level branch counts are dynamically calculated based on current config.

- Level-1 max: estimated from trunk top-half length ÷ minimum branch spacing (~20px)
- Level-2 max: function of level-1 branch count and available space
- Level-3 max: function of level-2 count
- Estimation approach (no full generation run needed): `maxBranches ≈ availableLength / minSpacing`
- Slider maximums update reactively when trunk height or other dependencies change

**Acceptance criteria:**

- User cannot select more branches than can physically fit
- Slider max updates when trunk height changes
- No silent branch count reduction — the slider shows the real achievable maximum

---

### Crookedness System

#### BR-11. Amplified Trunk Crookedness

**Fixes weak crookedness.** Replace current max jitter of 20° per junction with dramatically stronger crookedness.

- Maximum angular change per junction: **90°** at 100% crookedness
- The crookedness slider (0–100%) scales the base max angle from 0° to 90°
- Per-junction jitter: reduces the max angle by up to 50% (so at 100% crookedness, each junction angle is 45°–90°)
- Direction at each junction is random (left or right), allowing S-curves, zigzags, or consistent bends
- Self-intersection prevention: clamp each segment's absolute angle from vertical to ±85° so the trunk always trends upward
- The visual result at 100%: dramatically crooked trunk with near-right-angle bends between segments

**Acceptance criteria:**

- 100% crookedness with 3+ segments produces dramatically crooked trunks
- S-curves and zigzag patterns occur naturally from random direction per junction
- Trunk never folds back on itself (always trends upward)
- 0% crookedness = perfectly straight (lean only)
- Deterministic per seed

#### BR-12. Branch Crookedness

Same crookedness model as trunk (BR-11), applied per branch.

- Uses the `branchCrookedness` param from BR-6
- Same 90° max, 50% jitter reduction, random direction per junction
- Each branch independently randomized
- Self-intersection prevention applies per branch (branch always trends away from its origin)

**Acceptance criteria:**

- Individual branches show visible crookedness matching their randomized values
- Works correctly with multi-segment branches (BR-6)
- Crooked branches still connect properly at junctions (BR-8)

---

### Maple Tree Fix

#### BR-13. Unify Maple with Generic Branch System

**Fixes maple branching.** Remove `generateMapleBranches()` and route maple through the generic `generateBranches()` system.

- Maple's distinct look comes from its blob layout (arc pattern) and config defaults, not a separate algorithm
- Maple defaults: `branchDepth: 2`, `branchesLevel1Range: [3, 5]`, `branchesLevel2Range: [1, 2]`, `branchAngle: 40%`, `trunkSegments: 2`, `trunkCrookedness: 30%`
- `branchCount`, `branchDepth`, and all branch sliders must now work correctly for maple
- Blob layout (arc distribution) remains maple-specific — only the branch generation is unified

**Acceptance criteria:**

- `generateMapleBranches()` removed from codebase
- Maple uses the same branch generation as oak/birch/willow
- All branch sliders work correctly for maple (count, depth, angle, etc.)
- Maple still looks like a maple with default settings (Y-fork structure, arc blob layout)
- Changing `branchCount` actually changes the number of visible branches

---

### UI & Controls

#### BR-14. Simple / Advanced Controls Toggle

Introduce a checkbox or toggle to switch between simple and advanced branch/trunk controls.

- Simple controls (default): `branchDepth`, `branchesLevel1Range`, `branchAngle`, `trunkSegments`, `trunkCrookedness`, `trunkHeight`, `trunkThickness`, `branchThickness`
- Advanced controls (toggle on): adds `branchesLevel2Range`, `branchesLevel3Range`, `branchSegments`, `branchCrookedness`, `branchDepthTaper`, `branchLength`, `branchLengthVariance`
- Toggle persists per session (not per seed)
- Future iteration: refine which controls go where based on user feedback

**Acceptance criteria:**

- Toggle visibly shows/hides advanced sliders
- Simple mode covers the most impactful settings
- Advanced mode reveals fine-tuning controls
- No functionality lost — all params still configurable in advanced mode

---

### Branch Rules (Updated)

#### BR-15. Branch Constraint Rules

Updated constraint rules for the new multi-level branching system. These replace the constraints from #60.

**Rule A — Branch origin:** Every branch must start on the trunk or on another branch. Unchanged.

**Rule B — Canopy blob connectivity (REVERSED):** Branches do NOT need to end in canopy. Instead: every canopy blob must either overlap another canopy blob OR have at least one branch leading into it. Larger blobs should be carried by trunk-origin (level-1) branches. Smaller blobs should be on deeper-level (level-2/3) branches.

**Rule C — Minimum visible length:** At least 5px of every branch must be visible (outside canopy blobs). Same threshold for all depth levels. Branches with <5px visible are rejected.

**Rule D — No trunk crossing:** Branches do not cross the trunk centerline. Unchanged.

**Rule E — Angle divergence from parent:** Level-1 branches diverge from the trunk axis by 30°–60° (wider range than previous 30° minimum). Level-2+ branches diverge from their parent branch direction by 30°–60° (not from trunk). The `branchAngle` slider (BR-9) shifts this range.

**Rule F — Overlap checking:** Only check overlap between same-depth siblings. Parent-child pairs and cross-depth branches may overlap freely. This enables dense, natural-looking multi-level trees.

**Rule G — Floating blob fallback:** Keep as last resort — if a canopy blob has no branch leading into it and doesn't overlap another blob, generate an emergency branch from trunk center to blob center. The per-level system should naturally cover most blobs, reducing reliance on this fallback.

**Rule H — Top-half trunk placement:** Level-1 branches originate only from the upper half of the trunk. Unchanged.

**Rule I — Side alternation:** Level-1 branches alternate left/right with random starting side. Deeper levels naturally distribute based on parent branch direction.

**Rule J — Maximum total branch count (NEW):** Hard cap of 25 branches across all depth levels combined. Prevents performance issues with deeply nested trees. If the cap is hit during generation, stop spawning deeper-level branches first.

**Rule K — Child branch length ratio (NEW):** Each child branch's length is 20%–80% of its parent branch's length, randomized with a default center of 50%. For low-poly stylized trees, 50% creates clear visual hierarchy between levels. The range (20%–80%) allows natural variety — some children shorter, some longer, averaging around half the parent length.

**Acceptance criteria:**

- All rules enforced during generation
- Rule B: no disconnected/floating canopy blobs
- Rule C: no invisible branches rendered
- Rule E: angle divergence is relative to parent (not always trunk)
- Rule J: never more than 25 branches total
- Rule K: child branches visibly shorter than parents, with variety

---

### Slider Component Migration

#### BR-16. Migrate to shadcn-svelte Slider

Replace the custom `LabeledRangeSlider.svelte` (native `<input type="range">`) with the shadcn-svelte `Slider` component.

- Install shadcn-svelte slider: `pnpm dlx shadcn-svelte@latest add slider`
- Current `LabeledRangeSlider` wraps a plain HTML range input with a Label — no styling consistency with shadcn design system
- New component: wrap shadcn `Slider` (`type="single"`) with the same label/unit/format API as `LabeledRangeSlider`
- For dual-thumb range sliders (BR-4): use `Slider` with `type="multiple"` and `bind:value` as `number[]`
- Migrate all ~20 existing slider usages in `editor/+page.svelte`
- Remove `LabeledRangeSlider.svelte` after migration

**Acceptance criteria:**

- All sliders use shadcn-svelte Slider component (consistent design system)
- `LabeledRangeSlider.svelte` deleted
- Single-value sliders work identically to before (no behavior regression)
- Dual-thumb sliders available for per-level branch count ranges (BR-4)
