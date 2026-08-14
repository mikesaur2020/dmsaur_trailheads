/**
 * Moderation data-access layer (Phase 3B).
 *
 * The only place the admin portal talks to Supabase. All reads go through the
 * moderator-only RLS SELECT policy; all writes go through the gated
 * SECURITY DEFINER RPCs (reject_submission / approve_submission). approve calls
 * the existing publish_submission() path — there is no second publication path.
 */
import { supabase } from '../lib/supabase'
import type { Category } from '../types'
import type { Database } from '../types/database'

export type SubmissionRow = Database['public']['Tables']['idea_submissions']['Row']
export type ModerationEvent = Database['public']['Tables']['moderation_events']['Row']

function client() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export interface DashboardStats {
  pending: number
  approved: number
  rejected: number
  published: number
  publishedIdeas: number
  total: number
  lastSubmissionAt: string | null
}

/** Counts by submission status + published-ideas count + last submission time. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [subs, ideas] = await Promise.all([
    client().from('idea_submissions').select('status, created_at'),
    client().from('ideas').select('*', { count: 'exact', head: true }),
  ])
  if (subs.error) throw subs.error

  const rows = subs.data ?? []
  const by = (s: string) => rows.filter((r) => r.status === s).length
  const lastSubmissionAt = rows.reduce<string | null>(
    (max, r) => (!max || r.created_at > max ? r.created_at : max),
    null,
  )

  return {
    pending: by('pending'),
    approved: by('approved'),
    rejected: by('rejected'),
    published: by('published'),
    publishedIdeas: ideas.count ?? 0,
    total: rows.length,
    lastSubmissionAt,
  }
}

/** Most recent submissions, any status, newest first. */
export async function getRecentSubmissions(limit = 6): Promise<SubmissionRow[]> {
  const { data, error } = await client()
    .from('idea_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

/** Recent moderation activity (audit foundation), newest first. */
export async function getRecentActivity(limit = 8): Promise<ModerationEvent[]> {
  const { data, error } = await client()
    .from('moderation_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

/** All pending submissions, newest first. */
export async function getPendingQueue(): Promise<SubmissionRow[]> {
  const { data, error } = await client()
    .from('idea_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** A single submission by id (all stored fields). */
export async function getSubmission(id: string): Promise<SubmissionRow | null> {
  const { data, error } = await client()
    .from('idea_submissions')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Reject a submission (status → rejected + optional note). Never deletes. */
export async function rejectSubmission(id: string, note: string | null): Promise<void> {
  const { error } = await client().rpc('reject_submission', {
    p_submission_id: id,
    p_note: note && note.trim() ? note.trim() : null,
  })
  if (error) throw error
}

/**
 * Publish an approved submission via the existing publish_submission() path.
 * Returns the new public idea id.
 */
export async function publishSubmission(
  id: string,
  title: string,
  summary: string,
  category: Category,
): Promise<string> {
  const { data, error } = await client().rpc('approve_submission', {
    p_submission_id: id,
    p_title: title,
    p_summary: summary,
    p_category: category,
  })
  if (error) throw error
  return data as string
}

// --- Backend health ---------------------------------------------------------

export type HealthState = 'ok' | 'down' | 'unknown'

export interface HealthReport {
  database: HealthState
  submissionQueue: HealthState
  edgeFunction: HealthState
  publicWebsite: HealthState
  lastSubmissionAt: string | null
}

async function ping(fn: () => Promise<boolean>): Promise<HealthState> {
  try {
    return (await fn()) ? 'ok' : 'down'
  } catch {
    return 'down'
  }
}

/** Best-effort operational health indicators. */
export async function getHealth(lastSubmissionAt: string | null): Promise<HealthReport> {
  const url = import.meta.env.VITE_SUPABASE_URL

  const database = await ping(async () => {
    const { error } = await client().from('ideas').select('id', { head: true, count: 'exact' })
    return !error
  })
  const submissionQueue = await ping(async () => {
    const { error } = await client()
      .from('idea_submissions')
      .select('id', { head: true, count: 'exact' })
    return !error
  })
  const edgeFunction = url
    ? await ping(async () => {
        const res = await fetch(`${url}/functions/v1/submit-idea`, {
          method: 'OPTIONS',
          headers: { 'Access-Control-Request-Method': 'POST' },
        })
        return res.ok || res.status === 204
      })
    : 'unknown'
  const publicWebsite = await ping(async () => {
    const res = await fetch('https://trailheads.dmsaur.com/', { method: 'HEAD' })
    return res.ok
  })

  return { database, submissionQueue, edgeFunction, publicWebsite, lastSubmissionAt }
}
