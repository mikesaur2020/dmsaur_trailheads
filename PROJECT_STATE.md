# PROJECT_STATE.md

**Primary handoff document for DMSaur Trailheads.**

> **This document is the authoritative project handoff.** Future Claude sessions
> and future developers should read it before making any architectural or
> implementation decisions.

This document answers one question: *"If I know nothing except what is in this
repository, where exactly does the project stand today?"* It is not a design
document (see `docs/ARCHITECTURE.md` and `docs/VISION.md`) and not a changelog
(see git history and tags). It describes the **current state** only.

Reflects release **v0.5-secure-submission-backend** (2026-08-12).

---

## Quick Start

*Understand the project's current state in under 30 seconds.*

| | |
|---|---|
| **Current Release** | `v0.5-secure-submission-backend` |
| **Current Phase** | Phase 3A.2 |
| **Latest Commit** | `e744807` |
| **Latest Release Tag** | `v0.5-secure-submission-backend` |
| **Backend Status** | ✅ Production deployed (`submit-idea` Edge Function ACTIVE v1) |
| **Frontend Status** | ⚠️ Submit Wizard still in **demo mode** (not wired to the backend) |
| **Current Goal** | Wire the existing Submit Wizard to the deployed backend. |

- **Last Updated:** 2026-08-13
- **Current Release:** `v0.5-secure-submission-backend`
- **Current Commit:** `e744807`

---

## 1. Project Overview

**DMSaur Trailheads** is a "problems-first" community idea pipeline for future
DMSaur applications. Instead of asking people to propose an app, it asks them to
describe a **problem, frustration, need, or opportunity** in their own words. The
strongest problems, evidenced by community signals, become candidates for real
products.

- **Purpose:** collect, moderate, and publish real-world problems as public
  "ideas," each shown with its journey (status history) and community signals
  (has-the-problem / would-use / would-test / would-pay).
- **Intended users:** a small, trusted community initially (friends and early
  contributors), moderated by a single maintainer. Designed to scale later.
- **Product vision:** a transparent, appreciative pipeline where contributors
  see their problems taken seriously and advanced through a visible journey.
  Recognition is always the contributor's choice.

Live site: **https://trailheads.dmsaur.com**

---

## 2. Current Release

| | |
|---|---|
| **Current Release** | `v0.5-secure-submission-backend` |
| **Latest commit SHA** | `e744807a1412ddb51f52be4bf672655c42250a60` (`e744807`) |
| **Release tag object SHA** | `70b93523b9931db81e92e3b8fa6dad8e7234e149` (`70b9352`, annotated) |
| **Tag → commit** | `70b9352` dereferences to `e744807` |
| **Date** | 2026-08-12 |
| **Branch** | `main` |

---

## 3. Current Production State

### Live

- **Hosted Supabase database** (`dmsaur-trailheads`, ref `ejtqjqwfjcfetzovpbma`,
  us-west-2, Postgres 17). All 5 migrations applied and verified.
- **Public read experience** — the browse page and idea detail pages read live
  from hosted `ideas`, `idea_signals`, and `idea_status_events` via the public
  **publishable** key (read-only). Hosted content tables are currently **empty**,
  so the live site correctly shows its polished empty state.
- **Secure submission backend** — private `idea_submissions` queue table with
  least-privilege access.
- **`submit-idea` Edge Function** — deployed and **ACTIVE (version 1)**. It is
  the only path that can write to the submission queue.
- **Cloudflare Turnstile** — configured on the hosted function (secret + expected
  hostname + expected action); full production validation is ON.
- **Least-privilege RLS/grants** — verified against the hosted catalog.
- **`publish_submission()`** — the atomic, owner-only publication function exists
  and is verified on hosted.
- **Frontend deployment** — the static SPA is deployed to GitHub Pages at the
  custom domain via GitHub Actions on push to `main`.

### Not Yet Live

- **Submit wizard integration** — the public Submit page is still the in-browser
  **demonstration** wizard. It does **not** call the backend yet, so **no real
  submissions can be made by visitors until Phase 3A.2**. The backend is live and
  ready; the frontend simply isn't wired to it.
- **Moderation UI** — moderation is intended to happen through the Supabase
  Dashboard for the MVP; there is no in-app admin UI.
- **Voting** — the `idea_signals` model is count-based/preview only; real voting
  is a later phase.
