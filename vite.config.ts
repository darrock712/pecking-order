import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// GitHub Pages can't send headers, so the policy ships as a meta tag. Nothing loads
// from another origin (the font is self-hosted), so no player data leaves the site. Build only:
// the dev server needs an inline script for React refresh.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  'upgrade-insecure-requests',
].join('; ')

const csp = (): Plugin => ({
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
})

// A relative base lets the same build run at a domain root (Vercel) or under
// a sub-path (GitHub Pages) without configuration.
export default defineConfig({
  base: './',
  plugins: [react(), csp()],
})
