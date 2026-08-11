/**
 * Ideas data-access layer (Phase 2B.1 browse + Phase 2B.2 status history).
 *
 * The ONLY place that talks to Supabase for the public Ideas experience. Keeps
 * all database-shape knowledge (snake_case columns, row → domain mapping)
 * isolated here so UI components never see raw column names.
 *
 * Read-only: this module only SELECTs from `public.ideas` and
 * `public.idea_status_events`. It never inserts, updates, or deletes, and it
 * never queries `contributors` or `idea_signals` (contributors is private by
 * design — the public-facing name lives on `ideas.contributor_display`; signals
 * arrive in Phase 2B.3).
 *
 * Data-source behavior:
 *   - Supabase not configured        → mock ideas, source 'mock'
 *   - Supabase query succeeds         → hosted rows, source 'supabase' (even 0 rows)
 *   - Supabase query fails            → mock ideas, source 'mock' (dev-only warning)
 *
 * A successful query that returns ZERO rows is a valid production state (the
 * hosted table is currently empty). It is NOT a failure and does NOT fall back
 * to mock data — the page shows its polished empty state.
 *
 * Community signals are intentionally mapped as zero counts here: the
 * `idea_signals` table is out of scope until Phase 2B.3. Extended detail fields
 * are preserved on the mapped model per the domain type.
 */
import type { Idea, StatusEvent } from '../types'
import type { Database } from '../types/database'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { makeSignals } from '../lib/meta'
import { IDEAS as MOCK_IDEAS, EXAMPLE_IDEA } from '../data/ideas'

export type IdeasSource = 'supabase' | 'mock'

export interface IdeasResult {
  ideas: Idea[]
  source: IdeasSource
}

/** Result of a single-idea lookup by slug (Phase 2B.2). */
export interface IdeaBySlugResult {
  /** Hosted idea when found; `null` on a successful lookup with no matching row. */
  idea: Idea | null
  source: IdeasSource
}

/** Result of loading an idea's status-history events (Phase 2B.2). */
export interface StatusEventsResult {
  events: StatusEvent[]
  source: IdeasSource
}

type IdeaRow = Database['public']['Tables']['ideas']['Row']
type StatusEventRow = Database['public']['Tables']['idea_status_events']['Row']

/** Mock status history used only as a dev/fallback source (never production data). */
function mockStatusHistory(): StatusEvent[] {
  return EXAMPLE_IDEA.statusHistory ?? []
}

/** Zero-count community signals — real counts arrive with Phase 2B.3. */
function emptySignals() {
  return makeSignals({
    'have-problem': 0,
    'would-use': 0,
    'would-test': 0,
    'would-pay': 0,
  })
}

/**
 * Pure mapping from a hosted `public.ideas` row to the Idea domain model.
 * Nullable DB columns become optional (undefined) domain fields.
 */
export function mapIdeaRow(row: IdeaRow): Idea {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    status: row.status,
    category: row.category,
    contributorDisplay: row.contributor_display,
    recognition: row.recognition,
    submittedDate: row.submitted_date,
    signals: emptySignals(),
    // Optional extended detail (preserved from the row; unused by the browse list).
    problemStatement: row.problem_statement ?? undefined,
    contributorStory: row.contributor_story ?? undefined,
    whoExperiencesIt: row.who_experiences_it ?? undefined,
    frequency: row.frequency ?? undefined,
    currentWorkaround: row.current_workaround ?? undefined,
    willingnessToPay: row.willingness_to_pay ?? undefined,
  }
}

/**
 * Load ideas for the browse page. Never throws — always resolves to a usable
 * list plus the source that produced it.
 */
export async function getIdeas(): Promise<IdeasResult> {
  // Not configured → mock (site stays usable; no scary errors).
  if (!isSupabaseConfigured || !supabase) {
    return { ideas: MOCK_IDEAS, source: 'mock' }
  }

  try {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('submitted_date', { ascending: false })

    if (error) throw error

    // Success — including the valid "zero rows" case. Do NOT fall back to mock.
    return { ideas: (data ?? []).map(mapIdeaRow), source: 'supabase' }
  } catch (err) {
    // Connection/query failure → graceful mock fallback, dev-only warning.
    if (import.meta.env.DEV) {
      console.warn(
        '[ideas] Supabase query failed; falling back to mock data.',
        err,
      )
    }
    return { ideas: MOCK_IDEAS, source: 'mock' }
  }
}

/**
 * Look up a single idea by slug. Read-only on `public.ideas`.
 *
 * Semantics (Phase 2B.2):
 *   - not configured        → mock idea for the slug, source 'mock'
 *   - query fails           → mock idea for the slug, source 'mock' (dev warning)
 *   - query succeeds, row    → { idea, source 'supabase' }
 *   - query succeeds, NO row → { idea: null, source 'supabase' }  ← NOT an error,
 *     NOT a mock fallback. A successful "no matching idea" is a real production
 *     state that the caller renders as an empty state.
 */
export async function getIdeaBySlug(slug: string): Promise<IdeaBySlugResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { idea: MOCK_IDEAS.find((i) => i.slug === slug) ?? null, source: 'mock' }
  }

  try {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('slug', slug)
      .maybeSingle() // 0 or 1 row; `null` (no error) when there is no match

    if (error) throw error

    // Success — `data` is the row, or `null` when no idea matches the slug.
    return { idea: data ? mapIdeaRow(data) : null, source: 'supabase' }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(
        '[ideas] getIdeaBySlug failed; falling back to mock data.',
        err,
      )
    }
    return { idea: MOCK_IDEAS.find((i) => i.slug === slug) ?? null, source: 'mock' }
  }
}

/** Pure mapping from a hosted `idea_status_events` row to a StatusEvent. */
export function mapStatusEventRow(row: StatusEventRow): StatusEvent {
  return {
    id: row.id,
    status: row.status,
    date: row.event_date,
    note: row.note ?? undefined,
  }
}

/**
 * Load an idea's status-history events by idea id. Read-only on
 * `public.idea_status_events`, ordered by event_date ascending (then created_at
 * for a deterministic tie-break on the same date).
 *
 * Semantics (Phase 2B.2):
 *   - not configured   → mock status history, source 'mock'
 *   - query fails      → mock status history, source 'mock' (dev warning)
 *   - query succeeds   → hosted events, source 'supabase' (even 0 rows — the
 *     caller renders a real empty state, no mock fallback)
 */
export async function getIdeaStatusEvents(
  ideaId: string,
): Promise<StatusEventsResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { events: mockStatusHistory(), source: 'mock' }
  }

  try {
    const { data, error } = await supabase
      .from('idea_status_events')
      .select('*')
      .eq('idea_id', ideaId)
      .order('event_date', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error

    return { events: (data ?? []).map(mapStatusEventRow), source: 'supabase' }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(
        '[ideas] getIdeaStatusEvents failed; falling back to mock data.',
        err,
      )
    }
    return { events: mockStatusHistory(), source: 'mock' }
  }
}
