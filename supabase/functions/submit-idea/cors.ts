// CORS policy for the submit-idea endpoint.
//
// CORS is a BROWSER policy, not authentication — it governs which browser origins
// may read a response, not who may call the endpoint (curl/server callers ignore
// it). The real security boundary is Turnstile + server-side validation; the
// handler additionally rejects a present-but-non-allowlisted Origin with 403.
//
// This module is pure and side-effect-free so the policy can be unit-tested
// directly (the local `functions serve` relay rewrites preflight CORS to `*`,
// so integration tests cannot faithfully verify header echo — these can).

export const ALLOWED_ORIGINS = new Set<string>([
  'https://trailheads.dmsaur.com', // production
  'http://localhost:5173', // Vite dev
  'http://localhost:5175', // Vite dev (alt port)
  'http://localhost:3000', // generic local
])

export function isAllowedOrigin(origin: string | null): boolean {
  return !!origin && ALLOWED_ORIGINS.has(origin)
}

/**
 * Response CORS headers. For an allowlisted origin the ACAO echoes that exact
 * origin (NEVER a wildcard); other origins receive no ACAO at all.
 */
export function corsHeaders(origin: string | null): Record<string, string> {
  const h: Record<string, string> = {
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  }
  if (isAllowedOrigin(origin)) {
    h['Access-Control-Allow-Origin'] = origin as string
    h['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    h['Access-Control-Allow-Headers'] = 'content-type'
    h['Access-Control-Max-Age'] = '86400'
  }
  return h
}
