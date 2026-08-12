// Unit tests for the bounded body reader (Phase 3A.1).
// Run: deno test supabase/tests/body.test.ts
import { assertEquals } from 'jsr:@std/assert@1'
import { readBoundedBody } from '../functions/submit-idea/body.ts'

const enc = new TextEncoder()

function streamFrom(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(c)
      controller.close()
    },
  })
}

Deno.test('body: small payload within limit is read verbatim', async () => {
  const r = await readBoundedBody(streamFrom([enc.encode('hello')]), 16)
  assertEquals(r.ok, true)
  if (r.ok) {
    assertEquals(r.text, 'hello')
    assertEquals(r.bytes, 5)
  }
})

Deno.test('body: null body → empty text, ok', async () => {
  const r = await readBoundedBody(null, 16)
  assertEquals(r.ok, true)
  if (r.ok) assertEquals(r.text, '')
})

Deno.test('body: payload exactly at the limit is allowed', async () => {
  const r = await readBoundedBody(streamFrom([new Uint8Array(10).fill(97)]), 10)
  assertEquals(r.ok, true)
})

Deno.test('body: oversized multi-chunk stream (no Content-Length) is rejected', async () => {
  // Two 8-byte chunks = 16 bytes > 10; simulates a chunked/no-length request.
  const chunk = new Uint8Array(8).fill(97)
  const r = await readBoundedBody(streamFrom([chunk, chunk]), 10)
  assertEquals(r.ok, false)
})

Deno.test('body: multibyte UTF-8 exceeds byte limit though char count would not', async () => {
  // 6 '€' = 6 characters but 18 bytes; a char-length check would wrongly pass.
  const bytes = enc.encode('€€€€€€')
  assertEquals(bytes.byteLength, 18)
  const r = await readBoundedBody(streamFrom([bytes]), 10)
  assertEquals(r.ok, false)
})
