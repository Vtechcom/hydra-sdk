"""Tập 11 — Gỡ lỗi giao dịch Hydra thường gặp. Nguồn duy nhất cho hình, giọng và bảng duyệt.

Chạy `python script.py` để xuất lại kich-ban.md.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'shared'))
import lexicon  # noqa: E402

# Mỗi cảnh: board = chữ được viết lên bảng (không phải phụ đề),
# lines = lời đọc (mỗi phần tử là một clip giọng), screen = hình, sound = âm thanh.
CODE_LABEL = 'Code rút gọn, bản đầy đủ ở hydrasdk.com'

SCRIPT = {
	'01': dict(
		title='Khi giao dịch không tới nơi',
		board=['Gỡ lỗi giao dịch Hydra', 'Sổ gỡ lỗi'],
		lines=[
			'Ở tập sáu, An đã gửi hai ADA cho Bình bên trong một Hydra Head, và mọi thứ diễn ra suôn sẻ.',
			'Nhưng khi tự viết code, sớm muộn gì bạn cũng gặp một giao dịch không chịu tới nơi.',
			'Hôm nay ta học cách đọc lời nút Hydra trả về, để biết lỗi nằm ở đâu và sửa thế nào.',
		],
		screen='Cảnh cuối tập 6 hiện lại: hai cột số dư "An 16 ADA", "Bình +2 ADA". Một phong bì giao dịch mới đi về phía vòng tròn Head rồi bị đóng một con dấu hồng phấn. Góc phải: tấm bảng nhỏ ghi "Sổ gỡ lỗi", còn trống, sẽ được ghim thẻ dần qua các cảnh.',
		sound='Nền vào dần. Tiếng phấn. Một tiếng trầm ngắn khi con dấu hồng hiện ra.',
	),
	'02': dict(
		title='Ba kết cục của một lần gửi',
		board=['① Xác nhận: SnapshotConfirmed', '② Từ chối: phiếu có nhãn + lý do', '③ Hết giờ: Timeout', 'Trên máy bạn | Trong Head'],
		lines=[
			'Mỗi lần gửi giao dịch vào Head, có ba chuyện có thể xảy ra.',
			'Thứ nhất, giao dịch được xác nhận trong một snapshot mới. Đó là kết cục ta mong đợi.',
			'Thứ hai, nút Hydra từ chối, và gửi về một tờ phiếu có nhãn ghi rõ lý do.',
			'Thứ ba, chờ mãi không thấy phiếu nào, và ứng dụng đành thôi không chờ nữa.',
			'Ngoài ra, có những lỗi xảy ra ngay trên máy bạn, trước khi giao dịch kịp rời đi.',
		],
		screen='Phong bì tách thành ba nhánh. Nhánh ①: tờ phiếu xanh lá phấn có nhãn góc "SnapshotConfirmed". Nhánh ②: tờ phiếu hồng phấn có nhãn góc để trống và dòng "lý do: …". Nhánh ③: khung nét đứt màu xám, bên trong trống, nhãn "Timeout". Một vạch phấn dọc chia bảng làm hai vùng "Trên máy bạn" (chiếc laptop) và "Trong Head" (vòng tròn Head có nút trên viền). Bên dưới: thẻ ba dòng mẫu "Triệu chứng / Nguyên nhân / Cách tránh".',
		sound='Ba tiếng tick, mỗi nhánh một tiếng. Tiếng phấn kẻ vạch.',
	),
	'03': dict(
		title='Lỗi ngay trên máy: không đủ món tiền',
		board=['Ví trống: setInputs([])', '→ complete(): "Fee not specified"', 'Thiếu tiền: một món 1 ADA', '→ complete(): "UTxO Balance Insufficient"'],
		lines=[
			'Bắt đầu từ lỗi trên máy. Ví trống và ví thiếu tiền nghe thì giống nhau, nhưng báo lỗi rất khác.',
			'Nếu danh sách món tiền rỗng, TxBuilder lại báo một lỗi về phí, khiến ta dễ đi tìm nhầm chỗ.',
			'Còn nếu có món tiền nhưng cộng lại không đủ, lỗi nói thẳng là số dư không đủ.',
			'Cả hai lỗi đều hiện ra ở bước hoàn tất giao dịch, khi chưa có gì được gửi lên Head.',
			'Gặp lỗi về phí, hãy kiểm tra danh sách món tiền trước. Có khi Head chưa có tiền của bạn.',
		],
		screen='Bên trái: chiếc ví mở, bên trong trống, ngoặc vuông `[]`; dòng lỗi phấn "Fee not specified" có dấu hỏi nhỏ cạnh chữ "Fee". Bên phải: ví có một ô vàng nhỏ "1 ADA" đặt cạnh mũi tên "cần 2 ADA"; dòng lỗi "UTxO Balance Insufficient". Khung code nhỏ ở giữa: `await txBuilder.setInputs(myUtxos).addOutput(…).changeAddress(myAddress).complete()`, gạch chân `complete()`. Laptop có dấu chéo vẽ bằng nét trên mũi tên đi tới Head (chưa gửi gì). Thẻ "① Không đủ món tiền" ghim lên sổ gỡ lỗi. Nhãn góc: "' + CODE_LABEL + '".',
		sound='Tiếng gõ phím nhẹ khi code hiện. Một tiếng trầm cho mỗi dòng lỗi.',
	),
	'04': dict(
		title='Phòng họp chưa mở cửa, hoặc đã khoá',
		board=['CommandFailed { clientInput, state }', 'headInfo() → headStatus: \'Open\'', 'Sự kiện: HeadIsOpen · HeadIsClosed', 'v2: CommitRecorded → CommitFinalized'],
		lines=[
			'Sang lỗi phía Head. Một phòng họp chưa mở cửa, hay đã khoá cửa, thì không nhận thêm việc.',
			'Head cũng vậy. Chỉ khi Head đang mở, nút Hydra mới nhận giao dịch.',
			'Gửi lúc Head chưa mở hoặc đã đóng, nút trả về phiếu báo lệnh không thực hiện được, kèm trạng thái của Head.',
			'Ở Hydra phiên bản hai còn một trường hợp nữa. Tiền vừa nạp mà chưa vào snapshot thì chưa tiêu được.',
			'Vì vậy trước khi gửi, hãy hỏi Head đang ở trạng thái nào, và chờ tiền nạp được xác nhận xong.',
		],
		screen='Vòng tròn Head có một cánh cửa phấn: lần đầu cửa có ổ khoá treo ngoài (chưa mở), lần sau cửa khoá kèm chữ "Closed". Phong bì của An dừng trước cửa, nhận lại tờ phiếu hồng nhãn "CommandFailed", trên phiếu có dòng `state: Closed`. Nhánh nhỏ có nhãn "v2": một ô vàng (tiền nạp) đứng ngoài cửa, mũi tên `CommitRecorded → CommitFinalized`, chỉ khi tới `CommitFinalized` ô mới vào trong. Bảng ghi rõ hai dạng: `headInfo()` trả chữ `\'Open\'`, còn tin nhắn sự kiện dùng nhãn `HeadIsOpen`. Thẻ "② Head chưa mở" ghim lên sổ.',
		sound='Tiếng lạch cạch ổ khoá. Một tiếng trầm khi phiếu hồng hiện ra.',
	),
	'05': dict(
		title='Tờ tiền đã đưa đi rồi',
		board=['TxInvalid … BadInputsUTxO …', 'gửi 1 → hỏi danh sách: vẫn 18 ADA', 'snapshot mới → 16 ADA', 'await submitTxSync(…) rồi mới queryAddressUTxO'],
		lines=[
			'Giờ đến lỗi hay gặp nhất. An vừa gửi hai ADA cho Bình, rồi bấm gửi thêm một giao dịch nữa ngay lập tức.',
			'Cả hai giao dịch đều dùng cùng một món mười tám ADA. Mà mỗi món chỉ tiêu được một lần.',
			'Giao dịch đến trước được nhận, còn giao dịch đến sau bị báo không hợp lệ, vì món đầu vào không còn nữa.',
			'Vì sao An lại dùng món cũ? Vì danh sách món tiền trong cầu nối Hydra chỉ cập nhật khi có snapshot mới.',
			'Cách tránh khá đơn giản. Chờ giao dịch trước được xác nhận, rồi mới lấy danh sách và dựng giao dịch tiếp theo.',
		],
		screen='Hai phong bì cùng kẹp một ô vàng "18 ADA". Phong bì thứ nhất qua cửa Head và nhận phiếu xanh lá; phong bì thứ hai nhận phiếu hồng "TxInvalid", dòng lý do rút gọn "… BadInputsUTxO …" kèm chữ nhỏ "lý do rút gọn". Gợi lại cảnh tiêu hai lần của tập 1. Sau đó một dòng thời gian phấn nằm ngang: "gửi giao dịch 1" → "hỏi danh sách: vẫn 18 ADA" (ô vàng cũ) → "snapshot mới" → "16 ADA". Khung code: `const rs = await bridge.submitTxSync(tx1)` rồi `const myUtxos = await bridge.queryAddressUTxO(myAddress)`. Thẻ "③ Món đã bị tiêu" ghim lên sổ. Nhãn góc: "' + CODE_LABEL + '".',
		sound='Tiếng tick khi hai phong bì xuất phát. Tiếng chuông nhẹ cho phiếu xanh, tiếng trầm cho phiếu hồng.',
	),
	'06': dict(
		title='Thiếu bằng chứng có chìa',
		board=['TxInvalid … MissingVKeyWitnessesUTXOW …', '① gửi tx.to_hex() thay vì signedCbor', '② ký bằng tài khoản khác', '③ người thứ hai: signTx(cbor, true)'],
		lines=[
			'Ở tập bốn, ta đã biết mỗi món tiền có một ổ khoá, và chữ ký là bằng chứng bạn có chìa.',
			'Giao dịch thiếu chữ ký của chủ món tiền nào thì bị từ chối, lý do ghi rõ là thiếu chữ ký.',
			'Thứ nhất, bạn gửi nhầm bản chưa ký. Thứ hai, bạn ký bằng một tài khoản khác trong ví.',
			'Thứ ba, giao dịch cần hai người ký mà mới có một. Người thứ hai phải ký thêm vào bản đã có chữ ký.',
		],
		screen='Ô vàng có ổ khoá; chìa của An bị bỏ quên trên bàn, phong bì không có dấu ký. Phiếu hồng "TxInvalid", lý do rút gọn "… MissingVKeyWitnessesUTXOW …". Khung code ba dòng: `tx.to_hex()` bị gạch, bên cạnh `const signedCbor = await wallet.signTx(tx.to_hex())`; dòng `wallet.signTx(cbor, true)` cho người ký thứ hai, gợi lại chiếc két "hai trong ba chữ ký" của tập 5. Thẻ "④ Thiếu chữ ký" ghim lên sổ. Nhãn góc: "' + CODE_LABEL + '".',
		sound='Tiếng chìa khoá leng keng nhẹ. Tiếng gõ phím ở khung code.',
	),
	'07': dict(
		title='Sổ cộng không khớp',
		board=['vào = ra + phí', 'quên changeAddress → "Fee not specified"', 'TxInvalid … ValueNotConservedUTxO … / FeeTooSmallUTxO …', 'params: await bridge.getProtocolParameters()'],
		lines=[
			'Sổ sách trong Head phải luôn cân. Tổng tiền vào bằng tổng tiền ra, cộng với phí.',
			'Nếu bạn quên khai địa chỉ nhận tiền thối, TxBuilder lại báo một lỗi về phí, dù phí không phải gốc rễ.',
			'Cố ép dựng bằng cách tự đặt phí thì được một giao dịch không cân, và nút Hydra sẽ từ chối.',
			'Còn nếu Head có thu phí mà bạn đặt phí bằng không, giao dịch cũng không qua được.',
			'Cách an toàn là luôn đặt địa chỉ tiền thối, và lấy tham số phí từ chính Head thay vì tự gõ.',
		],
		screen='Cán cân phấn: đĩa trái "vào 18 ADA", đĩa phải "ra 2 ADA", khoảng trống "16 ADA tiền thối?" có dấu hỏi; cán cân lệch. Dòng lỗi máy "Fee not specified" cạnh chữ "quên changeAddress". Phiếu hồng ghi hai tên lỗi rút gọn `ValueNotConservedUTxO`, `FeeTooSmallUTxO`. Khung code: `new TxBuilder({ isHydra: true, params: await bridge.getProtocolParameters() })` và `.changeAddress(myAddress)` được khoanh. Khi dòng `changeAddress` viết xong, ô "16 ADA" hiện ra và cán cân thăng bằng. Thẻ "⑤ Sổ không cân" ghim lên sổ. Nhãn góc: "' + CODE_LABEL + '".',
		sound='Tiếng cán cân nghiêng (một nốt trầm trượt). Một tiếng chuông khi cán cân thăng bằng.',
	),
	'08': dict(
		title='Ổ khoá biết suy nghĩ nói "không"',
		board=['TxInvalid … NoCollateralInputs …', 'Thế chấp: món nằm trong Head, chỉ ADA', '.txInCollateral(txHash, index, amount, address)'],
		lines=[
			'Ở tập năm, ta đã gặp những ổ khoá biết suy nghĩ, tức là món tiền được canh giữ bởi script.',
			'Muốn mở món như vậy, giao dịch cần thêm một món tiền thế chấp, và món ấy chỉ được chứa ADA.',
			'Trong Head, món thế chấp này cũng phải là một món đang nằm sẵn bên trong Head.',
			'Nếu script trả lời không, nút Hydra báo giao dịch không hợp lệ, kèm lý do do chính script đưa ra.',
		],
		screen='Ổ khoá bánh răng của tập 5 lắc qua lắc lại (nói "không"). Bên cạnh, một ô vàng nhỏ ghi "thế chấp, chỉ ADA" nằm trong vòng tròn Head; một ô tương tự nằm ngoài Head bị gạch bằng nét chéo. Phiếu hồng "TxInvalid", lý do rút gọn "… NoCollateralInputs …". Khung code `.txInCollateral(c.input.txHash, c.input.outputIndex, c.output.amount, c.output.address)`. Thẻ "⑥ Script và thế chấp" ghim lên sổ. Nhãn góc: "' + CODE_LABEL + '".',
		sound='Tiếng bánh răng quay rồi dừng khựng. Một tiếng trầm.',
	),
	'09': dict(
		title='Người giữ sổ đọc báo cũ',
		board=['RejectedInputBecauseUnsynced { drift }', 'NodeUnsynced · NodeSynced', 'bridge.syncedStatus === \'InSync\'', 'v1.3+'],
		lines=[
			'Có những lúc lỗi không nằm ở giao dịch, mà nằm ở chính nút Hydra.',
			'Nút Hydra phải theo kịp mạng chính Cardano, giống người giữ sổ phải đọc tin mới nhất mỗi ngày.',
			'Khi bị chậm quá một ngưỡng, nút tạm từ chối mọi lệnh, và báo mình đang chậm bao nhiêu giây.',
			'Cơ chế này có từ phần mềm Hydra phiên bản một chấm ba trở đi.',
			'Với lỗi này, hydra-sdk báo ngay cho bạn, nên chỉ cần chờ nút đồng bộ xong rồi gửi lại.',
		],
		screen='Nút Hydra (hình tròn nhỏ trên viền Head) cầm tờ báo phấn ghi ngày cũ; bên dưới là đường ray mạng chính với các khối nối nhau chạy lên trước, đồng hồ của nút chạy chậm hơn đồng hồ của đường ray. Phiếu hồng "RejectedInputBecauseUnsynced" có dòng `drift: … giây`. Dòng code `if (bridge.syncedStatus !== \'InSync\') { /* chờ NodeSynced */ }`. Nhãn nhỏ "v1.3+" ở góc phiếu. Thẻ "⑦ Nút chưa đồng bộ" ghim lên sổ. Nhãn góc: "' + CODE_LABEL + '".',
		sound='Tiếng tích tắc chậm hơn nhịp nền. Một tiếng trầm cho phiếu hồng.',
	),
	'10': dict(
		title='Hết giờ chưa chắc là hỏng',
		board=['Timeout: mặc định 30 000 ms', 'snapshot.confirmed có txId?', 'InvalidInput { reason, input } — không có txId', 'submitL2Tx → Confirmed · Invalid · Rejected · Submitted'],
		lines=[
			'Cuối cùng là trường hợp khó chịu nhất. Chờ mãi không thấy phiếu nào, rồi hết thời gian chờ.',
			'Hết thời gian chờ chỉ có nghĩa là ứng dụng thôi chờ, mặc định sau ba mươi giây.',
			'Giao dịch vẫn có thể được xác nhận ngay sau đó. Vội gửi lại thì bạn dễ vấp lỗi món đã bị tiêu.',
			'Vì vậy, hãy xem snapshot mới đã có mã giao dịch của bạn chưa, rồi mới quyết định gửi lại.',
			'Có một nguyên nhân khó thấy. Nút không đọc nổi tin nhắn gửi lên, và phiếu trả về không ghi mã giao dịch.',
			'Khi đó lệnh gửi chỉ thấy hết thời gian chờ. Muốn thấy lý do, bạn phải lắng nghe trực tiếp tin nhắn của nút.',
			'Cầu nối Hydra còn một cách gửi khác, để chính nút Hydra trả về kết luận cuối cùng.',
		],
		screen='Đồng hồ cát phấn chảy hết; khung nét đứt xám "Timeout". Ngay sau đó một phiếu xanh lá "SnapshotConfirmed" đến muộn, mũi tên nhỏ chỉ vào danh sách `snapshot.confirmed` có `txId` của An. Nhánh dưới: một phong bì chữ nguệch ngoạc bị trả lại cùng phiếu hồng "InvalidInput { reason, input }", ô `txId` trên phiếu để trống và gạch chéo bằng nét. Góc phải: dòng `bridge.submitL2Tx(tx)` với bốn nhãn kết quả xếp dọc, kèm nhãn nhỏ "bridge 2.x". Thẻ "⑧ Hết thời gian chờ" ghim lên sổ. Nhãn góc: "' + CODE_LABEL + '".',
		sound='Tiếng tích tắc dừng lại. Một tiếng chuông nhẹ khi phiếu xanh đến muộn.',
	),
	'11': dict(
		title='Cho dev: kiểm tra trước khi gửi',
		board=[
			'const { headStatus } = await bridge.headInfo()',
			"if (headStatus !== 'Open') return",
			"if (bridge.syncedStatus !== 'InSync') return",
			'const myUtxos = await bridge.queryAddressUTxO(myAddress)',
		],
		lines=[
			'Giờ ta gom lại thành code. Trước khi gửi, hãy hỏi ba câu.',
			'Thứ nhất, Head có đang mở không. Thứ hai, nút Hydra đã đồng bộ với mạng chính chưa.',
			'Thứ ba, danh sách món tiền của ví có phải bản mới nhất không.',
			'Ba câu hỏi này chặn trước lỗi Head đóng cửa, lỗi nút chậm, và lỗi dùng món tiền cũ.',
		],
		screen='Khung code bốn dòng hiện lần lượt, mỗi dòng có một dấu tích vẽ bằng nét ở lề trái khi viết xong. Mũi tên nhỏ nối ba dòng kiểm tra tới ba thẻ ②, ⑦, ③ trên sổ gỡ lỗi. Nhãn góc: "' + CODE_LABEL + '".',
		sound='Tiếng gõ phím nhẹ. Một tiếng tick cho mỗi dấu tích.',
	),
	'12': dict(
		title='Cho dev: đọc phiếu trả về',
		board=[
			'try { await bridge.submitTxSync(tx) }',
			'catch (e) {',
			'  if (!e.tag) → chưa kết nối',
			"  switch (e.tag) { 'TxInvalid' · 'CommandFailed' ·",
			"    'RejectedInputBecauseUnsynced' · 'Timeout' } }",
			"bridge.events.on('onMessage', p => p.tag === 'InvalidInput' && …)",
		],
		lines=[
			'Sau khi gửi, hãy bọc lệnh gửi trong một khối bắt lỗi.',
			'Lỗi không có nhãn nghĩa là ứng dụng chưa kết nối tới nút Hydra.',
			'Lỗi có nhãn thì rẽ nhánh theo nhãn. Không hợp lệ thì đọc lý do, chưa đồng bộ thì chờ rồi gửi lại.',
			'Hết thời gian chờ thì kiểm tra snapshot trước. Và luôn để một bộ nghe tin nhắn, để không bỏ sót phiếu nào.',
		],
		screen='Khung code khối try/catch. Dòng `if (!e.tag)` khoanh trước `switch`. Mỗi nhánh của `switch` có một mũi tên phấn nối tới thẻ tương ứng trên sổ gỡ lỗi (TxInvalid tới ③④⑤⑥, CommandFailed tới ②, RejectedInputBecauseUnsynced tới ⑦, Timeout tới ⑧). Dòng cuối `bridge.events.on(…)` vẽ thành chiếc tai nghe phấn nhỏ đặt cạnh vòng tròn Head. Nhãn góc: "' + CODE_LABEL + '".',
		sound='Tiếng gõ phím nhẹ. Tiếng phấn kẻ mũi tên.',
	),
	'13': dict(
		title='Tóm tắt và lời kết',
		board=['① Đọc nhãn và lý do', '② Kiểm tra trước khi gửi', '③ Hết giờ: kiểm tra lại snapshot', 'hydrasdk.com', 'Thực hiện cùng VTechcom Labs'],
		lines=[
			'Tóm lại, gỡ lỗi giao dịch Hydra xoay quanh ba thói quen.',
			'Thứ nhất, đọc nhãn và lý do trên phiếu trả về trước khi sửa code.',
			'Thứ hai, trước khi gửi, kiểm tra Head đang mở, nút đã đồng bộ, và món tiền là bản mới nhất.',
			'Thứ ba, hết thời gian chờ thì kiểm tra lại snapshot, đừng vội gửi lại.',
			'Hướng dẫn chi tiết và code đầy đủ có tại hydrasdk.com.',
		],
		screen='Tấm "Sổ gỡ lỗi" đầy tám thẻ trượt vào giữa bảng, kèm một dòng nhỏ ở đáy "PostTxOnChainFailed: lỗi vòng đời Head, xem tập 3". Ba ý tóm tắt sáng lần lượt. Cuối: "hydrasdk.com" lớn ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc dưới phải, không đọc thành lời.',
		sound='Một nốt chuông cho mỗi ý; nền ra dần trong 2 giây cuối.',
	),
}

ORDER = list(SCRIPT)

# Ước lượng: VieNeu khoảng 4–5 âm tiết/giây; nghỉ 0,5 s giữa câu, 1,2 s giữa cảnh.
SYL_PER_SEC = 4.2
PAUSE_LINE, PAUSE_SCENE = 0.5, 1.2


def estimate(scene):
	syl = sum(lexicon.syllables(l) for l in scene['lines'])
	return syl, syl / SYL_PER_SEC + PAUSE_LINE * len(scene['lines']) + PAUSE_SCENE


def write_review(path=HERE / 'kich-ban.md'):
	esc = lambda s: s.replace('|', '\\|')
	out = [(HERE / 'brief.md').read_text(encoding='utf-8').rstrip(), '', '## Kịch bản', '']
	out.append('Không có phụ đề chạy; cột "Chữ trên bảng" là chữ được viết lên bảng trong cảnh. Số âm tiết đếm sau khi phiên âm theo từ điển đọc.')
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
		out.append(f"| **{sid}. {s['title']}**<br>~{sec:.0f} giây | {board} | {lines} | {counts} | {esc(s['screen'])} | {esc(s['sound'])} |")
	out += ['', f'**Tổng:** {sum(len(SCRIPT[s]["lines"]) for s in ORDER)} câu, {total_syl} âm tiết, ước lượng khoảng {total_sec // 60:.0f} phút {total_sec % 60:.0f} giây (tính {SYL_PER_SEC} âm tiết/giây, cộng nghỉ giữa câu và giữa cảnh).', '']
	path.write_text('\n'.join(out), encoding='utf-8')
	return total_syl, total_sec


if __name__ == '__main__':
	syl, sec = write_review()
	print(f'kich-ban.md: {syl} am tiet, ~{sec:.0f}s')
	for sid in ORDER:
		for i, l in enumerate(SCRIPT[sid]['lines']):
			n = lexicon.syllables(l)
			if not 12 <= n <= 30:
				print(f'  {sid}-{i}: {n} am tiet')
