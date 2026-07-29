import type { Category } from '../types'
import { CATEGORY_META } from '../lib/meta'
import { cn } from '../lib/cn'

/** Category label with its Lucide icon. */
export function CategoryBadge({
  category,
  className,
}: {
  category: Category
  className?: string
}) {
  const meta = CATEGORY_META[category]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-0.5',
        'text-xs font-medium text-muted',
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  )
}
