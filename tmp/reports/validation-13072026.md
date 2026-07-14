# Docs Validation Report — `apps/docs/content` (English) vs v1.4.0

- **Date:** 2026-07-13
- **Scope:** All 32 English docs under `apps/docs/content/**` (excludes `vi/` and `ja/`).
- **Verified against source of record:**
  - `@hydra-sdk/core` **1.4.0**
  - `@hydra-sdk/bridge` **1.3.1**
  - `@hydra-sdk/transaction` **1.1.8**
  - `@hydra-sdk/cardano-wasm` **0.0.7**
- **Method:** Every code snippet, import, symbol name, signature, version number and provider name was cross-referenced against `packages/*/src` (not against the docs). The most-cited High findings were re-verified directly against source.

---

## 1. Executive summary

| Severity | Count | Meaning |
|---|---:|---|
| 🔴 High | ~35 | Broken code / nonexistent API — the snippet will not compile or run |
| 🟡 Medium | ~20 | Wrong signature, wrong shape, or stale-but-partly-usable |
| 🔵 Low | ~15 | Stale version labels, smart-quotes, illustrative pseudo-code |

**Docs with issues: 22 / 32.** Fully clean: 10 (listed in §6).

### Cross-cutting systemic problems (fix these patterns everywhere)

1. **🔴 Top-level imports of namespaced utilities.** By far the most pervasive defect. `packages/core/src/index.ts` only `export *`s `./utils/parser` at the top level. Everything else is exported **only** under a namespace. Docs repeatedly import bare `deserializeTx`, `serializeAssetUnit`, `convertUTxOObjectToUTxO`, `mkInt`, `BlockfrostProvider`, etc. from `@hydra-sdk/core` — none of these exist as top-level names.
   - `deserializeTx`, `deserializeAssetUnit`, `deserializeAddress`, `deserializeAmountsFromTx` → `Deserializer.*`
   - `serializeAssetUnit` → `Serializer.*`
   - `convertUTxOObjectToUTxO`, `convertUTxOToUTxOObject` → `Converter.*`
   - `mkInt`, `mkBytes`, `mkConstr`, `mkMap`, … → `DatumUtils.*`
   - `BlockfrostProvider`, `OgmiosProvider`, `DemeterProvider` → `ProviderUtils.*`
   - **OK as top-level** (genuinely re-exported via `./utils/parser`): `bytesToHex`, `hexToBytes`, `stringToHex`, `hexToString`, `toBytes`, `fromUTF8`, `toUTF8`, `isBytes`.

2. **🔴 Provider config field is `apiKey`, not `projectId`.** `BlockfrostProviderConfig` reads `config.apiKey` and throws `Blockfrost API key is required` otherwise. `projectId` appears in at least 3 docs.

3. **🔴 `HexcoreConnector` constructor is positional:** `constructor(socketIoUrl: string, options?)`. Passing a single options object makes `parseUrl()` throw `Invalid socket io url`. Docs pass `{ socketIoUrl, … }`.

4. **🔴 Wrong `HydraBridge` event names.** The only valid `HydraBridgeEvents` keys are `onMessage`, `onConnectError`, `onConnected`, `onDisconnected`. Docs invent `onHeadIsOpen`, `onHeadIsClosed`, `onTxValid`, `onTxInvalid`, `onError`. Head/Tx state must be read by switching on `payload.tag` inside `onMessage`.

5. **🟡 `resolveSlotNo` / `resolveEpochNo` take `network` first, not a timestamp.** Signature is `resolveSlotNo(network: Network, milliseconds = Date.now())`. Docs show `resolveSlotNo(Date.now())`.

6. **🟡 `NETWORK_ID.TESTNET` does not exist.** Keys are only `MAINNET`, `PREPROD`, `PREVIEW` (`NETWORK_ID` is a `Record`, not an enum). `NETWORK_ID.TESTNET` silently returns `undefined`.

7. **🟡 The changelog / "What's New" content is one-to-three releases stale across the whole site.** Almost every landing page still says "v1.1.0"/"v1.3.0"/"v1.3.1 (Latest)". No page documents v1.4.0 at all (RedeemerUtils, new DatumUtils encoders, ValidationUtils, protocol v11, `deserializeAmountsFromTx`, Resolver memory-leak fix). v1.3.2 (Demeter provider, `mkList`, `baseURL`, metadata fixes) is also missing from the changelog.

