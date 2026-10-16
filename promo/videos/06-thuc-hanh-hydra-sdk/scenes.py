"""Bố cục 16 cảnh của tập 6. Mỗi hàm nhận Board và Timing (mốc từ clip giọng thật).

Code trên bảng lấy từ script.py (trường `code`); chú thích cuối dòng được tách ra viết bằng phấn
bên phải để dòng code không tràn khung. Giao diện hydrasdk.com, playground và terminal đều là hình
phấn dựng lại theo mẫu trong repo (xem brief.md, mục "Hình phấn dựng lại").
"""
import importlib.util
from pathlib import Path

from chalk import (arrow, check, cross, ellipse, envelope, font, gear, key, line, lock, monitor, person, rect,
	signature, wallet)

HERE = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location('ep06_script', HERE / 'script.py')
S = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(S)

CX, CY = 960, 500
STEPS = S.STEPS
LABEL = S.CODE_LABEL


def code_of(sid):
	return S.SCRIPT[sid]['code']


# ---------------------------------------------------------------- hình riêng của tập


def window(w, h, bar=46):
	"""Khung cửa sổ vẽ phấn: viền, thanh tiêu đề, ba chấm."""
	x0, y0 = -w / 2, -h / 2
	dots = [ellipse(8, cx=x0 + 30 + 28 * k, cy=y0 + bar / 2)[0] for k in range(3)]
	return rect(w, h, 12) + [[(x0, y0 + bar), (-x0, y0 + bar)]] + dots


def bridge_icon(w=120, h=40):
	arch = ellipse(w / 2, h, start=180, sweep=180, n=20)[0]
	return [arch, [(-w / 2 - 10, 0), (w / 2 + 10, 0)], [(-w / 4, 0), (-w / 4, -h * 0.66)], [(w / 4, 0), (w / 4, -h * 0.66)]]


def toggle(on, s=1.0):
	"""Công tắc dạng thanh trượt; núm ở phải khi bật."""
	body = rect(130 * s, 60 * s, 30 * s)
	knob = ellipse(22 * s, cx=(36 if on else -36) * s)
	return body + knob


def checkbox(s=1.0):
	return rect(40 * s, 40 * s, 6 * s)


def pointer(s=1.0):
	"""Con trỏ chuột vẽ phấn, đầu nhọn ở (0, 0)."""
	return [[(0, 0), (0, 52 * s), (13 * s, 40 * s), (24 * s, 62 * s), (33 * s, 57 * s), (22 * s, 36 * s), (40 * s, 36 * s), (0, 0)]]


def dial(r=40):
	return ellipse(r) + [[(0, -r), (0, -r + 10)], [(-r, 0), (-r + 10, 0)], [(r, 0), (r - 10, 0)]]


# ---------------------------------------------------------------- tiện ích


def cw(size):
	"""Bề rộng một ký tự của font code (JetBrains Mono, đều nhau)."""
	return font(size, True).getlength('M')


def code_block(b, x0, y0, lines, ats, size=32, lh=54, split_comments=False, note_x=None, note_size=34, dim_comments=True):
	"""Viết code từng dòng. Trả về dict: chỉ số dòng → (y, text). Dòng trống chỉ chiếm chỗ.

	split_comments: tách `// chú thích` cuối dòng, viết bằng phấn ở note_x (cùng thời điểm + 0.4 s).
	"""
	rows = {}
	for i, (src, at) in enumerate(zip(lines, ats)):
		y = y0 + i * lh
		if not src.strip():
			continue
		note = None
		if split_comments and '//' in src and not src.lstrip().startswith('//'):
			src, note = src.split('//', 1)
			src = src.rstrip()
		dim = dim_comments and src.lstrip().startswith('//')
		b.text(x0, y, src, at, size=size, mono=True, anchor='lm', color='dim' if dim else 'chalk')
		if note:
			b.text(note_x, y, '← ' + note.strip(), at + 0.4, size=note_size, color='cyan', anchor='lm')
		rows[i] = (y, src)
	return rows


def span(x0, src, sub, size):
	"""Toạ độ x đầu và cuối của chuỗi con `sub` trong dòng code bắt đầu ở x0."""
	k = src.index(sub)
	c = cw(size)
	return x0 + 6 + k * c, x0 + 6 + (k + len(sub)) * c


def underline(b, x0, row, sub, size, at, color='yellow'):
	y, src = row
	a, z = span(x0, src, sub, size)
	return b.path(line(a, y + size * 0.62, z, y + size * 0.62), at, color=color, dur=0.4)


def oval(b, x0, row, sub, size, at, color='yellow', pad=40):
	y, src = row
	a, z = span(x0, src, sub, size)
	return b.path(ellipse((z - a) / 2 + pad, size * 0.95), at, x=(a + z) / 2, y=y + 2, color=color, dur=0.5)


def steps_bar(b, cur, at):
	"""Thanh sáu bước ở góc trên; bước đang làm tô vàng, gạch chân."""
	for k, s in enumerate(STEPS):
		x = 200 + k * 304
		b.text(x, 62, s, at + k * 0.04, size=30, color='yellow' if k == cur else 'dim', dur=0.25)
	if cur >= 0:
		b.path(line(-110, 0, 110, 0), at + 0.3, x=200 + cur * 304, y=96, color='yellow', dur=0.3)


def code_label(b, at):
	b.text(80, 1035, LABEL, at, size=26, color='dim', anchor='lm', dur=0.4)


def note_br(b, s, at):
	"""Ghi chú nhỏ góc dưới phải (số liệu minh hoạ, hình dựng lại)."""
	b.text(1840, 1035, s, at, size=26, color='dim', anchor='rm', dur=0.4)


# ---------------------------------------------------------------- cảnh


