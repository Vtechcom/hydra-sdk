# API Specification: hydra-transaction

## File: hydra-transaction\src\utils\redeemer-builder.ts

### Function: `buildRedeemer`
Builds a redeemer for a Plutus script.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `jsValue`: `Record<string, string>`
- `options`: `{ tag?: RedeemerTagType; index?: string | number; exUnits?: { mem: string; steps: string; }; }` (optional)

**Returns:** `Redeemer`

---

### Function: `emptyRedeemer`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `options`: `{ tag?: RedeemerTagType; index?: string | number; type?: "int" | "bytes" | "list" | "map" | "constr"; exUnits?: { mem: string; steps: string; }; }` (optional)

**Returns:** `Redeemer`

---

## File: hydra-transaction\src\utils\metadata.ts

### Function: `metadataObjToMetadatum`
No description available.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `metadata`: `string | number | bigint | Object | any[] | Uint8Array<ArrayBufferLike> | Map<any, any>`

**Returns:** `TransactionMetadatum`

---

## File: hydra-transaction\src\utils\datum-builder.ts

### Function: `datumBuilder`
- Primitive: `int`, `bytes`.
- Collections: `list`, `map`.
- Structured: `constr`.

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- None

**Returns:** `PlutusData`

---

## File: hydra-transaction\src\utils\bigint.utils.ts

### Function: `bigIntReplacer`
Utility functions for handling BigInt serialization/deserialization in NestJS
Custom JSON.stringify replacer function to handle BigInt values
Converts BigInt to string with 'n' suffix to preserve type information

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `_key`: `string`
- `value`: `any`

**Returns:** `any`

---

### Function: `bigIntReviver`
Custom JSON.parse reviver function to handle BigInt values
Converts string with 'n' suffix back to BigInt

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `_key`: `string`
- `value`: `any`

**Returns:** `any`

---

### Function: `convertBigIntToString`
Recursively converts BigInt values in an object to strings
This is useful for API responses where BigInt needs to be serialized

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `obj`: `T`

**Returns:** `StringifyBigIntType<T>`

---

### Function: `convertStringToBigInt`
Recursively converts string values back to BigInt where appropriate
This is the reverse of convertBigIntToString

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `obj`: `any`
- `bigIntFields`: `string[]` (optional) - Default: `[]`

**Returns:** `any`

---

### Function: `safeStringify`
Safe JSON stringify that handles BigInt values

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `obj`: `any`
- `space`: `string | number` (optional)

**Returns:** `string`

---

### Function: `safeParse`
Safe JSON parse that handles BigInt values

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `json`: `string`

**Returns:** `any`

---

### Function: `transformForApiResponse`
Transform object for API response - converts BigInt to strings
and adds metadata about which fields were BigInt

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `obj`: `any`

**Returns:** `{ data: any; bigIntFields?: string[]; }`

---

### Function: `createBigIntConverter`
Type-safe helper function to create a BigInt-to-string converter
This ensures compile-time type safety for the conversion

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- None

**Returns:** `{ convert: (obj: T) => StringifyBigIntType<T>; type: StringifyBigIntType<T>; }`

---

### Function: `hasBigIntValues`
Utility to check if an object contains any BigInt values

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `obj`: `any`

**Returns:** `boolean`

---

### Function: `needsBigIntConversion`
Type guard function to check if conversion is needed

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- `obj`: `any`

**Returns:** `boolean`

---

### Function: `exampleUsage`
Example usage demonstrating proper typing

**Visibility:** `public` | **Exported:** `true`

**Parameters:**
- None

**Returns:** `{ id: string; name: string; values: string[]; nested: { amount: string; description: string; }; }`

---

## File: hydra-transaction\src\tx-builder\index.ts

### Class: `TxBuilder`
No description available.

**Visibility:** `public` | **Exported:** `true`

#### Constructors
- `constructor(options: TxBuilderOptions = {}) {
		const { params, fetcher, submitter, isHydra = false, verbose = false, errorLogger = false } = options

		this._fetcher = fetcher
		this._submitter = submitter
		this._isHydra = isHydra
		this._verbose = verbose
		this._errorLogger = errorLogger

		if (params) {
			this.updateProtocolParams(params)
		}
		this._txBuilder = TxBuilder.getTxBuilder(this._protocolParams)
	}` 

#### Methods
##### `updateProtocolParams`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `params`: `Protocol`

**Returns:** `this`