---

## 2. ⚠️ Suspicious / broken tutorials (priority list)

These are the tutorials/guides whose code **will not run as written** — ranked by how broken they are. This is the actionable "tutorial nghi vấn sai" list.

| # | Doc | Why it breaks | Worst severity |
|---|---|---|---|
| 1 | `2.api/5.utilities.md` | Whole "Cardano WASM Utilities" section + provider-query example document functions that don't exist (`serializeTransaction`, `deserializeTransaction`, `resolveAddress`, `Converter.bytesToHex`, `BuildKeys.deriveKeys`, `provider.getUtxos`) | 🔴 High |
| 2 | `2.api/1.core.md` | ~21 utility helpers documented as top-level imports (namespaced only); `resolveSlotNo`/`resolveEpochNo` wrong signature; `NETWORK_ID.TESTNET`; `buildCostModels()` no-arg | 🔴 High |
| 3 | `2.api/3.transaction.md` | `withdraw` (→`withdrawal`), `buildDatum` (nonexistent), `selectUtxosFrom` (private), `metadataObjToMetadatum` (not exported from this pkg) | 🔴 High |
| 4 | `3.examples/3.transaction-building.md` | `DatumUtils.mkString` (nonexistent); top-level `deserializeTx`/`serializeAssetUnit`; snippets use `ProviderUtils`/`DatumUtils` without importing them | 🔴 High |
| 5 | `3.examples/4.full-application.md` | `bridge.queryUTxO()` (nonexistent), `HexcoreConnector({...})` ctor, `wallet.mnemonic`, `account.stakeAddressBech32`, `onError` event, top-level `deserializeTx` | 🔴 High |
| 6 | `3.examples/2.hydra-integration.md` | Wrong event names (`onHeadIsOpen`…), `bridge.connected` used as property, top-level `convertUTxOObjectToUTxO` | 🔴 High |
| 7 | `3.examples/9.from-cadano-cli.md` | `NETWORK_ID.TESTNET`, `TxBuilder`/`BlockfrostProvider` imported from core, `projectId`, `new TxBuilder(provider)` | 🔴 High |
| 8 | `3.examples/8.transaction-signing.md` | Every snippet imports top-level `deserializeTx` | 🔴 High |
| 9 | `3.examples/7.utilities-examples.md` | Top-level `serializeAssetUnit` / `deserializeTx` | 🔴 High |
| 10 | `4.guides/working-with-utilities.md` | `projectId`, Ogmios `url`, `provider.getUtxos()` / `getProtocolParameters()` (none exist) | 🔴 High |
| 11 | `4.guides/mint-burn-tokens.md` | Top-level `serializeAssetUnit`/`deserializeTx`; `HexcoreApi` used but never defined/imported | 🔴 High |
| 12 | `1.getting-started/3.quick-start.md` | `HexcoreConnector({...})` wrong constructor | 🔴 High |
| 13 | `1.getting-started/migration-v1.1.0.md` | `projectId`; `ProviderUtils.BaseProvider` (nonexistent); `unixTimeToEnclosingSlot(ts, networkString)` wrong 2nd arg | 🔴 High |
| 14 | `3.examples/1.wallet-creation.md` | `account.paymentKeyHash` (nonexistent property → `undefined`) | 🟡 Medium |

Also broken but **changelog/reference, not a runnable tutorial**: `1.getting-started/6.change-logs.md` (missing v1.4.0 + v1.3.2; wrong version table).

---

## 3. Detailed findings — Getting Started + root index

### `apps/docs/content/index.md`
- **L1, L9** · 🔵 outdated-version — Title `# Hydra SDK Documentation v1.1.0` and `**Latest Release: v1.1.0**` are 3 minors stale (core 1.4.0 / bridge 1.3.1). The code snippet (L31-54) itself is correct.

### `apps/docs/content/1.getting-started/1.index.md`
- **L9, L22** · 🔵 outdated-version — `**Latest Version: v1.1.5**` and `## What's New in v1.1.x` are stale vs 1.4.0.

### `apps/docs/content/1.getting-started/3.quick-start.md`
- **L196-204** · 🔴 wrong-signature — `new HexcoreConnector({ socketIoUrl, socketIoOptions })`. Correct: `new HexcoreConnector('wss://…/hydra', { socketIoOptions: { auth: { token } } })`. Everything else on the page (Blockfrost `apiKey`, `.fetcher`/`.submitter`, TxBuilder chain `.complete()`, `HydraBridge` options, `events.on('onConnected'|'onMessage')`, `getAddressBalance`) verified correct.

