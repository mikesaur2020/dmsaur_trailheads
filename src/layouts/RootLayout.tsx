import { Outlet } from 'react-router-dom'
import { Nav } from '../components/Nav'
import { Footer } from '../components/Footer'
import { ScrollToTop } from '../components/ScrollToTop'

/**
 * App shell: skip link, sticky nav, routed page content, and footer. Wraps every
 * route via the router's layout route.
 */
export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="skip-link">
        <span className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-contrast shadow">
          Skip to content
        </span>
      </a>
      <ScrollToTop />
      <Nav />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
