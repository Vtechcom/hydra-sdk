import mermaid from 'mermaid'

export default defineNuxtPlugin(() => {
	mermaid.initialize({
		startOnLoad: true,
		theme: 'default', // hoặc 'dark', 'forest', 'neutral'
		securityLevel: 'loose' // cần nếu bạn render HTML (tránh lỗi sanitize)
	})

	return {
		provide: {
			mermaid
		}
	}
})
