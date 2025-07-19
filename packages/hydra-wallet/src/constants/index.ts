export const LANGUAGE_VERSIONS: Record<string, 'V1' | 'V2' | 'V3'> = {
	V1: 'V1',
	V2: 'V2',
	V3: 'V3'
}
export const HARDENED_KEY_START = 0x80000000

export * from './chain'
export * from './cost-models'
export * from './placeholder'
export * from './protocol-parameters'
