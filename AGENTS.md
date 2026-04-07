# Project Instructions

## Stack

- SvelteKit + Vite Plus
- TypeScript (strict)
- Tailwind CSS
- Drizzle ORM (PostgreSQL, strict mode)
- Vitest + Playwright

## Commands

- `vp dev` -- dev server
- `vp check` -- format + lint + typecheck
- `pnpm run check:all` -- full check suite
- `vp test` -- unit tests
- `pnpm run test:e2e` -- E2E tests

## Svelte Rules

- Before finalizing any .svelte or .svelte.ts file, run svelte-autofixer and iterate until no issues remain.
- Use Svelte 5 runes ($state, $derived, $props). Never use legacy patterns ($:, export let, on:event).
- When editing or creating Svelte code, use Svelte MCP tools (get-documentation, svelte-autofixer) for up-to-date API reference.

## Database

- Drizzle with `strict: true` -- always enabled to prevent data loss on renames.
- Schema in `src/lib/server/db/schema.ts`

## Testing

- TDD: write tests first, then implement.
- 80% coverage threshold enforced.
