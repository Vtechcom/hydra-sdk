"""Tập 3 — Vòng đời của một Hydra Head. Nguồn duy nhất cho hình, giọng và bảng duyệt.

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
		board=['Cardano (lớp 1)', 'Hydra Head (lớp 2)', 'Mở → Dùng → Đóng'],
		lines=[
			'Ở tập trước, bạn đã biết Hydra Head là nơi một nhóm nhỏ giao dịch với nhau, bên trên mạng chính Cardano.',
			'Nhưng một Head không tồn tại mãi. Nó được mở ra, được dùng, rồi được đóng lại.',
			'Vậy tiền đi vào Head bằng cách nào, và làm sao để lấy ra an toàn?',
			'Tập này sẽ đi theo những món tiền chưa tiêu, từ lúc lên Head cho tới lúc trở về.',
		],
		screen='Gợi lại cảnh cuối tập 1: đường kẻ ngang, dưới là Cardano, trên là vòng tròn "Hydra Head". Vòng tròn được vẽ ra rồi bị một nét phấn khép lại. Vài ô vàng (món tiền chưa tiêu) nằm dưới đường kẻ, một dấu hỏi giữa ô và vòng tròn.',
		sound='Nền vào dần. Tiếng phấn khi vẽ vòng tròn.',
	),
	'02': dict(
		title='Sáu chặng',
		board=['1. Mở Head', '2. Nạp tiền', '3. Giao dịch', '4. Đóng Head', '5. Khiếu nại', '6. Trả về'],
		lines=[
			'Vòng đời của một Head có sáu chặng, nối tiếp nhau theo đúng thứ tự.',
			'Ba chặng đầu là mở Head, nạp tiền vào, rồi giao dịch ở bên trong.',
			'Ba chặng sau là đóng Head, chờ hết thời gian khiếu nại, rồi trả tiền về mạng chính.',
			'Ta sẽ lần lượt đi qua từng chặng, bắt đầu từ lúc mở Head.',
		],
		screen='Một vòng cung sáu chặng vẽ dần từ trái sang phải: ba chặng đi lên phía Head, ba chặng đi xuống về mạng chính. Mỗi chặng một biểu tượng nhỏ (cửa mở, ô vàng đi lên, mũi tên tách ghép, cửa đóng, đồng hồ, ô vàng đi xuống). Bản đồ này thu nhỏ vào góc trên và sáng chặng đang kể ở các cảnh sau.',
		sound='Một tiếng "tick" cho mỗi chặng hiện ra.',
	),
	'03': dict(
		title='Chặng 1 — Mở Head',
		board=['Mở Head · Init', 'Thành viên', 'Thời gian khiếu nại', 'Head: trống'],
		lines=[
			'Trước hết, một nhóm người thống nhất sẽ cùng mở một Head. Mỗi người chạy một nút Hydra của riêng họ.',
			'Một người gửi lệnh mở Head. Lệnh này tạo ra một giao dịch trên mạng chính Cardano.',
			'Giao dịch đó ghi lại hai điều. Thứ nhất là danh sách thành viên, thứ hai là thời gian khiếu nại.',
			'Thời gian khiếu nại là khoảng chờ khi đóng Head. Ta sẽ quay lại với khoảng chờ này ở chặng thứ năm.',
			'Khi giao dịch được ghi nhận, Head mở ra ngay, nhưng bên trong vẫn còn trống.',
		],
		screen='Ba hình người vẽ phấn, mỗi người cạnh một hộp nhỏ "nút Hydra". Một người gửi lệnh "Init"; một tờ giấy (giao dịch) rơi xuống đường kẻ mạng chính, trên giấy ghi danh sách thành viên và một đồng hồ nhỏ. Vòng tròn Head mở ra, bên trong trống.',
		sound='Tiếng "cạch" khi Head mở.',
	),
	'04': dict(
		title='Mở trước, nạp sau',
		board=['Trước đây: Init → Commit → Open', 'Hydra v2: Init → Open → nạp dần'],
		lines=[
			'Ở các phiên bản Hydra trước, mọi người phải góp tiền xong thì Head mới được mở.',
			'Chỉ cần một người chậm chân là cả nhóm phải chờ, hoặc huỷ Head rồi làm lại từ đầu.',
			'Từ Hydra phiên bản hai, Head mở trước. Ai muốn góp tiền thì nạp vào sau, trong lúc Head đang mở.',
		],
		screen='Hai dòng so sánh. Dòng trên: ba người, hai người đã đặt ô vàng, người thứ ba chưa; Head đứng chờ với đồng hồ cát, rồi bị gạch chéo "huỷ". Dòng dưới: Head mở trước, các ô vàng lần lượt đi lên vào những lúc khác nhau.',
		sound='Tiếng gạch phấn ở dòng trên; "tick" nhẹ mỗi khi một ô đi lên ở dòng dưới.',
	),
	'05': dict(
		title='Chặng 2 — Nạp tiền',
		board=['Nạp tiền · Commit', 'Giao dịch nạp', 'Chờ cho chắc chắn', 'Quá hạn → lấy lại'],
		lines=[
			'Để nạp tiền, bạn gửi một giao dịch nạp trên mạng chính, chỉ đích danh những món tiền muốn đưa lên.',
			'Các món này được chuyển vào một ổ khoá đặc biệt, dành riêng cho việc nạp vào Head.',
			'Nút Hydra chờ thêm một lúc trên mạng chính cho chắc chắn, rồi mới đưa món tiền vào Head.',
			'Nếu quá hạn mà món tiền vẫn chưa vào được Head, chủ của nó vẫn lấy lại được.',
			'Lên tới Head, món tiền vẫn mang nguyên ổ khoá của bạn, như lúc còn ở mạng chính.',
		],
		screen='Một ô vàng có ổ khoá của chủ đi từ mạng chính vào một hộp có ổ khoá lớn (ổ khoá nạp). Đồng hồ nhỏ chạy vài vòng, rồi ô vàng bay lên vào vòng tròn Head, vẫn mang ổ khoá cũ. Nhánh phụ mờ: đồng hồ hết giờ, ô vàng quay về tay chủ.',
		sound='"Cạch" khi ô vào hộp nạp; tiếng "vút" nhẹ khi ô bay lên Head.',
	),
	'06': dict(
		title='Chặng 3 — Giao dịch bên trong',
		board=['Head đang mở · Open', 'Tiêu món cũ → sinh món mới', 'Không chờ khối'],
		lines=[
			'Khi đã có tiền, các thành viên giao dịch với nhau ngay ở trong Head.',
			'Luật chơi vẫn là luật của tập một. Tiêu trọn món cũ, sinh ra món mới, có cả tiền thối.',
			'Điểm khác là giao dịch không phải chờ mạng chính Cardano ghi vào khối.',
			'Chỉ cần các nút Hydra trong nhóm kiểm tra và đồng ý với nhau là xong.',
		],
		screen='Bên trong vòng tròn Head: một ô vàng bị gạch, tách thành hai ô mới; hai ô khác gộp thành một. Dưới đường kẻ, mạng chính vẫn đứng yên, các khối đi chậm. Ba nút Hydra gật đầu (dấu tích) sau mỗi giao dịch.',
		sound='Chuỗi "tick" nhanh theo các giao dịch trong Head; nền mạng chính trầm, chậm.',
	),
	'07': dict(
		title='Snapshot',
		board=['Snapshot', '#1  #2  #3 …', 'Đủ chữ ký cả nhóm'],
		lines=[
			'Các nút ghi lại kết quả bằng những snapshot, tức là những lần chốt lại toàn bộ sổ cái của Head.',
			'Mỗi snapshot có một số thứ tự tăng dần, và phải có đủ chữ ký của mọi thành viên.',
			'Snapshot mới nhất cho biết món tiền nào đang thuộc về ai.',
			'Hãy nhớ kỹ chi tiết này, vì nó sẽ quyết định mọi thứ khi đóng Head.',
		],
		screen='Một khung ảnh vẽ phấn chụp lại các ô vàng trong Head, góc khung ghi "#3". Ba chữ ký ký lần lượt dưới khung. Các khung #1, #2, #3 xếp chồng, khung mới nhất nằm trên cùng và được khoanh.',
		sound='Tiếng "tách" như màn trập máy ảnh mỗi khi có snapshot mới; tiếng phấn khi ký.',
	),
	'08': dict(
		title='Rút giữa chừng',
		board=['Rút ra · Decommit', 'Head vẫn mở'],
		lines=[
			'Muốn đưa một món tiền về mạng chính sớm, bạn không cần phải đóng cả Head.',
			'Head cho phép rút riêng từng món ra, trong khi những người khác vẫn tiếp tục giao dịch.',
			'Món tiền rút ra sẽ xuất hiện lại trên mạng chính, vẫn mang ổ khoá của bạn.',
		],
		screen='Một ô vàng trượt xuống khỏi vòng tròn Head về mạng chính. Bên trong Head các ô khác vẫn tách ghép bình thường.',
		sound='Tiếng "vút" đi xuống.',
	),
	'09': dict(
		title='Chặng 4 — Đóng Head',
		board=['Đóng Head · Close', 'Snapshot mới nhất', 'Ngừng nhận giao dịch'],
		lines=[
			'Đến lúc kết thúc, một thành viên bất kỳ gửi lệnh đóng Head.',
			'Lệnh này đưa lên mạng chính snapshot mới nhất mà người đó đang giữ.',
			'Từ lúc này, Head ngừng nhận giao dịch mới, nhưng tiền vẫn chưa được trả về ngay.',
			'Vì sao lại phải chờ? Vì người đóng Head có thể đưa lên một snapshot cũ.',
		],
		screen='Một thành viên kéo cửa vòng tròn Head khép lại. Một khung snapshot rơi xuống đường kẻ mạng chính. Dấu "Không nhận giao dịch" đóng lên Head. Cuối cảnh: một dấu hỏi nhỏ trên khung snapshot.',
		sound='Tiếng "cạch" đóng cửa; nền chuyển sang hợp âm căng hơn.',
	),
	'10': dict(
		title='Chặng 5 — Khiếu nại',
		board=['Khiếu nại · Contest', 'An đóng bằng #4', 'Bình đưa #5', '#5 > #4'],
		lines=[
			'Giả sử ở snapshot số năm, An đã chuyển tiền cho Bình.',
			'Nhưng An lại đóng Head bằng snapshot số bốn, lúc số tiền đó vẫn còn trong túi An.',
			'Đồng hồ đếm ngược bắt đầu chạy. Trong thời gian đó, Bình có quyền khiếu nại.',
			'Bình đưa ra snapshot số năm, có đủ chữ ký của cả nhóm, kể cả chữ ký của An.',
			'Snapshot có số lớn hơn sẽ được dùng. An không làm giả được snapshot mới hơn, vì thiếu chữ ký của Bình.',
		],
		screen='Đồng hồ đếm ngược lớn vẽ phấn ở giữa bảng, kim chạy. Bên trái An đặt khung "#4"; bên phải Bình đặt khung "#5" lên trên, chữ ký của An trên khung #5 được khoanh. Khung #4 bị gạch. Một khung giả "#6" của An chỉ có một chữ ký thì bị đóng dấu "Từ chối".',
		sound='Tiếng tích tắc đều suốt cảnh; tiếng gạch khi khung #4 bị loại; tiếng trầm ngắn khi khung giả bị từ chối.',
	),
	'11': dict(
		title='Chặng 6 — Trả về mạng chính',
		board=['Sẵn sàng trả về · ReadyToFanout', 'Trả về · Fanout', 'Cùng địa chỉ, cùng số lượng'],
		lines=[
			'Khi đồng hồ về không, Head chuyển sang trạng thái sẵn sàng trả tiền.',
			'Một thành viên gửi lệnh trả về, và các món tiền theo snapshot cuối được tạo lại trên mạng chính.',
			'Mỗi món mang đúng địa chỉ và số lượng như trong snapshot, tức vẫn là ổ khoá của chủ nó.',
			'Head kết thúc ở đây. Các món tiền đã đi trọn một vòng, từ mạng chính lên Head rồi quay về.',
		],
		screen='Đồng hồ về 0, chuông nhỏ. Các ô vàng trong khung snapshot #5 lần lượt rơi xuống mạng chính, mỗi ô vẫn có ổ khoá của chủ. Vòng tròn Head mờ dần. Bản đồ sáu chặng ở góc sáng trọn vòng.',
		sound='Chuông khi đồng hồ về không; chuỗi "tick" khi từng ô rơi xuống.',
	),
	'12': dict(
		title='Phải để mắt tới Head',
		board=['Món nào cũng có đường về', 'Khiếu nại đúng lúc', 'Theo dõi trạng thái'],
		lines=[
			'Vòng đời này cho thấy, mỗi món tiền trên Head đều có một con đường để quay về mạng chính.',
			'Nhưng quyền khiếu nại chỉ có ích khi bạn để ý đến Head vào đúng lúc.',
			'Nếu không ai lên tiếng, snapshot cũ sẽ được dùng khi đồng hồ về không.',
			'Vì vậy, ứng dụng của bạn cần theo dõi trạng thái của Head liên tục, nhất là khi có người đóng Head.',
		],
		screen='Vòng sáu chặng vẽ lại đầy đủ. Một con mắt phấn đặt cạnh chặng "Khiếu nại", nối bằng nét đứt tới một chiếc điện thoại nhỏ (ứng dụng).',
		sound='Nền chuyển hợp âm sang phần dành cho lập trình viên.',
	),
	'13': dict(
		title='HydraBridge — cho lập trình viên',
		board=[
			"const bridge = new HydraBridge({ url: 'ws://…' })",
			'await bridge.connect()',
			"bridge.events.on('onMessage', payload => {",
			'  switch (payload.tag) { … }',
			'})',
		],
		lines=[
			'Phần này dành cho lập trình viên. Trong hydra-sdk, việc theo dõi đó do HydraBridge đảm nhận.',
			'HydraBridge kết nối với nút Hydra qua WebSocket, một đường truyền luôn mở theo cả hai chiều.',
			'Mỗi khi Head có thay đổi, nút Hydra gửi về một tin nhắn mang một nhãn riêng.',
			'Bạn chỉ cần đăng ký nghe mọi tin nhắn gửi về, rồi xử lý theo nhãn của từng tin.',
		],
		screen='Đoạn code viết tay bằng phấn, từng dòng hiện theo lời đọc; "onMessage" được khoanh khi lời đọc nói "nghe mọi tin nhắn". Một đường hai chiều nối hộp "nút Hydra" với hộp "ứng dụng", các tin nhắn nhỏ có nhãn chạy dọc đường. Góc trên: nhãn nhỏ "@hydra-sdk/bridge · HydraBridge".',
		sound='Tiếng gõ phấn nhanh theo từng dòng code; "tick" nhỏ mỗi tin nhắn chạy qua.',
	),
	'14': dict(
		title='Nhãn của từng chặng',
		board=[
			'Mở Head → HeadIsOpen',
			'Đóng Head → HeadIsClosed (contestationDeadline)',
			'Khiếu nại → HeadIsContested',
			'Hết giờ → ReadyToFanout',
			'Trả về xong → HeadIsFinalized',
			'bridge.commands: init · close · contest · fanout',
			'Nạp tiền: bridge.commit() → giao dịch nạp chưa ký → ví ký, gửi lên mạng chính',
		],
		lines=[
			'Mỗi chặng của vòng đời ứng với một nhãn tin nhắn. Head vừa mở xong thì có nhãn báo Head đã mở.',
			'Head bị đóng thì có nhãn báo đã đóng, kèm theo hạn chót của thời gian khiếu nại.',
			'Có người khiếu nại thì có nhãn báo khiếu nại. Hết thời gian thì có nhãn báo sẵn sàng trả về.',
			'Chỉ khi thấy nhãn sẵn sàng trả về, bạn mới gửi lệnh trả về. Xong xuôi thì có nhãn báo Head đã kết thúc.',
			'Các lệnh mở, đóng, khiếu nại và trả về đều có sẵn trong HydraBridge, mỗi lệnh chỉ cần một dòng code.',
			'Riêng hàm nạp tiền chỉ soạn sẵn giao dịch nạp. Ví của bạn vẫn phải ký, rồi gửi giao dịch đó lên mạng chính.',
		],
		screen='Bản đồ sáu chặng của cảnh 02 hiện lại, mỗi chặng được gắn một thẻ nhãn viết bằng phấn khi lời đọc nhắc tới; tên nhãn tiếng Anh chỉ viết trên bảng, không đọc. "contestationDeadline" nối bằng nét đứt tới đồng hồ của cảnh 10. Dòng áp chót liệt kê các lệnh, gạch chân "fanout" kèm ghi chú nhỏ "sau ReadyToFanout". Dòng cuối vẽ ba bước nạp tiền: hàm commit soạn giao dịch, chiếc ví ký, giao dịch rơi xuống mạng chính.',
		sound='Tiếng phấn; "tick" mỗi khi một thẻ nhãn được gắn.',
	),
	'15': dict(
		title='Tóm tắt và lời kết',
		board=['1. Mở trước, nạp sau', '2. Snapshot đủ chữ ký', '3. Snapshot mới nhất thắng, rồi trả về', 'hydrasdk.com', 'Thực hiện cùng VTechcom Labs'],
		lines=[
			'Tóm lại, qua tập này bạn chỉ cần nhớ ba ý chính.',
			'Thứ nhất, Head mở trước, rồi các món tiền chưa tiêu được nạp lên từ mạng chính.',
			'Thứ hai, bên trong Head, mọi thay đổi được ghi bằng snapshot có đủ chữ ký cả nhóm.',
			'Thứ ba, khi đóng Head, snapshot mới nhất sẽ thắng, rồi tiền được trả về mạng chính.',
			'Bạn có thể xem thêm tài liệu tại hydrasdk.com. Hẹn gặp lại bạn ở tập sau.',
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
