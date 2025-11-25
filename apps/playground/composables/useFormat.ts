export const formatId = (id: string | null, begin = 5, last = 5): string => {
	if (!id) return ''
	if (id.length <= begin + last) return id
	const before = id.substring(0, begin)
	const after = id.substring(id.length - last)
	return before + '...' + after
}

export const createId = (): string => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0
		const v = c === 'x' ? r : (r & 0x3) | 0x8
		return v.toString(16)
	})
}

export function formatNumber(value: number): string {
	return value.toLocaleString('en-US')
}

export function hexToUtf8(hex: string): string {
	return Buffer.from(hex, 'hex').toString('utf8')
}
