import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import type { UTxO, UTxOObject } from '../../src/types/cardano'

type ConverterMockData = {
	rootKey: string
	address: string
	utxoObject: UTxOObject
	utxos: UTxO[]
	scriptAddress: string
	scriptUtxoObject: UTxOObject
	scriptUtxos: UTxO[]
}

export const mockData: ConverterMockData = {
	rootKey:
		'c8c43af6f30ea454465017f832cdf8769cd1f1391e476cba06ae4e417066e044aae2a86c09f07719c207ae4fae5eb34f30606fdb06160d85d2aad69e1691b5bf0eab7a1f7de8b17df42d33fc3a27c3b43828405310164ad4fc8c5741dea298c8',
	address:
		'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz',
	utxoObject: {
		'1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6#0': {
			address:
				'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz',
			datum: null,
			datumhash: null,
			inlineDatumhash: null,
			inlineDatum: null,
			inlineDatumRaw: null,
			referenceScript: null,
			value: {
				lovelace: 200000000
			}
		}
	},
	utxos: [
		{
			input: {
				txHash: '1d2e5b97f1cad7bea2b06144abc4974012fa786c9e7e5faddd03243b967a03f6',
				outputIndex: 0
			},
			output: {
				address:
					'addr_test1qp6ew9rwqwkjz7qeamdnusswmwz2trcghejdg4vhuwafau4d4a2eagwntdps020vc570z5rsqfcy9z4sa23yl7m8hhps86y5sz',
				amount: [{ unit: 'lovelace', quantity: '200000000' }]
			}
		}
	],
	scriptAddress: 'addr_test1wrf8enqnl26m0q5cfg73lxf4xxtu5x5phcrfjs0lcqp7uagh2hm3k',
	scriptUtxoObject: {
		'14a33354d554dc566f5751c1f43eca9e4a303ed4603730cd65b482b2a6772d94#0': {
			address: 'addr_test1wrf8enqnl26m0q5cfg73lxf4xxtu5x5phcrfjs0lcqp7uagh2hm3k',
			datum: null,
			datumhash: 'b2a341841d44a0d757a9f4a7c60da80e09e0764c00aec65b30cc1cfcbc130d59',
			inlineDatumhash: null,
			inlineDatum: null,
			inlineDatumRaw: null,
			referenceScript: null,
			value: {
				lovelace: 1017160
			}
		},
		'331bec9d3cbe4eb6760f13cae8d7cf15129cfe5166429213cea7201dcf08ebec#0': {
			address: 'addr_test1wrf8enqnl26m0q5cfg73lxf4xxtu5x5phcrfjs0lcqp7uagh2hm3k',
			datum: null,
			datumhash: null,
			inlineDatumhash: '39df024ac52722fe8ae4c1a8740e4c5624a38c3820e504a059aae8728421f8bd',
			inlineDatum: {
				bytes: ''
			},
			inlineDatumRaw: '40',
			referenceScript: null,
			value: {
				lovelace: 12000000
			}
		}
	},
	scriptUtxos: [
		{
			input: {
				txHash: '14a33354d554dc566f5751c1f43eca9e4a303ed4603730cd65b482b2a6772d94',
				outputIndex: 0
			},
			output: {
				address: 'addr_test1wrf8enqnl26m0q5cfg73lxf4xxtu5x5phcrfjs0lcqp7uagh2hm3k',
				amount: [{ unit: 'lovelace', quantity: '1017160' }],
				datumHash: 'b2a341841d44a0d757a9f4a7c60da80e09e0764c00aec65b30cc1cfcbc130d59'
			}
		},
		{
			input: {
				txHash: '331bec9d3cbe4eb6760f13cae8d7cf15129cfe5166429213cea7201dcf08ebec',
				outputIndex: 0
			},
			output: {
				address: 'addr_test1wrf8enqnl26m0q5cfg73lxf4xxtu5x5phcrfjs0lcqp7uagh2hm3k',
				amount: [{ unit: 'lovelace', quantity: '12000000' }],
				inlineDatum: CardanoWASM.PlutusData.from_hex('40')
			}
		}
	]
}
