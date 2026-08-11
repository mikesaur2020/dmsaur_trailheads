/**
 * Supabase client (browser, read-only in Phase 2B.1).
 *
 * Created only when both public env vars are present, so a missing/unconfigured
 * project never throws at import time and the app can fall back to mock data.
 *
 * Only the public **publishable** key is ever used here (VITE_SUPABASE_PUBLISHABLE_KEY).
 * It is intentionally browser-visible; Row Level Security and grants are the
 * security boundary. Private keys — the Supabase secret key, the legacy
 * service_role key, the database password, and personal access tokens — must
 * NEVER reach the browser bundle (see docs/ARCHITECTURE.md).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** True when both public Supabase env vars are set. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

/**
 * The typed Supabase client, or `null` when the project is not configured.
 * Nullable on purpose so nothing breaks before the env vars are provided.
 */
export const supabase: SupabaseClient<Database> | null =
  supabaseUrl && supabasePublishableKey
    ? createClient<Database>(supabaseUrl, supabasePublishableKey)
    : null

/**
 * Returns the configured client or throws a clear error. Use this at call sites
 * where a client is required, instead of null-checking everywhere.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.',
    )
  }
  return supabase
}
