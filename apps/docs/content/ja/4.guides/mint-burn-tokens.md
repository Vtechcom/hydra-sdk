---
title: Mint / Burn Tokens ガイド
description: Hydra SDK を使って Cardano 上で native token を mint / burn する方法
---

# Mint / Burn Tokens ガイド

このガイドでは、Hydra SDK を使って Cardano ブロックチェーン上で native token を **mint（発行）** および **burn（焼却）** する手順を説明します。token のメタデータ、minting policy、burn の実装まで一連の流れをカバーします。

コード、型名、モジュール名（`AppWallet`, `TxBuilder`, `DatumUtils`, `PolicyUtils`, `CardanoWASM` など）は、英語のままそのまま利用します。

## 前提条件

以下の前提を満たしていることを想定します。

- Cardano の基本概念（UTxO / トランザクション / policy / metadata など）を理解している
- Node.js + TypeScript の開発環境がある
- Hydra SDK がインストール済みで、Preprod testnet に接続可能

## プロジェクトセットアップ

### 依存パッケージのインストール

```bash
npm install @hydra-sdk/core @hydra-sdk/transaction @hydra-sdk/cardano-wasm
```

### 必要なモジュールのインポート

```typescript
import {
	AppWallet,
	DatumUtils,
	Deserializer,
	NETWORK_ID,
	ParserUtils,
	PolicyUtils,
	Serializer
} from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'
```

## ウォレットセットアップ

まず、トランザクションに署名するための `AppWallet` を作成します。

```typescript
const wallet = new AppWallet({
	key: {
		type: 'mnemonic',
		words: 'your twelve word mnemonic phrase goes here like this example'.split(
			' '
		)
	},
	networkId: NETWORK_ID.PREPROD
})

const walletAddress = wallet.getAccount().baseAddressBech32
console.log('Wallet Address:', walletAddress)
```

> セキュリティ上、本番環境では `.env` や安全な key 管理を使い、mnemonic をコードに直書きしないようにしてください。

## トークンの Mint

### 1. UTxO / Collateral の準備

```typescript
async function mintToken() {
	console.log('>>> Querying UTxO...', walletAddress)
	const utxos = await wallet.queryUTxOs(walletAddress)
	console.log(`>>> Found ${utxos.length} UTxOs`)

	const collateralUTxOs = utxos.filter(u =>
		u.output.amount.find(
			a => a.unit === 'lovelace' && Number(a.quantity) >= 5_000_000
		)
	)

	if (!collateralUTxOs.length) {
		throw new Error('No collateral UTxOs found')
	}

	const collateralUTxO = collateralUTxOs[0]
	// ... 後続の mint ロジックに続く
}
```

### 2. Minting Policy と Token 情報

```typescript
const scriptCborHex =
	PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)
const assetNameHex = ParserUtils.stringToHex('AniaToken')

const assetMetadata = {
	name: 'Ada Binary Option Token',
	description: 'Utility token for Cardano Binary Option demo project',
	ticker: 'tABO',
	url: 'https://preprod.ada-defi.io.vn',
	logo: 'ipfs://Qmaqj4Lg51s9gL654zwFfcimHNcX4GLno7okEdyCGPor2i',
	image: 'ipfs://Qmaqj4Lg51s9gL654zwFfcimHNcX4GLno7okEdyCGPor2i'
}

console.log('Policy ID:', policyId)
console.log('Asset Name (hex):', assetNameHex)
```

### 3. Mint トランザクションの構築と送信

```typescript
const txBuilder = new TxBuilder()

const tx = await txBuilder
	.setInputs(
		utxos.filter(
			u =>
				`${u.input.txHash}#${u.input.outputIndex}` !==
				`${collateralUTxO.input.txHash}#${collateralUTxO.input.outputIndex}`
		)
	)
	.mint('1000000', policyId, assetNameHex)
	.mintingScript({
		type: 'Native',
		scriptCborHex
	})
	.metadataValue(721, {
		[policyId]: {
			[assetNameHex]: { ...assetMetadata }
		}
	})
	.txInCollateral(
		collateralUTxO.input.txHash,
		collateralUTxO.input.outputIndex,
		collateralUTxO.output.amount,
		collateralUTxO.output.address
	)
	.addOutput({
		address: walletAddress,
		amount: [
			{ unit: 'lovelace', quantity: String(2_000_000) },
			{ unit: Serializer.serializeAssetUnit(policyId, assetNameHex), quantity: '1000000' }
		]
	})
	.changeAddress(walletAddress)
	.complete()

