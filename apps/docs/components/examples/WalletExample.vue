<template>
	<div class="wallet-example">
		<div class="example-header">
			<h3 class="example-title">Interactive Wallet Demo</h3>
			<p class="example-description">Create and manage Cardano wallets using the Hydra SDK</p>
		</div>

		<div class="example-content">
			<div class="controls">
				<button @click="createWallet" :disabled="loading" class="btn btn-primary">
					{{ loading ? 'Creating...' : 'Create New Wallet' }}
				</button>

				<div v-if="wallet" class="wallet-controls">
					<select v-model="selectedNetwork" @change="switchNetwork" class="network-select">
						<option value="0">Testnet</option>
						<option value="1">Mainnet</option>
					</select>
				</div>
			</div>

			<div v-if="wallet" class="wallet-info">
				<div class="info-section">
					<h4 class="info-title">Wallet Information</h4>
					<div class="info-grid">
						<div class="info-item">
							<label>Network:</label>
							<span>{{ selectedNetwork === '0' ? 'Testnet' : 'Mainnet' }}</span>
						</div>
						<div class="info-item">
							<label>Mnemonic:</label>
							<div class="mnemonic-display">
								<code class="mnemonic-words">{{ mnemonic }}</code>
								<button @click="copyMnemonic" class="copy-btn">
									<Icon name="lucide:copy" />
								</button>
							</div>
						</div>
					</div>
				</div>

				<div class="info-section">
					<h4 class="info-title">Account Addresses</h4>
					<div class="addresses">
						<div class="address-item">
							<label>Base Address:</label>
							<code class="address">{{ account?.baseAddressBech32 }}</code>
						</div>
						<div class="address-item">
							<label>Enterprise Address:</label>
							<code class="address">{{ account?.enterpriseAddressBech32 }}</code>
						</div>
						<div class="address-item">
							<label>Stake Address:</label>
							<code class="address">{{ account?.stakeAddressBech32 }}</code>
						</div>
					</div>
				</div>
			</div>

			<div class="code-example">
				<ProseCode :code="walletCode" language="typescript" filename="wallet-example.ts" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue'

	const { copy } = useClipboard()

	const loading = ref(false)
	const wallet = ref<any>(null)
	const mnemonic = ref('')
	const selectedNetwork = ref('0')
	const account = ref<any>(null)

	const createWallet = async () => {
		loading.value = true

		try {
			// Simulate wallet creation
			await new Promise(resolve => setTimeout(resolve, 1000))

			// Generate mock mnemonic
			mnemonic.value = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

			// Create mock wallet and account
			wallet.value = { networkId: parseInt(selectedNetwork.value) }
			account.value = {
				baseAddressBech32: 'addr_test1qz...',
				enterpriseAddressBech32: 'addr_test1vz...',
				stakeAddressBech32: 'stake_test1uz...'
			}
		} finally {
			loading.value = false
		}
	}

	const switchNetwork = () => {
		if (wallet.value) {
			wallet.value.networkId = parseInt(selectedNetwork.value)
			// Update addresses based on network
			account.value = {
				baseAddressBech32: selectedNetwork.value === '0' ? 'addr_test1qz...' : 'addr1qx...',
				enterpriseAddressBech32: selectedNetwork.value === '0' ? 'addr_test1vz...' : 'addr1vx...',
				stakeAddressBech32: selectedNetwork.value === '0' ? 'stake_test1uz...' : 'stake1ux...'
			}
		}
	}

	const copyMnemonic = () => {
		copy(mnemonic.value)
	}

	const walletCode = computed(() =>
		`
import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'

// Create new wallet
const mnemonic = AppWallet.brew() // Generate new mnemonic
const wallet = new AppWallet({
  networkId: NETWORK_ID.${selectedNetwork.value === '0' ? 'PREPROD' : 'MAINNET'},
  key: {
    type: 'mnemonic',
    words: mnemonic
  }
})

// Get account
const account = wallet.getAccount(0, 0)
console.log('Base Address:', account.baseAddressBech32)
console.log('Enterprise Address:', account.enterpriseAddressBech32)
console.log('Stake Address:', account.stakeAddressBech32)
`.trim()
	)
</script>

<style scoped>
	.wallet-example {
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

	.controls {
		@apply flex items-center gap-4;
	}

	.btn {
		@apply rounded-md px-4 py-2 font-medium transition-colors;
	}

	.btn-primary {
		@apply text-white bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50;
	}

	.network-select {
		@apply bg-white rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800;
	}

	.wallet-info {
		@apply space-y-4;
	}

	.info-section {
		@apply space-y-3;
	}

	.info-title {
		@apply text-base font-medium text-gray-700 dark:text-gray-300;
	}

	.info-grid {
		@apply space-y-2;
	}

	.info-item {
		@apply flex items-center gap-2;
	}

	.info-item label {
		@apply min-w-[100px] text-sm font-medium text-gray-600 dark:text-gray-400;
	}

	.mnemonic-display {
		@apply flex items-center gap-2;
	}

	.mnemonic-words {
		@apply rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-800;
	}

	.copy-btn {
		@apply rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800;
	}

	.addresses {
		@apply space-y-2;
	}

	.address-item {
		@apply flex flex-col gap-1;
	}

	.address-item label {
		@apply text-sm font-medium text-gray-600 dark:text-gray-400;
	}

	.address {
		@apply break-all rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-800;
	}

	.code-example {
		@apply mt-6;
	}
</style>
