import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Production target is the custom domain https://trailheads.dmsaur.com (served at
// the domain root), so the base path is '/'. This also matches local dev/preview.
//
// If you ever need to serve from the GitHub project-pages subpath instead
// (https://<user>.github.io/dmsaur_trailheads/), set VITE_BASE=/dmsaur_trailheads/
// at build time. See docs/ARCHITECTURE.md ("Custom domain") for the full checklist.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
})
