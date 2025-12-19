export type ChatMessage = {
	id: string
	role: 'user' | 'assistant' | 'system'
	content: string
	createdAt: string
}

export type StreamMessage =
	| {
			type: 'token'
			data: string
	  }
	| {
			type: 'done'
			data: null
	  }
	| {
			type: 'sources'
			data: {
				title: string
				url: string
				lang: string
			}[]
	  }

export const useHydraAssistance = () => {
	const visiblePanel = useState('visiblePanel', () => false)
	const messages = useSessionStorage<ChatMessage[]>('hydra-assist-messages', [])
	const inputText = useState('hydra-assist-input', () => '')
	const loading = useState('hydra-assist-loading', () => false)

	const answer = useState('hydra-assist-answer', () => '')
	const relatedDocs = useState(
		'hydra-assist-related-docs',
		() => [] as Array<{ title: string; url: string; lang: string }>
	)

	function addMessage(role: ChatMessage['role'], content: string) {
		messages.value.push({
			id: String(Date.now()) + Math.random().toString(36).slice(2, 8),
			role,
			content,
			createdAt: new Date().toISOString()
		})
	}

	function clearMessages() {
		messages.value = []
	}

	async function askStream(
		question: string,
		handlers: {
			onToken?: (text: string) => void
			onSources?: (
				sources: {
					title: string
					url: string
					lang: string
				}[]
			) => void
			onDone?: () => void
		}
	) {
		const res = await fetch('http://localhost:3000/api/ask/stream', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ question })
		})

		await readAskAIStream(res, handlers)
	}

	async function readAskAIStream(
		res: Response,
		handlers: {
			onToken?: (text: string) => void
			onSources?: (
				sources: {
					title: string
					url: string
					lang: string
				}[]
			) => void
			onDone?: () => void
		}
	) {
		if (!res.body) {
			throw new Error('Response body is null')
		}

		const reader = res.body.getReader()
		const decoder = new TextDecoder('utf-8')

		let buffer = ''

		while (true) {
			const { value, done } = await reader.read()
			if (done) break

			buffer += decoder.decode(value, { stream: true })

			const lines = buffer.split('\n')
			buffer = lines.pop() || ''

			for (const line of lines) {
				if (!line.trim()) continue

				let msg: StreamMessage
				try {
					msg = JSON.parse(line)
				} catch {
					continue
				}

				switch (msg.type) {
					case 'token':
						handlers.onToken?.(msg.data)
						break

					case 'sources':
						handlers.onSources?.(msg.data)
						break

					case 'done':
						handlers.onDone?.()
						return
				}
			}
		}
	}

	return {
		visiblePanel,
		messages,
		inputText,
		loading,
		answer,
		relatedDocs,
		addMessage,
		clearMessages,
		askStream
	}
}
