/// <reference types="vite/client" />

/**
 * Typed environment variables exposed to the client bundle. Only VITE_-prefixed
 * values are available in the browser. Keep private/service-role keys OUT of
 * anything VITE_-prefixed (see docs/ARCHITECTURE.md).
 */
interface ImportMetaEnv {
  /** Public Supabase project URL (safe to expose). */
  readonly VITE_SUPABASE_URL?: string
  /** Public Supabase publishable key (safe to expose; constrained by RLS/grants). */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  /** Optional base-path override for the build (see vite.config.ts). */
  readonly VITE_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