- **Notifications** — no email or status-update notifications.
- **Contributor accounts** — no authentication; submissions are anonymous-capable
  and account-free.
- **Duplicate detection** — no automated dedup tooling yet.
- **Admin portal** — none.

---

## 4. Current Architecture (operational)

High-level runtime flow of a submitted idea (target end-to-end; the frontend leg
is wired in Phase 3A.2):

```
Frontend (GitHub Pages SPA)
        │  POST (idea payload + Turnstile token + idempotency UUID)
        ▼
submit-idea Edge Function        ← sole write path / trust boundary
        │  (validates, screens bots, forces status='pending')
        │  service_role INSERT
        ▼
private idea_submissions queue   ← RLS-locked; no public access
        │
        ▼
moderator review (Supabase Dashboard)   ← approve / reject / edit
        │  calls publish_submission() (owner-only)
        ▼
publish_submission()  (SECURITY DEFINER, atomic)
        │  creates idea + initial status event, marks submission published
        ▼
public ideas / idea_status_events   ← readable by the public (read-only)
```

Platform pieces:

- **Frontend:** React + Vite SPA, client-rendered, hosted on **GitHub Pages** at
  a custom domain. It only ever holds public keys (Supabase publishable key; a
  Turnstile *site* key later). It reads public data directly via the publishable
  key and RLS; it never writes protected tables directly.
- **Supabase Postgres + RLS:** the security boundary. Row Level Security decides
  what the public roles can read; the public browser cannot write anything that
  matters.
- **Supabase Edge Functions (Deno):** `submit-idea` runs server-side, holds the
  service-role key from injected env, and is the only writer to the queue.
- **Cloudflare Turnstile:** bot/abuse screening, verified server-side inside the
  Edge Function.
- **`SECURITY DEFINER` SQL:** `publish_submission()` performs the privileged,
  atomic promotion from queue → public tables.

This section describes operation only. For design rationale and the full model,
see `docs/ARCHITECTURE.md`.

---

## 5. Database State

All tables live in the `public` schema. RLS is enabled on **every** table.

| Table | Purpose | Public access |
|---|---|---|
| `ideas` | Published, problem-focused ideas (title, summary, status, category, denormalized contributor display + extended detail). | Public **SELECT** only. |
| `idea_signals` | Count-based community signals per `(idea_id, key)`. Preview model, **not** the final voting model. | Public **SELECT** only. |
| `idea_status_events` | Status-history timeline entries per idea. | Public **SELECT** only. |
| `contributors` | Contributor profile data. Intentionally **unused** by any live code; will later split into private identity + a safe public projection. | **Private** (no public policy, no grant). |
| `idea_submissions` | The private submission queue. Holds raw submitted problem content, recognition choice, private `contact_email`, moderation fields (`moderator_notes`, `rejection_reason`), lifecycle timestamps, `idempotency_key`, and `published_idea_id`. | **Private** — RLS enabled, no anon/authenticated policy, no anon/authenticated grant. |

Key statements of fact:

- **`idea_submissions` is private.** The public browser and the public keys
  cannot read or write it. Only the server-side `service_role` (used by the Edge
  Function) may `SELECT`/`INSERT` it; moderation happens via the Dashboard owner.
- **`publish_submission()` is the only publication path.** Public `ideas` and
  `idea_status_events` rows are created by this function (or the Dashboard owner),
  never by the public browser and never directly by the Edge Function.

Migrations (in `supabase/migrations/`, all applied to hosted):

1. `20260803164416_initial_schema.sql` — enums, `ideas`/`contributors`/`idea_signals`/`idea_status_events`, `set_updated_at` trigger.
2. `20260803164417_row_level_security.sql` — RLS + public read policies.
3. `20260810201003_lock_anon_writes.sql` — revoke anon/authenticated writes on public-read tables.
4. `20260811181319_submission_queue.sql` — `submission_status` enum, `idea_submissions`, `publish_submission()`, RLS/grants.
5. `20260812152619_lock_submission_queue_service_role.sql` — normalize `service_role` on `idea_submissions` to `SELECT, INSERT` only.

---

## 6. Security Model

Each decision below exists for a specific reason.

- **RLS enabled on every table** — so access is enforced in the database, not the
  client. Even though the browser holds a public key, it can only do what policy
  allows.
