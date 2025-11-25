import type { TxOutput } from '@hydra-sdk/core'

export type TxOutputJson = Omit<TxOutput, 'inlineDatum' | 'datum'> & {
	address: string
	amount: {
		unit: string
		quantity: string
	}[]

	datum?: string
	inlineDatum?: string
}
