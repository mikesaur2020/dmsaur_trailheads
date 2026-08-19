import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Container } from '../components/Container'
import { Notice } from '../components/Notice'
import { IdeaDetailView } from '../components/IdeaDetailView'
import { EXAMPLE_IDEA } from '../data/ideas'
import {
  getIdeaBySlug,
  getIdeaSignals,
  getIdeaStatusEvents,
  signalsFromCounts,
  type IdeasSource,
} from '../services/ideas'
import type { CommunitySignal, StatusEvent } from '../types'
import { useDocumentTitle } from '../lib/useDocumentTitle'

/** The slug this fixed example route represents. */
const EXAMPLE_SLUG = 'example'

/**
 * The single, static example detail page at /ideas/example. It renders the mock
 * EXAMPLE_IDEA through the shared IdeaDetailView; only the status-history
 * (Phase 2B.2) and community-signals (Phase 2B.3) sections are connected to
 * hosted Supabase. The real, per-idea page lives at /ideas/:slug (IdeaDetail).
 */
export function IdeaExample() {
  const idea = EXAMPLE_IDEA
  useDocumentTitle(idea.title)

  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<StatusEvent[]>([])
  const [eventsSource, setEventsSource] = useState<IdeasSource>('mock')
  const [signals, setSignals] = useState<CommunitySignal[]>(() =>
    signalsFromCounts({}),
  )
  const [signalsSource, setSignalsSource] = useState<IdeasSource>('mock')

  useEffect(() => {
    // Runs once on mount; loading starts true from useState.
    let alive = true
    ;(async () => {
      // Resolve the hosted idea for this slug to obtain its id.
      const ideaResult = await getIdeaBySlug(EXAMPLE_SLUG)
      if (!alive) return

      // Config/lookup failure → mock status history + mock signals (page usable).
      if (ideaResult.source === 'mock') {
        setEvents(EXAMPLE_IDEA.statusHistory ?? [])
        setEventsSource('mock')
        setSignals(EXAMPLE_IDEA.signals)
        setSignalsSource('mock')
        setLoading(false)
        return
      }

      // Successful lookup, no matching hosted idea → real empty status + all-zero
      // signals (NOT mock).
      if (!ideaResult.idea) {
        setEvents([])
        setEventsSource('supabase')
        setSignals(signalsFromCounts({}))
        setSignalsSource('supabase')
        setLoading(false)
        return
      }

      // Matching hosted idea → load status events + signals in parallel.
      const [eventsResult, signalsResult] = await Promise.all([
        getIdeaStatusEvents(ideaResult.idea.id),
        getIdeaSignals(ideaResult.idea.id),
      ])
      if (!alive) return
      setEvents(eventsResult.events)
      setEventsSource(eventsResult.source)
      setSignals(signalsResult.signals)
      setSignalsSource(signalsResult.source)
      setLoading(false)
    })()

    return () => {
      alive = false
    }
  }, [])

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

        <Notice className="mt-6">
          This is a single, static example of a future idea detail page. It shows
          the shape of what contributors and the community will see. Nothing on
          this page is operational.
        </Notice>

        <IdeaDetailView
          idea={idea}
          events={events}
          eventsSource={eventsSource}
          signals={signals}
          signalsSource={signalsSource}
          loading={loading}
        />
      </Container>
    </div>
  )
}
