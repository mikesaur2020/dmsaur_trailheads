import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, SearchX } from 'lucide-react'
import { Container } from '../components/Container'
import { IdeaDetailView } from '../components/IdeaDetailView'
import {
  getIdeaBySlug,
  getIdeaSignals,
  getIdeaStatusEvents,
  signalsFromCounts,
  type IdeasSource,
} from '../services/ideas'
import type { CommunitySignal, Idea, StatusEvent } from '../types'
import { useDocumentTitle } from '../lib/useDocumentTitle'

type Phase = 'loading' | 'found' | 'notfound'

/**
 * Dynamic idea detail page at /ideas/:slug. Reads the slug from the URL, loads
 * the matching published idea from Supabase via the existing getIdeaBySlug, and
 * renders it through the shared IdeaDetailView (the same layout as the static
 * /ideas/example demo). Unknown slugs render a clean not-found state.
 *
 * Read-only: this touches only public.ideas (+ signals/status events). No schema,
 * RLS, submission, moderation, or publish-pipeline behavior is involved.
 *
 * The inner component is keyed by slug so navigating between ideas remounts it
 * with fresh initial state — no state reset inside the effect is needed.
 */
export function IdeaDetail() {
  const { slug = '' } = useParams<{ slug: string }>()
  return <IdeaDetailInner key={slug} slug={slug} />
}

function IdeaDetailInner({ slug }: { slug: string }) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [idea, setIdea] = useState<Idea | null>(null)
  const [detailLoading, setDetailLoading] = useState(true)
  const [events, setEvents] = useState<StatusEvent[]>([])
  const [eventsSource, setEventsSource] = useState<IdeasSource>('mock')
  const [signals, setSignals] = useState<CommunitySignal[]>(() =>
    signalsFromCounts({}),
  )
  const [signalsSource, setSignalsSource] = useState<IdeasSource>('mock')

  useDocumentTitle(
    idea ? idea.title : phase === 'notfound' ? 'Idea not found' : 'Idea',
  )

  useEffect(() => {
    let alive = true
    ;(async () => {
      // Resolve the published idea for this slug. A successful "no matching idea"
      // (idea: null) is a real production state — render not-found, not an error.
      const result = await getIdeaBySlug(slug)
      if (!alive) return

      if (!result.idea) {
        setPhase('notfound')
        setDetailLoading(false)
        return
      }

      // Found — render the idea immediately; signals/status stream in next.
      setIdea(result.idea)
      setSignals(result.idea.signals)
      setPhase('found')

      const [eventsResult, signalsResult] = await Promise.all([
        getIdeaStatusEvents(result.idea.id),
        getIdeaSignals(result.idea.id),
      ])
      if (!alive) return
      setEvents(eventsResult.events)
      setEventsSource(eventsResult.source)
      setSignals(signalsResult.signals)
      setSignalsSource(signalsResult.source)
      setDetailLoading(false)
    })()

    return () => {
      alive = false
    }
  }, [slug])

  return (
    <div className="py-14 sm:py-16">
      <Container size="narrow">
        <Link
          to="/ideas"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to ideas
        </Link>

        {phase === 'loading' && (
          <div className="mt-8 animate-pulse space-y-4" aria-hidden="true">
            <div className="h-6 w-40 rounded-full bg-surface-2" />
            <div className="h-10 w-3/4 rounded bg-surface-2" />
            <div className="h-5 w-full rounded bg-surface-2" />
            <div className="h-5 w-5/6 rounded bg-surface-2" />
          </div>
        )}

        {phase === 'notfound' && (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface-2/40 p-10 text-center">
            <SearchX className="size-8 text-muted" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-text">Idea not found</h1>
            <p className="max-w-md text-sm text-muted">
              We couldn’t find a published idea at this address. It may have been
              removed, or the link may be incorrect.
            </p>
            <Link
              to="/ideas"
              className="mt-1 text-sm font-medium text-brand hover:text-brand-strong"
            >
              Browse all ideas
            </Link>
          </div>
        )}

        {phase === 'found' && idea && (
          <IdeaDetailView
            idea={idea}
            events={events}
            eventsSource={eventsSource}
            signals={signals}
            signalsSource={signalsSource}
            loading={detailLoading}
          />
        )}
      </Container>
    </div>
  )
}
