<script lang="ts" setup>
	import { ref, watch, nextTick } from 'vue'
	import { cn } from '~/lib/utils'

	const { visiblePanel, messages, inputText, loading, answer, relatedDocs, clearMessages, addMessage, askStream } = useHydraAssistance()

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

	function scrollToBottom() {
		if (container.value) {
			container.value.scrollTop = container.value.scrollHeight
		}
	}

	async function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			await sendMessage()
		}
	}

	async function sendMessage() {
		const text = (inputText.value || '').trim()
		if (!text || loading.value) return
		loading.value = true

		inputText.value = ''
		addMessage('user', text)
		await nextTick()
		await new Promise(resolve => setTimeout(resolve, 100)) // slight delay to ensure UI updates
		scrollToBottom()

		// Ask the AI and handle streaming response

		await askStream(`${text}`, {
			onToken: (text: string) => {
				answer.value += text
				loading.value = false
			},
			onDone: () => {
				addMessage('assistant', answer.value)
				loading.value = false
				answer.value = ''

				setTimeout(() => {
					scrollToBottom()
				}, 100)
			},
			onSources: sources => {
				console.log('Sources:', sources)
				relatedDocs.value = (sources || [])
					.map(doc => {
						const parseUrl =
							doc.lang === 'en'
								? doc.url
										.replace('/docs/en', '') //
										.replace('index.md', '') //
								: doc.url
										.replace('/docs', '') //
										.replace('index.md', '') //
						return {
							title: doc.title,
							url: parseUrl,
							lang: doc.lang
						}
					})
					.filter(doc => {
						return doc.title && doc.url && useRouter().resolve(doc.url)
					})
			}
		})
	}

	function closePanel() {
		visiblePanel.value = false
	}

	function onClear() {
		clearMessages()
		relatedDocs.value = []
	}
</script>

<template>
	<div :style="{ width: visiblePanel ? '450px' : '0' }" class="sticky top-16 h-[calc(100vh-4rem)] shrink-0 overflow-x-hidden bg-gray-25 transition-all dark:bg-gray-900">
		<div class="h-full w-[450px] border-l border-l-gray-300 dark:border-l-gray-700">
			<div class="flex h-full flex-col p-1">
				<div class="header relative flex w-full shrink-0 items-end justify-between gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
					<div class="text-gray-700 dark:text-gray-300">
						<p class="text-sm font-bold">
							Hydra AI
							<span class="text-xs font-semibold text-gray-400">(beta)</span>
						</p>
						<p class="text-xs">AI can be inaccurate, please verify the information.</p>
					</div>
					<button @click="closePanel" class="absolute right-0 top-0 flex rounded-sm p-0.5 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800">
						<Icon name="mdi:close" size="16" class="hover:cursor-pointer" />
					</button>
					<div class="flex items-center gap-2">
						<button class="rounded-sm bg-gray-200 px-1.5 py-0 text-xs text-gray-500 hover:text-gray-700 dark:bg-gray-700 dark:text-gray-300" @click="onClear">Clear Chat</button>
					</div>
				</div>

				<div class="flex grow flex-col overflow-hidden">
					<div ref="container" class="flex grow flex-col gap-3 overflow-y-auto scroll-smooth px-0 py-3">
						<div v-if="!messages || messages.length === 0" class="flex h-full flex-col items-center justify-center p-2 text-center text-sm text-gray-500 dark:text-gray-400">
							<p class="">No messages yet. Ask me!</p>
							<div class="">
								<Icon name="tabler:sparkles" size="48" class="mt-2 text-fuchsia-400" />
							</div>
						</div>
						<template v-else="messages && messages.length > 0">
							<div v-for="msg in messages" :key="msg.id" :class="cn(['flex', msg.role === 'user' ? 'justify-end' : 'justify-start'])">
								<UiAiAssistanceMessageItem :role="msg.role" :content="msg.content" :createdAt="msg.createdAt" />
							</div>
						</template>
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

				<div class="flex shrink-0 flex-col items-center rounded border border-gray-300 bg-white-100 p-2 dark:border-gray-700 dark:bg-gray-800">
					<div class="relative mb-4 w-full border-b border-gray-300 pb-2 dark:border-gray-700" v-if="relatedDocs?.length">
						<button @click="relatedDocs = []" class="absolute right-0 top-0 flex rounded-sm p-0.5 hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800">
							<Icon name="mdi:close" size="16" class="hover:cursor-pointer" />
						</button>
						<div class="mb-1 text-gray-600 dark:text-gray-300">Related Documents:</div>
						<ul class="flex flex-wrap items-center gap-x-1 gap-y-1">
							<li v-for="(doc, index) in relatedDocs" :key="index" class="flex items-center rounded-sm bg-gray-200 p-1 dark:bg-gray-700">
								<NuxtLink v-html="md.render(doc.title || '')" :to="doc.url" class="text-[10px] leading-3 text-violet-600 hover:underline dark:text-violet-400"> </NuxtLink>
								<Icon name="mdi:open-in-new" size="10" class="ml-0.5 text-gray-500" />
							</li>
						</ul>
					</div>
					<div class="flex w-full items-start gap-2">
						<UTextarea
							v-model:modelValue="inputText"
							:padded="false"
							id="input-ask-ai"
							:rows="2"
							:maxrows="4"
							autoresize
							placeholder="Ask Hydra AI..."
							variant="none"
							class="row-start-1 shrink-0 grow p-1 pb-6 text-sm"
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
