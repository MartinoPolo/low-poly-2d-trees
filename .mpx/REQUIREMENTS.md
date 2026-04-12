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
