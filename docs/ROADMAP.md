# Roadmap

Phased plan for DMSaur Trailheads. Each phase is intentionally small and
shippable. Backend capabilities arrive only after the skeleton is solid.

> Status legend: ✅ done · 🔭 planned

---

## Phase 0 — Skeleton ✅ (current)

Frontend-only foundation.

- Product identity, visual design system, and navigation.
- All routes and the planned page structure.
- Static demonstration of the idea-submission workflow (in browser memory only).
- Mock data for ideas and contributors, with strong TypeScript types.
- GitHub Pages deployment pipeline + SPA deep-link handling.
- Documentation and a foundation for later Supabase integration.

**No** backend, auth, database, email, AI, or persistence.

## Phase 1 — Supabase and database 🔭

- Introduce a Supabase project (PostgreSQL).
- Define schema mirroring `src/types` (ideas, contributors, signals, status
  history).
- Wire the client to read real data using the public **anon** key only.
- Establish Row Level Security (RLS) from day one.

## Phase 2 — Anonymous idea submissions 🔭

- Turn the demonstration wizard into a real submission that writes to the
  database.
- Allow submissions without an account, honoring recognition preferences.
- Basic spam/abuse protection and validation.

## Phase 3 — Magic-link contributor identity 🔭

- Passwordless email magic-link authentication (no GitHub, no passwords).
- Let contributors claim their ideas and manage their recognition.
- Contributor profiles backed by real data.

## Phase 4 — Community signals 🔭

- Make the four signals live: has the problem / would use / would test /
  would pay.
- Persist and de-duplicate signals; surface aggregate evidence per idea.

## Phase 5 — Private administration 🔭

- Maintainer-only tools to review, triage, and advance ideas through the
  journey.
- Status history management and moderation.

## Phase 6 — Gamification 🔭

- Turn the XP/badges previews into a real, positive recognition system.
- A Hall of Fame that celebrates contributors — appreciative, never manipulative
  or competitive.

## Phase 7 — AI-assisted analysis 🔭

- Optional, clearly-labeled AI assistance (e.g. theme summaries, related
  problems).
- Runs only through protected server-side functions, never with client-exposed
  keys, and only with explicit approval.

---

### Guardrails that hold across all phases

- Private keys never ship to the browser (see `docs/ARCHITECTURE.md`).
- Legal terms and a privacy policy land **before** real submissions are enabled.
- The site stays deployable to GitHub Pages at every step.
