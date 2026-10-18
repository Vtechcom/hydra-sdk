"""Tập 8 — Token và NFT trên Cardano: tờ tiền lạ trong phong bì. Nguồn duy nhất cho hình, giọng và bảng duyệt.

Chạy `python script.py` để xuất lại kich-ban.md.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'shared'))
import lexicon  # noqa: E402

# Mỗi cảnh: board = chữ được viết lên bảng (không phải phụ đề),
# lines = lời đọc (mỗi phần tử là một clip giọng), screen = hình, sound = âm thanh.
# Quán cà phê, token DIEM, NFT SangLap01 và mọi mã rút gọn (a3f9…7c) là ví dụ minh hoạ, không có trên mạng.
CODE_LABEL = 'Code rút gọn, bản đầy đủ ở hydrasdk.com'

SCRIPT = {
	'01': dict(
		title='Mở đầu',
		board=['ADA tối thiểu', 'Ai in ra?', 'Vì sao chỉ một bản?'],
		lines=[
			'Ở tập trước, ta thấy mỗi món tiền phải giữ một lượng ADA tối thiểu, tuỳ theo kích thước của nó.',
			'Một món tiền to ra khi nó chứa thêm token, như chiếc phong bì đựng nhiều loại tiền ở tập một.',
			'Nhưng những tờ tiền lạ trong phong bì ấy do ai in ra? Và vì sao có tờ chỉ có đúng một bản?',
		],
		screen='Ô vàng của tập 7 với vạch đáy "tối thiểu" hiện thoáng qua rồi biến thành chiếc phong bì vàng phấn của tập 1. Phong bì mở ra: một đồng ADA vàng, vài tờ xanh lá và một tờ tím. Hai dòng "Ai in ra?" và "Vì sao chỉ một bản?" viết dưới; dấu chấm hỏi lớn trên tờ tím.',
		sound='Nền vào dần. Tiếng giấy mở phong bì (nhiễu lọc ngắn); tiếng phấn.',
	),
	'02': dict(
		title='Token không cần hợp đồng riêng',
		board=['Ethereum: token = hợp đồng + sổ riêng', 'Cardano: token nằm trong món tiền'],
		lines=[
			'Ở Ethereum, một token thường là một hợp đồng thông minh, giữ cuốn sổ riêng ghi ai có bao nhiêu.',
			'Mỗi lần chuyển token là một lần gọi hợp đồng ấy, tốn phí và có thể thất bại theo luật của hợp đồng.',
			'Trên Cardano thì khác. Chính sổ cái ghi token ngay trong món tiền, nằm cạnh ADA.',
			'Vì thế, chuyển token giữa các ví cũng là tiêu món cũ, sinh món mới, giống hệt như chuyển ADA.',
		],
		screen='Bảng chia hai cột. Bên trái: một hộp "hợp đồng" ôm cuốn sổ con ghi "An: 5, Bình: 3"; mũi tên "gọi hợp đồng" đi vào hộp. Bên phải: phong bì vàng (ADA + tờ xanh lá) đi qua một giao dịch như tập 1, phong bì cũ bị gạch, phong bì mới hiện ra ở ổ khoá khác. Không có hộp hợp đồng nào bên phải.',
		sound='Tiếng phấn; một tiếng "tick" khi phong bì mới hiện ra.',
	),
	'03': dict(
		title='Ai được in tiền mới?',
		board=['Luật đúc (minting policy)', 'Ai đúc? Khi nào? Bao nhiêu?', 'Cần chữ ký của chủ quán'],
		lines=[
			'Hãy quay lại quán cà phê ở tập một. Quán muốn phát hành điểm tích luỹ cho khách quen.',
			'Trên Cardano, ai cũng tạo được token, nhưng mỗi loại token gắn với một luật đúc riêng.',
			'Luật đúc quy định ai được đúc, đúc khi nào và đúc bao nhiêu. Luật của quán chỉ cần chữ ký của chủ quán.',
			'Mỗi lần có giao dịch đúc hay đốt điểm, luật đúc được kiểm tra. Luật trả lời có thì giao dịch mới hợp lệ.',
		],
		screen='Quầy cà phê phấn nhỏ ở góc. Giữa bảng: con dấu in tiền màu trắng, dưới là tờ "Luật đúc" ghi "Cần chữ ký của chủ quán". Một giao dịch mang chữ ký nhỏ đi qua con dấu; vẽ dấu tích bằng nét. Ba câu hỏi "Ai đúc? Khi nào? Bao nhiêu?" viết cạnh con dấu.',
		sound='Tiếng đóng dấu nhẹ; một tiếng "tick" khi dấu tích hiện.',
	),
	'04': dict(
		title='Mã chính sách và tên token',
		board=['Mã chính sách (policy ID): a3f9…7c', 'Tên token (asset name): DIEM', '56 ký tự', 'Thật giả: nhìn mã chính sách'],
		lines=[
			'Vậy làm sao biết một token thuộc luật đúc nào? Câu trả lời nằm ở mã chính sách.',
			'Mã chính sách là dấu vân tay của luật đúc, dài năm mươi sáu ký tự. Sửa một chữ trong luật là mã đổi hẳn.',
			'Bên cạnh đó là tên token, dùng để phân biệt các loại khác nhau trong cùng một luật đúc.',
			'Hai token chỉ cùng loại khi trùng cả mã chính sách lẫn tên. Kẻ gian đặt trùng tên được, nhưng mã thì không.',
		],
		screen='Tờ token xanh lá phóng to: góc trên có dấu vân tay cam nối bằng mũi tên về con dấu luật đúc, giữa tờ ghi "DIEM". Bảng ghi "a3f9…7c" + "DIEM". Bên cạnh hiện một tờ giả cũng ghi "DIEM" nhưng dấu vân tay khác hình; vẽ dấu chéo bằng nét lên tờ giả.',
		sound='Tiếng phấn; một tiếng trầm ngắn khi tờ giả bị gạch chéo.',
	),
	'05': dict(
		title='Đúc và đốt',
		board=['Phần đúc: +1000 DIEM', 'Đốt: −50 DIEM', 'DIEM: vào + đúc = ra', 'ADA: vào = ra + phí'],
		lines=[
			'Để tạo điểm, quán gửi một giao dịch có thêm một phần riêng, gọi là phần đúc.',
			'Số dương trong phần đúc là đúc thêm. Quán đúc một nghìn điểm, rồi tặng dần cho khách.',
			'Khi khách đổi điểm lấy quà, quán đốt số điểm đó, tức là ghi một số âm vào phần đúc.',
			'Phép cân bằng ở tập một giờ tính riêng từng loại. Với điểm, phần vào cộng phần đúc bằng phần ra.',
			'Còn phí giao dịch thì vẫn luôn được trả bằng ADA, chứ không trả bằng điểm.',
		],
		screen='Một giao dịch phấn có thêm ngăn "phần đúc" màu xanh lá; dòng "+1000 DIEM" viết vào, một xấp tờ xanh lá hiện ra. Sau đó dòng "−50 DIEM": năm mươi điểm cháy thành tro phấn. Cuối cảnh: hai phương trình xếp chồng, dòng vàng "ADA: vào = ra + phí" có đồng phí cam, dòng xanh lá "DIEM: vào + đúc = ra" không có đồng phí.',
		sound='Tiếng đóng dấu khi đúc; tiếng xèo nhỏ (nhiễu lọc) khi đốt; "tick" cho mỗi phương trình.',
	),
	'06': dict(
		title='Token không đi một mình',
		board=['Món tiền có token: cần nhiều ADA tối thiểu hơn', 'Không gửi được token trơn', 'ADA tối thiểu: không phải phí'],
		lines=[
			'Mỗi món tiền mang token đều phải giữ kèm một lượng ADA tối thiểu, như tập trước đã nói.',
			'Món tiền chứa token to hơn món chỉ có ADA, nên lượng tối thiểu ấy cũng cao hơn.',
			'Vì vậy, không gửi được một token trơn. Ví luôn gửi kèm một ít ADA đi cùng token.',
			'Số ADA đó không phải phí. Nó vẫn nằm trong món tiền, và thuộc về người nhận.',
		],
		screen='Hai phong bì xếp hàng qua cửa giao dịch. Phong bì chỉ có tờ xanh lá bị đẩy lại, vẽ dấu chéo bằng nét. Phong bì có thêm đồng ADA vàng thì đi qua, vẽ dấu tích. Vạch đáy "tối thiểu" của tập 7 vẽ cao hơn ở phong bì có token so với phong bì chỉ có ADA. Không ghi con số.',
		sound='Một tiếng trầm ngắn khi bị đẩy lại; "tick" khi đi qua.',
	),
	'07': dict(
		title='Luật đúc làm bằng gì?',
		board=['Luật đơn giản (native script): chữ ký, thời gian', 'Plutus: redeemer + giao dịch', 'Luật đúc: không có datum'],
		lines=[
			'Luật đúc đơn giản nhất chỉ đòi một chữ ký, như luật điểm tích luỹ của quán.',
			'Luật ấy còn ghép thêm được khoá thời gian, giống loại ổ khoá ghép được ở tập năm, không cần viết chương trình.',
			'Khi cần luật phức tạp hơn, luật đúc sẽ là một script viết bằng Plutus.',
			'Script này nhận redeemer và giao dịch. Khác với chiếc két ở tập năm, nó không có datum.',
		],
		screen='Hai con dấu đặt cạnh nhau. Con dấu trái đơn giản, gắn ổ khoá chữ ký và một mặt đồng hồ nhỏ trắng. Con dấu phải có bánh răng trắng như script ở tập 5; tờ đơn hồng phấn (redeemer) và một giao dịch đi vào bánh răng. Dòng nhỏ "Luật đúc: không có datum", tờ ghi chú xanh lam bị gạch nhẹ.',
		sound='Tiếng bánh răng nhỏ; tiếng phấn.',
	),
	'08': dict(
		title='NFT: chỉ một bản',
		board=['NFT', 'SangLap01 × 1', 'Token thường: nhiều đơn vị', 'NFT: đúng một'],
		lines=[
			'Giờ quán muốn làm thêm một thứ đặc biệt, đó là tấm thẻ hội viên sáng lập số không một.',
			'Tấm thẻ này là một NFT. Về kỹ thuật, nó cũng là token, chỉ khác là số lượng đúng bằng một.',
			'Nhưng số lượng một chưa nói hết. Nếu luật đúc vẫn mở, người ký được có thể đúc thêm tấm thứ hai.',
			'Vậy làm sao để người mua tin rằng tấm thẻ này là duy nhất?',
		],
		screen='Tờ tím "SangLap01 × 1" hiện ra cạnh xấp tờ xanh lá "DIEM × 1000". Con dấu luật đúc vẫn đặt bên cạnh; nó in ra thêm một tờ tím thứ hai mờ mờ, kèm dấu hỏi lớn.',
		sound='Một nốt chuông khi tờ tím hiện; tiếng đóng dấu nhỏ, mờ, khi bản thứ hai hiện ra.',
	),
	'09': dict(
		title='Khoá luật sau một mốc',
		board=['Cần chữ ký của quán', 'và chỉ trước mốc thời gian', 'Sau mốc: không đúc, cũng không đốt được'],
		lines=[
			'Cách thường dùng là luật đúc gồm hai điều, cần chữ ký của quán, và chỉ được đúc trước một mốc thời gian.',
			'Qua mốc đó, không ai đúc thêm được dưới mã chính sách này nữa, kể cả chủ quán.',
			'Ai cũng tự kiểm tra được điều này, vì mã chính sách chính là dấu vân tay của luật.',
			'Còn trước mốc, người mua vẫn phải tin là quán sẽ không đúc thêm.',
		],
		screen='Con dấu có mặt đồng hồ trắng. Kim đồng hồ chạy tới vạch "mốc"; qua vạch, một sợi xích phấn quấn quanh con dấu và khoá lại. Dấu vân tay cam trên tờ tím sáng lên. Dòng nhỏ "Sau mốc: không đúc, cũng không đốt được".',
		sound='Tiếng tích tắc nhẹ; tiếng "cạch" khi xích khoá lại.',
	),
	'10': dict(
		title='Một lần duy nhất',
		board=['Plutus: phải tiêu a1b2…f9#0', 'Mỗi món chỉ tiêu một lần', 'Chỉ đúc được một lần'],
		lines=[
			'Muốn khỏi phải tin ai, luật đúc viết bằng Plutus có thể đòi tiêu một món tiền cụ thể mỗi khi đúc.',
			'Ở tập một ta đã thấy, mỗi món tiền chỉ tiêu được đúng một lần.',
			'Vì thế, luật ấy chỉ đúng được một lần trong cả lịch sử, và tấm thẻ không thể có bản thứ hai.',
		],
		screen='Một ô vàng mang tên "a1b2…f9#0" đi vào con dấu bánh răng; ô bị gạch, con dấu in đúng một tờ tím. Lần thử thứ hai: không còn ô "a1b2…f9#0" để tiêu, giao dịch bị đóng dấu "Từ chối" như cảnh 09 tập 1.',
		sound='Tiếng bánh răng; nốt chuông khi tờ tím hiện; một tiếng trầm ngắn khi bị từ chối.',
	),
	'11': dict(
		title='Tên và ảnh của NFT',
		board=['CIP-25: ghi trong giao dịch đúc', 'CIP-68: ghi trong datum', 'token tham chiếu', 'token của khách', 'ảnh: chỉ là đường dẫn'],
		lines=[
			'Một NFT thường kèm tên, lời mô tả và đường dẫn tới ảnh, ghi theo những chuẩn chung.',
			'Cách phổ biến là ghi các thông tin này vào chính giao dịch đúc, để ví và trang tra cứu đọc.',
			'Cách mới hơn cất thông tin vào datum của một món tiền riêng, đi cặp với token mà khách cầm.',
			'Nhờ vậy, script đọc được thông tin đó, và có thể cập nhật nó nếu luật cho phép. Còn tấm ảnh thì thường chỉ là một đường dẫn.',
		],
		screen='Bên trái: một giao dịch đúc kèm tấm thẻ nhỏ "CIP-25: name, image". Bên phải: một ô vàng riêng mang tờ ghi chú xanh lam (datum) và nhãn chữ "token tham chiếu", nối bằng sợi dây phấn tới tờ tím có nhãn "token của khách" trong ví khách. Không ghi số nhãn 100, 222. Dưới cùng: khung tranh rỗng có mũi tên "đường dẫn" trỏ ra ngoài bảng.',
		sound='Tiếng phấn; một tiếng "tick" khi sợi dây nối hai token.',
	),
	'12': dict(
		title='Đúc token — cho lập trình viên',
		board=[
			"import { PolicyUtils, ParserUtils, Serializer } from '@hydra-sdk/core'",
			"import { TxBuilder } from '@hydra-sdk/transaction'",
			'const script = PolicyUtils.buildMintingPolicyScriptFromAddress(addr)',
			'const policyId = PolicyUtils.policyIdFromNativeScript(script)',
			"const assetHex = ParserUtils.stringToHex('DIEM')",
			'new TxBuilder()',
			'  .setInputs(utxos)',
			"  .mint('1000', policyId, assetHex)",
			"  .mintingScript({ type: 'Native', scriptCborHex: script })",
			'  .addOutput({ address: addr, amount: [',
			"    { unit: 'lovelace', quantity: '2000000' },  // dư so với mức tối thiểu",
			"    { unit: Serializer.serializeAssetUnit(policyId, assetHex), quantity: '1000' } ] })",
			'  .changeAddress(addr)',
			'  .complete()',
			CODE_LABEL,
		],
		lines=[
			'Phần này dành cho lập trình viên. Trong hydra-sdk, PolicyUtils dựng luật đúc một chữ ký từ địa chỉ ví.',
			'Cũng PolicyUtils tính ra mã chính sách từ luật đó. Còn tên token thì đổi sang dạng hex trước.',
			'TxBuilder nhận lệnh đúc gồm số lượng, mã chính sách và tên token, kèm chính luật đúc. Số âm là đốt.',
			'Khi dựng giao dịch, TxBuilder kiểm tra luật có khớp mã chính sách không, sai là báo lỗi ngay.',
			'Đầu ra trong ví dụ kèm hai ADA, dư so với lượng tối thiểu.',
		],
		screen='Khung code phấn hiện từng dòng theo lời đọc. Dòng `buildMintingPolicyScriptFromAddress` nối mũi tên tới con dấu luật đúc nhỏ; dòng `policyIdFromNativeScript` nối tới dấu vân tay cam; `stringToHex` gạch chân; `.mint(...)` khoanh tròn, ghi chú phấn "-1000 = đốt"; dòng 2 ADA gắn đồng ADA vàng nhỏ. Góc trên: nhãn "@hydra-sdk/core · @hydra-sdk/transaction". Dòng cuối: "Code rút gọn, bản đầy đủ ở hydrasdk.com".',
		sound='Tiếng gõ phấn nhanh theo từng dòng code; nốt chuông khi `complete()` viết xong.',
	),
	'13': dict(
		title='NFT và metadata — cho lập trình viên',
		board=[
			'// luật có khoá thời gian: dựng ngoài SDK (vd. cardano-cli)',
			'const policyId = PolicyUtils.policyIdFromNativeScript(lockedScriptHex)',
			"const assetHex = ParserUtils.stringToHex('SangLap01')",
			"  .mint('1', policyId, assetHex)",
			"  .mintingScript({ type: 'Native', scriptCborHex: lockedScriptHex })",
			'  .invalidAfter(lockSlot)',
			'  .metadataValue(721, { [policyId]: { [assetHex]: {',
			"    name: 'Thẻ sáng lập 01', image: 'ipfs://…' } } })",
			'Plutus: PlutusUtils.mintingPolicyToId · .mintRedeemerValue(…)',
			CODE_LABEL,
		],
		lines=[
			'Với NFT, ta đúc số lượng một, và gắn thêm thông tin mô tả theo nhãn bảy trăm hai mươi mốt.',
			'Tên hiển thị trong thông tin mô tả viết bằng chữ thường, khác với tên token đã đổi sang hex.',
			'Hiện PolicyUtils chưa dựng được luật có khoá thời gian, nên luật đó phải dựng bằng công cụ khác.',
			'Sau đó, hydra-sdk nhận chuỗi script ấy, tính mã chính sách như trước, và giao dịch đặt hạn hiệu lực trước mốc.',
			'Nếu luật đúc viết bằng Plutus, bạn thêm redeemer cho phần đúc, giống cách mở két ở tập năm.',
		],
		screen='Khung code phấn tiếp nối cảnh 12, các dòng giống cảnh trước mờ đi. Dòng chú thích đầu có biểu tượng đồng hồ nhỏ; `.invalidAfter(lockSlot)` nối mũi tên tới mặt đồng hồ của con dấu ở cảnh 09; `name: \'Thẻ sáng lập 01\'` gạch chân, đặt cạnh `assetHex` có chú thích "hex"; dòng Plutus viết nhỏ ở cuối. Dòng cuối: "Code rút gọn, bản đầy đủ ở hydrasdk.com".',
		sound='Tiếng gõ phấn theo từng dòng; tiếng tích tắc nhẹ ở dòng `invalidAfter`.',
	),
	'14': dict(
		title='Token trong Hydra Head',
		board=['Hydra Head: cùng mô hình eUTxO', 'Token đúc trong Head: đốt trước khi đóng'],
		lines=[
			'Còn trong Hydra Head thì sao? Món tiền mang token nạp vào Head được giao dịch như mọi món tiền khác.',
			'Lý do là Head dùng cùng mô hình eUTxO với mạng chính, nên điểm tích luỹ vẫn đổi chủ được bên trong.',
			'Riêng token đúc mới bên trong Head thì cần được đốt trước khi đóng Head.',
			'Nếu không, Head không kết thúc trọn được, và món tiền mang token đó không trở về mạng chính.',
		],
		screen='Đường kẻ ngang: dưới là Cardano, trên là vòng tròn Hydra Head của tập 2. Phong bì có tờ xanh lá đi lên vào Head, đổi chủ bên trong, rồi đi xuống. Một tờ xanh lá mới được đúc ngay trong Head mang nhãn đỏ phấn "đốt trước khi đóng"; mũi tên đi xuống của nó bị chặn bằng một vạch ngang, vẽ dấu chéo bằng nét.',
		sound='Nền chuyển hợp âm; một tiếng trầm ngắn khi mũi tên bị chặn.',
	),
	'15': dict(
		title='Tóm tắt và lời kết',
		board=['1. Token nằm trong món tiền, cạnh ADA', '2. Mã chính sách = dấu vân tay của luật đúc', '3. NFT: một bản, luật đúc khoá lại', 'hydrasdk.com', 'Thực hiện cùng VTechcom Labs'],
		lines=[
			'Tóm lại, qua tập này bạn chỉ cần nhớ ba ý chính.',
			'Thứ nhất, token nằm ngay trong món tiền, cạnh ADA, và sổ cái tự theo dõi nó.',
			'Thứ hai, mỗi token mang mã chính sách, là dấu vân tay của luật đúc quyết định ai được đúc và đốt.',
			'Thứ ba, NFT là token chỉ có một bản, với luật đúc được khoá lại để không ai đúc thêm.',
			'Bạn có thể xem thêm tài liệu và ví dụ đúc token tại hydrasdk.com.',
		],
		screen='Ba ý viết lần lượt, mỗi ý kèm biểu tượng màu nhấn của nó (phong bì vàng, dấu vân tay cam, tờ tím có xích). Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" kèm logo ở góc dưới phải, không đọc thành lời.',
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
