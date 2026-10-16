"""Tập 1 — UTxO là gì? Nguồn duy nhất cho hình, giọng và bảng duyệt.

Chạy `python script.py` để xuất lại kich-ban.md.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'shared'))
import lexicon  # noqa: E402

# Mỗi cảnh: board = chữ được viết lên bảng (không phải phụ đề),
# lines = lời đọc (mỗi phần tử là một clip giọng), screen = hình, sound = âm thanh.
SCRIPT = {
	'01': dict(
		title='Mở đầu',
		board=['Tiền của bạn nằm ở đâu?'],
		lines=[
			'Bạn chuyển khoản thì số dư của bạn giảm, còn số dư người nhận thì tăng lên.',
			'Nhưng trên Bitcoin hay Cardano lại không có ô số dư nào như vậy.',
			'Vậy thì tiền của bạn thực sự nằm ở đâu? Câu trả lời nằm ở một khái niệm tên là UTxO.',
		],
		screen='Hai ô số dư vẽ phấn, mũi tên chuyển tiền, số đổi. Rồi hai ô bị lau đi, còn dấu hỏi lớn. Chữ "UTxO" viết chậm ở giữa bảng.',
		sound='Nền vào dần. Tiếng phấn khi viết. Tiếng lau bảng khi ô số dư biến mất.',
	),
	'02': dict(
		title='Sổ cái ngân hàng',
		board=['Sổ cái', 'An: 10', 'Bình: 0', 'Mô hình tài khoản'],
		lines=[
			'Ngân hàng giữ một cuốn sổ cái. Mỗi người một dòng, chỉ ghi đúng một con số là số dư.',
			'An muốn chuyển năm đồng cho Bình. Ngân hàng kiểm tra xem An có đủ tiền không, rồi trừ bên An và cộng bên Bình.',
			'Cách ghi chép này gọi là mô hình tài khoản. Ethereum cũng dùng cách tương tự.',
		],
		screen='Cuốn sổ hai dòng. Mũi tên "An → Bình: 5". Số 10 gạch thành 5, số 0 gạch thành 5. Nhãn "Mô hình tài khoản" gạch chân.',
		sound='Tiếng phấn gạch số.',
	),
	'03': dict(
		title='Lỗ hổng: gửi lại lệnh cũ',
		board=['An → Bình: 5', '×2  ×3  ×4', 'Đánh số lệnh: 1, 2, 3…'],
		lines=[
			'Nhưng trên một mạng công khai, cách này có lỗ hổng. Ai cũng thấy lệnh An chuyển năm đồng cho Bình.',
			'Kẻ xấu có thể chép lại nguyên lệnh đó rồi gửi đi nhiều lần, khiến tiền của An bị trừ mãi.',
			'Ethereum chặn chuyện này bằng cách đếm số thứ tự giao dịch của từng tài khoản, và cả mạng phải ghi nhớ con số đó.',
			'Bitcoin thì chọn một lối đi khác, lạ hơn, nhưng gọn gàng hơn.',
		],
		screen='Lệnh "An → Bình: 5" bị một bàn tay phấn sao chép thành nhiều bản; số dư An tụt dần 10 → 5 → 0. Rồi mỗi lệnh được gắn số thứ tự nhỏ ở góc.',
		sound='Tiếng "tick" lặp nhanh mỗi lần lệnh bị gửi lại; một tiếng trầm khi số dư về 0.',
	),
	'04': dict(
		title='Ví tiền mặt',
		board=['50k', '20k', '10k', '= 80k'],
		lines=[
			'Hãy nghĩ đến chiếc ví tiền mặt của bạn. Trong ví không có số dư nào cả.',
			'Chỉ có những tờ tiền riêng lẻ, như năm mươi nghìn, hai mươi nghìn và mười nghìn.',
			'Muốn biết mình có bao nhiêu, bạn phải đếm từng tờ rồi cộng lại, được tám mươi nghìn.',
			'Bitcoin và Cardano vận hành đúng theo cách của chiếc ví này.',
		],
		screen='Chiếc ví vẽ phấn mở ra, ba tờ tiền bay ra xếp hàng. Phép cộng viết dưới. Màu nhấn cố định cho "món tiền" (vàng phấn) dùng suốt video.',
		sound='Một tiếng "tick" nhẹ mỗi khi một tờ tiền hiện ra.',
	),
	'05': dict(
		title='Mua cà phê',
		board=['Cà phê: 30k', 'Đưa: 50k', 'Thối: 20k'],
		lines=[
			'Giả sử bạn mua một ly cà phê giá ba mươi nghìn.',
			'Bạn không thể xé tờ năm mươi nghìn để lấy một phần, mà phải đưa nguyên cả tờ.',
			'Người bán giữ lại ba mươi nghìn, rồi thối lại cho bạn hai mươi nghìn.',
			'Tờ năm mươi nghìn cũ đã được tiêu. Thay vào đó là hai tờ mới, một cho người bán, một quay về ví bạn.',
		],
		screen='Ly cà phê. Tờ 50k đi sang phải, bị gạch chéo; tách thành hai tờ 30k (sang người bán) và 20k (quay về ví).',
		sound='Tiếng gạch phấn khi tờ 50k bị tiêu; hai tiếng "tick" khi hai tờ mới sinh ra.',
	),
	'06': dict(
		title='Gọi tên: UTxO',
		board=['UTxO', 'Unspent Transaction Output', '= món tiền chưa tiêu'],
		lines=[
			'Trên blockchain, mỗi tờ tiền như vậy được gọi là một UTxO.',
			'Đây là chữ viết tắt của một cụm từ tiếng Anh khá dài và khó nhớ.',
			'Dịch từng chữ thì hơi rối, nên cứ hiểu đơn giản thế này, một UTxO là một món tiền chưa tiêu.',
			'Mỗi món do một giao dịch tạo ra, mang một số lượng riêng, và không có hai món nào giống nhau.',
		],
		screen='Tờ tiền biến thành một ô vuông bo góc nhẹ có nhãn "UTxO". Cụm tiếng Anh viết nhỏ bên dưới, ba chữ cái đầu U, Tx, O được khoanh. Vài ô khác số lượng xếp cạnh nhau.',
		sound='Tiếng phấn; một nốt chuông nhẹ khi chữ "món tiền chưa tiêu" viết xong.',
	),
	'07': dict(
		title='Ổ khoá và chìa khoá',
		board=['Ổ khoá', 'Chìa khoá tạo chữ ký', 'Ví giữ chìa, không giữ tiền'],
		lines=[
			'Mỗi món tiền chưa tiêu đều được khoá bằng một điều kiện nào đó.',
			'Điều kiện thường gặp nhất là chỉ người tạo ra được chữ ký của chủ nhân mới mở được khoá.',
			'Vì vậy, có tiền trên blockchain không có nghĩa là có một con số trong sổ.',
			'Có tiền nghĩa là bạn giữ được chìa khoá mở những món tiền chưa tiêu.',
			'Nói gọn lại, ví của bạn không chứa tiền. Ví chỉ giữ chìa khoá.',
		],
		screen='Mỗi ô UTxO có một ổ khoá nhỏ vẽ phấn. Một chiếc chìa (chữ ký) tra vào, ổ bật mở. Cuối cảnh: chiếc ví chỉ đựng một chùm chìa.',
		sound='Tiếng "cạch" nhỏ khi ổ khoá mở.',
	),
	'08': dict(
		title='Một giao dịch',
		board=['Đầu vào', 'Giao dịch', 'Đầu ra', 'Vào = Ra + Phí'],
		lines=[
			'Mỗi giao dịch có hai phía, gọi là đầu vào và đầu ra.',
			'Đầu vào chỉ rõ những món tiền chưa tiêu mà bạn đem ra dùng, kèm chữ ký để mở khoá.',
			'Đầu ra là những món tiền mới, mỗi món có ổ khoá riêng, gồm phần cho người nhận và tiền thối cho chính bạn.',
			'Một giao dịch có thể gom nhiều món đầu vào lại, rồi chia thành nhiều món đầu ra.',
			'Tổng đầu vào luôn bằng tổng đầu ra cộng với một khoản phí nhỏ trả cho mạng lưới.',
		],
		screen='Sơ đồ ba khối: các ô UTxO bên trái (có ổ khoá đang mở) đi vào khối "Giao dịch", các ô mới đi ra bên phải, mỗi ô mang ổ khoá mới đóng. Phương trình viết dưới.',
		sound='Tiếng gạch khi ô đầu vào bị tiêu; "tick" khi ô đầu ra sinh ra.',
	),
	'09': dict(
		title='Không thể tiêu hai lần',
		board=['Còn trong danh sách?', 'Mở được khoá?', 'Hợp lệ', 'Từ chối'],
		lines=[
			'Món tiền nào đã tiêu rồi thì bị gạch khỏi danh sách, và không bao giờ tiêu lại được.',
			'Mạng lưới kiểm tra hai điều. Thứ nhất, món tiền có còn trong danh sách chưa tiêu không?',
			'Thứ hai, người tiêu có mở được ổ khoá hay không. Đủ cả hai thì giao dịch hợp lệ, thiếu một điều là bị từ chối.',
			'Kẻ xấu chép lại giao dịch cũ cũng vô ích, vì các món tiền trong đó đã bị gạch. Không cần đánh số lệnh.',
		],
		screen='Danh sách các ô UTxO, một ô bị gạch. Hai dấu tích lần lượt hiện. Bản sao của giao dịch cũ thử dùng lại ô đã gạch thì bị đóng dấu "Từ chối". Gợi lại hình lệnh bị sao chép ở cảnh 03.',
		sound='Hai tiếng "tick" cho dấu tích; một tiếng trầm ngắn khi bị từ chối.',
	),
	'10': dict(
		title='Số dư là một phép cộng',
		board=['2009', 'Danh sách món tiền chưa tiêu', 'Số dư = cộng lại'],
		lines=[
			'Bitcoin đã dùng mô hình này từ năm hai nghìn lẻ chín.',
			'Mỗi máy trong mạng đều giữ một danh sách mọi món tiền chưa tiêu, và cập nhật mỗi khi có khối mới.',
			'Mạng lưới không hề ghi số dư của bạn. Số dư mà ví hiển thị thực ra chỉ là một phép cộng.',
			'Ví tìm mọi món tiền chưa tiêu mà nó giữ được chìa khoá, rồi cộng tất cả lại.',
			'Còn tài sản thì di chuyển theo cách tiêu món cũ, tạo ra món mới, và nối thành một chuỗi giao dịch dài.',
		],
		screen='Camera lùi xa: rất nhiều ô UTxO rải khắp bảng. Các ô có ổ khoá khớp với chùm chìa của ví sáng lên và gom lại thành một con số. Cuối cảnh: một chuỗi giao dịch nối dài ngang bảng.',
		sound='Chuỗi "tick" nối nhau theo nhịp khi chuỗi giao dịch kéo dài.',
	),
	'11': dict(
		title='Cardano: UTxO mở rộng',
		board=['eUTxO', 'ADA', 'Token', 'Datum'],
		lines=[
			'Cardano giữ nguyên ý tưởng đó, và mở rộng thêm một bước.',
			'Mô hình này có tên là eUTxO, nghĩa là UTxO mở rộng.',
			'Trên Cardano, một món tiền không chỉ chứa ADA mà còn chứa được nhiều loại token, như một phong bì đựng nhiều loại tiền.',
			'Ổ khoá cũng có thể là một hợp đồng thông minh. Nó đọc mẩu dữ liệu đi kèm, gọi là datum, rồi quyết định mở hay không.',
		],
		screen='Ô UTxO mở ra như phong bì: đồng ADA, vài token hình khác nhau, và một tờ ghi chú nhỏ (datum) gắn vào ổ khoá có bánh răng (hợp đồng thông minh).',
		sound='Tiếng giấy mở phong bì (nhiễu lọc ngắn); tiếng bánh răng nhỏ.',
	),
	'12': dict(
		title='Tên riêng của từng món',
		board=['a1b2…f9', '#0', '#1', 'a1b2…f9#0'],
		lines=[
			'Giữa hàng triệu món tiền như vậy, làm sao biết chính xác là món nào?',
			'Mỗi giao dịch có một mã riêng dài sáu mươi tư ký tự, gọi là mã giao dịch.',
			'Mã này giống dấu vân tay của nội dung giao dịch, chỉ cần sửa một chữ là mã đổi hẳn.',
			'Các món tiền mà giao dịch tạo ra được đánh số thứ tự, bắt đầu từ số không.',
			'Ghép mã giao dịch với dấu thăng và số thứ tự, ta sẽ có tên riêng của từng món tiền.',
		],
		screen='Khối giao dịch mang mã rút gọn "a1b2…f9". Sửa một chữ trong giao dịch thì mã đổi hẳn thành chuỗi khác. Hai ô đầu ra được đánh "#0", "#1". Mã và số trượt lại ghép thành "a1b2…f9#0".',
		sound='Tiếng phấn; "tick" khi hai phần ghép vào nhau.',
	),
	'13': dict(
		title='UTxO Object — cho lập trình viên',
		board=[
			'{',
			'  "a1b2…f9#0": {',
			'    "address": "addr_test1…",',
			'    "value": { "lovelace": 50000000 },',
			'    "datum": null,',
			'    "inlineDatum": null,',
			'    "referenceScript": null',
			'  }',
			'}',
			'1 ADA = 1.000.000 lovelace',
		],
		lines=[
			'Phần này dành cho lập trình viên. Đây là cách Hydra và hydra-sdk ghi lại các món tiền, dưới dạng đối tượng JSON.',
			'Mỗi khoá là tên riêng của một món tiền, gồm mã giao dịch, dấu thăng và số thứ tự.',
			'Bên trong là địa chỉ, tức ổ khoá của món tiền, và giá trị của nó.',
			'Giá trị luôn là một số nguyên lovelace, một triệu lovelace bằng một ADA. Token thì ghi theo mã chính sách và tên token.',
			'Các trường datum và script dành cho hợp đồng thông minh. Với ví thông thường, hai trường này để trống.',
			'Trong hydra-sdk, kiểu dữ liệu này có tên là UTxO Object.',
		],
		screen='Đoạn JSON viết tay bằng phấn, từng dòng hiện theo lời đọc; khoá được khoanh, "address" có biểu tượng ổ khoá nhỏ, "value" gạch chân, các trường null mờ đi. Góc trên: nhãn nhỏ "@hydra-sdk/core · UTxOObject".',
		sound='Tiếng gõ phấn nhanh theo từng dòng code.',
	),
	'14': dict(
		title='Ly cà phê bằng dữ liệu',
		board=['Trước', 'Sau', '#0: 30 ADA → người bán', '#1: 19,83 ADA → ví bạn', 'Phí: 0,17 ADA'],
		lines=[
			'Bây giờ ta hãy xem lại ly cà phê, lần này bằng dữ liệu.',
			'Trước giao dịch, ví bạn chỉ có một món duy nhất, mang số thứ tự không, ghi năm mươi ADA.',
			'Sau giao dịch, mục đó biến mất. Thay vào đó là hai mục mới, đều mang mã của giao dịch vừa rồi.',
			'Mục số không ghi ba mươi ADA gửi cho người bán. Mục số một là tiền thối về ví bạn.',
			'Tiền thối là mười chín phẩy tám mươi ba ADA, vì đã trừ phí giao dịch.',
		],
		screen='Hai cột "Trước" và "Sau". Cột trước: một mục JSON 50 ADA, bị gạch. Cột sau: hai mục với mã giao dịch mới, #0 và #1. Ghi chú nhỏ "số liệu minh hoạ".',
		sound='Tiếng gạch; hai tiếng "tick".',
	),
	'15': dict(
		title='Cái giá của mô hình UTxO',
		board=['Chọn món', 'Tạo tiền thối', 'TxBuilder'],
		lines=[
			'Thế nhưng mô hình này cũng có một cái giá của nó.',
			'Bạn không thể chỉ nói là trả ba mươi ADA, mà phải chọn đủ món tiền để trả, rồi tạo món tiền thối cho đúng.',
			'Công việc này thường do ví hoặc bộ dựng giao dịch đảm nhận.',
			'Với hydra-sdk, bạn chỉ cần đưa vào danh sách món tiền và địa chỉ nhận tiền thối, phần còn lại bộ dựng lo.',
		],
		screen='Một đống ô UTxO đủ số lượng; bàn tay phấn nhặt từng ô cho đủ 30 ADA, rồi vẽ ô tiền thối. Cuối cảnh: khối nhỏ "TxBuilder" làm thay bàn tay. Nhãn nhỏ "@hydra-sdk/transaction".',
		sound='"Tick" mỗi lần nhặt một ô; nốt chuông khi TxBuilder làm xong.',
	),
	'16': dict(
		title='Cầu nối sang Hydra',
		board=['Cardano (lớp 1)', 'Hydra Head (lớp 2)', 'Cùng mô hình UTxO'],
		lines=[
			'Vì sao cách ghi này quan trọng? Hydra là giải pháp lớp hai của Cardano, và dùng đúng mô hình UTxO như mạng chính.',
			'Khi một nhóm người mở một Hydra Head, các món tiền chưa tiêu được đưa vào bên trong.',
			'Ở trong đó, chúng vẫn được tiêu và sinh ra món mới theo đúng quy tắc vừa rồi.',
			'Hiểu UTxO là bạn đã có nền tảng để hiểu Hydra. Đó cũng là chủ đề của tập sau.',
		],
		screen='Đường kẻ ngang: dưới là Cardano, trên là một vòng tròn "Hydra Head". Vài ô UTxO đi lên vào vòng tròn, bên trong tiếp tục tách/ghép.',
		sound='Nền chuyển hợp âm sang phần kết.',
	),
	'17': dict(
		title='Tóm tắt và lời kết',
		board=['1. Không có ô số dư, chỉ có UTxO', '2. Tiêu trọn món cũ, sinh món mới', '3. txHash#index → UTxO Object', 'hydrasdk.com', 'Thực hiện cùng VTechcom Labs'],
		lines=[
			'Tóm lại, qua tập này bạn chỉ cần nhớ ba ý chính.',
			'Thứ nhất, không có ô số dư nào cả, chỉ có những món tiền chưa tiêu, mỗi món một ổ khoá.',
			'Thứ hai, mỗi giao dịch tiêu trọn các món cũ, rồi sinh ra món mới, kể cả tiền thối.',
			'Thứ ba, mỗi món có một tên riêng, và hydra-sdk ghi chúng bằng UTxO Object.',
			'Bạn có thể xem thêm tài liệu và ví dụ tại hydrasdk.com.',
		],
		screen='Ba ý viết lần lượt. Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" kèm logo ở góc dưới phải, không đọc thành lời.',
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