def s01(b, tm):
	L = tm.L
	# Các khái niệm của năm tập trước, xếp ở cột trái
	b.utxo(240, 300, '18 ADA', L(0, 0.15), w=190, h=90, size=40)
	b.path(ellipse(120, 70), L(0, 0.3), x=520, y=300, color='cyan', dur=0.6)
	b.text(520, 300, 'Head', L(0, 0.35), size=40, color='cyan')
	b.path(wallet(190, 125), L(0, 0.55), x=240, y=540, dur=0.6)
	b.path(gear(30), L(0, 0.75), x=440, y=540, color='cyan', dur=0.5, sfx='gear')
	b.path(lock(1.1), L(0, 0.8), x=580, y=525, dur=0.4)
	b.text(380, 680, 'Tập 1 – 5', L(0, 0.9), size=40, color='dim')
	# Khung soạn code trống
	b.text(CX, 110, 'Từ khái niệm tới code', L(1, 0.15), size=64)
	b.path(window(1000, 520), L(1, 0.35), x=1290, y=470, dur=0.9)
	b.text(830, 279, 'an-gui-binh.ts', L(1, 0.5), size=26, mono=True, color='dim', anchor='lm')
	for k in range(5):
		t = L(1, 0.65) + k * 0.8
		b.text(860, 360, '|', t, size=40, mono=True, color='cyan', anchor='lm', dur=0.05).erase(t + 0.4, fade=0.05)
	b.path(arrow(660, 420, 760, 420), L(1, 0.8), color='dim', dur=0.3)
	b.text(1290, 470, '~30 dòng TypeScript', L(2, 0.1), size=52, color='cyan')
	for k in range(6):
		x = 1040 + k * 100
		b.path(ellipse(30), L(2, 0.35 + k * 0.08), x=x, y=600, dur=0.25, color='yellow')
		b.text(x, 600, str(k + 1), L(2, 0.38 + k * 0.08), size=34, color='yellow', dur=0.15)
	# An gửi Bình trong Head
	b.path(ellipse(460, 115), L(3, 0.05), x=900, y=890, color='cyan', dur=0.8)
	b.path(person(0.75), L(3, 0.15), x=620, y=895, dur=0.5)
	b.text(570, 895, 'An', L(3, 0.2), size=36, dur=0.2, anchor='rm')
	b.path(person(0.75), L(3, 0.25), x=1180, y=895, dur=0.5)
	b.text(1230, 895, 'Bình', L(3, 0.3), size=36, dur=0.2, anchor='lm')
	b.path(arrow(690, 880, 1110, 880), L(3, 0.45), color='yellow', dur=0.5)
	b.text(900, 840, '2 ADA', L(3, 0.55), size=44, color='yellow')
	b.text(1400, 890, 'trong Hydra Head', L(3, 0.7), size=40, color='cyan', anchor='lm')


def s02(b, tm):
	L = tm.L
	b.text(CX, 110, 'Cần có', L(0, 0.1), size=68)
	b.path(line(-130, 0, 130, 0), L(0, 0.5), x=CX, y=160)
	# ① Head đang mở, ví đã có tiền
	b.path(rect(780, 330, 16), L(1, 0.0), x=520, y=405, dur=0.7)
	b.text(520, 290, '1. Head đang mở', L(1, 0.05), size=46)
	b.path(ellipse(130, 78), L(1, 0.3), x=330, y=440, color='cyan', dur=0.6)
	b.utxo(330, 440, '18 ADA', L(1, 0.55), w=150, h=64, size=32)
	b.text(690, 450, 'ví đã có tiền\ntrong Head', L(1, 0.7), size=40)
	b.text(520, 620, '→ tập 3: vòng đời Head', L(2, 0.25), size=38, color='cyan')
	# ② Bốn gói hydra-sdk
	b.path(rect(780, 330, 16), L(3, 0.0), x=1400, y=405, dur=0.7)
	b.text(1400, 290, '2. Bốn gói hydra-sdk', L(3, 0.05), size=46)
	# HP-01: trang Installation trên hydrasdk.com, vẽ phấn lại
	b.path(window(1240, 200), L(3, 0.3), x=CX, y=820, dur=0.8)
	b.text(470, 743, 'hydrasdk.com · Installation', L(3, 0.4), size=24, mono=True, color='dim', anchor='lm')
	code = code_of('02')
	code_block(b, 380, 820, code, [L(3, 0.5), L(3, 0.75)], size=28, lh=46)
	b.text(1580, 940, 'Hình dựng lại theo hydrasdk.com', L(3, 0.8), size=24, color='dim', anchor='rm')
	code_label(b, L(3, 0.9))
	# ba gói chính, theo câu 4
	for k, (x, shape, lab, f) in enumerate(((1150, wallet(110, 72), 'core', 0.1), (1400, bridge_icon(), 'bridge', 0.4),
			(1650, rect(110, 64, 10), 'transaction', 0.75))):
		b.path(shape, L(4, f), x=x, y=430, color='cyan', dur=0.5)
		b.text(x, 515, lab, L(4, f + 0.08), size=28, mono=True, color='cyan', dur=0.3)
	b.text(1650, 430, 'Tx', L(4, 0.8), size=34, mono=True, color='cyan', dur=0.2)


def s03(b, tm):
	L = tm.L
	b.text(CX, 180, 'Sáu bước', L(0, 0.05), size=80)
	b.text(CX, 270, 'ghi lại để làm theo', L(0, 0.55), size=40, color='dim')
	labels = ['1. Kết nối', '2. Lấy\nmón tiền', '3. Dựng\ngiao dịch', '4. Ký', '5. Gửi', '6. Xem\nsnapshot']
	ats = [L(1, 0.12), L(1, 0.6), L(2, 0.08), L(2, 0.72), L(3, 0.08), L(3, 0.5)]
	boxes = []
	for k, (s, at) in enumerate(zip(labels, ats)):
		x = 210 + k * 300
		g = b.group(x, 540)
		b.path(rect(236, 160, 16), at, parent=g, dur=0.45, sfx='tick')
		b.text(0, 0, s, at + 0.2, size=38, parent=g, color='yellow' if k == 5 else 'chalk', dur=0.4)
		if k:
			b.path(arrow(-170, 0, -124, 0, head=12), at, parent=g, color='dim', dur=0.15)
		boxes.append(g)
	b.text(810, 680, 'chọn món · tiền thối', L(2, 0.35), size=32, color='dim')
	b.path(check(1.3), L(3, 0.85), x=1710, y=680, color='green', dur=0.3)
	b.text(1710, 740, 'tiền đã tới nơi', L(3, 0.88), size=30, color='green', dur=0.3)
	# Thu dãy lên thành thanh tiến trình
	b.clear(tm.E(3, 0.45))
	steps_bar(b, -1, tm.E(3, 0.15))