- **No public access to `idea_submissions`** — the submission queue contains
  unmoderated content and private contact data. Exposing it publicly would leak
  private info and unpublished/raw text, so it has RLS enabled with **no**
  anon/authenticated policy and **no** grant (double-locked, like `contributors`).
- **`service_role` limited to `SELECT` + `INSERT` on `idea_submissions`** — the
  Edge Function needs to insert new submissions and read by `idempotency_key`, but
  it should **not** be able to modify or delete queue rows. Hosted Supabase's
  default privileges auto-grant `GRANT ALL` to `service_role` on new tables, so a
  follow-up migration explicitly `REVOKE ALL … then GRANT SELECT, INSERT` to
  enforce least privilege. This limits blast radius if the function is misused.
- **`publish_submission()` is owner-only** — `EXECUTE` is revoked from `PUBLIC`,
  `anon`, `authenticated`, **and** `service_role`. Publishing is a deliberate
  moderator action; the public submit path (which runs as `service_role`) is
  therefore **structurally incapable** of publishing. Only the table owner
  (postgres, via the Dashboard) can run it in the MVP.
- **`SECURITY DEFINER`** — `publish_submission()` must write `ideas` and
  `idea_status_events`, which are locked against normal roles. Running as the
  function owner lets it perform that privileged, audited promotion through one
  controlled entry point instead of granting broad write access.
- **Empty `search_path` (`SET search_path = ''`)** — a `SECURITY DEFINER`
  function is a classic privilege-escalation target via search-path hijacking.
  An empty search path plus fully-qualified object references (`public.*`) makes
  the function immune to that class of attack.
- **Turnstile protection** — the submit endpoint is public and unauthenticated,
  so it needs bot/abuse screening. Turnstile is verified server-side (secret key
  never in the browser), with production hostname/action enforcement enabled.
- **Honeypot** — a hidden `website` field that real users never fill. Non-empty
  submissions are silently accepted and dropped (HTTP 200, no row), so bots
  cannot distinguish rejection from success.
- **Idempotency** — each submission carries a client-generated `idempotency_key`
  (uuid, unique). Retries after a lost response (including retries where the
  single-use Turnstile token is already consumed) succeed without creating a
  duplicate row, because the queue is checked by key **before** Turnstile.
- **`verify_jwt = false`** — the endpoint is intentionally public: visitors submit
  ideas without an account, so requiring a Supabase auth JWT would break the
  flow. The Edge Function's own defenses (CORS allowlist, strict field allowlist,
  server-side validation, honeypot, Turnstile, idempotency, forced
  `status='pending'`) are the security boundary, not JWT verification.

---

## 7. Cloudflare / Turnstile

| Value | Purpose | Where it lives | Configured? |
|---|---|---|---|
| **Expected hostname** = `trailheads.dmsaur.com` | Production check that a verified token came from the real site. | Edge Function secret `TURNSTILE_EXPECTED_HOSTNAME`. | ✅ Set |
| **Expected action** = `submit_idea` | Production check that the token was minted by the submission widget. | Edge Function secret `TURNSTILE_EXPECTED_ACTION`. | ✅ Set |
| **Server secret key** | Server-side token verification against Cloudflare Siteverify. | Edge Function secret `TURNSTILE_SECRET_KEY` (set via `supabase secrets set`). **Never** in the repo or a `VITE_` variable. | ✅ Set |
| **Browser site key** (public) | Rendered by the Turnstile widget in the frontend to mint tokens with `action="submit_idea"`. | Will be a GitHub repository **Variable** `VITE_TURNSTILE_SITE_KEY`, inlined into the frontend build. | ⏳ **Not yet configured — added in Phase 3A.2.** |

No secret values are recorded in this repository or this document. Hostname/action
enforcement is only exercised end-to-end once a real browser-minted token is
produced (Phase 3A.2); no fake-token exceptions were added to production.

---

## 8. Deployment State

### Hosted

- **Database migrations:** all 5 applied (`supabase migration list` shows every
  migration `local == remote`).
- **Edge Function:** `submit-idea` deployed, **ACTIVE version 1**,
  `verify_jwt = false`.
