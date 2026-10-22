"""Trust Center, tập 1 — Khi mọi node cùng ký sai. Nguồn duy nhất cho hình, giọng và bảng duyệt.

Chạy `python script.py` để xuất lại kich-ban.md.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'shared'))
import lexicon  # noqa: E402

# Mỗi cảnh: board = chữ được viết lên bảng (không phải phụ đề),
# lines = lời đọc (mỗi phần tử là một clip giọng), screen = hình, sound = âm thanh.
# example = (câu đầu, câu cuối) của đoạn ví dụ: nói kỹ thuật trước, ví dụ sau; hình hiện thẻ "Ví dụ".
# Ví dụ xuyên tập: Head do ba node X, Y, Z vận hành; người chơi An có 100 ADA trong Head;
# hình ảnh so sánh: quỹ chung do ba thủ quỹ cùng giữ sổ.
SCRIPT = {
	'01': dict(
		title='Bối cảnh',
		board=['Hydra Head', 'node X, Y, Z', 'An: 100 ADA', 'bản chốt (snapshot)', 'Ví dụ: quỹ chung, ba thủ quỹ'],
		lines=[
			'Một "Hydra Head" là một nhóm gồm ba "node" X, Y và Z cùng giữ một sổ cái riêng.',
			'Người chơi An có một trăm "ADA" trong "Head", nhưng An không tự giữ "node" nào.',
			'Mỗi lần số dư trong "Head" thay đổi, cả ba "node" phải cùng ký vào một bản chốt mới, gọi là "snapshot".',
			'Bản chốt ghi rõ ai đang có bao nhiêu tiền, và chỉ có hiệu lực khi đủ cả ba chữ ký.',
			'Ví dụ, hãy hình dung một quỹ chung do ba thủ quỹ cùng giữ sổ.',
			'Mỗi lần sổ thay đổi, cả ba thủ quỹ phải cùng ký vào trang mới. Thiếu một chữ ký, trang đó không được tính.',
		],
		example=(4, 5),
		screen='Vòng Head, ba node X, Y, Z bật ra so le. An đứng ngoài vòng, ô vàng "100 ADA" nằm trong vòng. Tờ bản chốt hiện giữa vòng ("An: 100", "Bình: 50"), ba chữ ký bay từ ba node vào tờ. Đoạn ví dụ: camera lùi, sơ đồ thu về bên trái; thẻ "Ví dụ" trượt vào bên phải: cuốn sổ quỹ chung, ba chữ ký ở cuối trang.',
		sound='Tick khi node bật ra; tiếng phấn khi ký; gió lướt khi camera lùi.',
	),
	'02': dict(
		title='Nếu cả ba cùng gian lận',
		board=['An: 0', 'Cardano: đủ chữ ký → hợp lệ', 'Ví dụ: ngân hàng chỉ đối chiếu chữ ký', 'v1: chưa xử lý được', 'v2: bằng chứng · phạt tự động · đền tiền'],
		lines=[
			'Bây giờ giả sử cả ba "node" thông đồng với nhau.',
			'Họ ký một bản chốt mới, trong đó một trăm "ADA" của An đã chuyển sang ví của họ.',
			'Khi đóng "Head", "Cardano" chỉ kiểm tra bản chốt có đủ chữ ký hay không. Vì đủ ba chữ ký, bản chốt vẫn được chấp nhận.',
			'Ví dụ, ngân hàng chỉ đối chiếu chữ ký trên lệnh chi. Nếu cả ba thủ quỹ cùng ký sai, ngân hàng vẫn chi tiền.',
			'Ở phiên bản một, "Trust Center" chỉ theo dõi các "node" ký đều hay ký chậm, chưa xử lý được tình huống này.',
			'Phiên bản hai nhắm tới ba việc. Khi gian lận xảy ra thì có bằng chứng, các "node" bị phạt tự động, và An được đền tiền.',
		],
		example=(3, 3),
		screen='Dòng "An: 100" bị gạch đỏ, thay bằng "An: 0"; chấm vàng 100 ADA chạy từ ô của An sang ba node. Camera đẩy vào tờ bản chốt, dấu xanh "Cardano: hợp lệ" đóng xuống, bảng rung. Đoạn ví dụ: thẻ lệnh chi có ba chữ ký và con dấu "đã chi". Lau theo vệt; "v1" mờ; ba thẻ v2 bật ra so le.',
		sound='Click khi tiền chạy; trầm khi dấu đóng; chuông khi ba thẻ v2 hiện.',
	),
	'03': dict(
		title='Biên lai',
		board=['Hydra 2.2.0', 'mã tóm tắt số dư', 'chứng minh: 100 ADA của An có trong bản chốt', 'kiểm tra trên Cardano', 'biên lai', 'ví tự kiểm tra', 'Ví dụ: biên lai gửi tiền'],
		lines=[
			'Việc đầu tiên là biên lai. Từ bản "Hydra" hai chấm hai, mỗi bản chốt có thêm một mã tóm tắt toàn bộ số dư trong "Head".',
			'Nhờ mã tóm tắt đó, có thể chứng minh một khoản tiền cụ thể nằm trong bản chốt đã ký, mà không cần đưa ra cả bản chốt.',
			'Và theo thiết kế, phép chứng minh này kiểm tra được ngay trên "Cardano".',
			'Mỗi khi An nhận tiền, phần mềm cạnh "node" gửi cho An biên lai, gồm bản chốt đủ ba chữ ký và bằng chứng cho một trăm "ADA".',
			'Biên lai chỉ dùng chữ ký sẵn có của "Hydra", nên ví của An tự kiểm tra được thật hay giả.',
			'Ví dụ, đây giống tờ biên lai gửi tiền có chữ ký của cả ba thủ quỹ.',
			'Sau này nếu ai chối là An chưa từng gửi, An chỉ cần đưa biên lai ra, và ai cũng đối chiếu được chữ ký.',
		],
		example=(5, 6),
		screen='Lưới ô số dư bật ra so le, chấm dữ liệu chạy vào một con dấu tròn "mã tóm tắt". Ô "An 100" được khoanh, đường chứng minh nối tới con dấu, dấu tích. Phần mềm cạnh node gửi biên lai xanh lá sang ví của An; biên lai thu nhỏ bay vào ví, dấu tích "ví tự kiểm tra". Đoạn ví dụ: thẻ biên lai gửi tiền có ba chữ ký.',
		sound='Click mỗi chấm dữ liệu; chuông khi ví kiểm tra xong.',
	),
	'04': dict(
		title='Tiền ký quỹ',
		board=['ký quỹ thành viên', 'phạt ký chậm, không ký · có giới hạn · được khiếu nại', 'ký quỹ theo từng Head', 'đền người chơi · hợp đồng tự xử lý', 'Ví dụ: tiền cọc thuê nhà'],
		lines=[
			'Việc thứ hai là tiền ký quỹ. Mỗi "node" muốn vận hành một "Head" tin cậy cao phải khoá một khoản tiền vào hợp đồng trên "Cardano".',
			'Khoản thứ nhất là ký quỹ thành viên, cố định theo cấp của nhà cung cấp, dùng để phạt khi "node" ký chậm hoặc không ký.',
			'Lỗi này cần người xác nhận, nên mức phạt có giới hạn, và nhà cung cấp được quyền khiếu nại.',
			'Khoản thứ hai là ký quỹ theo từng "Head", tính theo số tiền đang có trong "Head", dùng để đền người chơi khi có gian lận.',
			'Khoản này do hợp đồng tự xử lý, kể cả "Vtechcom" cũng không can thiệp được.',
			'Ví dụ, ký quỹ giống tiền đặt cọc khi thuê nhà. Làm hỏng đồ thì bị trừ vào cọc.',
			'Điểm khác là tiền cọc ở đây không nằm trong tay chủ nhà, mà nằm trong hợp đồng, và chỉ hợp đồng được trừ.',
		],
		example=(5, 6),
		screen='Ba node trên cùng, mũi tên xuống ba két hai ngăn: ngăn trắng "ký quỹ thành viên", ngăn vàng "ký quỹ theo từng Head". Ngăn nào được nhắc thì sáng, ngăn kia mờ. Đoạn ví dụ: thẻ ngôi nhà và phong bì tiền cọc nằm trong ổ khoá hợp đồng.',
		sound='Tick khi két hiện; tiếng khoanh khi đổi ngăn.',
	),
	'05': dict(
		title='Gian lận kiểu thứ nhất: hai bản chốt cùng số',
		board=['bản chốt #42', 'bản chốt #42', '≠', 'hợp đồng: phạt ngay', 'thưởng người nộp', 'Ví dụ: hai hoá đơn cùng số'],
		lines=[
			'Giờ đến hai kiểu gian lận. Kiểu thứ nhất là ký hai bản chốt khác nhau cho cùng một số thứ tự.',
			'Một "Head" trung thực không bao giờ tạo ra hai bản chốt cùng số thứ tự.',
			'Ai cầm được hai bản như vậy, mỗi bản đều đủ chữ ký, chỉ cần nộp lên hợp đồng. Hợp đồng kiểm tra chữ ký rồi phạt ngay.',
			'Người nộp bằng chứng lên hợp đồng sẽ được thưởng một phần tiền phạt.',
			'Ví dụ, cùng một số hoá đơn mà có hai bản ghi hai số tiền khác nhau, nhưng cùng có đủ chữ ký.',
			'Chỉ cần đặt hai tờ cạnh nhau là đủ bằng chứng, không cần hỏi thêm ai.',
		],
		example=(4, 5),
		screen='Hai tờ "bản chốt #42" bay vào từ hai phía ("An: 100" và "An: 0"), cùng đủ ba chữ ký; dấu "≠" đỏ. Người nộp gửi hai tờ vào bánh răng hợp đồng; dấu đỏ "phạt ngay", bảng rung; chấm vàng tiền thưởng chạy về người nộp. Đoạn ví dụ: thẻ hai hoá đơn số 42 đặt cạnh nhau.',
		sound='Gió lướt khi hai tờ bay vào; bánh răng; trầm khi phạt.',
	),
	'06': dict(
		title='Gian lận kiểu thứ hai: lấy tiền của An',
		board=['Head đóng · bản chốt cuối: An = 0', 'biên lai: An = 100', 'dịch vụ canh gác', 'thách thức + 5 ADA cọc', 'khoá ký quỹ', 'Ví dụ: quầy khiếu nại'],
		lines=[
			'Kiểu thứ hai là lấy tiền của An. "Head" đóng lại, và bản chốt cuối cùng đưa lên "Cardano" không còn một trăm "ADA" của An.',
			'An, hoặc một dịch vụ canh gác thay mặt An, mở một thách thức trên hợp đồng, nộp kèm biên lai và năm "ADA" đặt cọc.',
			'Ngay trong cùng giao dịch đó, tiền ký quỹ của cả ba "node" bị khoá lại, không ai kịp rút ra.',
			'Ví dụ, An mang biên lai tới quầy khiếu nại, đóng một khoản phí nhỏ để tránh khiếu nại bừa.',
			'Vừa nhận đơn, ngân hàng phong toả ngay tài khoản cọc của ba thủ quỹ.',
		],
		example=(3, 4),
		screen='Đường Cardano nằm ngang; khối "Head đóng · bản chốt cuối: An = 0", biên lai "An = 100" cạnh đó, kính lúp so hai bên, vòng đỏ khoanh chỗ lệch. Con mắt canh gác gửi biên lai và 5 ADA tới ô "thách thức". Camera đẩy xuống ba két, ba két cùng bị khoá đỏ, bảng rung. Đoạn ví dụ: thẻ quầy khiếu nại với đơn và biên lai.',
		sound='Gió lướt khi camera đẩy; trầm khi khoá.',
	),
	'07': dict(
		title='Bốn mươi tám giờ để trả lời',
		board=['48 giờ', '100 ADA vẫn còn trong bản chốt cuối', 'giao dịch có chữ ký của An', 'mở khoá · 5 ADA cọc → node trả lời', 'Ví dụ: hai ngày trình chứng từ'],
		lines=[
			'Các "node" có bốn mươi tám giờ để trả lời, bằng một trong hai cách.',
			'Cách thứ nhất là chứng minh một trăm "ADA" vẫn còn trong bản chốt cuối, tức An vẫn sẽ nhận lại tiền.',
			'Cách thứ hai là đưa ra giao dịch có chữ ký của An chuyển khoản tiền đó đi, tức chính An đã tiêu.',
			'Nếu trả lời hợp lệ, tiền ký quỹ được gỡ khoá, và năm "ADA" đặt cọc được trả cho "node" đó.',
			'Ví dụ, ba thủ quỹ có bốn mươi tám giờ để trình chứng từ hợp lệ.',
			'Hoặc chỉ ra tiền vẫn nằm trong sổ, hoặc đưa ra giấy rút tiền có chữ ký của chính An.',
		],
		example=(4, 5),
		screen='Đồng hồ cát và số đếm 48 giờ lùi dần. Hai nhánh: trái "100 ADA vẫn còn trong bản chốt cuối", phải "giao dịch có chữ ký của An". Hai nhánh hội về dấu tích, khung đỏ quanh ký quỹ tan đi; chấm vàng "5 ADA" chạy sang node đã trả lời. Đoạn ví dụ: thẻ cuốn sổ và tờ giấy rút tiền có chữ ký.',
		sound='Tick theo đồng hồ; chuông khi mở khoá.',
	),
	'08': dict(
		title='Không ai trả lời được',
		board=['hết 48 giờ', 'đền An 100 ADA', 'thưởng người phát hiện', 'trả lại 5 ADA cọc', 'quỹ bảo hiểm', 'Ví dụ: tiền cọc trả cho An trước'],
		lines=[
			'Nếu hết bốn mươi tám giờ mà không ai trả lời được, vi phạm được xác lập, và hợp đồng tự phạt tiền ký quỹ.',
			'Tiền phạt chia theo thứ tự. Trước hết đền An đủ một trăm "ADA", kế đến thưởng người phát hiện và hoàn tiền đặt cọc.',
			'Phần còn lại chuyển vào quỹ bảo hiểm, để bù cho những vụ sau không đủ ký quỹ.',
			'Ví dụ, không ai trình được chứng từ, nên tiền cọc của ba thủ quỹ được dùng để trả lại cho An trước tiên.',
		],
		example=(3, 3),
		screen='Số đếm về 0, chữ đỏ "hết 48 giờ"; ba két nứt, bảng rung. Từ két, chấm vàng chạy lần lượt tới An ("đền 100 ADA"), con mắt canh gác ("thưởng", "trả lại 5 ADA cọc"), quỹ bảo hiểm. Đoạn ví dụ: thẻ phong bì tiền cọc trao cho An.',
		sound='Trầm khi phạt; click mỗi chấm tiền; chuông khi tiền vào quỹ.',
	),
	'09': dict(
		title='Vì sao phạt cả ba là công bằng',
		board=['Vì sao phạt cả ba?', 'bản chốt cuối có 3 chữ ký', 'node trung thực: dữ liệu đã lưu', 'gian lận hoặc làm mất dữ liệu', 'Ví dụ: thủ quỹ trung thực giữ sổ sách'],
		lines=[
			'Vì sao phạt cả ba "node" lại là công bằng?',
			'Bản chốt cuối có chữ ký của cả ba. Nếu có một "node" trung thực, nó đã không ký bản chốt lấy tiền của An.',
			'"Node" trung thực cũng luôn trả lời được trong bốn mươi tám giờ, vì nó lưu đủ dữ liệu của "Head".',
			'"Node" nào không trả lời được thì hoặc đã tham gia gian lận, hoặc đã làm mất dữ liệu mà nó phải giữ.',
			'Ví dụ, thủ quỹ trung thực sẽ không ký lệnh chi sai, và luôn giữ sổ sách để tự bảo vệ mình.',
		],
		example=(4, 4),
		screen='Tờ bản chốt cuối ở trên, ba chữ ký nối xuống ba node X, Y, Z. Focus node Z: cuốn sổ "dữ liệu đã lưu", chấm xanh lá chạy từ sổ lên "trả lời". Focus X và Y, khoanh đỏ. Đoạn ví dụ: thẻ thủ quỹ ôm sổ sách.',
		sound='Gió lướt khi focus đổi; strike khi khoanh đỏ.',
	),
	'10': dict(
		title='Điểm mấu chốt: gian lận không có lời',
		board=['tổng ký quỹ', 'tiền trong Head', '≥', 'gian lận không có lời', 'Ví dụ: giữ hộ 100 triệu, cọc 120 triệu', 'huy hiệu', 'giảm ký quỹ thành viên'],
		lines=[
			'Điểm mấu chốt là so sánh tổng tiền ký quỹ với tổng số tiền đang có trong "Head".',
			'Nếu ký quỹ lớn hơn hoặc bằng tiền trong "Head", họ có lấy hết cũng bị phạt ít nhất ngần ấy, nên gian lận không có lời.',
			'Ví dụ, một người giữ hộ một trăm triệu nhưng đã đặt cọc một trăm hai mươi triệu. Ôm tiền bỏ trốn thì chỉ thiệt thêm.',
			'"Trust Center" gắn huy hiệu riêng cho những "Head" như vậy. Các "Head" này được ưu tiên hiển thị và được chia phí cao hơn.',
			'Nhà cung cấp giữ uy tín cao trong thời gian dài, không dính vụ gian lận nào, cũng được giảm ký quỹ thành viên.',
			'Khi ký quỹ thấp hơn tiền trong "Head", "Trust Center" vẫn hiển thị con số thật, và khoản đền bị giới hạn theo tỷ lệ.',
		],
		example=(2, 2),
		screen='Hai cột khối: trái "tổng ký quỹ" (vàng, dâng dần), phải "tiền trong Head" (xanh). Cột trái vượt cột phải, dấu "≥" xanh lá, nhãn "gian lận không có lời". Đoạn ví dụ: thẻ "giữ hộ 100 triệu, cọc 120 triệu". Huy hiệu xanh lá bật ra; thẻ "giảm ký quỹ thành viên"; cuối cảnh cột trái hạ xuống thấp hơn, huy hiệu mờ.',
		sound='Tick khi khối hiện; chuông khi huy hiệu hiện.',
	),
	'11': dict(
		title='Những chỗ còn hạn chế',
		board=['đóng Head', '~6–12 giờ', 'dịch vụ canh gác tự động', 'Ví dụ: người trông nhà thức cả đêm', 'chỉ tiền đứng tên ví cá nhân', 'tiền đứng tên nhà vận hành'],
		lines=[
			'Cơ chế này vẫn có giới hạn. Sau khi "Head" đóng, chỉ còn khoảng sáu đến mười hai giờ để mở thách thức.',
			'Người chơi không thể tự canh liên tục, nên cần dịch vụ canh gác tự động, và ai cũng có thể tự chạy dịch vụ này.',
			'Ví dụ, thời hạn khiếu nại rất ngắn, nên cần một người trông nhà thức cả ngày lẫn đêm.',
			'Cơ chế cũng chỉ bảo vệ tiền đứng tên ví cá nhân. Tiền nằm trong hợp đồng của "game" cần quy tắc riêng cho từng "game".',
			'Và nếu "game" để tiền người chơi đứng tên nhà vận hành, cơ chế này bảo vệ nhà vận hành, chứ không bảo vệ trực tiếp người chơi.',
		],
		example=(2, 2),
		screen='Trục thời gian, mốc "đóng Head", vùng vàng "~6–12 giờ"; nhiều con mắt canh gác bật ra so le. Đoạn ví dụ: thẻ người trông nhà và mặt trăng. Lau theo vệt; hai thẻ "chỉ tiền đứng tên ví cá nhân" và "tiền đứng tên nhà vận hành", thẻ nào được nhắc thì sáng.',
		sound='Tick mỗi con mắt; lau bảng.',
	),
	'13': dict(
		title='Kết',
		board=['biên lai → bằng chứng', 'ký quỹ → tiền đền', 'hợp đồng → tự phạt', 'Trust Center', 'Thực hiện cùng VTechcom Labs'],
		lines=[
			'Tóm lại, biên lai cho An bằng chứng, ký quỹ có sẵn tiền đền, và hợp đồng tự phạt, không cần ai đứng ra phán xử.',
			'Hẹn gặp lại ở tập sau.',
		],
		example=None,
		screen='Ba dòng tóm tắt bật ra so le. Lau theo vệt; "Trust Center" bật ra giữa bảng, gạch chân xanh; dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc.',
		sound='Chuông; nền nhỏ dần.',
	),
}

ORDER = list(SCRIPT)

# Thuật ngữ tiếng Anh đọc nguyên văn, đặt trong nháy kép; không phiên âm qua tu-dien-doc.md
READ_MODE = 'quote'

# Ước lượng: VieNeu khoảng 4–5 âm tiết/giây; nghỉ 0,5 s giữa câu, 1,2 s giữa cảnh.
SYL_PER_SEC = 4.2
PAUSE_LINE, PAUSE_SCENE = 0.5, 1.2


def estimate(scene):
	syl = sum(lexicon.syllables(l, phonetic=False) for l in scene['lines'])
	return syl, syl / SYL_PER_SEC + PAUSE_LINE * len(scene['lines']) + PAUSE_SCENE


def write_review(path=HERE / 'kich-ban.md'):
	esc = lambda s: s.replace('|', '\\|')
	out = [(HERE / 'brief.md').read_text(encoding='utf-8').rstrip(), '', '## Kịch bản', '']
	out.append('Không có phụ đề chạy; cột "Chữ trên bảng" là chữ được viết lên bảng trong cảnh. Thuật ngữ tiếng Anh trong nháy kép được đọc nguyên văn; số âm tiết đếm theo từ.')
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
		counts = '<br>'.join(str(lexicon.syllables(l, phonetic=False)) for l in s['lines'])
		board = '<br>'.join(f'`{esc(b)}`' for b in s['board'])
		out.append(f"| **{sid}. {s['title']}**<br>~{sec:.0f} giây | {board} | {lines} | {counts} | {esc(s['screen'])} | {esc(s['sound'])} |")
	out += ['', f'**Tổng:** {sum(len(SCRIPT[s]["lines"]) for s in ORDER)} câu, {total_syl} âm tiết, ước lượng khoảng {total_sec // 60:.0f} phút {total_sec % 60:.0f} giây (tính {SYL_PER_SEC} âm tiết/giây, cộng nghỉ giữa câu và giữa cảnh).', '']
	path.write_text('\n'.join(out), encoding='utf-8')
	return total_syl, total_sec


if __name__ == '__main__':
	syl, sec = write_review()
	print(f'kich-ban.md: {syl} am tiet, ~{sec:.0f}s')
