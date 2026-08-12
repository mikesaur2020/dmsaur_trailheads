-- DMSaur Trailheads — Phase 3A.1: protected idea-submission queue (write path).
--
-- ADDITIVE ONLY. This migration creates a new enum, a private submission queue
-- table, and a hardened SECURITY DEFINER publish function. It does NOT alter
-- ideas / idea_signals / idea_status_events / contributors, nor any existing
-- policy or grant. The public read path is entirely unchanged.
--
-- Write architecture:
--   Browser --> `submit-idea` Edge Function (server-side service_role key)
--           --> public.idea_submissions
-- The public browser never writes this table. RLS is enabled with NO
-- anon/authenticated policy (double-locked, exactly like contributors); only
-- service_role receives SELECT + INSERT.
--
-- Publication (creating a public idea from a submission) is a moderator-only
-- action performed by the table owner (postgres) from the Supabase Dashboard,
-- via public.publish_submission(). EXECUTE on that function is revoked from
-- PUBLIC, anon, authenticated, AND service_role — so no Data API role, including
-- the public submit path, can publish. A deliberate moderator execution path
-- arrives in Phase 3B.
--
-- The whole migration runs in ONE transaction, so the SECURITY DEFINER function
-- never exists (in any committed, externally-visible state) with PostgreSQL's
-- default PUBLIC execute privilege: the CREATE and the REVOKE commit together.

begin;

-- ---------------------------------------------------------------------------
-- 1) Submission lifecycle status.
--    'needs_clarification' is intentionally NOT included yet — it arrives with
--    the contributor/contact workflow (Phase 3C).
-- ---------------------------------------------------------------------------
create type public.submission_status as enum (
  'pending',       -- just submitted (server-forced on insert)
  'under_review',  -- a moderator has opened it (optional to use)
  'approved',      -- accepted, not yet public
  'rejected',      -- declined; retained, never public
  'published'      -- a public ideas row now exists; published_idea_id is set
);

-- ---------------------------------------------------------------------------
-- 2) Private submission queue.
--    Problem content mirrors the public wizard. contact_email is PRIVATE and
--    never leaves this table (it is never copied into public.ideas).
-- ---------------------------------------------------------------------------
create table public.idea_submissions (
  id                  uuid primary key default gen_random_uuid(),
  status              public.submission_status not null default 'pending',

  -- Problem-focused content (mirrors the public wizard).
  problem_statement   text not null,
  contributor_story   text,
  who_experiences_it  text,
  frequency           text,
  current_workaround  text,
  willingness_to_pay  public.willingness_to_pay,

  -- Recognition + PRIVATE contact.
  recognition         public.recognition_preference not null,
  contributor_display text,
  contact_consent     boolean not null default false,
  contact_email       text,

  -- Moderation (private).
  moderator_notes     text,
  rejection_reason    text,
  published_idea_id   uuid references public.ideas (id) on delete set null,

  -- Idempotency for safe retries (uuid per wizard session).
  idempotency_key     uuid not null unique,

  -- Lifecycle timestamps. Present so a future retention/purge policy can be
  -- added cleanly, without assuming permanent retention here.
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  reviewed_at         timestamptz,
  approved_at         timestamptz,
  published_at        timestamptz,

  -- Content bounds (mirrored server-side in the Edge Function; the DB is the
  -- backstop, not the only line of defense).
  constraint idea_submissions_problem_len
    check (char_length(problem_statement) between 12 and 4000),
  constraint idea_submissions_story_len
    check (contributor_story is null or char_length(contributor_story) <= 4000),
  constraint idea_submissions_who_len
    check (who_experiences_it is null or char_length(who_experiences_it) <= 2000),
  constraint idea_submissions_workaround_len
    check (current_workaround is null or char_length(current_workaround) <= 2000),
  constraint idea_submissions_display_len
    check (contributor_display is null or char_length(contributor_display) <= 80),
  constraint idea_submissions_frequency_vals
    check (frequency is null
           or frequency in ('rarely', 'occasionally', 'often', 'constantly')),

  -- A display name is required unless the submitter chose to stay anonymous.
  constraint idea_submissions_display_required
    check (recognition = 'anonymous' or contributor_display is not null),

  -- Email is only stored with explicit consent, and only in a plausible shape.
  constraint idea_submissions_email_requires_consent
    check (contact_email is null or contact_consent),
  constraint idea_submissions_email_shape
    check (contact_email is null
           or contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

-- ---------------------------------------------------------------------------
-- 3) Indexes for the moderator queue views (idempotency_key is already unique).
-- ---------------------------------------------------------------------------
create index idea_submissions_status_idx     on public.idea_submissions (status);
create index idea_submissions_created_at_idx on public.idea_submissions (created_at desc);
create index idea_submissions_published_idx  on public.idea_submissions (published_idea_id);

-- ---------------------------------------------------------------------------
-- 4) Keep updated_at fresh (reuses the shared trigger fn from the initial schema).
-- ---------------------------------------------------------------------------
create trigger idea_submissions_set_updated_at
  before update on public.idea_submissions
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5) RLS + grants.
--    RLS enabled, NO anon/authenticated policy → double-locked like contributors.
--    Only the server-side service_role (used by the Edge Function) may read/insert.
--    New tables are NOT auto-exposed to the Data API roles under this project's
--    config, so the grant to service_role is required for the function to insert.
-- ---------------------------------------------------------------------------
alter table public.idea_submissions enable row level security;

