import { type ReactNode } from 'react'
import {
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  Clock,
  Repeat,
  UserRound,
  Users,
} from 'lucide-react'
import { StatusPill } from './StatusPill'
import { CategoryBadge } from './CategoryBadge'
import { ComingLaterPanel } from './ComingLater'
import { SIGNAL_META, STATUS_META } from '../lib/meta'
import { formatDate } from '../lib/format'
import type { CommunitySignal, Idea, StatusEvent, WillingnessToPay } from '../types'
import type { IdeasSource } from '../services/ideas'

/**
 * Presentational body of an idea detail page: header, problem, story, key facts,
 * community signals, and status history. Extracted from IdeaExample so both the
 * static /ideas/example demo and the dynamic /ideas/:slug page render the exact
 * same layout — driven entirely by the `idea` prop it is given.
 */

const WILLINGNESS_LABEL: Record<WillingnessToPay, string> = {
  no: 'Not likely to pay',
  maybe: 'Might pay, depending on the solution',
  yes: 'Would pay for a good solution',
}

const RECOGNITION_LABEL: Record<string, string> = {
  'full-name': 'Full name',
  'first-name': 'First name only',
  nickname: 'Nickname',
  anonymous: 'Anonymous',
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-brand" aria-hidden="true">
        {icon}
      </span>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm text-text">{children}</dd>
      </div>
    </div>
  )
}

/** Loading placeholder for the status-history timeline. */
function StatusHistorySkeleton() {
  return (
    <ol className="mt-4 space-y-4 border-l border-line pl-6" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[1.65rem] top-1 size-3 rounded-full bg-surface-2 ring-4 ring-bg" />
          <div className="animate-pulse space-y-2">
            <div className="h-5 w-40 rounded-full bg-surface-2" />
            <div className="h-4 w-3/4 rounded bg-surface-2" />
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Stable React key for a status event (hosted id when present; else composite). */
function eventKey(event: StatusEvent, index: number): string {
  return event.id ?? `${event.status}-${event.date}-${index}`
}

export function IdeaDetailView({
  idea,
  events,
  eventsSource,
  signals,
  signalsSource,
  loading,
}: {
  idea: Idea
  events: StatusEvent[]
  eventsSource: IdeasSource
  signals: CommunitySignal[]
  signalsSource: IdeasSource
  loading: boolean
}) {
  // Show the status section while loading, when there are events, or whenever the
  // data came from a successful hosted query (so 0 hosted rows renders the empty
  // state). A mock source with no events hides the section, as before.
  const showHistory = loading || events.length > 0 || eventsSource === 'supabase'

  return (
    <>
      {/* Header */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={idea.status} />
          <CategoryBadge category={idea.category} />
        </div>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          {idea.title}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">{idea.summary}</p>
      </div>

      {/* Problem statement */}
      {idea.problemStatement && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-text">The problem</h2>
          <p className="mt-3 leading-relaxed text-muted">
            {idea.problemStatement}
          </p>
        </section>
      )}

      {/* Contributor story */}
      {idea.contributorStory && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-text">
            The contributor’s story
          </h2>
          <blockquote className="mt-3 rounded-2xl border-l-4 border-brand bg-surface-2/60 p-5 text-muted italic">
            “{idea.contributorStory}”
          </blockquote>
        </section>
      )}

      {/* Key facts */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text">At a glance</h2>
        <dl className="mt-4 grid gap-5 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-2">
          {idea.whoExperiencesIt && (
            <DetailRow icon={<Users className="size-4" />} label="Who experiences it">
              {idea.whoExperiencesIt}
            </DetailRow>
          )}
          {idea.frequency && (
            <DetailRow icon={<Repeat className="size-4" />} label="How often">
              {idea.frequency}
            </DetailRow>
          )}
          {idea.currentWorkaround && (
            <DetailRow icon={<Clock className="size-4" />} label="Current workaround">
              {idea.currentWorkaround}
            </DetailRow>
          )}
          {idea.willingnessToPay && (
            <DetailRow
              icon={<CircleDollarSign className="size-4" />}
              label="Willingness to pay"
            >
              {WILLINGNESS_LABEL[idea.willingnessToPay]}
            </DetailRow>
          )}
          <DetailRow icon={<UserRound className="size-4" />} label="Recognition preference">
            {RECOGNITION_LABEL[idea.recognition]} — shown as “
            {idea.contributorDisplay}”
          </DetailRow>
          <DetailRow icon={<CalendarDays className="size-4" />} label="Submitted">
            {formatDate(idea.submittedDate)}
          </DetailRow>
        </dl>
      </section>

      {/* Community signals — read-only from hosted Supabase */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text">Community signals</h2>
        <p className="mt-1 text-sm text-muted">
          Community signals are read-only for now — voting isn’t enabled yet.
        </p>

        {import.meta.env.DEV && !loading && signalsSource === 'mock' && (
          <p className="mt-1 text-xs text-muted">
            Showing sample signal counts — Supabase isn’t configured or was
            unavailable. This note appears in development only.
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {signals.map((signal) => {
            const meta = SIGNAL_META[signal.key]
            const Icon = meta.icon
            return (
              <div
                key={signal.key}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4"
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl"
                  style={{
                    color: meta.colorVar,
                    backgroundColor: `color-mix(in srgb, ${meta.colorVar} 12%, transparent)`,
                  }}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  {loading ? (
                    <div className="h-5 w-10 animate-pulse rounded bg-surface-2" />
                  ) : (
                    <p className="font-semibold text-text tabular-nums">
                      {signal.count.toLocaleString('en-US')}
                    </p>
                  )}
                  <p className="text-sm text-muted">{meta.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Status history — read-only from hosted Supabase */}
      {showHistory && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-text">Status history</h2>

          {import.meta.env.DEV && !loading && eventsSource === 'mock' && (
            <p className="mt-1 text-xs text-muted">
              Showing sample status history — Supabase isn’t configured or was
              unavailable. This note appears in development only.
            </p>
          )}

          {loading ? (
            <StatusHistorySkeleton />
          ) : events.length > 0 ? (
            <ol className="mt-4 space-y-4 border-l border-line pl-6">
              {events.map((event, index) => (
                <li key={eventKey(event, index)} className="relative">
                  <span
                    className="absolute -left-[1.65rem] top-1 size-3 rounded-full ring-4 ring-bg"
                    style={{
                      backgroundColor: STATUS_META[event.status].colorVar,
                    }}
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={event.status} />
                    <span className="text-xs text-muted tabular-nums">
                      {formatDate(event.date)}
                    </span>
                  </div>
                  {event.note && (
                    <p className="mt-1 text-sm text-muted">{event.note}</p>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-dashed border-line bg-surface-2/40 p-5">
              <CalendarClock
                className="mt-0.5 size-5 shrink-0 text-muted"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-text">No journey updates yet</p>
                <p className="mt-0.5 text-sm text-muted">
                  This idea’s journey will appear here as it progresses.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Coming later placeholders */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <ComingLaterPanel title="Community discussion">
          Contributors and community members will be able to add context,
          comparisons, and encouragement here.
        </ComingLaterPanel>
        <ComingLaterPanel title="AI-assisted analysis">
          A future, clearly-labeled analysis may summarize themes and surface
          related problems. It will never run without explicit approval.
        </ComingLaterPanel>
      </section>
    </>
  )
}
