<template>
	<el-card class="w-full h-full flex flex-col">
		<!-- Header -->
		<div class="flex items-center gap-2 mb-4">
			<el-input v-model="wsUrl" placeholder="wss://example.com/socket" size="small" class="flex-1" />
			<el-button type="primary" size="small" @click="toggleConnection">
				{{ isConnected ? 'Disconnect' : 'Connect' }}
			</el-button>
		</div>

		<!-- Message List -->
		<div class="flex-1 overflow-hidden border rounded">
			<DynamicScroller :items="messages" :min-item-size="60" key-field="id" class="h-full overflow-auto max-h-80 min-h-80 p-4">
				<template #default="{ item, index, active }">
					<DynamicScrollerItem :item="item" :active="active" :data-index="index">
						<div class="pb-1">
							<el-collapse v-model="activeMessages" class="border border-solid">
								<el-collapse-item :name="item.id">
									<template #title>
										<span class="text-xs text-gray-500 ml-2">{{ formatTime(item.time) }}</span>
										<span class="ml-2" :class="item.type === 'sent' ? 'text-green-500' : 'text-blue-500'">
											{{ item.type }}
										</span>
										<span class="text-xs text-gray-500 ml-2">{{ String(item.data).slice(0, 80) }}{{ String(item.data).length > 20 ? '...' : '' }}</span>
									</template>
									<div class="max-h-[320px] overflow-auto">
										<span v-html="highlightCode(item.data, 'json')" class=""></span>
									</div>
								</el-collapse-item>
							</el-collapse>
						</div>
					</DynamicScrollerItem>
				</template>
			</DynamicScroller>
		</div>

		<!-- Send box -->
		<div class="mt-4 flex gap-2">
			<el-input v-model="sendText" type="textarea" placeholder="Type message..." :rows="2" size="small" />
			<el-button type="success" size="small" @click="sendMessage" :disabled="!isConnected || !sendText.trim()"> Send </el-button>
		</div>
	</el-card>
</template>

<script setup lang="ts">
	import { ref } from 'vue'

	interface WSMessage {
		id: number
		type: 'received' | 'sent'
		data: string
		time: Date
	}

	const wsUrl = ref('wss://node-10022.hydranode.io.vn') // default demo server
	const isConnected = ref(false)
	const ws = ref<WebSocket | null>(null)

	const messages = ref<WSMessage[]>([])
	const activeMessages = ref<(number | string)[]>([])

	const sendText = ref('')
	let messageId = 0

	function toggleConnection() {
		if (!isConnected.value) {
			connectWS()
		} else {
			disconnectWS()
		}
	}

	function connectWS() {
		try {
			ws.value = new WebSocket(wsUrl.value)
			ws.value.onopen = () => {
				isConnected.value = true
			}
			ws.value.onmessage = event => {
				addMessage('received', event.data)
			}
			ws.value.onclose = () => {
				isConnected.value = false
				ws.value = null
			}
			ws.value.onerror = err => {
				console.error('WS Error', err)
			}
		} catch (e) {
			console.error('Failed to connect', e)
		}
	}

	function disconnectWS() {
		ws.value?.close()
	}

	function sendMessage() {
		if (ws.value && isConnected.value) {
			ws.value.send(sendText.value)
			addMessage('sent', sendText.value)
			sendText.value = ''
		}
	}

	function addMessage(type: 'received' | 'sent', data: string) {
		messages.value.push({
			id: ++messageId,
			type,
			data,
			time: new Date()
		})
	}

	function formatTime(date: Date) {
		return date.toLocaleTimeString()
	}
	const highlighter = await getShikiHighlighter()
	function highlightCode(code: string, language: string) {
		return highlighter.highlight(code, {
			lang: language,
			theme: 'github-light'
		})
	}
</script>

<style scoped>
	/* optional custom style */
</style>
