import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls to the top on route change so navigating between pages starts at the
 * top rather than preserving the previous scroll position. Respects in-page
 * hash links by leaving those alone.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])

  return null
}
