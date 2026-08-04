# AGENTS.md — guidance for AI coding sessions

This file orients future AI assistants (and humans) working in the DMSaur
Trailheads repository. Read it before making changes.

## Product philosophy — preserve it

- **Problems, not apps.** Trailheads asks people to describe a problem,
  frustration, need, or opportunity. Never add flows that ask a contributor to
  name or design an application.
- **Community evidence over popularity.** The four community signals (has the
  problem / would use / would test / would pay) are richer than a single vote.
  Keep that framing; don't reduce it to likes.
- **Recognition is the contributor's choice.** Full name, first name, nickname,
  or anonymous — always per the contributor's preference. Never expose private
  contributor information (emails, contact details) in the frontend.

## Voice and terminology

- Keep language clear and human. Lead with plain words.
- The "trailhead"/trail metaphor is a light accent, **used selectively**. Do not
  rename ordinary interface elements with hiking terms. Status labels are plain
  ("Reviewing", "Building"); trail phrases are secondary supporting copy only.
- Do not use emoji as primary UI icons — use [Lucide](https://lucide.dev)
  icons consistently.

## Accessibility — maintain it

- Preserve visible keyboard focus states, semantic HTML, labels/`aria-*`, and
  AA-contrast color usage. The `jsx-a11y` ESLint rules must keep passing.
- Test keyboard navigation for any interactive component you add or change.

## Dependencies — keep them minimal

- Avoid new dependencies. Do **not** introduce Next.js, SSR, a custom backend,
  Docker, a component framework (MUI, etc.), large animation libraries,
  analytics, trackers, or cookies.
- Prefer small local helpers over packages. Inspect existing patterns in
  `src/components` and `src/lib` before adding anything.

## Security and data boundaries

- **Never commit secrets.** Only the public Supabase anon key may ever reach the
  client, and only via a `VITE_`-prefixed variable. Private/service-role keys and
  server secrets must never appear in client code or any `VITE_` variable.
- Keep backend operations **out** of the static frontend. Protected work belongs
  in future serverless functions (see `docs/ARCHITECTURE.md`), not the browser.
- Do not add AI features without explicit approval from the maintainer. Any
  future AI-assisted analysis must be clearly labeled and opt-in.

## Keep it deployable

- The site must always build (`npm run check`) and deploy to GitHub Pages.
- Preserve the SPA fallback (`public/404.html` + the restore snippet in
  `index.html`) and the `public/CNAME` custom domain file.
- Vite `base` is `'/'` for the production custom domain. Don't hardcode subpath
  assumptions.

## Database & migrations (Supabase)

- **Migrations are the source of truth.** Change the schema by adding a new file
  in `supabase/migrations/` (via `npm run db:diff` or by hand) — never by editing
  applied migrations or the database directly. Regenerate `src/types/database.ts`
  with `npm run gen:types` after schema changes.
- **Never expose private contributor fields** through RLS. `contributors` is
  intentionally locked; any public exposure must go through a deliberately
  designed safe projection (see `docs/ARCHITECTURE.md`), never email, auth
  identifiers, contact permission, or other private data.
- **RLS on every table.** Add read/write policies deliberately and minimally; no
  blanket write policies.
- `idea_signals` is a count-based placeholder, **not** the final voting model —
  don't build voting on it (see `docs/ARCHITECTURE.md`).
- The Supabase client (`src/lib/supabase.ts`) holds only the public anon key.
  Never put a service-role key or other secret in a `VITE_`-prefixed variable.

## Working conventions

- **Inspect existing patterns before replacing them.** Match the established
  structure, naming, and component style.
- Put demonstration data in `src/data`, not inside page components. Keep domain
  types in `src/types`.
- **Do not automatically commit or push.** Only commit or push when the user
  explicitly approves it for that specific milestone. Commit approval and push
  approval are separate.
- **Do not alter Git remotes** (GitHub `origin`, GitLab `gitlab`, or the
  fan-out push URLs) without explicit approval.
