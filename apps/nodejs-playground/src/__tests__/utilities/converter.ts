import { Converter, UTxO, UTxOObject } from '@hydra-sdk/core'
import bigUtxoObj from '../__mocks__/big-utxo-object.json'
;(function testConvertUTxOToUTxOObject() {
	// the big-utxo-object.json file to __mocks__ folder
	// And see the performance of the conversion

	console.log('--- Starting testConvertUTxOToUTxOObject ---')

	const utxos = Converter.convertUTxOObjectToUTxO(bigUtxoObj as unknown as UTxOObject)

	const results = []
	// Run multiple times to see the average time
	// because the first time will be slower due to JIT compilation
	for (let i = 0; i < 50; i++) {
		const start = performance.now()
		const convertedUtxoObj = Converter.convertUTxOToUTxOObject(utxos)
		const end = performance.now()
		const time = end - start
		results.push(time)
	}
	console.log('Results (ms):', results)
})()
;(function testConvertUtxoObjectToUTxO() {
	// the big-utxo-object.json file to __mocks__ folder
	console.log('--- Starting testConvertUtxoObjectToUTxO ---')
	// And see the performance of the conversion
	const results = []
	// Run multiple times to see the average time
	// because the first time will be slower due to JIT compilation
	for (let i = 0; i < 50; i++) {
		const utxoObj: UTxOObject = bigUtxoObj as unknown as UTxOObject
		const start = performance.now()
		const utxos = Converter.convertUTxOObjectToUTxO(utxoObj)
		const end = performance.now()
		const time = end - start
		results.push(time)
	}
	console.log('Results (ms):', results)
})()
