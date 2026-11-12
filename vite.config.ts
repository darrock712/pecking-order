import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// A relative base lets the same build run at a domain root (Vercel) or under
// a sub-path (GitHub Pages) without configuration.
export default defineConfig({
  base: './',
  plugins: [react()],
})
