import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Rocket, XCircle } from 'lucide-react'
import {
  getSubmission,
  publishSubmission,
  rejectSubmission,
  type SubmissionRow,
} from '../../services/moderation'
import { CATEGORY_META } from '../../lib/meta'
import type { Category } from '../../types'
import { StatusBadge } from './AdminDashboard'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

const RECOGNITION_LABEL: Record<string, string> = {
  'full-name': 'Full name',
  'first-name': 'First name only',
  nickname: 'Nickname',
  anonymous: 'Anonymous',
}
const WILLINGNESS_LABEL: Record<string, string> = {
  no: 'Not likely to pay',
  maybe: 'Might pay',
  yes: 'Would pay',
}

function fmt(ts: string | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-line py-4 first:border-t-0 first:pt-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-text">{children || <span className="italic text-muted/70">—</span>}</dd>
    </div>
  )
}

export function AdminSubmission() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  useDocumentTitle('Review · Moderation')

  const [sub, setSub] = useState<SubmissionRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showPublish, setShowPublish] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await getSubmission(id)
        if (alive) {
          setSub(data)
          setLoading(false)
        }
      } catch {
        if (alive) {
          setError('Could not load the submission.')
          setLoading(false)
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  const actionable = sub && (sub.status === 'pending' || sub.status === 'under_review')

  async function doReject(note: string) {
    if (!sub || busy) return
    setBusy(true)
    setActionError(null)
    try {
      await rejectSubmission(sub.id, note)
      navigate('/admin/queue')
    } catch {
      setActionError('Reject failed. Please try again.')
      setBusy(false)
      setShowReject(false)
    }
  }

  async function onPublish(title: string, summary: string, category: Category) {
    if (!sub || busy) return
    setBusy(true)
    setActionError(null)
    try {
      await publishSubmission(sub.id, title, summary, category)
      navigate('/admin/queue')
    } catch {
      setActionError('Publish failed. Please try again.')
      setBusy(false)
      setShowPublish(false)
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading submission…
      </p>
    )
  }
  if (error || !sub) {
    return (
      <div>
        <BackLink />
        <p className="mt-4 text-sm font-medium text-red-600">{error ?? 'Submission not found.'}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-text">Submission review</h1>
        <StatusBadge status={sub.status} />
      </div>

      <dl className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <Field label="Problem statement">{sub.problem_statement}</Field>
        <Field label="Contributor story">{sub.contributor_story}</Field>
        <Field label="Who experiences it">{sub.who_experiences_it}</Field>
        <Field label="Frequency">{sub.frequency}</Field>
        <Field label="Current workaround">{sub.current_workaround}</Field>
        <Field label="Willingness to pay">
          {sub.willingness_to_pay ? WILLINGNESS_LABEL[sub.willingness_to_pay] : ''}
        </Field>
        <Field label="Recognition">{RECOGNITION_LABEL[sub.recognition] ?? sub.recognition}</Field>
        <Field label="Display name">
          {sub.recognition === 'anonymous' ? 'Anonymous' : sub.contributor_display}
        </Field>
        <Field label="Contact email">{sub.contact_email}</Field>
        <Field label="Contact consent">{sub.contact_consent ? 'Yes' : 'No'}</Field>
        <Field label="Created">{fmt(sub.created_at)}</Field>
        <Field label="Current status">{sub.status.replace('_', ' ')}</Field>
        {sub.rejection_reason && <Field label="Rejection note">{sub.rejection_reason}</Field>}
        {sub.published_idea_id && (
          <Field label="Published idea">
            <Link to="/ideas" className="text-brand hover:underline">
              View in Ideas
            </Link>
          </Field>
        )}
      </dl>

      {actionError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
          {actionError}
        </p>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/queue"
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium text-text hover:bg-surface-2"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Queue
        </Link>

        {actionable ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowReject(true)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              <XCircle className="size-4" aria-hidden="true" />
              Reject
            </button>
            <button
              type="button"
              onClick={() => setShowPublish(true)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
            >
              <Rocket className="size-4" aria-hidden="true" />
              Review &amp; Publish
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted">
            This submission is <span className="font-medium">{sub.status.replace('_', ' ')}</span> — no actions available.
          </p>
        )}
      </div>

      {showPublish && (
        <PublishDialog
          submission={sub}
          busy={busy}
          onCancel={() => setShowPublish(false)}
          onConfirm={onPublish}
        />
      )}
      {showReject && (
        <RejectDialog busy={busy} onCancel={() => setShowReject(false)} onConfirm={doReject} />
      )}
    </div>
  )
}

/** Small reject form with an optional moderator note. */
function RejectDialog({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean
  onCancel: () => void
  onConfirm: (note: string) => void
}) {
  const [note, setNote] = useState('')
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-title"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!busy) onConfirm(note.trim())
        }}
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lg"
      >
        <h2 id="reject-title" className="text-lg font-semibold text-text">
          Reject submission
        </h2>
        <p className="mt-1 text-sm text-muted">
          The submission is kept (never deleted) and marked rejected. You can add
          an optional note.
        </p>
        <div className="mt-4">
          <label htmlFor="reject-note" className="block text-sm font-medium text-text">
            Note <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="reject-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Why is this being rejected?"
            className="mt-1.5 w-full resize-y rounded-xl border border-line bg-surface px-4 py-2.5 text-text placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-text hover:bg-surface-2 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Rejecting…
              </>
            ) : (
              <>
                <XCircle className="size-4" aria-hidden="true" />
                Reject
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/admin/queue"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Pending Queue
    </Link>
  )
}

