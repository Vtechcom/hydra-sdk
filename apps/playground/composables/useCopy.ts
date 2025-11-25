import { toast } from 'vue-sonner'

export const useCopy = (text: string, showData = false) => {
	navigator.clipboard
		.writeText(text)
		.then(() => {
			toast.success(`Copied to clipboard${showData ? `: ${text}` : ''}`)
		})
		.catch(err => {
			toast.error(`Failed to copy text: ${err}`)
		})
}