const signedCbor = await wallet.signTx(tx.to_hex())
console.log('Signed Transaction:', signedCbor)
console.log(
	'Transaction ID:',
	Deserializer.deserializeTx(signedCbor).transaction_hash().to_hex()
)
```

## トークンの Burn

Burn は、流通中の token を永続的に削除する操作です。数量調整や deflation 設計などに利用されます。

```typescript
async function burnToken() {
	const utxos = await wallet.queryUTxOs(walletAddress)
	const collateralUTxOs = utxos.filter(u =>
		u.output.amount.find(
			a => a.unit === 'lovelace' && Number(a.quantity) >= 5_000_000
		)
	)

	if (!collateralUTxOs.length) {
		throw new Error('No collateral UTxOs found')
	}

	const collateralUTxO = collateralUTxOs[0]
	const scriptCborHex =
		PolicyUtils.buildMintingPolicyScriptFromAddress(walletAddress)
	const policyId = PolicyUtils.policyIdFromNativeScript(scriptCborHex)
	const assetNameHex = ParserUtils.stringToHex('AniaToken')

	const txBuilder = new TxBuilder()

	const tx = await txBuilder
		.setInputs(
			utxos.filter(
				u =>
					`${u.input.txHash}#${u.input.outputIndex}` !==
					`${collateralUTxO.input.txHash}#${collateralUTxO.input.outputIndex}`
			)
		)
		.mint('-1000000', policyId, assetNameHex)
		.mintingScript({
			type: 'Native',
			scriptCborHex
		})
		.changeAddress(walletAddress)
		.complete()

	const signedCbor = await wallet.signTx(tx.to_hex())
	console.log(
		'Burn Transaction ID:',
		Deserializer.deserializeTx(signedCbor).transaction_hash().to_hex()
	)
}
```

## Datum / Plutus Data を使った高度な例

`DatumUtils` と `CardanoWASM` を使って、実際の playground と同じ複雑な `PlutusData` を構築できます。

```typescript
const buildDatum = (
	key: string,
	l1Vkh: string,
	l2Vkh: string,
	amount: string
): CardanoWASM.PlutusData => {
	// キーと検証キーハッシュでネストされたコンストラクタを作成
	const bKey = DatumUtils.mkBytes(key)
	const cL1Vkh = DatumUtils.mkConstr(0, [DatumUtils.mkBytes(l1Vkh)])
	const cL2Vkh = DatumUtils.mkConstr(0, [DatumUtils.mkBytes(l2Vkh)])

	const constrKey = DatumUtils.mkConstr(0, [bKey, cL1Vkh, cL2Vkh])
	const wrap1 = DatumUtils.mkConstr(0, [constrKey])

	// ネストされたマップ構造を作成: { "" => { "" => amount } }
	const emptyBytes = DatumUtils.mkBytes('')
	const mapVal = CardanoWASM.PlutusMapValues.new()
	mapVal.add(DatumUtils.mkInt(amount))
	const innerMap = DatumUtils.mkMap([[emptyBytes, mapVal]])

	const outerMapVal = CardanoWASM.PlutusMapValues.new()
	outerMapVal.add(innerMap)
	const outerMap = DatumUtils.mkMap([[emptyBytes, outerMapVal]])

	return DatumUtils.mkConstr(0, [wrap1, outerMap])
}

// トランザクションでの使用
const datum = buildDatum(
	'ee91e90e791e4cd983d1b1f331d1e8eb',
	'326cd6bff6114c4d14ebf2385883aac43c4e64476e6a47314f9b2003',
	'f602ad4b16ec2e1a96989dc140eacf546359695cfece8510c8d1c0ac',
	'4000000'
)

// デバッグ:
console.log('Datum (json):', datum.to_json(DatumUtils.DatumSchema.Detailed))
```

## ⚠️ 重要な考慮事項

### セキュリティのベストプラクティス

1. **最初にPreproで テスト**: mintingやburningのロジックを必ずtestnetでテストする
2. **入力の検証**: トランザクションを構築する前にUTxOの可用性と金額を確認する
3. **エラー処理**: ネットワークとトランザクションの失敗に対する適切なエラー処理を実装する
4. **安全な鍵管理**: 本番環境ではハードウェアウォレットまたは安全な鍵ストレージを使用する

### よくある落とし穴

1. **担保不足**: 担保として十分なADA（≥5 ADA）があることを確認する
2. **Policy IDの一貫性**: 同じトークンのmintingとburningには同じpolicyを使用する
3. **アセット名のエンコーディング**: アセット名をhex形式に変換することを忘れずに
4. **UTxO選択**: トランザクション入力から担保UTxOを適切に除外する

### ガスと手数料

- Mintingトランザクションはスクリプト実行のためより高い手数料が必要
- トランザクションが成功した場合、担保UTxOは返却される
- 手数料を設定する際はネットワークの混雑を考慮する

## 🎯 完全な例

完全に動作する例:

```typescript
import {
	AppWallet,
	DatumUtils,
	Deserializer,
	NETWORK_ID,
	ParserUtils,
	PolicyUtils,
	Serializer
} from '@hydra-sdk/core'
import { TxBuilder } from '@hydra-sdk/transaction'
import { CardanoWASM } from '@hydra-sdk/cardano-wasm'

// ウォレットの初期化
const wallet = new AppWallet({
	key: {
		type: 'mnemonic',
		words:
			'enable away depend exist mad february table onion census praise spawn pipe again angle grant'.split(
				' '
			)
	},
	networkId: NETWORK_ID.PREPROD
})

const walletAddress = wallet.getAccount().baseAddressBech32

// mintingまたはburningの実行
async function main() {
	console.log('Wallet Address:', walletAddress)

	// 実行したい操作をコメント解除
	await mintToken()
	// await burnToken()
}

main().catch(console.error)
```

## 🔗 次のステップ

トークンのmintingとburningをマスターした後、以下を探求してください:

- **NFT作成**: ユニークな非代替性トークンの作成方法を学ぶ
- **マルチシグネチャポリシー**: 複数の署名を必要とするポリシーを実装する
- **タイムロックポリシー**: 時間ベースのminting制限を持つトークンを作成する
- **Plutusスクリプト**: 複雑なmintingロジックのための高度なスクリプティング

---

_このガイドは、Cardano上でのトークン操作の基礎を提供します。本番環境では必ず徹底的にテストし、セキュリティのベストプラクティスに従ってください。_