def s04(b, tm):
	L = tm.L
	b.text(90, 150, 'Ví của An', L(0, 0.05), size=56, anchor='lm')
	b.path(wallet(300, 190), L(0, 0.2), x=1540, y=320, dur=0.8)
	for j in range(3):
		b.path(key(0.9), L(0, 0.55 + j * 0.08), x=1500, y=280 + j * 36, color='cyan', dur=0.3)
	b.text(1540, 475, 'Ví = chùm chìa khoá', L(0, 0.75), size=40, color='cyan')
	src = code_of('04')
	# dòng chú thích dài tách làm hai dòng để không tràn khung
	c0, c1 = src[2].split('. ', 1)
	lines = src[:2] + [c0 + '.', '// ' + c1] + src[3:]
	ats = [L(0, 0.6), 0, L(1, 0.05), L(1, 0.15), L(1, 0.3), 0, L(1, 0.5), L(1, 0.6), L(1, 0.72), L(1, 0.8), L(2, 0.25)]
	x0, size = 90, 32
	rows = code_block(b, x0, 270, lines, ats, size=size, lh=58)
	b.text(740, rows[8][0], '← mạng thử nghiệm', L(1, 0.9), size=34, color='cyan', anchor='lm')
	# địa chỉ = ổ khoá
	underline(b, x0, rows[10], 'myAddress', size, L(2, 0.45))
	b.path(lock(1.5), L(2, 0.55), x=1600, y=780, dur=0.5)
	b.path(arrow(1170, rows[10][0], 1530, 790), L(2, 0.6), color='yellow', dur=0.4)
	b.text(1600, 880, 'Địa chỉ = ổ khoá', L(2, 0.7), size=40)
	# từ khoá ghi nhớ là bí mật
	oval(b, x0, rows[4], "process.env.AN_MNEMONIC", size, L(3, 0.1), color='red', pad=30)
	b.path(lock(0.75), L(3, 0.3), x=1110, y=rows[4][0] - 6, color='red', dur=0.3)
	b.text(1150, rows[4][0], 'bí mật', L(3, 0.35), size=38, color='red', anchor='lm')
	b.text(CX, 965, 'Không đưa từ khoá ghi nhớ vào code thật', L(3, 0.55), size=40, color='red')
	code_label(b, L(3, 0.9))


def s05(b, tm):
	L = tm.L
	steps_bar(b, 0, L(0, 0.0))
	# Head và các nút Hydra
	b.path(ellipse(330, 190), L(0, 0.15), x=1350, y=410, color='cyan', dur=0.9)
	b.text(1350, 380, 'Hydra Head', L(0, 0.3), size=46, color='cyan')
	nodes = [(1020, 410), (1180, 245), (1520, 245), (1680, 410), (1350, 600)]
	for k, (x, y) in enumerate(nodes):
		b.path(ellipse(20), L(0, 0.55 + k * 0.06), x=x, y=y, dur=0.25, sfx='tick' if k == 0 else None)
	b.text(1350, 470, 'các nút Hydra', L(0, 0.85), size=36, color='dim')
	# ứng dụng của An và cầu nối
	b.path(monitor(1.4), L(1, 0.0), x=300, y=400, dur=0.6)
	b.text(300, 530, 'ứng dụng của An', L(1, 0.15), size=36)
	deck = [line(400, 420, 1000, 420)[0], ellipse(300, 90, start=180, sweep=180, n=24, cx=700, cy=420)[0]]
	b.path(deck, L(1, 0.45), color='dim', dur=0.8)
	b.text(700, 290, 'cầu nối Hydra', L(1, 0.55), size=38, color='dim')
	src = code_of('05')
	x0, size = 90, 34
	rows = code_block(b, x0, 700, src, [L(1, 0.1), 0, L(1, 0.4), L(3, 0.05)], size=size, lh=60)
	underline(b, x0, rows[2], "'ws://localhost:4001'", size, L(1, 0.75), color='cyan')
	# đường truyền luôn mở: tin mới chạy từ Head về
	for k in range(3):
		t = L(2, 0.2 + k * 0.2)
		b.path(arrow(960 - k * 200, 380, 860 - k * 200, 380, head=14), t, color='cyan', dur=0.25).erase(t + 0.9, fade=0.4)
	b.text(700, 210, 'tin mới đến ngay', L(2, 0.5), size=34, color='cyan')
	# kết nối xong
	underline(b, x0, rows[3], 'bridge.connect()', size, L(3, 0.3), color='green')
	b.path(deck, L(3, 0.4), color='green', dur=0.6, sfx='chime')
	b.path(check(1.4), L(3, 0.7), x=300, y=290, color='green', dur=0.3)
	code_label(b, L(3, 0.8))


