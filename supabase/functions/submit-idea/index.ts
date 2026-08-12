// DMSaur Trailheads — Phase 3A.1: protected idea-submission endpoint.
//
//   Browser --> this Edge Function --> public.idea_submissions (service_role)
//
// The public browser NEVER writes the queue directly. This function is the sole
// trust boundary for a PUBLIC, unauthenticated endpoint. It:
//   • enforces a strict client-field allowlist (no moderation/system fields)
//   • validates every field server-side
//   • bounds the request body to a real byte limit (never buffers unbounded)
//   • is idempotent: a retry of an already-stored submission succeeds WITHOUT
//     re-verifying a single-use Turnstile token
//   • screens bots with a honeypot + Cloudflare Turnstile (hostname/action/time-
//     bounded), passing the submission idempotency key to Siteverify
//   • FORCES status = 'pending'
//
// NOTE ON CORS: CORS is a BROWSER policy, not endpoint authentication. It stops
// disallowed browser origins from reading responses; it does not stop curl or
// server-to-server callers from invoking the endpoint. The real security
// boundary here is Turnstile + server-side validation. As an optimization we
// reject a present-but-non-allowlisted Origin early; requests with NO Origin
// (curl / local backend tests) are still processed.
//
// SECRETS: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically
// by the Supabase platform (and by `supabase functions serve` locally).
// TURNSTILE_SECRET_KEY (and optional TURNSTILE_EXPECTED_* hardening) come from
// `supabase secrets set` (hosted) or an --env-file (local). No secret is
// hardcoded, and none is ever returned to the browser.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { readBoundedBody } from './body.ts'
import { ALLOWED_ORIGINS, corsHeaders } from './cors.ts'
import { turnstileConfigFromEnv, verifyTurnstile } from './turnstile.ts'

// --- Config ----------------------------------------------------------------

const MAX_BODY_BYTES = 16 * 1024 // 16 KB

const RECOGNITION = new Set(['full-name', 'first-name', 'nickname', 'anonymous'])
const FREQUENCY = new Set(['rarely', 'occasionally', 'often', 'constantly'])
const WILLINGNESS = new Set(['no', 'maybe', 'yes'])

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// --- Helpers ---------------------------------------------------------------

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin),
  })
}

type Payload = Record<string, unknown>

/** Trimmed string, or undefined when the value is absent/non-string/empty. */
function str(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t.length > 0 ? t : undefined
}

type ValidationResult =
  | { fields: Record<string, string> }
  | { row: Record<string, unknown>; idempotencyKey: string }

/**
 * Validate the client payload and build the allowlisted DB row. `status` is
 * FORCED to 'pending'; no moderation/system field is ever read from the client.
 */
function validate(p: Payload): ValidationResult {
  const fields: Record<string, string> = {}

  const idempotencyKey = str(p.idempotencyKey)
  if (!idempotencyKey || !UUID_RE.test(idempotencyKey)) {
    fields.idempotencyKey = 'invalid'
  }

  const problem = str(p.problem)
  if (!problem || problem.length < 12) fields.problem = 'too_short'
  else if (problem.length > 4000) fields.problem = 'too_long'

  const story = str(p.story)
  if (story && story.length > 4000) fields.story = 'too_long'

  const who = str(p.who)
  if (who && who.length > 2000) fields.who = 'too_long'

  const frequency = str(p.frequency)
  if (frequency && !FREQUENCY.has(frequency)) fields.frequency = 'invalid'

  const workaround = str(p.workaround)
  if (workaround && workaround.length > 2000) fields.workaround = 'too_long'

  const willingness = str(p.willingness)
  if (willingness && !WILLINGNESS.has(willingness)) fields.willingness = 'invalid'

  const recognition = str(p.recognition)
  if (!recognition || !RECOGNITION.has(recognition)) fields.recognition = 'invalid'

  const displayName = str(p.displayName)
  if (recognition !== 'anonymous') {
    if (!displayName) fields.displayName = 'required'
    else if (displayName.length > 80) fields.displayName = 'too_long'
  }

  const contactConsent = p.contactConsent === true
  if (typeof p.contactConsent !== 'boolean') fields.contactConsent = 'invalid'

  const contactEmail = str(p.contactEmail)
  if (contactEmail) {
    if (!contactConsent) fields.contactEmail = 'consent_required'
    else if (contactEmail.length > 254 || !EMAIL_RE.test(contactEmail)) {
      fields.contactEmail = 'invalid'
    }
  }

  if (Object.keys(fields).length > 0) return { fields }

  const row: Record<string, unknown> = {
    status: 'pending', // forced server-side
    problem_statement: problem,
    contributor_story: story ?? null,
    who_experiences_it: who ?? null,
    frequency: frequency ?? null,
    current_workaround: workaround ?? null,
    willingness_to_pay: willingness ?? null,
    recognition,
    // Respect anonymity: never persist a display name for anonymous submitters.
    contributor_display: recognition === 'anonymous' ? null : displayName,
    contact_consent: contactConsent,
    contact_email: contactConsent ? (contactEmail ?? null) : null,
    idempotency_key: idempotencyKey,
  }
  return { row, idempotencyKey: idempotencyKey as string }
}