- **Hosted verification completed** via read-only catalog dump + REST:
  - `submission_status` enum, `idea_submissions` columns/constraints/indexes/FK/
    trigger present; RLS enabled; no anon/authenticated policies.
  - Privilege matrix: anon/authenticated fully denied; `service_role` = `SELECT`
    + `INSERT` only; `publish_submission()` `EXECUTE` denied to all Data API roles.
  - Existing public tables unchanged; `contributors` still private.
  - Non-destructive smoke tests passed: fake-token → 403, GET/PUT → 405, invalid
    → 400, oversized → 413, disallowed origin → 403, honeypot → 200 with no row.
  - Hosted content tables remain `0/0/0` rows; **no production submission rows
    were created**.

### Local

- **Deno** (v2.9.x) installed — required to run the Edge Function unit tests.
- **Supabase CLI** via `npx` — used for local stack, migrations, and deploy.
- **Local test suite** run against a local Supabase stack:
  - 19 Deno unit tests (bounded body, Turnstile, CORS) — all pass.
  - Integration harness (`supabase/tests/submission_queue.test.sh`) covering
    schema/RLS/grants/constraints, `publish_submission()` behavior + privilege,
    and Edge Function endpoint behavior — all pass.
- **Integration testing completed** locally before any hosted push.

---

## 9. Release History

| Release | Status | Summary |
|---|---|---|
| `v0.2-hosted-db` | ✅ Released | Hosted Supabase database — schema + RLS applied to hosted; anon writes hardened. (UI still on mock data.) |
| `v0.3-live-readonly` | ✅ Released | Public read-only — Ideas browse + idea status history read live from hosted. |
| `v0.4-public-read-complete` | ✅ Released | Public read complete — ideas, status history, and community signal counts all read live. |
| `v0.5-secure-submission-backend` | ✅ Released | Secure submission **backend** — private `idea_submissions` queue, least-privilege RLS/grants, owner-only `publish_submission()`, Turnstile-protected `submit-idea` Edge Function (ACTIVE v1). Backend only; wizard not wired. |
| `v0.6` (planned; tag name TBD) | 🚧 Planned | Submit Wizard integration — wire the wizard to the deployed backend (Phase 3A.2). |

(Earlier Phase 0 skeleton and Phase 1 Supabase foundation predate the tagged
releases; see `docs/ROADMAP.md`.)

---

## Decisions We Intentionally Made

The authoritative list of architectural decisions. Do not reverse these without
explicit instruction.

- **Moderation queue first.** Submissions land in a private `idea_submissions`
  queue; nothing is public until a moderator promotes it.
- **Publish is moderator-only.** `publish_submission()` `EXECUTE` is owner-only;
  no Data API role (including `service_role`) can publish.
- **`service_role` least privilege.** `service_role` is limited to `SELECT` +
  `INSERT` on `idea_submissions` (explicitly normalized past the hosted default
  `GRANT ALL`).
- **The browser never writes protected tables directly.** The public site holds
  only public keys and reads via RLS; all writes go through the Edge Function.
- **The Edge Function is the only write path.** `submit-idea` is the single trust
  boundary for creating submissions.
- **The submission queue is private.** RLS-locked with no public policy or grant.
- **Title is generated during moderation.** The public wizard stays
  problem-focused; the moderator writes the public title at publish time.
- **Category is generated during moderation.** Same rationale — the submitter
  isn't asked to categorize; the moderator assigns it.
- **Duplicate detection deferred.** Dedup belongs with the moderation workflow,
  once final titles exist (Phase 3B); not built yet.
- **Notifications deferred.** MVP uses on-screen confirmation only.
- **`contributors` table intentionally unused.** Identity normalization waits for
  authentication; a safe public projection view will come later.
- **Contact email is never copied into `ideas`.** `contact_email` lives only on
  the private `idea_submissions` table and is never propagated to public data.
- **`verify_jwt = false` for the public endpoint.** The submit endpoint is
  intentionally account-free; its own defenses are the boundary.
- **Explicit least-privilege convention.** Because hosted default privileges
  auto-grant broadly, every security-sensitive migration must `REVOKE ALL` from
  the applicable Data API role(s) and then `GRANT` only the minimum required.

---

## Do Not Redesign

The following are **established, completed architecture** — not open questions.
Future AI sessions and developers should treat them as settled and build on top
of them, rather than as opportunities for redesign. Do not revisit any of these
unless the user explicitly requests it.

- **The Edge Function is the only write path.** All submission writes go through
  `submit-idea`.
- **The browser never writes directly to Supabase tables.** The frontend holds
  only public keys and reads via RLS.
