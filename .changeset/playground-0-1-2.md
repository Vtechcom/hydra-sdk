---
'@hydra-sdk/playground': patch
---

Wallet derivation paths, a Blockfrost/Demeter provider dialog with an opt-in saved key, and one-click UTxO copy in `/transaction-builder`.

**Wallet**

- The "Set up wallet" dialog takes an account index and a key index (`m/1852'/1815'/{account}'/0/{key}`), shows the full path, and the address, change address, mint preset and signing all follow it. Changing only the index keeps the root key. The defaults (`0'/0/0`) derive the same address as before.

**Provider**

- The inline Blockfrost form is now a **Configure** dialog with two tabs: Blockfrost (custom API URL + project key) and Demeter (port key, subdomain or `dmtr-api-key` header auth, URL generated per network on `blockfrost-m1.dmtr.host`). Demeter goes through `BlockfrostProvider` with the resolved base URL, and the exUnits evaluator sends the matching auth header.
- "Remember on this device" saves the provider config to `localStorage` under `providerConfig:{provider}:{network}`, with a Forget button. Keys stay per network, so a preprod key is never used on preview; the session copy still wins over the saved one.
- Sessions saved by 0.1.1 (`blockfrostConfig`) are migrated to the new `providerConfig` entry, so an open tab stays connected after the upgrade.
- Fixed the custom Blockfrost API URL being ignored by UTxO queries and submit: `getBlockfrostProvider()` never passed `baseURL`, so only the evaluator honoured it.

**UTxOs**

- Each UTxO row has a copy button that puts the UTxO on the clipboard as JSON in the SDK's `UTxO` shape, with an inline datum as CBOR hex, without toggling or expanding the row.
