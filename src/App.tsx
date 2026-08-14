import { Outlet, Route, Routes } from 'react-router-dom'
import { RootLayout } from './layouts/RootLayout'
import { Home } from './pages/Home'
import { Ideas } from './pages/Ideas'
import { IdeaExample } from './pages/IdeaExample'
import { Submit } from './pages/Submit'
import { Contributors } from './pages/Contributors'
import { About } from './pages/About'
import { SignIn } from './pages/SignIn'
import { NotFound } from './pages/NotFound'
import { AuthProvider } from './lib/auth'
import { AdminLayout } from './layouts/AdminLayout'
import { AdminLogin } from './pages/admin/AdminLogin'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminQueue } from './pages/admin/AdminQueue'
import { AdminSubmission } from './pages/admin/AdminSubmission'

/**
 * Route table. Public pages render inside RootLayout; the /admin moderation
 * portal is a separate, authenticated area (its own layout, no public chrome).
 * The trailing "*" route serves the not-found page for any unmatched public
 * path — which, with public/404.html + the index.html restore snippet, makes
 * direct navigation and browser refresh work on GitHub Pages.
 */
export function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<Home />} />
        <Route path="ideas" element={<Ideas />} />
        <Route path="ideas/example" element={<IdeaExample />} />
        <Route path="submit" element={<Submit />} />
        <Route path="contributors" element={<Contributors />} />
        <Route path="about" element={<About />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Moderation portal — Supabase Auth + RLS gated (AdminLayout enforces it). */}
      <Route
        path="/admin"
        element={
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        }
      >
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="queue" element={<AdminQueue />} />
          <Route path="submission/:id" element={<AdminSubmission />} />
        </Route>
        <Route path="login" element={<AdminLogin />} />
      </Route>
    </Routes>
  )
}