/** Lightweight publish form: Title + Summary + Category → publish_submission(). */
function PublishDialog({
  submission,
  busy,
  onCancel,
  onConfirm,
}: {
  submission: SubmissionRow
  busy: boolean
  onCancel: () => void
  onConfirm: (title: string, summary: string, category: Category) => void
}) {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState(submission.problem_statement.slice(0, 200))
  const [category, setCategory] = useState<Category>('technology')
  // Tags: captured in the UI now, but there is no storage location for them yet
  // (the schema is intentionally unchanged in Phase 3B). Persistence lands in a
  // future phase — likely a `tags text[]` column on `ideas` or a join table — at
  // which point this parsed array is passed through to the publish call.
  const [tags, setTags] = useState('')
  const valid = title.trim().length > 0 && summary.trim().length > 0

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid || busy) return
    // `tags` is intentionally not persisted yet (no storage location; see above).
    // A future phase will parse `tags` into an array and pass it through here.
    onConfirm(title.trim(), summary.trim(), category)
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-title"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-lg"
      >
        <h2 id="publish-title" className="text-lg font-semibold text-text">
          Publish idea
        </h2>
        <p className="mt-1 text-sm text-muted">
          Finalize the public title, summary, and category. This publishes the idea.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="p-title" className="block text-sm font-medium text-text">
              Title
            </label>
            <input
              id="p-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="A short, problem-focused title"
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-text placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </div>
          <div>
            <label htmlFor="p-summary" className="block text-sm font-medium text-text">
              Summary
            </label>
            <textarea
              id="p-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              maxLength={400}
              className="mt-1.5 w-full resize-y rounded-xl border border-line bg-surface px-4 py-2.5 text-text placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </div>
          <div>
            <label htmlFor="p-category" className="block text-sm font-medium text-text">
              Category
            </label>
            <select
              id="p-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="p-tags" className="block text-sm font-medium text-text">
              Tags <span className="font-normal text-muted">(optional, comma-separated)</span>
            </label>
            <input
              id="p-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. water, off-grid, gauges"
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-text placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            <p className="mt-1.5 text-xs text-muted">
              Not stored yet — reserved for a future release.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-text hover:bg-surface-2 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!valid || busy}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Publishing…
              </>
            ) : (
              <>
                <Rocket className="size-4" aria-hidden="true" />
                Publish Idea
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
