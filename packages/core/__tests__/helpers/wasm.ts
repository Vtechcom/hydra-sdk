import { afterEach } from 'vitest'

type Freeable = { free(): void }

/**
 * Collects WASM objects created by a test and frees them after each test.
 * Call once per `describe` block: `const keep = wasmScope()` then `keep(CardanoWASM.X.new(...))`.
 */
export const wasmScope = () => {
	const objects: Freeable[] = []
	afterEach(() => {
		for (const obj of objects.splice(0).reverse()) {
			try {
				obj.free()
			} catch {
				/* already freed or consumed by CSL */
			}
		}
	})
	return <T extends Freeable | undefined>(obj: T): T => {
		if (obj) objects.push(obj)
		return obj
	}
}
