import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { wallet } from './common'
import { Converter, Deserializer, hexToString } from '@hydra-sdk/core'
import BigNumber from 'bignumber.js'

async function main(address?: string) {
	const utxos = await wallet.queryUTxOs(address || wallet.getAccount().baseAddressBech32)
	console.log('>>> UTxOs:', JSON.stringify(Converter.convertUTxOToUTxOObject(utxos), null, 2))
	const totalLovelace = utxos.reduce(
		(a, b) => a + Number(b.output.amount.find(x => x.unit === 'lovelace')?.quantity || 0),
		0
	)
	console.log(
		'>>> Total lovelace:',
		BigNumber(totalLovelace).toFormat(),
		'lovelace',
		' => ',
		(Number(totalLovelace) / 1_000_000).toFixed(6),
		'ADA'
	)
	const totalAssets = utxos.reduce(
		(acc, utxo) => {
			utxo.output.amount.forEach(a => {
				if (a.unit !== 'lovelace') {
					if (!acc[a.unit]) {
						acc[a.unit] = 0
					}
					acc[a.unit] += Number(a.quantity)
				}
			})
			return acc
		},
		{} as Record<string, number>
	)
	console.log('>>> Total assets:', Object.keys(totalAssets).length)
	for (const [unit, quantity] of Object.entries(totalAssets)) {
		const { policyId, assetName } = Deserializer.deserializeAssetUnit(unit)
		console.log(
			`  - ${policyId}${assetName ? '.' + assetName : ''}: ${BigNumber(quantity).toFormat()} ${hexToString(assetName)}`
		)
	}
}

if (process.argv[2] && typeof process.argv[2] === 'string') {
	const address = process.argv[2]
	try {
		CardanoWASM.Address.from_bech32(address)
	} catch (error) {
		console.error('>>> address is invalid:', error)
		process.exit(1)
	}
} else {
	main()
}
