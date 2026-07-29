import type { CSSProperties } from 'react'
import type { CommunitySignal } from '../types'
import { SIGNAL_META } from '../lib/meta'
import { compactCount } from '../lib/format'
import { cn } from '../lib/cn'

/**
 * A single community-signal count. Read-only preview — these are not live votes
 * and there is no control to increment them.
 */
export function SignalStat({
  signal,
  size = 'sm',
}: {
  signal: CommunitySignal
  size?: 'sm' | 'md'
}) {
  const meta = SIGNAL_META[signal.key]
  const Icon = meta.icon
  const style = { color: meta.colorVar } as CSSProperties

  return (
    <div
      className={cn(
        'flex items-center gap-1.5',
        size === 'sm' ? 'text-xs' : 'text-sm',
      )}
      title={`${meta.label} — ${meta.description}`}
    >
      <Icon
        className={cn(size === 'sm' ? 'size-3.5' : 'size-4')}
        style={style}
        aria-hidden="true"
      />
      <span className="font-semibold text-text tabular-nums">
        {compactCount(signal.count)}
      </span>
      <span className="sr-only">{meta.label}</span>
    </div>
  )
}

/** Row of all four signal counts for a card. */
export function SignalRow({ signals }: { signals: CommunitySignal[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {signals.map((s) => (
        <SignalStat key={s.key} signal={s} />
      ))}
    </div>
  )
}
