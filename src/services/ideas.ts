/**
 * Ideas data-access layer (Phase 2B.1).
 *
 * The ONLY place that talks to Supabase for the public Ideas browse experience.
 * Keeps all database-shape knowledge (snake_case columns, row → domain mapping)
 * isolated here so UI components never see raw column names.
 *
 * Read-only: this module performs a single SELECT on `public.ideas`. It never
 * inserts, updates, or deletes, and it never queries `contributors` (that table
 * is private by design — the public-facing name lives on `ideas.contributor_display`).
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
import type { Idea } from '../types'
import type { Database } from '../types/database'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { makeSignals } from '../lib/meta'
import { IDEAS as MOCK_IDEAS } from '../data/ideas'

export type IdeasSource = 'supabase' | 'mock'

export interface IdeasResult {
  ideas: Idea[]
  source: IdeasSource
}

type IdeaRow = Database['public']['Tables']['ideas']['Row']

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
