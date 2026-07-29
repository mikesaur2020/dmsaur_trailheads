import { Compass, Home, Search } from 'lucide-react'
import { Container } from '../components/Container'
import { ButtonLink } from '../components/Button'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function NotFound() {
  useDocumentTitle('Page not found')

  return (
    <div className="py-24 sm:py-32">
      <Container size="narrow">
        <div className="flex flex-col items-center text-center">
          <span className="relative grid size-20 place-items-center rounded-3xl bg-brand-soft text-brand">
            <Compass className="size-10" aria-hidden="true" />
          </span>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-brand">
            Off the trail
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-text">
            This path doesn’t lead anywhere
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
            The page you were looking for can’t be found. Let’s get you back to a
            known trailhead.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink to="/" variant="primary" size="lg">
              <Home className="size-4" aria-hidden="true" />
              Back to home
            </ButtonLink>
            <ButtonLink to="/ideas" variant="secondary" size="lg">
              <Search className="size-4" aria-hidden="true" />
              Browse ideas
            </ButtonLink>
          </div>
        </div>
      </Container>
    </div>
  )
}
