import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { Converter, UTxOObject } from '@hydra-sdk/core'
import bigUtxoObj from '../__mocks__/big-utxo-object.json'

describe('Converter', () => {
	it('convertUTxOObjectToUTxO', () => {
		// @ts-ignore
		const utxoObj: UTxOObject = bigUtxoObj
		const start = performance.now()
		const utxo = Converter.convertUTxOObjectToUTxO(utxoObj)
		const end = performance.now()
		console.log(`Conversion took ${end - start} milliseconds`)
		expect(utxo).toBeDefined()
		expect(utxo.length).toBe(674)
		expect(end - start).toBeLessThan(60) // Ensure conversion takes less than 60 milliseconds
	})
})
