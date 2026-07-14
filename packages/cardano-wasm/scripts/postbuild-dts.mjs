// tsup 6.7.0 emits a single `.d.ts` per entry, which ESM consumers
// (moduleResolution: node16/nodenext) interpret as CommonJS — the
// "Masquerading as CJS" problem. Duplicate each `.d.ts` to a `.d.mts`
// (interpreted as ESM) so the `import` export condition resolves ESM
// types that match the `.mjs` JavaScript.
import { readdirSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

let count = 0
for (const file of readdirSync(dist)) {
	if (file.endsWith('.d.ts')) {
		copyFileSync(join(dist, file), join(dist, file.slice(0, -'.d.ts'.length) + '.d.mts'))
		count++
	}
}

console.log(`postbuild-dts: generated ${count} .d.mts file(s) for ESM type resolution`)
