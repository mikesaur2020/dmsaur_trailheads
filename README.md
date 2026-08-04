# DMSaur Trailheads

**Every great product begins with a real problem.**

Trailheads is where friends, users, and fellow problem-solvers can share the
everyday frustrations and unmet needs that might inspire future DMSaur apps. We
don't ask people to design an app — we ask them to describe a problem.

> Ideas are easy. Learning is the adventure.

Public site (production target): **https://trailheads.dmsaur.com**

---

## Current status — Phase 0: Skeleton

This repository is a **frontend-only skeleton**. It establishes the product
identity, the visual design system, navigation, the planned page structure, and
a static demonstration of the future idea-submission workflow.

It intentionally does **not** include any backend: no Supabase, authentication,
live database, email delivery, AI APIs, or vote persistence. The idea wizard runs
entirely in browser memory and stores nothing. See
[`docs/ROADMAP.md`](docs/ROADMAP.md) for what each later phase adds.

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) for dev/build
- [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- [React Router](https://reactrouter.com) (declarative `BrowserRouter`)
- [Lucide](https://lucide.dev) icons

No UI framework, animation library, analytics, trackers, or cookies.

## Local setup

Requires Node.js 20+ (CI builds on Node 22).

```bash
npm install
npm run dev
```

The dev server prints a local URL (default http://localhost:5173).

## Commands

| Command             | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Start the Vite dev server with hot reload.              |
| `npm run build`     | Type-check (`tsc -b`) then produce a production `dist/`.|
| `npm run preview`   | Serve the built `dist/` locally to verify the build.    |
| `npm run lint`      | Run ESLint (TypeScript + React Hooks + jsx-a11y).       |
| `npm run typecheck` | Type-check without emitting.                            |
| `npm run check`     | Lint + type-check + build (the same gates CI runs).     |
| `npm run db:start`  | Start the local Supabase stack (Docker).                |
| `npm run db:stop`   | Stop the local Supabase stack.                          |
| `npm run db:reset`  | Recreate the local DB: apply all migrations + `seed.sql`.|
| `npm run db:diff`   | Diff local DB changes into a new migration.             |
| `npm run gen:types` | Regenerate `src/types/database.ts` from the local DB.   |

### Validating before you push

```bash
npm run check
```

This mirrors the CI pipeline: lint, type-check, and a production build must all
pass.

## GitHub Pages deployment

Deployment is automated by [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml):

1. Triggers on every push to `main` (and manual **Run workflow**).
2. Installs Node 22, runs `npm ci`, lint, type-check, and `npm run build`.
3. Uploads `dist/` and deploys it with the official GitHub Pages actions.

The build's SPA deep-link handling (`public/404.html` + a restore snippet in
`index.html`) ensures direct navigation and browser refresh work for every
route on GitHub Pages.

### Custom domain

The production target is **https://trailheads.dmsaur.com**, served at the domain
root, so Vite's `base` is `'/'`. A [`public/CNAME`](public/CNAME) file pins the
custom domain so it survives each Actions deployment.

DNS is managed outside this repository and is **not** configured here. If the
site ever needs to run from the GitHub project-pages subpath instead
(`https://<user>.github.io/dmsaur_trailheads/`), build with
`VITE_BASE=/dmsaur_trailheads/`. The full checklist lives in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Supabase (Phase 1 — foundation)

Phase 1 lays the backend **foundation** without changing the app: the pages
still render mock data. What exists now:

- **Schema + migrations** in [`supabase/migrations/`](supabase/migrations/) —
  ideas, contributors, community signals, and status history, mirroring the
  types in [`src/types/index.ts`](src/types/index.ts).
- **Seed** ([`supabase/seed.sql`](supabase/seed.sql)) mirroring the current mock
  data, so a local database holds the same content the UI shows.
- **Row Level Security** enabled on every table. `ideas`, `idea_signals`, and
  `idea_status_events` are publicly readable; **`contributors` is intentionally
  locked** (see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)). There are no
  write policies yet.
- A **guarded client** ([`src/lib/supabase.ts`](src/lib/supabase.ts)) that reads
  `VITE_SUPABASE_*` env vars. It is **not imported by any page yet** — wiring
  queries is Phase 2.

### Run the database locally

Requires Docker. Nothing here touches a hosted project.

```bash
npm run db:start   # boots the local Supabase stack
npm run db:reset   # applies migrations + seed.sql to the local DB
```

Regenerate the typed schema after migration changes:

```bash
npm run gen:types  # overwrites src/types/database.ts from the local DB
```

The client will only ever hold the public **anon** key; private/service-role
keys stay server-side and must never be `VITE_`-prefixed. See
[`.env.example`](.env.example) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Later phases add authentication, real submissions, and live community signals —
see [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Repository structure

```
src/
  components/    Reusable UI (Nav, Footer, IdeaCard, StatusPill, wizard steps, …)
  layouts/       RootLayout app shell (nav + routed content + footer)
  pages/         One component per route
  data/          Static demonstration data + wizard question config
  types/         Domain TypeScript types (Idea, Contributor, signals, …)
  lib/           Small helpers (formatting, metadata maps, hooks, supabase client)
  styles/        Design tokens (theme.css)
supabase/        config.toml, migrations/, seed.sql (Phase 1 backend foundation)
docs/            VISION, ROADMAP, ARCHITECTURE
public/          404.html (SPA fallback), CNAME, .nojekyll, favicon
.github/
  workflows/     deploy-pages.yml (CI + GitHub Pages deploy)
```

See [`AGENTS.md`](AGENTS.md) for guidance on working in this repository.

---

© 2026 DMSaur. Built by hand. No trackers. No cookies.
