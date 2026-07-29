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

Requires Node.js 20+ (this machine developed on Node 20/22-compatible tooling).

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

### Validating before you push

```bash
npm run check
```

This mirrors the CI pipeline: lint, type-check, and a production build must all
pass.

## GitHub Pages deployment

Deployment is automated by [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml):

1. Triggers on every push to `main` (and manual **Run workflow**).
2. Installs Node 20, runs `npm ci`, lint, type-check, and `npm run build`.
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

## Future: Supabase

Later phases will add a Supabase backend (PostgreSQL, passwordless magic-link
auth, Row Level Security) for real submissions, contributor identity, and
community signals. The client will only ever hold the public **anon** key;
private keys stay server-side. See [`.env.example`](.env.example) and
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Repository structure

```
src/
  components/    Reusable UI (Nav, Footer, IdeaCard, StatusPill, wizard steps, …)
  layouts/       RootLayout app shell (nav + routed content + footer)
  pages/         One component per route
  data/          Static demonstration data + wizard question config
  types/         Domain TypeScript types (Idea, Contributor, signals, …)
  lib/           Small helpers (formatting, metadata maps, hooks)
  styles/        Design tokens (theme.css)
docs/            VISION, ROADMAP, ARCHITECTURE
public/          404.html (SPA fallback), CNAME, .nojekyll, favicon
.github/
  workflows/     deploy-pages.yml (CI + GitHub Pages deploy)
```

See [`AGENTS.md`](AGENTS.md) for guidance on working in this repository.

---

© 2026 DMSaur. Built by hand. No trackers. No cookies.
