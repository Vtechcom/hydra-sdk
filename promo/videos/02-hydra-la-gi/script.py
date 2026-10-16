"""Tập 2 — Hydra là gì? Nguồn duy nhất cho hình, giọng và bảng duyệt.

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
		board=['An', 'Bình', 'Chi', 'Dũng', '+2 ADA', 'Đang chờ xác nhận…', '?'],
		lines=[
			'Bốn người bạn chơi một trò chơi trên mạng, cứ mỗi ván, người thua trả cho người thắng vài ADA.',
			'Một buổi tối họ chơi cả trăm ván, tức là cả trăm lần chuyển tiền cho nhau.',
			'Và lần nào cũng phải chờ cả mạng Cardano xác nhận xong mới tính.',
			'Chuyện riêng của bốn người, sao lại phải chờ cả thế giới?',
			'Câu trả lời cho câu hỏi đó có một cái tên, là Hydra.',
		],
		screen='Bốn hình người vẽ phấn ngồi quanh một bàn chơi. Mỗi ván, một đồng ADA vàng phấn bay từ người này sang người kia, rồi đứng khựng lại với dòng "Đang chờ xác nhận…" và một đồng hồ cát nhỏ. Lặp nhanh vài lần, đồng hồ cát chồng lên nhau. Cuối cảnh: dấu hỏi lớn, rồi chữ "Hydra" viết chậm ở giữa bảng.',
		sound='Nền vào dần. Tiếng "tick" mỗi lần đồng tiền bay; tiếng đồng hồ tích tắc chậm khi chờ.',
	),
	'02': dict(
		title='Cuốn sổ chung',
		board=['Sổ chung', 'Khối mới', '~20 giây / khối'],
		lines=[
			'Ở tập trước, ta đã biết Cardano ghi lại mọi món tiền chưa tiêu trong một cuốn sổ chung.',
			'Cuốn sổ ấy không nằm ở một chỗ, mà được rất nhiều máy tính khắp thế giới cùng giữ một bản.',
			'Muốn ghi thêm một giao dịch, nó phải được gom vào một khối mới, rồi cả mạng cùng chấp nhận khối đó.',
			'Trung bình khoảng hai mươi giây mới có một khối. Ai muốn ghi sổ cũng phải xếp hàng chờ.',
			'Cách làm này không nhanh, nhưng nhờ vậy mà không ai sửa được sổ một mình.',
		],
		screen='Một cuốn sổ lớn màu trắng phấn ở giữa, quanh nó là nhiều máy tính nhỏ, mỗi máy giữ một bản của cùng cuốn sổ. Các giao dịch xếp hàng thành một hàng dài trước cửa; cứ một nhịp lại có một "khối" được đóng vào sổ. Nhãn nhỏ "~20 giây / khối" ở góc.',
		sound='Tiếng "cộp" trầm mỗi khi một khối được đóng vào sổ.',
	),
	'03': dict(
		title='Chuyện nhỏ trên sổ lớn',
		board=['Ván 47', 'Chờ khối', 'Phí', 'Cuối buổi: mỗi người còn bao nhiêu?'],
		lines=[
			'Giờ quay lại bốn người bạn. Mỗi ván chơi là một giao dịch phải ghi vào sổ chung.',
			'Mỗi lần như vậy, họ phải chờ khối mới và trả một khoản phí cho mạng lưới.',
			'Trong khi đó, cả mạng chẳng cần biết ván thứ bốn mươi bảy ai thắng ai thua.',
			'Điều thế giới cần biết chỉ là cuối buổi, mỗi người còn lại bao nhiêu tiền.',
		],
		screen='Hàng giao dịch trước cuốn sổ lớn dài thêm, toàn là những tờ ghi "Ván 1", "Ván 2"… của bốn người, mỗi tờ kèm một đồng phí nhỏ. Tờ "Ván 47" được phóng to rồi mờ đi. Cuối cảnh: mọi tờ gom lại thành một dòng duy nhất "Cuối buổi: mỗi người còn bao nhiêu?".',
		sound='Chuỗi "tick" dày dần; một nốt chuông khi các tờ gom lại thành một dòng.',
	),
	'04': dict(
		title='Phòng họp riêng',
		board=['Phòng họp riêng', 'Sổ nhỏ', 'Kết quả cuối cùng → Sổ chung'],
		lines=[
			'Hãy hình dung thế này. Thay vì ra sổ chung mỗi lần, bốn người rủ nhau vào một phòng họp riêng.',
			'Trong phòng có một cuốn sổ nhỏ, chỉ bốn người cùng ghi, và ai cũng giữ một bản.',
			'Ván nào xong thì ghi ngay vào sổ nhỏ, không phải xếp hàng chờ ai ở bên ngoài.',
			'Đến khi chơi xong, cả nhóm mới mở cửa, đem kết quả cuối cùng ra ghi vào sổ chung.',
		],
		screen='Một căn phòng vẽ phấn màu xanh (màu nhấn của Hydra Head suốt video) mọc lên cạnh cuốn sổ lớn. Bốn người bước vào, cửa đóng. Bên trong, một cuốn sổ nhỏ được ghi liên tục, mỗi người cầm một bản. Cuối cảnh: cửa mở, một tờ giấy duy nhất đi ra và được dán vào sổ chung.',
		sound='Tiếng cửa đóng nhẹ; bên trong là tiếng phấn ghi nhanh; tiếng cửa mở khi đem kết quả ra.',
	),
	'05': dict(
		title='Lớp một và lớp hai',
		board=['Lớp 1: Cardano', 'Lớp 2: Hydra', 'Hydra Head'],
		lines=[
			'Hydra làm đúng như vậy. Người ta gọi mạng chính Cardano là lớp một, nơi giữ cuốn sổ chung mà ai cũng tin.',
			'Những hệ thống chạy phía trên, xử lý giao dịch ở bên ngoài sổ chung, được gọi là lớp hai.',
			'Hydra là một giải pháp lớp hai của Cardano, và mỗi căn phòng họp riêng được gọi là một Hydra Head.',
			'Tên Hydra lấy từ con rắn nhiều đầu trong thần thoại Hy Lạp. Mỗi Head là một cái đầu.',
			'Nhiều nhóm có thể mở nhiều Head cùng lúc, mỗi nhóm một phòng, không ai chen vào việc của ai.',
		],
		screen='Đường kẻ ngang chia bảng: dưới là cuốn sổ lớn "Lớp 1: Cardano", trên là căn phòng xanh "Lớp 2: Hydra". Căn phòng được dán nhãn "Hydra Head". Nét phấn phác nhanh hình con rắn nhiều đầu, mỗi đầu biến thành một căn phòng nhỏ khác nhau, mỗi phòng một nhóm người.',
		sound='Nền chuyển hợp âm sang phần "lớp hai". Một nốt chuông khi nhãn "Hydra Head" viết xong.',
	),
	'06': dict(
		title='Đem tiền vào phòng',
		board=['Khoá trên Cardano', 'Hiện ra trong Head', 'Cùng số lượng, cùng ổ khoá'],
		lines=[
			'Nhưng làm sao để đem tiền vào phòng mà không ai gian lận được?',
			'Mỗi người khoá một số món tiền chưa tiêu của chính họ trên Cardano, dành riêng cho Head.',
			'Ở bên ngoài, những món tiền này bị giữ lại, không ai đem đi tiêu ở chỗ khác được.',
			'Còn bên trong Head, chúng hiện ra như cũ, cùng số lượng và cùng ổ khoá của chủ nhân.',
		],
		screen='Mỗi người đặt vài ô UTxO vàng phấn (ô có ổ khoá nhỏ như tập 1) lên cuốn sổ lớn; một sợi xích phấn quấn quanh các ô đó. Một bản sao của từng ô đi lên căn phòng xanh, giữ nguyên số và ổ khoá.',
		sound='Tiếng xích "lách cách" nhỏ khi các ô bị khoá; "tick" khi ô hiện ra trong phòng.',
	),
	'07': dict(
		title='Bên trong vẫn là UTxO',
		board=['Món tiền chưa tiêu', 'Ổ khoá + chìa khoá', 'Tiêu món cũ → sinh món mới', 'Token · Hợp đồng thông minh'],
		lines=[
			'Điều đáng chú ý là bên trong Head, mọi thứ vẫn chạy theo đúng mô hình UTxO của tập trước.',
			'Vẫn là những món tiền chưa tiêu, mỗi món một ổ khoá, muốn mở thì phải có chìa.',
			'Mỗi giao dịch vẫn tiêu trọn món cũ, rồi sinh ra món mới, kể cả tiền thối.',
			'Token và hợp đồng thông minh cũng chạy được, vì Head dùng cùng luật ghi sổ với Cardano.',
			'Vì vậy, dựng một giao dịch trong Head gần như không khác gì trên mạng chính.',
		],
		screen='Phóng vào trong căn phòng xanh: các ô UTxO tách và ghép như cảnh 08 của tập 1, ổ khoá mở bằng chìa, ô cũ bị gạch, ô mới sinh ra. Một ô mở ra như phong bì có token và ổ khoá bánh răng (gợi lại cảnh 11 tập 1).',
		sound='Tiếng gạch khi ô cũ bị tiêu; "tick" khi ô mới sinh ra; tiếng bánh răng nhỏ.',
	),
	'08': dict(
		title='Chỉ người trong phòng cần đồng ý',
		board=['Ai xác nhận?', 'Snapshot', '= trạng thái sổ lúc này', '✓ ✓ ✓ ✓'],
		lines=[
			'Vậy thì ở bên trong phòng, ai sẽ là người xác nhận giao dịch?',
			'Câu trả lời là chính những người trong Head. Mỗi người chạy một máy riêng, giữ một bản sổ riêng.',
			'Có giao dịch mới, máy của từng người cùng kiểm tra, rồi cùng ký vào một snapshot, tức là trạng thái của sổ ở thời điểm đó.',
			'Chỉ khi tất cả đều ký, snapshot đó mới được tính. Thiếu một chữ ký là chưa xong.',
			'Không cần cả mạng đồng ý, cũng không phải chờ khối mới. Chỉ cần những người ở trong phòng.',
		],
		screen='Bốn người trong phòng, mỗi người trước một máy tính nhỏ. Một giao dịch mới xuất hiện giữa bàn; bốn máy cùng sáng lên kiểm tra. Một tờ "Snapshot" (chữ nhỏ "= trạng thái sổ lúc này" bên dưới) đi vòng quanh bàn, nhận lần lượt bốn dấu ký. Khi đủ bốn dấu, tờ giấy sáng lên. Cuốn sổ lớn bên ngoài vẫn đứng yên.',
		sound='Bốn tiếng "tick" ứng với bốn chữ ký; một nốt chuông khi đủ bốn.',
	),
	'09': dict(
		title='Nếu có người bỏ đi',
		board=['Bỏ đi?', 'Gian lận?', 'Đóng Head', 'Snapshot mới nhất → Cardano', 'Thời gian đối chiếu', '→ Trả tiền về'],
		lines=[
			'Nhưng nếu có người giữa chừng bỏ đi, hay cố tình gian lận thì sao?',
			'Snapshot nào cũng có đủ chữ ký của cả nhóm, nên không ai tự ý sửa được.',
			'Bất kỳ ai trong nhóm cũng có quyền đóng Head, rồi đem snapshot mới nhất ra Cardano.',
			'Hết thời gian đối chiếu trên mạng chính, tiền của mỗi người được trả về đúng theo snapshot đó, không ai bị mắc kẹt.',
		],
		screen='Một người đứng dậy bỏ đi, ghế trống. Một người khác thử gạch sửa tờ snapshot, nhưng bốn dấu ký giữ chặt, nét gạch bị bật ra. Một người còn lại cầm tờ snapshot mới nhất bước ra cửa, đặt nó lên cuốn sổ lớn. Một đồng hồ cát lớn chạy hết (thời gian đối chiếu), rồi các ô UTxO trở về đúng chủ.',
		sound='Tiếng ghế kéo; một tiếng trầm ngắn khi nét gạch bị bật ra; tiếng cửa mở.',
	),
	'10': dict(
		title='Đem kết quả ra sổ chung',
		board=['Đóng Head', '100 ván bên trong', 'Vài giao dịch trên Cardano'],
		lines=[
			'Khi cả nhóm chơi xong, Head được đóng lại, và cửa phòng mở ra.',
			'Các món tiền chưa tiêu cuối cùng trong phòng được trả về Cardano, đúng người, đúng số lượng.',
			'Bên trong có cả trăm ván chơi, nhưng sổ chung chỉ phải ghi vài giao dịch để mở và đóng phòng.',
		],
		screen='Cửa phòng xanh mở, các ô UTxO cuối cùng đi xuống cuốn sổ lớn, sợi xích ở cảnh 06 rơi ra. Hai cột so sánh: bên trái một chồng dày "100 ván bên trong", bên phải chỉ vài dòng "Vài giao dịch trên Cardano".',
		sound='Tiếng cửa mở; "tick" khi từng ô về sổ lớn; tiếng xích rơi.',
	),
	'11': dict(
		title='Giới hạn của phòng họp',
		board=['Chỉ người trong Head', 'Mở, đóng = giao dịch lớp 1', 'Cả nhóm phải có mặt', 'Hợp với: nhóm quen, giao dịch nhiều lần'],
		lines=[
			'Tất nhiên, phòng họp riêng cũng có những giới hạn của nó.',
			'Thứ nhất, chỉ những người trong Head mới giao dịch được với nhau. Muốn trả cho người ngoài thì phải đem tiền ra.',
			'Thứ hai, mở và đóng Head là giao dịch trên Cardano, nên vẫn phải chờ và trả phí như thường.',
			'Thứ ba, cả nhóm phải có mặt để cùng ký. Chỉ một người tắt máy là phòng không thể giao dịch tiếp, phải đóng lại để rút tiền về.',
			'Vì vậy, Hydra hợp nhất với một nhóm biết rõ nhau, cần giao dịch với nhau thật nhiều lần.',
		],
		screen='Ba dòng viết lần lượt, mỗi dòng kèm hình nhỏ: người ngoài đứng trước cửa phòng đóng; cánh cửa có đồng hồ cát và đồng phí nhỏ; một máy tính tắt, cuốn sổ nhỏ đứng yên. Cuối cảnh: dòng "Hợp với" gạch chân.',
		sound='Một nốt chuông cho mỗi dòng.',
	),
	'12': dict(
		title='HydraBridge — cho lập trình viên',
		board=[
			"import { HydraBridge } from '@hydra-sdk/bridge'",
			'const bridge = new HydraBridge({ url })',
			'await bridge.connect()',
			'const utxos = await bridge.querySnapshotUtxo()  // UTxOObject',
			'new TxBuilder({ isHydra: true })',
			'await bridge.submitTxSync(tx)',
		],
		lines=[
			'Phần này dành cho lập trình viên. Trong hydra-sdk, ứng dụng nói chuyện với Hydra Head qua HydraBridge.',
			'Nó kết nối tới máy Hydra của bạn qua WebSocket, nhận mọi sự kiện của Head ngay khi chúng xảy ra.',
			'Danh sách món tiền chưa tiêu trong Head được trả về đúng dạng UTxO Object, như ở tập trước.',
			'Giao dịch vẫn dựng bằng TxBuilder, chỉ cần bật chế độ Hydra. Trong các ví dụ, phí bên trong Head đặt bằng không.',
			'Gửi giao dịch xong, bạn có thể chờ đến khi snapshot chứa giao dịch đó được cả nhóm ký.',
		],
		screen='Đoạn code viết tay bằng phấn, từng dòng hiện theo lời đọc. Dòng "querySnapshotUtxo" nối mũi tên tới một mẩu JSON UTxO Object nhỏ (gợi lại cảnh 13 tập 1). "isHydra: true" gạch chân. Dòng "submitTxSync" nối tới tờ snapshot có bốn dấu ký của cảnh 08. Góc trên: nhãn nhỏ "@hydra-sdk/bridge · @hydra-sdk/transaction".',
		sound='Tiếng gõ phấn nhanh theo từng dòng code; nốt chuông khi bốn dấu ký hiện ra.',
	),
	'13': dict(
		title='Tóm tắt và lời kết',
		board=['1. Lớp 1 giữ sổ chung, lớp 2 ghi sổ riêng', '2. Trong Head vẫn là UTxO', '3. Chỉ người trong Head cần đồng ý', 'Tập 3: Vòng đời một Hydra Head', 'hydrasdk.com', 'Thực hiện cùng VTechcom Labs'],
		lines=[
			'Tóm lại, qua tập này bạn chỉ cần nhớ ba ý chính.',
			'Thứ nhất, Cardano là lớp một, giữ cuốn sổ chung. Hydra là lớp hai, nơi cả nhóm ghi sổ riêng với nhau.',
			'Thứ hai, bên trong Hydra Head vẫn là những món tiền chưa tiêu, theo đúng luật của Cardano.',
			'Thứ ba, chỉ những người trong Head cần đồng ý với nhau, xong việc mới đem kết quả ra sổ chung.',
			'Vậy một Head được mở ra, chạy và đóng lại như thế nào? Đó là chủ đề của tập sau.',
			'Bạn có thể xem thêm tài liệu và ví dụ tại hydrasdk.com.',
		],
		screen='Ba ý viết lần lượt. Rồi căn phòng xanh vẽ lại thu nhỏ, kèm bốn mũi tên vòng quanh nó (mở, chạy, đóng, trả về) như lời hẹn tập 3. Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" kèm logo ở góc dưới phải, không đọc thành lời.',
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
