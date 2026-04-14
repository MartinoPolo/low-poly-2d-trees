# Low-Poly 2D Trees

<!-- Tree editor screenshot -->

![Tree Editor](docs/screenshot.png)

A procedural **low-poly tree generator and visual editor** — companion project for [BamGit](https://github.com/MartinP/bamgit). Design customizable polygon-based trees across 11 lifecycle stages, save them to a gallery, and compose multi-tree scenes.

## Features

- **Tree Editor** — 30+ parameters: shape, canopy geometry, branch depth, trunk structure, fruit, colors
- **7 tree shapes** — oak, pine, birch, fir, maple, willow, custom
- **11 lifecycle stages** — seed → sprouting → sapling → … → bare → dead → stump
- **Scene Editor** — multi-tree composition with lighting and depth
- **Gallery** — save, rename, and reload named tree configurations
- **Stage Showcase** — all lifecycle stages side by side
- **Auth** — email/password + Google OAuth
- **i18n** — English and Czech

## Stack

| Layer      | Technology                     |
| ---------- | ------------------------------ |
| Framework  | SvelteKit 2 + Svelte 5 (runes) |
| Language   | TypeScript (strict)            |
| Styling    | Tailwind CSS 4 + shadcn-svelte |
| Database   | PostgreSQL + Drizzle ORM       |
| Auth       | BetterAuth                     |
| i18n       | Paraglide JS                   |
| Deployment | Cloudflare Pages               |

## Install

```sh
pnpm install
cp .env.example .env   # set DATABASE_URL and AUTH_SECRET
pnpm run db:start      # requires Docker
pnpm run db:push
pnpm run dev
```

## Environment Variables

| Variable               | Required | Description                  |
| ---------------------- | -------- | ---------------------------- |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string |
| `AUTH_SECRET`          | Yes      | `openssl rand -base64 32`    |
| `GOOGLE_CLIENT_ID`     | No       | Google OAuth                 |
| `GOOGLE_CLIENT_SECRET` | No       | Google OAuth                 |

## Scripts

```sh
pnpm run dev          # dev server
pnpm run check:all    # format + lint + typecheck
pnpm run test         # unit tests
pnpm run test:e2e     # E2E tests
pnpm run db:studio    # Drizzle Studio GUI
```