// --- Handler ---------------------------------------------------------------

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin')

  // CORS is a browser policy, not authentication (see file header). Optimization:
  // reject a present-but-non-allowlisted browser Origin early. No-Origin requests
  // (curl / server-to-server / local tests) are still processed.
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json({ ok: false, error: 'forbidden_origin' }, 403, origin)
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, 405, origin)
  }

  // Fast reject via Content-Length when present (optimization only — the header
  // can be absent on chunked requests, so it is NOT the real limit).
  const declaredLen = Number(req.headers.get('content-length') ?? '0')
  if (Number.isFinite(declaredLen) && declaredLen > MAX_BODY_BYTES) {
    return json({ ok: false, error: 'payload_too_large' }, 413, origin)
  }

  // Real byte-bounded read: handles missing Content-Length / chunked / multibyte.
  const bounded = await readBoundedBody(req.body, MAX_BODY_BYTES)
  if (!bounded.ok) {
    return json({ ok: false, error: 'payload_too_large' }, 413, origin)
  }

  let payload: Payload
  try {
    payload = JSON.parse(bounded.text) as Payload
  } catch {
    return json(
      { ok: false, error: 'validation', fields: { body: 'invalid_json' } },
      400,
      origin,
    )
  }

  // Honeypot: real users never fill `website`. Silently accept + drop, so bots
  // cannot tell rejection from success.
  if (str(payload.website)) {
    return json({ ok: true }, 200, origin)
  }

  const result = validate(payload)
  if ('fields' in result) {
    return json({ ok: false, error: 'validation', fields: result.fields }, 400, origin)
  }

  // Server-side client for the queue (service_role auto-injected env). RLS blocks
  // anon/authenticated entirely; only this server path may read/insert the queue.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  // Idempotent short-circuit BEFORE Turnstile. A retry of an already-stored
  // submission succeeds immediately, without re-verifying a single-use Turnstile
  // token (which the browser may be replaying after a lost response). The lookup
  // fetches only the id server-side and never returns submission content/ids to
  // the client — a generic duplicate flag is enough.
  const { data: existing, error: lookupErr } = await supabase
    .from('idea_submissions')
    .select('id')
    .eq('idempotency_key', result.idempotencyKey)
    .maybeSingle()

  if (lookupErr) {
    console.error('submit-idea idempotency lookup failed:', lookupErr.code, lookupErr.message)
    return json({ ok: false, error: 'server' }, 500, origin)
  }
  if (existing) {
    return json({ ok: true, duplicate: true }, 200, origin)
  }

  // New submission → verify Turnstile. The submission idempotency key is passed
  // to Siteverify so concurrent/retried requests with the same token+key get a
  // stable verification result.
  const passed = await verifyTurnstile(
    str(payload.turnstileToken),
    result.idempotencyKey,
    turnstileConfigFromEnv(),
  )
  if (!passed) {
    return json({ ok: false, error: 'verification' }, 403, origin)
  }

  const { error: insertErr } = await supabase
    .from('idea_submissions')
    .insert(result.row)

  if (insertErr) {
    // Concurrent same-key race: the UNIQUE constraint guarantees exactly one row.
    if (insertErr.code === '23505') {
      return json({ ok: true, duplicate: true }, 200, origin)
    }
    // Log server-side only; never leak internals to the client.
    console.error('submit-idea insert failed:', insertErr.code, insertErr.message)
    return json({ ok: false, error: 'server' }, 500, origin)
  }

  return json({ ok: true }, 200, origin)
})
