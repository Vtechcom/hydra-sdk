<template>
	<div class="transaction-example">
		<div class="example-header">
			<h3 class="example-title">Transaction Builder Demo</h3>
			<p class="example-description">Build and submit transactions using the transaction builder</p>
		</div>

		<div class="example-content">
			<div class="transaction-form">
				<div class="form-group">
					<label>Recipient Address</label>
					<input v-model="recipientAddress" type="text" placeholder="addr1..." class="form-input" />
				</div>

				<div class="form-group">
					<label>Amount (ADA)</label>
					<input v-model="amount" type="number" step="0.000001" min="1" placeholder="1.000000" class="form-input" />
				</div>

				<div class="form-group">
					<label>Transaction Type</label>
					<select v-model="txType" class="form-select">
						<option value="regular">Regular Transaction</option>
						<option value="hydra">Hydra Transaction</option>
					</select>
				</div>

				<button @click="buildTransaction" :disabled="!canBuild || building" class="btn btn-primary">
					{{ building ? 'Building...' : 'Build Transaction' }}
				</button>
			</div>

			<div v-if="transaction" class="transaction-result">
				<div class="result-section">
					<h4 class="result-title">Transaction Details</h4>
					<div class="result-grid">
						<div class="result-item">
							<label>Transaction ID:</label>
							<code class="tx-id">{{ transaction.txId }}</code>
						</div>
						<div class="result-item">
							<label>Size:</label>
							<span>{{ transaction.size }} bytes</span>
						</div>
						<div class="result-item">
							<label>Fee:</label>
							<span>{{ transaction.fee }} ADA</span>
						</div>
						<div class="result-item">
							<label>Type:</label>
							<span class="tx-type" :class="txTypeClass">{{ txType === 'hydra' ? 'Hydra' : 'Regular' }}</span>
						</div>
					</div>
				</div>

				<div class="result-section">
					<h4 class="result-title">Transaction CBOR</h4>
					<div class="cbor-display">
						<code class="cbor-hex">{{ transaction.cborHex }}</code>
						<button @click="copyCbor" class="copy-btn">
							<Icon name="lucide:copy" />
						</button>
					</div>
				</div>

				<div class="transaction-actions">
					<button @click="signTransaction" :disabled="signing" class="btn btn-secondary">
						{{ signing ? 'Signing...' : 'Sign Transaction' }}
					</button>
					<button @click="submitTransaction" :disabled="!signed || submitting" class="btn btn-success">
						{{ submitting ? 'Submitting...' : 'Submit Transaction' }}
					</button>
				</div>

				<div v-if="submitted" class="submission-result">
					<div class="success-message">
						<Icon name="lucide:check-circle" class="success-icon" />
						<span>Transaction submitted successfully!</span>
					</div>
				</div>
			</div>

			<div class="code-example">
				<ProseCode :code="transactionCode" language="typescript" filename="transaction-example.ts" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue'

	const { copy } = useClipboard()

	const recipientAddress = ref('addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp')
	const amount = ref(1.5)
	const txType = ref('regular')
	const building = ref(false)
	const signing = ref(false)
	const submitting = ref(false)
	const transaction = ref<any>(null)
	const signed = ref(false)
	const submitted = ref(false)

	const canBuild = computed(() => {
		return recipientAddress.value && amount.value > 0
	})

	const txTypeClass = computed(() => ({
		'tx-regular': txType.value === 'regular',
		'tx-hydra': txType.value === 'hydra'
	}))

	const buildTransaction = async () => {
		building.value = true

		try {
			await new Promise(resolve => setTimeout(resolve, 1500))

			transaction.value = {
				txId: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
				size: 285,
				fee: 0.17,
				cborHex: '84a400818258201234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00018282581d60' + Math.random().toString(16).substring(2, 50) + '...'
			}
			signed.value = false
			submitted.value = false
		} finally {
			building.value = false
		}
	}

	const signTransaction = async () => {
		signing.value = true

		try {
			await new Promise(resolve => setTimeout(resolve, 1000))
			signed.value = true
		} finally {
			signing.value = false
		}
	}

	const submitTransaction = async () => {
		submitting.value = true

		try {
			await new Promise(resolve => setTimeout(resolve, 2000))
			submitted.value = true
		} finally {
			submitting.value = false
		}
	}

	const copyCbor = () => {
		copy(transaction.value.cborHex)
	}

	const transactionCode = computed(() =>
		`
import { TxBuilder } from '@hydra-sdk/transaction'
import { AppWallet } from '@hydra-sdk/core'

// Create transaction builder
const txBuilder = new TxBuilder({
  isHydra: ${txType.value === 'hydra'},
  params: protocolParameters
})

// Build transaction
const tx = await txBuilder
  .setInputs(inputUtxos)
  .addLovelaceOutput('${recipientAddress.value}', '${(amount.value * 1000000).toString()}')
  .setChangeAddress(changeAddress)
  .complete()

// Get transaction details
const txId = tx.transaction_hash().to_hex()
const cborHex = tx.to_hex()
const size = cborHex.length / 2

console.log('Transaction ID:', txId)
console.log('Transaction size:', size, 'bytes')

// Sign transaction
const signedTx = await wallet.signTx(cborHex, false, 0, 0)

// Submit transaction
${
	txType.value === 'hydra'
		? `
// Submit to Hydra Head
const result = await bridge.submitTxSync({
  txId,
  cborHex: signedTx,
  description: 'Payment transaction',
  type: 'Witnessed Tx ConwayEra'
}, { timeout: 30000 })
`
		: `
// Submit to Cardano network
const result = await submitToCardano(signedTx)
`
}

console.log('Transaction submitted:', result)
`.trim()
	)
