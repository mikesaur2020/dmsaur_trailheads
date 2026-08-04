-- DMSaur Trailheads — Row Level Security (Phase 1 foundation)
--
-- RLS is enabled on every table from day one. Only the public-facing content
-- tables receive a public read policy; contributors stays fully locked.
--
-- There are NO insert/update/delete policies anywhere in this milestone, so
-- writes (idea submission, voting, comments, etc.) remain impossible through the
-- anon/authenticated roles. Those flows arrive in later phases with their own
-- explicit, reviewed policies.

-- Enable RLS everywhere.
alter table public.ideas              enable row level security;
alter table public.idea_signals       enable row level security;
alter table public.idea_status_events enable row level security;
alter table public.contributors       enable row level security;

-- ---------------------------------------------------------------------------
-- Public read access — for the anonymous "Browse Ideas" experience.
-- These records are intended to be public, so anon + authenticated may SELECT.
-- ---------------------------------------------------------------------------
create policy "Public read access to ideas"
  on public.ideas
  for select
  to anon, authenticated
  using (true);

create policy "Public read access to idea signals"
  on public.idea_signals
  for select
  to anon, authenticated
  using (true);

create policy "Public read access to idea status events"
  on public.idea_status_events
  for select
  to anon, authenticated
  using (true);

-- Table-level privileges. RLS policies filter *rows*, but the role still needs a
-- SELECT grant to touch the table at all. Grant SELECT on the public-read tables
-- to the public roles; contributors is deliberately omitted (double-locked: no
-- grant AND no policy).
grant select on public.ideas              to anon, authenticated;
grant select on public.idea_signals       to anon, authenticated;
grant select on public.idea_status_events to anon, authenticated;
revoke all on public.contributors from anon, authenticated;

-- ---------------------------------------------------------------------------
-- contributors — intentionally NO public policy.
--
-- RLS is enabled but no anon/authenticated policy is granted, so the public
-- roles can read nothing from this table. Contributor records mix public-facing
-- profile fields (display name, blurb, recognition, badges, public stats) with
-- data that is or will become private (and, in future phases, contact
-- permission, email, and auth identifiers).
--
-- Before exposing any contributor data publicly, we will design an explicit
-- separation: a public_contributor_profiles view (or equivalent safe
-- projection) that surfaces ONLY approved fields. Email addresses,
-- authentication identifiers, contact permission, and any other private fields
-- must never be exposed through public policies.
-- ---------------------------------------------------------------------------
-- (no policies for contributors in this migration — access stays locked)
