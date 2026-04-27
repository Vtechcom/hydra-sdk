# API Specification: core

## File: core\src\wallet.ts

### Class: `AppWallet`
No description available.

**Visibility:** `public` | **Exported:** `true`

#### Constructors
- `constructor(options: CreateAppWalletOptions) {
		this._fetcher = options.fetcher
		this._submitter = options.submitter

		switch (options.key.type) {
			case 'mnemonic':
				this._wallet = new EmbeddedWallet({
					networkId: options.networkId,
					key: {
						type: 'mnemonic',
						words: options.key.words
					}
				})
				break
			case 'root':
				this._wallet = new EmbeddedWallet({
					networkId: options.networkId,
					key: {
						type: 'root',
						bech32: options.key.bech32
					}
				})
				break
			case 'cli':
				this._wallet = new EmbeddedWallet({
					networkId: options.networkId,
					key: {
						type: 'cli',
						payment: options.key.payment,
						stake: options.key.stake
					}
				})
		}
	}` 

#### Methods
##### `getAccount`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `accountIndex`: `number` (optional) - Default: `0`
- `keyIndex`: `number` (optional) - Default: `0`

**Returns:** `Account`

##### `getEnterpriseAddress`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `accountIndex`: `number` (optional) - Default: `0`
- `keyIndex`: `number` (optional) - Default: `0`

**Returns:** `string`

##### `getPaymentAddress`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `accountIndex`: `number` (optional) - Default: `0`
- `keyIndex`: `number` (optional) - Default: `0`

**Returns:** `string`

##### `getRewardAddress`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `accountIndex`: `number` (optional) - Default: `0`
- `keyIndex`: `number` (optional) - Default: `0`

**Returns:** `string`

##### `getNetworkId`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `number`

##### `signTx`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `unsignedTx`: `string`
- `partialSign`: `boolean` (optional) - Default: `false`
- `accountIndex`: `number` (optional) - Default: `0`
- `keyIndex`: `number` (optional) - Default: `0`

**Returns:** `Promise<string>`

##### `brew`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `strength`: `number` (optional) - Default: `256`

**Returns:** `string[]`

##### `signData`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `address`: `string`
- `payload`: `string`
- `accountIndex`: `number` (optional) - Default: `0`
- `keyIndex`: `number` (optional) - Default: `0`

**Returns:** `DataSignature`

##### `signTxs`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `unsignedTxs`: `string[]`
- `partialSign`: `boolean` (optional)

**Returns:** `Promise<string[]>`

##### `submitTx`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `tx`: `string`

**Returns:** `Promise<string>`

##### `getFetcher`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `IFetcher`

##### `getSubmitter`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `ISubmitter`

##### `queryUTxOs`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `address`: `string`

**Returns:** `UTxO`

---

## File: core\src\embedded.ts

### Class: `WalletStaticMethods`
No description available.

**Visibility:** `public` | **Exported:** `true`

#### Constructors

#### Methods
##### `privateKeyBech32ToPrivateKeyHex`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `_bech32`: `string`

**Returns:** `string`

##### `mnemonicToPrivateKeyHex`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `words`: `string[]`
- `password`: `string` (optional) - Default: `''`

**Returns:** `string`

##### `privateKeyHexToBech32`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `privateKeyHex`: `string`

**Returns:** `string`

##### `signingKeyToHexes`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `paymentKey`: `string`
- `stakeKey`: `string`

**Returns:** `[string, string]`

##### `bip32BytesToPrivateKeyHex`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `bip32Bytes`: `Uint8Array<ArrayBufferLike>`

**Returns:** `string`

##### `getAddresses`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `paymentKey`: `Bip32PrivateKey`
- `stakingKey`: `Bip32PrivateKey`
- `networkId`: `number` (optional) - Default: `0`

**Returns:** `Address`

##### `generateMnemonic`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `strength`: `number` (optional) - Default: `256`

**Returns:** `string[]`

---

### Class: `EmbeddedWallet`
No description available.

**Visibility:** `public` | **Exported:** `true`

