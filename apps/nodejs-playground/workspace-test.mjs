// ES Module test for cardano-wasm workspace dependency
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

console.log('🚀 Testing Cardano WASM from workspace dependency (ESM)')
console.log('CardanoWASM loaded:', !!CardanoWASM)
console.log('Type:', typeof CardanoWASM)

// Test basic functionality
if (CardanoWASM.BigNum) {
	try {
		const bigNum = CardanoWASM.BigNum.from_str('2000000')
		console.log('BigNum test successful:', bigNum.to_str())
		console.log('✅ Workspace dependency test completed!')
	} catch (error) {
		console.error('BigNum test failed:', error.message)
	}
} else {
	console.log('BigNum not available')
	console.log('Available methods:', Object.keys(CardanoWASM).slice(0, 10))
}
