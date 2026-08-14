/**
 * Core domain types for DMSaur Trailheads.
 *
 * These describe the *shape* of the future idea pipeline so the skeleton's mock
 * data and UI stay honest about what the real product will store. They are the
 * contract that later Supabase/Postgres work should mirror. No runtime behavior
 * lives here — types only.
 */

/** Where an idea sits in the product journey. Plain language first. */
export type IdeaStatus =
  | 'submitted'
  | 'reviewing'
  | 'researching'
  | 'prototyping'
  | 'building'
  | 'beta'
  | 'released'

/** Lifecycle status of a queued submission (moderation pipeline). */
export type SubmissionStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'published'

/** Broad problem domains. Deliberately not app-centric. */
export type Category =
  | 'camping-rv'
  | 'home-utilities'
  | 'travel'
  | 'outdoor-recreation'
  | 'everyday-organization'
  | 'technology'

/**
 * How a contributor chooses to be credited. The product asks people to describe
 * a problem, never to design an app, and lets them control their own visibility.
 */
export type RecognitionPreference =
  | 'full-name'
  | 'first-name'
  | 'nickname'
  | 'anonymous'

/**
 * The four community signals. These are intentionally richer than a single
 * popularity vote — each answers a different real-world question. Persisted
 * counts are a later phase; in the skeleton they are static preview numbers.
 */
export type CommunitySignalKey =
  | 'have-problem'
  | 'would-use'
  | 'would-test'
  | 'would-pay'

export interface CommunitySignal {
  key: CommunitySignalKey
  /** Short human label, e.g. "I have this problem." */
  label: string
  /** One-line explanation of what the signal means. */
  description: string
  /** Preview count for the skeleton. Not live data. */
  count: number
}

/** How willing a contributor is to pay for a solution. */
export type WillingnessToPay = 'no' | 'maybe' | 'yes'

/** A single entry in an idea's status history timeline. */
export interface StatusEvent {
  /** Hosted row id, when the event comes from the database. Mock events omit it. */
  id?: string
  status: IdeaStatus
  /** ISO date (YYYY-MM-DD). */
  date: string
  /** Optional short note about what changed. */
  note?: string
}

/**
 * A contributor's public-facing profile preview. Recognition preference governs
 * how `displayName` should be presented in the UI. Real contact details are
 * never part of the public shape and never appear in the static frontend.
 */
export interface Contributor {
  id: string
  /** Already-resolved display name honoring the recognition preference. */
  displayName: string
  recognition: RecognitionPreference
  /** Short, optional blurb. */
  blurb?: string
  /** Preview gamification — clearly a concept in this phase. */
  xp: number
  badges: string[]
  ideasContributed: number
  joinedDate: string
}

/**
 * A problem-focused idea. Titles describe a problem, frustration, need, or
 * opportunity — not a proposed application.
 */
export interface Idea {
  id: string
  /** Stable URL slug. */
  slug: string
  /** Problem-focused title. */
  title: string
  /** One or two sentence summary of the problem. */
  summary: string
  status: IdeaStatus
  category: Category
  /** How the contributor chose to be shown for this idea. */
  contributorDisplay: string
  recognition: RecognitionPreference
  /** ISO submission date (YYYY-MM-DD). */
  submittedDate: string
  signals: CommunitySignal[]

  /* Extended detail — used on the example detail page. Optional so list cards
     can stay lightweight. */
  problemStatement?: string
  contributorStory?: string
  whoExperiencesIt?: string
  frequency?: string
  currentWorkaround?: string
  willingnessToPay?: WillingnessToPay
  statusHistory?: StatusEvent[]
}

/** Display metadata for a status — label + which token color to use. */
export interface StatusMeta {
  value: IdeaStatus
  label: string
  /** Supporting trail-flavored phrase (used as secondary copy only). */
  trailPhrase: string
  colorVar: string
}

/** Display metadata for a category — label + icon name. */
export interface CategoryMeta {
  value: Category
  label: string
}
