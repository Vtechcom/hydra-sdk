"""Tập 7 — Phí giao dịch trên Cardano được tính thế nào? Nguồn duy nhất cho hình, giọng và bảng duyệt.

Chạy `python script.py` để xuất lại kich-ban.md.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'shared'))
import lexicon  # noqa: E402

# Mỗi cảnh: board = chữ được viết lên bảng (không phải phụ đề),
# lines = lời đọc (mỗi phần tử là một clip giọng), screen = hình, sound = âm thanh.
# Mọi con số tham số giao thức lấy từ Koios, mainnet epoch 661, ngày 16/10/2026 (xem brief.md).
PARAMS_NOTE = 'Mainnet, epoch 661, 16/10/2026'
CODE_LABEL = 'Code rút gọn, bản đầy đủ ở hydrasdk.com'

SCRIPT = {
	'01': dict(
		title='Hai con số phí',
		board=['An → Bình: 2 ADA · Phí: 0', 'Ly cà phê · Phí: 0,17 ADA', 'Phí được tính thế nào?'],
		lines=[
			'Ở tập trước, An gửi hai ADA cho Bình bên trong một Hydra Head, và không mất đồng phí nào.',
			'Còn ở tập một, ly cà phê trả trên mạng chính tốn thêm không phẩy mười bảy ADA tiền phí.',
			'Vậy phí được tính thế nào, và vì sao hai con số lại khác nhau đến vậy?',
			'Hôm nay ta sẽ mở bảng giá ra, xem từng đồng phí đến từ đâu.',
		],
		screen='Bên trái: vòng tròn Hydra Head của tập 6, bên trong ô vàng "An → Bình: 2 ADA" và dòng "Phí: 0". Bên phải: hoá đơn cà phê của tập 1 với dòng "Phí: 0,17 ADA", đồng phí cam nhỏ bên cạnh. Dấu hỏi phấn lớn ở giữa, rồi dòng "Phí được tính thế nào?" viết chậm phía dưới.',
		sound='Nền vào dần. Tiếng phấn; một tiếng đồng xu nhỏ khi đồng phí cam hiện ra.',
	),
	'02': dict(
		title='ADA và lovelace',
		board=['1 ADA = 1.000.000 lovelace', '0,17 ADA ≈ 170.000 lovelace'],
		lines=[
			'Trước hết là đơn vị. Phí trên Cardano được tính bằng lovelace, đơn vị nhỏ nhất của ADA.',
			'Một triệu lovelace mới bằng một ADA, nên mọi khoản phí đều là số nguyên lovelace.',
			'Không phẩy mười bảy ADA của ly cà phê, đổi ra là khoảng một trăm bảy mươi nghìn lovelace.',
		],
		screen='Một đồng ADA phấn vỡ thành rất nhiều hạt nhỏ xếp thành lưới. Dòng "1 ADA = 1.000.000 lovelace" viết dưới. Hoá đơn cà phê thu nhỏ ở góc, số 0,17 ADA được gạch chân rồi đổi thành "≈ 170.000 lovelace".',
		sound='Tiếng hạt nhỏ rơi lách tách khi đồng ADA tách ra; tiếng phấn.',
	),
	'03': dict(
		title='Bảng giá niêm yết',
		board=['Tham số giao thức (protocol parameters)', '1. ………', '2. ………', '3. ………', '4. ………', PARAMS_NOTE],
		lines=[
			'Phí trên Cardano không do ai mặc cả. Nó được đọc từ một bảng giá niêm yết công khai.',
			'Bảng giá ấy gọi là tham số giao thức, và mọi giao dịch cùng lúc đều dùng chung một bảng.',
			'Bảng chỉ thay đổi khi cả mạng cập nhật tham số, chứ không đổi theo từng giao dịch.',
			'Bảng có bốn dòng. Hai dòng đầu áp dụng cho mọi giao dịch, hai dòng sau chỉ tính khi cần.',
		],
		screen='Tấm bảng giá phấn bốn dòng còn trống, khung viền như bảng niêm yết treo tường, tiêu đề "Tham số giao thức (protocol parameters)". Bên phải là cột "bàn tính" để trống. Hai dòng đầu có nhãn nhỏ "mọi giao dịch", hai dòng sau "chỉ khi có". Góc dưới phải ghi nhỏ "Mainnet, epoch 661, 16/10/2026". Không vẽ quầy hay người thu tiền.',
		sound='Tiếng phấn kẻ bảng; một tiếng "tick" cho mỗi dòng trống.',
	),
	'04': dict(
		title='Dòng một: phí cố định',
		board=['1. Phí cố định: 155.381 lovelace', 'mọi giao dịch'],
		lines=[
			'Dòng thứ nhất là phí cố định. Giao dịch nào cũng trả khoản này, dù to hay nhỏ.',
			'Hiện nay khoản đó là một trăm năm mươi lăm nghìn ba trăm tám mươi mốt lovelace.',
			'Nhờ có nó, ai muốn gửi hàng loạt giao dịch rác để làm nghẽn mạng sẽ phải trả một khoản tốn kém.',
		],
		screen='Dòng 1 của bảng giá sáng màu cam phấn: "Phí cố định: 155.381 lovelace", nhãn "mọi giao dịch". Bên dưới: một chồng phong bì rác ùn ùn đi tới, mỗi phong bì phải kèm một đồng phí cam; chồng phong bì dừng lại, đồng phí chất thành đống.',
		sound='Tiếng phấn; tiếng đồng xu rơi dồn dập rồi dừng.',
	),
	'05': dict(
		title='Dòng hai: theo kích thước',
		board=['2. Theo kích thước: 44 lovelace/byte', 'mọi giao dịch', 'Cà phê: 44 × 300 = 13.200', '300 byte: số minh hoạ'],
		lines=[
			'Dòng thứ hai tính theo kích thước. Giao dịch càng dài thì càng đắt, giống hàng càng nặng thì cước càng cao.',
			'Cứ mỗi byte, giao dịch trả thêm bốn mươi bốn lovelace.',
			'Đầu vào, đầu ra, và cả mỗi chữ ký đều chiếm chỗ, nên càng nhiều người ký thì càng tốn hơn.',
			'Giả sử giao dịch cà phê dài ba trăm byte, phần này là mười ba nghìn hai trăm lovelace.',
		],
		screen='Quả cân xanh lá phấn đặt lên đĩa cân; dòng 2 bảng giá sáng: "Theo kích thước: 44 lovelace/byte", nhãn "mọi giao dịch". Giao dịch cà phê vẽ như một dải băng gồm các khúc "đầu vào", "đầu ra", "chữ ký"; mỗi khúc đặt lên cân. Bàn tính bên phải ghi "44 × 300 = 13.200". Chữ nhỏ "300 byte: số minh hoạ".',
		sound='Tiếng "cạch" khi quả cân đặt xuống; tiếng bàn tính "tách" khi ra con số.',
	),
	'06': dict(
		title='Dòng ba: công vặn ổ khoá',
		board=['3. Chạy script: bộ nhớ + số bước', 'chỉ khi có script', 'Ví dụ minh hoạ: 2 triệu bộ nhớ, 700 triệu bước', '→ 165.870 lovelace'],
		lines=[
			'Dòng thứ ba chỉ xuất hiện khi giao dịch phải chạy script, như lúc mở chiếc két chung ở tập năm.',
			'Mỗi lần ổ khoá bánh răng quay, nó tốn một ít bộ nhớ và một số bước tính.',
			'Hai thứ này gọi chung là đơn vị thực thi, và bảng giá ghi sẵn giá của từng loại.',
			'Ví dụ một script khá nặng có thể tốn thêm khoảng một trăm sáu mươi sáu nghìn lovelace.',
		],
		screen='Ổ khoá bánh răng trắng của tập 5 xuất hiện trên chiếc két, các bánh răng quay. Hai đồng hồ đo nhỏ "Bộ nhớ" và "Số bước" kim nhích dần. Dòng 3 bảng giá sáng, nhãn "chỉ khi có script". Bên lề, khung ví dụ minh hoạ: "2 triệu bộ nhớ, 700 triệu bước → 165.870 lovelace". Ly cà phê ở góc có dòng 3 ghi "0".',
		sound='Tiếng bánh răng quay nhỏ; tiếng tích tắc của đồng hồ đo.',
	),
	'07': dict(
		title='Dòng bốn: script tham chiếu',
		board=['4. Script tham chiếu: theo byte', 'chỉ khi trỏ tới script đặt sẵn', '15 lovelace/byte (bậc đầu, script dưới 25 KiB)'],
		lines=[
			'Dòng thứ tư có từ bản nâng cấp Conway, dành cho script tham chiếu.',
			'Thay vì mang cả ổ khoá theo mình, giao dịch chỉ trỏ tới một script đã đặt sẵn trên chuỗi.',
			'Khi đó giao dịch trả thêm theo kích thước của script ấy, script càng lớn thì giá mỗi byte càng tăng.',
		],
		screen='Một ổ khoá màu tím phấn nằm trên kệ của dải chuỗi khối. Giao dịch đi tới, không mang ổ khoá mà chỉ có một mũi tên tím trỏ lên kệ. Dòng 4 bảng giá sáng, nhãn "chỉ khi trỏ tới script đặt sẵn", chú thích nhỏ "15 lovelace/byte (bậc đầu, script dưới 25 KiB)". Ly cà phê ở góc có dòng 4 ghi "0".',
		sound='Tiếng phấn; một nốt chuông nhỏ khi mũi tên chạm tới kệ.',
	),
	'08': dict(
		title='Cộng lại cho ly cà phê',
		board=['155.381 + 13.200 + 0 + 0', '= 168.581 lovelace ≈ 0,17 ADA', 'Vào = Ra + Phí'],
		lines=[
			'Giờ ta cộng lại cho ly cà phê. Đây là giao dịch chuyển tiền thường, nên dòng ba và dòng bốn bằng không.',
			'Phí cố định cộng với phần theo kích thước, ra một trăm sáu mươi tám nghìn năm trăm tám mươi mốt lovelace.',
			'Làm tròn, đó chính là không phẩy mười bảy ADA mà ta đã gặp ở tập một.',
			'Con số này được ghi thẳng vào giao dịch, và hai vế vẫn cân, tổng vào bằng tổng ra cộng phí.',
		],
		screen='Bàn tính bên phải bảng giá cộng bốn dòng: "155.381 + 13.200 + 0 + 0 = 168.581 lovelace ≈ 0,17 ADA"; con số cuối biến thành một đồng phí cam. Phương trình "Vào = Ra + Phí" của tập 1 hiện lại bên dưới. Góc nhỏ: chiếc két chung với dòng 3 sáng và chú thích "có script, phí cao hơn" (không ghi tổng).',
		sound='Bốn tiếng bàn tính "tách"; một nốt chuông khi ra 0,17 ADA.',
	),
	'09': dict(
		title='Tiền thối và lượng ADA tối thiểu',
		board=['50 ADA → 30 ADA + 19,83 ADA + phí 0,17 ADA', 'ADA tối thiểu: không phải phí'],
		lines=[
			'Phí được trừ vào phần dư. Phần còn lại quay về ví thành món tiền thối, như ta đã thấy ở tập một.',
			'Ngoài ra, mỗi món tiền phải giữ một lượng ADA tối thiểu, tuỳ theo kích thước của món đó.',
			'Nhưng lượng ADA ấy không phải phí. Nó vẫn nằm trong món tiền, và vẫn thuộc về người nhận.',
		],
		screen='Ô vàng 50 ADA bị gạch chéo, tách thành ô vàng 30 ADA (ổ khoá người bán), ô vàng 19,83 ADA (ổ khoá của bạn, nhãn "tiền thối") và đồng phí cam 0,17 ADA rơi ra ngoài. Mỗi ô vàng có một vạch kẻ ngang sát đáy, nhãn "tối thiểu"; mũi tên chỉ vạch đó kèm chữ "không phải phí".',
		sound='Tiếng gạch phấn khi ô 50 ADA bị tiêu; hai tiếng "tick" khi hai ô mới sinh ra.',
	),
	'10': dict(
		title='Biết trước khi bấm gửi',
		board=['Giao dịch + món tiền + bảng giá', 'Chạy thử → biết phí → rồi mới ký', 'Hỏng ở vòng đầu: không mất phí'],
		lines=[
			'Điều đáng giá là mọi thứ cần để tính phí đều đã nằm trong tay ta trước khi gửi.',
			'Đó là chính giao dịch, các món tiền nó tiêu, và bảng giá công khai của mạng.',
			'Nếu có script, ví chạy thử trước để biết đơn vị thực thi, như ta đã nói ở tập năm.',
			'Tính xong phí, ví mới ký và gửi. Giao dịch hỏng ở vòng kiểm tra đầu tiên thì không mất phí.',
		],
		screen='Chiếc laptop phấn của tập 5, bên trong có bản sao ổ khoá chạy thử. Ba thứ "giao dịch", "món tiền", "bảng giá" bay vào laptop; bàn tính ra con số trước khi con dấu chữ ký đóng xuống. Nhánh phụ nhỏ ở góc: "script lỗi sau khi gửi → mất tiền thế chấp".',
		sound='Tiếng bánh răng nhỏ trong laptop; tiếng bàn tính; tiếng đóng dấu nhẹ.',
	),
	'11': dict(
		title='Không có trả giá để chen hàng',
		board=['Ethereum: phí cơ bản lên xuống + tiền boa', 'Cardano: bảng giá đứng yên'],
		lines=[
			'Ở Ethereum, phí cơ bản lên xuống theo độ đầy của từng khối.',
			'Người gửi còn có thể trả thêm tiền boa, để giao dịch của mình được đưa vào sớm hơn.',
			'Trên Cardano, phí tối thiểu không lên xuống theo lúc mạng đông hay vắng.',
			'Cũng không có cơ chế trả thêm tiền boa để chen lên trước như vậy.',
		],
		screen='Bên trái: một bảng phấn với con số phí nhảy lên xuống theo các khối đầy dần, mũi tên nhỏ "tiền boa" đẩy một giao dịch lên đầu hàng. Bên phải: bảng giá niêm yết đứng yên, các giao dịch xếp lần lượt. Giữa hai bên là một đường kẻ dọc, không có chữ chê bai.',
		sound='Tiếng số đếm lên xuống nhanh ở bên trái; bên phải chỉ có nền đều.',
	),
	'12': dict(
		title='Phí trong Hydra Head',
		board=['Head: bảng giá riêng', 'tuỳ cấu hình của Head', 'Mở, đóng Head: phí mạng chính'],
		lines=[
			'Vậy vì sao trong Head ở tập sáu, phí lại bằng không?',
			'Mỗi Hydra Head có một bảng giá riêng, do người vận hành Head cấu hình khi khởi động.',
			'Tài liệu mẫu của Hydra đặt mọi dòng phí bằng không, nhưng Head khác vẫn có thể giữ lại vài dòng.',
			'Còn mở và đóng Head là giao dịch trên Cardano, nên vẫn trả theo bảng giá của mạng chính.',
		],
		screen='Đường kẻ ngang: dưới là dải Cardano, trên là vòng tròn Hydra Head. Trong vòng tròn treo một bảng giá nhỏ bốn dòng, các dòng ghi "0", nhãn "tuỳ cấu hình của Head". Ở cửa vòng tròn (chỗ mở và đóng Head) có đồng phí cam của mạng chính, mũi tên chỉ xuống bảng giá lớn.',
		sound='Nền chuyển hợp âm; tiếng cửa mở và đóng nhẹ.',
	),
	'13': dict(
		title='TxBuilder tự tính phí — cho lập trình viên',
		board=[
			'// Trong Head',
			'const params = await bridge.getProtocolParameters()',
			'new TxBuilder({ isHydra: true, params })',
			'// Mạng chính, có script',
			'new TxBuilder({ params, evaluator })',
			"  .setMinFee('200000')",
			'  .complete()',
			CODE_LABEL,
		],
		lines=[
			'Phần này dành cho lập trình viên. Với hydra-sdk, bạn không phải tự cộng bốn dòng phí.',
			'Khi gọi lệnh hoàn tất, TxBuilder tự tính phí từ bảng tham số mà bạn đưa vào.',
			'Trong Head, bạn lấy bảng tham số từ chính Head qua cầu nối Hydra, rồi đưa vào TxBuilder.',
			'Bạn có thể đặt mức sàn cho phí. Nếu cấp thêm bộ chạy thử, TxBuilder chạy script trước để tính phí cho đúng.',
		],
		screen='Hai khối code phấn chồng lên nhau, từng dòng hiện theo lời đọc. Khối trên có vòng tròn Head nhỏ bên cạnh; dòng `getProtocolParameters()` có mũi tên kéo bảng giá nhỏ của Head vào `params`. Khối dưới có ổ khoá bánh răng nhỏ cạnh `evaluator`. Góc trên: nhãn "@hydra-sdk/transaction · @hydra-sdk/bridge". Góc dưới: "Code rút gọn, bản đầy đủ ở hydrasdk.com", không đọc.',
		sound='Tiếng gõ phấn nhanh theo từng dòng code; nốt chuông khi `.complete()` viết xong.',
	),
	'14': dict(
		title='Tách phí thành từng dòng — cho lập trình viên',
		board=[
			'ĐANG HOÀN THIỆN',
			'FeeUtils.calculateTxFee(txHex, { exUnits, resolvedUtxos })',
			'// → { fee, sizeFee, scriptFee, refScriptFee,',
			'//      txBytes, signerCount }',
			CODE_LABEL,
		],
		lines=[
			'Gói core của hydra-sdk đang có thêm một hàm tính phí, tách phí thành đúng từng dòng của bảng giá.',
			'Nó trả về phần kích thước, phần script, phần script tham chiếu, kèm số byte và số người ký.',
			'Hàm này đang được hoàn thiện, chưa có trong bản phát hành, nên trên bảng có nhãn đi kèm.',
		],
		screen='Nhãn lớn "ĐANG HOÀN THIỆN" viết phấn ở góc trên, khoanh khung. Dòng code `FeeUtils.calculateTxFee(…)` viết dần; kết quả trả về hiện thành bốn ô, mỗi ô nối bằng mũi tên về đúng dòng tương ứng của bảng giá (sizeFee → dòng 1 và 2, scriptFee → dòng 3, refScriptFee → dòng 4). Nhãn nhỏ "@hydra-sdk/core". Cảnh viết độc lập, bỏ được nếu chủ sản phẩm chọn phương án khác.',
		sound='Tiếng gõ phấn; bốn tiếng "tick" khi bốn mũi tên nối về bảng giá.',
	),
	'15': dict(
		title='Tóm tắt và lời kết',
		board=['1. Bảng giá: cố định + theo byte, thêm script khi có', '2. Biết phí trước khi gửi', '3. Trong Head: tuỳ cấu hình', 'hydrasdk.com', 'Thực hiện cùng VTechcom Labs'],
		lines=[
			'Tóm lại, qua tập này bạn chỉ cần nhớ ba ý chính.',
			'Thứ nhất, phí đọc từ bảng giá chung, gồm phần cố định, phần theo byte, và phần script khi có.',
			'Thứ hai, mọi thứ để tính phí đều có sẵn, nên ta biết phí trước khi bấm gửi.',
			'Thứ ba, trong một Hydra Head, phí do cấu hình của chính Head đó quyết định.',
			'Bạn có thể xem thêm tài liệu và ví dụ về TxBuilder tại hydrasdk.com.',
		],
		screen='Ba ý viết lần lượt, mỗi ý kèm biểu tượng màu nhấn của nó (bảng giá có đồng phí cam, laptop chạy thử, vòng tròn Head). Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" kèm logo ở góc dưới phải, không đọc thành lời.',
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
