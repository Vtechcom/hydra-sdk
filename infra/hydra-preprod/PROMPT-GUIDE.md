# PROMPT-GUIDE — boot Hydra head online preprod bằng AI agent

Copy nguyên khối prompt vào agent CLI (Claude Code, opencode, Cursor…) và chạy.
Mỗi prompt đã gói sẵn các gotcha đã tốn công tìm ra, để agent **không phải mò lại**.

Đọc trước nếu muốn hiểu tại sao: [`README.md`](./README.md).

---

## ⚡ Prompt nhanh — boot toàn bộ

Dùng khi chỉ muốn có một head online chạy được, không quan tâm chi tiết.

````text
Boot một Hydra head online trên preprod trong repo này (@hydra-sdk).

Hạ tầng đã có sẵn tại infra/hydra-preprod/ — ĐỪNG viết script mới, chỉ dùng cái có sẵn.

Các bước:

1. Kiểm tra cardano-node đã sync:
   docker exec cardano-node cardano-cli query tip --testnet-magic 1 --socket-path /workspace/node.socket
   syncProgress phải là "100.00". Nếu container chưa chạy thì báo tôi, đừng tự khởi động.

2. Nếu cardano-node chạy trong Docker Desktop (macOS/Windows), socket KHÔNG connect được
   từ host dù file tồn tại. Phải bắc cầu:
   infra/hydra-preprod/bridge-up.sh
   Script này tự dựng container alpine/socat + proxy Node trên host, tạo ra
   /tmp/cardano-node-preprod.socket

3. Chọn port API còn trống (4001 và 4002 thường đã bị chiếm — kiểm tra bằng lsof).

4. Boot hydra-node ở background, ghi log ra file:
   HYDRA_API_PORT=<port> HYDRA_LISTEN_PORT=<port+1000> HYDRA_MONITORING_PORT=<port+2000> \
   HYDRA_NODE_ID=preprod \
   CARDANO_NODE_SOCKET_PATH=/tmp/cardano-node-preprod.socket \
   infra/hydra-preprod/run-online.sh > /tmp/hydra-preprod.log 2>&1 &

   Node cần ~25 giây để lên. Đừng kết luận thất bại trước mốc đó.

5. Verify (cả 3 điều kiện phải đạt):
   - curl -s localhost:<port>/protocol-parameters trả 200
   - curl -s localhost:<port>/head trả tag "Idle"
   - Greetings qua WebSocket có chainSyncedStatus="InSync" và currentSlot khớp tip L1

QUAN TRỌNG — đừng làm nếu tôi không yêu cầu rõ:
- KHÔNG gửi lệnh Init/Close/Fanout. Chúng post transaction thật lên preprod,
  tốn ADA thật và không undo được.
- KHÔNG commit gì vào git.
- KHÔNG đụng vào head đang chạy ở port 4001 hoặc 4002.

Báo lại: port đã dùng, PID, và kết quả 3 bước verify.
````

---

## 📋 Prompt theo từng bước

Dùng khi muốn kiểm soát từng chặng hoặc đang debug.

### Bước 1 — kiểm tra tiền đề

````text
Kiểm tra xem đã đủ điều kiện chạy Hydra head online preprod chưa. Báo cáo dạng bảng,
CHƯA boot gì cả:

1. cardano-node: container "cardano-node" có chạy không, syncProgress bao nhiêu?
   docker exec cardano-node cardano-cli query tip --testnet-magic 1 --socket-path /workspace/node.socket

2. Protocol version của preprod (phải là major 11 = PV11 van Rossem):
   docker exec cardano-node cardano-cli query protocol-parameters --testnet-magic 1 \
     --socket-path /workspace/node.socket | jq '.protocolVersion'

3. Ví fuel còn tiền không? hydra-node tiêu ADA từ key này cho mọi protocol tx:
   docker exec cardano-node cardano-cli query utxo \
     --address "$(cat demo/2.0.0-alpha/credentials/alice/alice-funds.addr)" \
     --testnet-magic 1 --socket-path /workspace/node.socket
   Cần tối thiểu ~100 ADA. Nếu rỗng, báo tôi để nạp từ faucet.

4. Binary hydra-node có sẵn không (~428MB, không nằm trong git)?
   Tìm ở infra/hydra-offline/bin/hydra-node hoặc biến HYDRA_NODE_BIN.

