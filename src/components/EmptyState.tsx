import type { ReactNode } from 'react'
import { Compass } from 'lucide-react'

/** Friendly empty-state used when filters match no ideas. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface-2/50 px-6 py-16 text-center">
      <span
        className="mb-4 grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"
        aria-hidden="true"
      >
        <Compass className="size-6" />
      </span>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      {children && (
        <p className="mt-2 max-w-sm text-sm text-muted">{children}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
