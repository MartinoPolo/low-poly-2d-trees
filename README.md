# SvelteKit Template

Production-ready SvelteKit template with authentication, i18n, database, and modern tooling.

## Stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Framework     | SvelteKit 2 + Svelte 5 (runes)              |
| Build         | Vite 7 via Vite Plus                        |
| Language      | TypeScript (strict mode)                    |
| Styling       | Tailwind CSS 4                              |
| Database      | PostgreSQL + Drizzle ORM (strict mode)      |
| Auth          | BetterAuth (email/password, Google OAuth)   |
| i18n          | Paraglide JS (en, cs)                       |
| Testing       | Vitest + Playwright + Testing Library       |
| Linting       | ESLint + Stylelint + OxLint (via Vite Plus) |
| Formatting    | OxFormatter (via Vite Plus)                 |
| Dead code     | Knip                                        |
| Component dev | Storybook 10                                |
| Deployment    | Cloudflare Pages                            |

## Getting Started

```sh
# 1. Install dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and AUTH_SECRET

# 3. Start PostgreSQL (requires Docker)
pnpm run db:start

# 4. Push database schema
pnpm run db:push

# 5. Start dev server
pnpm run dev
```

## Scripts

### Development

| Script               | Description                          |
| -------------------- | ------------------------------------ |
| `pnpm run dev`       | Start dev server (`vp dev`)          |
| `pnpm run build`     | Production build (`vp build`)        |
| `pnpm run preview`   | Preview via Cloudflare Pages locally |
| `pnpm run storybook` | Start Storybook on port 6006         |

### Code Quality

| Script               | Description                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| `pnpm run lint`      | OxLint + ESLint (type-aware)                                            |
| `pnpm run lint:css`  | Stylelint for CSS and Svelte                                            |
| `pnpm run format`    | Format with OxFormatter                                                 |
| `pnpm run check:all` | Full suite: lint + typecheck + eslint + stylelint + knip + svelte-check |

### Testing

| Script              | Description                                     |
| ------------------- | ----------------------------------------------- |
| `pnpm run test`     | Unit tests with Vitest (80% coverage threshold) |
| `pnpm run test:e2e` | E2E tests with Playwright (Chromium)            |

### Database

| Script                 | Description                         |
| ---------------------- | ----------------------------------- |
| `pnpm run db:start`    | Start PostgreSQL via Docker Compose |
| `pnpm run db:push`     | Push schema changes to database     |
| `pnpm run db:generate` | Generate migration files            |
| `pnpm run db:migrate`  | Run migrations                      |
| `pnpm run db:studio`   | Open Drizzle Studio (DB GUI)        |

### Deployment

| Script                     | Description                       |
| -------------------------- | --------------------------------- |
| `pnpm run cf:types`        | Generate Cloudflare Workers types |
| `pnpm run build:storybook` | Build static Storybook            |

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable               | Required | Description                                       |
| ---------------------- | -------- | ------------------------------------------------- |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string                      |
| `AUTH_SECRET`          | Yes      | 32-byte base64 secret (`openssl rand -base64 32`) |
| `ORIGIN`               | No       | App URL (default: `http://localhost:5173`)        |
| `GOOGLE_CLIENT_ID`     | No       | Google OAuth client ID                            |
| `GOOGLE_CLIENT_SECRET` | No       | Google OAuth client secret                        |

Google OAuth is automatically enabled when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.

## Authentication (BetterAuth)

Full auth system in `src/lib/server/auth.ts` with:

- **Email/password** login and signup
- **Google OAuth** (optional, env-based)
- **Session management** with cookie caching (5 min)
- **Password reset** flow with token expiry
- **Email verification** (disabled by default, enable in production)

### Database schema

Auth tables are defined in `src/lib/server/db/schema.ts`: `user`, `session`, `account`, `verification`.

### Hooks integration

`src/hooks.server.ts` injects `event.locals.user` and `event.locals.session` into every request.

### Email sending

Email callbacks in `auth.ts` currently log to console. Replace the `sendResetPassword` and `sendVerificationEmail` callbacks with your email service (Resend, SendGrid, Postmark, etc.).

### Production checklist

- Set `requireEmailVerification: true`
- Set `sendOnSignUp: true`
- Implement email sending callbacks
- Set strong `AUTH_SECRET`
- Configure `ORIGIN` to your production URL

## Internationalization (Paraglide)

URL-based i18n with cookie fallback. English is the base locale (no prefix), Czech uses `/cs/` prefix.

### Strategy

Configured in `vite.config.ts` as `['url', 'cookie', 'baseLocale']`:

1. **URL** -- checks path prefix (`/cs/about` = Czech)
2. **Cookie** -- remembers user's last choice
3. **baseLocale** -- falls back to English

### Usage

```svelte
<script>
  import * as m from '$lib/paraglide/messages';
</script>

<h1>{m.welcome()}</h1>
<p>{m.hello_world({ name: 'World' })}</p>
```

### Adding a locale

