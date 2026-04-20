## Overview

Follow-up to PRD-6. Addresses engine bugs (trunk fork, branch defaults), animation coherence (growth sync), UI shell issues (broken floating buttons, sidebar, settings switcher), viewport expansion (300 to 500), scene layout improvements (row shifts), and visual polish (sky gradient, ground, falling leaves). Traces to `.mpx/REQUIREMENTS.md` section 29.

## User Stories

- As a user, I want floating action buttons to respond to clicks so I can randomize seeds, reset config, toggle themes, and save trees.
- As a user, I want the sidebar to have a visible expand toggle on desktop so I can access navigation labels.
- As a user, I want the settings tier switcher to not overlap card content so the UI looks polished.
- As a user, I want trunk fork to terminate cleanly at the Y-split so the tree looks like a natural fork without a stub above.
- As a user, I want branch mirroring defaulting to `allowed` so trees have more natural symmetry out of the box.
- As a user, I want a 500x500 viewport so there is room for clouds, larger canopies, and overlays above the tree.
- As a user, I want scene rows shifted pseudo-randomly so background trees do not line up behind front trees.
- As a user, I want growth animation to keep branches attached to the trunk and canopy in sync with branch length.
- As a user, I want falling leaves to land on the ground and pile up before fading.
- As a user, I want sky gradient and ground in both editors for visual consistency.
- As a user, I want "Reset to defaults" to reset ALL parameters, not just shape overrides.
- As a user, I want a stage selector in the scene editor to change all trees lifecycle stage at once.

## Scope

**Included:**

- Fix broken floating button click handlers (Theme, Reset, Randomize, Save)
- Fix desktop sidebar expand/collapse discoverability
- Settings tier switcher: sticky, solid background, proper spacing
- Remove duplicate Randomize/Reset/Save from settings panel
- Sidebar icon centering and size consistency
- Branch symmetry default to `allowed` for 6 species
- Trunk fork: terminate trunk at fork junction
- Viewport increase 300x300 to 500x500 with full coordinate audit
- Scene row shift algorithm (seeded random 15-45%, +/-3 row constraint)
- Full reset to defaults (`DEFAULT_TREE_CONFIG` + `SHAPE_DEFAULTS` overlay)
- Asset folder consolidation (remove .gitkeep, add missing barrel exports)
- Growth animation overhaul (tip-only, synchronized timing, canopy follows tips)
- Falling leaves: land at ground, accumulate pile, 10s fade, 15-20 cap
- Double ground elements with less than 50% overlap
- Sky gradient + ground band for single tree editor
- Scene editor ground line at front-row baseline
- Stage selector in scene editor (global, all trees)

**Excluded:**

