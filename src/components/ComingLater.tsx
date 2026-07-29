import type { ReactNode } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '../lib/cn'

/** Small badge marking a feature that is not operational yet. */
export function ComingLaterBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-accent/30',
        'bg-accent-soft px-2 py-0.5 text-[0.7rem] font-semibold uppercase',
        'tracking-wide text-accent',
        className,
      )}
    >
      <Clock className="size-3" aria-hidden="true" />
      Coming later
    </span>
  )
}

/**
 * A placeholder panel for functionality that will arrive in a later phase.
 * Deliberately inert — it never pretends to save or submit anything.
 */
export function ComingLaterPanel({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface-2/60 p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <ComingLaterBadge />
      </div>
      {children && <div className="text-sm text-muted">{children}</div>}
    </div>
  )
}
