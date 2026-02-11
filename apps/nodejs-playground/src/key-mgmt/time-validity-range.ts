import { HydraBridge } from '@hydra-sdk/bridge'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
import { CardanoCliWallet, NETWORK_ID, Resolver, TimeUtils } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { readFileSync } from 'fs'
;(async function () {
	const startTimeStr = readFileSync('../../demo/key-mgmt/startup_time.txt').toString()

	const startTime = parseInt(startTimeStr)

	// Get keys from /demo/key-mgmt/credentials/alice
	const aliceWallet = new CardanoCliWallet({
		skey: `5820245120cdf333f8ea69114a2b3f05bcbc0d5c8e8486ca94c020623d5cca822e04`,
		vkey: `5820216f72947d1b97d56825c5f9f8a2e6f14234c03171853264f2f552a2685b25e0`,
		networkId: NETWORK_ID.PREPROD
	})

	// Get keys from /demo/key-mgmt/credentials/bob
	const bobWallet = new CardanoCliWallet({
		skey: `5820bd09ad4f98cd103e059ab62d17a6a7d920b16d9f0eed3eb6b77d3ca8f61dc117`,
		vkey: `5820832ba166c8ba8afda5b9d85dfe13dd8fffd460da79a2c3cf34e107216637985b`,
		networkId: NETWORK_ID.PREPROD
	})

	const hydraBridge = new HydraBridge({
		url: 'http://localhost:4002'
	})

	await hydraBridge.connect()

	const txBuilder = new TxBuilder({
		isHydra: true,
		params: await hydraBridge.getProtocolParameters()
	})

	const aliceUTxOs = await hydraBridge.queryAddressUTxO(aliceWallet.getAddressBech32())

	const hydraSlotConf = TimeUtils.buildHydraSlotConfig(startTime)

	const tx = await txBuilder
		.setInputs(aliceUTxOs)
		.addOutput({
			address: bobWallet.getAddressBech32(),
			amount: [
				{
					unit: 'lovelace',
					quantity: '1000000' // 1 ADA
				}
			]
		})
		.changeAddress(aliceWallet.getAddressBech32())
		.requiredSignerHash(getAddressPKhash(aliceWallet.getAddressBech32())!)
		.invalidBefore(TimeUtils.unixTimeToEnclosingSlot(Date.now() - 30 * 1000, hydraSlotConf)) // 30s ago
		.invalidAfter(TimeUtils.unixTimeToEnclosingSlot(Date.now() + 5 * 60 * 1000, hydraSlotConf)) // 5 minutes from now
		.complete()

	const unsignedCbor = tx.to_hex()
	console.log('>>> txValiditySuccess:unsigned:', unsignedCbor)

	const signedCbor = await aliceWallet.signTx(unsignedCbor)
	console.log('>>> txValiditySuccess:signed:', signedCbor)

	try {
		const result = await hydraBridge.submitTxSync({
			txId: Resolver.resolveTxHash(signedCbor),
			cborHex: signedCbor,
			type: 'Witnessed Tx ConwayEra',
			description: 'Validity range success'
		})
		console.log('>>> txValiditySuccess:result:', result)
		/**
         * Result:
         * ```
         * >>> txValiditySuccess:result: {
            txId: '19f62beed4aeeb22628c13c8d3191d3cea3df8e1c57656f3297b67d03aac73b5',
            isValid: true,
            isConfirmed: true,
            result: {
                headId: '6f66666c696e652d0000000000000000000000000000000000000000000000000000000000000001',
                seq: 1129,
                signatures: { multiSignature: [Array] },
                snapshot: {
                    confirmed: [Array],
                    headId: '6f66666c696e652d0000000000000000000000000000000000000000000000000000000000000001',
                    number: 1,
                    utxo: [Object],
                    utxoToCommit: null,
                    utxoToDecommit: null,
                    version: 0
                },
                tag: 'SnapshotConfirmed',
                timestamp: '2026-02-11T13:25:31.158319884Z'
            }
        }
         */
	} catch (e) {
		console.log('>>> txValiditySuccess:error:', e)
	}

	await hydraBridge.disconnect()
	process.exit(0)
})()

function getAddressPKhash(address: string): string | null {
	return CardanoWASM.Address.from_bech32(address).payment_cred()?.to_keyhash()?.to_hex() || null
}