5. Port nào đang bận: lsof -nP -iTCP:4001 -iTCP:4002 -iTCP:4003 -iTCP:4004 -sTCP:LISTEN
````

### Bước 2 — bắc cầu socket (chỉ khi cardano-node chạy trong Docker)

````text
cardano-node của tôi chạy trong Docker Desktop. Socket bind-mount ra host
(/Users/ania/codespace/Vtechcom/cardano-node/node.socket) NHÌN THẤY được nhưng
KHÔNG connect được — chỉ inode vượt ranh giới VM, listener nằm trong Linux VM.
Triệu chứng: hydra-node chết với "Network.Socket.connect: does not exist (Connection refused)".

Chạy cầu nối có sẵn:
  infra/hydra-preprod/bridge-up.sh

Nó dựng 2 chặng: container alpine/socat (UDS→TCP :3001) + proxy Node trên host
(TCP→/tmp/cardano-node-preprod.socket).

Verify: /tmp/cardano-node-preprod.socket tồn tại VÀ connect được. Test bằng:
  node -e "const s=require('net').connect('/tmp/cardano-node-preprod.socket');
           s.on('connect',()=>{console.log('OK');process.exit(0)});
           s.on('error',e=>{console.log('FAIL',e.code);process.exit(1)})"

Chỉ kiểm tra file tồn tại là KHÔNG đủ — đó chính là cái bẫy.

Tắt cầu nối: infra/hydra-preprod/bridge-up.sh --stop
````

### Bước 3 — boot hydra-node

````text
Boot hydra-node online preprod bằng script có sẵn infra/hydra-preprod/run-online.sh.

Cấu hình mặc định đã đúng, chỉ cần override port cho khỏi đụng:

  HYDRA_API_PORT=4004 HYDRA_LISTEN_PORT=5004 HYDRA_MONITORING_PORT=6004 \
  HYDRA_NODE_ID=preprod \
  CARDANO_NODE_SOCKET_PATH=/tmp/cardano-node-preprod.socket \
  infra/hydra-preprod/run-online.sh > /tmp/hydra-preprod.log 2>&1 &

Chạy background và ghi log ra file — chạy foreground sẽ chặn agent.

Đợi 25-30 giây rồi verify. Node cần thời gian kết nối chain và khởi động etcd nhúng.

Nếu lỗi, đọc mục Troubleshooting trong infra/hydra-preprod/PROMPT-GUIDE.md
TRƯỚC KHI tự sửa script — phần lớn lỗi đã có nguyên nhân đã biết.
````

### Bước 4 — verify

````text
Verify Hydra head online ở port 4004 thật sự đang bám chain preprod.
Cả 4 điều kiện phải đạt:

1. REST sống:      curl -s -o /dev/null -w '%{http_code}' localhost:4004/protocol-parameters   → 200
2. Head state:     curl -s localhost:4004/head | jq -r .tag                                     → "Idle"
3. Greetings qua WebSocket ws://localhost:4004/?history=no:
   - chainSyncedStatus === "InSync"
   - currentSlot khớp (±5) với slot của tip L1
4. Ví fuel đã được nhận diện: grep "newUTxO" /tmp/hydra-preprod.log

Điều kiện 3 là quan trọng nhất — nó chứng minh head đang theo chain THẬT,
chứ không phải chỉ mở được cổng.

So sánh slot với L1:
  docker exec cardano-node cardano-cli query tip --testnet-magic 1 \
    --socket-path /workspace/node.socket | jq .slot
````

---

## 🔴 Prompt có rủi ro — mở head thật

> Post transaction thật lên preprod. Tốn ADA thật. **Không undo được.**
> Chỉ dùng khi bạn thực sự muốn.

````text
Mở một Hydra head THẬT trên preprod qua node đang chạy ở port 4004.

Tôi hiểu và chấp nhận: việc này post InitTx lên preprod, tiêu ADA thật từ ví
demo/2.0.0-alpha/credentials/alice, và không thể hoàn tác.

Dùng @hydra-sdk/bridge (không dùng curl thủ công):

  import { HydraBridge } from '@hydra-sdk/bridge'
  const bridge = new HydraBridge({ url: 'ws://localhost:4004', verbose: true })
  await bridge.connect()
  await bridge.commands.initSync!(3, 20_000)

