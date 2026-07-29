import { Link } from 'react-router-dom'
import { Mountain } from 'lucide-react'
import { cn } from '../lib/cn'

/**
 * Wordmark + trail-marker glyph. Restrained use of the trail metaphor: a single
 * peak icon, plain product name.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        'group inline-flex items-center gap-2.5 rounded-lg',
        className,
      )}
      aria-label="DMSaur Trailheads — home"
    >
      <span
        className="grid size-9 place-items-center rounded-xl bg-brand text-brand-contrast shadow-sm"
        aria-hidden="true"
      >
        <Mountain className="size-5" strokeWidth={2.2} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
          DMSaur
        </span>
        <span className="text-lg font-semibold tracking-tight text-text">
          Trailheads
        </span>
      </span>
    </Link>
  )
}