def s06(b, tm):
	L = tm.L
	steps_bar(b, 1, L(0, 0.0))
	b.path(ellipse(270, 190), L(0, 0.15), x=360, y=400, color='cyan', dur=0.9)
	b.text(360, 240, 'Head', L(0, 0.3), size=36, color='cyan', dur=0.2)
	q = b.text(360, 430, '?', L(0, 0.55), size=110, color='dim')
	q.erase(L(1, 0.4))
	# snapshot: danh sách món tiền
	b.path(rect(220, 170, 8), L(1, 0.4), x=360, y=440, color='yellow', dur=0.5)
	b.text(360, 385, 'snapshot', L(1, 0.5), size=32, color='yellow')
	for k in range(3):
		b.path(line(-80, 0, 80, 0), L(1, 0.6 + k * 0.05), x=360, y=430 + k * 32, color='dim', dur=0.2, width=4)
	# mọi thành viên cùng ký
	for k, (x, y) in enumerate(((170, 330), (560, 330), (360, 580))):
		b.path(signature(80), L(2, 0.3 + k * 0.15), x=x, y=y, color='cyan', dur=0.4, width=4, sfx='tick')
	b.text(360, 690, 'Snapshot = danh sách món tiền\ncả Head cùng ký', L(2, 0.75), size=34)
	src = code_of('06')
	x0, size = 720, 30
	ats = [L(1, 0.15), 0, L(3, 0.05), L(3, 0.15), L(3, 0.3), L(3, 0.45), L(3, 0.6), L(3, 0.7), L(3, 0.75)]
	rows = code_block(b, x0, 200, src, ats, size=size, lh=56, dim_comments=False)
	b.text(1280, 720, 'UTxOObject', L(3, 0.8), size=60, mono=True, color='yellow', sfx='chime')
	b.text(1280, 790, 'như tập 1', L(3, 0.9), size=34, color='dim')
	# món 18 ADA của An
	oval(b, x0, rows[3], "'fa1e…369f#0'", size, L(4, 0.1), pad=30)
	b.path(lock(0.8), L(4, 0.35), x=1310, y=rows[4][0], color='cyan', dur=0.3)
	underline(b, x0, rows[5], '18000000', size, L(4, 0.45))
	b.text(1440, rows[5][0], '= 18 ADA', L(4, 0.55), size=40, color='yellow', anchor='lm')
	b.path(person(0.7), L(4, 0.6), x=170, y=860, dur=0.4)
	b.text(170, 945, 'An', L(4, 0.62), size=32, dur=0.2)
	b.utxo(380, 865, '18 ADA', L(4, 0.7), w=190, h=80, size=36, locked=True)
	code_label(b, L(4, 0.85))
	note_br(b, 'Số liệu từ ví dụ trong tài liệu hydrasdk.com', L(4, 0.9))


def s07(b, tm):
	L = tm.L
	steps_bar(b, 1, L(0, 0.0))
	b.path(ellipse(400, 250), L(0, 0.0), x=520, y=470, color='cyan', dur=0.8)
	others = [('5', 290, 360), ('40', 520, 300), ('12', 760, 360), ('7', 330, 580), ('25', 720, 590)]
	for k, (v, x, y) in enumerate(others):
		b.utxo(x, y, v, L(0, 0.1 + k * 0.05), color='dim', w=120, h=64, size=34, sfx=None, locked=True)
	an = b.utxo(520, 470, '18', L(0, 0.3), w=130, h=70, size=38, locked=True)
	k = b.path(key(1.2), L(0, 0.45), x=150, y=470, color='cyan', dur=0.4)
	k.move(L(0, 0.55), L(0, 0.85), 330, 0)
	k.erase(L(1, 0.3))
	b.text(1400, 200, 'Cả Head → chỉ của An', L(0, 0.75), size=44)
	# lọc theo địa chỉ: món của An nhấc ra
	b.text(1180, 400, '[', L(1, 0.3), size=150, mono=True, color='yellow')
	b.text(1620, 400, ']', L(1, 0.3), size=150, mono=True, color='yellow')
	an.move(L(1, 0.4), L(1, 0.8), 880, -70)
	b.text(1400, 520, 'myUtxos', L(1, 0.85), size=34, mono=True, color='yellow')
	src = code_of('07')
	x0, size = 90, 36
	rows = code_block(b, x0, 850, src, [L(1, 0.1), L(2, 0.05)], size=size, lh=64)
	underline(b, x0, rows[0], 'queryAddressUTxO(myAddress)', size, L(1, 0.6), color='cyan')
	# đúng định dạng cho TxBuilder
	b.path(arrow(1400, 570, 1400, 650), L(2, 0.4), color='dim', dur=0.3)
	b.path(rect(260, 90, 12), L(2, 0.5), x=1400, y=710, color='cyan', dur=0.4)
	b.text(1400, 710, 'TxBuilder', L(2, 0.55), size=40, mono=True, color='cyan')
	# bộ nhớ đệm
	b.path(gear(22), L(3, 0.15), x=1100, y=620, color='green', dur=0.4, sfx='gear')
	b.text(1100, 680, 'nhớ sẵn snapshot', L(3, 0.3), size=32, color='green')
	b.text(1700, 620, 'hỏi lại: trả lời ngay', L(3, 0.6), size=32, color='green')
	code_label(b, L(3, 0.8))
	note_br(b, 'Các món khác: minh hoạ', L(3, 0.85))


def s08(b, tm):
	L = tm.L
	steps_bar(b, 2, L(0, 0.0))
	b.path(rect(460, 300, 18), L(0, 0.1), x=420, y=460, color='cyan', dur=0.8)
	b.text(420, 360, 'TxBuilder', L(0, 0.3), size=48, mono=True, color='cyan')
	src = code_of('08')
	x0, size = 780, 34
	ats = [L(0, 0.55), 0, L(1, 0.05), L(1, 0.2), L(1, 0.5), L(1, 0.65)]
	rows = code_block(b, x0, 300, src, ats, size=size, lh=72)
	# công tắc chế độ Hydra
	off = b.path(toggle(False), L(1, 0.05), x=290, y=480, dur=0.5)
	off.erase(L(1, 0.3), fade=0.1)
	b.path(toggle(True), L(1, 0.3), x=290, y=480, color='green', dur=0.2, sfx='click')
	b.text(290, 550, 'Hydra', L(1, 0.32), size=34, color='green')
	oval(b, x0, rows[3], 'isHydra: true', size, L(1, 0.35), color='green')
	# hai núm phí về 0
	for k, x in enumerate((470, 590)):
		b.path(dial(38), L(1, 0.55 + k * 0.08), x=x, y=480, dur=0.35)
		n = b.path(line(0, 0, 26, -20), L(1, 0.6 + k * 0.08), x=x, y=480, color='red', dur=0.15)
		n.erase(L(1, 0.8), fade=0.1)
		b.path(line(0, 0, 0, -30), L(1, 0.8), x=x, y=480, color='yellow', dur=0.15, sfx='tick')
		b.text(x, 550, '0', L(1, 0.82), size=34, color='yellow', dur=0.15)
	oval(b, x0, rows[4], 'minFeeA: 0, minFeeB: 0', size, L(1, 0.85))
	b.text(420, 700, 'Phí = 0', L(2, 0.25), size=56, color='yellow')
	b.text(420, 770, 'Head trong ví dụ không thu phí', L(2, 0.5), size=32, color='dim')
	b.path(check(1.4), L(3, 0.4), x=1000, y=820, color='green', dur=0.3)
	b.text(1050, 820, 'theo tài liệu hydra-sdk', L(3, 0.45), size=40, color='green', anchor='lm')
	code_label(b, L(3, 0.8))


