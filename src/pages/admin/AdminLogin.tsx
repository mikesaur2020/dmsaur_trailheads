import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2, LogIn, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

export function AdminLogin() {
  useDocumentTitle('Moderator sign in')
  const { session, isModerator, loading, configured, signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Already signed in as a moderator → go to the dashboard.
  if (!loading && session && isModerator) {
    return <Navigate to="/admin" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    const { error: err } = await signIn(email.trim(), password)
    setSubmitting(false)
    if (err) setError('Sign-in failed. Check your email and password.')
    // On success, the auth state updates and this component redirects above.
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-brand">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Moderation
        </div>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-text">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-muted">
          Administrator access only.
        </p>

        {session && !isModerator && !loading && (
          <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
            You’re signed in, but this account isn’t a moderator.
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-text placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-text placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
              {error}
            </p>
          )}
          {!configured && (
            <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
              Supabase is not configured in this environment.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !configured}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              <>
                <LogIn className="size-4" aria-hidden="true" />
                Sign in
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