##### `txIn`
Add transaction input (similar to Mesh txIn)

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `txHash`: `string`
- `outputIndex`: `number`
- `amount`: `Asset` (optional)
- `address`: `string` (optional)

**Returns:** `TxBuilder`

##### `txInInlineDatum`
Add script input

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `inlineDatum`: `Datum`

**Returns:** `TxBuilder`

##### `setInputUtxo`
TODO: Implement in the next version (v2.x)

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `utxoobject`: `UTxOObject`

**Returns:** `this`

##### `addInputUtxo`
TODO: Implement in the next version (v2.x)

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `utxoobject`: `UTxOObject`

**Returns:** `this`

##### `txInDatumHash`
Add datum hash to the script input

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `datum`: `Datum`

**Returns:** `TxBuilder`

##### `txInRedeemerValue`
Add redeemer to the script input

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `redeemer`: `Redeemer`

**Returns:** `TxBuilder`

##### `txInEmptyRedeemer`
Add redeemer to the script input

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `TxBuilder`

##### `txInScript`
Add script to the last input

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `scriptCbor`: `string`
- `version`: `LanguageVersion` (optional) - Default: `'V3'`

**Returns:** `TxBuilder`

##### `txInReference`
Add UTxO reference input

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `txHash`: `string`
- `outputIndex`: `number`

**Returns:** `TxBuilder`

##### `spendingPlutusScript`
Set spending Plutus script version

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `version`: `LanguageVersion`

**Returns:** `TxBuilder`

##### `txOut`
Add transaction output (similar to Mesh txOut)

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `address`: `string`
- `amount`: `Asset`

**Returns:** `TxBuilder`

##### `txOutInlineDatumValue`
Add transaction output with inline datum

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `inlineDatum`: `Datum`

**Returns:** `TxBuilder`

##### `txOutDatumHashValue`
Add transaction output with datum hash

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `datum`: `Datum`

**Returns:** `TxBuilder`

##### `txOutReferenceScript`
Add script reference to output

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `scriptCbor`: `string`
- `version`: `LanguageVersion` (optional) - Default: `'V3'`

**Returns:** `TxBuilder`

##### `selectUtxosFrom`
Select UTxOs from provided list using coin selection strategy

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `simpleUTxOs`: `UTxO`
- `strategy`: `"LargestFirst" | "RandomImprove" | "LargestFirstMultiAsset" | "RandomImproveMultiAsset"` (optional) - Default: `'LargestFirstMultiAsset'`
- `options`: `{ recalculateScriptDataHash?: boolean; }` (optional)

**Returns:** `TxBuilder`

##### `buildSimpleUtxo`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `utxo`: `UTxO`
- `options`: `{ withDatum: boolean; }` (optional) - Default: `{ withDatum: true }`

**Returns:** `TransactionOutput`

##### `setInputs`
Legacy method for backward compatibility

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `utxos`: `UTxO`
- `options`: `{ strategy: "LargestFirst" | "RandomImprove" | "LargestFirstMultiAsset" | "RandomImproveMultiAsset"; }` (optional) - Default: `{ strategy: 'LargestFirstMultiAsset' }`

**Returns:** `this`

##### `txInCollateral`
Add collateral input

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `txHash`: `string`
- `outputIndex`: `number`
- `amount`: `Asset`
- `address`: `string`

**Returns:** `TxBuilder`

##### `totalCollateral`
Set total collateral amount

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `amount`: `string`

**Returns:** `TxBuilder`

##### `collateralReturn`
Set collateral return output

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `address`: `string`
- `amount`: `Asset`

**Returns:** `TxBuilder`

##### `mintPlutusScript`
Mint assets with native script

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `version`: `LanguageVersion`

**Returns:** `TxBuilder`

##### `mint`
Add mint asset

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `quantity`: `string`
- `policyId`: `string`
- `assetName`: `string`

**Returns:** `TxBuilder`

##### `mintingScript`
Add minting script

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `mintingScript`: `PolicyScript`

**Returns:** `TxBuilder`

##### `mintRedeemerValue`
Add mint redeemer

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `redeemer`: `Redeemer`

**Returns:** `TxBuilder`

##### `registerStake`
Register stake address

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `rewardAddress`: `string`

**Returns:** `TxBuilder`

##### `deregisterStake`
Deregister stake address

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `rewardAddress`: `string`

**Returns:** `TxBuilder`

