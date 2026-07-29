import { useEffect } from 'react'

const BASE_TITLE = 'DMSaur Trailheads'

/** Sets the document title per page, restoring the base title on unmount. */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE
    return () => {
      document.title = BASE_TITLE
    }
  }, [title])
}
