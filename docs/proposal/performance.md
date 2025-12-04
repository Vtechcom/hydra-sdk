# Hydra SDK Performance Report

This document summarizes measured performance and optimization work for Hydra SDK.

- Scope:
  - Transaction build time (serialization/build + sign)
- Target improvements: ≥ 20% over baseline in each category.

---

## Summary: Before/After

| Metric | Baseline (Before) | Hydra SDK (After) | Improvement |
| --- | --- | --- | --- |
| Transaction build time (sequential 300 samples) | Cardano JS SDK avg 5.88ms, stdev 2.37ms | Hydra SDK avg 4.51ms, stdev 1.34ms | ~23% faster avg |
| Transaction build time (sequential 1000 samples) | Cardano JS SDK avg 10.27ms | Hydra SDK avg 9.76ms | ~5% faster avg |
| Transaction build time (parallel 1000 samples + metadata) | Cardano JS SDK avg 19.68ms, stdev 47.88ms | Hydra SDK avg 10.60ms, stdev 13.72ms | ~46% faster avg; ~71% lower stdev |
| Plutus script execution speed | Baseline: To be recorded (local evaluator) | Target: ≥ 20% improvement | In progress |
| Hydra latency (TxSeen → SnapshotConfirmed) | Baseline: To be recorded on test head | Target: ≤ 200ms, ≥ 20% improvement | In progress |

Notes:
- Transaction build time metrics are derived from `docs/project/cardano-wasm-compare.md`.
- Plutus execution and Hydra latency measurements will be added after controlled test runs on the same environment.

---

## Benchmark Details

### Transaction Build/Sign

Extracted from `docs/project/cardano-wasm-compare.md`.

- Environment: Node.js v22.16.0
- Samples: 300 sequential (3×100), 1000 sequential, 1000 parallel with `tx_metadata`
- Results (key excerpts):
  - Hydra SDK mean 4.51ms vs Cardano JS SDK 5.88ms (300 samples)
  - Hydra SDK mean 9.76ms vs Cardano JS SDK 10.27ms (1000 sequential)
  - Hydra SDK mean 10.60ms vs Cardano JS SDK 19.68ms (1000 parallel + metadata)

#### Hydra SDK code snippet

```tsx
import { CardanoWASM } from '@hydra-sdk/cardano-wasm';
import { UTxO } from '@hydra-sdk/core';
import { TxBuilder } from '@hydra-sdk/transaction';
import { AppWallet } from '@meshsdk/core';

async function runTest() {
  const wallet = new AppWallet({
    key: {
      type: 'mnemonic',
      words: 'daughter silk uncover cheese split ribbon treat forum belt planet divert verify easily fabric shrimp'.split(' '),
    },
    networkId: 1,
  });
  await wallet.init();

  for (let i = 0; i < 100; i++) {
    i > 0 && console.time('t');
    const utxos: UTxO[] = [{
      input: { outputIndex: 0, txHash: 'ffa13a74d1d0d014b88f8ff91d75038cb1e65c3188a995e98c9a64711283d400' },
      output: {
        address: 'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3',
        amount: [{ unit: 'lovelace', quantity: '5000000' }],
      },
    }];
    const txBuilder = new TxBuilder({ isHydra: true, params: { minFeeA: 0, minFeeB: 0 } });
    const senderAddress = 'addr_test1qrsx72hrv8ens90hwkezg7ysyhwvcjmyzdveyf88ppq7a0lwu7gv0wuuf9lhzm7wclvj5ntgcfa53j0rqxmu237x20xsne56q3';
    const receiverAddress = 'addr_test1qqexe44l7cg5cng5a0erskyr4tzrcnnygahx53e3f7djqqmzfyq4rc0xr8q3fch3rlh5287uxrn4yduwzequayz94yuscwz6j0';
    const tx = await txBuilder
      .setInputs(utxos)
      .txOut(receiverAddress, [{ unit: 'lovelace', quantity: `${1500000 + i * 100}` }])
      .setFee(CardanoWASM.BigNum.from_str('0'))
      .changeAddress(senderAddress)
      .complete();
    const signedTx = await wallet.signTx(tx.to_hex());
    i > 0 && console.timeEnd('t');
  }
}

runTest();
```

#### Baseline code snippet (Cardano JS SDK)

Equivalent operations were executed using Cardano JS SDK (UTxO selection, txOut, change, fee), measured with `console.time('t')` over identical datasets and environment. Code omitted here to avoid redundancy; see the comparison harness in `docs/project/cardano-wasm-compare.md`.

---

## Optimization Commit References

Links to optimization work in this repository:

- Transaction build path and WASM tuning:
  - packages/transaction: https://github.com/Vtechcom/opensource-hydra-sdk/tree/main/packages/hydra-transaction
  - packages/cardano-wasm: https://github.com/Vtechcom/opensource-hydra-sdk/tree/main/packages/cardano-wasm
- Datum/CBOR helpers:
  - packages/core (`DatumUtils`): https://github.com/Vtechcom/opensource-hydra-sdk/tree/main/packages/core
- Hydra Bridge event pipeline:
  - packages/hydra-bridge: https://github.com/Vtechcom/opensource-hydra-sdk/tree/main/packages/hydra-bridge

> Specific commit hashes will be added after the benchmarking PRs are merged.
