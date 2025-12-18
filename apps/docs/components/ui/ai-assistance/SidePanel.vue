<script lang="ts" setup>
	import { ref, watch, nextTick } from 'vue'
	import { cn } from '~/lib/utils'

	const { visiblePanel, messages, inputText, loading, answer, sendMessage, clearMessages, addMessage } = useHydraAssistance()

	const container = ref<HTMLElement | null>(null)

	// scroll to bottom when messages change
	watch(
		() => messages.value.length,
		async () => {
			await nextTick()
			if (container.value) {
				container.value.scrollTop = container.value.scrollHeight
			}
		}
	)

	const mockChunk = useMockChunk()
	async function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			const text = (inputText.value || '').trim()
			if (!text || loading.value) return
			loading.value = true

			inputText.value = ''
			addMessage('user', text)
			// simulate AI response

			answer.value = ''
			let chunk: string | null = null
			do {
				chunk = await mockChunk.getNextChunk()
				if (chunk === null) {
					mockChunk.reset()
					break
				}
				if (chunk) {
					answer.value += chunk
					loading.value = false
				}
			} while (chunk)

			// addMessage('assistant', `test`)

			inputText.value = ''
			loading.value = false
			addMessage('assistant', answer.value)
			answer.value = ''
		}
	}

	function closePanel() {
		visiblePanel.value = false
	}

	function onClear() {
		clearMessages()
	}
</script>

<template>
	<div :style="{ width: visiblePanel ? '450px' : '0' }" class="sticky top-16 h-[calc(100vh-4rem)] shrink-0 overflow-x-hidden bg-gray-25 transition-all dark:bg-gray-900">
		<div class="h-full w-[450px] border-l border-l-gray-400">
			<div class="flex h-full flex-col p-1">
				<div class="header relative flex w-full shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
					<div>
						<p class="text-sm font-bold">Hydra AI</p>
						<p class="text-xs">AI can be inaccurate, please verify the information.</p>
					</div>
					<div class="flex items-center gap-2">
						<button class="text-xs text-gray-500 hover:text-gray-700" @click="onClear">Clear</button>
						<button @click="closePanel" class="flex rounded-sm p-0.5 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800">
							<Icon name="mdi:close" size="16" class="hover:cursor-pointer" />
						</button>
					</div>
				</div>

				<div class="flex grow flex-col overflow-hidden">
					<div v-if="!messages || messages.length === 0" class="p-2 text-center text-sm text-gray-500 dark:text-gray-400">No messages yet. Ask me!</div>
					<div ref="container" class="flex grow flex-col gap-3 overflow-y-auto scroll-smooth p-3">
						<div v-for="msg in messages" :key="msg.id" :class="cn(['flex', msg.role === 'user' ? 'justify-end' : 'justify-start'])">
							<UiAiAssistanceMessageItem :role="msg.role" :content="msg.content" :createdAt="msg.createdAt" />
						</div>
						<div class="flex items-center" v-if="loading">
							<div class="animation-thinking max-w-[80%]">
								<div class="rounded bg-gray-100 px-3 py-2 text-gray-600 dark:bg-gray-800">Thinking...</div>
							</div>
						</div>
						<div v-if="answer" class="flex justify-start">
							<UiAiAssistanceMessageItem role="assistant" :content="answer" :isDone="!loading" />
						</div>
					</div>
				</div>

				<div class="flex shrink-0 flex-col items-center rounded border border-gray-300 bg-white-100 p-2 dark:bg-gray-800">
					<div class="flex w-full items-start gap-2">
						<UTextarea
							v-model:modelValue="inputText"
							:padded="false"
							id="input-ask-ai"
							:maxrows="4"
							autoresize
							placeholder="Ask Hydra AI..."
							variant="none"
							class="row-start-1 shrink-0 grow p-1 pb-6"
							@keydown="onKeydown"
						/>
						<UButton @click="sendMessage" icon="ic:round-send" size="sm" color="violet" class="-rotate-45 gap-0 rounded-full p-1.5" variant="ghost" label="" :trailing="false" />
					</div>
					<div class="mt-1 flex w-full justify-between text-xs text-gray-500">
						<div>Press Enter to send • Shift+Enter for newline</div>
						<div v-if="loading">Sending…</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
	/* minimal tweaks to ensure nice spacing */
	@keyframes rotation {
		0% {
			transform: translate(-50%, -50%) rotate(0deg);
		}
		50% {
			transform: translate(-50%, -50%) rotate(180deg);
		}
		100% {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}
	.animation-thinking {
		position: relative;
		overflow: hidden;
		box-shadow: 2px 2px 6px 1px #1cead26c;
		padding: 3px;
		border-radius: 6px;

		&::before {
			content: '';
			z-index: -1;
			display: inline-block;
			position: absolute;
			top: 50%;
			left: 50%;

			width: 200%;
			height: 300%;

			transform: translate(-50%, -50%);
			background: linear-gradient(#ea69fe, #2cffe6);
			transform-origin: center;
			animation: rotation 2s linear infinite;
		}
	}
</style>
