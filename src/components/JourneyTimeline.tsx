import type { CSSProperties } from 'react'
import type { IdeaStatus } from '../types'
import { JOURNEY, STATUS_META } from '../lib/meta'
import { cn } from '../lib/cn'

/**
 * The product journey shown as an ordered lifecycle: Submitted → Reviewing →
 * Researching → Prototyping → Building → Beta → Released.
 *
 * Plain language leads; the trail phrase appears only as smaller supporting
 * copy. When `current` is provided, steps up to and including it are marked
 * reached.
 */
export function JourneyTimeline({
  current,
  showTrailPhrase = true,
}: {
  current?: IdeaStatus
  showTrailPhrase?: boolean
}) {
  const currentIndex = current ? JOURNEY.indexOf(current) : -1

  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {JOURNEY.map((status, i) => {
        const meta = STATUS_META[status]
        const reached = currentIndex >= 0 && i <= currentIndex
        const isCurrent = i === currentIndex
        const style = {
          '--dot': meta.colorVar,
        } as CSSProperties

        return (
          <li
            key={status}
            className={cn(
              'relative rounded-xl border bg-surface p-3 transition-colors',
              reached ? 'border-line' : 'border-line/60',
            )}
            style={style}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold',
                  reached ? 'text-brand-contrast' : 'text-muted',
                )}
                style={{
                  backgroundColor: reached
                    ? 'var(--dot)'
                    : 'color-mix(in srgb, var(--muted) 15%, transparent)',
                }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  'text-sm font-medium',
                  reached ? 'text-text' : 'text-muted',
                )}
              >
                {meta.label}
              </span>
            </div>
            {showTrailPhrase && (
              <p className="mt-1.5 pl-8 text-[0.7rem] text-muted">
                {meta.trailPhrase}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
