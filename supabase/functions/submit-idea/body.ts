// Bounded request-body reader.
//
// Reads at most `maxBytes` bytes from a byte stream and returns UTF-8 text, or
// { ok: false } the moment the limit is exceeded — WITHOUT ever buffering an
// arbitrarily large request. Works whether or not the request advertised a
// Content-Length (chunked / streaming / missing-length included). UTF-8 is
// decoded only after the bounded read succeeds.

export type BoundedBody =
  | { ok: true; bytes: number; text: string }
  | { ok: false }

export async function readBoundedBody(
  stream: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<BoundedBody> {
  if (!stream) return { ok: true, bytes: 0, text: '' }

  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value || value.byteLength === 0) continue

      total += value.byteLength
      if (total > maxBytes) {
        // Over the limit — stop immediately; never accumulate an unbounded body.
        await reader.cancel()
        return { ok: false }
      }
      chunks.push(value)
    }
  } catch {
    // A read error makes the body unusable; treat as a failed read.
    return { ok: false }
  } finally {
    reader.releaseLock()
  }

  const buf = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    buf.set(c, offset)
    offset += c.byteLength
  }
  // Decode UTF-8 only after the bounded read succeeded.
  const text = new TextDecoder('utf-8').decode(buf)
  return { ok: true, bytes: total, text }
}
