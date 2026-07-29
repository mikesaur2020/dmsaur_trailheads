import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Sparkles } from 'lucide-react'
import { Container } from './Container'
import { Logo } from './Logo'
import { ButtonLink } from './Button'
import { buttonClasses } from './button-styles'
import { cn } from '../lib/cn'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/ideas', label: 'Ideas', end: false },
  { to: '/contributors', label: 'Contributors', end: false },
  { to: '/about', label: 'About', end: false },
]

function linkClasses(isActive: boolean): string {
  return cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-soft text-brand'
      : 'text-muted hover:bg-surface-2 hover:text-text',
  )
}

export function Nav() {
  const [open, setOpen] = useState(false)
  const closeMenu = () => setOpen(false)

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo />

          {/* Desktop navigation */}
          <nav className="hidden md:block" aria-label="Primary">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) => linkClasses(isActive)}
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              to="/signin"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              Sign in
            </Link>
            <ButtonLink to="/submit" variant="primary">
              <Sparkles className="size-4" aria-hidden="true" />
              Start an Idea
            </ButtonLink>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-lg p-2 md:hidden',
              'text-text hover:bg-surface-2',
            )}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">
              {open ? 'Close menu' : 'Open menu'}
            </span>
            {open ? (
              <X className="size-6" aria-hidden="true" />
            ) : (
              <Menu className="size-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </Container>

      {/* Mobile menu */}
      {open && (
        <nav
          id="mobile-menu"
          className="border-t border-line bg-bg md:hidden"
          aria-label="Mobile"
        >
          <Container className="py-4">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.end}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      cn(linkClasses(isActive), 'block')
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink
                  to="/signin"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    cn(linkClasses(isActive), 'block')
                  }
                >
                  Sign in
                </NavLink>
              </li>
            </ul>
            <Link
              to="/submit"
              onClick={closeMenu}
              className={cn(buttonClasses('primary', 'lg'), 'mt-3 w-full')}
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Start an Idea
            </Link>
          </Container>
        </nav>
      )}
    </header>
  )
}
