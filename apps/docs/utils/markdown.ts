import MarkdownIt from 'markdown-it'
const highlighter = await getShikiHighlighter()

export const md = new MarkdownIt({
	html: true,
	breaks: true,
	typographer: true,

	highlight(str, lang, attrs) {
		try {
			return highlighter.highlight(str, {
				lang: lang || 'markdown'
			})
		} catch (err) {
			console.log('>>> / markdown.ts:23 / err:', err)

			return str
		}
	}
})
