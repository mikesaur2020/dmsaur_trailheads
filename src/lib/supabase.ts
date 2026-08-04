/**
 * Supabase client (Phase 1 foundation).
 *
 * IMPORTANT: this module is intentionally NOT imported anywhere in the UI yet.
 * It exists so Phase 2 can wire real queries in one place. Importing it does not
 * change any page — the app still renders mock data in this milestone.
 *
 * The client is created only when both public env vars are present, so a missing
 * or unconfigured project never throws at import time. Only the public anon key
 * is ever used here; private/service-role keys must never reach the browser
 * bundle (see docs/ARCHITECTURE.md).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True when both public Supabase env vars are set. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

/**
 * The typed Supabase client, or `null` when the project is not configured.
 * Nullable on purpose so nothing breaks before a project is linked.
 */
export const supabase: SupabaseClient<Database> | null =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null

/**
 * Returns the configured client or throws a clear error. Use this at Phase 2
 * call sites where a client is required, instead of null-checking everywhere.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.',
    )
  }
  return supabase
}
