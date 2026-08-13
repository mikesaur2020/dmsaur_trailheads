# DMSaur Trailheads

**Every great product begins with a real problem.**

Trailheads is where friends, users, and fellow problem-solvers can share the
everyday frustrations and unmet needs that might inspire future DMSaur apps. We
don't ask people to design an app — we ask them to describe a problem.

> Ideas are easy. Learning is the adventure.

Public site: **https://trailheads.dmsaur.com**

> **Handoff & authority:** [`PROJECT_STATE.md`](PROJECT_STATE.md) is the
> authoritative, always-current handoff document (where the project stands, what
> is live, and what not to redesign). Read it — and
> [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — before making architectural or
> implementation decisions.

---

## Current status

**Release: `v0.5-secure-submission-backend` — Phase 3A.1 complete.**

Trailheads now has a live hosted backend and a deployed, protected write path:

- **Live public read experience** — the browse and idea pages read real data from
  hosted Supabase (read-only). Hosted content is currently empty, so the site
  shows its polished empty state.
- **Secure submission backend (deployed)** — a private submission queue, a
  Turnstile-protected Edge Function, and an owner-only publication function.
- **In progress (Phase 3A.2)** — wiring the public Submit wizard to the deployed
  backend. Until then, the Submit page is still an in-browser demonstration and
  **visitor submissions are not yet accepted**.

For the full current state, milestones, and roadmap, see
[`PROJECT_STATE.md`](PROJECT_STATE.md) and [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Architecture at a glance

```
Browser (GitHub Pages SPA)
    │  reads public data (publishable key + RLS)         ← live
    │  submits ideas → POST (Phase 3A.2)
    ▼
Supabase Edge Function  submit-idea   ← the only write path; Turnstile-protected
    │  service_role INSERT (SELECT + INSERT only)
    ▼
private idea_submissions queue  ← RLS-locked; no public access
    │  moderator review (Supabase Dashboard)
    ▼
publish_submission()  (SECURITY DEFINER, owner-only, atomic)
    ▼
public ideas / idea_status_events   ← readable by everyone (read-only)
```

- **Frontend:** a client-rendered SPA on **GitHub Pages** (custom domain). It
  holds only public keys and never writes protected tables directly.
- **Backend:** hosted **Supabase** (Postgres + Row Level Security). RLS is the
  security boundary.
- **Serverless:** the **`submit-idea` Edge Function** (Deno) is the sole write
  path, protected by **Cloudflare Turnstile**, a honeypot, request validation,
  and idempotency.
- **Publication:** the `SECURITY DEFINER` `publish_submission()` function is the
  only way a queued submission becomes a public idea; it is owner-only.

Design rationale and the full model live in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) for dev/build
- [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- [React Router](https://reactrouter.com) (declarative `BrowserRouter`)
- [Lucide](https://lucide.dev) icons
- [Supabase](https://supabase.com) (hosted Postgres + RLS + Edge Functions)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) for bot
  protection on the public submit endpoint

No UI framework, animation library, analytics, trackers, or cookies.

## Local setup

Requires Node.js 20+ (CI builds on Node 22). Local database and Edge Function
work also need **Docker** and, for the function tests, **Deno**.

```bash
npm install
npm run dev
```

The dev server prints a local URL (default http://localhost:5173).

### Environment variables

The frontend reads its configuration from `VITE_`-prefixed variables (see
[`.env.example`](.env.example)). Only **public** values are ever exposed to the
browser:

- `VITE_SUPABASE_URL` — the hosted project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — the public **publishable** key (safe in the
  browser; RLS and grants are the boundary).
- `VITE_TURNSTILE_SITE_KEY` — the public Turnstile **site** key used by the
  submit widget (wired in Phase 3A.2).

In production these are provided as **GitHub repository Variables** and inlined at
build time. **Private keys** — the Supabase secret/service-role key, the database
password, and the Turnstile **secret** key — must never be `VITE_`-prefixed or
placed in the repo; the Turnstile secret lives only as a Supabase Edge Function
secret.

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

## Supabase backend

The backend is **live and hosted**. The schema, security, and the submission
write path are all defined by migrations in
[`supabase/migrations/`](supabase/migrations/) and the Edge Function in
[`supabase/functions/submit-idea/`](supabase/functions/submit-idea/).

- **Tables** — `ideas`, `idea_signals`, `idea_status_events` (public read),
  `contributors` (private), and the private `idea_submissions` queue.
- **Row Level Security** — enabled on every table. Public roles can read the
  content tables and nothing else; `contributors` and `idea_submissions` are
  fully locked. Writes to the queue are only possible via the Edge Function.
- **Least privilege** — `service_role` is limited to `SELECT` + `INSERT` on
  `idea_submissions`; `publish_submission()` `EXECUTE` is owner-only. Because
  hosted default privileges grant broadly, every security-sensitive migration
  explicitly `REVOKE ALL`s and then grants only the minimum (see
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)).
- **Edge Function** — `submit-idea` (Deno) is the only write path. It enforces a
  CORS allowlist, a strict field allowlist, request validation, a honeypot,
  Cloudflare Turnstile, idempotency, and a server-forced `status='pending'`.

### Run the database + function locally

Requires Docker (and Deno for the function tests). Nothing here touches the
hosted project.

```bash
npm run db:start   # boots the local Supabase stack
npm run db:reset   # applies all migrations + seed.sql to the local DB
```

Regenerate the typed schema after migration changes:

```bash
npm run gen:types  # overwrites src/types/database.ts from the local DB
```

Backend tests live in [`supabase/tests/`](supabase/tests/): Deno unit tests for
the Edge Function modules and an integration harness covering schema, RLS,
grants, `publish_submission()`, and the endpoint behavior.

## GitHub Pages deployment

Deployment is automated by [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml):

1. Triggers on every push to `main` (and manual **Run workflow**).
2. Installs Node 22, runs `npm ci`, lint, type-check, and `npm run build`
   (inlining the `VITE_*` repository Variables).
3. Uploads `dist/` and deploys it with the official GitHub Pages actions.

The build's SPA deep-link handling (`public/404.html` + a restore snippet in
`index.html`) ensures direct navigation and browser refresh work for every route
on GitHub Pages.

### Custom domain

The production target is **https://trailheads.dmsaur.com**, served at the domain
root, so Vite's `base` is `'/'`. A [`public/CNAME`](public/CNAME) file pins the
custom domain so it survives each Actions deployment.

DNS is managed outside this repository and is **not** configured here. If the site
ever needs to run from the GitHub project-pages subpath instead
(`https://<user>.github.io/dmsaur_trailheads/`), build with
`VITE_BASE=/dmsaur_trailheads/`. The full checklist lives in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Roadmap

The project ships in small, well-tested milestones. Completed releases: hosted
database (`v0.2`), live public read-only experience (`v0.3`, `v0.4`), and the
secure submission backend (`v0.5`). The current phase is **3A.2** — wiring the
Submit wizard to the deployed backend. Moderation UI, notifications, contributor
accounts, and voting are later phases. See
[`docs/ROADMAP.md`](docs/ROADMAP.md) and [`PROJECT_STATE.md`](PROJECT_STATE.md).

## Repository structure

```
src/
  components/    Reusable UI (Nav, Footer, IdeaCard, StatusPill, wizard steps, …)
  layouts/       RootLayout app shell (nav + routed content + footer)
  pages/         One component per route
  data/          Static fallback/demo data + wizard question config
  services/      Data-access layer (Supabase queries; mock fallback)
  types/         Domain TypeScript types (Idea, Contributor, signals, …)
  lib/           Small helpers (formatting, metadata maps, hooks, supabase client)
  styles/        Design tokens (theme.css)
supabase/
  migrations/    Authoritative database history
  functions/     submit-idea Edge Function (index/body/cors/turnstile)
  tests/         Deno unit tests + backend integration harness
  config.toml, seed.sql
docs/            VISION, ROADMAP, ARCHITECTURE
public/          404.html (SPA fallback), CNAME, .nojekyll, favicon
.github/
  workflows/     deploy-pages.yml (CI + GitHub Pages deploy)
PROJECT_STATE.md Authoritative current-state handoff document
```

See [`AGENTS.md`](AGENTS.md) for guidance on working in this repository.

---

© 2026 DMSaur. Built by hand. No trackers. No cookies.