##### `delegateStake`
Delegate stake to pool

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `rewardAddress`: `string`
- `poolKeyHash`: `string`

**Returns:** `TxBuilder`

##### `withdrawal`
Withdraw rewards

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `rewardAddress`: `string`
- `amount`: `string`

**Returns:** `TxBuilder`

##### `metadataValue`
Add metadata to transaction

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `label`: `BigNum`
- `value`: `string | number | object`

**Returns:** `TxBuilder`

##### `auxiliaryData`
Add auxiliary data hash

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `hash`: `string`

**Returns:** `TxBuilder`

##### `invalidBefore`
Set invalid before slot

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `slot`: `number`

**Returns:** `TxBuilder`

##### `invalidAfter`
Set invalid after slot

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `slot`: `number`

**Returns:** `TxBuilder`

##### `requiredSignerHash`
Add required signer by public key hash

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `pubKeyHash`: `string`

**Returns:** `TxBuilder`

##### `changeAddress`
Set change address

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `address`: `string`

**Returns:** `TxBuilder`

##### `calculateFee`
Calculate minimum fee

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `BigNum`

##### `setFee`
Set specific fee amount

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `fee`: `BigNum`

**Returns:** `TxBuilder`

##### `setMinFee`
Set specific fee amount

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `minFee`: `BigNum`

**Returns:** `TxBuilder`

##### `addOutput`
Legacy method: Add output

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `output`: `TxOutput`

**Returns:** `TxBuilder`

##### `addOutputs`
Legacy method: Add multiple outputs

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `outputs`: `TxOutput`

**Returns:** `TxBuilder`

##### `addLovelaceOutput`
Legacy method: Add lovelace-only output

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `address`: `string`
- `lovelace`: `string`

**Returns:** `TxBuilder`

##### `setChangeAddress`
Legacy method: Set change address

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `address`: `string`

**Returns:** `TxBuilder`

##### `minAda`
Legacy method: Calculate min ada for assets

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `placeholderOutput`: `TransactionOutput`
- `protocolParams`: `Protocol` (optional) - Default: `DEFAULT_PROTOCOL_PARAMETERS`

**Returns:** `BigNum`

##### `minAdaForAssets`
Legacy method: Calculate min ada for assets

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `assets`: `Asset`

**Returns:** `BigNum`

##### `complete`
Build and complete the transaction

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `Transaction`

##### `reset`
Reset the transaction builder to initial state

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `TxBuilder`

##### `_addOutputToBuilder`
Add output to the CardanoWASM transaction builder

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `output`: `TxOutput`

**Returns:** `void`

##### `_outputAmountToValue`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `amount`: `Asset`

**Returns:** `Value`

##### `_addInputToBuilder`
Add input to the CardanoWASM transaction builder

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `input`: `TxIn`

**Returns:** `void`

##### `_addInputsToBuilder`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `inputs`: `TxIn`
- `strategy`: `"LargestFirst" | "RandomImprove" | "LargestFirstMultiAsset" | "RandomImproveMultiAsset"` (optional) - Default: `'LargestFirstMultiAsset'`

**Returns:** `void`

##### `_addReferenceInputsToBuilder`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `referenceInputs`: `TxIn`

**Returns:** `void`

##### `_addCollateralToBuilder`
Add collateral to the CardanoWASM transaction builder

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `collateral`: `CollateralInput`

**Returns:** `void`

##### `_addMintToBuilder`
Add mint to the CardanoWASM transaction builder

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `_mint`: `MintAsset`

**Returns:** `void`

##### `_addCertificateToBuilder`
Add certificate to the CardanoWASM transaction builder

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `_cert`: `Certificate`

**Returns:** `void`

##### `_addWithdrawalToBuilder`
Add withdrawal to the CardanoWASM transaction builder

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `withdrawal`: `Withdrawal`

**Returns:** `void`

##### `_setValidityRange`
Set validity range on the transaction builder

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `void`

##### `_addRequiredSigner`
Add required signer to the transaction builder

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `pubKeyHash`: `string`

**Returns:** `void`

##### `_addMetadata`
Add metadata to the transaction builder

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `void`

##### `_buildCostModels`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- None

**Returns:** `Costmdls`

##### `getTxBuilder`
No description available.

**Visibility:** `internal` | **Exported:** `false`

**Parameters:**
- `pp`: `Protocol`

**Returns:** `TransactionBuilder`

---