1. Add the locale code to `project.inlang/settings.json` `locales` array
2. Create `messages/{locale}.json` with translations
3. Add URL pattern entry in `vite.config.ts` `urlPatterns`

### VS Code extension

Install the [Inlang VS Code extension](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) for inline translation editing and key extraction.

### Removing i18n

If your project doesn't need i18n:

1. Remove `@inlang/paraglide-js` from `package.json`
2. Remove `paraglideVitePlugin(...)` from `vite.config.ts`
3. Delete `project.inlang/`, `messages/`, `src/hooks.ts`
4. Remove `paraglideMiddleware` from `src/hooks.server.ts`
5. Remove `src/lib/paraglide/` from `.gitignore`
6. Change `%lang%` back to `en` in `src/app.html`
7. Remove `inlang.vs-code-extension` from `.vscode/extensions.json`

## Svelte Inspector

Press **Alt+X** during development to toggle the Svelte Inspector. Click any element to jump to its source code in your editor. Configured in `svelte.config.js` under `vitePlugin.inspector`.

## Experimental Features

### Remote Functions

Type-safe client-server RPC. Functions defined with the remote function API run on the server but can be called from the client with full type safety. Enabled via `kit.experimental.remoteFunctions` in `svelte.config.js`.

### Async Components

Use `await` directly in Svelte components without `{#await}` blocks. Enabled via `compilerOptions.experimental.async` in `svelte.config.js`.

## Storybook

Component development environment with Tailwind CSS support.

```sh
pnpm run storybook        # dev server on port 6006
pnpm run build:storybook  # static build
```

Place story files next to components: `src/lib/components/Button.stories.svelte` or `Button.stories.ts`.

## Deployment

### Cloudflare Pages (default)

This template uses `@sveltejs/adapter-cloudflare`. Deploy via:

1. **Cloudflare Dashboard**: Connect your GitHub repo at [dash.cloudflare.com](https://dash.cloudflare.com) for automatic deployments and PR preview URLs
2. **CLI**: `npx wrangler pages deploy .svelte-kit/cloudflare`

Configuration is in `wrangler.jsonc`. Add Cloudflare bindings (KV, D1, R2) in `src/app.d.ts` under `App.Platform`.

### Switching adapter

To deploy elsewhere, swap the adapter in `svelte.config.js`:

```sh
# For auto-detection
pnpm add -D @sveltejs/adapter-auto
# Then change import in svelte.config.js:
# import adapter from '@sveltejs/adapter-auto';

# For Node.js / Docker
pnpm add -D @sveltejs/adapter-node

# For Vercel
pnpm add -D @sveltejs/adapter-vercel

# For static sites
pnpm add -D @sveltejs/adapter-static
```

See [SvelteKit adapters docs](https://svelte.dev/docs/kit/adapters) for the full list.

## CI/CD (GitHub Actions)

`.github/workflows/ci.yml` runs on PRs and pushes to `dev`/`main`:

1. Install dependencies (pnpm, Node 22)
2. Run full check suite (`check:all`)
3. Run unit tests with coverage
4. Install Playwright and run E2E tests

### Auto-deploy

Connect your repo to Cloudflare Pages for automatic deployments on push to `main` and PR preview environments.

## Code Conventions

- **Indentation**: Tabs (4-width)
- **Quotes**: Single quotes
- **Semicolons**: Required
- **Trailing commas**: Yes
- **Line width**: 100 characters
- **Line endings**: LF
- **Variable naming**: `snake_case` or `PascalCase` (no camelCase)
- **Type naming**: `PascalCase`
- **Constants**: `UPPER_CASE`, `snake_case`, or `PascalCase`
- **Svelte**: Svelte 5 runes only (`$state`, `$derived`, `$props`). No legacy patterns.
- **Imports**: Consistent type imports with `inline-type-imports` style

## Project Structure

```
src/
  app.css                  # Tailwind CSS entry point
  app.d.ts                 # Global type definitions
  app.html                 # HTML shell (with %lang% for i18n)
  hooks.ts                 # Client hooks (i18n URL rerouting)
  hooks.server.ts          # Server hooks (i18n middleware + auth session)
  lib/
    auth-client.ts         # BetterAuth client (for use in components)
    index.ts               # $lib public exports
    assets/                # Static assets (favicon, etc.)
    paraglide/             # Generated i18n runtime (gitignored)
    server/
      auth.ts              # BetterAuth server config
      db/
        index.ts           # Drizzle client instance
        schema.ts          # Database schema (auth tables)
  routes/
    +layout.svelte         # Root layout (CSS, favicon)
    +page.svelte           # Home page
messages/                  # Translation files (en.json, cs.json)
project.inlang/            # Inlang i18n project config
tests/e2e/                 # Playwright E2E tests
.storybook/                # Storybook configuration
.github/workflows/         # CI pipeline
```

## Recreate Command

```sh
npx sv@0.13.0 create --template minimal --types ts --no-install template-sveltekit
```
