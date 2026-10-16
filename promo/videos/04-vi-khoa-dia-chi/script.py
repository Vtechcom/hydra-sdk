"""Tập 4 — Ví thật ra giữ gì? Khoá, địa chỉ và cụm từ khôi phục. Nguồn duy nhất cho hình, giọng và bảng duyệt.

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
		board=['Ví giữ chìa, không giữ tiền', 'Chìa khoá là gì?'],
		lines=[
			'Ở tập một, ta đã biết một câu, ví của bạn không chứa tiền mà chỉ giữ chìa khoá.',
			'Vậy chiếc chìa khoá đó trông như thế nào, và nó từ đâu mà có?',
			'Hiểu được điều này, bạn sẽ biết thứ gì trong ví phải giữ thật kỹ, và thứ gì đưa cho người khác cũng không sao.',
		],
		screen='Chiếc ví phấn của tập 1 mở ra, bên trong chỉ có một chùm chìa. Câu "Ví giữ chìa, không giữ tiền" viết lại ở trên. Một dấu hỏi lớn hiện cạnh chùm chìa.',
		sound='Nền vào dần. Tiếng phấn khi viết. Tiếng chùm chìa leng keng nhẹ.',
	),
	'02': dict(
		title='Đánh rơi điện thoại',
		board=['Mất điện thoại', 'Mất tiền?'],
		lines=[
			'Thử tưởng tượng bạn đánh rơi chiếc điện thoại có cài ví. Tiền của bạn có mất theo không?',
			'Câu trả lời là không. Các món tiền chưa tiêu vẫn nằm yên trên blockchain, chẳng hề nằm trong điện thoại.',
			'Câu hỏi thật sự là bạn có còn cách nào lấy lại chiếc chìa khoá hay không.',
		],
		screen='Chiếc điện thoại phấn rơi xuống, vỡ một góc. Phía trên, dải blockchain với các ô món tiền màu vàng phấn vẫn đứng yên, mỗi ô một ổ khoá. Dấu hỏi chuyển sang chiếc chìa.',
		sound='Tiếng rơi trầm, ngắn. Một nhịp lặng rồi nền vào lại.',
	),
	'03': dict(
		title='Khoá bí mật',
		board=['Khoá bí mật', '(private key)', 'Một con số rất lớn, ngẫu nhiên'],
		lines=[
			'Chiếc chìa khoá ấy có tên là khoá bí mật. Nó là một con số cực lớn, được chọn một cách ngẫu nhiên.',
			'Lớn đến mức không ai có thể đoán trúng, kể cả khi cho thật nhiều máy tính đoán liên tục.',
			'Ai biết con số này thì mở được mọi món tiền mà nó khoá. Vì vậy nó phải được giữ thật kín.',
		],
		screen='Một chiếc chìa vẽ phấn, thân chìa là một dãy số dài chạy ra khỏi mép bảng. Nhãn "Khoá bí mật". Bên cạnh, một máy tính nhỏ đoán số liên tục, các con số đều bị gạch.',
		sound='Tiếng tick nhanh liên tục khi máy tính đoán số, dừng lại đột ngột.',
	),
	'04': dict(
		title='Khoá công khai',
		board=['Khoá bí mật → Khoá công khai', 'Một chiều', '(public key)'],
		lines=[
			'Từ khoá bí mật, ví tính ra một con số thứ hai, gọi là khoá công khai.',
			'Phép tính này chỉ đi một chiều. Có khoá bí mật thì ra khoá công khai rất dễ, còn đi ngược lại thì không thể.',
			'Cũng như pha hai màu sơn vào nhau thì dễ, nhưng tách chúng ra lại như cũ thì gần như không ai làm được.',
		],
		screen='Mũi tên một chiều từ chìa (đỏ phấn) sang một ô khoá công khai (xanh phấn). Mũi tên ngược lại bị gạch chéo. Hai vệt sơn trộn vào nhau thành một màu, mũi tên tách ra bị gạch.',
		sound='Một nốt chuông khi khoá công khai hiện ra; tiếng trầm ngắn khi mũi tên ngược bị gạch.',
	),
	'05': dict(
		title='Địa chỉ là ổ khoá',
		board=['Khoá công khai → Dấu vân tay → Địa chỉ', 'addr1…', 'Địa chỉ = ổ khoá'],
		lines=[
			'Từ khoá công khai, ví lấy ra một dấu vân tay ngắn gọn, ghép thêm vài thông tin nữa, và thế là có địa chỉ.',
			'Địa chỉ này chính là ổ khoá gắn trên những món tiền chưa tiêu mà ta đã gặp ở các tập trước.',
			'Ai muốn gửi tiền cho bạn thì tạo một món tiền mới, khoá bằng địa chỉ của bạn.',
			'Vì thế, địa chỉ cứ việc đưa cho người khác, cũng như khi bạn đưa số tài khoản để nhận tiền.',
		],
		screen='Khoá công khai thu nhỏ thành một dấu vân tay phấn, dấu vân tay ghép thêm một mảnh nhỏ rồi thành chuỗi "addr1…" (xanh phấn). Chuỗi bay xuống, khắc lên ổ khoá của một ô món tiền màu vàng.',
		sound='Tiếng phấn; tiếng "cạch" khi địa chỉ khắc lên ổ khoá.',
	),
	'06': dict(
		title='Chữ ký',
		board=['Ký bằng khoá bí mật', 'Kiểm tra bằng khoá công khai', 'Chìa không rời ví'],
		lines=[
			'Khi bạn tiêu tiền, ví dùng khoá bí mật để ký lên giao dịch, rồi gửi chữ ký kèm khoá công khai.',
			'Mạng lưới kiểm tra hai điều. Thứ nhất, chữ ký có khớp với khoá công khai này không?',
			'Thứ hai, dấu vân tay của khoá công khai có khớp với ổ khoá trên món tiền không. Khớp cả hai thì ổ khoá mở.',
			'Điều đáng chú ý là khoá bí mật chưa bao giờ rời khỏi ví. Chữ ký chứng minh bạn có chìa, mà không phải đưa chìa cho ai.',
		],
		screen='Giao dịch là một tờ giấy phấn; chìa đỏ đóng một con dấu lên đó rồi quay về ví. Tờ giấy bay đi kèm khoá công khai xanh. Hai dấu tích lần lượt hiện. Ổ khoá trên ô món tiền bật mở. Chìa đỏ vẫn nằm trong ví suốt cảnh.',
		sound='Tiếng đóng dấu; hai tiếng tick; tiếng "cạch" khi ổ khoá mở.',
	),
	'07': dict(
		title='Cụm từ khôi phục',
		board=['Cụm từ khôi phục', '(seed phrase · mnemonic)', '24 từ'],
		lines=[
			'Khoá bí mật là một dãy số rất dài, chép tay thì dễ sai mà đọc lên thì rất khó nhớ.',
			'Vì vậy, khi tạo ví mới, ví chọn ngẫu nhiên một con số gốc rồi viết nó thành một chuỗi từ tiếng Anh thông dụng.',
			'Chuỗi này gọi là cụm từ khôi phục. Với hydra-sdk, mặc định là hai mươi bốn từ, theo đúng thứ tự.',
		],
		screen='Dãy số dài của khoá bí mật (cảnh 03) cuộn lại, rồi biến thành lưới 24 ô từ (đỏ phấn), mỗi ô một từ tiếng Anh đơn giản và một số thứ tự. Các từ là từ dựng lại để minh hoạ, một nửa bị làm mờ.',
		sound='Tiếng phấn viết nhanh theo từng ô từ.',
	),
	'08': dict(
		title='Một cụm từ, cả chùm chìa',
		board=['Cụm từ → Khoá gốc', 'Khoá con 1, 2, 3…', 'Địa chỉ 1, 2, 3…'],
		lines=[
			'Từ cụm từ khôi phục, ví tính ra một khoá gốc. Từ khoá gốc, nó sinh ra các khoá bí mật theo một con đường cố định.',
			'Mỗi khoá bí mật lại cho ra khoá công khai và địa chỉ của riêng nó, nên một cụm từ có thể có rất nhiều địa chỉ.',
			'Điều quan trọng nhất là cùng một cụm từ thì lần nào cũng ra đúng những khoá ấy, đúng những địa chỉ ấy.',
		],
		screen='Cây phấn mọc từ lưới cụm từ: gốc là khoá gốc, các nhánh là khoá bí mật (đỏ), đầu mỗi nhánh nở ra một địa chỉ (xanh). Toàn cảnh: cụm từ → khoá bí mật → khoá công khai → địa chỉ, mũi tên một chiều.',
		sound='Tiếng tick mỗi khi một nhánh mọc ra; nốt chuông khi cây hoàn chỉnh.',
	),
	'09': dict(
		title='Mất cụm từ là mất chìa',
		board=['Còn cụm từ → khôi phục', 'Mất cụm từ → mất chìa', 'Không có "quên mật khẩu"'],
		lines=[
			'Quay lại chiếc điện thoại bị rơi. Nếu bạn còn giữ cụm từ khôi phục, chỉ cần nhập lại vào ứng dụng ví.',
			'Ví sẽ tính lại đúng những khoá cũ, tìm lại đúng những món tiền cũ, và mọi thứ trở về như trước.',
			'Nhưng nếu mất cả cụm từ lẫn ví thì sao? Không ngân hàng hay tổng đài nào cấp lại được, cũng chẳng có nút quên mật khẩu.',
			'Tiền vẫn còn nằm trên blockchain, nhưng sẽ không còn ai mở được những ổ khoá ấy nữa.',
		],
		screen='Nhánh trái: điện thoại mới, lưới cụm từ nhập vào, cây khoá mọc lại, các ô món tiền sáng lên. Nhánh phải: lưới cụm từ bị lau mất; các ô món tiền vẫn ở đó nhưng ổ khoá phủ một lớp mờ, không chìa nào khớp.',
		sound='Hợp âm sáng ở nhánh trái; tiếng lau bảng và một nốt trầm ở nhánh phải.',
	),
	'10': dict(
		title='Không đưa cho ai',
		board=['Có cụm từ = có mọi chìa', 'Không thể đảo ngược', 'Ai hỏi → lừa đảo'],
		lines=[
			'Cũng vì thế mà cụm từ khôi phục chính là toàn bộ chùm chìa khoá của bạn.',
			'Ai có nó thì khôi phục được ví của bạn trên máy của họ, rồi chuyển hết tiền đi.',
			'Giao dịch đã được mạng ghi nhận thì không ai đảo ngược được, cũng không có ai để bạn khiếu nại.',
			'Ví hay bộ phận hỗ trợ chân chính không bao giờ cần cụm từ của bạn để giúp bạn.',
			'Vậy nên bất kể ai hỏi, qua tin nhắn, trang web hay một người xưng là nhân viên, hãy coi đó là lừa đảo.',
		],
		screen='Lưới cụm từ đỏ bị một bàn tay lạ chép lại; ở một chiếc máy khác cây khoá mọc lên y hệt, các ô món tiền bị kéo đi. Rồi ba khung nhỏ: một tin nhắn, một trang web có ô "Nhập cụm từ để nhận quà", một người đội mũ "Hỗ trợ". Cả ba bị đóng dấu "Lừa đảo".',
		sound='Tiếng tick nhanh khi tiền bị kéo đi; tiếng đóng dấu ba lần.',
	),
	'11': dict(
		title='Cất giữ thế nào',
		board=['Viết ra giấy', 'Cất nơi an toàn', 'Không chụp ảnh · Không lưu lên mạng · Không gửi tin nhắn'],
		lines=[
			'Vậy nên giữ cụm từ khôi phục thế nào cho an toàn? Cách đơn giản nhất là viết ra giấy, rồi cất ở nơi an toàn.',
			'Đừng chụp ảnh, đừng lưu lên mạng, và cũng đừng gửi nó qua tin nhắn cho bất kỳ ai, kể cả người thân.',
		],
		screen='Tờ giấy phấn chép cụm từ (các từ làm mờ) được gấp lại, cất vào một chiếc hộp có khoá. Bên cạnh ba biểu tượng máy ảnh, đám mây, bong bóng tin nhắn, mỗi cái bị gạch chéo.',
		sound='Tiếng giấy gấp; tiếng hộp đóng; ba tiếng gạch phấn.',
	),
	'12': dict(
		title='AppWallet và EmbeddedWallet — cho lập trình viên',
		board=[
			'import { AppWallet, NETWORK_ID } from \'@hydra-sdk/core\'',
			'',
			'const words = AppWallet.brew()   // 24 từ',
			'const wallet = new AppWallet({',
			'  networkId: NETWORK_ID.PREPROD,',
			'  key: { type: \'mnemonic\', words }',
			'})',
			'wallet.getPaymentAddress()   // addr…',
			'wallet.signTx(unsignedTx)',
			'',
			'EmbeddedWallet · m/1852\'/1815\'/0\'/0/0',
		],
		lines=[
			'Phần này dành cho lập trình viên. Trong gói core của hydra-sdk, lớp AppWallet làm đúng chuỗi việc vừa kể.',
			'Hàm brew tạo cụm từ khôi phục hai mươi bốn từ. Đưa cụm từ đó vào AppWallet là ví có ngay địa chỉ và ký được giao dịch.',
			'Bên dưới là lớp EmbeddedWallet, đi từ khoá gốc ra từng khoá con theo con đường chuẩn của Cardano.',
			'Lớp này còn nhận được khoá gốc có sẵn, hoặc khoá tạo bằng công cụ dòng lệnh của Cardano.',
			'Cùng một ví ký được giao dịch trên Cardano và cả bên trong Hydra Head.',
			'Vì ứng dụng của bạn đang giữ chìa, đừng bao giờ ghi cụm từ ra nhật ký hay gửi nó về máy chủ.',
		],
		screen='Đoạn code viết tay bằng phấn, từng dòng hiện theo lời đọc; "brew()" khoanh đỏ, "getPaymentAddress()" gạch chân xanh. Dòng cuối là đường dẫn khoá viết nhỏ, cạnh nhãn "CIP-1852" và "BIP39". Góc trên: nhãn nhỏ "@hydra-sdk/core".',
		sound='Tiếng gõ phấn nhanh theo từng dòng code.',
	),
	'13': dict(
		title='Tóm tắt và lời kết',
		board=['1. Cụm từ → khoá bí mật → khoá công khai → địa chỉ', '2. Địa chỉ cho ai cũng được', '3. Cụm từ không đưa cho ai', 'hydrasdk.com', 'Thực hiện cùng VTechcom Labs'],
		lines=[
			'Tóm lại, qua tập này bạn chỉ cần nhớ ba ý chính.',
			'Thứ nhất, cụm từ khôi phục sinh ra khoá bí mật, rồi khoá công khai, rồi địa chỉ, và chỉ đi theo một chiều.',
			'Thứ hai, địa chỉ là ổ khoá trên món tiền của bạn, cứ việc đưa cho người khác để nhận tiền.',
			'Thứ ba, cụm từ khôi phục là toàn bộ chìa khoá. Giữ nó thật kỹ và đừng đưa cho bất kỳ ai.',
			'Bạn có thể xem thêm tài liệu và ví dụ tại hydrasdk.com.',
		],
		screen='Ba ý viết lần lượt, ý ba gạch chân đỏ. Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" kèm logo ở góc dưới phải, không đọc thành lời.',
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
		board = '<br>'.join(f'`{esc(b)}`' for b in s['board'] if b)
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
