# @hydra-sdk/testkit

- Dev-only kit để test Hydra SDK và DApps mà không tự viết connector mocks hoặc copy offline-node scripts.
- Hai tầng: deterministic mock/replay cho unit test; real hydra-node offline controller cho contract/E2E.
- Không mô phỏng lại Hydra protocol hoặc ledger. Mock chỉ replay scenario và validate command; real node là source of truth.
- Exports: `@hydra-sdk/testkit/fixtures`, `/mock`, `/offline`, `/vitest`.
- Mock tier: `MockHydraConnector`, typed scenario builder, command assertions, controllable clock và fault injection.
- Fixtures được capture theo từng hydra-node version, typed bằng bridge payloads và kiểm chứng bằng real-node conformance suite.
- Offline tier: `HydraTestHead.start()/stop()`, seeded wallet/UTxO, dynamic ports, isolated temp state và idempotent cleanup.
- Parallel-safe là invariant: mỗi Head/worker có ports, head seed, credentials và persistence riêng.
- Không bundle binary 428 MB, không surprise download; dùng `HYDRA_NODE_BIN` hoặc downloader/resolver được gọi tường minh với checksum và cache.
- Vitest adapter quản lý lifecycle, timeout, diagnostics và failure artifacts; core controller không phụ thuộc Vitest.
- Test mnemonic và fabricated UTxO phải được đánh dấu test-only; offline mode không phải bằng chứng production safety.
- V1 loại trừ Cardano L1 devnet, deposit/decommit/close/fanout E2E, multi-node consensus, load testing và general-purpose Hydra simulator.
- Compatibility align theo major của `@hydra-sdk/bridge`; fixture matrix ghi rõ hydra-node versions được hỗ trợ.
- Thứ tự triển khai sau: fixtures + mock connector, isolated offline controller, Vitest adapter, fault catalogue, conformance matrix.
