import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import './index.css'

/**
 * Router basename is derived from Vite's BASE_URL so the same build works at the
 * domain root (production custom domain, base '/') and, if ever needed, under a
 * project-pages subpath (base '/dmsaur_trailheads/'). Trailing slash is trimmed
 * because React Router expects a basename without one.
 */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