#### Constructors
- `constructor(options: CreateEmbeddedWalletOptions) {
		super()
		this._networkId = options.networkId

		switch (options.key.type) {
			case 'mnemonic':
				this._walletSecret = WalletStaticMethods.mnemonicToPrivateKeyHex(options.key.words)
				break
			case 'root':
				this._walletSecret = WalletStaticMethods.privateKeyBech32ToPrivateKeyHex(options.key.bech32)
				break
			case 'cli':
				this._walletSecret = WalletStaticMethods.signingKeyToHexes(
					options.key.payment,
					options.key.stake ?? 'f0'.repeat(32)
				)
				break
			case 'bip32Bytes':
				this._walletSecret = WalletStaticMethods.bip32BytesToPrivateKeyHex(options.key.bip32Bytes)
				break
		}
	}` 

#### Methods
##### `getPrivateKeyHex`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `string | [string, string]`

##### `getAccount`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `accountIndex`: `number` (optional) - Default: `0`
- `keyIndex`: `number` (optional) - Default: `0`

**Returns:** `Account`

##### `getNetworkId`
Get wallet network ID.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `number`

##### `signTx`
This endpoints sign the provided transaction (unsignedTx) with the private key of the owner.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `unsignedTx`: `string`
- `accountIndex`: `number` (optional) - Default: `0`
- `keyIndex`: `number` (optional) - Default: `0`

**Returns:** `Vkeywitness`