### `apps/docs/content/1.getting-started/5.performance.md`
- **L118-146** · 🔵 other — Both TS code blocks use curly/smart quotes (`'…'`) instead of straight `'` → copy-paste is a syntax error. API content (`getAddressBalance`, `Converter.convertUTxOObjectToUTxOWithOptions({ maxDatumCacheSize })`) is correct.

### `apps/docs/content/1.getting-started/6.change-logs.md`
- **Whole file** · 🔴 missing-v1.4.0-coverage — Newest entry is `## Version 1.3.1 (Latest)`. Missing the entire **v1.4.0** entry (RedeemerUtils namespace; DatumUtils `mkBool`/`mkOption`/`mkBytesList`/`mkIntList`/`mkOutputRef`/`mkAddress`/`parseAddress`; ValidationUtils; AddressUtils relocation + `getPubkeyHashFromAddress`; ValidatorUtils deprecation; protocol v11 `minPoolCost=170000000`; `Deserializer.deserializeAmountsFromTx`; Resolver memory-leak fix). Intermediate **v1.3.2** core release also entirely absent (Demeter provider, `mkList`, `BlockfrostProviderConfig.baseURL`, metadata validation fixes).
- **L8** · 🟡 outdated-version — `(Latest)` marker is on 1.3.1; belongs on 1.4.0.
- **L531** · 🔴 outdated-version — Package table lists `@hydra-sdk/core` = **1.3.0**; actual **1.4.0**.
- **L532** · 🟡 outdated-version — table lists `@hydra-sdk/transaction` = **1.1.7**; actual **1.1.8**. (bridge 1.3.1, cardano-wasm 0.0.7, tsconfig/eslint 0.0.4 rows are correct.)

### `apps/docs/content/1.getting-started/migration-v1.1.0.md`
- **L183-186** · 🔴 wrong-signature — `BlockfrostProvider({ projectId })` → field is `apiKey`.
- **L189-193** · 🔴 wrong-api — `class MyProvider extends ProviderUtils.BaseProvider` — `ProviderUtils.BaseProvider` is `undefined`. Base class is `BaseWalletProvider` and is **not** re-exported through `ProviderUtils`.
- **L338-341** · 🟡 wrong-signature — `unixTimeToEnclosingSlot(Date.now(), network)` passes a network string; the 2nd arg must be a `SlotConfig` (e.g. `SLOT_CONFIG_NETWORK.PREPROD`). The doc's own assertion `slot > 0` fails as written. (Contradicts correct usage at L60-67 in the same file.)

**Clean:** `2.installation.md`, `4.configuration.md`.

---

## 4. Detailed findings — API Reference (`2.api/`)

### `apps/docs/content/2.api/index.md`
- **L15-20** · 🔵 other — "What's New in v1.1.0" landing section never mentions any v1.2–v1.4 additions.

### `apps/docs/content/2.api/1.core.md`
- **L543-1011** · 🔴 wrong-api — The whole "Utility Functions" section documents ~21 helpers as bare top-level imports from `@hydra-sdk/core`. They exist **only** namespaced: `getPubkeyHashFromAddress`/`isValidAddress`→`AddressUtils.*`; `isValidTxOutput`→`ValidationUtils.*`; `slotToBeginUnixTime`/`unixTimeToEnclosingSlot`/`resolveSlotNo`/`resolveEpochNo`/`buildHydraSlotConfig`→`TimeUtils.*`; `buildPolicyScriptFromPubkey`/`buildMintingPolicyScriptFromAddress`/`buildMintingPolicyScriptFromKeyHash`/`policyIdFromNativeScript`→`PolicyUtils.*`; `metadataObjToMetadatum`→`MetadataUtils.*`; `cardanoCliKeygen`/`hydraCliKeygen`/`genVkey`→`KeysUtils.*`; `mkInt`/`mkBytes`/`mkConstr`/`mkMap`→`DatumUtils.*`; `buildCostModels`→`CostModels.*`. (Only the parser fns at L787-923 are genuinely top-level.)
- **L647-663, L667-683** · 🔴 wrong-signature — `resolveSlotNo(timestamp)`/`resolveEpochNo(timestamp)` — first arg is `network: Network`, not a timestamp.
- **L1096-1109** · 🟡 wrong-signature — `buildCostModels()` no-arg throws; needs `{ plutusV1?, plutusV2?, plutusV3? }`. Use `CostModels.defaultCostModels` for zero-config.
- **L1190** · 🟡 wrong-api — `NETWORK_ID.TESTNET // 0` does not exist.
- **L14, L38-39** · 🟡 wrong-signature — `AppWallet.brew()` returns `string[]`, not a space-joined `string`.
- **L299-315** · 🟡 wrong-signature — `EmbeddedWallet.generateMnemonic()` returns `string[]`, not `string`.
- **L226-252** · 🔵 other — `AppWallet.signData()` documented as returning `{signature,key}`, but it throws `[AppWallet] signData() is not implemented.` (only `EmbeddedWallet.signData` works).
- **L687** · 🔵 wrong-signature — `buildHydraSlotConfig(timestamp?)` "Default: current time" is wrong; `startTimestamp` is required, plus an optional `options` param.
- **L483-537** · 🟡 missing-api-coverage — Provider section omits `DemeterProvider` (v1.3.2).

