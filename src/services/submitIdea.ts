/**
 * Submission service — the browser's only call into the protected write path.
 *
 * POSTs to the deployed `submit-idea` Edge Function (never to a table directly).
 * The Edge Function is the trust boundary; this module just builds the payload
 * and maps the HTTP response to a typed result. No secrets are used here — only
 * the public Supabase URL + publishable key (as the API gateway key).
 */

/** Wizard answers relevant to a submission (all strings from the wizard state). */
export interface SubmitAnswers {
  problem: string
  story?: string
  who?: string
  frequency?: string
  workaround?: string
  willingness?: string
  recognition: string
  displayName?: string
  /** 'yes' | 'no' from the contact-consent question. */
  contact?: string
  contactEmail?: string
  /** Honeypot — real users leave this empty. */
  website?: string
}

/** The exact JSON payload the Edge Function accepts (client-field allowlist). */
export interface SubmitPayload {
  idempotencyKey: string
  turnstileToken: string
  website: string
  problem: string
  story?: string
  who?: string
  frequency?: string
  workaround?: string
  willingness?: string
  recognition: string
  displayName?: string
  contactConsent: boolean
  contactEmail?: string
}

export type SubmitResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; kind: 'validation'; fields: Record<string, string> }
  | { ok: false; kind: 'verification' }
  | { ok: false; kind: 'too_large' }
  | { ok: false; kind: 'server' }
  | { ok: false; kind: 'network' }
  | { ok: false; kind: 'not_configured' }

const trim = (v: string | undefined): string | undefined => {
  const t = (v ?? '').trim()
  return t.length > 0 ? t : undefined
}

/**
 * Build the allowlisted payload from wizard answers. Mirrors the server rules:
 * a display name is omitted for anonymous submitters, and a contact email is
 * only included when the submitter consented to contact.
 */
export function buildSubmitPayload(
  answers: SubmitAnswers,
  turnstileToken: string,
  idempotencyKey: string,
): SubmitPayload {
  const contactConsent = answers.contact === 'yes'
  const anonymous = answers.recognition === 'anonymous'
  return {
    idempotencyKey,
    turnstileToken,
    website: answers.website ?? '',
    problem: (answers.problem ?? '').trim(),
    story: trim(answers.story),
    who: trim(answers.who),
    frequency: trim(answers.frequency),
    workaround: trim(answers.workaround),
    willingness: trim(answers.willingness),
    recognition: answers.recognition,
    displayName: anonymous ? undefined : trim(answers.displayName),
    contactConsent,
    contactEmail: contactConsent ? trim(answers.contactEmail) : undefined,
  }
}

/**
 * Send a submission. Never throws — always resolves to a typed result the UI can
 * branch on. `duplicate` is treated as success (idempotent retry).
 */
export async function submitIdea(payload: SubmitPayload): Promise<SubmitResult> {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (!url) return { ok: false, kind: 'not_configured' }

  let res: Response
  try {
    res = await fetch(`${url}/functions/v1/submit-idea`, {
      method: 'POST',
      // submit-idea is a PUBLIC, unauthenticated endpoint (verify_jwt=false); its
      // security boundary is Turnstile + validation + honeypot + idempotency, not
      // an API key. Send ONLY Content-Type so the browser's CORS preflight requests
      // just `content-type` — the sole header the function's CORS policy allows.
      // Sending apikey/Authorization adds preflight headers the function does not
      // allowlist, and the browser blocks the request before it is sent.
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch {
    return { ok: false, kind: 'network' }
  }

  let body: { ok?: boolean; duplicate?: boolean; fields?: Record<string, string> } | null =
    null
  try {
    body = await res.json()
  } catch {
    body = null
  }

  if (res.status === 200 && body?.ok) {
    return { ok: true, duplicate: body.duplicate === true }
  }
  if (res.status === 400) {
    return { ok: false, kind: 'validation', fields: body?.fields ?? {} }
  }
  if (res.status === 403) return { ok: false, kind: 'verification' }
  if (res.status === 413) return { ok: false, kind: 'too_large' }
  return { ok: false, kind: 'server' }
}