def s09(b, tm):
	L = tm.L
	steps_bar(b, 2, L(0, 0.0))
	src = code_of('09')
	x0, size, nx = 80, 30, 1150
	ats = [L(1, 0.0), 0, L(0, 0.05), L(0, 0.3), L(1, 0.3), L(1, 0.45), L(2, 0.1), L(2, 0.25), L(3, 0.1), L(4, 0.05)]
	rows = code_block(b, x0, 170, src, ats, size=size, lh=50, split_comments=True, note_x=nx, note_size=32)
	# dữ liệu đầu vào và bộ dựng
	src18 = b.utxo(330, 860, '18 ADA', L(0, 0.4), w=200, h=92, size=40, locked=True)
	b.text(330, 950, 'của An', L(0, 0.45), size=30, color='dim', dur=0.2)
	b.path(rect(300, 120, 14), L(0, 0.55), x=900, y=860, color='cyan', dur=0.5)
	b.text(900, 860, 'TxBuilder', L(0, 0.6), size=40, mono=True, color='cyan')
	b.path(arrow(440, 860, 740, 860), L(0, 0.75), color='dim', dur=0.3)
	# lovelace
	underline(b, x0, rows[6], "'2000000'", size, L(2, 0.5))
	b.text(nx, rows[6][0] + 2, '← 2 ADA = 2.000.000 lovelace', L(2, 0.65), size=32, color='yellow', anchor='lm')
	# hoàn tất: tự chọn món, lớn trước
	b.path(gear(26), L(4, 0.25), x=1080, y=800, color='cyan', dur=0.5, sfx='gear')
	b.text(900, 950, 'chọn món lớn trước', L(4, 0.5), size=32, color='green')
	underline(b, x0, rows[9], '.complete()', size, L(4, 0.2), color='green')
	# 18 bị tiêu trọn, sinh hai món mới
	b.path(cross(2.2), L(5, 0.1), x=330, y=860, color='red', dur=0.3, width=7, sfx='strike')
	src18.erase(L(5, 0.5), fade=0.8)
	b.path(arrow(1060, 840, 1290, 790), L(5, 0.25), color='dim', dur=0.25)
	b.utxo(1400, 780, '2 ADA', L(5, 0.3), w=180, h=80, size=38, locked=True)
	b.text(1510, 780, '→ Bình', L(5, 0.4), size=36, anchor='lm')
	b.path(arrow(1060, 880, 1290, 920), L(5, 0.5), color='dim', dur=0.25)
	b.utxo(1400, 920, '16 ADA', L(5, 0.55), w=180, h=80, size=38, locked=True)
	b.text(1510, 920, '→ An · tiền thối', L(5, 0.65), size=36, anchor='lm')
	b.text(1700, 845, 'phí: 0', L(5, 0.8), size=30, color='dim')
	code_label(b, L(5, 0.85))
	note_br(b, 'Số liệu minh hoạ', L(5, 0.9))


def s10(b, tm):
	L = tm.L
	steps_bar(b, 3, L(0, 0.0))
	# tờ séc chưa ký
	b.path(rect(460, 220, 10), L(0, 0.3), x=400, y=330, dur=0.7)
	b.text(400, 290, '18 → 2 + 16', L(0, 0.5), size=48, color='yellow')
	b.text(260, 380, 'chữ ký:', L(0, 0.6), size=30, color='dim', anchor='lm')
	b.path(line(0, 0, 200, 0), L(0, 0.7), x=380, y=395, color='dim', dur=0.3, width=3)
	# ví ký bằng chìa, chìa ở lại
	b.path(wallet(260, 170), L(1, 0.0), x=400, y=700, dur=0.6)
	for j in range(3):
		b.path(key(0.85), L(1, 0.2 + j * 0.05), x=360, y=665 + j * 34, color='cyan', dur=0.25)
	b.path(arrow(400, 600, 450, 430), L(1, 0.45), color='cyan', dur=0.3)
	b.path(signature(170), L(1, 0.55), x=480, y=380, color='cyan', dur=0.5, width=4, sfx='thud')
	src = code_of('10')
	x0, size = 800, 32
	rows = code_block(b, x0, 300, src, [L(0, 0.2), 0, L(1, 0.1), L(3, 0.05)], size=size, lh=62)
	underline(b, x0, rows[2], 'wallet.signTx', size, L(1, 0.35), color='cyan')
	b.path(ellipse(170, 110), L(2, 0.2), x=400, y=715, color='green', dur=0.6)
	b.text(400, 870, 'Chìa khoá ở lại trong ví', L(2, 0.4), size=38, color='green')
	# mã giao dịch → tên riêng hai món mới
	underline(b, x0, rows[3], 'txId', size, L(3, 0.3), color='yellow')
	b.text(1300, 600, 'Mã giao dịch', L(3, 0.4), size=42, color='yellow')
	b.path(arrow(1300, 640, 1110, 700), L(3, 0.5), color='dim', dur=0.3)
	b.path(arrow(1300, 640, 1490, 700), L(3, 0.55), color='dim', dur=0.3)
	b.utxo(1080, 770, 'txId#0', L(3, 0.6), w=250, h=90, size=40)
	b.utxo(1520, 770, 'txId#1', L(3, 0.7), w=250, h=90, size=40, sfx='chime')
	b.text(1080, 860, '2 ADA → Bình', L(3, 0.75), size=30, color='dim')
	b.text(1520, 860, '16 ADA → An', L(3, 0.8), size=30, color='dim')
	code_label(b, L(3, 0.85))
	note_br(b, 'Thứ tự đầu ra theo ví dụ minh hoạ', L(3, 0.9))


