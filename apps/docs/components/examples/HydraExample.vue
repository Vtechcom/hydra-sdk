<template>
	<div class="hydra-example">
		<div class="example-header">
			<h3 class="example-title">Hydra Bridge Demo</h3>
			<p class="example-description">Connect to Hydra Node and manage Hydra Head lifecycle</p>
		</div>

		<div class="example-content">
			<div class="controls">
				<button @click="connectToHydra" :disabled="loading || connected" class="btn btn-primary">
					{{ loading ? 'Connecting...' : connected ? 'Connected' : 'Connect to Hydra' }}
				</button>

				<div v-if="connected" class="hydra-controls">
					<button @click="initHead" :disabled="headStatus !== 'Idle'" class="btn btn-secondary">Init Head</button>
					<button @click="closeHead" :disabled="headStatus !== 'Open'" class="btn btn-warning">Close Head</button>
					<button @click="finalizeHead" :disabled="headStatus === 'Final'" class="btn btn-danger">Finalize Head</button>
				</div>
			</div>

			<div v-if="connected" class="hydra-status">
				<div class="status-section">
					<h4 class="status-title">Connection Status</h4>
					<div class="status-grid">
						<div class="status-item">
							<label>Status:</label>
							<span class="status-badge" :class="statusClass">{{ connected ? 'Connected' : 'Disconnected' }}</span>
						</div>
						<div class="status-item">
							<label>Head Status:</label>
							<span class="head-status" :class="headStatusClass">{{ headStatus }}</span>
						</div>
						<div class="status-item">
							<label>Head ID:</label>
							<code class="head-id">{{ headId || 'N/A' }}</code>
						</div>
					</div>
				</div>

				<div class="events-section">
					<h4 class="events-title">Recent Events</h4>
					<div class="events-list">
						<div v-for="event in recentEvents" :key="event.id" class="event-item">
							<span class="event-time">{{ event.time }}</span>
							<span class="event-type">{{ event.type }}</span>
							<span class="event-message">{{ event.message }}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="code-example">
				<ProseCode :code="hydraCode" language="typescript" filename="hydra-example.ts" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue'

	const loading = ref(false)
	const connected = ref(false)
	const headStatus = ref('Idle')
	const headId = ref('')
	const recentEvents = ref<any[]>([])

	const statusClass = computed(() => ({
		'status-connected': connected.value,
		'status-disconnected': !connected.value
	}))

	const headStatusClass = computed(() => ({
		'head-idle': headStatus.value === 'Idle',
		'head-initializing': headStatus.value === 'Initializing',
		'head-open': headStatus.value === 'Open',
		'head-closed': headStatus.value === 'Closed',
		'head-final': headStatus.value === 'Final'
	}))

	const addEvent = (type: string, message: string) => {
		const event = {
			id: Date.now(),
			time: new Date().toLocaleTimeString(),
			type,
			message
		}
		recentEvents.value.unshift(event)
		if (recentEvents.value.length > 10) {
			recentEvents.value.pop()
		}
	}

	const connectToHydra = async () => {
		loading.value = true

		try {
			await new Promise(resolve => setTimeout(resolve, 1500))
			connected.value = true
			headId.value = 'head_1234567890abcdef'
			addEvent('Connection', 'Connected to Hydra Node')
			addEvent('Greetings', 'Received greeting from Hydra Node')
		} finally {
			loading.value = false
		}
	}

	const initHead = async () => {
		headStatus.value = 'Initializing'
		addEvent('Command', 'Initializing Hydra Head')

		await new Promise(resolve => setTimeout(resolve, 2000))
		headStatus.value = 'Open'
		addEvent('HeadIsOpen', 'Hydra Head is now open')
	}

	const closeHead = async () => {
		headStatus.value = 'Closed'
		addEvent('Command', 'Closing Hydra Head')

		await new Promise(resolve => setTimeout(resolve, 1500))
		headStatus.value = 'Final'
		addEvent('HeadIsClosed', 'Hydra Head is closed')
	}

	const finalizeHead = async () => {
		headStatus.value = 'Final'
		addEvent('Command', 'Finalizing Hydra Head')
		addEvent('HeadIsFinalized', 'Hydra Head finalized')
	}

	const hydraCode = computed(() =>
		`
import { HydraBridge, HexcoreConnector } from '@hydra-sdk/bridge'

// Create connector
const connector = new HexcoreConnector({
  socketIoUrl: 'wss://your-hydra-api.com/hydra',
  socketIoOptions: {
    auth: { token: 'your_jwt_token' }
  }
})

// Initialize bridge
const bridge = new HydraBridge({ connector })

// Connect and listen to events
bridge.connect()

bridge.events.on('onConnected', () => {
  console.log('Connected to Hydra Node')
})

bridge.events.on('onMessage', (payload) => {
  console.log('Hydra event:', payload.tag)
  
  switch (payload.tag) {
    case 'HeadIsOpen':
      console.log('Head is open and ready')
      break
    case 'TxValid':
      console.log('Transaction confirmed')
      break
  }
})

// Hydra Head commands
bridge.commands.init()     // Initialize head
bridge.commands.close()    // Close head
bridge.commands.safeClose() // Close only if no non-ADA assets
`.trim()
	)
</script>

<style scoped>
	.hydra-example {
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
		@apply flex flex-wrap items-center gap-4;
	}

	.hydra-controls {
		@apply flex items-center gap-2;
	}

	.btn {
		@apply rounded-md px-4 py-2 text-sm font-medium transition-colors;
	}

	.btn-primary {
		@apply text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50;
	}

	.btn-secondary {
		@apply text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50;
	}

	.btn-warning {
		@apply text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50;
	}

	.btn-danger {
		@apply text-white bg-red-600 hover:bg-red-700 disabled:opacity-50;
	}

	.hydra-status {
		@apply space-y-4;
	}

	.status-section,
	.events-section {
		@apply space-y-3;
	}

	.status-title,
	.events-title {
		@apply text-base font-medium text-gray-700 dark:text-gray-300;
	}

	.status-grid {
		@apply space-y-2;
	}

	.status-item {
		@apply flex items-center gap-2;
	}

	.status-item label {
		@apply min-w-[100px] text-sm font-medium text-gray-600 dark:text-gray-400;
	}

	.status-badge {
		@apply rounded px-2 py-1 text-xs font-medium;
	}

	.status-connected {
		@apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
	}

	.status-disconnected {
		@apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
	}

	.head-status {
		@apply rounded px-2 py-1 text-xs font-medium;
	}

	.head-idle {
		@apply bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200;
	}

	.head-initializing {
		@apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200;
	}

	.head-open {
		@apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
	}

	.head-closed,
	.head-final {
		@apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
	}

	.head-id {
		@apply rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-800;
	}

	.events-list {
		@apply max-h-48 space-y-1 overflow-y-auto;
	}

	.event-item {
		@apply flex items-center gap-3 rounded bg-gray-50 p-2 text-sm dark:bg-gray-800;
	}

	.event-time {
		@apply min-w-[80px] font-mono text-xs text-gray-500 dark:text-gray-400;
	}

	.event-type {
		@apply min-w-[120px] font-medium text-blue-600 dark:text-blue-400;
	}

	.event-message {
		@apply text-gray-700 dark:text-gray-300;
	}
</style>
