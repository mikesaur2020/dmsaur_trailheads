import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/** Consistent section header with optional eyebrow and supporting text. */
export function SectionHeading({
  eyebrow,
  title,
  children,
  align = 'left',
  className,
}: {
  eyebrow?: string
  title: ReactNode
  children?: ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-brand">
          {eyebrow}
        </p>
      )}
      <h2 className="text-balance text-2xl font-semibold tracking-tight text-text sm:text-3xl">
        {title}
      </h2>
      {children && (
        <p className="mt-3 text-pretty text-base leading-relaxed text-muted">
          {children}
        </p>
      )}
    </div>
  )
}
