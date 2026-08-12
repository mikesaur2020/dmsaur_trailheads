// Unit tests for Turnstile verification (Phase 3A.1).
// Run: deno test supabase/tests/turnstile.test.ts
import { assertEquals } from 'jsr:@std/assert@1'
import {
  type TurnstileConfig,
  verifyTurnstile,
} from '../functions/submit-idea/turnstile.ts'

/** Mock fetch returning a crafted Siteverify JSON; optionally captures the form. */
function mockFetch(
  status: number,
  body: unknown,
  capture?: (fd: FormData) => void,
): typeof fetch {
  return ((_url: string | URL | Request, init?: RequestInit) => {
    if (capture && init?.body instanceof FormData) capture(init.body)
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  }) as typeof fetch
}

const base: TurnstileConfig = {
  secret: 'test-secret',
  verifyUrl: 'http://mock.local/siteverify',
  timeoutMs: 1000,
}

Deno.test('turnstile: success + matching hostname/action; idempotency_key forwarded', async () => {
  let sentKey = ''
  const cfg: TurnstileConfig = {
    ...base,
    expectedHostname: 'trailheads.dmsaur.com',
    expectedAction: 'submit_idea',
    fetchImpl: mockFetch(
      200,
      { success: true, hostname: 'trailheads.dmsaur.com', action: 'submit_idea' },
      (fd) => {
        sentKey = String(fd.get('idempotency_key'))
      },
    ),
  }
  assertEquals(await verifyTurnstile('tok', 'idem-123', cfg), true)
  assertEquals(sentKey, 'idem-123')
})

Deno.test('turnstile: failure (success:false) → false', async () => {
  const cfg: TurnstileConfig = {
    ...base,
    fetchImpl: mockFetch(200, { success: false, 'error-codes': ['invalid-input-response'] }),
  }
  assertEquals(await verifyTurnstile('tok', 'idem', cfg), false)
})

Deno.test('turnstile: wrong action → false', async () => {
  const cfg: TurnstileConfig = {
    ...base,
    expectedAction: 'submit_idea',
    fetchImpl: mockFetch(200, { success: true, action: 'some_other_action' }),
  }
  assertEquals(await verifyTurnstile('tok', 'idem', cfg), false)
})

Deno.test('turnstile: wrong hostname → false', async () => {
  const cfg: TurnstileConfig = {
    ...base,
    expectedHostname: 'trailheads.dmsaur.com',
    fetchImpl: mockFetch(200, { success: true, hostname: 'evil.example.com' }),
  }
  assertEquals(await verifyTurnstile('tok', 'idem', cfg), false)
})

Deno.test('turnstile: test-mode (no expected host/action) passes on success', async () => {
  const cfg: TurnstileConfig = {
    ...base,
    fetchImpl: mockFetch(200, { success: true, hostname: 'anything', action: '' }),
  }
  assertEquals(await verifyTurnstile('tok', 'idem', cfg), true)
})

Deno.test('turnstile: network failure → false', async () => {
  const cfg: TurnstileConfig = {
    ...base,
    fetchImpl: (() => Promise.reject(new Error('network down'))) as typeof fetch,
  }
  assertEquals(await verifyTurnstile('tok', 'idem', cfg), false)
})

Deno.test('turnstile: siteverify timeout (abort) → false', async () => {
  // A fetch that only settles when aborted; the internal timeout must fire.
  const slow = ((_u: string | URL | Request, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () =>
        reject(new DOMException('aborted', 'AbortError')),
      )
    })) as typeof fetch
  const cfg: TurnstileConfig = { ...base, timeoutMs: 20, fetchImpl: slow }
  assertEquals(await verifyTurnstile('tok', 'idem', cfg), false)
})

Deno.test('turnstile: missing token → false (no network call needed)', async () => {
  const cfg: TurnstileConfig = { ...base, fetchImpl: mockFetch(200, { success: true }) }
  assertEquals(await verifyTurnstile(undefined, 'idem', cfg), false)
})

Deno.test('turnstile: missing secret → false', async () => {
  const cfg: TurnstileConfig = {
    ...base,
    secret: undefined,
    fetchImpl: mockFetch(200, { success: true }),
  }
  assertEquals(await verifyTurnstile('tok', 'idem', cfg), false)
})