def s11(b, tm):
	L = tm.L
	steps_bar(b, 4, L(0, 0.0))
	b.path(monitor(1.2), L(0, 0.05), x=200, y=320, dur=0.5)
	deck = [line(290, 340, 760, 340)[0], ellipse(235, 70, start=180, sweep=180, n=20, cx=525, cy=340)[0]]
	b.path(deck, L(0, 0.2), color='green', dur=0.6)
	b.path(ellipse(380, 190), L(0, 0.3), x=1150, y=330, color='cyan', dur=0.8)
	for k, x in enumerate((1000, 1150, 1300)):
		b.path(person(0.6), L(0, 0.5 + k * 0.08), x=x, y=360, dur=0.4)
	src = code_of('11')
	x0, size = 90, 32
	rows = code_block(b, x0, 660, src, [L(1, 0.05), L(1, 0.15), L(1, 0.25), L(1, 0.35), L(1, 0.45), L(1, 0.5)], size=size, lh=50)
	underline(b, x0, rows[0], 'submitTxSync', size, L(1, 0.55), color='cyan')
	# phong bì qua cầu vào Head
	env = b.path(envelope(110, 70), L(1, 0.6), x=200, y=230, color='yellow', dur=0.3)
	env.move(L(1, 0.7), L(1, 0.98), 850, -40)
	env.erase(L(2, 0.9), fade=0.5)
	# thành viên xác nhận
	for k, x in enumerate((1000, 1150, 1300)):
		b.path(check(1.0), L(2, 0.35 + k * 0.12), x=x, y=265, color='green', dur=0.25, sfx='tick')
	b.text(900, 720, 'Hợp lệ?', L(2, 0.5), size=38, anchor='lm')
	b.path(check(1.0), L(2, 0.6), x=1120, y=720, color='green', dur=0.25)
	b.text(900, 800, 'Đã chốt trong snapshot?', L(2, 0.7), size=38, anchor='lm')
	b.path(check(1.0), L(2, 0.85), x=1420, y=800, color='green', dur=0.25)
	# nhánh không hợp lệ
	b.path(envelope(130, 80), L(3, 0.1), x=1650, y=660, color='dim', dur=0.4)
	b.path(cross(1.4), L(3, 0.35), x=1650, y=660, color='red', dur=0.3, sfx='thud')
	b.text(1650, 750, 'Không hợp lệ', L(3, 0.45), size=36, color='red')
	b.text(1650, 800, '+ lý do', L(3, 0.6), size=30, color='red')
	# không chờ khối trên mạng chính
	b.text(1150, 575, 'chốt ngay trong Head', L(4, 0.15), size=40, color='green')
	for k in range(4):
		x = 1160 + k * 180
		b.path(rect(110, 56, 8), L(4, 0.45 + k * 0.06), x=x, y=930, color='dim', dur=0.25)
		if k:
			b.path(line(x - 125, 930, x - 55, 930), L(4, 0.45 + k * 0.06), color='dim', dur=0.15)
	b.text(1430, 985, 'mạng chính: chờ khối mới', L(4, 0.6), size=28, color='dim')
	code_label(b, L(4, 0.85))


def s12(b, tm):
	L = tm.L
	steps_bar(b, 5, L(0, 0.0))
	# HP-02: khung terminal vẽ lại theo kết quả mẫu trong tài liệu
	b.path(window(880, 360), L(0, 0.05), x=500, y=340, dur=0.8)
	b.text(180, 183, 'terminal', L(0, 0.15), size=22, mono=True, color='dim', anchor='lm')
	term = [">>> Submit tx result: {", "  txId: 'dee1…5435',", "  isValid: true, isConfirmed: true,",
		"  result: { tag: 'SnapshotConfirmed',", "    snapshot: { number: 1, … } }", "}"]
	tx0, tsz = 100, 26
	trows = code_block(b, tx0, 250, term, [L(0, 0.2 + k * 0.08) for k in range(6)], size=tsz, lh=42)
	oval(b, tx0, trows[2], 'isValid: true', tsz, L(0, 0.75), color='green', pad=20)
	oval(b, tx0, trows[2], 'isConfirmed: true', tsz, L(0, 0.85), color='green', pad=20)
	b.text(940, 555, 'Hình dựng lại theo tài liệu hydrasdk.com', L(0, 0.9), size=22, color='dim', anchor='rm')
	oval(b, tx0, trows[4], 'number: 1', tsz, L(1, 0.3), pad=24)
	b.text(500, 620, 'snapshot số 1', L(1, 0.45), size=46, color='yellow', sfx='chime')
	src = code_of('12')
	x0, size = 70, 32
	b.text(x0, 740, src[-1], L(2, 0.05), size=size, mono=True, anchor='lm')
	# Trước / Sau
	b.text(1080, 200, 'Trước', L(2, 0.3), size=40, color='dim', anchor='lm')
	b.text(1080, 280, 'fa1e…#0 · 18 ADA', L(2, 0.4), size=40, color='yellow', anchor='lm')
	b.strike(1070, 285, 1450, 275, L(2, 0.7), width=6)
	b.path(line(0, 0, 0, 380), L(2, 0.3), x=1040, y=180, color='dim', dur=0.4, width=3)
	b.text(1080, 420, 'Sau', L(3, 0.0), size=40, color='dim', anchor='lm')
	b.text(1080, 500, 'txId#0 · 2 ADA → Bình', L(3, 0.25), size=40, color='yellow', anchor='lm', sfx='tick')
	b.text(1080, 580, 'txId#1 · 16 ADA → An', L(3, 0.55), size=40, color='yellow', anchor='lm', sfx='tick')
	b.text(CX, 880, '1 món cũ tiêu trọn  →  2 món mới', L(4, 0.3), size=56)
	code_label(b, L(4, 0.8))
	note_br(b, 'Số liệu từ ví dụ trong tài liệu', L(4, 0.85))


