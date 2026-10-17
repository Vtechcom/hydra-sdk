import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * Smoke test of the BUILT package as a consumer resolves it. Each case runs in a
 * fresh `node` child process from the package root, so resolution goes through
 * package.json `exports` (self-reference by name) with real Node conditions —
 * not through the vitest alias, which points `@hydra-sdk/cardano-wasm` at src/.
 * Replaces the manual `test-exports.js` / `test-exports.mjs` scripts.
 */
const pkgRoot = path.resolve(__dirname, '../..')
const built = ['index.node.js', 'index.node.mjs', 'index.asmjs.js', 'index.asmjs.mjs', 'index.mjs'].every(f =>
	existsSync(path.join(pkgRoot, 'dist', f))
)

const node = (code: string, { esm = false, conditions = [] as string[] } = {}): string =>
	execFileSync(
		process.execPath,
		[...conditions.map(c => `--conditions=${c}`), ...(esm ? ['--input-type=module'] : []), '-e', code],
		{ cwd: pkgRoot, encoding: 'utf8', stdio: 'pipe' }
	).trim()

const dist = (file: string) => path.join(pkgRoot, 'dist', file)
// u64::MAX — the largest value BigNum accepts; one more must be rejected.
const U64_MAX = '18446744073709551615'
const roundTrip = `[CardanoWASM.BigNum.from_str('${U64_MAX}').to_str(), (() => { try { CardanoWASM.BigNum.from_str('18446744073709551616'); return 'accepted' } catch { return 'rejected' } })()].join(' ')`

describe.skipIf(!built)(
	'cardano-wasm dist exports (skipped: run `pnpm --filter @hydra-sdk/cardano-wasm build` first)',
	() => {
		it('require() under the node condition resolves the Node.js CJS build and round-trips BigNum', () => {
			expect(node(`console.log(require.resolve('@hydra-sdk/cardano-wasm'))`)).toBe(dist('index.node.js'))
			expect(node(`const { CardanoWASM } = require('@hydra-sdk/cardano-wasm'); console.log(${roundTrip})`)).toBe(
				`${U64_MAX} rejected`
			)
			// Backed by the Node.js WASM build of CSL, not the browser or asm.js one.
			expect(
				node(
					`console.log(require('@hydra-sdk/cardano-wasm').CardanoWASM.BigNum === require('@emurgo/cardano-serialization-lib-nodejs').BigNum)`
				)
			).toBe('true')
		})

		it('import under the node condition resolves the Node.js ESM build and round-trips BigNum', () => {
			expect(node(`console.log(import.meta.resolve('@hydra-sdk/cardano-wasm'))`, { esm: true })).toBe(
				`file://${dist('index.node.mjs')}`
			)
			expect(
				node(`const { CardanoWASM } = await import('@hydra-sdk/cardano-wasm'); console.log(${roundTrip})`, { esm: true })
			).toBe(`${U64_MAX} rejected`)
			expect(
				node(
					`const [a, b] = await Promise.all([import('@hydra-sdk/cardano-wasm'), import('@emurgo/cardano-serialization-lib-nodejs')]); console.log(a.CardanoWASM.BigNum === b.BigNum)`,
					{ esm: true }
				)
			).toBe('true')
		})

		it('the browser condition resolves the browser build', () => {
			expect(
				node(`console.log(import.meta.resolve('@hydra-sdk/cardano-wasm'))`, { esm: true, conditions: ['browser'] })
			).toBe(`file://${dist('index.mjs')}`)
		})

		it('the /asmjs subpath resolves the asm.js build for require and import, and it works', () => {
			expect(node(`console.log(require.resolve('@hydra-sdk/cardano-wasm/asmjs'))`)).toBe(dist('index.asmjs.js'))
			expect(node(`console.log(import.meta.resolve('@hydra-sdk/cardano-wasm/asmjs'))`, { esm: true })).toBe(
				`file://${dist('index.asmjs.mjs')}`
			)
			expect(
				node(`const { CardanoWASM } = await import('@hydra-sdk/cardano-wasm/asmjs'); console.log(${roundTrip})`, {
					esm: true
				})
			).toBe(`${U64_MAX} rejected`)
			expect(
				node(
					`console.log(require('@hydra-sdk/cardano-wasm/asmjs').CardanoWASM.BigNum === require('@emurgo/cardano-serialization-lib-asmjs').BigNum)`
				)
			).toBe('true')
		})

		it('does not expose files outside the exports map', () => {
			expect(() => node(`require('@hydra-sdk/cardano-wasm/dist/index.node.js')`)).toThrow(/ERR_PACKAGE_PATH_NOT_EXPORTED/)
		})
	}
)
