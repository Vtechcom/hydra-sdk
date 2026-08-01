import type { TxDraft } from '~/lib/tx-draft'

/**
 * Share-links carry the whole draft in the URL fragment, so nothing ever reaches
 * a server. The fragment is base64url of the UTF-8 JSON.
 */
const toBase64Url = (value: string) =>
	btoa(String.fromCharCode(...new TextEncoder().encode(value)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')

const fromBase64Url = (value: string) => {
	const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4)
	const binary = atob(padded)
	return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)))
}

export const encodeDraft = (draft: TxDraft) => toBase64Url(JSON.stringify(draft))

export const decodeDraft = (encoded: string): TxDraft | null => {
	try {
		const parsed = JSON.parse(fromBase64Url(encoded))
		return parsed && typeof parsed === 'object' ? (parsed as TxDraft) : null
	} catch {
		return null
	}
}
