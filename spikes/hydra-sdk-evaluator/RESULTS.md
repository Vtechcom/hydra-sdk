# Spike result: offline Plutus evaluator engines

Ngày: 2026-08-11

## Kết luận ngắn

Có engine phù hợp để spike `@hydra-sdk/evaluator` ngay:

1. `whisky-evaluator@0.1.1` — Rust/WASM. Đây là backend MeshJS đang dùng trong `@meshsdk/core-csl`.
2. `scalus@0.17.0` — Scala.js, không phải Rust/WASM. MeshJS hiện dùng nó trong `OfflineEvaluatorScalus` và emulator.

Khuyến nghị: đặt `whisky-evaluator` sau một adapter riêng của Hydra SDK làm implementation candidate chính; dùng Scalus làm oracle thứ hai trong conformance test. Chưa nên public claim `cardano-node equivalent` cho đến khi có corpus differential theo era/cost model.

## Cách MeshJS đang làm

MeshJS giữ contract rất nhỏ:

```ts
interface IEvaluator {
  evaluateTx(
    tx: string,
    additionalUtxos?: UTxO[],
    additionalTxs?: string[],
  ): Promise<EvalAction[]>
}
```

`OfflineEvaluator` của MeshJS:

- lấy input references từ transaction CBOR;
- resolve UTxO bằng `additionalUtxos`, outputs của `additionalTxs`, rồi mới gọi fetcher;
- tạo JSON cho UTxO, chained transactions, cost models và slot config;
- gọi `whisky-evaluator.js_evaluate_tx_scripts(...)`;
- chuyển kết quả WASM thành `{ tag, index, budget }`.

`OfflineEvaluatorScalus` làm cùng một việc nhưng encode UTxO thành CBOR map và gọi:

```ts
Scalus.evalPlutusScripts(txBytes, utxoMapCbor, slotConfig, costModels)
```

Điểm quan trọng: engine không chỉ evaluate một UPLC program. Nó nhận transaction + ledger context để dựng ScriptContext.

## Kết quả chạy thực tế

### Fixture MINT từ MeshJS

Nguồn: `packages/mesh-core-csl/test/offline-providers/evaluator.test.ts` tại MeshJS commit `c0b183e`.

| Engine | Kết quả | Cold start | Warm median | Artifact unpacked |
| --- | --- | ---: | ---: | ---: |
| `whisky-evaluator@0.1.1` | `MINT[0] = { mem: 508703, steps: 164980381 }` | ~22 ms | ~5.7 ms | ~13.1 MB |
| `scalus@0.17.0` | `MINT[0] = { mem: 508703, steps: 164980381 }` | ~40 ms | ~5.5 ms | ~2.7 MB |

Hai engine khớp expected budget của MeshJS và khớp lẫn nhau.

### Fixture SPEND do MeshTxBuilder dựng

Script Plutus V3 always-succeed, một script input và một collateral input:

| Engine | Kết quả |
| --- | --- |
| `whisky-evaluator@0.1.1` | `SPEND[0] = { mem: 2001, steps: 380149 }` |
| `scalus@0.17.0` | `SPEND[0] = { mem: 2001, steps: 380149 }` |

Khi bỏ toàn bộ UTxO context, cả hai fail:

- Whisky trả action lỗi `resolved Input not found`.
- Scalus ném `PlutusScriptEvaluationException` với transaction ID bị thiếu.

Lưu ý: fixture MINT không cần resolved spending input nên Whisky vẫn success khi map UTxO rỗng; đây không phải bằng chứng rằng evaluator có thể bỏ qua context cho SPEND.

## Đánh giá thư viện

### Whisky evaluator — Rust/WASM

Bằng chứng package:

- README mô tả đây là “WASM-based Cardano transaction script evaluator”.
- CJS glue có `__wbindgen_placeholder__`, `wasm.memory`, `passStringToWasm0` và exported `js_evaluate_tx_scripts` — dấu hiệu wasm-bindgen rõ ràng.
- Binary chứa symbol `js_evaluate_tx_scripts` và source paths của Rust crates `uplc-1.1.22` và `cardano-serialization-lib-15.0.0-beta.1`.
- MeshJS gọi trực tiếp package này trong `@meshsdk/core-csl`.