##### `signData`
This endpoint utilizes the [CIP-8 - Message Signing](https://cips.cardano.org/cips/cip8/) to sign arbitrary data, to verify the data was signed by the owner of the private key.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `address`: `string`
- `payload`: `string`
- `accountIndex`: `number` (optional) - Default: `0`
- `keyIndex`: `number` (optional) - Default: `0`

**Returns:** `DataSignature`

---

## File: core\src\cardanocli-wallet.ts

### Class: `CardanoCliWallet`
No description available.

**Visibility:** `public` | **Exported:** `true`

#### Constructors
- `constructor(options: CardanoCliWalletConstr) {
		super()
		this._networkId = options.networkId ?? NETWORK_ID.MAINNET
		this._skey = options.skey
		this._vkey = options.vkey
		this._submitter = options.submitter
		this._fetcher = options.fetcher
	}` 

#### Methods
##### `getAddressBech32`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `string`

##### `getNetworkId`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `number`

##### `signTx`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `unsignedTx`: `string`
- `partialSign`: `boolean` (optional) - Default: `false`

**Returns:** `Promise<string>`

##### `submitTx`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `tx`: `string`

**Returns:** `Promise<string>`

##### `queryUTxOs`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `address`: `string`

**Returns:** `UTxO`

---

## File: core\src\utils\validator.util.ts

### Function: `isValidAddress`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `address`: `string | Uint8Array<ArrayBufferLike>`
- `type`: `"bytes" | "bech32" | "hex"` (optional) - Default: `'bech32'`

**Returns:** `boolean`

---

### Function: `isValidTxOutput`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `output`: `TxOutput`

**Returns:** `boolean`

---

## File: core\src\utils\time.ts

### Function: `slotToBeginUnixTime`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `slot`: `number`
- `slotConfig`: `SlotConfig`

**Returns:** `number`

---

### Function: `unixTimeToEnclosingSlot`
Eqivalent to `slotToBeginUnixTime` but option to provide optional config

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `unixTime`: `number`
- `slotConfig`: `SlotConfig`

**Returns:** `number`

---

### Function: `resolveSlotNo`
Resolve slot number based on timestamp in milliseconds.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `network`: `"MAINNET" | "PREPROD" | "PREVIEW"`
- `milliseconds`: `number` (optional) - Default: `Date.now()`

**Returns:** `string`

---

### Function: `resolveEpochNo`
Resolve epoch number based on timestamp in  milliseconds.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `network`: `"MAINNET" | "PREPROD" | "PREVIEW"`
- `milliseconds`: `number` (optional) - Default: `Date.now()`

**Returns:** `number`

---

### Function: `buildHydraSlotConfig`
Build Hydra slot configuration for a specific timestamp.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `startTimestamp`: `number`
- `options`: `SlotConfig` (optional)

**Returns:** `SlotConfig`

---

## File: core\src\utils\policy.ts

### Function: `buildPolicyScriptFromPubkey`
Builds a minting policy script from a public key script.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `pubkeyScript`: `{ type: "sig"; keyHash: string; }`

**Returns:** `string`

---

### Function: `buildMintingPolicyScriptFromAddress`
Builds a minting policy script from a Bech32 encoded address.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `addressBech32`: `string`

**Returns:** `string`

---

### Function: `buildMintingPolicyScriptFromKeyHash`
Builds a minting policy script from a key hash.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `keyHashHex`: `string`

**Returns:** `string`

---

### Function: `policyIdFromNativeScript`
Extracts the policy ID from a native script.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `script`: `string`

**Returns:** `string`

---

## File: core\src\utils\plutus-script.util.ts

### Function: `applyParamsToScript`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `plutusScript`: `string`
- `params`: `Uint8Array<ArrayBufferLike>[]`

**Returns:** `string`

---

### Function: `mintingPolicyToId`
Returns the script hash of a minting policy script in `hex`

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `mintingPolicy`: `Script`

**Returns:** `string`

---

### Function: `validatorToScriptHash`
Returns the script hash of a validator script in hex

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `validator`: `Script`

**Returns:** `string`

---

### Function: `validatorToAddress`
Returns the address of a validator script in `bech32`

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `validator`: `Script`
- `networkId`: `number`
- `stakeCredential`: `string` (optional)

**Returns:** `string`

---

## File: core\src\utils\parser.ts

### Function: `assert_bytes`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `b`: `Uint8Array<ArrayBufferLike>`
- `lengths`: `number[]` (optional)

**Returns:** `void`

---

### Function: `isBytes`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `a`: `unknown`

**Returns:** `boolean`

---

### Function: `asciiToBase16`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `char`: `number`

**Returns:** `number`

---

### Function: `bytesToHex`
Converting bytes to hex string

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `bytes`: `ArrayBuffer | Uint8Array<ArrayBufferLike> | Buffer<ArrayBufferLike>`

**Returns:** `string`

---

### Function: `hexToBytes`
Converting hex string to bytes

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `hex`: `string`

**Returns:** `Uint8Array<ArrayBuffer>`

---

### Function: `stringToHex`
Converting utf8 string to hex string

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `str`: `string`

**Returns:** `string`

---

### Function: `hexToString`
Converting hex string to utf8 string

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `hex`: `string`

**Returns:** `string`

---

### Function: `toBytes`
Converting either hex string or utf8 string to bytes

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `hex`: `string`

**Returns:** `Uint8Array<ArrayBufferLike>`

---

### Function: `fromUTF8`
Converting utf8 string to hex string

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `utf8`: `string`

**Returns:** `string`

---

### Function: `toUTF8`
Converting hex string to utf8 string

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `hex`: `string`

**Returns:** `string`

---

## File: core\src\utils\metadata.ts

### Function: `metadataObjToMetadatum`
Converts various metadata types to a CardanoWASM.TransactionMetadatum.

Cardano metadata constraints:
- `text` fields must be ≤ 64 bytes (UTF-8 encoded)
- `bytes` fields must be ≤ 64 bytes
- `number` must be an integer (no floats)

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `metadata`: `string | number | bigint | Object | any[] | Uint8Array<ArrayBufferLike> | Map<any, any>`

**Returns:** `TransactionMetadatum`

---

## File: core\src\utils\keys.util.ts

### Function: `cardanoCliKeygen`
Generate a Cardano CLI compatible ed25519 key pair.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- None

**Returns:** `CardanoCLiVkey`

---

### Function: `hydraCliKeygen`
Generate a Hydra compatible ed25519 key pair.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- None

**Returns:** `HydraCliVkey`

---

### Function: `genVkey`
Generate verification key from signing key.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `skey`: `CardanoCLiSkey`

**Returns:** `CardanoCLiVkey`

---

### Function: `mnemonicToCliKey`
Convert mnemonic to Cardano CLI compatible key pair.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `mnemonic`: `string[]`
- `accountIndex`: `number` (optional) - Default: `0`
- `keyIndex`: `number` (optional) - Default: `0`

**Returns:** `CardanoCLiVkey`

---

## File: core\src\utils\datum.ts

### Function: `mkInt`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `n`: `string | number | bigint`

**Returns:** `PlutusData`

---

### Function: `mkBytes`
Create a PlutusData object from a hex string representing bytes

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `hex`: `string`

**Returns:** `PlutusData`

---

### Function: `mkConstr`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `alt`: `number`
- `fields`: `PlutusData`

**Returns:** `PlutusData`

---

### Function: `mkMap`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `entries`: `PlutusMapValues`

**Returns:** `PlutusData`

---

### Function: `mkList`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `elements`: `PlutusData`

**Returns:** `PlutusData`

---

## File: core\src\utils\cost-models.ts

### Function: `buildCostModels`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `{
	plutusV1,
	plutusV2,
	plutusV3
}`: `{ plutusV1?: number[]; plutusV2?: number[]; plutusV3?: number[]; }`

**Returns:** `Costmdls`

---

## File: core\src\utils\cbor.ts

### Function: `applyDoubleCborEncoding`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `script`: `string`

**Returns:** `string`

---

## File: core\src\utils\address.ts

### Function: `getPubkeyHashFromAddress`
Get the public key hash from a bech32 Cardano address

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `address`: `string`

**Returns:** `string`

---

## File: core\src\utils\providers\ogmios.provider.ts

### Class: `OgmiosProvider`
No description available.

**Visibility:** `public` | **Exported:** `true`

#### Constructors
- `constructor(config: OgmiosProviderConfig) {
		super()
		// Implementation for OgmiosProvider
		this.fetcher = this.buildFetcher()
		this.submitter = this.buildSubmitter()

		this._axiosInstance = axios.create({
			baseURL: config.apiEndpoint || 'http://localhost:1337',
			headers: {
				'Content-Type': 'application/json'
			}
		})
		// Set up interceptors if needed
		this._axiosInstance.interceptors.request.use(request => {
			return request
		})
		this._axiosInstance.interceptors.response.use(response => {
			return response
		})
	}` 

#### Methods
##### `buildFetcher`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `IFetcher`

##### `buildSubmitter`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `ISubmitter`

##### `rpcRequest`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `method`: `string`
- `params`: `Record<string, any>`
- `options`: `{ id?: number; }` (optional)

**Returns:** `Promise<T>`

##### `toUTxO`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `response`: `AddressUtxoResponse`

**Returns:** `UTxO`

---

## File: core\src\utils\providers\demeter.provider.ts

### Class: `DemeterProvider`
Provider for Demeter's Blockfrost-compatible hosted endpoints.

Demeter exposes a Blockfrost-compatible API where authentication is embedded
in the subdomain of the endpoint URL.

Authenticated Endpoint URL format:
`https://{authToken}.cardano-{network}.blockfrost-m1.demeter.run`

