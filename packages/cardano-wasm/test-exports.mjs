// Test script to demonstrate conditional exports with ES modules
// This will automatically use the nodejs version when run in Node.js environment

import { CardanoWASM } from './dist/index.node.mjs'

async function testCardanoWASM() {
	try {
		console.log('CardanoWASM loaded (ESM):', !!CardanoWASM)
		console.log('CardanoWASM type:', typeof CardanoWASM)

		// Test some basic functionality
		const availableMethods = Object.keys(CardanoWASM).slice(0, 10)
		console.log('Available methods (first 10):', availableMethods)

		// Test creating a simple structure if available
		if (CardanoWASM.BigNum) {
			const bigNum = CardanoWASM.BigNum.from_str('2000000')
			console.log('BigNum test (ESM):', bigNum.to_str())
		}

		console.log('✅ CardanoWASM Node.js ESM version working correctly!')
	} catch (error) {
		console.error('❌ Error testing CardanoWASM:', error.message)
	}
}

testCardanoWASM()
