"""Tập 10 — Hydra dùng vào việc gì? Nguồn duy nhất cho hình, giọng và bảng duyệt.

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
		board=['Tập 9: cả mạng đồng ý từng khối', 'Tập 2: phòng họp riêng', 'Việc nào nên vào phòng?'],
		lines=[
			'Ở tập chín, ta đã thấy cả mạng Cardano phải cùng đồng ý về từng khối, nên ai muốn ghi sổ cũng phải chờ.',
			'Còn ở tập hai, bốn người bạn An, Bình, Chi và Dũng có một phòng họp riêng, chỉ người trong phòng cần đồng ý.',
			'Phòng họp ấy rất hợp với một buổi tối chơi cả trăm ván. Nhưng những việc khác thì sao?',
			'Hôm nay ta sẽ tìm cách phân biệt việc nào nên đem vào phòng, và việc nào nên để lại ở sổ chung.',
		],
		screen='Mép dưới bảng: chuỗi trang sổ trắng và dải ô thời gian của tập 9, một trang sổ rơi xuống theo nhịp. Phía trên: căn phòng viền xanh lam phấn, bốn hình người An, Bình, Chi, Dũng ngồi quanh bàn (vẽ lại cảnh 04 tập 2). Ngoài cửa phòng, nhiều tấm thẻ trắng xếp hàng, mỗi thẻ một dấu hỏi. Chữ "Việc nào nên vào phòng?" viết chậm ở giữa.',
		sound='Nền vào dần. Tiếng "cộp" trầm khi trang sổ rơi; tiếng phấn khi vẽ phòng.',
	),
	'02': dict(
		title='Nhắc lại phòng họp',
		board=['Hydra Head = phòng họp riêng', 'Nạp tiền', 'Snapshot: đủ chữ ký', 'Kết quả cuối → sổ chung'],
		lines=[
			'Nhắc lại một chút. Mỗi phòng họp riêng như vậy được gọi là một Hydra Head, chạy bên trên mạng chính Cardano.',
			'Mỗi người nạp món tiền chưa tiêu của mình vào Head, rồi cả nhóm giao dịch với nhau ở bên trong.',
			'Mọi thay đổi được ghi bằng snapshot có chữ ký của cả nhóm. Xong việc, kết quả cuối cùng mới được đem ra sổ chung.',
		],
		screen='Đường kẻ ngang: dưới là sổ chung trắng, trên là phòng xanh lam phấn. Các ô món tiền vàng đi từ sổ chung lên phòng; trong phòng chúng chuyền qua lại; một tờ snapshot hiện ra với bốn chữ ký nhỏ. Cuối cảnh, các ô vàng cuối cùng đi xuống sổ chung.',
		sound='Tiếng tick nhẹ mỗi lần món tiền di chuyển; một nốt chuông khi snapshot đủ chữ ký.',
	),
	'03': dict(
		title='Ba điều kiện trên cửa',
		board=['1. Thành viên chốt từ lúc mở', '2. Mọi người cùng ký snapshot', '3. Tiền nằm sẵn trong phòng'],
		lines=[
			'Muốn đem một việc vào phòng họp này, việc đó phải hợp với ba điều kiện viết trên cửa phòng.',
			'Thứ nhất, danh sách thành viên được chốt từ lúc mở Head. Khi Head đang chạy, không ai vào thêm được.',
			'Thứ hai, mỗi snapshot cần chữ ký của tất cả thành viên, nên nút Hydra của mọi người phải cùng đang chạy.',
			'Thứ ba, trong phòng chỉ tiêu được những món tiền đang nằm trong Head.',
			'Tiền vẫn nạp thêm hay rút bớt được giữa chừng, nhưng muốn trả cho người ngoài thì phải đem tiền ra sổ chung.',
		],
		screen='Cánh cửa phòng viền xanh lam phấn chiếm nửa trái bảng. Ba dòng điều kiện viết lần lượt trên cửa, mỗi dòng kèm một biểu tượng nhỏ: danh sách bốn cái tên có ổ khoá nhỏ ở góc; tờ snapshot với bốn chữ ký; một ô món tiền vàng có mũi tên vào và mũi tên ra. Ở dòng 3, một mũi tên nhỏ chỉ ra ngoài cửa tới "người ngoài", đi vòng qua sổ chung trắng.',
		sound='Tiếng phấn cho mỗi dòng; một tiếng tick khi biểu tượng hiện ra.',
	),
	'04': dict(
		title='Vì sao có ba điều kiện',
		board=['Không ai đứng ngoài xác nhận', 'Nút Hydra tự ký', 'Không chờ khối', 'Ai cũng đóng được Head'],
		lines=[
			'Vì sao lại có ba điều kiện này? Vì trong phòng không có ai đứng ngoài để xác nhận giao dịch.',
			'Chính các thành viên kiểm tra và cùng ký. Việc ký do nút Hydra tự làm, người dùng không phải ngồi canh.',
			'Đổi lại, cả nhóm không phải chờ khối mới của cả mạng như ta đã thấy ở tập chín.',
			'Và nếu có chuyện, bất kỳ thành viên nào cũng có quyền đóng Head để đem tiền về theo snapshot mới nhất.',
		],
		screen='Bốn máy tính nhỏ nối với nhau thành vòng trong phòng xanh lam; mỗi máy tự đóng một con dấu chữ ký lên tờ snapshot ở giữa, bên cạnh có hình người đang làm việc khác (không nhìn màn hình). Ngoài phòng, một trang sổ trắng của tập 9 đứng chờ, bị gạch mờ. Cuối cảnh: mỗi hình người cầm một chiếc chìa nhỏ trắng ghi "đóng Head".',
		sound='Tiếng tick đều khi các máy đóng dấu; tiếng gạch nhẹ khi trang sổ bị gạch.',
	),
	'05': dict(
		title='Phù hợp 1: trò chơi theo lượt',
		board=['Trò chơi theo lượt', '4 người chơi cả buổi', 'Luật chơi = script'],
		lines=[
			'Giờ ta thử đưa từng việc qua cửa. Việc đầu tiên là trò chơi theo lượt của bốn người bạn.',
			'Cả buổi chỉ có bốn người chơi, ai cũng mở máy, và tiền cược đã nạp sẵn vào phòng.',
			'Cả ba điều kiện đều thoả. Luật chơi còn có thể viết thành script, như chiếc ổ khoá biết suy nghĩ ở tập năm.',
		],
		screen='Tấm thẻ trắng "Trò chơi theo lượt" trượt tới cửa. Ba dòng điều kiện lần lượt sáng lên, rồi vẽ một dấu tích xanh lá bằng nét cạnh thẻ. Thẻ đi vào phòng, mở ra thành bàn chơi với các đồng ADA vàng. Góc phải: chiếc ổ khoá bánh răng nhỏ của tập 5 với chữ "Luật chơi = script".',
		sound='Ba tiếng tick khi ba dòng sáng; một nốt chuông nhẹ khi dấu tích hiện ra.',
	),
	'06': dict(
		title='Phù hợp 2: thanh toán vi mô',
		board=['Thanh toán vi mô', 'Quán cà phê + vài khách quen', 'Mở 1 lần, trả nhiều lần'],
		lines=[
			'Việc thứ hai là thanh toán vi mô, tức là trả rất nhiều khoản nhỏ, giữa một nhóm cố định.',
			'Hình dung một quán cà phê và vài khách quen, trả nhau từng khoản nhỏ cho mỗi ly, mỗi lần dùng.',
			'Nếu ghi từng khoản lên sổ chung, lần nào cũng phải chờ khối mới và trả phí cho mạng lưới.',
			'Trong phòng họp, họ mở phòng một lần, trả nhau nhiều lần, rồi mới đem kết quả ra sổ chung.',
		],
		screen='Thẻ "Thanh toán vi mô" qua cửa, ba dòng sáng, dấu tích xanh lá vẽ bằng nét. Trong phòng: quầy quán cà phê vẽ phấn và ba hình khách quen; nhiều đồng vàng nhỏ chuyền từ khách sang quầy. Bên dưới, một hàng dài tờ "ly 1", "ly 2"... trước sổ chung bị gạch đi; cuối cảnh các đồng vàng gom thành một dòng duy nhất trên sổ chung. Chữ nhỏ ở góc: "ví dụ minh hoạ".',
		sound='Chuỗi tick nhỏ dày dần khi tiền chuyền; một nốt chuông khi gom thành một dòng.',
	),
	'07': dict(
		title='Phù hợp 3: phiên đấu giá nhỏ',
		board=['Đấu giá nhỏ', 'Luật đấu giá = script', 'Thiết kế khác: người trả giá đứng ngoài (IOG và MLabs, 01/2023)'],
		lines=[
			'Việc thứ ba là một phiên đấu giá nhỏ, với một món hàng và vài người trả giá đã biết trước.',
			'Giá được trả liên tục trong thời gian ngắn, và luật đấu giá được viết bằng script ngay trong Head.',
			'Với phiên đông người hơn, khó giữ tất cả cùng có mặt, nên đã có những thiết kế khác.',
			'Ở đó, người trả giá đứng ngoài phòng, chỉ một nhóm đại diện ở bên trong chạy Head.',
		],
		screen='Thẻ "Đấu giá nhỏ" qua cửa, ba dòng sáng, dấu tích xanh lá. Trong phòng: một món hàng có ổ khoá bánh răng; tờ datum xanh lam phấn ghi giá trả tăng dần (con số minh hoạ, không đơn vị thật). Nửa sau cảnh: bản vẽ thứ hai nhỏ hơn, nhiều người đứng ngoài phòng gửi tờ giá qua ba người đại diện ngồi trong phòng; chữ nhỏ "IOG và MLabs, 01/2023".',
		sound='Tiếng tick mỗi lần giá tăng; tiếng phấn khi vẽ bản thiết kế thứ hai.',
	),
	'08': dict(
		title='Không phù hợp 1: nhóm luôn thay đổi',
		board=['Ví cho cả thành phố', 'Người đến đi từng phút', 'Mỗi Head một nhóm', 'Nghiên cứu nối các Head (IOG, 02/2022), chưa có trong hydra-sdk'],
		lines=[
			'Giờ đến những việc không qua được cửa. Thứ nhất là một ví thanh toán cho cả thành phố.',
			'Người dùng đến và đi từng phút, mà danh sách thành viên của Head thì đã chốt từ lúc mở.',
			'Nhóm càng đông thì mỗi giao dịch càng phải chờ nhiều người phản hồi hơn.',
			'Mỗi Head chỉ dành cho nhóm của nó. Nhiều nhóm thì mở nhiều Head, mỗi nhóm một phòng.',
			'Năm hai nghìn không trăm hai mươi hai, nhóm phát triển Hydra cho biết cách nối các Head với nhau khi đó mới là hướng nghiên cứu.',
		],
		screen='Thẻ "Ví cho cả thành phố" trượt tới cửa và dừng lại; dòng điều kiện 1 bị gạch chéo bằng nét cam phấn. Ngoài cửa, một đám đông vẽ phấn chen chúc, người vào người ra. Cuối cảnh: vài phòng xanh lam nhỏ đứng cạnh nhau, mỗi phòng một nhóm; một đường chấm nối hai phòng, cạnh đó chữ nhỏ "Nghiên cứu nối các Head (IOG, 02/2022), chưa có trong hydra-sdk".',
		sound='Một tiếng trầm ngắn khi thẻ dừng; tiếng ồn nền nhẹ của đám đông (nhiễu lọc, rất nhỏ).',
	),
	'09': dict(
		title='Không phù hợp 2: không giữ được mọi người có mặt',
		board=['Một nút tắt máy', 'Snapshot thiếu chữ ký', 'Để mắt tới Head'],
		lines=[
			'Thứ hai là những việc không giữ được mọi người cùng có mặt.',
			'Chỉ cần nút Hydra của một thành viên tắt máy, snapshot mới sẽ thiếu một chữ ký, và cả phòng phải đứng chờ.',
			'Không ai chiếm được tiền của bạn, vì thành viên nào cũng đóng được Head theo snapshot mới nhất.',
			'Miễn là bạn để mắt tới Head trong thời gian khiếu nại, như ta đã nói ở tập ba.',
			'Nhưng việc đang làm dở thì phải dừng lại. Việc cần chạy liên tục mà thành viên hay vắng mặt thì không hợp với Head.',
		],
		screen='Bốn máy tính trong phòng, một máy tối đi. Tờ snapshot mới chỉ có ba chữ ký, ô thứ tư để trống; đồng hồ cát nhỏ chảy. Dòng điều kiện 2 trên cửa bị gạch chéo cam. Góc phải: chiếc chìa "đóng Head" vẫn sáng trắng, cạnh đó một con mắt nhỏ và chữ "Để mắt tới Head".',
		sound='Tiếng tắt máy (xung trầm ngắn); tiếng đồng hồ tích tắc chậm; một tiếng trầm ngắn khi dòng 2 bị gạch.',
	),
	'10': dict(
		title='Không phù hợp 3: giao dịch lẻ, cần công khai ngay',
		board=['Trả một lần', 'Mở + đóng Head = giao dịch lớp 1', 'Cần công khai ngay'],
		lines=[
			'Thứ ba là những giao dịch lẻ, chỉ trả một lần rồi thôi.',
			'Mở và đóng Head đều là giao dịch trên sổ chung, nên tốn phí và tốn công hơn trả thẳng một lần ở lớp một.',
			'Cũng vậy với những việc cần cả mạng nhìn thấy ngay từng giao dịch.',
			'Giao dịch trong phòng không nằm trên sổ chung. Sổ chung chỉ thấy lúc mở, nạp, rút, đóng, và kết quả cuối cùng.',
		],
		screen='Nửa trái: thẻ "Trả một lần" đứng cạnh hai tờ giao dịch "mở Head" và "đóng Head" trên sổ chung trắng, so với một tờ "trả thẳng" duy nhất; thẻ không qua cửa, dòng 3 viền cam. Nửa phải: thẻ "Cần công khai ngay"; trong phòng có nhiều giao dịch nhỏ, nhưng trên sổ chung chỉ có vài dòng "mở", "nạp", "rút", "đóng", "kết quả cuối". Dấu chéo cam vẽ bằng nét cạnh cả hai thẻ.',
		sound='Hai tiếng "cộp" trầm cho hai giao dịch mở và đóng; một tiếng trầm ngắn cho mỗi dấu chéo.',
	),
	'11': dict(
		title='Cho lập trình viên: theo dõi ba điều kiện',
		board=[
			"bridge.events.on('onMessage', payload => {",
			"  if (payload.tag === 'HeadIsOpen') payload.parties",
			"  if (payload.tag === 'PeerDisconnected') payload.peer",
			'  // có thể: bridge.commands.close()',
			'})',
			'Code rút gọn, bản đầy đủ ở hydrasdk.com',
		],
		lines=[
			'Phần này dành cho lập trình viên. Trong hydra-sdk, HydraBridge cho ứng dụng nghe mọi tin nhắn gửi về từ Head.',
			'Tin báo Head đã mở mang theo danh sách thành viên, đúng danh sách được chốt ở điều kiện thứ nhất.',
			'Khi nút Hydra mất kết nối với một thành viên, có một tin riêng báo cho ứng dụng biết.',
			'Lúc đó, ứng dụng có thể báo cho người dùng, chờ kết nối trở lại, hoặc quyết định đóng Head.',
		],
		screen='Khung code phấn (font JetBrains Mono, tô màu nhẹ) hiện từng dòng. Mũi tên từ "payload.parties" chỉ về dòng điều kiện 1 trên cửa; mũi tên từ "payload.peer" chỉ về dòng điều kiện 2. Dòng chú thích "bridge.commands.close()" màu nhạt hơn. Góc dưới: nhãn "Code rút gọn, bản đầy đủ ở hydrasdk.com" (không đọc).',
		sound='Tiếng gõ phím nhẹ thay cho tiếng phấn.',
	),
	'12': dict(
		title='Cho lập trình viên: SDK lo phần nào',
		board=[
			'hydra-sdk',
			'HydraBridge · commit · decommit',
			'new TxBuilder({ isHydra: true })',
			'bridge.commands.close()',
			'Ứng dụng của bạn',
			'Luật chơi · luật đấu giá · giao diện',
		],
		lines=[
			'Vậy hydra-sdk lo phần nào, còn bạn phải tự làm phần nào?',
			'hydra-sdk lo phần chung cho mọi việc, từ kết nối, nạp và rút tiền, dựng giao dịch bằng TxBuilder, cho tới đóng Head.',
			'Luật của trò chơi hay phiên đấu giá là phần của ứng dụng, viết bằng script như tập năm, hoặc ngay trong code của bạn.',
			'Hiện hydra-sdk chưa có mô đun dựng sẵn cho trò chơi, đấu giá hay thanh toán vi mô.',
		],
		screen='Bảng chia hai cột phấn. Cột trái tiêu đề "hydra-sdk", các dòng tên lớp và hàm viết bằng font code. Cột phải tiêu đề "Ứng dụng của bạn", ba mục viết tay. Một đường kẻ dọc ngăn hai cột; mũi tên từ cột phải sang cột trái ghi "dùng".',
		sound='Tiếng gõ phím cho cột trái, tiếng phấn cho cột phải.',
	),
	'13': dict(
		title='Tóm tắt và lời kết',
		board=['1. Nhóm biết trước nhau, giao dịch nhiều lần', '2. Thử với ba điều kiện', '3. Vướng điều kiện nào → sổ chung', 'hydrasdk.com', 'Thực hiện cùng VTechcom Labs'],
		lines=[
			'Tóm lại, qua tập này bạn chỉ cần nhớ ba ý chính.',
			'Thứ nhất, Hydra Head hợp với một nhóm biết trước nhau, giao dịch với nhau nhiều lần trong một đợt.',
			'Thứ hai, hãy thử mỗi việc với ba điều kiện, thành viên cố định, mọi người cùng có mặt, và tiền nằm sẵn trong phòng.',
			'Thứ ba, việc nào vướng một trong ba điều kiện thì nên để ở sổ chung của Cardano.',
			'Bạn có thể xem thêm tài liệu và ví dụ tại hydrasdk.com.',
		],
		screen='Cánh cửa với ba dòng điều kiện ở giữa; bên trong phòng ba thẻ có dấu tích xanh lá (trò chơi, thanh toán vi mô, đấu giá nhỏ), bên ngoài ba thẻ dừng lại có dấu chéo cam. Ba ý viết lần lượt bên phải. Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc dưới phải, không đọc thành lời.',
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
