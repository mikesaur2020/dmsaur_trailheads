import type { CSSProperties } from 'react'
import type { IdeaStatus } from '../types'
import { STATUS_META } from '../lib/meta'
import { cn } from '../lib/cn'

/**
 * Compact status indicator. Uses the plain-language label; the trail phrase is
 * available as a title for supporting context, never as the primary text.
 */
export function StatusPill({
  status,
  className,
}: {
  status: IdeaStatus
  className?: string
}) {
  const meta = STATUS_META[status]
  const style = {
    color: meta.colorVar,
    backgroundColor: `color-mix(in srgb, ${meta.colorVar} 12%, transparent)`,
    borderColor: `color-mix(in srgb, ${meta.colorVar} 30%, transparent)`,
  } as CSSProperties

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'text-xs font-medium',
        className,
      )}
      style={style}
      title={meta.trailPhrase}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: meta.colorVar }}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  )
}
