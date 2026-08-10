-- DMSaur Trailheads — lock anonymous/authenticated writes on public-read tables
--
-- Supabase hosted projects default-grant INSERT/UPDATE/DELETE to the `anon` and
-- `authenticated` roles on public-schema tables (relying on RLS to restrict).
-- The Phase 1 RLS migration added only a SELECT grant on the three public-read
-- tables and never revoked those default write grants, so anon UPDATE/DELETE
-- returned 204 (0 rows via RLS) rather than a hard permission denial.
--
-- This migration revokes the write privileges so the grant posture matches the
-- SELECT-only intent: anon/authenticated get a hard permission denial on
-- INSERT/UPDATE/DELETE for these tables.
--
-- Scope is deliberately narrow:
--   * SELECT privileges are NOT touched (public read still works).
--   * NO policies are added or changed.
--   * NO new grants are added.
--   * `contributors` is untouched — it already has `revoke all` and no policy,
--     so it remains fully private.

revoke insert, update, delete on
  public.ideas,
  public.idea_signals,
  public.idea_status_events
from anon, authenticated;
