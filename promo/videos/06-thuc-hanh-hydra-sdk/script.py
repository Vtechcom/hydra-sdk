"""Tập 6 — Thực hành: giao dịch đầu tiên trong Hydra Head với hydra-sdk.

Nguồn duy nhất cho hình, giọng và bảng duyệt. Chạy `python script.py` để xuất lại kich-ban.md.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'shared'))
import lexicon  # noqa: E402

# Mỗi cảnh: board = chữ được viết lên bảng (không phải phụ đề),
# code = đoạn code trên bảng (rút gọn từ code chạy thật, không bịa), src = nguồn của đoạn code,
# lines = lời đọc (mỗi phần tử là một clip giọng), screen = hình, sound = âm thanh.
# Chuỗi sáu bước hiện ở góc trên trong mọi cảnh 05–12, bước đang làm được tô sáng.
# Nhãn góc ở mọi cảnh có code, không đọc thành lời.
CODE_LABEL = 'Code rút gọn, bản đầy đủ ở hydrasdk.com'

STEPS = ['1. Kết nối', '2. Lấy món tiền', '3. Dựng giao dịch', '4. Ký', '5. Gửi', '6. Xem snapshot']

SCRIPT = {
	'01': dict(
		title='Mở đầu',
		board=['Từ khái niệm tới code', 'An → Bình: 2 ADA', 'trong Hydra Head'],
		code=[],
		src='',
		lines=[
			'Năm tập vừa rồi, ta đã nói về món tiền chưa tiêu, về Hydra, về ví và cả hợp đồng thông minh.',
			'Hôm nay ta làm một việc khác hẳn. Ta sẽ viết code để gửi tiền bên trong một Hydra Head.',
			'Chỉ cần khoảng ba mươi dòng TypeScript, đi qua sáu bước, từ lúc kết nối đến lúc tiền về ví người nhận.',
			'Câu chuyện vẫn là An và Bình. Lần này, An gửi hai ADA cho Bình ngay bên trong Head.',
		],
		screen='Các hình phấn quen thuộc của tập 1–5 (ô món tiền, vòng tròn Head, ổ khoá, chiếc ví) lướt qua rồi gom lại một góc. Nửa bảng còn lại hiện một khung soạn code trống, con trỏ nhấp nháy. Dòng "An → Bình: 2 ADA" viết phấn bên dưới.',
		sound='Nền vào dần. Tiếng phấn; vài tiếng gõ phím khi khung code hiện ra.',
	),
	'02': dict(
		title='Chuẩn bị',
		board=['Cần có', '① Head đang mở, ví đã có tiền trong Head (tập 3)', '② Bốn gói hydra-sdk'],
		code=[
			'npm install @hydra-sdk/core @hydra-sdk/bridge \\',
			'  @hydra-sdk/transaction @hydra-sdk/cardano-wasm',
		],
		src='apps/docs-v2/content/en/1.getting-started/2.installation.md:81',
		lines=[
			'Trước khi bắt đầu, bạn cần chuẩn bị sẵn đúng hai thứ trong tay.',
			'Thứ nhất, một Hydra Head đang mở, và ví của bạn đã có món tiền nằm sẵn bên trong Head đó.',
			'Cách mở Head và đưa tiền vào đã có trong tập ba, tập nói về vòng đời của một Head.',
			'Thứ hai, cài bốn gói của hydra-sdk vào dự án, chỉ bằng một dòng lệnh.',
			'Gói lõi lo phần ví, gói cầu nối lo việc nói chuyện với Head, còn gói giao dịch chứa TxBuilder.',
		],
		screen='Hai ô điều kiện vẽ phấn, ô ① có hình vòng tròn Head nhỏ với một món tiền bên trong và mũi tên chỉ "tập 3". Ô ② hiện dòng lệnh cài đặt. Hình phấn HP-01 trượt vào bên phải trong vài giây: khung trình duyệt vẽ phấn, trang Installation của hydrasdk.com với khối lệnh cài, góc ghi nhỏ "Hình dựng lại theo hydrasdk.com". Ba nhãn nhỏ "core · bridge · transaction" nối vào ba biểu tượng ví, cầu, khối TxBuilder.',
		sound='Gõ phím theo dòng lệnh; một "tick" cho mỗi ô điều kiện.',
	),
	'03': dict(
		title='Sáu bước',
		board=STEPS,
		code=[],
		src='',
		lines=[
			'Toàn bộ bài hôm nay gói gọn trong sáu bước, bạn có thể ghi lại để làm theo.',
			'Thứ nhất, kết nối vào Head. Thứ hai, lấy danh sách các món tiền chưa tiêu.',
			'Thứ ba, dựng giao dịch, tức là chọn món và tạo tiền thối. Thứ tư, ký giao dịch.',
			'Thứ năm, gửi giao dịch vào Head. Thứ sáu, xem snapshot mới để chắc chắn tiền đã tới nơi.',
		],
		screen='Sáu ô xếp thành một đường đi từ trái sang phải, mỗi ô hiện theo lời đọc. Cuối cảnh, cả dãy thu nhỏ lên góc trên, thành thanh tiến trình dùng cho các cảnh sau.',
		sound='Sáu tiếng "tick" theo sáu ô; nốt chuông nhẹ khi dãy thu lên góc.',
	),
	'04': dict(
		title='Ví của An',
		board=['Ví = chùm chìa khoá', 'Địa chỉ = ổ khoá', 'Không đưa từ khoá ghi nhớ vào code thật'],
		code=[
			"import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'",
			'',
			'// 24 từ ghi nhớ của An (string[]). Ví mới thì tạo một lần bằng AppWallet.brew()',
			"const words = process.env.AN_MNEMONIC!.split(' ')",
			'',
			'const wallet = new AppWallet({',
			"  key: { type: 'mnemonic', words },",
			'  networkId: NETWORK_ID.PREPROD',
			'})',
			'const myAddress = wallet.getAccount().baseAddressBech32',
		],
		src='apps/nodejs-playground/src/hydra/common.ts:11-22; packages/core/src/types/wallet/index.ts:14-23 (words: string[]); packages/core/src/wallet.ts:87-89 (AppWallet.brew, mặc định 256 bit = 24 từ, qua EmbeddedWallet.generateMnemonic ở embedded.ts:72); packages/core/src/constants/chain.ts:15-19; biến môi trường AN_MNEMONIC là tên minh hoạ',
		lines=[
			'Nhưng trước hết, An cần một chiếc ví. Hãy nhớ rằng ví không chứa tiền, ví chỉ giữ chìa khoá.',
			'Ở đây, ta tạo ví từ chuỗi từ khoá ghi nhớ của An, và chọn mạng thử nghiệm của Cardano.',
			'Từ chiếc ví đó, ta lấy ra địa chỉ của An. Địa chỉ này chính là ổ khoá trên các món tiền của An.',
			'Chuỗi từ khoá ghi nhớ là chìa khoá gốc. Đừng bao giờ để nó trong code thật, hay đăng nó lên mạng.',
		],
		screen='Chiếc ví phấn của tập 1 mở ra, bên trong là chùm chìa. Khung code hiện từng dòng theo lời đọc; dòng khai báo `words` (đọc từ biến môi trường, không viết từ thật vào code) được khoanh và gắn biểu tượng ổ khoá đỏ phấn kèm chữ "bí mật". Dòng `myAddress` nối bằng mũi tên tới một ổ khoá nhỏ.',
		sound='Gõ phím theo từng dòng code; tiếng "cạch" nhỏ khi ổ khoá hiện ra.',
	),
	'05': dict(
		title='Bước 1 — Kết nối Head',
		board=STEPS[:1] + ['Nút Hydra', 'Cầu nối'],
		code=[
			"import { HydraBridge } from '@hydra-sdk/bridge'",
			'',
			"const bridge = new HydraBridge({ url: 'ws://localhost:4001' })",
			'await bridge.connect()   // true khi đã kết nối',
		],
		src='packages/hydra-bridge/src/bridge.ts:24-58, 152-164, 322-339; apps/docs-v2/content/en/3.concepts/4.transactions-in-hydra.md:88-91',
		lines=[
			'Bước một, kết nối vào Head. Mỗi Head có các máy chạy phần mềm Hydra, gọi là nút Hydra.',
			'Ta tạo một cầu nối Hydra, đưa vào địa chỉ của nút, rồi gọi lệnh kết nối.',
			'Cầu nối giữ một đường truyền luôn mở, nên mọi tin mới từ Head đều đến ngay với ứng dụng.',
			'Khi lệnh kết nối trả về đúng, ứng dụng của An đã có mặt trong Head.',
		],
		screen='Vòng tròn Head có vài nút nhỏ trên viền. Một cây cầu phấn bắc từ chiếc laptop của An tới một nút. Khung code bên phải; dòng `connect()` gạch chân, cây cầu sáng lên khi dòng này viết xong.',
		sound='Gõ phím; một nốt chuông khi cầu sáng.',
	),
	'06': dict(
		title='Bước 2 — Snapshot của Head',
		board=STEPS[1:2] + ['Snapshot = danh sách món tiền cả Head cùng ký'],
		code=[
			'const snapshot = await bridge.querySnapshotUtxo()',
			'',
			'// {',
			"//   'fa1e…369f#0': {",
			"//     address: 'addr_test1…',",
			'//     value: { lovelace: 18000000 },',
			'//     datum: null, inlineDatum: null, referenceScript: null',
			'//   }',
			'// }',
		],
		src='packages/hydra-bridge/src/bridge.ts:460-473; kết quả mẫu ở apps/docs-v2/content/en/3.concepts/4.transactions-in-hydra.md:63-75 (mã giao dịch và địa chỉ rút gọn)',
		lines=[
			'Bước hai, xem bên trong Head lúc này đang có những món tiền nào.',
			'Cầu nối có một lệnh để lấy toàn bộ món tiền chưa tiêu trong snapshot mới nhất.',
			'Snapshot là danh sách món tiền tại một thời điểm, được mọi thành viên trong Head cùng ký xác nhận.',
			'Kết quả trả về chính là UTxO Object mà ta đã gặp ở tập một.',
			'Trong ví dụ này, An có một món mười tám ADA, khoá bằng địa chỉ của An.',
		],
		screen='Danh sách món tiền vẽ phấn (nhãn "snapshot") trong vòng tròn Head được đóng dấu bởi vài chữ ký nhỏ (các thành viên). Khung code hiện dòng lệnh, rồi phần kết quả JSON hiện ra như ở cảnh 13 tập 1: khoá `fa1e…369f#0` khoanh tròn, `address` có ổ khoá nhỏ, `18000000` gạch chân kèm chú thích phấn "= 18 ADA". Góc dưới: "số liệu từ ví dụ trong tài liệu".',
		sound='Tiếng đóng dấu nhẹ; gõ phím; nốt chuông khi khoá JSON được khoanh.',
	),
	'07': dict(
		title='Bước 2 — Món tiền của riêng An',
		board=STEPS[1:2] + ['Cả Head → chỉ của An'],
		code=[
			'const myUtxos = await bridge.queryAddressUTxO(myAddress)',
			'// UTxO[] — sẵn sàng cho TxBuilder',
		],
		src='packages/hydra-bridge/src/bridge.ts:669-678; apps/nodejs-playground/src/hydra/build-tx.ts:19',
		lines=[
			'Nhưng An không cần cả danh sách của Head, An chỉ cần những món mà An mở khoá được.',
			'Lệnh tiếp theo lọc theo địa chỉ, và chỉ trả về các món tiền của An.',
			'Kết quả là một danh sách đúng định dạng mà TxBuilder cần, nên không phải chuyển đổi gì thêm.',
			'Cầu nối tự giữ snapshot trong bộ nhớ, nên những lần hỏi sau gần như trả lời ngay.',
		],
		screen='Nhiều ô món tiền trong Head, mỗi ô một ổ khoá. Chùm chìa của An quét qua; chỉ ô có ổ khớp được nhấc ra và xếp thành một hàng. Khung code hiện hai dòng. Mũi tên từ hàng ô tới khối nhỏ "TxBuilder" (để dành cho cảnh sau).',
		sound='"Tick" mỗi lần nhấc một ô.',
	),
	'08': dict(
		title='Bước 3 — Gọi TxBuilder',
		board=STEPS[2:3] + ['Chế độ Hydra', 'Phí = 0'],
		code=[
			"import { TxBuilder } from '@hydra-sdk/transaction'",
			'',
			'const txBuilder = new TxBuilder({',
			'  isHydra: true,',
			'  params: { minFeeA: 0, minFeeB: 0 }',
			'})',
		],
		src='packages/hydra-transaction/src/tx-builder/index.ts:91-118; apps/nodejs-playground/src/hydra/build-tx.ts:20-26; apps/docs-v2/content/en/2.guides/5.hydra-integration.md:12-23; apps/docs-v2/content/en/2.guides/2.build-wallet-app.md:674',
		lines=[
			'Bước ba, dựng giao dịch. Đây là lúc TxBuilder bắt tay vào việc.',
			'Khi tạo TxBuilder, ta bật chế độ Hydra, và đặt cả hai tham số tính phí về không.',
			'Head trong ví dụ này không thu phí, nên giao dịch cũng không cần trả đồng phí nào.',
			'Tài liệu hydra-sdk khuyên làm đúng như vậy cho mọi giao dịch chạy bên trong Head.',
		],
		screen='Khối TxBuilder phấn mở nắp, có một công tắc ghi "Hydra" bật lên và hai núm vặn phí quay về 0. Khung code hiện từng dòng; `isHydra: true` và hai số 0 được khoanh.',
		sound='Tiếng "tách" của công tắc; hai tiếng "tick" nhỏ khi núm quay về 0.',
	),
	'09': dict(
		title='Bước 3 — Chọn món và tạo tiền thối',
		board=STEPS[2:3] + ['18 ADA → 2 ADA cho Bình + 16 ADA tiền thối', 'Phí: 0'],
		code=[
			"const bobAddress = 'addr_test1…'    // địa chỉ nhận của Bình (Bech32)",
			'',
			'const tx = await txBuilder',
			'  .setInputs(myUtxos)              // món tiền để chọn',
			'  .addOutput({',
			'    address: bobAddress,           // địa chỉ nhận của Bình',
			"    amount: [{ unit: 'lovelace', quantity: '2000000' }]",
			'  })',
			'  .changeAddress(myAddress)        // tiền thối về An',
			'  .complete()',
		],
		src='packages/hydra-transaction/src/tx-builder/index.ts:516-528 (setInputs), 800-802 (addOutput), 749-759 (changeAddress), 890-926 (complete), 1388-1390 và 347-448 (chọn món, tạo tiền thối); apps/nodejs-playground/src/hydra/build-tx.ts:27-34 (gốc gửi về chính walletAddress, ở đây đổi thành bobAddress); địa chỉ là chuỗi Bech32, txOut(address: string) đọc bằng Address.from_bech32 (tx-builder/index.ts:284, 1218-1219)',
		lines=[
			'Tiếp theo, ta đưa danh sách món tiền của An vào, làm nguồn để chọn.',
			'Ta thêm một đầu ra hai ADA, khoá bằng địa chỉ của Bình.',
			'Trong code, số tiền ghi bằng lovelace, nên hai ADA được viết thành hai triệu.',
			'Rồi ta chỉ định địa chỉ nhận tiền thối, ở đây là chính địa chỉ của An.',
			'Khi gọi lệnh hoàn tất, TxBuilder tự chọn món, ưu tiên món lớn trước, rồi tạo luôn món tiền thối.',
			'Món mười tám ADA bị tiêu trọn, sinh ra hai món mới, hai ADA cho Bình và mười sáu ADA quay về An.',
		],
		screen='Nối tiếp cảnh 15 tập 1: hàng ô món tiền của An đi vào khối TxBuilder. Khung code hiện theo từng dòng lời đọc, mỗi dòng có chú thích phấn bên phải. Khi dòng `.complete()` viết xong, ô 18 ADA bị gạch chéo, tách thành ô 2 ADA (ổ khoá của Bình) và ô 16 ADA (ổ khoá của An, nhãn "tiền thối"). Góc dưới: "số liệu minh hoạ".',
		sound='Gõ phím theo dòng; tiếng gạch khi ô 18 ADA bị tiêu; hai tiếng "tick" khi hai ô mới sinh ra.',
	),
	'10': dict(
		title='Bước 4 — Ký',
		board=STEPS[3:4] + ['Chìa khoá ở lại trong ví', 'Mã giao dịch'],
		code=[
			"import { Resolver } from '@hydra-sdk/core'",
			'',
			'const signedCbor = await wallet.signTx(tx.to_hex())',
			'const txId = Resolver.resolveTxHash(signedCbor)',
		],
		src='packages/core/src/wallet.ts:72-84; packages/core/src/utils/cardano-wasm/resolver.ts:8-13; packages/core/src/index.ts:20,59; apps/nodejs-playground/src/hydra/build-tx.ts:36-37',
		lines=[
			'Bước bốn, ký giao dịch. Giao dịch vừa dựng giống một tờ séc chưa có chữ ký.',
			'Ví của An dùng chìa khoá để ký, rồi trả về giao dịch đã có chữ ký.',
			'Chìa khoá không bao giờ rời khỏi ví, chỉ có chữ ký được gửi đi cùng giao dịch.',
			'Từ giao dịch đã ký, ta tính ra mã giao dịch, cũng là phần đầu trong tên riêng của hai món tiền mới.',
		],
		screen='Tờ séc phấn ghi "18 → 2 + 16". Chùm chìa trong ví chạm vào tờ séc, để lại một con dấu chữ ký; chìa vẫn nằm trong ví. Khung code hai dòng. Dòng `txId` nối mũi tên tới hai ô món tiền mới, ghép thành nhãn "txId#0", "txId#1" như cảnh 12 tập 1. Chữ nhỏ ở góc: "thứ tự đầu ra theo ví dụ minh hoạ".',
		sound='Tiếng đóng dấu; "tick" khi nhãn ghép xong.',
	),
	'11': dict(
		title='Bước 5 — Gửi vào Head',
		board=STEPS[4:5] + ['Hợp lệ?', 'Đã chốt trong snapshot?'],
		code=[
			'const rs = await bridge.submitTxSync({',
			'  cborHex: signedCbor,',
			"  type: 'Witnessed Tx ConwayEra',",
			"  description: 'An gửi Bình 2 ADA',",
			'  txId',
			'})',
		],
		src='packages/hydra-bridge/src/bridge.ts:596-603; packages/hydra-bridge/src/types/transaction.type.ts; packages/hydra-bridge/src/connector/websocket.ts:386-415; apps/nodejs-playground/src/hydra/build-tx.ts:39-44',
		lines=[
			'Bước năm, đưa giao dịch vào Head để các thành viên cùng xác nhận.',
			'Ta gói giao dịch đã ký cùng mã giao dịch và một dòng mô tả ngắn, rồi gửi đi qua cầu nối.',
			'Lệnh gửi này đợi cho tới khi các thành viên trong Head xác nhận giao dịch trong một snapshot mới.',
			'Nếu giao dịch sai, chẳng hạn món tiền đã bị tiêu từ trước, Head sẽ báo không hợp lệ kèm lý do.',
			'Giao dịch được chốt ngay trong Head, không phải chờ khối mới trên mạng chính Cardano.',
		],
		screen='Phong bì giao dịch đi qua cây cầu vào vòng tròn Head. Bên trong, vài thành viên lần lượt đánh dấu tích. Khung code hiện lệnh gửi. Bên cạnh, một nhánh phụ vẽ mờ: phong bì có ô đã gạch bị đóng dấu "Không hợp lệ" (gợi lại cảnh 09 tập 1). Dưới đáy, đường ray "mạng chính" với các khối nối nhau vẽ mờ, phong bì không đi xuống đó.',
		sound='Tiếng "vút" nhẹ khi phong bì qua cầu; các tiếng "tick" của thành viên; một tiếng trầm ngắn ở nhánh không hợp lệ.',
	),
	'12': dict(
		title='Bước 6 — Snapshot mới',
		board=STEPS[5:6] + ['Trước: fa1e…#0 · 18 ADA', 'Sau: txId#0 · 2 ADA → Bình', 'Sau: txId#1 · 16 ADA → An'],
		code=[
			'// rs = {',
			"//   txId: 'dee1…5435', isValid: true, isConfirmed: true,",
			"//   result: { tag: 'SnapshotConfirmed', snapshot: { number: 1, … } }",
			'// }',
			'',
			'const after = await bridge.querySnapshotUtxo()',
		],
		src='packages/hydra-bridge/src/types/submitter.type.ts:7-12; kết quả mẫu ở apps/docs-v2/content/en/3.concepts/4.transactions-in-hydra.md:177-200 (rút gọn); packages/hydra-bridge/src/bridge.ts:460-473',
		lines=[
			'Bước sáu, xem kết quả. Lệnh gửi trả về hai cờ, hợp lệ và đã xác nhận, kèm theo snapshot mới.',
			'Trong ví dụ của tài liệu, đó là snapshot số một, được chốt ngay sau giao dịch của An.',
			'Gọi lại lệnh lấy snapshot, ta thấy món mười tám ADA đã biến mất khỏi danh sách.',
			'Thay vào đó là hai món mới cùng mang mã giao dịch vừa rồi, đánh số không và số một.',
			'Đúng như tập một, món cũ bị tiêu trọn, món mới sinh ra, kể cả món tiền thối.',
		],
		screen='Hai cột "Trước" và "Sau" như cảnh 14 tập 1, lần này bằng dữ liệu của Head. Cột trước một mục 18 ADA bị gạch; cột sau hai mục mới. Bên trái, hình phấn HP-02: khung terminal vẽ phấn in kết quả gửi (`isValid: true`, `isConfirmed: true`, `SnapshotConfirmed`, `number: 1`), vẽ lại theo kết quả mẫu trong tài liệu, góc ghi nhỏ "Hình dựng lại theo tài liệu hydrasdk.com".',
		sound='Tiếng gạch; hai tiếng "tick"; nốt chuông khi chữ "snapshot số 1" hiện ra.',
	),
	'13': dict(
		title='Lắng nghe Head',
		board=['Mỗi snapshot mới → số dư mới'],
		code=[
			"bridge.events.on('onMessage', payload => {",
			"  if (payload.tag === 'SnapshotConfirmed') {",
			'    const balance = bridge.getAddressBalance(myAddress)',
			"    console.log(balance?.get('lovelace'))   // 16000000n",
			'  }',
			'})',
		],
		src='apps/docs-v2/content/en/2.guides/5.hydra-integration.md:318-332; packages/hydra-bridge/src/bridge.ts:190-200, 313-316, 660-662',
		lines=[
			'Trong ứng dụng thật, bạn không phải hỏi lại từng lần, mà chỉ cần lắng nghe Head.',
			'Mỗi khi có một snapshot mới được xác nhận, cầu nối báo một sự kiện và tự cập nhật số dư.',
			'Lúc đó, ta chỉ cần hỏi số dư theo địa chỉ, và nhận lại ngay con số đã được cộng sẵn.',
			'Ví của Bình cũng làm đúng như vậy để biết hai ADA vừa đến.',
		],
		screen='Vòng tròn Head phát ra một gợn sóng mỗi lần có snapshot; gợn sóng chạm tới ví của An và ví của Bình, hai con số số dư đổi (An 16, Bình +2). Khung code hiện bên phải. Gợi lại cảnh 10 tập 1: số dư là một phép cộng.',
		sound='Một nốt chuông nhẹ mỗi gợn sóng.',
	),
	'14': dict(
		title='Ba lỗi hay gặp',
		board=['① Danh sách rỗng', '② Cấu hình mạng chính', '③ Tiêu lại món đã tiêu'],
		code=[],
		src='',
		lines=[
			'Trước khi tự làm, hãy để ý ba lỗi mà người mới hay gặp.',
			'Thứ nhất, Head chưa mở, hoặc ví chưa có món tiền nào bên trong Head, nên danh sách trả về rỗng.',
			'Thứ hai, dùng cấu hình của mạng chính cho TxBuilder, quên bật chế độ Hydra và đặt phí về không.',
			'Thứ ba, dùng lại một món tiền đã tiêu ở snapshot trước. Head sẽ từ chối, vì mỗi món chỉ tiêu được một lần.',
		],
		screen='Ba ô cảnh báo vẽ phấn, mỗi ô một hình nhỏ. Ô ①: vòng tròn Head trống, ngoặc vuông rỗng `[]`. Ô ②: công tắc "Hydra" đang tắt, khoanh đỏ phấn. Ô ③: ô món tiền đã gạch bị đóng dấu "Từ chối".',
		sound='Một tiếng trầm ngắn cho mỗi ô.',
	),
	'15': dict(
		title='Thử ngay trên playground',
		board=['playground.hydrasdk.com', 'Hydra mode', 'Code TypeScript sinh sẵn'],
		code=[],
		src='',
		lines=[
			'Muốn thử trước khi viết dòng code nào, bạn có thể mở playground của hydra-sdk.',
			'Ở đó có trang dựng giao dịch, và chế độ Hydra được bật bằng một ô đánh dấu.',
			'Bạn nạp dữ liệu mẫu, chọn món tiền, thêm đầu ra, rồi dựng giao dịch ngay trên trình duyệt.',
			'Playground còn tự viết ra đoạn TypeScript tương ứng, bạn tải về rồi đưa thẳng vào dự án.',
		],
		screen='Khung trình duyệt vẽ phấn, bên trong lần lượt là các hình phấn dựng lại theo giao diện playground: HP-03 (ô "Hydra mode" đã tích), HP-04 (nút nạp dữ liệu mẫu và vài dòng UTxO), HP-05 (mã giao dịch, thông báo chế độ Hydra và đoạn TypeScript sinh tự động có nút tải). Mỗi hình có vòng khoanh và con trỏ phấn chỉ đúng chỗ đang nói; góc ghi nhỏ "Hình dựng lại theo playground.hydrasdk.com". Không nói playground gửi được vào Head.',
		sound='Tiếng click chuột nhẹ cho mỗi ảnh.',
	),
	'16': dict(
		title='Tóm tắt và lời kết',
		board=STEPS + ['hydrasdk.com', 'playground.hydrasdk.com', 'Thực hiện cùng VTechcom Labs'],
		code=[],
		src='',
		lines=[
			'Tóm lại, giao dịch đầu tiên trong Head chỉ gồm sáu bước, và bạn vừa đi hết cả sáu.',
			'Kết nối, lấy món tiền, dựng giao dịch, ký, gửi đi, rồi xem snapshot mới.',
			'Mọi khái niệm của chuỗi video, từ món tiền chưa tiêu tới chìa khoá và tiền thối, đều nằm trong mấy chục dòng code đó.',
			'Code đầy đủ và hướng dẫn chi tiết từng bước có tại hydrasdk.com.',
			'Còn muốn bấm thử ngay, hãy ghé playground.hydrasdk.com. Chúc bạn có giao dịch đầu tiên thành công.',
		],
		screen='Thanh sáu bước ở góc trên trượt xuống giữa bảng, sáu ô sáng lần lượt. Hình phấn HP-06 (trang "Transactions in Hydra" trên hydrasdk.com, phần "Build transaction", dựng lại) hiện thoáng qua. Cuối: "hydrasdk.com" lớn ở giữa, "playground.hydrasdk.com" nhỏ hơn bên dưới, dòng nhỏ "Thực hiện cùng VTechcom Labs" kèm logo ở góc dưới phải, không đọc thành lời.',
		sound='Một nốt chuông cho mỗi bước; nền ra dần trong 2 giây cuối.',
	),
}

ORDER = list(SCRIPT)

# Ước lượng: VieNeu khoảng 4–5 âm tiết/giây; nghỉ 0,5 s giữa câu, 1,2 s giữa cảnh.
# Cảnh có code cộng thêm 2 giây để người xem kịp đọc code (giữ hình sau câu cuối).
SYL_PER_SEC = 4.2
PAUSE_LINE, PAUSE_SCENE, CODE_HOLD = 0.5, 1.2, 2.0


def estimate(scene):
	syl = sum(lexicon.syllables(l) for l in scene['lines'])
	hold = CODE_HOLD if scene['code'] else 0
	return syl, syl / SYL_PER_SEC + PAUSE_LINE * len(scene['lines']) + PAUSE_SCENE + hold


def write_review(path=HERE / 'kich-ban.md'):
	esc = lambda s: s.replace('|', '\\|')
	out = [(HERE / 'brief.md').read_text(encoding='utf-8').rstrip(), '', '## Kịch bản', '']
	out.append('Không có phụ đề chạy; cột "Chữ trên bảng" là chữ được viết lên bảng trong cảnh, đoạn code của từng cảnh nằm ở mục "Code trên bảng" bên dưới. Số âm tiết đếm sau khi phiên âm theo từ điển đọc.')
	out.append('')
	out.append('| Cảnh | Chữ trên bảng | Lời đọc | Số âm tiết | Trên màn hình | Âm thanh |')
	out.append('|---|---|---|---|---|---|')
	total_syl = total_sec = 0
	for sid in ORDER:
		s = SCRIPT[sid]
		syl, sec = estimate(s)
		total_syl += syl
		total_sec += sec
		lines = '<br>'.join(f'{sid}-{i}: {esc(l)}' for i, l in enumerate(s['lines']))
		counts = '<br>'.join(str(lexicon.syllables(l)) for l in s['lines'])
		board = '<br>'.join(f'`{esc(b)}`' for b in s['board'])
		if s['code']:
			board += f'<br>*(có code; nhãn góc "{CODE_LABEL}")*'
		out.append(f"| **{sid}. {s['title']}**<br>~{sec:.0f} giây | {board} | {lines} | {counts} | {esc(s['screen'])} | {esc(s['sound'])} |")
	n_lines = sum(len(SCRIPT[s]['lines']) for s in ORDER)
	out += ['', f'**Tổng:** {len(ORDER)} cảnh, {n_lines} câu, {total_syl} âm tiết, ước lượng khoảng {total_sec // 60:.0f} phút {total_sec % 60:.0f} giây (tính {SYL_PER_SEC} âm tiết/giây, cộng nghỉ giữa câu và giữa cảnh, cộng {CODE_HOLD:.0f} giây giữ hình ở mỗi cảnh có code).', '']
	out += ['## Code trên bảng', '']
	out.append(f'Code rút gọn từ ví dụ chạy được trong repo; chỉ bỏ log, kiểm tra lỗi và đổi tên biến. Nguồn ghi ngay dưới mỗi đoạn. Mỗi cảnh code hiện nhãn nhỏ ở góc "{CODE_LABEL}", không đọc thành lời.')
	out.append('')
	for sid in ORDER:
		s = SCRIPT[sid]
		if not s['code']:
			continue
		lang = 'bash' if s['code'][0].startswith('npm ') else 'ts'
		out += [f"### {sid}. {s['title']}", '', f'```{lang}', *s['code'], '```', '', f"Nguồn: `{s['src']}`", '']
	path.write_text('\n'.join(out), encoding='utf-8')
	return total_syl, total_sec


def check():
	"""Liệt kê câu ngoài khoảng 12–30 âm tiết."""
	bad = []
	for sid in ORDER:
		for i, l in enumerate(SCRIPT[sid]['lines']):
			n = lexicon.syllables(l)
			if not 12 <= n <= 30:
				bad.append(f'{sid}-{i}: {n} am tiet')
	return bad


if __name__ == '__main__':
	syl, sec = write_review()
	print(f'kich-ban.md: {len(ORDER)} canh, {syl} am tiet, ~{sec:.0f}s')
	for b in check():
		print('  ngoai khoang 12-30:', b)
