// Simple Node.js test for cardano-wasm
const { CardanoWASM } = require('../../packages/cardano-wasm/dist/index.node.js')

console.log('🚀 Testing Cardano WASM from built package')
console.log('CardanoWASM loaded:', !!CardanoWASM)
console.log('Type:', typeof CardanoWASM)

// Test basic functionality
if (CardanoWASM.BigNum) {
	try {
		const bigNum = CardanoWASM.BigNum.from_str('1000000')
		console.log('BigNum test successful:', bigNum.to_str())
	} catch (error) {
		console.error('BigNum test failed:', error.message)
	}
}

console.log('✅ Direct import test completed!')
