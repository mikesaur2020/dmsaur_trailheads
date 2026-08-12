-- DMSaur Trailheads — Phase 3A.1 follow-up: normalize service_role privileges
-- on public.idea_submissions to the reviewed least-privilege design.
--
-- WHY: hosted Supabase carries project-wide default privileges
--   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
--     GRANT ALL ON TABLES TO service_role (also anon, authenticated)
-- so every new public table is auto-granted ALL to service_role at creation.
-- The prior migration's `grant select, insert ... to service_role` was a
-- redundant subset of that ALL, so on hosted service_role retained UPDATE /
-- DELETE / TRUNCATE / REFERENCES / TRIGGER on idea_submissions — broader than
-- intended. (The local stack lacks those default privileges, which is why local
-- tests showed the narrower grant.)
--
-- This migration makes the ACL explicit and idempotent: revoke everything, then
-- grant back only SELECT + INSERT. It is additive and touches ONLY this table's
-- service_role grants. It does NOT alter Supabase's project-wide default
-- privileges, and does NOT change anon/authenticated (already no access) or the
-- publish_submission() EXECUTE lock.
--
-- CONVENTION (see docs/ARCHITECTURE.md): because hosted public-schema default
-- privileges may auto-grant broad permissions, every security-sensitive
-- migration must explicitly REVOKE ALL from the applicable Data API role(s) and
-- then GRANT only the minimum privileges required.

begin;

-- service_role: reset to exactly SELECT + INSERT (deny UPDATE/DELETE/TRUNCATE/
-- REFERENCES/TRIGGER).
revoke all on public.idea_submissions from service_role;
grant select, insert on public.idea_submissions to service_role;

commit;
