-- DMSaur Trailheads — initial schema (Phase 1 foundation)
--
-- Mirrors the domain types in src/types/index.ts. This migration creates the
-- structure only; Row Level Security is enabled in the following migration.
--
-- NOTE ON COMMUNITY SIGNALS: the idea_signals table below is a COUNT-BASED model
-- carried over from the Phase 0 mock data. It is NOT the final voting model.
-- Before real community voting is enabled, signals should be redesigned as
-- individual contributor/visitor signal records (one row per person per signal)
-- with appropriate uniqueness constraints and RLS, and totals derived through a
-- query or a safe aggregate view. That redesign is intentionally out of scope
-- for this milestone.

-- ---------------------------------------------------------------------------
-- Enums — values match the TypeScript unions in src/types/index.ts exactly.
-- ---------------------------------------------------------------------------
create type idea_status as enum (
  'submitted',
  'reviewing',
  'researching',
  'prototyping',
  'building',
  'beta',
  'released'
);

create type category as enum (
  'camping-rv',
  'home-utilities',
  'travel',
  'outdoor-recreation',
  'everyday-organization',
  'technology'
);

create type recognition_preference as enum (
  'full-name',
  'first-name',
  'nickname',
  'anonymous'
);

create type willingness_to_pay as enum (
  'no',
  'maybe',
  'yes'
);

create type community_signal_key as enum (
  'have-problem',
  'would-use',
  'would-test',
  'would-pay'
);

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at fresh on row updates.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- contributors
--
-- Mirrors the Contributor type. This table holds contributor profile data and
-- is intentionally NOT publicly readable yet (see the RLS migration). It will
-- later be split into private contributor identity vs. a safe public projection
-- (e.g. a public_contributor_profiles view) exposing only approved fields such
-- as display name, public blurb, recognition preference, badges, and public
-- statistics. Email, auth identifiers, contact permission, and any other
-- private fields must never be exposed through public policies.
-- ---------------------------------------------------------------------------
create table public.contributors (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  recognition recognition_preference not null,
  blurb text,
  xp integer not null default 0,
  badges text[] not null default '{}',
  ideas_contributed integer not null default 0,
  joined_date date not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ideas
--
-- Mirrors the Idea type. contributor_display + recognition are kept denormalized
-- here to match the current type shape. A future contributor_id foreign key is a
-- planned Phase 2 normalization and is deliberately not added yet.
-- ---------------------------------------------------------------------------
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  status idea_status not null,
  category category not null,
  contributor_display text not null,
  recognition recognition_preference not null,
  submitted_date date not null,
  -- Extended detail (optional; used by the example detail page).
  problem_statement text,
  contributor_story text,
  who_experiences_it text,
  frequency text,
  current_workaround text,
  willingness_to_pay willingness_to_pay,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ideas_status_idx on public.ideas (status);
create index ideas_category_idx on public.ideas (category);

create trigger ideas_set_updated_at
  before update on public.ideas
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- idea_signals — COUNT-BASED preview model (not final; see header note).
--
-- One row per (idea, signal key) holding an aggregate count. Only the key and
-- count are stored; the human label/description live in the frontend metadata
-- (src/lib/meta.ts), keeping data separate from presentation.
-- ---------------------------------------------------------------------------
create table public.idea_signals (
  idea_id uuid not null references public.ideas (id) on delete cascade,
  key community_signal_key not null,
  count integer not null default 0 check (count >= 0),
  primary key (idea_id, key)
);

-- ---------------------------------------------------------------------------
-- idea_status_events — mirrors StatusEvent; the status-history timeline.
-- ---------------------------------------------------------------------------
create table public.idea_status_events (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  status idea_status not null,
  event_date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index idea_status_events_idea_id_idx on public.idea_status_events (idea_id);
