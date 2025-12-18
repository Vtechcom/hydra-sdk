export type ChatMessage = {
	id: string
	role: 'user' | 'assistant' | 'system'
	content: string
	createdAt: string
}

export const useHydraAssistance = () => {
	const visiblePanel = useState('visiblePanel', () => false)
	const messages = useLocalStorage<ChatMessage[]>('hydra-assist-messages', [])
	const inputText = useState('hydra-assist-input', () => '')
	const loading = useState('hydra-assist-loading', () => false)

	const answer = useState('hydra-assist-answer', () => '')

	function addMessage(role: ChatMessage['role'], content: string) {
		messages.value.push({
			id: String(Date.now()) + Math.random().toString(36).slice(2, 8),
			role,
			content,
			createdAt: new Date().toISOString()
		})
	}

	async function sendMessage() {
		const text = (inputText.value || '').trim()
		if (!text || loading.value) return

		// push user message
		addMessage('user', text)
		inputText.value = ''
		loading.value = true

		try {
			// Try to call a real endpoint if available (POST /api/ai). The developer can implement the endpoint.
			let reply: string | null = null

			if (!reply) {
				// Mock reply — replace this with the real response handling
				reply =
					"Dưới đây là hướng dẫn chi tiết để **setup Hydra SDK** dựa trên tài liệu được cung cấp:\n\n---\n\n### **1. Cài đặt Hydra SDK**\nĐể bắt đầu, bạn cần cài đặt các packages cần thiết cho Hydra SDK. Thực hiện theo các bước sau:\n\n#### **Bước 1: Cài đặt packages**\nSử dụng npm hoặc yarn để cài đặt SDK:\n```bash\nnpm install @hydra-sdk/core @hydra-sdk/bridge\n# hoặc\nyarn add @hydra-sdk/core @hydra-sdk/bridge\n```\n\n#### **Bước 2: Khởi tạo dự án**\nHydra SDK hỗ trợ tích hợp với các build tool hiện đại như **Vite** hoặc **Rollup**. Ví dụ với Vite:\n```bash\nnpm create vite@latest my-hydra-app --template vanilla-ts\ncd my-hydra-app\nnpm install\n```\n\n#### **Bước 3: Thêm Hydra SDK vào dự án**\nImport SDK vào file chính (ví dụ: `main.ts`):\n```typescript\nimport { HydraBridge } from '@hydra-sdk/bridge';\nimport { HydraCore } from '@hydra-sdk/core';\n\n// Khởi tạo Hydra Bridge\nconst bridge = new HydraBridge({\n  network: 'mainnet', // hoặc 'testnet'\n  apiKey: 'YOUR_API_KEY' // nếu cần\n});\n```\n\n---\n\n### **2. Tích hợp Hydra vào ứng dụng**\nSau khi cài đặt, làm theo hướng dẫn tích hợp từng bước:\n\n#### **Bước 1: Kết nối với Hydra Head**\nSử dụng `HydraBridge` để quản lý Hydra Head:\n```typescript\n// Tạo một Hydra Head mới\nconst head = await bridge.createHead({\n  participants: ['addr1...', 'addr2...'], // Danh sách địa chỉ tham gia\n  initialUTxOs: ['txId1#0', 'txId2#1']    // UTxOs ban đầu\n});\n```\n\n#### **Bước 2: Commit UTxOs vào Hydra**\nTham khảo tài liệu chi tiết về [Commit UTxOs vào Hydra](/vi/hydra-concept/commit-to-hydra):\n```typescript\n// Commit UTxOs vào Hydra Head\nconst commitTx = await bridge.commit({\n  headId: head.id,\n  utxos: ['txId3#0'], // UTxOs muốn commit\n  changeAddress: 'addr1...' // Địa chỉ nhận tiền thừa\n});\n```\n\n#### **Bước 3: Xây dựng transactions**\nSử dụng `TxBuilder` để tạo transactions trong Hydra:\n```typescript\nimport { TxBuilder } from '@hydra-sdk/core';\n\nconst tx = new TxBuilder()\n  .addInput('txId#0')\n  .addOutput('addr1...', 1000000) // 1 ADA\n  .build();\n```\n\n---\n\n### **3. Tài liệu tham khảo**\n- **Hướng dẫn tích hợp đầy đủ**: [Tích hợp Hydra](/vi/examples/hydra-integration)\n- **Commit/Decommit UTxOs**: [Quản lý UTxOs](/vi/hydra-concept/commit-to-hydra)\n- **Xây dựng transactions**: [Transactions trong Hydra](/vi/hydra-concept/transactions-in-hydra)\n\n---\n\n### **4. Tính năng mới trong v1.1.0**\n- **Blueprint Transaction**: Hỗ trợ tạo transactions mẫu cho việc deposit vào Hydra.\n- **Incremental Commit**: Cho phép partial deposit với xử lý change address.\n\n---\n\n### **5. Nguồn tham khảo bổ sung**\n- [Tài liệu chính thức Hydra](https://hydra.family/head-protocol/)\n- [Cardano Scaling Solutions](https://docs.cardano.org/scaling-solutions/)\n\nNếu bạn cần hỗ trợ thêm, hãy tham khảo các ví dụ trong [phần hướng dẫn](/vi/guides)."
			}

			addMessage('assistant', reply)
		} catch (err) {
			addMessage('assistant', 'Sorry, something went wrong while contacting the AI service.')
		} finally {
			loading.value = false
		}
	}

	function clearMessages() {
		messages.value = []
	}

	return {
		visiblePanel,
		messages,
		inputText,
		loading,
		answer,
		addMessage,
		sendMessage,
		clearMessages
	}
}
