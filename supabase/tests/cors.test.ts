// Unit tests for the CORS policy (Phase 3A.1).
// The local `supabase functions serve` relay rewrites preflight CORS to `*`, so
// the header echo can only be verified at the unit level here (and, later, on a
// deployed function). Run: deno test supabase/tests/cors.test.ts
import { assertEquals } from 'jsr:@std/assert@1'
import {
  corsHeaders,
  isAllowedOrigin,
} from '../functions/submit-idea/cors.ts'

Deno.test('cors: allowed origin echoes the exact origin (never wildcard)', () => {
  const h = corsHeaders('https://trailheads.dmsaur.com')
  assertEquals(h['Access-Control-Allow-Origin'], 'https://trailheads.dmsaur.com')
  assertEquals(h['Access-Control-Allow-Methods'], 'POST, OPTIONS')
  assertEquals(h['Access-Control-Allow-Headers'], 'content-type')
  assertEquals(h['Access-Control-Max-Age'], '86400')
})

Deno.test('cors: disallowed origin receives NO Access-Control-Allow-Origin', () => {
  const h = corsHeaders('https://evil.example.com')
  assertEquals(h['Access-Control-Allow-Origin'], undefined)
  assertEquals(h['Access-Control-Allow-Methods'], undefined)
})

Deno.test('cors: absent origin receives NO Access-Control-Allow-Origin', () => {
  const h = corsHeaders(null)
  assertEquals(h['Access-Control-Allow-Origin'], undefined)
})

Deno.test('cors: ACAO is never the wildcard "*"', () => {
  for (const o of ['https://trailheads.dmsaur.com', 'https://evil.example.com', null]) {
    assertEquals(corsHeaders(o)['Access-Control-Allow-Origin'] === '*', false)
  }
})

Deno.test('cors: isAllowedOrigin allowlist', () => {
  assertEquals(isAllowedOrigin('https://trailheads.dmsaur.com'), true)
  assertEquals(isAllowedOrigin('http://localhost:5173'), true)
  assertEquals(isAllowedOrigin('https://evil.example.com'), false)
  assertEquals(isAllowedOrigin(null), false)
})
