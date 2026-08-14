import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Clock,
  Inbox,
  Layers,
  Loader2,
  Lightbulb,
  MinusCircle,
  XCircle,
} from 'lucide-react'
import {
  getDashboardStats,
  getHealth,
  getRecentActivity,
  getRecentSubmissions,
  type DashboardStats,
  type HealthReport,
  type HealthState,
  type ModerationEvent,
  type SubmissionRow,
} from '../../services/moderation'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

function fmt(ts: string | null): string {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function StatCard({
  label,
  value,
  icon: Icon,
  to,
  disabledHint,
}: {
  label: string
  value: number
  icon: typeof Inbox
  /** When set, the card links here. */
  to?: string
  /** When set, the card is a non-interactive placeholder with this badge. */
  disabledHint?: string
}) {
  const base = 'rounded-2xl border border-line bg-surface p-5'
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm text-muted">
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </span>
        {disabledHint && (
          <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
            {disabledHint}
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-text">{value}</p>
    </>
  )
  if (to) {
    return (
      <Link
        to={to}
        className={`${base} block transition-colors hover:border-brand hover:bg-brand-soft/30`}
      >
        {inner}
      </Link>
    )
  }
  if (disabledHint) {
    return (
      <div className={`${base} cursor-not-allowed opacity-80`} aria-disabled="true">
        {inner}
      </div>
    )
  }
  return <div className={base}>{inner}</div>
}

function HealthRow({ label, state }: { label: string; state: HealthState }) {
  const map: Record<HealthState, { dot: string; text: string; word: string }> = {
    ok: { dot: 'bg-emerald-500', text: 'text-emerald-600', word: 'Operational' },
    down: { dot: 'bg-red-500', text: 'text-red-600', word: 'Unreachable' },
    unknown: { dot: 'bg-amber-500', text: 'text-amber-600', word: 'Unknown' },
  }
  const s = map[state]
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-text">{label}</span>
      <span className={`flex items-center gap-2 text-sm font-medium ${s.text}`}>
        <span className={`size-2 rounded-full ${s.dot}`} aria-hidden="true" />
        {s.word}
      </span>
    </div>
  )
}

export function AdminDashboard() {
  useDocumentTitle('Dashboard · Moderation')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<SubmissionRow[]>([])
  const [activity, setActivity] = useState<ModerationEvent[]>([])
  const [health, setHealth] = useState<HealthReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [s, r, a] = await Promise.all([
          getDashboardStats(),
          getRecentSubmissions(6),
          getRecentActivity(8),
        ])
        if (!alive) return
        setStats(s)
        setRecent(r)
        setActivity(a)
        setLoading(false)
        // Health is best-effort and can be slower; fetch after the core data.
        const h = await getHealth(s.lastSubmissionAt)
        if (alive) setHealth(h)
      } catch {
        if (alive) {
          setError('Could not load dashboard data.')
          setLoading(false)
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading dashboard…
      </div>
    )
  }

  if (error || !stats) {
    return <p className="text-sm font-medium text-red-600">{error ?? 'No data.'}</p>
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Operational overview of the moderation queue.</p>
        </div>
        <Link
          to="/admin/queue"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
        >
          Open Pending Queue
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total submitted" value={stats.total} icon={Layers} />
        <StatCard label="Pending" value={stats.pending} icon={Inbox} to="/admin/queue" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} />
        <StatCard
          label="Published ideas"
          value={stats.publishedIdeas}
          icon={Lightbulb}
          disabledHint="Soon"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent submissions */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-text">Recent submissions</h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No submissions yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recent.map((s) => (
                <li key={s.id} className="py-3">
                  <Link
                    to={`/admin/submission/${s.id}`}
                    className="group flex items-start justify-between gap-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-text group-hover:text-brand">
                        {s.problem_statement}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {s.recognition === 'anonymous'
                          ? 'Anonymous'
                          : s.contributor_display ?? 'Unnamed'}{' '}
                        · {fmt(s.created_at)}
                      </span>
                    </span>
                    <StatusBadge status={s.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent activity */}
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-text">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No moderation activity yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {activity.map((e) => (
                <li key={e.id} className="flex items-start gap-3 text-sm">
                  {e.action === 'published' ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : e.action === 'rejected' ? (
                    <MinusCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden="true" />
                  ) : (
                    <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                  )}
                  <span className="min-w-0">
                    <span className="text-text">Submission {e.action}</span>
                    <span className="mt-0.5 block text-xs text-muted">{fmt(e.created_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Health */}
      <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-text">Backend health</h2>
        </div>
        {!health ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Checking…
          </p>
        ) : (
          <div className="mt-2 divide-y divide-line">
            <HealthRow label="Database" state={health.database} />
            <HealthRow label="Submission Queue" state={health.submissionQueue} />
            <HealthRow label="Edge Function" state={health.edgeFunction} />
            <HealthRow label="Public Website" state={health.publicWebsite} />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-text">Last submission</span>
              <span className="text-sm font-medium text-muted tabular-nums">
                {fmt(stats.lastSubmissionAt)}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

/** Small status pill reused on the dashboard + queue. */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    under_review: 'bg-blue-100 text-blue-700',
    approved: 'bg-indigo-100 text-indigo-700',
    published: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  }
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
        map[status] ?? 'bg-surface-2 text-muted'
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
