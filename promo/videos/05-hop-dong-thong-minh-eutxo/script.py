"""Tập 5 — Hợp đồng thông minh trên eUTxO: ổ khoá biết suy nghĩ. Nguồn duy nhất cho hình, giọng và bảng duyệt.

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
		board=['Ổ khoá biết suy nghĩ?'],
		lines=[
			'Ở tập một, ta đã thấy mỗi món tiền chưa tiêu đều mang theo một ổ khoá.',
			'Thường thì ổ khoá ấy chỉ hỏi đúng một câu, đây có phải chữ ký của chủ hay không.',
			'Nhưng trên Cardano, ổ khoá còn làm được nhiều hơn. Nó biết đọc, biết tính, rồi tự quyết định.',
			'Hôm nay ta sẽ mở chiếc ổ khoá biết suy nghĩ ấy ra, xem bên trong có những gì.',
		],
		screen='Gợi lại hình cuối tập 1: ô UTxO vàng phấn có ổ khoá bánh răng. Camera tiến lại gần ổ khoá, bánh răng bắt đầu quay. Chữ "Ổ khoá biết suy nghĩ?" viết chậm phía trên.',
		sound='Nền vào dần. Tiếng phấn. Tiếng bánh răng nhỏ khi ổ khoá bắt đầu quay.',
	),
	'02': dict(
		title='Chiếc két chung',
		board=['An · Bình · Chi', 'Luật 1: 2 trong 3 người ký', 'Luật 2: mở từ 01/01 năm sau'],
		lines=[
			'Hãy hình dung ba anh em An, Bình và Chi cùng góp tiền vào một chiếc két chung.',
			'Họ đặt ra hai luật. Thứ nhất, phải có ít nhất hai trong ba người đồng ý thì két mới mở.',
			'Thứ hai, két chỉ được mở từ ngày một tháng một năm sau trở đi.',
			'Ngoài đời, muốn giữ đúng hai luật này thì cần một người giữ két đáng tin. Trên blockchain thì sao?',
		],
		screen='Chiếc két vẽ phấn ở giữa, ba hình người nhỏ mang tên An, Bình, Chi. Hai luật viết lần lượt bên phải. Cuối cảnh: một hình người giữ két hiện ra rồi bị gạch, thay bằng dấu hỏi.',
		sound='Tiếng phấn; tiếng gạch khi người giữ két bị gạch.',
	),
	'03': dict(
		title='Ổ khoá đơn giản và ổ khoá biết suy nghĩ',
		board=['Native script', 'đếm chữ ký · so thời gian', 'Hợp đồng thông minh = chương trình canh tiền'],
		lines=[
			'Với hai luật đơn giản như vậy, Cardano có sẵn một loại ổ khoá ghép được mà không cần viết chương trình.',
			'Loại ổ này chỉ biết vài việc như đếm chữ ký và so thời gian, nhưng ghép lại thì đủ cho chiếc két.',
			'Còn khi luật phức tạp hơn, như mỗi người được rút bao nhiêu, ta cần một ổ khoá thật sự biết suy nghĩ.',
			'Đó là hợp đồng thông minh, một chương trình nhỏ đứng canh món tiền, gọi là script.',
		],
		screen='Bên trái: ổ khoá ghép từ vài khối nhỏ (chữ ký ×3, "≥ 2", đồng hồ cát), nhãn nhỏ "Native script". Bên phải: ổ khoá bánh răng lớn, nhãn "Hợp đồng thông minh". Mũi tên từ luật phức tạp chỉ sang ổ bánh răng.',
		sound='Tiếng "tick" khi từng khối ghép vào; tiếng bánh răng khi ổ bên phải hiện ra.',
	),
	'04': dict(
		title='Ba thứ đi vào ổ khoá',
		board=['Datum', 'Redeemer', 'Giao dịch', 'Có / Không'],
		lines=[
			'Mỗi lần có người muốn mở món tiền, script nhận vào ba thứ.',
			'Thứ nhất là datum, mẩu dữ liệu được gắn sẵn trên món tiền từ lúc khoá.',
			'Thứ hai là redeemer, thứ mà người muốn mở mang đến và đưa vào.',
			'Thứ ba là chính giao dịch đang muốn tiêu món tiền, với đủ đầu vào, đầu ra và chữ ký.',
			'Từ ba thứ đó, script chỉ trả lời đúng một câu, có hoặc không.',
		],
		screen='Ổ khoá bánh răng ở giữa. Ba mũi tên đi vào từ ba phía: tờ ghi chú xanh lam (datum), tờ đơn hồng (redeemer), khối "Giao dịch" trắng. Phía dưới ổ khoá: hai ô "Có" và "Không".',
		sound='Ba tiếng "tick" khi ba thứ lần lượt đi vào; tiếng bánh răng.',
	),
	'05': dict(
		title='Datum — tờ ghi chú trên cửa két',
		board=['Người ký: An, Bình, Chi', 'Cần: 2 chữ ký', 'Mở từ: 01/01 năm sau'],
		lines=[
			'Quay lại chiếc két, datum giống như một tờ ghi chú dán trên cửa két.',
			'Trên đó ghi tên ba người có quyền ký, số chữ ký cần có là hai, và ngày được mở.',
			'Tờ ghi chú được dán lúc khoá tiền, rồi nằm yên cùng món tiền cho đến khi nó được tiêu.',
			'Nhờ vậy, một ổ khoá có thể canh hàng nghìn chiếc két, mỗi két mang một tờ ghi chú khác nhau.',
		],
		screen='Tờ ghi chú xanh lam dán lên cửa két, ba dòng viết dần. Cuối cảnh: camera lùi xa, nhiều chiếc két cùng một kiểu ổ khoá, mỗi két một tờ ghi chú khác.',
		sound='Tiếng giấy dán; tiếng phấn theo từng dòng.',
	),
	'06': dict(
		title='Redeemer — tờ đơn xin mở',
		board=['Rút theo hạn → 2 chữ ký', 'Huỷ trước hạn → 3 chữ ký'],
		lines=[
			'Còn redeemer là thứ người mở mang đến, giống như tờ đơn nộp kèm khi xin mở két.',
			'Ví dụ, tờ đơn có thể ghi là rút tiền theo hạn, hoặc là huỷ két trước hạn.',
			'Ổ khoá đọc tờ đơn để biết phải áp dụng luật nào. Rút theo hạn cần hai chữ ký, huỷ trước hạn cần đủ cả ba.',
			'Redeemer không phải chìa khoá. Nó chỉ cho ổ khoá biết bạn đang xin điều gì.',
		],
		screen='Tờ đơn hồng đưa vào khe ổ khoá. Hai nhánh đường ray rẽ ra bên trong ổ: "Rút theo hạn" và "Huỷ trước hạn", nhánh được chọn sáng lên.',
		sound='Tiếng giấy trượt vào khe; tiếng "cạch" khi bẻ ghi sang một nhánh.',
	),
	'07': dict(
		title='Bình và Chi mở két',
		board=['Đơn: rút theo hạn', 'Chữ ký: Bình ✓ Chi ✓', 'Hợp lệ từ: 02/01', 'Có'],
		lines=[
			'Giờ Bình và Chi muốn rút tiền. Họ tạo một giao dịch, nộp đơn rút theo hạn, và cả hai cùng ký.',
			'Đầu tiên, script đọc tờ ghi chú, rồi kiểm tra xem giao dịch có đủ hai chữ ký hợp lệ trong danh sách hay không.',
			'Tiếp theo, script xem ngày. Giao dịch này chỉ có hiệu lực từ ngày mồng hai tháng một, tức là đã qua hạn.',
			'Cả hai điều kiện đều đạt, nên script trả lời có, và món tiền được mở ra.',
		],
		screen='Khối giao dịch đi vào ổ khoá mang tờ đơn hồng và hai chữ ký. Bên trong ổ: hai dấu tích lần lượt hiện cạnh "2 chữ ký" và "ngày". Ổ bật mở, món tiền vàng phấn đi ra hai phần cho Bình và Chi. Ghi chú nhỏ "ví dụ minh hoạ".',
		sound='Hai tiếng "tick" cho dấu tích; tiếng "cạch" khi ổ mở; nốt chuông nhẹ.',
	),
	'08': dict(
		title='Ổ khoá không có đồng hồ',
		board=['Script không xem đồng hồ', 'Hợp lệ từ … đến …', 'So với ngày trên tờ ghi chú'],
		lines=[
			'Khoan đã, làm sao ổ khoá biết hôm nay là ngày nào?',
			'Câu trả lời là nó không biết, vì script trên Cardano không được phép xem đồng hồ.',
			'Thay vào đó, mỗi giao dịch tự ghi rằng nó chỉ có hiệu lực trong một khoảng thời gian nhất định.',
			'Mạng lưới chỉ nhận giao dịch khi thời điểm thật nằm trong khoảng đó, nên script chỉ việc so khoảng ấy với ngày trên tờ ghi chú.',
		],
		screen='Một chiếc đồng hồ phấn bên cạnh ổ khoá bị gạch chéo. Trên khối giao dịch hiện một thanh thời gian "từ 02/01 đến 03/01". Thanh này được đặt cạnh tờ ghi chú "Mở từ 01/01" để so.',
		sound='Tiếng tích tắc ngắn rồi tắt khi đồng hồ bị gạch.',
	),
	'09': dict(
		title='Biết trước khi gửi',
		board=['Datum + Redeemer + Giao dịch', 'Chạy thử trên máy bạn', 'Kết quả giống mạng lưới', 'Hỏng → không gửi, không mất phí'],
		lines=[
			'Điều đáng giá nằm ở chỗ này. Thứ mà script nhìn vào chỉ có datum, redeemer và giao dịch, ngoài ra không còn gì khác.',
			'Mà cả ba thứ này đều đã nằm trong tay bạn trước khi bạn bấm gửi.',
			'Vì thế, ví có thể chạy thử ổ khoá ngay trên máy bạn, và kết quả sẽ giống khi mạng lưới chạy.',
			'Ổ không mở thì ví báo ngay. Bạn sửa lại hoặc thôi không gửi, chẳng mất đồng phí nào.',
		],
		screen='Ba thứ (ghi chú, đơn, giao dịch) gom vào một chiếc laptop phấn, bên trong có bản sao ổ khoá chạy thử. Mũi tên nối sang mạng lưới, cùng một ổ khoá cho cùng kết quả. Nhánh "Không": giao dịch quay về, không đi lên mạng.',
		sound='Tiếng bánh răng nhỏ trong laptop; nốt chuông khi hai kết quả khớp nhau.',
	),
	'10': dict(
		title='Còn bất ngờ nào không?',
		board=['Mô hình tài khoản: hỏng vẫn mất phí', 'eUTxO: món tiền đã bị tiêu trước', 'Từ chối ngay, không mất phí'],
		lines=[
			'Ở mô hình tài khoản, giao dịch chạy trên trạng thái chung lúc nó được xử lý, có thể đã khác lúc bạn thử.',
			'Vì thế có lúc giao dịch thất bại mà phí vẫn bị trừ.',
			'Trên Cardano, chỉ còn một tình huống bất ngờ, đó là có người đã tiêu món tiền ấy trước bạn.',
			'Khi đó giao dịch bị từ chối ngay ở vòng kiểm tra đầu tiên, script không cần chạy, và bạn cũng không mất phí.',
		],
		screen='Bên trái: sổ cái tài khoản, giao dịch đi vào thì số trong sổ đã đổi, giao dịch hỏng nhưng vẫn rơi một đồng phí. Bên phải: hai giao dịch cùng nhắm một món tiền, một cái tới trước, cái sau bị đóng dấu "Từ chối" trước khi tới ổ khoá, đồng phí vẫn ở lại ví.',
		sound='Tiếng đồng xu rơi ở bên trái; một tiếng trầm ngắn khi bị từ chối ở bên phải.',
	),
	'11': dict(
		title='DatumUtils — cho lập trình viên',
		board=[
			'import { DatumUtils, RedeemerUtils } from \'@hydra-sdk/core\'',
			'const datum = DatumUtils.mkConstr(0, [',
			'  DatumUtils.mkBytesList([an, binh, chi]),',
			'  DatumUtils.mkInt(2),',
			'  DatumUtils.mkInt(unlockAt)',
			'])',
			'const redeemer = RedeemerUtils.mkSpendRedeemer(',
			'  DatumUtils.mkConstr(0, [])  // Rút theo hạn',
			')',
		],
		lines=[
			'Phần này dành cho lập trình viên. Trên Cardano, datum và redeemer dùng chung một kiểu dữ liệu, gọi là Plutus Data.',
			'Trong gói core của hydra-sdk, DatumUtils giúp bạn dựng kiểu dữ liệu này từ số, chuỗi byte và danh sách.',
			'Ví dụ, tờ ghi chú của chiếc két là một cấu trúc gồm ba mã khoá, con số hai và mốc thời gian được mở.',
			'Redeemer cũng dựng bằng DatumUtils, rồi RedeemerUtils gói nó lại để gắn vào giao dịch.',
		],
		screen='Đoạn code viết tay bằng phấn, từng dòng hiện theo lời đọc. Dòng datum có tờ ghi chú xanh lam nhỏ bên cạnh, dòng redeemer có tờ đơn hồng. Góc trên: nhãn nhỏ "@hydra-sdk/core". Code minh hoạ, cấu trúc datum tuỳ hợp đồng.',
		sound='Tiếng gõ phấn nhanh theo từng dòng code.',
	),
	'12': dict(
		title='PlutusUtils và TxBuilder — cho lập trình viên',
		board=[
			'PlutusUtils.applyParamsToScript(…)',
			'PlutusUtils.validatorToAddress(…)',
			'.txInScript(…)',
			'.txInInlineDatum(…)',
			'.txInRedeemerValue(…)',
			'.txInCollateral(…)',
			'.invalidBefore(slot)',
		],
		lines=[
			'Còn PlutusUtils làm việc với chính chiếc ổ khoá đã được biên dịch.',
			'Nó gắn tham số vào script, tính mã băm của script, và suy ra địa chỉ để bạn gửi tiền vào khoá.',
			'Khi mở khoá, TxBuilder nhận script, datum, redeemer, và khoảng thời gian có hiệu lực của giao dịch.',
			'Nó còn cần thêm một món tiền thế chấp, phòng khi script chạy lỗi sau khi giao dịch đã được gửi đi.',
			'Nếu bạn cấp cho nó một bộ chạy thử, TxBuilder sẽ chạy script trước để tính phí cho chính xác.',
		],
		screen='Hai dòng PlutusUtils bên trái, mũi tên từ ổ khoá bánh răng ra một địa chỉ "addr_test1…". Bên phải chuỗi phương thức TxBuilder viết dần, mỗi dòng gắn biểu tượng tương ứng (bánh răng, ghi chú, đơn, đồng xu thế chấp, thanh thời gian). Nhãn nhỏ "@hydra-sdk/core · @hydra-sdk/transaction".',
		sound='Tiếng gõ phấn; nốt chuông khi chuỗi phương thức viết xong.',
	),
	'13': dict(
		title='Cùng ổ khoá trong Hydra Head',
		board=['Cardano (lớp 1)', 'Hydra Head (lớp 2)', 'Cùng script · cùng datum · cùng redeemer', 'Luật thời gian: kiểm tra lại'],
		lines=[
			'Cũng chiếc ổ khoá ấy có thể chạy trong một Hydra Head, với cùng datum và cùng redeemer.',
			'Bạn không phải sửa dòng nào trong script, vì Hydra dùng chung mô hình eUTxO với mạng chính.',
			'Riêng những luật dựa vào thời gian thì nên kiểm tra kỹ, vì mốc thời gian trong Hydra Head được tính theo cách riêng.',
		],
		screen='Đường kẻ ngang: dưới là Cardano, trên là vòng tròn "Hydra Head". Chiếc két với ổ khoá bánh răng đi lên vào vòng tròn, vẫn nguyên tờ ghi chú. Thanh thời gian bên cạnh có dấu chấm than nhỏ.',
		sound='Nền chuyển hợp âm sang phần kết.',
	),
	'14': dict(
		title='Tóm tắt và lời kết',
		board=['1. Datum: ghi chú trên món tiền', '2. Redeemer: đơn của người mở', '3. Script: luật, chạy thử được trước', 'hydrasdk.com', 'Thực hiện cùng VTechcom Labs'],
		lines=[
			'Tóm lại, qua tập này bạn chỉ cần nhớ ba ý chính.',
			'Thứ nhất, datum là tờ ghi chú gắn trên món tiền, nói luật của nó áp dụng cho ai và khi nào.',
			'Thứ hai, redeemer là tờ đơn của người muốn mở, cho ổ khoá biết họ đang xin điều gì.',
			'Thứ ba, script là luật quyết định mở hay không, và bạn chạy thử được trước khi gửi.',
			'Bạn có thể xem thêm tài liệu và ví dụ về hợp đồng thông minh tại hydrasdk.com.',
		],
		screen='Ba ý viết lần lượt, mỗi ý kèm biểu tượng màu nhấn của nó. Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" kèm logo ở góc dưới phải, không đọc thành lời.',
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
