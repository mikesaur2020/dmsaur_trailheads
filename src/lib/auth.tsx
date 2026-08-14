/**
 * Admin auth context for the moderation portal.
 *
 * Wraps the /admin subtree. Exposes the Supabase Auth session, whether the
 * signed-in user is an allowlisted moderator (via the is_moderator() RPC), and
 * sign-in/out helpers. This is UX state only — the real security boundary is
 * RLS + is_moderator() in the database. A non-moderator session can render the
 * shell but can read/do nothing.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthState {
  session: Session | null
  isModerator: boolean
  /** True until the initial session + moderator check resolves. */
  loading: boolean
  /** Whether Supabase is configured at all. */
  configured: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isModerator, setIsModerator] = useState(false)
  // Loading only matters while we resolve the initial session; if Supabase isn't
  // configured there's nothing to resolve, so start not-loading.
  const [loading, setLoading] = useState(() => Boolean(supabase))

  const refreshModerator = useCallback(async (s: Session | null) => {
    if (!supabase || !s) {
      setIsModerator(false)
      return
    }
    const { data, error } = await supabase.rpc('is_moderator')
    setIsModerator(!error && data === true)
  }, [])

  useEffect(() => {
    if (!supabase) return // nothing to resolve; loading already false
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await refreshModerator(data.session)
      if (active) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!active) return
      setSession(s)
      await refreshModerator(s)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [refreshModerator])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Sign-in is not configured.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        isModerator,
        loading,
        configured: Boolean(supabase),
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- provider + hook share one module (context)
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