- New tree shapes or species
- Environment effects (rain, snow, wind -- separate PRD)
- Library API packaging (#67)
- Overlay primitives (#66)
- Root connections (#66)
- Per-tree stage selection in scene mode

## Acceptance Criteria

**Group 1: UI Shell & Controls**

- [ ] All floating buttons (Theme, Reset, Randomize, Save) respond to clicks and perform their actions
- [ ] Theme toggle cycles light, dark, system visibly, persists across navigation
- [ ] Settings tier switcher: sticky, solid opaque background, equal spacing above/below, no card peeking
- [ ] Desktop sidebar has a visible expand/collapse toggle icon (not just the 4px rail)
- [ ] Sidebar icons horizontally centered in collapsed state, consistent size with floating buttons
- [ ] No Randomize/Reset/Save buttons in settings panel (floating buttons only)
- [ ] Stage selector dropdown in Scene Settings card, controls all trees, default `leafy`

**Group 2: Engine & Config**

- [ ] `branchMirroring` default = `allowed` for oak, birch, maple, willow, apple, baobab; cherry/acacia stay `preferred`
- [ ] `trunkFork=true` -- no trunk quads above fork junction; fork arms replace trunk tip
- [ ] `VIEWBOX_WIDTH=500`, `VIEWBOX_HEIGHT=500`; all coordinates scaled x1.667; tree size unchanged
- [ ] `GROUND_LINE_Y=475`; all 13 shapes render correctly at defaults
- [ ] Scene rows 2+ shifted 15-45% (seeded); no two rows within +/-3 share position within 10%; front row at 0%
- [ ] Reset applies `{ ...DEFAULT_TREE_CONFIG, ...SHAPE_DEFAULTS[shape], seed, shape }`
- [ ] No `.gitkeep` files in populated asset dirs; all 6 subdirs have barrel `index.ts`

**Group 3: Animation & Visual Effects**

- [ ] Growth: branch origins fixed at trunk attachment; tips extend outward; no disconnection
- [ ] Growth: canopy blobs follow animated branch tips; single `growthProgress` drives both
- [ ] Growth: all branches/canopy animate simultaneously with uniform duration
- [ ] Falling leaves: stop at ground, stay 10s, +/-10-20px scatter, cap 15-20 per tree, continuous cycle
- [ ] Ground elements: doubled count (4-6), less than 50% width overlap, deterministic
- [ ] Single tree editor: sky gradient matching scene editor + earth-colored ground band at bottom
- [ ] Scene editor: ground gradient at front-row baseline; no floating trunks in any row

## Technical Notes

- **Framework:** SvelteKit + Svelte 5 runes, TypeScript strict, Tailwind CSS v4, shadcn-svelte (bits-ui)
- **Floating buttons root cause:** `Tooltip.Trigger` child snippet passes `{...props}` which likely overrides `onclick`. Fix: ensure `onclick` is not clobbered by spread, or merge handlers.
- **Viewport 500x500:** Pervasive change. Scaling factor = 500/300 = 1.667. Affects: `VIEWBOX_WIDTH`, `VIEWBOX_HEIGHT`, `GROUND_LINE_Y`, all shape definition base values, tool snap offsets, fruit slot generation, stage asset positioning, scene layout percentages. Must audit every numeric constant in `src/lib/trees/`.
- **Scene row shifts:** Use seeded PRNG from scene seed. Generate shift per row, validate against +/-3 row window, re-roll up to 5 times on constraint violation.
- **Growth animation:** Current system uses independent per-branch CSS animations with varying durations/delays. New system needs a single `growthProgress` oscillation driving both branch scale and canopy position via CSS custom properties or JS-driven animation.
- **Falling leaves:** Current implementation uses CSS `@keyframes leaf-fall` with `infinite` iteration. New system needs `iteration-count: 1`, JS-managed lifecycle (spawn, fall, land, wait, fade, respawn), and a ground-leaf pool.

## Implementation Decisions

- **Floating button fix:** Restructure `SceneFloatingButtons.svelte` button rendering to avoid `{...props}` overriding `onclick`. Either place `onclick` after spread, use `mergeProps`, or restructure the Tooltip.Trigger pattern.
- **Sidebar toggle:** Add a `PanelLeftOpen`/`PanelLeftClose` icon button inside the collapsed sidebar, visible on `md:` breakpoint. Wire to `sidebar.toggle()`.
- **Viewport scaling:** Introduce a `VIEWPORT_SCALE = 500 / 300` constant. Multiply all absolute pixel constants by this factor. Shape base values (trunk widths, blob radii) scale accordingly. Percentage-based values unchanged.
- **Row shift algorithm:** New function `computeRowShifts(layerCount, seed)` returns `number[]` of shift percentages. Uses seeded PRNG, validates +/-3 row constraint per generated value.
- **Growth animation architecture:** Replace per-branch CSS animation with a single `growthProgress` CSS custom property (`--growth-progress: 0..1`) oscillating via one `@keyframes`. Branches use `scaleY(var(--growth-progress))` from their base. Canopy blobs use `translate()` derived from `--growth-progress` to follow tip displacement.
- **Falling leaves lifecycle:** Manage leaves via a reactive `$state` array in `LowPolyTree.svelte`. Each leaf has state: `falling | landed | fading`. Timer-based transitions between states. Ground leaf pool capped at 15-20.
- **Asset barrel exports:** Each `index.ts` re-exports all `*Svg.svelte` components from its directory using named exports.
- **Settings tier switcher:** Apply `sticky top-0 z-10 bg-background` classes. Add `pb-4` for scroll cushion. Remove any existing negative margins or transparent backgrounds.

## Testing Decisions

- **Viewport scaling:** Verify all 13 shapes render within bounds at default config. Snapshot or visual regression tests for each shape.
- **Row shift algorithm:** Unit test `computeRowShifts()` -- verify front row = 0, shifts within 15-45%, +/-3 row constraint satisfied, deterministic per seed.
- **Growth animation:** Manual visual testing via dev server -- no automated animation testing infrastructure exists.
- **Floating buttons:** Manual browser testing -- verify click handlers fire.
- **Existing tests:** `branch_symmetry.test.ts` covers branch mirroring -- update expected defaults. Trunk fork tests verify fork geometry -- add assertion for no-quads-above-fork.
- **Reset logic:** Unit test `resetToShapeDefaults()` -- verify all fields reset, seed/shape preserved.
