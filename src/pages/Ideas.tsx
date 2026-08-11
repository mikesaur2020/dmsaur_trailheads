import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Container } from '../components/Container'
import { SectionHeading } from '../components/SectionHeading'
import { IdeaCard } from '../components/IdeaCard'
import { EmptyState } from '../components/EmptyState'
import { Notice } from '../components/Notice'
import { Button } from '../components/Button'
import { getIdeas, type IdeasSource } from '../services/ideas'
import { CATEGORY_META, CATEGORY_ORDER, JOURNEY, STATUS_META } from '../lib/meta'
import type { Category, Idea, IdeaStatus } from '../types'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { cn } from '../lib/cn'

type SortKey = 'newest' | 'oldest' | 'signals'

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'signals', label: 'Most community signals' },
]

function totalSignals(idea: Idea): number {
  return idea.signals.reduce((sum, s) => sum + s.count, 0)
}

const selectClasses = cn(
  'w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
)

/** Lightweight placeholder shown while ideas load. Not a redesign — same grid. */
function IdeaCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-24 rounded-full bg-surface-2" />
          <div className="h-5 w-20 rounded-full bg-surface-2" />
        </div>
        <div className="h-5 w-3/4 rounded bg-surface-2" />
        <div className="h-4 w-full rounded bg-surface-2" />
        <div className="h-4 w-5/6 rounded bg-surface-2" />
        <div className="mt-4 h-4 w-1/2 rounded bg-surface-2" />
      </div>
    </div>
  )
}

export function Ideas() {
  useDocumentTitle('Ideas')

  // Data-source state (mock until the async load resolves).
  const [loading, setLoading] = useState(true)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [source, setSource] = useState<IdeasSource>('mock')

  // Filter/sort UI state (unchanged behavior, now over the loaded set).
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<IdeaStatus | 'all'>('all')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('newest')

  useEffect(() => {
    let alive = true
    getIdeas().then((result) => {
      if (!alive) return
      setIdeas(result.ideas)
      setSource(result.source)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = ideas.filter((idea) => {
      if (status !== 'all' && idea.status !== status) return false
      if (category !== 'all' && idea.category !== category) return false
      if (q) {
        const haystack = `${idea.title} ${idea.summary}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'signals') return totalSignals(b) - totalSignals(a)
      const cmp = a.submittedDate.localeCompare(b.submittedDate)
      return sort === 'newest' ? -cmp : cmp
    })
    return sorted
  }, [ideas, query, status, category, sort])

  const hasActiveFilters =
    query.trim() !== '' || status !== 'all' || category !== 'all'

  function resetFilters() {
    setQuery('')
    setStatus('all')
    setCategory('all')
    setSort('newest')
  }

  return (
    <div className="py-14 sm:py-16">
      <Container>
        <SectionHeading eyebrow="Browse" title="Ideas at the trailhead">
          Explore the everyday problems people have shared. Each one is a
          starting point — not a finished product.
        </SectionHeading>

        {/* Dev-only fallback indicator. Never shown in production. */}
        {import.meta.env.DEV && !loading && source === 'mock' && (
          <Notice className="mt-6">
            Showing local sample data — Supabase isn’t configured or was
            unavailable. This notice appears in development only.
          </Notice>
        )}

        {/* Controls */}
        <div className="mt-8 rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label htmlFor="idea-search" className="sr-only">
                Search ideas
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  id="idea-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search problems…"
                  className={cn(selectClasses, 'pl-9')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="status-filter" className="sr-only">
                Filter by status
              </label>
              <select
                id="status-filter"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as IdeaStatus | 'all')
                }
                className={selectClasses}
              >
                <option value="all">All statuses</option>
                {JOURNEY.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category-filter" className="sr-only">
                Filter by category
              </label>
              <select
                id="category-filter"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as Category | 'all')
                }
                className={selectClasses}
              >
                <option value="all">All categories</option>
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_META[c].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-muted">
                Sort
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className={cn(selectClasses, 'w-auto')}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-muted" role="status" aria-live="polite">
              {loading
                ? 'Loading…'
                : `${results.length} ${results.length === 1 ? 'idea' : 'ideas'}`}
            </p>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div
            className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            aria-hidden="true"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <IdeaCardSkeleton key={i} />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        ) : hasActiveFilters ? (
          <div className="mt-8">
            <EmptyState
              title="No ideas match your filters"
              action={
                <Button variant="secondary" onClick={resetFilters}>
                  Clear filters
                </Button>
              }
            >
              Try a different search term or clear the filters.
            </EmptyState>
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState title="No ideas yet">
              New ideas will appear here as they’re shared.
            </EmptyState>
          </div>
        )}
      </Container>
    </div>
  )
}