def s13(b, tm):
	L = tm.L
	b.text(90, 110, 'Lắng nghe Head', L(0, 0.05), size=52, anchor='lm')
	src = code_of('13')
	x0, size = 90, 32
	ats = [L(0, 0.45), L(1, 0.1), L(2, 0.1), L(2, 0.45), L(2, 0.8), L(2, 0.85)]
	rows = code_block(b, x0, 210, src, ats, size=size, lh=54)
	underline(b, x0, rows[1], "'SnapshotConfirmed'", size, L(1, 0.35), color='cyan')
	underline(b, x0, rows[2], 'getAddressBalance(myAddress)', size, L(2, 0.35), color='yellow')
	b.text(CX, 580, 'Mỗi snapshot mới → số dư mới', L(1, 0.6), size=46)
	# Head và hai ví
	b.path(ellipse(240, 120), L(0, 0.1), x=CX, y=790, color='cyan', dur=0.7)
	b.text(CX, 790, 'Head', L(0, 0.2), size=44, color='cyan')
	b.path(wallet(230, 145), L(0, 0.3), x=330, y=780, dur=0.6)
	b.text(330, 890, 'An', L(0, 0.35), size=34, dur=0.2)
	b.path(wallet(230, 145), L(0, 0.4), x=1590, y=780, dur=0.6)
	b.text(1590, 890, 'Bình', L(0, 0.45), size=34, dur=0.2)
	for t in (L(1, 0.35), L(3, 0.1)):
		for k, (rx, ry) in enumerate(((330, 160), (430, 200), (530, 240))):
			b.path(ellipse(rx, ry), t + k * 0.25, x=CX, y=790, color='cyan', dur=0.3, width=3).erase(t + k * 0.25 + 0.5, fade=0.4)
	b.text(330, 960, '16 ADA', L(2, 0.7), size=48, color='yellow')
	b.text(1590, 960, '+2 ADA', L(3, 0.45), size=48, color='green', sfx='chime')
	code_label(b, L(3, 0.8))


def s14(b, tm):
	L = tm.L
	b.text(CX, 150, 'Ba lỗi hay gặp', L(0, 0.1), size=70)
	xs = (350, 960, 1570)
	for k, x in enumerate(xs):
		b.path(rect(500, 460, 16), L(k + 1, 0.0), x=x, y=580, color='red', dur=0.6)
	# ① danh sách rỗng
	b.text(350, 400, '1. Danh sách rỗng', L(1, 0.1), size=40)
	b.path(ellipse(150, 85), L(1, 0.3), x=350, y=560, color='cyan', dur=0.6)
	b.text(350, 560, 'Head', L(1, 0.35), size=34, color='dim')
	b.text(350, 720, '[ ]', L(1, 0.75), size=72, mono=True, color='red')
	# ② cấu hình mạng chính
	b.text(960, 400, '2. Cấu hình mạng chính', L(2, 0.1), size=38)
	b.path(toggle(False, 1.2), L(2, 0.3), x=960, y=550, dur=0.5)
	b.text(960, 650, 'Hydra: tắt', L(2, 0.4), size=34)
	b.path(ellipse(130, 70), L(2, 0.5), x=960, y=550, color='red', dur=0.5)
	b.text(960, 730, 'phí ≠ 0', L(2, 0.75), size=40, color='red')
	# ③ tiêu lại món đã tiêu
	b.text(1570, 400, '3. Tiêu lại món đã tiêu', L(3, 0.1), size=38)
	b.utxo(1570, 540, '18 ADA', L(3, 0.25), w=200, h=90, size=40)
	b.strike(1460, 545, 1680, 535, L(3, 0.35), width=7)
	b.path(rect(260, 90, 10), L(3, 0.65), x=1570, y=700, color='red', width=6, sfx='thud')
	b.text(1570, 700, 'Từ chối', L(3, 0.67), size=50, color='red', dur=0.25)