**Visibility:** `public` | **Exported:** `true`

#### Constructors
- `constructor(config: DemeterProviderConfig) {
		const baseURL = `https://${config.authToken}.cardano-${config.network}.blockfrost-m1.demeter.run/api/v${config.apiVersion ?? 0}`
		super({
			apiKey: config.authToken,
			network: config.network,
			baseURL,
			cachingOptions: config.cachingOptions
		})
	}` 

#### Methods
---

## File: core\src\utils\providers\blockfrost.provider.ts

### Class: `BlockfrostProvider`
No description available.

**Visibility:** `public` | **Exported:** `true`

#### Constructors
- `constructor(config: BlockfrostProviderConfig) {
		super()

		this._network = config.network
		this._projectId = config.apiKey
		if (config.apiKey === '') {
			throw new Error('Blockfrost API key is required')
		}

		this._cachingOptions = { ...this._cachingOptions, ...config.cachingOptions }

		this._axiosInstance = axios.create({
			baseURL: config.baseURL ?? `https://cardano-${this._network}.blockfrost.io/api/v${config.apiVersion ?? 0}`,
			headers: {
				project_id: this._projectId
			},
			timeout: 10000
		})

		this.fetcher = this.buildFetcher()
		this.submitter = this.buildSubmitter()
	}` 

#### Methods
##### `buildFetcher`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `IFetcher`

##### `buildSubmitter`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `ISubmitter`

##### `toUTxO`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `response`: `UtxoResponse`

**Returns:** `UTxO`

---

## File: core\src\utils\providers\base.ts

### Class: `BaseWalletProvider`
No description available.

**Visibility:** `public` | **Exported:** `true`

#### Constructors

#### Methods
---

## File: core\src\utils\cardano-wasm\serializer.ts

### Function: `serializeAssetUnit`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `policyId`: `string`
- `assetName`: `string`

**Returns:** `string`

---

## File: core\src\utils\cardano-wasm\resolver.ts

### Function: `resolveTxHash`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `cborHex`: `string`

**Returns:** `string`

---

### Function: `resolveTxBodyHash`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `txBody`: `TransactionBody`

**Returns:** `TransactionHash`

---

## File: core\src\utils\cardano-wasm\deserializer.ts

### Function: `deserializeTx`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `txCborHex`: `string`

**Returns:** `FixedTransaction`

---

### Function: `deserializeAssetUnit`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `assetUnit`: `string`

**Returns:** `{ policyId: string; assetName: string; }`

---

### Function: `deserializeAddress`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `bech32`: `string`

**Returns:** `DeserializerAddress`

---

### Function: `deserializePlutusScript`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `scriptCbor`: `string`
- `version`: `LanguageVersion` (optional) - Default: `'V3'`

**Returns:** `PlutusScript`

---

### Function: `deserializePlutusScriptHash`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `scriptCbor`: `string`
- `version`: `LanguageVersion` (optional) - Default: `'V3'`

**Returns:** `string`

---

### Function: `deserializePlutusData`
Deserialize PlutusData from cbor hex
Used to convert inlineDatum from string to PlutusData

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `dataCbor`: `string`

**Returns:** `PlutusData`

---

## File: core\src\utils\cardano-wasm\converter.ts

### Function: `convertUTxOToUTxOObject`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `utxos`: `UTxO`

**Returns:** `UTxOObject`

---

### Function: `convertUTxOObjectToUTxO`
Convert UTxO Object to UTxO[]

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `utxoObject`: `UTxOObject`

**Returns:** `UTxO`

---

### Function: `convertUTxOObjectToUTxOWithOptions`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `utxoObject`: `UTxOObject`
- `options`: `ConvertUTxOObjectToUTxOOptions` (optional) - Default: `{}`

**Returns:** `UTxO`

---

### Function: `convertTxOutputToWasm`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `output`: `TxOutput`

**Returns:** `TransactionOutput`

---

## File: core\src\utils\cardano-wasm\build-keys.ts

### Function: `harden`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `num`: `number`

**Returns:** `number`

---

### Function: `buildBaseAddress`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `networkId`: `number`
- `paymentKeyHash`: `Ed25519KeyHash`
- `stakeKeyHash`: `Ed25519KeyHash`

**Returns:** `BaseAddress`

---

### Function: `buildEnterpriseAddress`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `networkId`: `number`
- `paymentKeyHash`: `Ed25519KeyHash`

**Returns:** `EnterpriseAddress`

---

### Function: `buildRewardAddress`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `networkId`: `number`
- `stakeKeyHash`: `Ed25519KeyHash`

**Returns:** `RewardAddress`

---

### Function: `buildDRepID`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `dRepKey`: `Ed25519KeyHash`
- `networkId`: `number` (optional) - Default: `NETWORK_ID.MAINNET`

**Returns:** `any`

---

### Function: `buildKeys`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `privateKeyHex`: `string | [string, string]`
- `accountIndex`: `number`
- `keyIndex`: `number` (optional) - Default: `0`

**Returns:** `Bip32PrivateKey`

---

### Function: `clampScalar`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `scalar`: `Buffer<ArrayBufferLike>`

**Returns:** `Buffer<ArrayBufferLike>`

---

### Function: `stripExtendedKey`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `extendedKeyHex`: `string`

**Returns:** `string`

---

## File: core\src\types\protocol.ts

### Function: `castProtocol`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `data`: `Protocol`

**Returns:** `Protocol`

---

## File: core\src\types\cardano\asset.ts

### Function: `mergeAssets`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `assets`: `Asset`

**Returns:** `Asset`

---

## File: core\src\types\cardano\asset-metadata.ts

### Function: `metadataToCip68`
Transform the metadata into the format needed in CIP68 inline datum (in Mesh Data type)

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `metadata`: `any`

**Returns:** `Data`

---

## File: core\src\constants\protocol-parameters.ts

### Function: `resolveTxFees`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `txSize`: `number`
- `minFeeA`: `number` (optional) - Default: `DEFAULT_PROTOCOL_PARAMETERS.minFeeA`
- `minFeeB`: `number` (optional) - Default: `DEFAULT_PROTOCOL_PARAMETERS.minFeeB`

**Returns:** `string`

---

