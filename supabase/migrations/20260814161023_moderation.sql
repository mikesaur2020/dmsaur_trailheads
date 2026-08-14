-- DMSaur Trailheads — Phase 3B: moderation portal backend.
--
-- ADDITIVE ONLY. Adds the authorization allowlist, a moderator-only read policy
-- on the private queue, an audit-events table, and two moderator-gated
-- SECURITY DEFINER write functions. It does NOT modify any existing object:
-- publish_submission() is unchanged and stays owner-only; idea_submissions keeps
-- its anon/service_role posture and only GAINS a moderator SELECT path.
--
-- Security model: authorization = membership in public.moderators (checked by
-- public.is_moderator()). Reads are gated by RLS; writes go only through the
-- gated SECURITY DEFINER functions below (no UPDATE/DELETE grant to any Data API
-- role). Every new function uses empty search_path + fully-qualified objects and
-- grants EXECUTE only to authenticated (self-denying for non-moderators). Per the
-- hosted least-privilege convention (docs/ARCHITECTURE.md) new tables REVOKE ALL
-- from the Data API roles, then GRANT only the minimum required.
--
-- Runs in ONE transaction.

begin;

-- ---------------------------------------------------------------------------
-- 1) Moderator allowlist. Locked: no anon/authenticated/service_role grant and
--    no policy. Only the SECURITY DEFINER functions below read it (as owner),
--    and the owner manages rows (a moderator id is inserted manually at deploy).
-- ---------------------------------------------------------------------------
create table public.moderators (
  id         uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.moderators enable row level security;
revoke all on public.moderators from anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2) is_moderator(): is the current authenticated user an allowlisted moderator?
--    SECURITY DEFINER so it can read the locked allowlist on the caller's behalf.
-- ---------------------------------------------------------------------------
create function public.is_moderator()
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
  as $$
    select exists (
      select 1 from public.moderators m where m.id = (select auth.uid())
    )
  $$;
revoke execute on function public.is_moderator() from public;
grant execute on function public.is_moderator() to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Moderators may READ the private submission queue. The authenticated role
--    needs the base SELECT privilege for a policy to apply; the policy then
--    restricts rows to moderators (non-moderators get ZERO rows). anon stays
--    fully denied; service_role SELECT+INSERT is unchanged. Writes still go only
--    through the gated functions below (authenticated gets no INSERT/UPDATE/DELETE).
-- ---------------------------------------------------------------------------
grant select on public.idea_submissions to authenticated;
create policy "Moderators read idea_submissions"
  on public.idea_submissions
  for select
  to authenticated
  using (public.is_moderator());

-- ---------------------------------------------------------------------------
-- 4) Moderation audit events — foundation for audit history / "recent activity".
--    Inserted only from the SECURITY DEFINER functions (owner bypasses RLS);
--    moderators may read. No client insert path.
-- ---------------------------------------------------------------------------
create table public.moderation_events (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid references public.idea_submissions (id) on delete set null,
  action        text not null,           -- e.g. 'published', 'rejected'
  note          text,
  actor         uuid references auth.users (id),
  created_at    timestamptz not null default now()
);
create index moderation_events_created_at_idx
  on public.moderation_events (created_at desc);

alter table public.moderation_events enable row level security;
revoke all on public.moderation_events from anon, authenticated, service_role;
grant select on public.moderation_events to authenticated;  -- gated by the policy below
create policy "Moderators read moderation_events"
  on public.moderation_events
  for select
  to authenticated
  using (public.is_moderator());

-- ---------------------------------------------------------------------------
-- 5) reject_submission: moderator-gated. Sets status=rejected + optional note;
--    NEVER deletes. Logs an audit event.
-- ---------------------------------------------------------------------------
create function public.reject_submission(
  p_submission_id uuid,
  p_note          text default null
)
  returns void
  language plpgsql
  security definer
  set search_path = ''
  as $$
  begin
    if not public.is_moderator() then
      raise exception 'reject_submission: not authorized'
        using errcode = 'insufficient_privilege';
    end if;

    update public.idea_submissions
      set status           = 'rejected',
          rejection_reason = p_note,
          reviewed_at      = now(),
          updated_at       = now()
      where id = p_submission_id
        and status in ('pending', 'under_review');

    if not found then
      raise exception 'reject_submission: submission % not found or not rejectable',
        p_submission_id using errcode = 'invalid_parameter_value';
    end if;

    insert into public.moderation_events (submission_id, action, note, actor)
      values (p_submission_id, 'rejected', p_note, (select auth.uid()));
  end
  $$;
revoke execute on function public.reject_submission(uuid, text) from public;
grant execute on function public.reject_submission(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6) approve_submission: moderator-gated WRAPPER. Marks the submission approved
--    (which publish_submission() requires) then calls the EXISTING publication
--    path unchanged. publish_submission() stays owner-only; this wrapper (owned
--    by the same owner) is the only new caller. Logs an audit event. The UI
--    surfaces this as the "Publish…" action.
-- ---------------------------------------------------------------------------
create function public.approve_submission(
  p_submission_id uuid,
  p_title         text,
  p_summary       text,
  p_category      public.category
)
  returns uuid
  language plpgsql
  security definer
  set search_path = ''
  as $$
  declare
    v_idea_id uuid;
  begin
    if not public.is_moderator() then
      raise exception 'approve_submission: not authorized'
        using errcode = 'insufficient_privilege';
    end if;

    update public.idea_submissions
      set status      = 'approved',
          approved_at = now(),
          reviewed_at = coalesce(reviewed_at, now()),
          updated_at  = now()
      where id = p_submission_id
        and status in ('pending', 'under_review');

    if not found then
      raise exception 'approve_submission: submission % not found or not approvable',
        p_submission_id using errcode = 'invalid_parameter_value';
    end if;

    -- Reuse the existing publication path EXACTLY (recognition/display default to
    -- the submission's stored values inside publish_submission()).
    v_idea_id := public.publish_submission(p_submission_id, p_title, p_summary, p_category);

    insert into public.moderation_events (submission_id, action, note, actor)
      values (p_submission_id, 'published', null, (select auth.uid()));

    return v_idea_id;
  end
  $$;
revoke execute on function public.approve_submission(
  uuid, text, text, public.category
) from public;
grant execute on function public.approve_submission(
  uuid, text, text, public.category
) to authenticated;

commit;
