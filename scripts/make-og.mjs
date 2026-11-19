// Renders public/og.svg to public/og.png (1200x630) with a headless Chrome or Edge
// already on the machine, so no image library is needed. Run: node scripts/make-og.mjs
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const svg = join(root, 'public', 'og.svg')
const out = join(root, 'public', 'og.png')

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)
const browser = candidates.find((p) => existsSync(p))
if (!browser) {
  console.error('No Chrome or Edge found. Set CHROME_PATH to a Chromium-based browser.')
  process.exit(1)
}

// Wrap the SVG in a page exactly 1200x630 so the screenshot has no margins.
const dir = mkdtempSync(join(tmpdir(), 'og-'))
const page = join(dir, 'og.html')
writeFileSync(
  page,
  `<!doctype html><style>html,body{margin:0;overflow:hidden}img{display:block;width:1200px;height:630px}</style>` +
    `<img src="${pathToFileURL(svg).href}">`,
)
try {
  execFileSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--user-data-dir=${join(dir, 'profile')}`,
    '--window-size=1200,630',
    `--screenshot=${out}`,
    pathToFileURL(page).href,
  ], { stdio: 'inherit' })
} finally {
  rmSync(dir, { recursive: true, force: true })
}
console.log(`Wrote ${out}`)
