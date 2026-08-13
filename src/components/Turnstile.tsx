import { useEffect, useRef } from 'react'
// (callbacks kept in a ref so the render effect depends only on site key + action)

/**
 * Cloudflare Turnstile widget (explicit render).
 *
 * Loads the Turnstile script once, renders a widget with the public site key
 * (VITE_TURNSTILE_SITE_KEY) and the `submit_idea` action, and reports the token
 * via `onVerify`. The token is single-use and short-lived; `onExpire` fires when
 * it lapses so the caller can require a fresh challenge before submitting.
 *
 * The site key is the PUBLIC half of the Turnstile pair (safe in the browser).
 * The secret key is server-only and lives as a Supabase Edge Function secret.
 */

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string
      action?: string
      callback?: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
      'timeout-callback'?: () => void
    },
  ) => string
  reset: (id?: string) => void
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/** Load the Turnstile script exactly once, then run `onReady`. */
function ensureScript(onReady: () => void): void {
  if (window.turnstile) {
    onReady()
    return
  }
  let script = document.querySelector<HTMLScriptElement>('script[data-turnstile]')
  if (!script) {
    script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.setAttribute('data-turnstile', '')
    document.head.appendChild(script)
  }
  // The script may already be loading from a previous mount; poll for readiness.
  const timer = window.setInterval(() => {
    if (window.turnstile) {
      window.clearInterval(timer)
      onReady()
    }
  }, 100)
}

export interface TurnstileProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  /** Turnstile action label; must match the server's expected action. */
  action?: string
  className?: string
}

export function Turnstile({
  onVerify,
  onExpire,
  onError,
  action = 'submit_idea',
  className,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  // Keep the latest callbacks in a ref so the render effect depends only on the
  // site key + action (avoids re-rendering the widget on every parent render).
  const cbRef = useRef({ onVerify, onExpire, onError })
  useEffect(() => {
    cbRef.current = { onVerify, onExpire, onError }
  }, [onVerify, onExpire, onError])

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) return
    let cancelled = false

    function render() {
      if (
        cancelled ||
        !containerRef.current ||
        !window.turnstile ||
        widgetIdRef.current
      ) {
        return
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey as string,
        action,
        callback: (token) => cbRef.current.onVerify(token),
        'expired-callback': () => cbRef.current.onExpire?.(),
        'error-callback': () => cbRef.current.onError?.(),
        'timeout-callback': () => cbRef.current.onExpire?.(),
      })
    }

    ensureScript(render)

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // ignore — widget may already be gone
        }
      }
      widgetIdRef.current = null
    }
  }, [siteKey, action])

  if (!siteKey) {
    // Missing config: fail visibly (dev) rather than silently showing no widget.
    return (
      <p className="text-sm font-medium text-red-600">
        Human check unavailable — <code>VITE_TURNSTILE_SITE_KEY</code> is not
        configured.
      </p>
    )
  }

  return <div ref={containerRef} className={className} />
}
