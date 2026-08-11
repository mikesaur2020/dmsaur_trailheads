/**
 * Ideas data-access layer (Phase 2B.1 browse + Phase 2B.2 status history).
 *
 * The ONLY place that talks to Supabase for the public Ideas experience. Keeps
 * all database-shape knowledge (snake_case columns, row → domain mapping)
 * isolated here so UI components never see raw column names.
 *
 * Read-only: this module only SELECTs from `public.ideas`,
 * `public.idea_status_events`, and `public.idea_signals`. It never inserts,
 * updates, or deletes, and it never queries `contributors` (private by design —
 * the public-facing name lives on `ideas.contributor_display`).
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
import type {
  CommunitySignal,
  CommunitySignalKey,
  Idea,
  StatusEvent,
} from '../types'
import type { Database } from '../types/database'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { makeSignals, SIGNAL_META, SIGNAL_ORDER } from '../lib/meta'
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

/** Result of loading an idea's community signal counts (Phase 2B.3). */
export interface IdeaSignalsResult {
  signals: CommunitySignal[]
  source: IdeasSource
}

type IdeaRow = Database['public']['Tables']['ideas']['Row']
type StatusEventRow = Database['public']['Tables']['idea_status_events']['Row']
type IdeaSignalRow = Database['public']['Tables']['idea_signals']['Row']

/** Mock status history used only as a dev/fallback source (never production data). */
function mockStatusHistory(): StatusEvent[] {
  return EXAMPLE_IDEA.statusHistory ?? []
}

/** Zero-count community signals (used as the mapIdeaRow default before merge). */
function emptySignals() {
  return makeSignals({
    'have-problem': 0,
    'would-use': 0,
    'would-test': 0,
    'would-pay': 0,
  })
}

/** Mock signal counts used only as a dev/fallback source (never production data). */
function mockSignals(): CommunitySignal[] {
  return EXAMPLE_IDEA.signals
}

/**
 * Build the community-signal array for one idea. Order, labels, and descriptions
 * come from the frontend SIGNAL_ORDER / SIGNAL_META (the DB only provides key +
 * count). Every supported key is present; a missing hosted key renders as 0.
 */
export function signalsFromCounts(
  counts: Partial<Record<CommunitySignalKey, number>>,
): CommunitySignal[] {
  return SIGNAL_ORDER.map((key) => ({
    key,
    label: SIGNAL_META[key].label,
    description: SIGNAL_META[key].description,
    count: counts[key] ?? 0,
  }))
}

/**
 * Group hosted idea_signals rows into `idea_id → { key: count }`. Unknown signal
 * keys (not in SIGNAL_ORDER) are ignored safely, with a dev-only warning.
 */
function groupSignalCounts(
  rows: IdeaSignalRow[],
): Map<string, Partial<Record<CommunitySignalKey, number>>> {
  const byIdea = new Map<string, Partial<Record<CommunitySignalKey, number>>>()
  for (const row of rows) {
    if (!SIGNAL_ORDER.includes(row.key)) {
      if (import.meta.env.DEV) {
        console.warn(`[ideas] Ignoring unrecognized signal key: ${row.key}`)
      }
      continue
    }
    const entry = byIdea.get(row.idea_id) ?? {}
    entry[row.key] = row.count
    byIdea.set(row.idea_id, entry)
  }
  return byIdea
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

    const ideas = (data ?? []).map(mapIdeaRow)

    // Zero ideas → valid empty state; skip the signals query entirely (avoids a
    // malformed empty `.in()`). Do NOT fall back to mock.
    if (ideas.length === 0) {
      return { ideas, source: 'supabase' }
    }

    // ONE batched query for all loaded ideas' signals (no N+1), grouped by id.
    const ids = ideas.map((i) => i.id)
    const { data: signalRows, error: signalError } = await supabase
      .from('idea_signals')
      .select('*')
      .in('idea_id', ids)

    if (signalError) throw signalError

    const countsByIdea = groupSignalCounts(signalRows ?? [])
    const withSignals = ideas.map((idea) => ({
      ...idea,
      signals: signalsFromCounts(countsByIdea.get(idea.id) ?? {}),
    }))

    return { ideas: withSignals, source: 'supabase' }
  } catch (err) {
    // Connection/query failure (ideas or signals) → graceful mock fallback.
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

/**
 * Load an idea's community signal counts by idea id. Read-only on
 * `public.idea_signals`.
 *
 * Semantics (Phase 2B.3):
 *   - not configured   → mock signal counts, source 'mock'
 *   - query fails      → mock signal counts, source 'mock' (dev warning)
 *   - query succeeds   → hosted counts, source 'supabase'. Every supported key is
 *     returned; missing keys are 0, and 0 rows means all-zero. This is NOT a
 *     failure and does NOT fall back to mock.
 */
export async function getIdeaSignals(
  ideaId: string,
): Promise<IdeaSignalsResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { signals: mockSignals(), source: 'mock' }
  }

  try {
    const { data, error } = await supabase
      .from('idea_signals')
      .select('*')
      .eq('idea_id', ideaId)

    if (error) throw error

    const counts = groupSignalCounts(data ?? []).get(ideaId) ?? {}
    return { signals: signalsFromCounts(counts), source: 'supabase' }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(
        '[ideas] getIdeaSignals failed; falling back to mock data.',
        err,
      )
    }
    return { signals: mockSignals(), source: 'mock' }
  }
}
