/**
 * Types for `seed-utxo.mjs`.
 *
 * The script stays plain ESM so it runs with a bare `node seed-utxo.mjs` in any
 * project this sample is copied into — no build step, no reliance on Node's
 * TypeScript stripping. This declaration exists so TypeScript consumers (the
 * bridge e2e suite) can import the mnemonic without an implicit `any`.
 */

/** Fixed throwaway mnemonic the sample's `initial-utxo.json` is seeded from. */
export declare const E2E_MNEMONIC: string

/** Bech32 base address derived from {@link E2E_MNEMONIC} on preprod. */
export declare const e2eWalletAddress: () => string
