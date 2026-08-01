// Renders scripts/og-image.html to public/images/og-image.png at 1200×630.
//
//   node apps/playground/scripts/generate-og.mjs
//
// Uses the Chromium that Playwright already installed rather than adding a
// headless-browser dependency to the app: this runs by hand when the branding
// changes, not on every build. Set CHROME_PATH to point at a different binary.
//
// Needs network access on first run — the card pulls its webfonts from Google,
// the same families the app itself loads.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const source = join(here, 'og-image.html')
const target = resolve(here, '../public/images/og-image.png')

const WIDTH = 1200
const HEIGHT = 630
// Render at 2× and downscale, so the type stays crisp at OG's small render sizes.
const SCALE = 2

const findChrome = () => {
	if (process.env.CHROME_PATH) return process.env.CHROME_PATH

	const cache = join(homedir(), 'Library/Caches/ms-playwright')
	const candidates = []
	if (existsSync(cache)) {
		for (const entry of readdirSync(cache)) {
			if (entry.startsWith('chromium_headless_shell-')) {
				candidates.push(join(cache, entry, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'))
				candidates.push(join(cache, entry, 'chrome-headless-shell-mac-x64/chrome-headless-shell'))
			}
		}
	}
	candidates.push(
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		'/usr/bin/chromium',
		'/usr/bin/google-chrome'
	)

	const found = candidates.find(path => existsSync(path))
	if (!found) throw new Error('No Chromium found. Set CHROME_PATH to a Chrome/Chromium binary.')
	return found
}

const chrome = findChrome()
const scratch = join(tmpdir(), `hydra-og-${process.pid}`)
mkdirSync(scratch, { recursive: true })
const raw = join(scratch, 'og.png')

console.log(`› rendering with ${chrome}`)
execFileSync(
	chrome,
	[
		'--headless',
		'--disable-gpu',
		'--hide-scrollbars',
		`--user-data-dir=${scratch}/profile`,
		`--window-size=${WIDTH},${HEIGHT}`,
		`--force-device-scale-factor=${SCALE}`,
		// Advances the clock so webfonts and layout settle before the capture.
		'--virtual-time-budget=10000',
		`--screenshot=${raw}`,
		`file://${source}`
	],
	{ stdio: 'inherit' }
)

if (!existsSync(raw)) throw new Error('Chromium produced no screenshot')

mkdirSync(dirname(target), { recursive: true })

if (SCALE === 1) {
	renameSync(raw, target)
} else {
	// sips ships with macOS; elsewhere the 2× file is still a valid OG image.
	try {
		execFileSync('sips', ['-z', String(HEIGHT), String(WIDTH), raw, '--out', target], { stdio: 'ignore' })
	} catch {
		console.warn('› sips unavailable, keeping the 2× render')
		renameSync(raw, target)
	}
}

rmSync(scratch, { recursive: true, force: true })
console.log(`✓ ${target}`)
