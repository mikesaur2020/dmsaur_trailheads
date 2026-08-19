import { Link } from 'react-router-dom'
import { ArrowRight, UserRound } from 'lucide-react'
import type { Idea } from '../types'
import { StatusPill } from './StatusPill'
import { CategoryBadge } from './CategoryBadge'
import { SignalRow } from './SignalStat'
import { formatDate } from '../lib/format'

/**
 * Responsive idea card. Each card links to that idea's own detail page at
 * /ideas/:slug, which loads the published idea from Supabase.
 */
export function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusPill status={idea.status} />
        <CategoryBadge category={idea.category} />
      </div>

      <h3 className="text-lg font-semibold leading-snug tracking-tight text-text">
        <Link
          to={`/ideas/${idea.slug}`}
          className="after:absolute after:inset-0 focus:outline-none"
          aria-label={`${idea.title} — view idea`}
        >
          <span className="relative">{idea.title}</span>
        </Link>
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-muted">{idea.summary}</p>

      <div className="mt-4 border-t border-line pt-4">
        <SignalRow signals={idea.signals} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <UserRound className="size-3.5" aria-hidden="true" />
          {idea.contributorDisplay}
        </span>
        <span className="tabular-nums">{formatDate(idea.submittedDate)}</span>
      </div>

      <span
        className="pointer-events-none mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        aria-hidden="true"
      >
        View idea
        <ArrowRight className="size-4" />
      </span>
    </article>
  )
}
