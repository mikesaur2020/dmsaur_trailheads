import { NavLink, Navigate, Outlet } from 'react-router-dom'
import {
  BarChart3,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  Lightbulb,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { cn } from '../lib/cn'

interface NavItem {
  to?: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  soon?: boolean
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/queue', label: 'Pending Queue', icon: ListChecks },
  { label: 'Published Ideas', icon: Lightbulb, soon: true },
  { label: 'Contributors', icon: Users, soon: true },
  { label: 'Analytics', icon: BarChart3, soon: true },
  { label: 'Settings', icon: Settings, soon: true },
]

/** Full-height gate/spinner used for loading + auth states. */
function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
        {children}
      </div>
    </div>
  )
}

export function AdminLayout() {
  const { session, isModerator, loading, configured, signOut } = useAuth()
  useDocumentTitle('Moderation')

  if (!configured) {
    return (
      <CenteredCard>
        <ShieldAlert className="mx-auto size-8 text-muted" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-semibold text-text">Admin unavailable</h1>
        <p className="mt-2 text-sm text-muted">
          Supabase is not configured in this environment.
        </p>
      </CenteredCard>
    )
  }

  if (loading) {
    return (
      <CenteredCard>
        <Loader2 className="mx-auto size-8 animate-spin text-brand" aria-hidden="true" />
        <p className="mt-4 text-sm text-muted">Checking your session…</p>
      </CenteredCard>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  if (!isModerator) {
    return (
      <CenteredCard>
        <ShieldAlert className="mx-auto size-8 text-red-600" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-semibold text-text">Not authorized</h1>
        <p className="mt-2 text-sm text-muted">
          This account isn’t on the moderator list. If that’s unexpected, contact
          the administrator.
        </p>
        <button
          type="button"
          onClick={signOut}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-text hover:bg-surface-2"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </button>
      </CenteredCard>
    )
  }

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center gap-2 px-2 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-brand">
            <ShieldAlert className="size-4" aria-hidden="true" />
            Moderation
          </div>
          <nav className="mt-4 flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const Icon = item.icon
              if (item.soon || !item.to) {
                return (
                  <span
                    key={item.label}
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-muted/60"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="size-4" aria-hidden="true" />
                      {item.label}
                    </span>
                    <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                      Soon
                    </span>
                  </span>
                )
              }
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-soft text-brand'
                        : 'text-text hover:bg-surface-2',
                    )
                  }
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
          <div className="mt-4 border-t border-line pt-4">
            <p className="truncate px-3 text-xs text-muted" title={session.user.email ?? ''}>
              {session.user.email}
            </p>
            <button
              type="button"
              onClick={signOut}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text hover:bg-surface-2"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 p-6 sm:p-8">
        <Outlet />
      </main>
    </div>
  )
}
