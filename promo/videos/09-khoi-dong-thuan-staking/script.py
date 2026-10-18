"""Tập 9 — Khối, đồng thuận và staking: ai được ghi sổ Cardano? Nguồn duy nhất cho hình, giọng và bảng duyệt.

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
		title='Mở đầu: trang sổ tiếp theo',
		board=['Sổ chung', 'Trang tiếp theo: ai ghi?', 'Vì sao tin?'],
		lines=[
			'Ở tập tám, mỗi lần đúc hay đốt token đều là một giao dịch phải ghi vào sổ chung.',
			'Còn ở tập hai, ta nói giao dịch được gom vào một khối mới, rồi cả mạng cùng chấp nhận khối đó.',
			'Nhưng cuốn sổ ấy có hàng nghìn máy cùng giữ. Vậy ai được ghi trang tiếp theo?',
			'Và vì sao những máy còn lại lại tin vào trang mà người đó vừa ghi?',
		],
		screen='Một tờ giao dịch đúc token (phong bì có tờ xanh lá của tập 8) đi vào hàng chờ trước cuốn sổ chung trắng phấn của tập 2; quanh sổ là nhiều máy tính nhỏ, mỗi máy giữ một bản. Một trang trống lơ lửng phía trên sổ, dấu hỏi lớn. Dải ô thời gian (hình xuyên suốt) bắt đầu chạy ngang mép dưới bảng.',
		sound='Nền vào dần. Tiếng tích tắc nhẹ theo dải ô thời gian; một tiếng "tick" khi tờ giao dịch vào hàng.',
	),
	'02': dict(
		title='Khối là một trang sổ',
		board=['Khối = một trang sổ', 'Dấu vân tay trang trước'],
		lines=[
			'Hãy bắt đầu từ chữ khối. Một khối giống như một trang sổ, gồm nhiều giao dịch được ghi cùng một lúc.',
			'Mỗi trang lại mang dấu vân tay của trang ngay trước nó, nên các trang nối với nhau thành một chuỗi.',
			'Nếu ai đó lén sửa một trang cũ, dấu vân tay của trang ấy đổi đi, và mọi trang phía sau không còn khớp.',
		],
		screen='Các trang trắng phấn nối thành chuỗi từ trái sang phải; mỗi trang có một ô nhỏ ghi "dấu vân tay trang trước" (hình dấu vân tay như tập 1, tập 4). Một bàn tay phấn sửa một dòng ở trang giữa; ô dấu vân tay của các trang phía sau lần lượt bị gạch bằng dấu chéo vẽ nét.',
		sound='Tiếng "cộp" trầm cho mỗi trang nối vào chuỗi (như tập 2); một tiếng trầm ngắn khi các dấu chéo hiện ra.',
	),
	'03': dict(
		title='Vì sao cần đồng thuận',
		board=['Ba máy, ba trang?', 'Đồng thuận (consensus)', 'Ouroboros'],
		lines=[
			'Vấn đề là máy nào cũng có thể đề xuất một trang. Nếu mỗi máy chọn một trang khác nhau, cuốn sổ sẽ bị tách làm nhiều bản.',
			'Vì vậy mọi máy cần cùng theo một luật chung để chọn ra đúng một trang.',
			'Luật chung ấy gọi là đồng thuận. Trên Cardano, luật đồng thuận có tên là Ouroboros.',
		],
		screen='Ba máy tính, mỗi máy giơ ra một trang khác nhau; cuốn sổ tách làm ba nhánh. Rồi một quyển luật nhỏ hiện ra giữa bảng, ba máy cùng chỉ vào một trang, ba nhánh gộp lại. Chữ "Đồng thuận (consensus)" và "Ouroboros" viết lên bảng, kèm phác nhanh hình con rắn cắn đuôi nhỏ.',
		sound='Ba tiếng "tick" lệch nhịp khi ba trang hiện ra; một nốt chuông khi ba máy cùng chọn một trang.',
	),
	'04': dict(
		title='Đồng hồ của sổ: slot và epoch',
		board=['1 slot = 1 giây', '1 epoch = 432.000 slot = 5 ngày', 'Mạng chính Cardano', '~20 giây / khối'],
		lines=[
			'Để biết đến lượt ai, Cardano chia thời gian thành từng ô nhỏ, mỗi ô gọi là một slot, dài một giây.',
			'Bốn trăm ba mươi hai nghìn slot gom lại thành một epoch, tức là năm ngày trên mạng chính.',
			'Không phải slot nào cũng có khối. Phần lớn các ô để trống, trung bình khoảng hai mươi giây mới có một khối.',
		],
		screen='Dải ô thời gian ở mép dưới phóng to lên giữa bảng; mỗi ô ghi nhỏ "1 giây". Các ô gom thành một cụm dài có ngoặc "1 epoch = 432.000 slot = 5 ngày", chữ nhỏ "mạng chính Cardano". Phần lớn ô trống; thỉnh thoảng một ô rơi ra một trang sổ trắng. Nhãn nhỏ "~20 giây / khối" ở góc.',
		sound='Tích tắc đều theo từng ô; tiếng "cộp" trầm mỗi khi một ô rơi ra trang sổ.',
	),
	'05': dict(
		title='Ai được ghi: stake pool rút thăm',
		board=['Stake pool = máy ghi sổ', 'Stake = lượng ADA đứng sau pool', 'Nhiều stake → dễ trúng hơn'],
		lines=[
			'Người ghi trang sổ là các stake pool, những máy chuyên ghi sổ chạy cả ngày lẫn đêm.',
			'Ví trên điện thoại của bạn không tự tham gia việc này. Chỉ máy của các stake pool mới rút thăm.',
			'Ở mỗi slot, mỗi pool rút thăm một lần. Lượng ADA đứng sau một pool gọi là stake của pool đó.',
			'Stake càng nhiều thì càng có nhiều lá thăm, nên càng dễ trúng, nhưng không pool nào chắc chắn sẽ trúng.',
		],
		screen='Bốn máy pool màu cam phấn đứng thành hàng, mỗi máy có một cột lá thăm cao thấp khác nhau. Đến một ô slot, một máy sáng lên (trúng) và viết một trang sổ. Bên cạnh hàng máy, một chiếc điện thoại có biểu tượng ví đứng ngoài, nối với hàng máy bằng một đường gạch mờ kèm chữ nhỏ "không tự rút thăm". Dòng "Nhiều stake → dễ trúng hơn" viết dưới cùng.',
		sound='Tiếng xào lá thăm nhẹ (nhiễu ngắn) mỗi slot; một nốt chuông nhỏ khi một máy trúng.',
	),
	'06': dict(
		title='Rút thăm kín: Ouroboros Praos',
		board=['Ouroboros Praos', 'Rút thăm kín', 'Bằng chứng trúng (VRF)'],
		lines=[
			'Phiên bản Ouroboros đang chạy trên Cardano có tên là Praos.',
			'Ở Praos, mỗi pool tự rút thăm cho mình và giữ kín kết quả, không ai khác biết trước.',
			'Chỉ khi công bố khối, pool trúng mới đưa ra bằng chứng rằng mình thật sự đã trúng.',
			'Nhờ vậy, kẻ xấu không biết trước pool nào sắp ghi sổ để nhắm vào tấn công.',
		],
		screen='Mỗi máy pool rút thăm sau một tấm bình phong riêng. Một máy bước ra khỏi bình phong, giơ trang sổ kèm một tấm thẻ nhỏ "bằng chứng trúng". Một kẻ đeo mặt nạ đứng ngoài hàng, đầu quay qua quay lại, dấu hỏi trên đầu. Chữ "VRF" chỉ viết nhỏ cạnh tấm thẻ, không đọc.',
		sound='Tiếng kéo bình phong nhẹ; một nốt chuông khi tấm thẻ bằng chứng hiện ra.',
	),
	'07': dict(
		title='Khi hai pool cùng trúng',
		board=['Hai pool cùng trúng', 'Chuỗi rẽ nhánh', 'Theo nhánh dài hơn'],
		lines=[
			'Vì rút thăm theo xác suất, có slot không pool nào trúng, cũng có slot hai pool cùng trúng.',
			'Khi đó, chuỗi tạm rẽ làm hai nhánh, mỗi nhánh có một trang mới khác nhau.',
			'Các máy sẽ đi theo nhánh dài hơn. Trang ở nhánh còn lại bị bỏ đi.',
			'Giao dịch nằm trong trang bị bỏ, nếu vẫn còn hợp lệ, có thể được ghi lại ở một khối sau.',
		],
		screen='Chuỗi trang rẽ hai nhánh từ một trang chung. Nhánh trên được nối thêm một trang nữa và dài ra; nhánh dưới mờ dần rồi bị lau đi. Các tờ giao dịch trong trang bị bỏ bay ngược về hàng chờ; một tờ đã có sẵn trong nhánh trên thì mờ đi, không quay lại.',
		sound='Hai tiếng "cộp" gần như cùng lúc khi hai trang mới xuất hiện; tiếng lau bảng khi nhánh dưới bị bỏ.',
	),
	'08': dict(
		title='Vì sao phải chờ thêm vài khối',
		board=['Xác nhận theo xác suất', 'Mỗi khối mới → khó đảo hơn', 'Mức chờ: tuỳ ví, tuỳ ứng dụng'],
		lines=[
			'Đây chính là lý do ta thường phải chờ thêm vài khối mới yên tâm.',
			'Một trang vừa ghi vẫn có thể bị thay nếu chuỗi rẽ nhánh. Nhưng mỗi trang mới chồng lên trên lại làm khả năng đó nhỏ đi rất nhanh.',
			'Người ta gọi đây là xác nhận theo xác suất. Không có một con số chung cho mọi trường hợp.',
			'Mỗi ví và mỗi ứng dụng tự chọn mức chờ, giao dịch càng lớn thì thường chờ càng lâu.',
		],
		screen='Một trang có tờ giao dịch của Chi (vàng phấn). Các trang mới lần lượt chồng lên phía trên; bên cạnh là một thanh đo "khả năng bị đảo" thấp dần sau mỗi trang, không ghi số. Dòng "Xác nhận theo xác suất" gạch chân.',
		sound='Tiếng "cộp" trầm cho mỗi trang chồng lên; nền dịu dần khi thanh đo xuống thấp.',
	),
	'09': dict(
		title='Người giữ ADA tham gia thế nào',
		board=['Người giữ ADA?', 'Uỷ thác stake cho pool', 'Pool "Hồ Sen" (ví dụ minh hoạ)'],
		lines=[
			'Vậy những người chỉ có ADA trong ví, không chạy máy ghi sổ, thì góp phần ở đâu?',
			'Câu trả lời là họ uỷ thác stake của mình cho một pool, giống như góp lá thăm vào một hũ chung.',
			'Ví dụ, Chi chọn uỷ thác cho một pool tên là Hồ Sen. Người vận hành pool lo chạy máy ghi sổ.',
			'Khi pool ghi được khối, phần thưởng được chia cho cả nhóm, như tiền công cho việc giữ sổ.',
		],
		screen='Chi (nhân vật của tập 1 và tập 5) cầm vài lá thăm cam phấn, bỏ vào hũ chung của máy pool "Hồ Sen"; vài người khác cũng bỏ lá thăm vào cùng hũ. Người vận hành ngồi cạnh máy sáng đèn. Khi máy ghi một trang, vài đồng cam nhỏ chia ra cho người vận hành và những người góp thăm. Chữ nhỏ "ví dụ minh hoạ" dưới tên pool.',
		sound='Tiếng "tick" khi từng lá thăm rơi vào hũ; một nốt chuông khi đồng thưởng chia ra.',
	),
	'10': dict(
		title='Uỷ thác: tiền không rời ví',
		board=['Chứng chỉ uỷ thác → Hồ Sen', 'Tiền vẫn ở địa chỉ của Chi', 'Tiền đặt cọc: trả lại khi huỷ'],
		lines=[
			'Điều quan trọng là khi uỷ thác, ví của Chi không chuyển tiền đi đâu cả.',
			'Ví chỉ ghi lên sổ một tờ chứng chỉ uỷ thác, cho biết stake của Chi đứng sau pool Hồ Sen.',
			'Các món tiền vẫn nằm nguyên ở địa chỉ của Chi, và Chi vẫn tiêu được chúng bất cứ lúc nào.',
			'Chỉ có một khoản tiền đặt cọc nhỏ khi đăng ký lần đầu là được giữ lại, và sẽ được trả về khi huỷ đăng ký.',
		],
		screen='Các ô món tiền vàng phấn của Chi đứng yên, mỗi ô mang ổ khoá xanh như tập 4. Một tờ cam nhỏ "Chứng chỉ uỷ thác → Hồ Sen" được dán vào sổ chung. Chi tiêu một ô ngay sau đó (ô bị gạch, sinh ô mới như tập 1), tờ cam vẫn còn nguyên. Ở góc, một đồng nhỏ "tiền đặt cọc" có ổ khoá riêng, mũi tên "trả lại khi huỷ".',
		sound='Tiếng dán giấy nhẹ khi chứng chỉ vào sổ; tiếng gạch khi Chi tiêu một món.',
	),
	'11': dict(
		title='Phần thưởng chia theo epoch',
		board=['Tính theo từng epoch', 'Vài epoch sau: lần thưởng đầu', 'Số dư phần thưởng (ngoại lệ)', 'Rút về → món tiền chưa tiêu', 'Rút phần thưởng: ví có thể hỏi thêm bước chọn đại diện biểu quyết'],
		lines=[
			'Phần thưởng được tính theo từng epoch. Với một lần uỷ thác mới, phải chờ vài epoch mới có lần thưởng đầu tiên.',
			'Ở đây có một ngoại lệ so với tập một. Phần thưởng không nằm thành món tiền chưa tiêu.',
			'Nó được cộng dồn vào một số dư gắn với địa chỉ stake của bạn.',
			'Muốn tiêu, ví phải làm một giao dịch rút về, và số dư ấy trở thành một món tiền chưa tiêu bình thường.',
		],
		screen='Dải ô thời gian thu lại thành các đoạn epoch dài. Mũi tên "vài epoch sau: lần thưởng đầu", rồi mỗi epoch một đồng cam nhỏ rơi vào chiếc hộp "Số dư phần thưởng" có nhãn "ngoại lệ". Một tờ giao dịch rút về chạm vào hộp, cả hộp biến thành một ô món tiền vàng mang ổ khoá. Dòng chữ nhỏ nhất ở đáy bảng "Rút phần thưởng: ví có thể hỏi thêm bước chọn đại diện biểu quyết", không đọc.',
		sound='Tiếng "tick" nhỏ mỗi lần đồng thưởng rơi vào hộp; nốt chuông khi hộp đổi thành món tiền.',
	),
	'12': dict(
		title='Địa chỉ có hai phần',
		board=['addr1… = thanh toán + stake', 'Thanh toán: ổ khoá', 'Stake: quyền uỷ thác', 'stake1… = địa chỉ phần thưởng'],
		lines=[
			'Ở tập bốn, ta nói địa chỉ được tạo từ dấu vân tay của khoá công khai, rồi ghép thêm vài thông tin.',
			'Phần ghép thêm ấy chính là phần stake. Địa chỉ ví thông thường có hai phần.',
			'Thứ nhất là phần thanh toán, chính là ổ khoá trên món tiền. Thứ hai là phần stake, cho biết ai giữ quyền uỷ thác số tiền ấy.',
			'Cả hai phần đều sinh ra từ cùng một cụm từ khôi phục. Địa chỉ không có phần stake thì tiền ở đó không uỷ thác được.',
		],
		screen='Chuỗi "addr1…" tách làm hai nửa: nửa xanh phấn "thanh toán · ổ khoá", nửa cam phấn "stake · quyền uỷ thác". Phía trên, cụm từ khôi phục màu đỏ phấn (như tập 4) tách ra hai nhánh khoá đi xuống hai nửa. Bên cạnh, chuỗi "stake1…" màu cam nối với chiếc hộp số dư phần thưởng của cảnh 11.',
		sound='Tiếng tách nhẹ khi chuỗi địa chỉ chia đôi; nốt chuông khi hai nhánh khoá nối vào.',
	),
	'13': dict(
		title='Nối sang Hydra: chờ ở lớp một',
		board=['Mở · Nạp · Đóng · Khiếu nại · Trả về', '= giao dịch lớp 1', 'Khoản nạp: chờ đủ cũ', 'Trong Head: không chờ khối'],
		lines=[
			'Bây giờ hãy quay lại với Hydra. Mở Head, nạp tiền, đóng Head, khiếu nại và trả về đều là giao dịch trên lớp một.',
			'Vì vậy chúng cũng phải chờ khối, và chờ đủ chắc chắn, theo đúng cách ta vừa kể.',
			'Nút Hydra chỉ tính một khoản nạp khi giao dịch nạp đã được ghi trên sổ chung và đủ cũ.',
			'Thời gian khiếu nại mặc định cũng được chọn đủ dài để giao dịch trên lớp một kịp ổn định.',
			'Còn bên trong Head, giao dịch không phải chờ khối, chỉ cần cả nhóm cùng ký snapshot.',
		],
		screen='Phòng họp xanh phấn của tập 2 ở phía trên đường kẻ ngang; phía dưới là chuỗi trang trắng và dải ô thời gian. Mũi tên vàng "nạp tiền" đi xuống chuỗi, đứng chờ trong lúc vài trang chồng lên, rồi mới đi lên phòng. Mũi tên "đóng Head" kèm đồng hồ cát (thời gian khiếu nại), rồi mũi tên "trả về" đi xuống. Bên trong phòng, các giao dịch chạy liền, không có dải ô thời gian.',
		sound='Tiếng "cộp" trầm cho các trang lớp một; bên trong phòng là chuỗi "tick" nhanh; tiếng đồng hồ cát chảy nhẹ.',
	),
	'14': dict(
		title='Slot, epoch và phần stake — cho lập trình viên',
		board=[
			"import { TimeUtils, SLOT_CONFIG_NETWORK, Deserializer } from '@hydra-sdk/core'",
			'// wallet: AppWallet đã tạo ở tập 4',
			'',
			'const cfg = SLOT_CONFIG_NETWORK.MAINNET   // 1 giây/slot, 432.000 slot/epoch',
			'const slot = TimeUtils.unixTimeToEnclosingSlot(Date.now(), cfg)',
			'const ms = TimeUtils.slotToBeginUnixTime(slot, cfg)',
			"const epoch = TimeUtils.resolveEpochNo('MAINNET')",
			'',
			'const addr = wallet.getPaymentAddress()   // addr1… (địa chỉ thanh toán)',
			'Deserializer.deserializeAddress(addr).stakeCredentialHash   // phần stake bên trong',
			'wallet.getRewardAddress()   // stake1… (địa chỉ phần thưởng)',
			'',
			'PREVIEW: epoch 1 ngày',
			'TxBuilder có registerStake, delegateStake: xem tài liệu',
			'Code rút gọn, bản đầy đủ ở hydrasdk.com',
		],
		lines=[
			'Phần này dành cho lập trình viên. Trong gói core của hydra-sdk, TimeUtils lo việc đổi qua lại giữa thời gian và slot.',
			'Bạn đưa vào cấu hình slot của đúng mạng mình dùng, vì mỗi mạng có mốc bắt đầu và độ dài epoch riêng.',
			'Cùng gói đó còn tính được số epoch hiện tại, từ thời điểm bạn đưa vào.',
			'Với ví, hàm lấy địa chỉ phần thưởng trả về địa chỉ stake, còn hàm tách địa chỉ đọc ra phần stake nằm trong địa chỉ thanh toán.',
		],
		screen='Đoạn code viết tay bằng phấn, từng dòng hiện theo lời đọc. "SLOT_CONFIG_NETWORK.MAINNET" nối mũi tên tới dải ô thời gian với nhãn "1 giây/slot, 432.000 slot/epoch"; chữ nhỏ "PREVIEW: epoch 1 ngày" bên cạnh. Dòng "stakeCredentialHash" nối tới nửa cam của chuỗi addr1… ở cảnh 12; dòng "getRewardAddress" nối tới chuỗi stake1…. Dòng "TxBuilder có registerStake, delegateStake: xem tài liệu" viết nhỏ ở góc, không đọc. Góc dưới: nhãn "Code rút gọn, bản đầy đủ ở hydrasdk.com".',
		sound='Tiếng gõ phấn nhanh theo từng dòng code; nốt chuông nhỏ khi mũi tên nối tới hình cảnh 12.',
	),
	'15': dict(
		title='Tóm tắt và lời kết',
		board=['1. Khối là trang sổ; stake pool rút thăm theo stake', '2. Xác nhận theo xác suất: chờ thêm vài khối', '3. Uỷ thác không chuyển tiền đi; thưởng theo epoch', 'hydrasdk.com', 'Thực hiện cùng VTechcom Labs'],
		lines=[
			'Tóm lại, qua tập này bạn chỉ cần nhớ ba ý chính.',
			'Thứ nhất, khối là một trang sổ. Với Ouroboros Praos, các stake pool rút thăm theo stake để giành lượt ghi trang tiếp theo.',
			'Thứ hai, xác nhận trên Cardano là theo xác suất, nên ta chờ thêm vài khối mới yên tâm.',
			'Thứ ba, uỷ thác không chuyển tiền ra khỏi ví, còn phần thưởng được tính theo từng epoch.',
			'Bạn có thể xem thêm tài liệu và ví dụ tại hydrasdk.com.',
		],
		screen='Ba ý viết lần lượt, mỗi ý kèm hình nhỏ: chuỗi trang sổ với một máy pool cam; chồng trang với thanh đo thấp dần; ô món tiền vàng đứng yên cạnh tờ chứng chỉ cam. Dải ô thời gian chạy chậm dần rồi dừng. Cuối: "hydrasdk.com" ở giữa, dòng nhỏ "Thực hiện cùng VTechcom Labs" ở góc dưới phải, không đọc thành lời.',
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
