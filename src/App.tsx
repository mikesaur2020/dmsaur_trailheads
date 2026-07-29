import { Route, Routes } from 'react-router-dom'
import { RootLayout } from './layouts/RootLayout'
import { Home } from './pages/Home'
import { Ideas } from './pages/Ideas'
import { IdeaExample } from './pages/IdeaExample'
import { Submit } from './pages/Submit'
import { Contributors } from './pages/Contributors'
import { About } from './pages/About'
import { SignIn } from './pages/SignIn'
import { NotFound } from './pages/NotFound'

/**
 * Route table. All pages render inside RootLayout. The trailing "*" route serves
 * the polished not-found page for any unmatched path — which, combined with the
 * public/404.html + index.html restore snippet, makes direct navigation and
 * browser refresh work on GitHub Pages.
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
    </Routes>
  )
}
