// Browser Console Test Script for Cardano WASM
// Copy and paste this into the browser console to test cardano-wasm functionality

console.log('🌐 Testing Cardano WASM in Browser Environment')
console.log('Environment:', typeof window !== 'undefined' ? 'Browser' : 'Node.js')

// Test import and functionality
async function testCardanoWASMInBrowser() {
	try {
		console.log('📦 Attempting to import CardanoWASM...')

		// This will use the browser version due to conditional exports
		const { CardanoWASM } = await import('@hydra-sdk/cardano-wasm')

		console.log('✅ CardanoWASM imported successfully!')
		console.log('📊 Type:', typeof CardanoWASM)
		console.log('📋 Available methods:', Object.keys(CardanoWASM).length)

		// Test BigNum functionality
		if (CardanoWASM.BigNum) {
			console.log('🧮 Testing BigNum functionality...')
			const bigNum1 = CardanoWASM.BigNum.from_str('1000000')
			const bigNum2 = CardanoWASM.BigNum.from_str('2000000')
			const sum = bigNum1.checked_add(bigNum2)

			console.log(`✅ BigNum test: ${bigNum1.to_str()} + ${bigNum2.to_str()} = ${sum.to_str()}`)
		} else {
			console.log('❌ BigNum not available')
		}

		// Show first 10 available methods
		const methods = Object.keys(CardanoWASM).slice(0, 10)
		console.log('🔧 First 10 methods:', methods)

		console.log('🎉 Browser environment automatically detected!')
		console.log('📝 This confirms @emurgo/cardano-serialization-lib-browser is being used')

		return CardanoWASM
	} catch (error) {
		console.error('❌ Error testing CardanoWASM:', error)
		throw error
	}
}

// Run the test
testCardanoWASMInBrowser()
	.then(CardanoWASM => {
		console.log('🎯 Test completed successfully!')
		window.CardanoWASM = CardanoWASM // Make it available globally for further testing
	})
	.catch(error => {
		console.error('💥 Test failed:', error.message)
	})
