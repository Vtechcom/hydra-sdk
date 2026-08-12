# Hydra SDK evaluator engine spike

Spike này chạy cùng fixture transaction thật từ test suite của MeshJS qua hai backend offline mà MeshJS đang dùng:

- `whisky-evaluator@0.1.1`: Rust WebAssembly được sinh bằng `wasm-bindgen`.
- `scalus@0.17.0`: evaluator Scala.js, không phải Rust/WASM.

## Chạy

```bash
git clone --depth 1 https://github.com/MeshJS/mesh.git /tmp/meshjs-evaluator-reference
npm install --prefix /tmp/hydra-evaluator-spike-runtime --no-audit --no-fund \
  whisky-evaluator@0.1.1 scalus@0.17.0 @meshsdk/core-cst@1.9.1 @meshsdk/common@1.9.1

NODE_PATH=/tmp/hydra-evaluator-spike-runtime/node_modules \
MESH_REPO=/tmp/meshjs-evaluator-reference \
node spikes/hydra-sdk-evaluator/mesh-engines-spike.cjs

# Dựng một V3 SPEND bằng MeshTxBuilder và chạy qua cả hai engine
NODE_PATH=/tmp/hydra-evaluator-spike-runtime/node_modules \
node spikes/hydra-sdk-evaluator/mesh-spend-spike.cjs
```

Script fail nếu một engine không trả đúng budget được MeshJS khóa trong fixture hoặc nếu hai engine cho kết quả khác nhau.

Nó cũng probe transaction tương tự với UTxO map rỗng để kiểm tra failure path khi ScriptContext không thể resolve.

Đây mới là feasibility spike. Nó chưa chứng minh tương đương `cardano-node` trên nhiều era, purpose hoặc failure path.