hydra-node v2 đã bỏ commit phase (ADR-33) nên head mở THẲNG — initSync resolve
khi nhận HeadIsOpen, KHÔNG phải HeadIsInitializing (tag đó không còn tồn tại).

Ghi lại toàn bộ tag nhận được qua WebSocket trong lúc mở, kèm payload JSON đầy đủ.
Đó là dữ liệu quý: nhiều tag L1 chưa từng được đối chiếu với type của SDK.

Sau khi mở xong, DỪNG LẠI và hỏi tôi trước khi Close hay Fanout.
Contestation period đang là 120s nên close→fanout mất ~2 phút.
````

---

## 🔧 Troubleshooting — lỗi đã biết

Đưa nguyên mục này cho agent khi gặp sự cố.

### `Sub-process etcd exited with: ExitFailure (-9)`

Nguyên nhân: lần trước hydra-node bị `kill` không graceful, để lại etcd data dir
hỏng. etcd nhúng không recover được.

Fix:

```bash
rm -rf infra/hydra-preprod/persistence/node-preprod
```

Rồi boot lại. **Không** phải lỗi port, không cần sửa script.

Tránh tái diễn: dừng bằng `SIGTERM` (`kill <pid>`, không `-9`) và đợi tiến trình thoát hẳn.

### `Network.Socket.connect: does not exist (Connection refused)`

Socket của Docker Desktop không dùng được từ host. Chạy `bridge-up.sh` (Bước 2).
File socket tồn tại **không** có nghĩa là connect được.

### `option --contestation-period: cannot parse value '120'`

Duration parse qua `Read` của Haskell cho `NominalDiffTime` → **bắt buộc hậu tố `s`**.
Phải là `120s`. Help của hydra-node ghi "SECONDS" nên rất dễ nhầm.

`run-online.sh` đã tự thêm `s`; lỗi này chỉ xuất hiện nếu gọi hydra-node trực tiếp.

### Port đã bị chiếm

Máy này thường có sẵn vài head:

| Port | Thường là |
|---|---|
| 4001 | hydra-graveyard dapp |
| 4002 | bridge e2e offline |
| 4004 | preprod online |

etcd nhúng cũng chiếm port, derive theo công thức `2379 + listen - 5001`.
Nên `--listen 5004` → etcd client 2382. Đổi `HYDRA_LISTEN_PORT` là đủ tránh đụng.

### Head mở nhưng không post được transaction

Ví fuel hết tiền. Kiểm tra balance (Bước 1, mục 3) và nạp từ
[faucet preprod](https://docs.cardano.org/cardano-testnets/tools/faucet).

### `hydraHeadId` là `undefined` chứ không phải `null`

Không phải lỗi. `Greetings` serialize với `omitNothingFields = True` nên field
`Maybe` bị **bỏ hẳn khỏi JSON**. Type của SDK khai báo optional cho đúng.

---

## 🧹 Dọn dẹp

````text
Dừng toàn bộ hạ tầng Hydra preprod của tôi:

1. Dừng hydra-node ở port 4004 bằng SIGTERM (KHÔNG dùng kill -9 — sẽ làm hỏng
   etcd data dir và lần boot sau sẽ lỗi ExitFailure (-9)):
     kill $(lsof -nP -iTCP:4004 -sTCP:LISTEN -t)

2. Tắt cầu nối socket:
     infra/hydra-preprod/bridge-up.sh --stop

3. ĐỪNG đụng cardano-node container — nó dùng chung với thứ khác.
4. ĐỪNG đụng head ở port 4001/4002.

Xác nhận không còn tiến trình mồ côi: ps aux | grep -E "[h]ydra-node|[e]tcd"
````

---

## Ghi chú cho agent

- **Không viết script mới.** `infra/hydra-preprod/` đã có đủ; mọi tuỳ biến làm qua
  biến môi trường (bảng đầy đủ trong `README.md`).
- **Không commit.** Trạng thái repo do người dùng quyết định.
- **`persistence/`, `credentials/`, `bin/` đều gitignore** — đừng đưa vào git.
- **Không bao giờ commit L1 signing key.** Truyền qua `HYDRA_CARDANO_SIGNING_KEY`.
- Head offline (`../hydra-offline/`) **không** cần cardano-node và không tốn ADA —
  ưu tiên dùng nó nếu chỉ cần test đường L2.
