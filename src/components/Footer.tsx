import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { Container } from './Container'
import { Logo } from './Logo'

const DMSAUR_URL = 'https://dmsaur.com'

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface-2/50">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Trailheads is where friends, users, and fellow problem-solvers
              share the everyday frustrations and unmet needs that might inspire
              future DMSaur apps.
            </p>
            <p className="mt-4 text-sm font-medium text-brand">
              Ideas are easy. Learning is the adventure.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-text">Explore</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link to="/ideas" className="hover:text-text">
                  Ideas
                </Link>
              </li>
              <li>
                <Link to="/contributors" className="hover:text-text">
                  Contributors
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-text">
                  About
                </Link>
              </li>
              <li>
                <Link to="/submit" className="hover:text-text">
                  Start an Idea
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-text">DMSaur</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <a
                  href={DMSAUR_URL}
                  className="inline-flex items-center gap-1 hover:text-text"
                >
                  dmsaur.com
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-text">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-text">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-sm text-muted">
          <p>© 2026 DMSaur. Built by hand. No trackers. No cookies.</p>
        </div>
      </Container>
    </footer>
  )
}
