# hydrawallet-playground

## 0.2.0

### Minor Changes

- cba0cb6: Wallet derivation paths (account, chain and key index), wallet import from an `ed25519e_sk` key, a Blockfrost/Demeter provider dialog with an opt-in saved key, and one-click UTxO copy in `/transaction-builder`.

  **Wallet**
  - The "Set up wallet" dialog takes an account index and a key index (`m/1852'/1815'/{account}'/0/{key}`), shows the full path, and the address, change address, mint preset and signing all follow it. Changing only the index keeps the root key. The defaults (`0'/0/0`) derive the same address as before.
  - The "Set up wallet" dialog has a **Chain (role)** choice next to the account and key index, so a path such as `m/1852'/1815'/6158'/1/0` can be set. The address, change address, mint preset and signing all follow it; sessions saved before this change keep role `0`.
  - A third import option, **ed25519e key**, takes a single `ed25519e_sk1…` key (64-byte extended key, no chain code). It signs as-is and uses the key's enterprise address; the derivation path is hidden because nothing can be derived from such a key. Generate makes one from a fresh mnemonic at `m/1852'/1815'/0'/0/0`.

  **Provider**
  - The inline Blockfrost form is now a **Configure** dialog with two tabs: Blockfrost (custom API URL + project key) and Demeter (port key in the host, URL generated per network on `blockfrost-m1.dmtr.host`). Demeter goes through `BlockfrostProvider` with the resolved base URL and without the `project_id` header, which Demeter's CORS preflight rejects; Demeter's `dmtr-api-key` header auth is not offered because a browser preflight cannot carry it.
  - "Remember on this device" saves the provider config to `localStorage` under `providerConfig:{provider}:{network}`, with a Forget button. Keys stay per network, so a preprod key is never used on preview; the session copy still wins over the saved one.
  - Sessions saved by 0.1.1 (`blockfrostConfig`) are migrated to the new `providerConfig` entry, so an open tab stays connected after the upgrade.
  - Fixed the custom Blockfrost API URL being ignored by UTxO queries and submit: `getBlockfrostProvider()` never passed `baseURL`, so only the evaluator honoured it.

  **UTxOs**
  - Each UTxO row has a copy button that puts the UTxO on the clipboard as JSON in the SDK's `UTxO` shape, with an inline datum as CBOR hex, without toggling or expanding the row.

## 0.1.1

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.5.0
  - @hydra-sdk/bridge@2.0.2
  - @hydra-sdk/transaction@1.2.3

## 0.1.0

### Minor Changes

- c11ec30: Rebuild `/transaction-builder` as a workspace, and align the playground with the docs design system.

  **Transaction builder**
  - Replaced the free-drag grid with a three-column workspace (context · builder · result) with resizable columns, a `Draft → Built → Signed → Sent` status bar, and a sign/submit dock that the build hands off to automatically. Below `lg` the same panels stack behind tabs.
  - Fixed a WASM leak on every build: `complete()` returns a live `Transaction` and the caller owns any datum/redeemer objects it passes in, so the build path now frees them and calls `builder.dispose()` in a `finally`.
  - Fixed the JSON outputs editor, whose "Set" button was a no-op (`@click="null"`), and the decoded-JSON viewer, which was pinned to the `github-light` Shiki theme regardless of colour mode.
  - Coverage of the `TxBuilder` API went from 6 of ~30 call groups to all of them, tiered so the common path stays uncluttered: coin-selection strategy, custom protocol parameters (PV11), metadata, validity range, required signers, collateral, mint/burn, script inputs with datum + redeemer, reference inputs, certificates, withdrawals, a Blockfrost-backed exUnits evaluator and verbose logging.
  - Added a live TypeScript snippet tab that mirrors the draft as SDK calls (including the correct `tx.free()` / `builder.dispose()` lifecycle), plus a summary tab with fee, totals, change, size and per-unit output amounts.
  - Incomplete rows (mint, script input, certificate, withdrawal, collateral, reference input, metadata, required signer) are validation errors that block the build instead of being skipped silently, and the snippet emits every row so it always mirrors the form.
  - Added offline sample UTxOs and six one-click presets, versioned draft persistence, and share links that carry the draft in the URL fragment. The mint preset derives a real `sig` policy from the configured wallet address, so it builds a transaction that actually mints.

  **Design system**
  - Primary colour moved from purple to the docs' brand green, with semantic tokens retuned for both light and dark, Public Sans + Space Grotesk to match the docs, and the aurora / `.hcard` / `.eyebrow` surfaces ported over (static, not breathing — this is a workspace).
  - Dark mode works again: it was being forced to `light` on every mount.

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.4.2
  - @hydra-sdk/bridge@2.0.1
  - @hydra-sdk/transaction@1.2.2

## 0.0.11

### Patch Changes

- Updated dependencies [6be2b85]
  - @hydra-sdk/bridge@2.0.0

## 0.0.10

### Patch Changes

- Updated dependencies
  - @hydra-sdk/transaction@1.2.1

## 0.0.9

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @hydra-sdk/cardano-wasm@1.0.0
  - @hydra-sdk/transaction@1.1.9
  - @hydra-sdk/bridge@1.3.2
  - @hydra-sdk/core@1.4.1

## 0.0.8

### Patch Changes

- Updated dependencies
  - @hydra-sdk/bridge@1.2.0
  - @hydra-sdk/core@1.2.0
  - @hydra-sdk/transaction@1.1.8

## 0.0.7

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.1.7
  - @hydra-sdk/bridge@1.1.7
  - @hydra-sdk/transaction@1.1.7
  - @hydra-sdk/cardano-wasm@0.0.7

## 0.0.6

### Patch Changes

- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.6
  - @hydra-sdk/core@1.1.6
  - @hydra-sdk/bridge@1.1.6
  - @hydra-sdk/transaction@1.1.6

## 0.0.5

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.1.5
  - @hydra-sdk/bridge@1.1.5
  - @hydra-sdk/transaction@1.1.5

## 0.0.4

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.1.4
  - @hydra-sdk/bridge@1.1.4
  - @hydra-sdk/transaction@1.1.4

## 0.0.3

### Patch Changes

- Updated dependencies
  - @hydra-sdk/transaction@1.1.3
  - @hydra-sdk/bridge@1.1.3
  - @hydra-sdk/core@1.1.3

## 0.0.2

### Patch Changes

- Updated dependencies
  - @hydra-sdk/bridge@1.1.2
  - @hydra-sdk/core@1.1.2
  - @hydra-sdk/transaction@1.1.2

## 1.0.22

### Patch Changes

- Updated dependencies
  - @hydra-sdk/bridge@1.1.1
  - @hydra-sdk/core@1.1.1
  - @hydra-sdk/transaction@1.1.1

## 1.0.21

### Patch Changes

- Updated dependencies
  - @hydra-sdk/transaction@1.1.0
  - @hydra-sdk/bridge@1.1.0
  - @hydra-sdk/core@1.1.0

## 1.0.20

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.0.14
  - @hydra-sdk/bridge@1.0.14
  - @hydra-sdk/transaction@1.0.14

## 1.0.19

### Patch Changes

- Updated dependencies
  - @hydra-sdk/bridge@1.0.13
  - @hydra-sdk/core@1.0.13
  - @hydra-sdk/transaction@1.0.13

## 1.0.18

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.0.12
  - @hydra-sdk/bridge@1.0.12
  - @hydra-sdk/transaction@1.0.12

## 1.0.17

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@1.0.11
  - @hydra-sdk/bridge@1.0.11
  - @hydra-sdk/transaction@1.0.11

## 1.0.16

### Patch Changes

- Updated dependencies
  - @hydra-sdk/bridge@1.0.10
  - @hydra-sdk/core@1.0.7
  - @hydra-sdk/transaction@1.0.10

## 1.0.15

### Patch Changes

- Updated dependencies
  - @hydra-sdk/bridge@1.0.9

## 1.0.14

### Patch Changes

- Updated dependencies
  - @hydra-sdk/transaction@1.0.9
  - @hydra-sdk/bridge@1.0.8
  - @hydra-sdk/core@1.0.6

## 1.0.13

### Patch Changes

- Updated dependencies
  - @hydra-sdk/bridge@1.0.7

## 1.0.12

### Patch Changes

- Updated dependencies
  - @hydra-sdk/transaction@1.0.8

## 1.0.11

### Patch Changes

- Updated dependencies
  - @hydra-sdk/transaction@1.0.7

## 1.0.10

### Patch Changes

- Updated dependencies
  - @hydra-sdk/transaction@1.0.6

## 1.0.9

### Patch Changes

- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.5
  - @hydra-sdk/bridge@1.0.6
  - @hydra-sdk/core@1.0.5
  - @hydra-sdk/transaction@1.0.5

## 1.0.8

### Patch Changes

- Update configs
- Updated dependencies
  - @hydra-sdk/cardano-wasm@0.0.4
  - @hydra-sdk/bridge@1.0.5
  - @hydra-sdk/core@1.0.4
  - @hydra-sdk/transaction@1.0.4

## 1.0.7

### Patch Changes

- Updated dependencies
  - @hydra-sdk/bridge@1.0.4
  - @hydra-sdk/core@1.0.3
  - @hydra-sdk/transaction@1.0.3

## 1.0.6

### Patch Changes

- Update
- Updated dependencies
  - @hydra-sdk/bridge@1.0.3
  - @hydra-sdk/core@1.0.2
  - @hydra-sdk/transaction@1.0.2

## 1.0.5

### Patch Changes

- Updated dependencies
  - @hydra-sdk/bridge@1.0.2
  - @hydra-sdk/core@1.0.1
  - @hydra-sdk/transaction@1.0.1

## 1.0.4

### Patch Changes

- Updated dependencies
  - @hydra-sdk/bridge@1.0.1

## 1.0.3

### Patch Changes

- Updated dependencies
  - @hydra-sdk/bridge@1.0.0
  - @hydra-sdk/core@1.0.0
  - @hydra-sdk/transaction@1.0.0

## 1.0.2

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@0.0.5
  - @hydra-sdk/transaction@0.0.5

## 1.0.1

### Patch Changes

- Updated dependencies
  - @hydra-sdk/core@0.0.4
  - @hydra-sdk/transaction@0.0.4