- **`idea_submissions` remains private.** RLS-locked, no public policy or grant.
- **`publish_submission()` remains owner-only.** No Data API role (including
  `service_role`) may execute it.
- **`service_role` remains `SELECT` + `INSERT` only** on `idea_submissions`.
- **The moderation queue remains the publication gate.** Nothing becomes public
  without a moderator promoting it.
- **Turnstile remains mandatory** on the public submit endpoint.
- **`verify_jwt` remains `false`** for the public endpoint (its own defenses are
  the security boundary).
- **The existing phased roadmap is preserved** (see Section 12 and
  `docs/ROADMAP.md`).

If a proposed change appears to require reversing one of these, **stop and
confirm with the user first**.

---

## 11. Technical Debt / Deferred Work

Everything intentionally postponed, with the reason.

| Deferred item | Why |
|---|---|
| **Submit wizard integration** | Sequenced as its own phase (3A.2) so the backend could be built, deployed, and verified in isolation before any public UI can reach it. |
| **Moderation UI** | The Dashboard + `publish_submission()` is a safe, zero-build interim moderator tool; a private admin UI needs an authorization model and is deferred to Phase 3B. |
| **Notifications** | Requires stored email + consent + an email provider; not needed to accept submissions. Deferred to Phase 3C. |
| **Duplicate detection** | Meaningful only against final moderator-written titles; belongs with the moderation workflow (Phase 3B). Design keeps raw text durable so it can be added cleanly. |
| **Contributor accounts** | Passwordless magic-link auth is a distinct phase (3C); MVP is account-free by design. |
| **Voting** | `idea_signals` is a count-based preview; real per-person voting requires a redesign with uniqueness + RLS (Phase 3D). |
| **Embeddings / semantic dedup** | AI-assisted analysis is a later, clearly-labeled phase; reserved but not implemented. |
| **Clarification workflow (`needs_clarification`)** | Requires a contact/notification loop; the enum value is reserved but not activated. |
| **Admin portal** | Superset of the moderation UI; later phase. |

---

## Known Risks

Current known limitations (factual, not alarmist):

- **Submit Wizard not yet connected** — the public submit flow is a demo; real
  visitor submissions are impossible until Phase 3A.2 wires the wizard.
- **No moderation UI** — moderation depends on the Supabase Dashboard + manual
  `publish_submission()` calls in the MVP.
- **No production submissions yet** — `idea_submissions` is empty; the queue has
  never received a real row.
- **No duplicate detection** — moderators have no dedup tooling; duplicates would
  have to be caught by hand.
- **No notification workflow** — contributors receive no email/status updates.
- **Browser happy-path test deferred** — the one real end-to-end submission (with
  a live Turnstile token) has not been exercised; it lands in Phase 3A.2.
- **Turnstile browser site key not yet configured** — `VITE_TURNSTILE_SITE_KEY`
  is pending until Phase 3A.2, so the widget cannot yet mint tokens.

---

## 12. Immediate Next Milestone

**Current Phase: Phase 3A.2**

The **only** goal is to **wire the existing Submit Wizard to the already-live
backend**. The backend is complete and deployed; 3A.2 is frontend + verification.

Phase 3A.2 includes:

- Turnstile widget rendered in the wizard.
- The public **browser site key** wired in as `VITE_TURNSTILE_SITE_KEY` (GitHub
  Variable) with `action="submit_idea"`.
- A **display name** field (required unless the submitter chose anonymous).
- **Optional contact consent** ("may we contact you?").
- **Optional contact email** (collected only when consent is given).
- A hidden **honeypot** field (`website`).
- A client-generated **idempotency UUID** per wizard session.
- **Success UX** (real confirmation copy, replacing the "not stored" demo text).
- **Error UX** (field validation + retryable failure handling).
- **One real browser submission** end-to-end.
- **Verify the row lands in `idea_submissions`** (via Dashboard, since the queue
  is not publicly readable).

Phase 3A.2 does **NOT** include:

- Moderation
- Publishing
- Voting
- Notifications
- Duplicate detection

Also required before real submissions are accepted: minimal user-facing
privacy/expectation microcopy (submission ≠ development promise, ideas may be
edited/merged, recognition is the contributor's choice, contact info stays
private).

---

## 13. Repository State

