export const useToc = () => {
	const tableOfContents = useState<Array<{ id: string; text: string; level: number }>>('tableOfContents', () => [])

	return {
		tableOfContents
	}
}
