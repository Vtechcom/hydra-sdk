import MarkdownIt from 'markdown-it'
import MaterialThemePalenight from '@shikijs/themes/material-theme-palenight'
import HtmlLang from '@shikijs/langs/html'
import MdcLang from '@shikijs/langs/mdc'
import TsLang from '@shikijs/langs/typescript'
import VueLang from '@shikijs/langs/vue'
import ScssLang from '@shikijs/langs/scss'
import YamlLang from '@shikijs/langs/yaml'

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
