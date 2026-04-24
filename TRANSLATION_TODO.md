# Translation TODO

## What's Done

### Infrastructure

- `messages/en.json` — 298 keys, all English strings
- `messages/cs.json` — 298 keys, all Czech translations
- `project.inlang/settings.json` — fixed `{languageTag}` path, compiles correctly
- Paraglide runtime generates message functions successfully

### Components Updated

- `src/lib/components/app-shell/AppSidebar.svelte`
- `src/lib/components/app-shell/SceneFloatingButtons.svelte`
- `src/routes/auth/sign-in/+page.svelte`
- `src/routes/auth/sign-up/+page.svelte`

---

## What's Left

### Import pattern

```ts
import { m } from '$lib/paraglide/messages.js';
```

### ID Stabilization Rule

Every `LabeledSlider`, `LabeledCheckbox`, `LabeledSelect`, `LabeledRangeSliderDual` call site needs an explicit `id` prop matching what `labelToInputId(englishLabel)` would produce (lowercase, non-alnum → `-`, prefix `input-`). E.g. `label="Blob Count"` → add `id="input-blob-count"`. This prevents E2E test breakage when labels change per locale.

### Composed Card Components

| File                                                     | What to translate                                                                             |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/lib/components/composed/CanopyCard.svelte`          | section title + 5 slider labels                                                               |
| `src/lib/components/composed/CanopyColorCard.svelte`     | section title + 2 color labels                                                                |
| `src/lib/components/composed/TrunkCard.svelte`           | section title + 7 slider labels + 1 select label                                              |
| `src/lib/components/composed/TrunkColorCard.svelte`      | section title, "Presets" label, 3 slider labels, 10 preset names (see special handling below) |
| `src/lib/components/composed/BranchesCard.svelte`        | section title + 10 slider labels + 1 select + 1 checkbox + 3 range sliders                    |
| `src/lib/components/composed/ShapeCard.svelte`           | section title + 2 select labels + 1 checkbox + "Seed" label                                   |
| `src/lib/components/composed/LightingCard.svelte`        | section title + 2 slider labels                                                               |
| `src/lib/components/composed/OverlaysCard.svelte`        | section title + 2 checkboxes + 3 sliders + "Color" label                                      |
| `src/lib/components/composed/ToolAccessoriesCard.svelte` | section title + dynamic tool labels + `"{tool} Size"` pattern + textarea placeholder          |
| `src/lib/components/composed/AnimationsCard.svelte`      | section title + 4 checkboxes + 1 slider                                                       |
| `src/lib/components/composed/DebugCard.svelte`           | section title + 7-8 checkboxes                                                                |
| `src/lib/components/composed/GrowablesCard.svelte`       | section title + 1 select + 1 slider                                                           |
| `src/lib/components/composed/CustomBlobsEditor.svelte`   | "Custom Blobs" title + "Blob {n}" + 4 per-blob slider/select labels                           |
| `src/lib/components/composed/SettingsTierControl.svelte` | tier labels (basic/intermediate/advanced), remove `capitalize` CSS class                      |
| `src/lib/components/composed/LabeledSelect.svelte`       | default placeholder `'Select…'` → `m.placeholder_select()`                                    |

### Route Pages

| File                                   | What to translate                                                                                                                       |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/+page.svelte`              | page title, "Scene"/"Environment"/"Connections" section titles, "Rain" label, `ENVIRONMENT_TOGGLES` labels, "Root Connections" checkbox |
| `src/routes/editor/+page.svelte`       | page title, "Saved as {name}" / "Failed to save tree" messages                                                                          |
| `src/routes/gallery/+page.svelte`      | page title, heading, subtitle, loading/error/empty states, confirm dialog, aria-labels                                                  |
| `src/routes/settings/+page.svelte`     | page title, heading, avatar section, passkey section, all button/error text                                                             |
| `src/routes/point-editor/+page.svelte` | heading, 6 tab labels, preview/snap cards, asset labels, `CATEGORY_ASSET_OPTIONS` labels                                                |
| `src/routes/showcase/+page.svelte`     | page title, heading, 5 section headings, stage/shape select labels, Randomize button                                                    |

### Other

| File                  | What to translate                                             |
| --------------------- | ------------------------------------------------------------- |
| `src/hooks.server.ts` | "Not found" and "An unexpected error occurred" error messages |

### Language Switcher (New Feature)

Add language switcher in the account dropdown in `AppSidebar.svelte`, next to the Theme submenu. English/Czech options with flag icons.

---

## Special Handling Notes

### TrunkColorCard preset names

The `TRUNK_PRESETS` array has `name` strings used for `aria-label`, `title`, AND `data-trunk-preset` test attribute. An E2E test (`tests/e2e/issue9_color_picker.spec.ts:49`) depends on `[data-trunk-preset="Dark brown"]`.

**Fix:** Add stable `id` field to each preset (e.g. `'dark_brown'`). Use `id` for `data-trunk-preset`. Use `m.preset_*()` for `aria-label`/`title`. Remove `name` field.

### ToolAccessoriesCard dynamic labels

`label="{option.label} Size"` needs parameterized message: `m.label_tool_size({ tool: translatedToolLabel })`. Create a `TOOL_LABELS` lookup mapping tool type keys → `m.tool_*()` calls.

### SettingsTierControl

Tier values displayed with CSS `capitalize`. Replace with translated labels from a lookup and remove the `capitalize` class.

### Select option arrays in .ts files

`TREE_SHAPE_OPTIONS`, `TREE_STAGE_OPTIONS`, `FRUIT_TYPE_OPTIONS`, `TOOL_OPTIONS`, `BRANCH_MIRRORING_OPTIONS`, `CROOKEDNESS_MODE_OPTIONS`, `CUSTOM_BLOB_BOUNDARY_OPTIONS` are defined in plain `.ts` files with English labels. **Don't modify** those files. Instead, create translation lookups in each consuming `.svelte` component and override labels at render time.

### Point Editor CATEGORY_ASSET_OPTIONS

This const has inline English labels for ground/stages/overlays/flowers. Since it's in a `.svelte` file script block, you can use `m.*()` directly in the definition. Make it `$derived` or use lookup functions.