### `apps/docs/content/2.api/2.bridge.md`
- **L107, L122** · 🔵 wrong-signature — `connect()`/`disconnect()` return `Promise<boolean>`, not `Promise<void>`.
- **L16, L744-759** · 🔵 wrong-api — Constructor option type is `InitHydraBridgeOptions` (not `HydraBridgeOptions`; not exported).
- **L615-628** · 🔵 wrong-api — `HexcoreConnector` example passes `socketIoUrl:` field; that field is commented out in `HexcoreConnectorOptions`.
- (Core method inventory — `commands.*`, `submitTx`/`submitTxSync`, `getAddressBalance`, `queryAddressUTxO`, `snapshotUtxoArray`, `slotZeroTimestamp`, `lastSnapshotNumber` — matches source.)

### `apps/docs/content/2.api/3.transaction.md`
- **L312-325** · 🔴 wrong-api — `TxBuilder.withdraw(...)` → source method is `withdrawal(...)`.
- **L507-524** · 🔴 wrong-api — `buildDatum(data)` from `@hydra-sdk/transaction` does not exist (only internal `datumBuilder()`, not even re-exported).
- **L57-81** · 🟡 wrong-api — `selectUtxosFrom(...)` is documented public but is `private` in source; used across many examples on this page.
- **L528-539** · 🟡 wrong-signature — `buildRedeemer()` needs required `jsValue: Record<string,string>` (no-arg throws).
- **L558-575** · 🟡 wrong-api — `metadataObjToMetadatum` is not exported from `@hydra-sdk/transaction` (it's `MetadataUtils.metadataObjToMetadatum` in core).
- **L466-478** · 🔵 other — `calculateFee()` is a stub returning `BigNum.zero()`.
- **L579-601** · 🔵 missing-api-coverage — `TxBuilderOptions`/`CoinSelectionStrategy` not re-exported; constructor omits `errorLogger?`.
- (`emptyRedeemer()`, `minAda`, `complete`, `reset`, `setInputs`, input/output/mint/collateral/validity methods verified correct.)

### `apps/docs/content/2.api/5.utilities.md`
- **L851-991** · 🔴 wrong-api — Whole "Cardano WASM Utilities" section documents nonexistent functions: `Serializer.serializeTransaction` (only `serializeAssetUnit`), `Deserializer.deserializeTransaction` (real: `deserializeTx`), `Resolver.resolveAddress` (only `resolveTxHash`/`resolveTxBodyHash`), `Converter.bytesToHex`/`hexToBytes` (Converter has no hex helpers), `BuildKeys.deriveKeys` (no such fn).
- **L1128-1150** · 🔴 wrong-api — "Query Blockchain with Provider" example: `projectId` (→`apiKey`), `provider.getUtxos()`/`getProtocolParameters()` (neither exists — use `provider.fetcher.fetchAddressUTxOs()`), `new OgmiosProvider({ url })` (config is `{ network, apiEndpoint? }`), `ogmiosProvider.getUtxos()`.
- **L660-700** · 🟡 wrong-signature — `resolveSlotNo(unixTime)`/`resolveEpochNo(unixTime)` — first arg is `network`.
- **L758-762, L822, L1128-1135** · 🟡 wrong-api — Providers imported bare (`BlockfrostProvider`/`OgmiosProvider`) instead of `ProviderUtils.*`.
- **L997-1011** · 🟡 wrong-signature — `buildCostModels()` no-arg.
- **L346-441** · 🟡 missing-api-coverage — DatumUtils section covers only `mkInt/mkBytes/mkConstr/mkMap`; missing `mkList` + all v1.4.0 encoders; entire `RedeemerUtils` namespace and `ValidationUtils.isValidTxOutput` undocumented site-wide.
- **L730-847** · 🔵 missing-api-coverage — Provider Utilities omit `DemeterProvider` and `BlockfrostProviderConfig.baseURL`.
- **L72-106** · 🔵 other — `cardanoCliKeygen` return shape mislabeled (`HydraCliSkey/Vkey` vs `CardanoCLiSkey/Vkey`); `CardanoCLiKeyPair`/`HydraCliKeyPair` type names not exported.
- **L1062, L1068** · 🔵 other — reads `keys.vkey.cborHex`; property is `vk`, not `vkey`.

**Clean:** `2.api/4.cardano-wasm.md` (import path correct; documented symbols are genuine CSL APIs surfaced via the `CardanoWASM` re-export).

---

## 5. Detailed findings — Packages, Examples, Guides, Hydra-Concept

### `5.packages/`
- **`1.core.md` L10-14** · 🟡 missing-api-coverage — "What's New in v1.3.0" only; omits all v1.4.0 additions.
- **`1.core.md` L24-30** · 🟡 wrong-api — `NETWORK_ID` documented as an `enum` with a fabricated `TESTNET` member and no `PREVIEW`. Source is `const NETWORK_ID: Record<Network, number>` keyed `MAINNET`/`PREPROD`/`PREVIEW`.
- **Clean:** `5.packages/index.md`, `2.bridge.md`, `3.transaction.md`, `4.cardano-wasm.md` (quick-example APIs verified against source).

### `3.examples/`
- **`1.wallet-creation.md` L62,85,110,140,165,189** · 🟡 wrong-api — `account.paymentKeyHash` does not exist (use `account.paymentKeyHex`, or derive the hash).
- **`2.hydra-integration.md`** · 🔴 — L90/L107 top-level `convertUTxOObjectToUTxO` (→`Converter.*`); L63-75/L209 invalid events `onHeadIsOpen`/`onHeadIsClosed`/`onTxValid`/`onTxInvalid`; L217 `bridge.connected` used as property (it's a method `connected()`).
- **`3.transaction-building.md`** · 🔴 — L306 `DatumUtils.mkString` (nonexistent → use `mkBytes(stringToHex(...))`); L119-127/L205/L214/L267/L354 top-level `deserializeTx`/`serializeAssetUnit`; L266-304/L353-360 use `ProviderUtils`/`DatumUtils` without importing them.
- **`4.full-application.md`** · 🔴 — L169 `HexcoreConnector({...})` ctor; L321 `bridge.queryUTxO()` (→`querySnapshotUtxo()`/`snapshotUtxoArray()`); L349/406/475 top-level `deserializeTx`; L117 `wallet.mnemonic` (no such prop); L123 `account.stakeAddressBech32` (→`rewardAddressBech32`); L213 event `onError` (→`onConnectError`); L392 `metadataValue(x)` needs `(label, value)`.
- **`7.utilities-examples.md`** · 🔴 — L26/30 top-level `serializeAssetUnit`; L236/239 top-level `deserializeTx`.
- **`8.transaction-signing.md`** · 🔴 — L13/43/83/159 every snippet imports top-level `deserializeTx`.
- **`9.from-cadano-cli.md`** · 🔴 — L81/104/136 `NETWORK_ID.TESTNET`; L93-98 `TxBuilder`/`BlockfrostProvider` imported from core (TxBuilder is in `@hydra-sdk/transaction`; provider is `ProviderUtils.*`); L108-111 `projectId` (→`apiKey`); L114 `new TxBuilder(provider)` (needs `TxBuilderOptions`). (Class name `CardanoCliWallet` used correctly.)
- **Clean:** `3.examples/index.md`, `5.full-react-app.md`, `6.full-vuejs-app.md`.

### `4.guides/`
- **`working-with-utilities.md`** · 🔴 — L147-150 `projectId` (→`apiKey`); L152-155 Ogmios `url` (→`{ network, apiEndpoint? }`); L158-159 `provider.getUtxos()`/`getProtocolParameters()` (neither exists — use `provider.fetcher.fetchAddressUTxOs()`). 🟡 whole file: no coverage of v1.4.0 utilities.
- **`mint-burn-tokens.md`** · 🔴 — L29-37/L152/L162/L211/L289-297 top-level `serializeAssetUnit`/`deserializeTx`; L71/L174 `HexcoreApi` used but never imported/defined. (`PolicyUtils.*`, `TxBuilder.mint/mintingScript`, `DatumSchema.Detailed` verified correct.)
- **`index.md` L20-24** · 🔵 outdated-version — "What's New in v1.1.0".
- **Clean:** `building-wallet-app.md` (full wallet→bridge→TxBuilder flow verified against source).

### `6.hydra-concept/`
- **`1.why-hydra.md`** · 🔵 wrong-api — `bridge.submitTransaction(tx)` (real: `submitTx`/`submitTxSync`), inside clearly illustrative pseudo-code.
- **`2.commit-to-hydra.md`** · 🔵 — L88-91 example `package.json` pins `^1.1.3`; L321/400 `HydraApi.submitCardanoTx` undefined in the doc's own axios class + `'Witnesses Tx ConwayEra'` typo (should be `'Witnessed …'`). All SDK calls on the page are correct.
- **`index.md` L78** · 🔵 outdated-version — "(v1.1.0)".
- **`4.transactions-in-hydra.md` L99,116** · 🔵 — snippet uses `walletAddress`/`wallet` without import (illustrative gap). SDK APIs correct.
- **Clean:** `3.decommit-from-hydra.md` (decommit signature exact match), `5.smart-contracts-in-hydra.md`, `6.hydra-v2-changes.md` (no SDK code; external hydra-node version claims out of scope).

---

## 6. Fully clean files (10)

`1.getting-started/2.installation.md`, `1.getting-started/4.configuration.md`,
`2.api/4.cardano-wasm.md`,
`5.packages/index.md`, `5.packages/2.bridge.md`, `5.packages/3.transaction.md`, `5.packages/4.cardano-wasm.md`,
`3.examples/index.md`, `3.examples/5.full-react-app.md`, `3.examples/6.full-vuejs-app.md`,
`4.guides/building-wallet-app.md`,
`6.hydra-concept/3.decommit-from-hydra.md`, `6.hydra-concept/5.smart-contracts-in-hydra.md`, `6.hydra-concept/6.hydra-v2-changes.md`.

*(Note: examples/index, packages/index and a few concept pages carry only stale "v1.1.0" prose labels — counted clean for code correctness.)*

---

## 7. Recommended fix order

1. **Global find-and-replace the namespaced-import pattern** (systemic issue #1) across `2.api/1.core.md`, `2.api/5.utilities.md`, and all `3.examples/*` + `4.guides/mint-burn-tokens.md`. This alone resolves the majority of High findings.
2. **Fix provider usage** everywhere: `apiKey` (not `projectId`), `ProviderUtils.*` namespace, `provider.fetcher.fetchAddressUTxOs()` (there is no `getUtxos`/`getProtocolParameters` on providers), Ogmios `{ network, apiEndpoint? }`.
3. **Fix `HexcoreConnector` constructor** (positional) and **`HydraBridge` event names** (`onMessage` + `payload.tag`) in quick-start, examples 2 & 4.
4. **Rewrite `2.api/5.utilities.md` "Cardano WASM Utilities"** and `2.api/3.transaction.md` (`withdrawal`, drop `buildDatum`, mark `selectUtxosFrom` private) against the real export list.
5. **Update the changelog page** with v1.3.2 + v1.4.0 entries and fix the version table (core 1.4.0, transaction 1.1.8).
6. **Add v1.4.0 API coverage**: `RedeemerUtils` namespace, new `DatumUtils` encoders, `ValidationUtils.isValidTxOutput`, `Deserializer.deserializeAmountsFromTx`, `DemeterProvider` — in `2.api/1.core.md`, `2.api/5.utilities.md`, `4.guides/working-with-utilities.md`, `5.packages/1.core.md`.
7. Sweep stale "v1.1.0 / v1.3.0 / Latest" labels and smart-quotes.

> Reminder: per repo docs rules, once the EN docs are corrected the same fixes must be mirrored into `vi/` and `ja/` (out of scope for this validation pass, which covered EN only).