</script>

<style scoped>
	.transaction-example {
		@apply overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700;
	}

	.example-header {
		@apply border-b border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800;
	}

	.example-title {
		@apply text-lg font-semibold text-gray-700 dark:text-gray-300;
	}

	.example-description {
		@apply mt-1 text-sm text-gray-600 dark:text-gray-400;
	}

	.example-content {
		@apply space-y-6 p-6;
	}

	.transaction-form {
		@apply space-y-4;
	}

	.form-group {
		@apply space-y-2;
	}

	.form-group label {
		@apply block text-sm font-medium text-gray-700 dark:text-gray-300;
	}

	.form-input,
	.form-select {
		@apply bg-white w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300;
	}

	.btn {
		@apply rounded-md px-4 py-2 font-medium transition-colors;
	}

	.btn-primary {
		@apply text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50;
	}

	.btn-secondary {
		@apply text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50;
	}

	.btn-success {
		@apply text-white bg-green-600 hover:bg-green-700 disabled:opacity-50;
	}

	.transaction-result {
		@apply space-y-4;
	}

	.result-section {
		@apply space-y-3;
	}

	.result-title {
		@apply text-base font-medium text-gray-700 dark:text-gray-300;
	}

	.result-grid {
		@apply space-y-2;
	}

	.result-item {
		@apply flex items-center gap-2;
	}

	.result-item label {
		@apply min-w-[100px] text-sm font-medium text-gray-600 dark:text-gray-400;
	}

	.tx-id {
		@apply break-all rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-800;
	}

	.tx-type {
		@apply rounded px-2 py-1 text-xs font-medium;
	}

	.tx-regular {
		@apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200;
	}

	.tx-hydra {
		@apply bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200;
	}

	.cbor-display {
		@apply flex items-start gap-2;
	}

	.cbor-hex {
		@apply flex-1 break-all rounded bg-gray-100 px-3 py-2 font-mono text-xs dark:bg-gray-800;
	}

	.copy-btn {
		@apply rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800;
	}

	.transaction-actions {
		@apply flex items-center gap-3;
	}

	.submission-result {
		@apply mt-4;
	}

	.success-message {
		@apply flex items-center gap-2 text-green-600 dark:text-green-400;
	}

	.success-icon {
		@apply h-5 w-5;
	}
</style>
