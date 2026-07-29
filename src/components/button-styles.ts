import { cn } from '../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'md' | 'lg'

/**
 * Shared button appearance, used by both real <button> elements and
 * router <Link>s so a link and a button look identical. Rounded but restrained;
 * strong visible focus ring inherited from the global :focus-visible style.
 */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium',
    'transition-colors duration-150 select-none',
    'disabled:cursor-not-allowed disabled:opacity-60',
    size === 'md' && 'px-4 py-2 text-sm',
    size === 'lg' && 'px-5 py-3 text-base',
    variant === 'primary' &&
      'bg-brand text-brand-contrast hover:bg-brand-strong shadow-sm',
    variant === 'secondary' &&
      'bg-surface text-text border border-line hover:bg-surface-2',
    variant === 'ghost' && 'text-brand hover:bg-brand-soft',
    className,
  )
}
