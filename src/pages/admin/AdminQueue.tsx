import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, Loader2, Search } from 'lucide-react'
import { getPendingQueue, type SubmissionRow } from '../../services/moderation'
import { StatusBadge } from './AdminDashboard'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

function fmt(ts: string): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function AdminQueue() {
  useDocumentTitle('Pending Queue · Moderation')
  const [rows, setRows] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await getPendingQueue()
        if (alive) {
          setRows(data)
          setLoading(false)
        }
      } catch {
        if (alive) {
          setError('Could not load the queue.')
          setLoading(false)
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // Client-side search across display name, email, and problem text.
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((r) =>
      [r.contributor_display, r.contact_email, r.problem_statement]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term)),
    )
  }, [rows, q])

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Pending Queue</h1>
          <p className="mt-1 text-sm text-muted">
            {loading ? 'Loading…' : `${rows.length} pending · newest first`}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, or problem…"
            aria-label="Search pending submissions"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        </div>
      </div>

      {loading ? (
        <p className="mt-8 flex items-center gap-2 text-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading queue…
        </p>
      ) : error ? (
        <p className="mt-8 text-sm font-medium text-red-600">{error}</p>
      ) : rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface-2/40 p-10 text-center">
          <Inbox className="size-8 text-muted" aria-hidden="true" />
          <p className="mt-3 font-medium text-text">Queue is empty</p>
          <p className="mt-1 text-sm text-muted">New submissions will appear here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No submissions match “{q}”.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {filtered.map((s) => (
            <li key={s.id}>
              <Link
                to={`/admin/submission/${s.id}`}
                className="group flex items-start gap-4 p-4 hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text">
                      {s.recognition === 'anonymous'
                        ? 'Anonymous'
                        : s.contributor_display ?? 'Unnamed'}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted group-hover:text-text">
                    {s.problem_statement}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted tabular-nums">
                  {fmt(s.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
