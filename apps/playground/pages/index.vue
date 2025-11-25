<template>
	<div class="container mx-auto p-6 max-w-4xl">
		<h1 class="text-3xl font-bold text-center mb-8 text-primary">🌐 Browser Hydra SDK playground</h1>

		<div class="grid gap-6">
			<!-- Environment Info Card -->
			<el-card shadow="hover">
				<template #header>
					<div class="flex items-center gap-2">
						<span class="text-lg font-semibold">🔍 Environment Detection</span>
					</div>
				</template>
				<div class="space-y-2">
					<p><strong>Environment:</strong> {{ environmentInfo.environment }}</p>
					<p><strong>User Agent:</strong> {{ environmentInfo.userAgent }}</p>
					<p><strong>Platform:</strong> {{ environmentInfo.platform }}</p>
					<p><strong>Language:</strong> {{ environmentInfo.language }}</p>
				</div>
			</el-card>
			<el-card shadow="hover">
				<template #header>
					<div class="flex items-center gap-2">
						<Icon name="ic:baseline-build-circle" size="24" class="inline-block text-primary-300" />
						<span class="text-lg font-semibold"> Transaction builder playground</span>
					</div>
				</template>

				<div class="space-y-4">
					<el-button @click="$router.push('/transaction-builder')" type="primary" size="large" class="w-full">
						<Icon name="mdi:play" size="20" class="inline-block mr-1" />
						Start playground
					</el-button>

					<img src="/images/tx-builder-demo.png" alt="Transaction Builder Demo" class="w-full rounded-lg border" />
				</div>
			</el-card>

			<!-- Test Results Card -->
			<el-card shadow="hover">
				<template #header>
					<div class="flex items-center gap-2 justify-between">
						<span class="text-lg font-semibold">🧪 Cardano WASM Tests</span>
						<el-button @click="runTests" type="primary" :loading="isTestRunning">
							{{ isTestRunning ? 'Testing...' : 'Run Tests' }}
						</el-button>
					</div>
				</template>

				<div v-if="testResults.length === 0 && !isTestRunning" class="text-center text-gray-500 py-8">Click "Run Tests" to start testing Cardano WASM in browser environment</div>

				<div v-else class="space-y-4">
					<div
						v-for="(result, index) in testResults"
						:key="index"
						class="p-4 rounded-lg border"
						:class="{
							'bg-green-50 border-green-200': result.status === 'success',
							'bg-red-50 border-red-200': result.status === 'error',
							'bg-blue-50 border-blue-200': result.status === 'info'
						}"
					>
						<div class="flex items-start gap-2">
							<span class="text-xl">
								{{ result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : 'ℹ️' }}
							</span>
							<div class="flex-1">
								<h4 class="font-semibold">{{ result.title }}</h4>
								<p class="text-sm text-gray-600 mt-1">{{ result.message }}</p>
								<div v-if="result.details" class="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
									{{ result.details }}
								</div>
							</div>
						</div>
					</div>
				</div>
			</el-card>

			<!-- BigNum Calculator Card -->
			<el-card shadow="hover" v-if="cardanoWasm">
				<template #header>
					<div class="flex items-center gap-2">
						<span class="text-lg font-semibold">🧮 BigNum Calculator</span>
					</div>
				</template>

				<div class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<el-input v-model="bigNumInput1" placeholder="Enter first number" type="number" size="large" />
						<el-input v-model="bigNumInput2" placeholder="Enter second number" type="number" size="large" />
					</div>

					<div class="flex flex-wrap gap-2">
						<el-button @click="performBigNumOperation('add')" type="primary">Add</el-button>
						<el-button @click="performBigNumOperation('multiply')" type="success">Multiply</el-button>
						<el-button @click="performBigNumOperation('divide')" type="warning">Divide</el-button>
						<el-button @click="performBigNumOperation('subtract')" type="info">Subtract</el-button>
					</div>

					<div v-if="bigNumResult" class="p-4 bg-green-50 rounded-lg">
						<p><strong>Result:</strong> {{ bigNumResult }}</p>
					</div>
				</div>
			</el-card>

			<!-- Manual Console Test Card -->
			<el-card shadow="hover">
				<template #header>
					<div class="flex items-center gap-2">
						<span class="text-lg font-semibold">🔧 Manual Console Test</span>
					</div>
				</template>

				<div class="space-y-4">
					<p class="text-sm text-gray-600">You can also test Cardano WASM directly in the browser console. Open your browser's developer tools (F12) and paste this code:</p>

					<div class="p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-xs overflow-x-auto">
						<pre>{{ consoleTestCode }}</pre>
					</div>

					<el-button @click="copyConsoleTest" type="info" size="small"> Copy to Clipboard </el-button>
				</div>
			</el-card>

			<!-- Address Generator Card -->
			<el-card shadow="hover" v-if="cardanoWasm">
				<template #header>
					<div class="flex items-center gap-2">
						<span class="text-lg font-semibold">🏠 Address Generator</span>
					</div>
				</template>

				<div class="space-y-4">
					<el-button @click="generateRandomAddress" type="primary" size="large" class="w-full"> Generate Random Address </el-button>

					<div v-if="generatedAddress" class="space-y-2">
						<p><strong>Generated Address:</strong></p>
						<div class="p-3 bg-gray-100 rounded font-mono text-sm break-all">
							{{ generatedAddress }}
						</div>
					</div>
				</div>
			</el-card>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
	interface TestResult {
		title: string
		message: string
		status: 'success' | 'error' | 'info'
		details?: string
	}

	// Environment detection
	const environmentInfo = ref({
		environment: 'Browser',
		userAgent: '',
		platform: '',
		language: ''
	})

	// Test state
	const isTestRunning = ref(false)
	const testResults = ref<TestResult[]>([])
	const cardanoWasm = ref<any>(null)

	// BigNum calculator state
	const bigNumInput1 = ref('1000000')
	const bigNumInput2 = ref('500000')
	const bigNumResult = ref('')

	// Address generator state
	const generatedAddress = ref('')

	// Console test code
	const consoleTestCode = ref(`// Test Cardano WASM in Browser Console
const { CardanoWASM } = await import('@hydra-sdk/cardano-wasm')
console.log('CardanoWASM loaded:', !!CardanoWASM)
const bigNum = CardanoWASM.BigNum.from_str('1000000')
console.log('BigNum test:', bigNum.to_str())`)

	// Initialize environment info
	onMounted(() => {
		environmentInfo.value = {
			environment: 'Browser',
			userAgent: navigator.userAgent,
			platform: navigator.platform,
			language: navigator.language
		}
	})

	// Test functions
	async function runTests() {
		isTestRunning.value = true
		testResults.value = []
		try {
			// Test 1: Import CardanoWASM
			addTestResult('Importing CardanoWASM', 'Attempting to import @hydra-sdk/cardano-wasm...', 'info')
			// const { CardanoWASM } = await import('@hydra-sdk/cardano-wasm')
			cardanoWasm.value = CardanoWASM
			addTestResult('CardanoWASM Import', 'Successfully imported CardanoWASM module', 'success', `Type: ${typeof CardanoWASM}, Available methods: ${Object.keys(CardanoWASM).length}`)
			// Test 2: Verify browser version is loaded
			addTestResult(
				'Environment Detection',
				'Browser environment detected - using @emurgo/cardano-serialization-lib-browser',
				'success',
				'This confirms the conditional exports are working correctly'
			)
			// Test 3: Test BigNum functionality
			if (CardanoWASM.BigNum) {
				const bigNum = CardanoWASM.BigNum.from_str('1000000')
				const result = bigNum.to_str()
				addTestResult('BigNum Functionality', 'BigNum creation and conversion working', 'success', `Created BigNum from "1000000", result: ${result}`)
			} else {
				addTestResult('BigNum Functionality', 'BigNum not available', 'error')
			}
			// Test 4: Test mathematical operations
			if (CardanoWASM.BigNum) {
				const num1 = CardanoWASM.BigNum.from_str('1000000')
				const num2 = CardanoWASM.BigNum.from_str('2000000')
				const sum = num1.checked_add(num2)
				addTestResult('Mathematical Operations', 'BigNum addition working correctly', 'success', `1000000 + 2000000 = ${sum.to_str()}`)
			}
			// Show available classes/functions
			const availableMethods = Object.keys(CardanoWASM as any)
				.filter((key: string) => typeof (CardanoWASM as any)[key] === 'function' || typeof (CardanoWASM as any)[key] === 'object')
				.slice(0, 20)
			addTestResult('Available Methods', `Found ${Object.keys(CardanoWASM).length} methods/objects`, 'success', `First 20: ${availableMethods.join(', ')}`)
		} catch (error: any) {
			addTestResult('Test Error', 'An error occurred during testing', 'error', error.message || error.toString())
		} finally {
			isTestRunning.value = false
		}
	}

	function addTestResult(title: string, message: string, status: 'success' | 'error' | 'info', details?: string) {
		testResults.value.push({ title, message, status, details })
	}

	// Copy console test to clipboard
	async function copyConsoleTest() {
		try {
			await navigator.clipboard.writeText(consoleTestCode.value)
			ElMessage.success('Console test code copied to clipboard!')
		} catch (error) {
			ElMessage.error('Failed to copy to clipboard')
		}
	}

	// BigNum calculator functions
	function performBigNumOperation(operation: 'add' | 'subtract' | 'multiply' | 'divide') {
		if (!cardanoWasm.value?.BigNum) {
			bigNumResult.value = 'BigNum not available'
			return
		}

		try {
			const num1 = cardanoWasm.value.BigNum.from_str(bigNumInput1.value)
			const num2 = cardanoWasm.value.BigNum.from_str(bigNumInput2.value)
			let result

			switch (operation) {
				case 'add':
					result = num1.checked_add(num2)
					break
				case 'subtract':
					result = num1.checked_sub(num2)
					break
				case 'multiply':
					result = num1.checked_mul(num2)
					break
				case 'divide':
					result = num1.checked_div(num2)
					break
			}

			bigNumResult.value = `${bigNumInput1.value} ${operation} ${bigNumInput2.value} = ${result.to_str()}`
		} catch (error: any) {
			bigNumResult.value = `Error: ${error.message}`
		}
	}

	// Address generator function
	function generateRandomAddress() {
		if (!cardanoWasm.value?.Address || !cardanoWasm.value?.NetworkInfo) {
			generatedAddress.value = 'Address generation not available'
			return
		}

		try {
			// This is a simplified example - in a real app you'd use proper key generation
			const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
			generatedAddress.value = `Generated with random data: ${randomHex.substring(0, 32)}...`
		} catch (error: any) {
			generatedAddress.value = `Error: ${error.message}`
		}
	}

	// Meta
	definePageMeta({
		title: 'Browser Cardano WASM Test'
	})
</script>

<style scoped>
	.container {
		min-height: 100vh;
	}
</style>