**Ưu điểm**

- Đúng hướng Rust/WASM mà spike cần.
- API transaction-level đã proven bằng MeshJS.
- Có CJS và ESM artifact; Node chạy được.
- Budget khớp cả MINT và SPEND fixture.

**Rủi ro cần khóa trước khi dùng production**

- `whisky-evaluator@0.1.1` không công bố `repository` trong npm metadata; provenance của evaluator core yếu hơn Scalus.
- Package unpacked khoảng 13.1 MB, embedded WASM khoảng 5.1 MB.
- API trả JSON string/`EvalWasmResult`, khó typed và diagnostics phải parse thêm.
- Binary cho thấy CSL `15.0.0-beta.1`; phải pin và differential-test theo Cardano era/cost model.

### Scalus — Scala.js

**Ưu điểm**

- README công khai API rõ: `evalPlutusScripts`, `evaluateScript`, `Emulator`.
- Có failure logs và emulator ledger in-process.
- Package nhỏ hơn trong spike (~2.7 MB) và đã được MeshJS dùng làm backend thứ hai.
- Provenance rõ: `https://github.com/scalus3/scalus`.

**Rủi ro**

- Không phải Rust/WASM; không phù hợp nếu mục tiêu là một engine Rust-native.
- Published bundle là CJS chính; browser dùng CommonJS shim theo README.
- Nếu chỉ cần exUnits cho TxBuilder, emulator ledger là scope lớn hơn cần thiết.

## Quyết định spike cho Hydra SDK

- `@hydra-sdk/evaluator` nên có engine adapter, không expose trực tiếp API Whisky/Scalus.
- Candidate chính: `whisky-evaluator`, với package version + integrity hash pin trong implementation package.
- Candidate oracle/conformance: Scalus, chạy cùng fixture và cùng cost models/slot config.
- V1 adapter giữ `IEvaluator.evaluateTx(txHex, additionalUtxos?, additionalTxs?)` tương thích MeshJS.
- Context resolver phải fail-closed cho SPEND/reference scripts; không network fetch ngầm trong offline mode.
- Trước API stable cần thêm corpus: V1/V2/V3, SPEND/MINT, reference script, inline datum, invalid script, validity range/time và nhiều protocol-era cost models.
- Nếu không xác minh được source/provenance của `whisky-evaluator`, phương án an toàn là fork/rebuild một Rust `wasm-bindgen` adapter có source audit, thay vì phụ thuộc mù vào binary npm.

## Files và lệnh spike

- [mesh-engines-spike.cjs](./mesh-engines-spike.cjs): fixture MINT của MeshJS, chạy Whisky + Scalus.
- [mesh-spend-spike.cjs](./mesh-spend-spike.cjs): dựng V3 SPEND bằng MeshTxBuilder, chạy cả hai engine và probe missing context.
- [README.md](./README.md): setup và command.

Lệnh kiểm chứng:

```bash
NODE_PATH=/tmp/hydra-evaluator-spike-runtime/node_modules \
MESH_REPO=/tmp/meshjs-evaluator-reference \
node spikes/hydra-sdk-evaluator/mesh-engines-spike.cjs

NODE_PATH=/tmp/hydra-evaluator-spike-runtime/node_modules \
node spikes/hydra-sdk-evaluator/mesh-spend-spike.cjs
```

## Nguồn tham khảo

- MeshJS source: https://github.com/MeshJS/mesh/tree/c0b183eccd0c20a465778f204f8c9caf73294bd8/packages/mesh-core-csl/src
- MeshJS offline evaluator: https://github.com/MeshJS/mesh/blob/c0b183eccd0c20a465778f204f8c9caf73294bd8/packages/mesh-core-csl/src/offline-providers/offline-evaluator.ts
- MeshJS Scalus adapter: https://github.com/MeshJS/mesh/blob/c0b183eccd0c20a465778f204f8c9caf73294bd8/packages/mesh-core-cst/src/offline-providers/offline-evaluator-scalus.ts
- Whisky npm: https://www.npmjs.com/package/whisky-evaluator
- Whisky JS bindings: https://github.com/sidan-lab/whisky
- Scalus: https://github.com/scalus3/scalus
- Scalus npm: https://www.npmjs.com/package/scalus
