"""Tập 12 — Bảo mật cho người dùng mới, phần 2: trang giả, ký mù và token lạ. Nguồn duy nhất cho hình, giọng và bảng duyệt.

Chạy `python script.py` để xuất lại kich-ban.md.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'shared'))
import lexicon  # noqa: E402

# Mỗi cảnh: board = chữ được viết lên bảng (không phải phụ đề),
# lines = lời đọc (mỗi phần tử là một clip giọng), screen = hình, sound = âm thanh.
# Màu nhấn: món tiền vàng phấn, chìa và cụm từ đỏ phấn, địa chỉ xanh phấn,
# token thường xanh lá phấn, mã chính sách cam phấn (như tập 8), cảnh báo hồng phấn.
# Tên miền trên bảng luôn dùng đuôi .example (RFC 2606), không vẽ logo hay giao diện thật.
SCRIPT = {
	'01': dict(
		title='Mở đầu',
		board=['Ai hỏi cụm từ → lừa đảo', 'Còn lối nào khác?'],
		lines=[
			'Ở tập bốn, ta đã chốt một điều, ai hỏi cụm từ khôi phục thì hãy coi đó là lừa đảo.',
			'Nhưng kẻ gian không nhất thiết phải hỏi. Họ có thể dựng một trang giả để bạn tự gõ cụm từ vào.',
			'Hoặc khéo hơn, họ lừa bạn tự dùng chiếc chìa của mình để ký một giao dịch có lợi cho họ.',
			'Hôm nay ta xem ba mối nguy như vậy, và những thói quen nhỏ giúp bạn tránh được chúng.',
		],
		screen='Câu "Ai hỏi cụm từ → lừa đảo" của tập 4 viết lại ở trên. Chiếc ví phấn giữa bảng, chìa đỏ nằm trong ví. Hai mũi tên hồng vòng qua bên cạnh ví: một tới ô "nhập cụm từ" (lưới 24 ô đỏ, chữ làm mờ), một tới tờ giấy chờ đóng dấu. Chữ "Còn lối nào khác?" viết chậm.',
		sound='Nền vào dần. Tiếng phấn. Một nốt trầm ngắn khi hai mũi tên hồng hiện ra.',
	),
	'02': dict(
		title='Ba mối nguy',
		board=['1. Trang giả mạo', '2. Ký mà không đọc', '3. Token lạ', 'Tình huống → Dấu hiệu → Thói quen'],
		lines=[
			'Thứ nhất là trang giả mạo. Thứ hai là ký mà không đọc. Thứ ba là những token lạ tự xuất hiện trong ví.',
			'Với mỗi mối nguy, ta đi qua một tình huống, vài dấu hiệu nhận biết, và một thói quen phòng tránh.',
			'Cả ba đều nhắm vào cùng một khoảnh khắc, đó là lúc bạn gõ cụm từ hoặc bấm nút ký.',
		],
		screen='Ba ô cửa phấn xếp hàng ngang, mỗi ô một nhãn. Dòng nhịp "Tình huống → Dấu hiệu → Thói quen" viết bên dưới; dòng này thu nhỏ về góc trên và giữ cố định trong cảnh 03–10, bước đang nói được tô sáng.',
		sound='Ba tiếng tick khi ba ô cửa hiện; tiếng phấn cho dòng nhịp.',
	),
	'03': dict(
		title='Trang giả mạo: tình huống',
		board=['Kết quả tìm kiếm', 'Quảng cáo · vi-cua-an-app.example', '"Nhập cụm từ để đồng bộ ví"'],
		lines=[
			'Hãy bắt đầu với An. An muốn cài một chiếc ví mới, nên gõ tên ví lên công cụ tìm kiếm.',
			'Kết quả đầu tiên trông rất đúng, nhưng thật ra là một quảng cáo do người khác trả tiền đặt lên.',
			'Trang mở ra giống hệt trang thật, rồi xin An nhập cụm từ khôi phục để đồng bộ ví.',
			'Chỉ cần An gõ đủ các từ, người dựng trang đã có trong tay toàn bộ chùm chìa khoá của An.',
		],
		screen='Khung trình duyệt vẽ phấn. Danh sách kết quả tìm kiếm, dòng đầu có nhãn nhỏ "Quảng cáo" và tên miền "vi-cua-an-app.example". Bấm vào: trang ví hư cấu (không logo thật) có lưới 24 ô đỏ, chữ làm mờ. Khi lưới điền xong, chùm chìa đỏ bay khỏi ví của An sang một bàn tay lạ.',
		sound='Tiếng gõ phím nhẹ; tiếng click; tiếng phấn viết nhanh theo từng ô; nốt trầm khi chùm chìa bay đi.',
	),
	'04': dict(
		title='Trang giả mạo: dấu hiệu và thói quen',
		board=['vi-cua-an.example', 'vi-cua-an-app.example', 'Ổ khoá trình duyệt ≠ trang thật', 'Tải từ trang chính thức · Lưu dấu trang'],
		lines=[
			'Vậy đâu là dấu hiệu? Tên miền chỉ lệch một chữ, và trang thường đến từ quảng cáo hay tin nhắn lạ.',
			'Biểu tượng ổ khoá trên trình duyệt chỉ cho biết đường truyền được mã hoá, không cho biết trang là thật.',
			'Thói quen ở đây khá đơn giản. Tải ví từ trang chính thức, lưu dấu trang, rồi lần sau mở từ dấu trang ấy.',
			'Và như tập bốn đã nói, trang nào xin cụm từ khôi phục thì bạn dừng lại ngay.',
		],
		screen='Hai tên miền viết chồng lên nhau, phần "-app" khoanh hồng. Biểu tượng ổ khoá nhỏ của thanh địa chỉ trình duyệt, cạnh đó một dấu hỏi hồng. Bên phải: ngôi sao dấu trang, mũi tên từ ngôi sao tới tên miền thật. Cuối cảnh, ô "nhập cụm từ" bị đóng dấu "Dừng".',
		sound='Tiếng phấn; tiếng khoanh tròn; tiếng đóng dấu ở câu cuối.',
	),
	'05': dict(
		title='Bấm "kết nối ví" là cho phép gì?',
		board=['Trang web ↔ Ví (CIP-30)', 'Xem: địa chỉ · số dư · món tiền', 'Xin ký: có', 'Lấy chìa: không'],
		lines=[
			'Nhiều trang web ứng dụng có nút kết nối ví. Khi bạn bấm, ví sẽ hỏi bạn có đồng ý hay không.',
			'Đồng ý rồi, trang xem được địa chỉ, số dư và các món tiền của bạn, đồng thời được quyền xin bạn ký.',
			'Nhưng chiếc chìa vẫn nằm trong ví. Theo chuẩn CIP-30, trang chỉ nhận về chữ ký, chuẩn này không có lối nào để lấy chìa.',
			'Vì vậy, thứ bạn cần canh chính là từng lần trang web xin ký.',
		],
		screen='Bên trái khung trang web (nhãn nhỏ "dApp"), bên phải chiếc ví. Một sợi dây phấn nối hai bên. Qua dây lần lượt đi sang trang web: địa chỉ xanh, đồng ADA và ô món tiền vàng. Một tờ giấy chờ đóng dấu đi theo chiều ngược lại vào ví. Chìa đỏ trong ví có vòng khoá, chạm vào dây thì bật lại. Bên dưới: "Xin ký" kèm dấu tích vẽ bằng nét, "Lấy chìa" kèm dấu chéo vẽ bằng nét.',
		sound='Tiếng "cạch" khi dây nối; tick nhẹ mỗi khi một món đi qua dây; tiếng bật nhẹ khi chìa không qua được.',
	),
	'06': dict(
		title='Ký vội và ký mù: tình huống',
		board=['"Nhận thưởng: bấm ký"', 'Ký vội: ví hiện, mình không đọc', 'Ký mù (blind signing): ví không đọc được'],
		lines=[
			'Quay lại với An. Một trang web mời An nhận thưởng, chỉ cần bấm ký là xong.',
			'Ví đã hiện giao dịch, nhưng An không đọc mà bấm đồng ý luôn. Ta gọi đó là ký vội.',
			'Giao dịch ấy thật ra tiêu các món tiền của An, rồi tạo ra món mới khoá bằng địa chỉ của người lạ.',
			'Còn có trường hợp ví báo không đọc được giao dịch, mà An vẫn ký. Đó gọi là ký mù.',
			'Dù vội hay mù, một khi giao dịch đã được mạng ghi nhận thì không ai đảo ngược được.',
		],
		screen='Cửa sổ xin ký hiện trên trang "Nhận thưởng"; chìa đỏ đóng dấu lên tờ giấy thật nhanh. Lật tờ giấy ra mặt sau: cột đầu vào là các ô món tiền vàng của An, cột đầu ra là một địa chỉ lạ viền hồng; các ô vàng trượt sang phía địa chỉ lạ. Khung nhỏ thứ hai: cửa sổ xin ký chỉ có chuỗi ký tự lộn xộn và dòng "Không đọc được giao dịch", chìa vẫn đóng dấu.',
		sound='Tiếng đóng dấu nhanh; tiếng giấy lật; tiếng tick nhanh khi tiền trượt đi; nốt trầm ở câu cuối.',
	),
	'07': dict(
		title='Giao dịch nói rõ tiền đi đâu',
		board=['Đầu vào: món nào bị tiêu', 'Đầu ra: món mới · địa chỉ nhận', 'Phí'],
		lines=[
			'Tin vui là trên Cardano, giao dịch nói rất rõ tiền đi đâu, ngay từ trước khi bạn ký.',
			'Như ở tập một, phía đầu vào gọi đích danh những món tiền sẽ bị tiêu.',
			'Phía đầu ra là những món tiền mới, món nào cũng mang ổ khoá, tức là địa chỉ của người nhận.',
			'Ví biết rõ các món tiền của chính nó, nên nhiều ví có thể cho bạn xem trước toàn bộ.',
			'Mỗi ví hiển thị một khác, nên bạn hãy tìm hiểu xem ví của mình hiện những gì.',
		],
		screen='Tờ giấy chờ đóng dấu phóng to, chia hai cột như cảnh 08 tập 1: đầu vào là các ô món tiền vàng mang tên riêng "…#0", đầu ra là các ô mới mỗi ô kèm một địa chỉ xanh, dòng "Phí" nhỏ ở dưới. Một mũi tên từ tờ giấy chỉ vào cửa sổ ví, cửa sổ ví điền lại đúng hai cột đó.',
		sound='Tiếng phấn theo từng cột; nốt chuông khi cửa sổ ví điền xong.',
	),
	'08': dict(
		title='Đọc trước khi ký: dấu hiệu và thói quen',
		board=['Rời ví nhiều hơn dự định', 'Địa chỉ nhận lạ', 'Token rời ví ngoài ý muốn', '"Chỉ còn 5 phút!"', 'Ví báo không đọc được', 'Từ chối: không mất phí'],
		lines=[
			'Mỗi khi cửa sổ xin ký hiện lên, bạn hãy để ý mấy dấu hiệu sau.',
			'Số tiền rời ví lớn hơn điều bạn định làm, hoặc có một địa chỉ nhận mà bạn không hề biết.',
			'Có token rời ví mà bạn không định gửi, trang giục bạn chỉ còn vài phút, hoặc ví báo không đọc được giao dịch.',
			'Thói quen phòng tránh là đọc từng đầu ra trước khi ký. Không đọc được hay không hiểu thì đừng ký.',
			'Từ chối ký không làm bạn mất gì cả, không mất tiền và cũng không mất phí.',
		],
		screen='Cửa sổ xin ký của cảnh 07 ở giữa; năm dấu hiệu hiện lần lượt quanh cửa sổ, mỗi dấu hiệu một mũi tên hồng chỉ vào đúng chỗ trong cửa sổ. Một đồng hồ đếm ngược bị gạch. Cuối cảnh, nút "Từ chối" được khoanh, cạnh dòng "Từ chối: không mất phí".',
		sound='Một tiếng tick cho mỗi dấu hiệu; tiếng gạch phấn; nốt chuông nhẹ ở câu cuối.',
	),
	'09': dict(
		title='Kiểm tra địa chỉ nhận',
		board=['addr1q… phần đầu giống nhau', 'So đoạn giữa · đoạn cuối', 'Địa chỉ mới: gửi thử khoản nhỏ'],
		lines=[
			'Còn khi chính bạn gửi tiền đi, đầu ra quan trọng nhất là địa chỉ của người nhận.',
			'Địa chỉ ví thông thường có chung phần đầu, nên chỉ nhìn vài ký tự đầu thì chưa đủ.',
			'Hãy so thêm một đoạn ở giữa và đoạn cuối với đúng nơi bạn lấy địa chỉ.',
			'Lần đầu gửi tới một địa chỉ mới, hãy thử một khoản nhỏ trước, vì tiền đã gửi thì không gọi lại được.',
		],
		screen='Hai chuỗi "addr1q…" xanh xếp chồng (chuỗi minh hoạ, không phải địa chỉ thật). Phần đầu giống hệt nhau mờ dần; khung tròn quanh một đoạn giữa và đoạn cuối, một chỗ khác nhau sáng lên hồng. Bên dưới: một ô món tiền vàng nhỏ đi trước tới địa chỉ, dấu tích vẽ bằng nét, rồi ô lớn mới đi theo.',
		sound='Tiếng phấn; tiếng khoanh tròn; tick khi món nhỏ tới nơi; chuông khi món lớn đi.',
	),
	'10': dict(
		title='Token lạ trong ví',
		board=['Token lạ = tờ tiền lạ trong phong bì', 'Không tự tiêu được tiền', 'Thật hay giả: xem mã chính sách', 'Lờ đi · không mở đường dẫn'],
		lines=[
			'Mối nguy thứ ba đến khá lặng lẽ. Một ngày, trong ví An có một token lạ mà An chưa từng mua.',
			'Tên của nó là một lời mời, rằng hãy ghé một trang web để nhận thưởng.',
			'Như chiếc phong bì ở tập một, token chỉ là một tờ tiền lạ nằm trong món tiền, không có chương trình nào chạy kèm.',
			'Vì vậy, tự nó không tiêu được tiền của bạn. Rủi ro chỉ bắt đầu khi bạn theo lời mời, kết nối ví và ký.',
			'Tên token thì ai cũng đặt được, nên muốn biết thật giả hãy xem mã chính sách. Còn token lạ thì cứ lờ đi.',
		],
		screen='Phong bì vàng phấn của tập 1 mở ra, bên trong đồng ADA và các tờ xanh lá quen thuộc; thêm một tờ xanh lá lạ, viền hồng, trên tờ ghi "Nhận thưởng tại …example". Góc mỗi tờ có dấu vân tay cam (mã chính sách, như tập 8); dấu vân tay của tờ lạ khác hẳn tờ quen dù tên gần giống. Mũi tên từ tờ lạ dẫn ngược về hình thu nhỏ của cảnh 03 và cảnh 06, bị gạch chéo.',
		sound='Tiếng giấy mở phong bì; nốt trầm khi tờ lạ hiện; tiếng gạch phấn ở câu cuối.',
	),
	'11': dict(
		title='Ví phần cứng',
		board=['Ví phần cứng (hardware wallet)', 'Chìa ở trong thiết bị', 'Xem trên màn hình thiết bị · bấm nút', 'Vẫn phải đọc · vẫn giấu cụm từ'],
		lines=[
			'Nếu bạn giữ nhiều tiền, có thêm một lớp bảo vệ đáng cân nhắc, đó là ví phần cứng.',
			'Chìa nằm trong một thiết bị riêng, không nằm trên chiếc máy tính có thể đã bị nhiễm mã độc.',
			'Máy tính chỉ gửi giao dịch vào. Thiết bị hiện nó trên màn hình riêng, và chỉ ký khi bạn bấm nút xác nhận.',
			'Nhưng bạn đồng ý một giao dịch xấu thì nó vẫn ký, và cụm từ khôi phục của nó vẫn phải giấu thật kỹ.',
		],
		screen='Một thiết bị phấn nhỏ hình chữ nhật có màn hình và hai nút, không theo mẫu của hãng nào. Chìa đỏ nằm bên trong thiết bị. Từ máy tính, tờ giấy chờ đóng dấu đi vào thiết bị; màn hình thiết bị hiện một địa chỉ xanh và một số ADA; ngón tay bấm nút xác nhận, con dấu đóng bên trong thiết bị. Khung nhỏ: màn hình thiết bị hiện cảnh báo hồng "Không đọc được giao dịch".',
		sound='Tiếng "tách" khi cắm thiết bị; tiếng bấm nút; tiếng đóng dấu nhỏ, nghe như vọng từ bên trong.',
	),
	'12': dict(
		title='Hiện rõ giao dịch trước khi xin ký — cho lập trình viên',
		board=[
			"import { Deserializer } from '@hydra-sdk/core'",
			'const tx = Deserializer.deserializeTx(txCbor)',
			'const body = tx.body()',
			'body.inputs()    // chỉ txHash#index',
			'body.outputs()   // địa chỉ · số tiền · token',
			'body.fee()',
			'out.address().to_bech32()',
			'out.amount().coin().to_str()',
			'tx.free()',
		],
		lines=[
			'Phần này dành cho lập trình viên. Ứng dụng của bạn nên cho người dùng đọc giao dịch trước khi đưa sang ví.',
			'Trong gói core của hydra-sdk có sẵn hàm mở giao dịch ra để đọc đầu vào, đầu ra và phí.',
			'Lưu ý là giao dịch chỉ ghi tên riêng của món tiền đầu vào, không ghi số tiền hay địa chỉ của nó.',
			'Muốn hiện số tiền ở đầu vào và đánh dấu tiền thối, ứng dụng tự tra các món tiền đã có, rồi so địa chỉ với ví mình.',
			'Đừng cộng mọi đầu ra làm số tiền gửi đi, và nhớ giải phóng bộ nhớ của giao dịch sau khi đọc xong.',
		],
		screen='Đoạn code viết tay bằng phấn, từng dòng hiện theo lời đọc. Dòng "body.inputs()" có chú thích "chỉ txHash#index", nối mũi tên tới một ô món tiền vàng lấy từ danh sách món tiền của ví. Bên phải là cửa sổ xin ký được điền từ code: đầu ra tiền thối có nhãn "về ví mình". Dòng "tx.free()" gạch chân. Nhãn góc "Code rút gọn" và "@hydra-sdk/core", không đọc thành lời.',
		sound='Tiếng gõ phấn nhanh theo từng dòng code; nốt chuông khi cửa sổ xin ký điền xong.',
	),
	'13': dict(
		title='Xin ký, và chấp nhận lời từ chối — cho lập trình viên',
		board=[
			"import { WalletBridgeClient, WalletBridgeUserRejectedError } from '@hydra-sdk/app-bridge'",
			"const client = new WalletBridgeClient({ appCenterOrigin: 'https://app.example' })",
			'try {',
			'  const witness = await client.signTx(txHex)   // chữ ký, không phải chìa',
			'} catch (e) {',
			'  if (e instanceof WalletBridgeUserRejectedError) { /* người dùng từ chối */ }',
			'}',
		],
		lines=[
			'Nếu ứng dụng tự giữ chìa, bạn ký bằng AppWallet như ở tập bốn.',
			'Còn ứng dụng chạy trên trình duyệt thì xin ví của người dùng ký qua chuẩn CIP-30, và chỉ nhận về chữ ký.',
			'Với trang web chạy trong khung nhúng, gói app-bridge của hydra-sdk chuyển lời xin ký này lên trang chủ.',
			'Hãy khai báo đúng nguồn mà bạn tin, đừng để mặc định nhận lời từ mọi nguồn.',
			'Và hãy coi việc người dùng từ chối ký là chuyện bình thường, ứng dụng xử lý êm rồi để họ thử lại.',
		],
		screen='Góc trái trên: dòng nhỏ "AppWallet.signTx(...)" kèm chìa đỏ trong ứng dụng (gợi lại tập 4). Giữa bảng: code app-bridge viết theo đúng thứ tự chạy, khởi tạo client, rồi try, rồi catch. "appCenterOrigin" khoanh xanh; nhánh catch có hình nút "Từ chối" nhỏ. Bên phải: khung trang chủ chứa một khung nhúng, mũi tên xin ký đi từ khung nhúng lên trang chủ rồi sang ví, mũi tên chữ ký quay về. Nhãn nhỏ "@hydra-sdk/app-bridge 0.1.0" và "Code rút gọn", không đọc thành lời.',
		sound='Tiếng gõ phấn theo từng dòng; tick khi chữ ký quay về.',
	),
	'14': dict(
		title='Tóm tắt và lời kết',
		board=['1. Mở từ dấu trang · trang hỏi cụm từ thì dừng', '2. Đọc tiền đi đâu trước khi ký', '3. Token lạ: lờ đi', 'hydrasdk.com', 'Thực hiện cùng VTechcom Labs'],
		lines=[
			'Tóm lại, qua tập này bạn chỉ cần nhớ ba ý chính.',
			'Thứ nhất, mở ví và trang quen từ dấu trang. Trang nào hỏi cụm từ khôi phục thì dừng lại.',
			'Thứ hai, đọc xem tiền đi đâu trước khi ký. Không đọc được hay không hiểu thì đừng ký.',
			'Thứ ba, token lạ trong ví là mồi câu. Cứ lờ nó đi và đừng mở đường dẫn ghi trên đó.',
			'Bạn có thể xem thêm tài liệu và ví dụ tại hydrasdk.com.',
		],
		screen='Ba ý viết lần lượt, ý hai gạch chân hồng, mỗi ý kèm biểu tượng nhỏ (ngôi sao dấu trang, cửa sổ xin ký, tờ tiền lạ). Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" kèm logo ở góc dưới phải, không đọc thành lời.',
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
