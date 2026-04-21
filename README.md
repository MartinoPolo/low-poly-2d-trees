# Low-Poly 2D Trees

<!-- Tree editor screenshot -->

![Tree Editor](docs/screenshot.png)

A procedural **low-poly tree generator and visual editor** — companion project for [BamGit](https://github.com/MartinoPolo/bamgit). Design customizable polygon-based trees of multiple shapes across lifecycle stages, save them to a gallery, and compose multi-tree scenes.

## Features

- **Tree Editor** — 30+ parameters: shape, canopy geometry, branch depth, trunk structure, fruit, colors
- **Tree shapes** — oak, pine, birch, fir, maple, willow, cypress, apple, cherry, bush, baobab, acacia, custom
- **Lifecycle stages** — seed → sprouting → sapling → growing → leafy → flowering → fruiting → autumn → ready → bare → dead → stump
- **Animations** — canopy sway, growth oscillation, falling leaves, tool idle animations
- **Environment effects** — rain, snow, lightning, fireflies, wind particles, sun rays, clouds
- **Overlays** — glow, speech bubble, storm cloud, wilting effect
- **Scene Editor** — multi-tree composition with depth layering and stage selector
- **Gallery** — save, rename, and reload named tree configurations
- **Stage Showcase** — all lifecycle stages side by side
- **Auth** — email/password, Google OAuth, GitHub OAuth, Passkeys
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
| `GITHUB_CLIENT_ID`     | No       | GitHub OAuth                 |
| `GITHUB_CLIENT_SECRET` | No       | GitHub OAuth                 |

## Scripts

```sh
pnpm run dev          # dev server
pnpm run check        # typecheck + sveltecheck
pnpm run check:all    # format + lint + typecheck + dead code + style
pnpm run test         # unit tests
pnpm run test:e2e     # E2E tests
pnpm run db:studio    # Drizzle Studio GUI
```