def s15(b, tm):
	L = tm.L
	# HP-03..05: trang /transaction-builder vẽ phấn lại
	b.path(window(1560, 800), L(0, 0.1), x=CX, y=560, dur=1.0)
	b.text(300, 183, 'playground.hydrasdk.com/transaction-builder', L(0, 0.35), size=26, mono=True, color='dim', anchor='lm')
	b.text(CX, 90, 'Thử ngay trên playground', L(0, 0.5), size=54)
	b.text(1730, 985, 'Hình dựng lại theo playground.hydrasdk.com', L(0, 0.8), size=24, color='dim', anchor='rm')
	cur = b.path(pointer(1.0), L(1, 0.3), x=1100, y=700, dur=0.3)
	# Options: ô Hydra mode
	b.path(rect(440, 640, 10), L(1, 0.0), x=420, y=590, color='dim', dur=0.6)
	b.text(220, 310, 'Options', L(1, 0.05), size=26, mono=True, color='dim', anchor='lm')
	b.path(checkbox(), L(1, 0.2), x=240, y=420, dur=0.3)
	b.text(285, 420, 'Hydra mode', L(1, 0.25), size=36, anchor='lm')
	b.text(220, 500, 'Allows unbalanced, fee-less\ntransactions — how transactions\ninside a Hydra head work.',
		L(1, 0.35), size=22, color='dim', anchor='lt')
	cur.move(L(1, 0.4), L(1, 0.6), 240 - 1100 + 4, 420 - 700 + 4)
	b.path(check(0.9), L(1, 0.65), x=240, y=420, color='green', dur=0.2, sfx='click')
	b.path(ellipse(180, 56), L(1, 0.75), x=350, y=420, color='yellow', dur=0.4)
	# Inputs: dữ liệu mẫu, chọn món
	b.path(rect(440, 640, 10), L(2, 0.0), x=CX, y=590, color='dim', dur=0.6)
	b.text(760, 310, 'Inputs', L(2, 0.05), size=26, mono=True, color='dim', anchor='lm')
	b.path(rect(200, 50, 8), L(2, 0.1), x=880, y=380, dur=0.3)
	b.text(880, 380, 'Sample data', L(2, 0.12), size=24, mono=True, dur=0.2)
	cur.move(L(2, 0.12), L(2, 0.22), 640, -40)
	for k in range(3):
		y = 470 + k * 80
		b.path(checkbox(0.7), L(2, 0.3 + k * 0.06), x=790, y=y, dur=0.2)
		b.path(rect(260, 54, 8), L(2, 0.3 + k * 0.06), x=990, y=y, color='yellow', dur=0.3, sfx='tick')
		b.text(990, y, 'UTxO', L(2, 0.33 + k * 0.06), size=24, mono=True, color='yellow', dur=0.15)
	for k in range(2):
		b.path(check(0.6), L(2, 0.5 + k * 0.06), x=790, y=470 + k * 80, color='green', dur=0.15)
	b.text(CX, 760, '+ đầu ra', L(2, 0.65), size=32, color='cyan')
	b.path(rect(360, 64, 12), L(2, 0.75), x=CX, y=860, color='green', dur=0.4)
	b.text(CX, 860, 'Build transaction', L(2, 0.78), size=28, mono=True, color='green')
	cur.move(L(2, 0.75), L(2, 0.9), 40, 470)
	# Result: tab TS, đoạn TypeScript sinh tự động, nút Download
	b.path(rect(440, 640, 10), L(3, 0.0), x=1500, y=590, color='dim', dur=0.6)
	b.text(1300, 310, 'Result', L(3, 0.05), size=26, mono=True, color='dim', anchor='lm')
	b.text(1300, 370, 'Summary  CBOR  JSON  TS', L(3, 0.1), size=22, mono=True, color='dim', anchor='lm')
	b.path(line(1580, 392, 1612, 392), L(3, 0.2), color='yellow', dur=0.2)
	b.text(1300, 430, 'Hydra mode: the transaction may\nbe unbalanced and fee-less …', L(3, 0.15), size=20, color='cyan', anchor='lt')
	snip = ["import { TxBuilder } from", "  '@hydra-sdk/transaction'", "const builder = new TxBuilder(", "  { isHydra: true })",
		"builder.setInputs(utxos, …)"]
	for k, s in enumerate(snip):
		b.text(1300, 530 + k * 38, s, L(3, 0.25 + k * 0.06), size=20, mono=True, anchor='lm')
	b.path(rect(170, 50, 8), L(3, 0.6), x=1400, y=790, dur=0.3)
	b.text(1400, 790, 'Download', L(3, 0.62), size=24, mono=True, dur=0.2)
	b.text(1610, 790, 'build-tx.ts', L(3, 0.66), size=22, mono=True, color='dim', dur=0.2)
	cur.move(L(3, 0.62), L(3, 0.8), 1400 - 924, 790 - 854)
	b.path(ellipse(120, 45), L(3, 0.82), x=1400, y=790, color='yellow', dur=0.4)


def s16(b, tm):
	L = tm.L
	b.text(CX, 170, 'Tóm lại', L(0, 0.05), size=64, color='dim')
	labels = ['1. Kết nối', '2. Lấy\nmón tiền', '3. Dựng\ngiao dịch', '4. Ký', '5. Gửi', '6. Xem\nsnapshot']
	for k, s in enumerate(labels):
		x = 210 + k * 300
		b.path(rect(250, 150, 16), L(0, 0.35 + k * 0.08), x=x, y=420, dur=0.35)
		b.text(x, 420, s, L(0, 0.4 + k * 0.08), size=36, dur=0.3)
		b.path(check(1.1), L(1, 0.1 + k * 0.14), x=x + 95, y=355, color='green', dur=0.2, sfx='tick')
	icons = [(310, 'utxo'), (650, 'lock'), (960, 'key'), (1270, 'wallet'), (1610, 'change')]
	for k, (x, kind) in enumerate(icons):
		t = L(2, 0.15 + k * 0.12)
		if kind == 'utxo':
			b.utxo(x, 690, 'UTxO', t, w=170, h=80, size=36)
		elif kind == 'lock':
			b.path(lock(1.4), t, x=x, y=680, dur=0.4)
		elif kind == 'key':
			b.path(key(1.5), t, x=x, y=690, color='cyan', dur=0.4)
		elif kind == 'wallet':
			b.path(wallet(180, 115), t, x=x, y=690, dur=0.5)
		else:
			b.text(x, 690, 'tiền thối', t, size=40, color='yellow')
	b.text(CX, 850, 'mọi khái niệm → vài chục dòng code', L(2, 0.8), size=48, color='cyan')
	b.clear(L(3, 0.0))
	# HP-06: trang "Transactions in Hydra" trên hydrasdk.com, dựng lại
	frame_ = b.group(0, 0)
	b.path(window(1000, 420), L(3, 0.05), x=CX, y=380, dur=0.7, parent=frame_)
	b.text(580, 193, 'hydrasdk.com · Transactions in Hydra', L(3, 0.1), size=22, mono=True, color='dim', anchor='lm', parent=frame_)
	b.text(500, 270, '3. Build transaction', L(3, 0.15), size=36, anchor='lm', parent=frame_)
	doc = ['const tx = await txBuilder', '  .setInputs(addrUtxos)', '  .addOutput({ … })', '  .changeAddress(walletAddress)', '  .complete()']
	for k, s in enumerate(doc):
		b.text(520, 330 + k * 44, s, L(3, 0.2 + k * 0.05), size=24, mono=True, anchor='lm', parent=frame_)
	b.text(1450, 610, 'Hình dựng lại theo hydrasdk.com', L(3, 0.3), size=22, color='dim', anchor='rm', parent=frame_)
	site = b.text(CX, 790, 'hydrasdk.com', L(3, 0.55), size=110, color='yellow', sfx='chime')
	frame_.erase(L(4, 0.0))
	site.move(L(4, 0.05), L(4, 0.3), 0, -330)
	b.path(line(-360, 0, 360, 0), L(4, 0.35), x=CX, y=545, color='yellow')
	b.text(CX, 680, 'playground.hydrasdk.com', L(4, 0.4), size=64, color='cyan')
	b.text(1840, 1010, 'Thực hiện cùng VTechcom Labs', tm.E(4, 0.3), size=34, color='dim', anchor='rm')


SCENES = {f'{i:02d}': globals()[f's{i:02d}'] for i in range(1, 17)}
