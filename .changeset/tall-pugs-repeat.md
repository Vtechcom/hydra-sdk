---
'@hydra-sdk/playground': minor
---

Rebuild `/transaction-builder` as a workspace, and align the playground with the docs design system.

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