| | |
|---|---|
| **Branch** | `main` |
| **Latest commit** | `e744807a1412ddb51f52be4bf672655c42250a60` (`e744807`) — `feat(submissions): add protected idea-submission backend` |
| **Latest release tag** | `v0.5-secure-submission-backend` (annotated, `70b9352`) |
| **GitHub remote (`origin`)** | `https://github.com/mikesaur2020/dmsaur_trailheads.git` |
| **GitLab remote (`gitlab`)** | `https://192.168.6.230/mikesaur/dmsaur_trailheads.git` |
| **Push behavior** | `git push origin main` fans out to **both** GitHub and GitLab (origin has both push URLs). Tags are pushed to both. |
| **Working tree** | Clean at release. |

Where documentation lives:

- **`PROJECT_STATE.md`** (this file) — current-state handoff.
- **`README.md`** — project intro / getting started.
- **`docs/VISION.md`** — product vision and principles.
- **`docs/ROADMAP.md`** — phased plan (Phase 0 → later phases).
- **`docs/ARCHITECTURE.md`** — architecture and design rationale (frontend,
  Supabase, RLS, secrets, the hosted least-privilege convention).
- **`AGENTS.md`** — agent/contributor working notes.
- **`supabase/migrations/`** — the authoritative database history.
- **`supabase/functions/submit-idea/`** — the Edge Function source
  (`index.ts`, `body.ts`, `cors.ts`, `turnstile.ts`, `.env.example`).
- **`supabase/tests/`** — Deno unit tests + the integration harness.

---

## How Future Claude Sessions Should Begin

1. Read `README.md`.
2. Read `PROJECT_STATE.md` (this file).
3. Read `docs/ARCHITECTURE.md`.
4. Review the latest release tag (`v0.5-secure-submission-backend`) and recent
   git history.
5. Do **not** redesign completed architecture.
6. Continue **only** from the current milestone (Phase 3A.2).
7. Preserve all existing security decisions (Section 6 and "Decisions We
   Intentionally Made") unless explicitly instructed otherwise.
8. Follow the project's **gated workflow**: design → review → implementation →
   testing → deployment → verification → commit/tag, stopping for explicit
   approval at each gate. Do not commit, push, tag, deploy, or change hosted
   Supabase without explicit approval.

---

## Returning After a Long Break

For a developer or Claude session resuming after months away:

1. Pull the latest `main` (fetch both remotes if needed).
2. Read `PROJECT_STATE.md` (this file).
3. Read `docs/ARCHITECTURE.md`.
4. Review the latest release tag (`v0.5-secure-submission-backend`) and recent
   git history.
5. Verify the Supabase project: migrations in sync
   (`supabase migration list` → all `local == remote`; ref `ejtqjqwfjcfetzovpbma`).
6. Verify Turnstile configuration (`supabase secrets list` shows
   `TURNSTILE_SECRET_KEY`, `TURNSTILE_EXPECTED_HOSTNAME`, `TURNSTILE_EXPECTED_ACTION`;
   the `submit-idea` function is ACTIVE).
7. Continue **only** from the Current Phase (Phase 3A.2), and honor "Do Not
   Redesign."

---

## Project Philosophy

DMSaur Trailheads is built deliberately, not quickly. The principles below explain
*why* the project is structured the way it is:

- **Correctness over speed.** A feature is not "done" until it is verified.
- **Security before convenience.** The safe path is the default; convenience never
  overrides a security boundary.
- **Maintainability over cleverness.** Clear, conventional code and explicit
  data-access boundaries beat clever shortcuts.
- **Production safety over rapid feature delivery.** Hosted production and real
  user data are protected at every step; nothing ships that could put them at risk.
- **Small, well-tested releases.** Each milestone is intentionally narrow, fully
  tested, and independently shippable.
- **Architecture before implementation.** Designs are agreed and reviewed before
  code is written.
- **Review before deployment.** Changes are reviewed and verified locally before
  they touch hosted infrastructure.

Every significant feature follows the same **gated workflow**, with an explicit
approval checkpoint at each stage:

```
Design
   ↓
Review
   ↓
Implementation
   ↓
Testing
   ↓
Deployment
   ↓
Verification
   ↓
Commit
   ↓
Tag
```

Skipping a stage is the exception, not the norm. When in doubt, stop and confirm
with the maintainer before proceeding.

---

*This document reflects the deployed and committed state as of
`v0.5-secure-submission-backend` (`e744807`, 2026-08-12). Keep it updated at each
milestone.*
