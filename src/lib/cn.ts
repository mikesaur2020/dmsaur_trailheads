/**
 * Tiny className joiner — filters out falsey values so conditional classes stay
 * readable without pulling in a dependency. `cn('a', cond && 'b', undefined)`.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
