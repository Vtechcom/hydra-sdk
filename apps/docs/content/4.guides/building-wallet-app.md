---
title: Building Wallet Application
description: Guide to creating Cardano wallet application with Hydra SDK
---

# Building Wallet Application

A step-by-step guide to creating a Cardano wallet application integrated with Hydra Layer 2.

## Overall Architecture

- UI: React/Vue/Svelte
- Wallet: `@hydra-sdk/core`
- Transaction: `@hydra-sdk/transaction`
- Hydra L2: `@hydra-sdk/bridge`
- WASM: `@hydra-sdk/cardano-wasm`

## Main Steps

1. Initialize wallet using `AppWallet`
2. Get `account` (address, keys)
3. Integrate `TxBuilder` to build transactions
4. Optional Hydra: use `HydraBridge` to get `protocol params` and submit tx to Head
5. Handle events and cleanup (disconnect)

## Sample Code

```ts
import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { HydraBridge } from '@hydra-sdk/bridge'

async function run() {
	const wallet = new AppWallet({
		networkId: NETWORK_ID.PREPROD,
		key: { type: 'mnemonic', words: AppWallet.brew() }
	})
	const account = wallet.getAccount(0, 0)

	const bridge = new HydraBridge({ url: 'ws://localhost:4001' })
	await bridge.connect()
	const params = await bridge.getProtocolParameters()

	const tx = await new TxBuilder({ isHydra: true, params })
		.setInputs(await bridge.queryAddressUTxO(account.baseAddressBech32))
		.txOut(account.baseAddressBech32, [{ unit: 'lovelace', quantity: '1000000' }])
		.changeAddress(account.baseAddressBech32)
		.complete()

	await bridge.submitTxSync({
		type: 'Witnessed Tx ConwayEra',
		description: 'Ledger Cddl Format',
		cborHex: await wallet.signTx(tx.to_hex(), false, 0, 0),
		txId: 'auto'
	})
}
```

> See also: [Getting Started](/getting-started/), [Examples](/examples/), [API](/api/)
