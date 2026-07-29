/**
 * Formatting helpers. Kept dependency-free and locale-stable.
 */

/** Format an ISO date (YYYY-MM-DD) as e.g. "Mar 4, 2026". */
export function formatDate(iso: string): string {
  // Parse as UTC to avoid off-by-one from local timezones.
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/** Compact number for signal counts, e.g. 1200 -> "1.2k". */
export function compactCount(n: number): string {
  if (n < 1000) return String(n)
  return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
}
