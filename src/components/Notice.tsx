import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn } from '../lib/cn'

/**
 * Inline informational notice. Used to clearly mark demonstration data and
 * preview features so nothing is mistaken for live functionality.
 */
export function Notice({
  children,
  className,
  icon = <Info className="size-4 shrink-0" aria-hidden="true" />,
}: {
  children: ReactNode
  className?: string
  icon?: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl border border-line bg-surface-2/70',
        'px-4 py-3 text-sm text-muted',
        className,
      )}
      role="note"
    >
      <span className="mt-0.5 text-brand">{icon}</span>
      <span>{children}</span>
    </div>
  )
}
