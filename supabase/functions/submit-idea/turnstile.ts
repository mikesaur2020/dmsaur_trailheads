// Cloudflare Turnstile server-side verification.
//
// Sends secret + response + idempotency_key to Siteverify (so a retry with the
// same submission idempotency key gets a STABLE result even though the token
// itself is single-use), enforces a network timeout, and — in production —
// validates the returned hostname and action.
//
// Test-mode is a matter of CONFIG, not weaker logic: the expected hostname and
// action are read from env and enforced only when set. Local/CI runs leave them
// UNSET so Cloudflare's test keys stay usable; production (Gate D) sets
//   TURNSTILE_EXPECTED_HOSTNAME=trailheads.dmsaur.com
//   TURNSTILE_EXPECTED_ACTION=submit_idea
// which turns on full validation without changing any code path.

const DEFAULT_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const DEFAULT_TIMEOUT_MS = 5000

export interface TurnstileConfig {
  secret: string | undefined
  verifyUrl: string
  /** When set, the Siteverify response hostname must match exactly. */
  expectedHostname?: string
  /** When set, the Siteverify response action must match exactly. */
  expectedAction?: string
  timeoutMs: number
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch
}

export function turnstileConfigFromEnv(): TurnstileConfig {
  return {
    secret: Deno.env.get('TURNSTILE_SECRET_KEY'),
    verifyUrl: Deno.env.get('TURNSTILE_VERIFY_URL') || DEFAULT_VERIFY_URL,
    expectedHostname: Deno.env.get('TURNSTILE_EXPECTED_HOSTNAME') || undefined,
    expectedAction: Deno.env.get('TURNSTILE_EXPECTED_ACTION') || undefined,
    timeoutMs: Number(Deno.env.get('TURNSTILE_TIMEOUT_MS') || DEFAULT_TIMEOUT_MS),
  }
}

interface SiteverifyResponse {
  success?: boolean
  hostname?: string
  action?: string
  'error-codes'?: string[]
}

/**
 * Returns true only when Siteverify confirms success AND (when configured) the
 * hostname and action match. Any network error or timeout resolves to false.
 */
export async function verifyTurnstile(
  token: string | undefined,
  idempotencyKey: string,
  cfg: TurnstileConfig,
): Promise<boolean> {
  if (!cfg.secret || !token) return false

  const doFetch = cfg.fetchImpl ?? fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs)

  try {
    const form = new FormData()
    form.append('secret', cfg.secret)
    form.append('response', token)
    // Stable verification across retries with the same submission key.
    form.append('idempotency_key', idempotencyKey)

    const res = await doFetch(cfg.verifyUrl, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    })
    if (!res.ok) return false

    const data = (await res.json()) as SiteverifyResponse
    if (data?.success !== true) return false

    // Production hardening — enforced only when configured (test keys stay usable).
    if (cfg.expectedHostname && data.hostname !== cfg.expectedHostname) return false
    if (cfg.expectedAction && data.action !== cfg.expectedAction) return false

    return true
  } catch {
    // Network error or timeout (AbortError) → verification failure.
    return false
  } finally {
    clearTimeout(timer)
  }
}