revoke all on public.idea_submissions from anon, authenticated;
grant select, insert on public.idea_submissions to service_role;
-- Deliberately NO update/delete grant to service_role: moderation happens via
-- the Dashboard owner (postgres) in the Phase 3A MVP.

-- ---------------------------------------------------------------------------
-- 6) Atomic publish: approved submission → public idea + initial status event.
--    Hardened SECURITY DEFINER: empty search_path, fully-qualified objects,
--    state-validated, idempotent-safe, single transaction (function body).
-- ---------------------------------------------------------------------------
create function public.publish_submission(
  p_submission_id       uuid,
  p_title               text,
  p_summary             text,
  p_category            public.category,
  p_status              public.idea_status            default 'submitted',
  p_contributor_display text                          default null,
  p_recognition         public.recognition_preference default null,
  p_submitted_date      date                          default current_date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub       public.idea_submissions;
  v_base_slug text;
  v_slug      text;
  v_n         integer := 1;
  v_idea_id   uuid;
begin
  -- Lock the submission row and validate its state before any write.
  select * into v_sub
  from public.idea_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'publish_submission: submission % not found', p_submission_id
      using errcode = 'no_data_found';
  end if;

  if v_sub.status <> 'approved' then
    raise exception 'publish_submission: submission % is % (must be approved)',
      p_submission_id, v_sub.status
      using errcode = 'invalid_parameter_value';
  end if;

  if v_sub.published_idea_id is not null then
    raise exception 'publish_submission: submission % already published (idea %)',
      p_submission_id, v_sub.published_idea_id
      using errcode = 'unique_violation';
  end if;

  -- Build a URL-safe slug from the moderator-provided title, then de-collide.
  v_base_slug := trim(both '-' from
    regexp_replace(lower(coalesce(p_title, '')), '[^a-z0-9]+', '-', 'g'));
  if v_base_slug = '' then
    v_base_slug := 'idea';
  end if;
  v_base_slug := left(v_base_slug, 60);

  v_slug := v_base_slug;
  while exists (select 1 from public.ideas where slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base_slug || '-' || v_n;
  end loop;

  -- Create the public idea. Public fields (title/summary/category/status) are
  -- moderator-finalized; problem content is copied from the submission;
  -- recognition/display default to the submitter's stored choice.
  insert into public.ideas (
    slug, title, summary, status, category,
    contributor_display, recognition, submitted_date,
    problem_statement, contributor_story, who_experiences_it,
    frequency, current_workaround, willingness_to_pay
  )
  values (
    v_slug, p_title, p_summary, p_status, p_category,
    coalesce(p_contributor_display, v_sub.contributor_display, 'Anonymous'),
    coalesce(p_recognition, v_sub.recognition),
    p_submitted_date,
    v_sub.problem_statement, v_sub.contributor_story, v_sub.who_experiences_it,
    v_sub.frequency, v_sub.current_workaround, v_sub.willingness_to_pay
  )
  returning id into v_idea_id;

  -- Seed the status-history timeline.
  insert into public.idea_status_events (idea_id, status, event_date, note)
  values (v_idea_id, p_status, p_submitted_date, 'Published from submission.');

  -- Mark the submission published and link it to the new idea.
  update public.idea_submissions
  set status            = 'published',
      published_idea_id = v_idea_id,
      published_at      = now(),
      updated_at        = now()
  where id = p_submission_id;

  return v_idea_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7) Privilege separation. Revoke EXECUTE from every Data API role (and PUBLIC),
--    in the SAME transaction as the CREATE above, so the default PUBLIC execute
--    grant never persists in a committed state. In the Phase 3A MVP the owner
--    (postgres) executes this from the Supabase Dashboard; Phase 3B introduces a
--    dedicated moderator execution path.
-- ---------------------------------------------------------------------------
revoke execute on function public.publish_submission(
  uuid, text, text, public.category, public.idea_status,
  text, public.recognition_preference, date
) from public, anon, authenticated, service_role;

commit;
