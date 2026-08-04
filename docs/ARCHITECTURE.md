# Architecture

How DMSaur Trailheads is put together today, and how the planned backend will
attach without compromising the static frontend.

## Overview

```
                       ┌──────────────────────────────┐
   Browser  ────────▶  │  GitHub Pages (static host)   │
                       │  React + Vite SPA (this repo)  │
                       └───────────────┬───────────────┘
                                       │  (Phase 1+)
                                       ▼
                       ┌──────────────────────────────┐
                       │           Supabase            │
                       │  PostgreSQL + Auth + RLS      │
                       │  Serverless (protected ops)   │
                       └──────────────────────────────┘
```

## Frontend — GitHub Pages

- A client-rendered single-page app built by Vite to static assets in `dist/`.
- Hosted on GitHub Pages, deployed by GitHub Actions
  (`.github/workflows/deploy-pages.yml`) on pushes to `main`.
- Routing is client-side via React Router's `BrowserRouter`, with `basename`
  derived from Vite's `BASE_URL`.

### SPA deep links on a static host

GitHub Pages has no server-side rewrite, so a direct request to `/ideas/example`
(or a browser refresh there) would 404. We use the well-known "SPA on GitHub
Pages" technique:

- `public/404.html` captures the unknown path, encodes it into a query string,
  and redirects to `/`.
- A small script in `index.html` decodes that query string back into the real
  path with `history.replaceState` before React Router mounts.

Because the production site is served from the domain root, `404.html` keeps
`pathSegmentsToKeep = 0`.

### Custom domain

- Production target: **https://trailheads.dmsaur.com**, served at the root.
- Vite `base` is `'/'` (`vite.config.ts`), overridable with `VITE_BASE`.
- `public/CNAME` contains `trailheads.dmsaur.com` so the custom domain survives
  every Actions deployment (Pages otherwise clears the domain when a deploy
  publishes without it).
- **DNS is managed outside this repository** and is not configured here.

#### If the site must move to the project-pages subpath

To serve from `https://<user>.github.io/dmsaur_trailheads/` instead of the custom
domain:

1. Build with `VITE_BASE=/dmsaur_trailheads/` (the router `basename` and asset
   paths follow automatically).
2. Set `pathSegmentsToKeep = 1` in `public/404.html`.
3. Remove (or stop publishing) `public/CNAME`.
4. Update the GitHub Pages settings to drop the custom domain.

No source code changes are required for the base-path switch beyond the build
variable — paths are derived from `import.meta.env.BASE_URL`.

## Planned backend — Supabase (Phase 1+)

- **PostgreSQL** stores ideas, contributors, community signals, and status
  history. The schema will mirror the types in `src/types`.
- **Authentication** is passwordless **magic-link** email sign-in — no GitHub
  account and no passwords. See `docs/ROADMAP.md` Phase 3.
- **Row Level Security (RLS)** is enabled from the first table. Access rules live
  in the database, so even though the browser holds a public key, users can only
  read/write what policy allows.
- **Serverless functions** (e.g. Supabase Edge Functions) handle any operation
  that needs elevated privileges or secret keys — moderation, protected writes,
  and any future AI-assisted analysis. These run server-side, never in the
  browser.

## Database schema (Phase 1)

The initial schema lives in `supabase/migrations/` and mirrors the domain types
in `src/types/index.ts`. It is created as a foundation only — the app still
renders mock data and is not yet wired to these tables.

**Tables** (all in `public`):

- `contributors` — contributor profiles.
- `ideas` — problem-focused ideas (with optional extended-detail columns).
- `idea_signals` — count-based community signals, one row per `(idea, key)`.
- `idea_status_events` — the status-history timeline.

Enums (`idea_status`, `category`, `recognition_preference`,
`willingness_to_pay`, `community_signal_key`) use the exact string values of the
matching TypeScript unions, so the domain types stay the single source of truth.
`supabase/seed.sql` mirrors the Phase 0 mock data.

### Row Level Security

RLS is enabled on **every** table from the first migration. Read access is
granted only where records are meant to be public:

- **Public read** (`anon` + `authenticated`, `SELECT` only): `ideas`,
  `idea_signals`, `idea_status_events` — these power the anonymous Browse Ideas
  experience.
- **`contributors` is intentionally locked** — RLS is on but there is **no**
  public policy, so the public roles can read nothing. Contributor records mix
  public-facing profile fields with data that is or will become private.

There are **no** insert/update/delete policies in this phase, so submission,
voting, and comments remain impossible through the public roles. Those flows
arrive later with their own explicit, reviewed policies.

#### Future: public contributor profiles

Before any contributor data is exposed publicly, we will design an explicit
separation between **private contributor identity** and a **safe public
projection** — e.g. a `public_contributor_profiles` view (or equivalent) that
surfaces only approved fields such as display name, public blurb, recognition
preference, badges, and public statistics. Email addresses, authentication
identifiers, contact permission, and any other private fields must never be
exposed through public policies.

#### Community signals are not the final voting model

`idea_signals` is a **count-based** table carried over from the Phase 0 mock
data, kept for compatibility and seeding. It is **not** how real voting will
work. Before community voting is enabled, signals will be redesigned as
individual contributor/visitor signal records (one row per person per signal)
with appropriate uniqueness constraints and RLS, and totals derived through a
query or a safe aggregate view. That redesign is out of scope for Phase 1.

## Secrets and the client bundle — the critical rule

Vite inlines every `VITE_`-prefixed variable into the JavaScript bundle that
ships to browsers. Therefore:

- **Only the Supabase anon (public) key** may be exposed client-side. It is
  designed for this and is safe *because* RLS constrains it.
- **Private keys and server secrets must never** be placed in a `VITE_` variable
  or referenced from client code. A service-role key in the bundle would grant
  every visitor full database access.
- Server secrets belong only to serverless functions and CI secrets, never to
  the static frontend.

See `.env.example` for the annotated placeholders.
