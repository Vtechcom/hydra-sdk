"""Bố cục 14 cảnh của tập 5. Mỗi hàm nhận Board và Timing (mốc từ clip giọng thật).

Màu nhấn cố định: món tiền vàng (yellow), datum / tờ ghi chú xanh lam (cyan), redeemer / tờ đơn hồng (red),
script / bánh răng trắng phấn (chalk), kết quả hợp lệ xanh lá (green).
"""
import math

from chalk import arrow, check, cross, ellipse, gear, key, line, lock, network, note, person, rect, signature

CX, CY = 960, 500


# ---------------------------------------------------------------- hình riêng của tập


def safe(w=360, h=320):
	"""Két sắt: thân, cửa, núm xoay, tay nắm, chân."""
	door = rect(w - 56, h - 56, 6)
	dial = ellipse(min(w, h) * 0.12)
	knob = [(0, -min(w, h) * 0.12), (0, -min(w, h) * 0.05)]
	handle = [(w * 0.22, -h * 0.12), (w * 0.22, h * 0.12)]
	feet = [[(-w / 2 + 30, h / 2), (-w / 2 + 30, h / 2 + 18)], [(w / 2 - 30, h / 2), (w / 2 - 30, h / 2 + 18)]]
	return rect(w, h, 10) + door + dial + [knob, handle] + feet


def form(w=130, h=170):
	"""Tờ đơn: trang giấy gấp góc, vài dòng chữ."""
	x0, y0, x1, y1, c = -w / 2, -h / 2, w / 2, h / 2, 26
	page = [(x0, y0), (x1 - c, y0), (x1, y0 + c), (x1, y1), (x0, y1), (x0, y0)]
	fold = [(x1 - c, y0), (x1 - c, y0 + c), (x1, y0 + c)]
	rows = [[(x0 + 18, y0 + 50 + 24 * k), (x1 - 18 - (30 if k == 3 else 0), y0 + 50 + 24 * k)] for k in range(4)]
	return [page, fold] + rows


def clock(r=110):
	ticks = [[(r * 0.82 * math.cos(a), r * 0.82 * math.sin(a)), (r * math.cos(a), r * math.sin(a))]
		for a in (k * math.pi / 2 for k in range(4))]
	return ellipse(r) + ticks + [[(0, 0), (0, -r * 0.6)], [(0, 0), (r * 0.45, r * 0.15)]]


def laptop(w=320, h=200):
	screen = rect(w, h, 10)
	base = [(-w / 2 - 40, h / 2 + 30), (w / 2 + 40, h / 2 + 30), (w / 2, h / 2), (-w / 2, h / 2), (-w / 2 - 40, h / 2 + 30)]
	return screen + [base]


def coin(r=36):
	return ellipse(r) + ellipse(r * 0.68)


def calendar(w=150, h=130):
	body = rect(w, h, 8)
	top = [(-w / 2, -h / 2 + 34), (w / 2, -h / 2 + 34)]
	rings = [[(x, -h / 2 - 14), (x, -h / 2 + 12)] for x in (-w / 4, w / 4)]
	return body + [top] + rings


def hourglass(s=1.0):
	return [[(-36 * s, -50 * s), (36 * s, -50 * s), (0, 0), (36 * s, 50 * s), (-36 * s, 50 * s), (0, 0), (-36 * s, -50 * s)]]


def timebar(w=520):
	"""Thanh thời gian có hai ngoặc hai đầu: khoảng hiệu lực của giao dịch."""
	ticks = [[(-w / 2 + w * k / 6, -8), (-w / 2 + w * k / 6, 8)] for k in range(1, 6)]
	return [[(-w / 2, 0), (w / 2, 0)], [(-w / 2 + 10, -26), (-w / 2, -26), (-w / 2, 26), (-w / 2 + 10, 26)],
		[(w / 2 - 10, -26), (w / 2, -26), (w / 2, 26), (w / 2 - 10, 26)]] + ticks


def smart_lock(b, x, y, s, at, color='chalk', gear_color='chalk', parent=None, sfx='gear'):
	"""Ổ khoá có bánh răng (hợp đồng thông minh) — hình gốc từ cảnh 11 tập 1."""
	g = b.group(x, y, parent)
	b.path(lock(s), at, dur=0.7, color=color, parent=g)
	b.path(gear(9 * s), at + 0.4, y=14 * s, dur=0.5, color=gear_color, parent=g, sfx=sfx)
	return g


def tx_block(b, x, y, at, w=320, h=190, label='Giao dịch', size=48, color='chalk', parent=None):
	g = b.group(x, y, parent)
	b.path(rect(w, h, 14), at, dur=0.5, color=color, parent=g)
	b.text(0, 0, label, at + 0.2, size=size, color=color, parent=g)
	return g


# ---------------------------------------------------------------- cảnh


def s01(b, tm):
	L = tm.L
	# Gợi lại tập 1: món tiền chưa tiêu mang một ổ khoá
	b.utxo(560, 480, 'món tiền', L(0, 0.05), w=320, h=150, size=56)
	plain = b.path(lock(3.0), L(0, 0.45), x=1060, y=440, dur=0.7)
	b.path(arrow(740, 480, 950, 470), L(0, 0.35), color='dim', dur=0.3)
	b.text(810, 640, 'mỗi món tiền · một ổ khoá', L(0, 0.5), size=44, color='dim')
	# Ổ khoá thường chỉ hỏi chữ ký của chủ
	b.path(signature(240), L(1, 0.2), x=1500, y=440, color='cyan', dur=0.5, width=4)
	b.text(1500, 550, 'đúng chữ ký của chủ?', L(1, 0.4), size=46, color='cyan')
	b.path(arrow(1360, 450, 1180, 460), L(1, 0.65), color='cyan', dur=0.3)
	# Trên Cardano: ổ khoá có bánh răng
	plain.erase(L(2, 0.2), fade=0.3)
	smart_lock(b, 1060, 440, 3.0, L(2, 0.2))
	b.text(CX, 820, 'đọc  ·  tính  ·  tự quyết định', L(2, 0.6), size=60)
	b.clear(L(3, 0.0))
	b.text(CX, 190, 'Ổ khoá biết suy nghĩ?', L(3, 0.05), size=88)
	smart_lock(b, CX, 520, 4.4, L(3, 0.25))
	b.path(arrow(CX - 300, 600, CX - 150, 600), L(3, 0.7), color='dim', dur=0.3)
	b.path(arrow(CX + 300, 600, CX + 150, 600), L(3, 0.7), color='dim', dur=0.3)


def s02(b, tm):
	L = tm.L
	b.path(safe(360, 320), L(0, 0.05), x=520, y=420, dur=1.0)
	names = ('An', 'Bình', 'Chi')
	for k, n in enumerate(names):
		x = 300 + k * 220
		b.path(person(0.85), L(0, 0.2 + k * 0.1), x=x, y=820, dur=0.5)
		b.text(x, 925, n, L(0, 0.25 + k * 0.1), size=44, color='dim')
		g = b.group(x, 700)
		b.path(rect(90, 54, 8), L(0, 0.55 + k * 0.08), parent=g, color='yellow', dur=0.3, sfx='tick')
		g.move(L(0, 0.7 + k * 0.06), L(0, 0.95 + k * 0.06), 520 - x, 430 - 700)
		g.erase(L(1, 0.05), fade=0.4)
	# Luật 1: hai trong ba
	b.text(960, 260, 'Luật 1: 2 trong 3 người ký', L(1, 0.15), size=54, anchor='lm')
	for k in range(3):
		b.path(signature(110), L(1, 0.5 + k * 0.08), x=1040 + k * 170, y=350, color='cyan', dur=0.3, width=4)
	b.path(check(1.1), L(1, 0.8), x=1040, y=400, color='green', dur=0.2)
	b.path(check(1.1), L(1, 0.85), x=1210, y=400, color='green', dur=0.2)
	b.text(1560, 380, '≥ 2', L(1, 0.9), size=56, color='green')
	# Luật 2: ngày mở
	b.text(960, 520, 'Luật 2: mở từ 01/01 năm sau', L(2, 0.05), size=54, anchor='lm')
	b.path(calendar(150, 130), L(2, 0.45), x=1070, y=660, dur=0.6, color='cyan')
	b.text(1070, 675, '01/01', L(2, 0.6), size=36, color='cyan')
	# Ngoài đời: cần người giữ két
	b.path(person(0.9), L(3, 0.0), x=1500, y=760, dur=0.5, color='dim')
	b.text(1500, 870, 'người giữ két', L(3, 0.1), size=40, color='dim')
	b.path(cross(2.4), L(3, 0.6), x=1500, y=760, color='red', width=7, dur=0.3, sfx='strike')
	b.text(1730, 760, '?', L(3, 0.8), size=110, color='yellow')


def s03(b, tm):
	L = tm.L
	# Trái: ổ khoá ghép sẵn (native script)
	b.text(520, 170, 'Native script', L(0, 0.05), size=48, color='dim')
	b.path(rect(520, 400, 18), L(0, 0.1), x=520, y=440, color='dim', dur=0.8)
	for k in range(3):
		b.path(signature(120), L(0, 0.35 + k * 0.07), x=400, y=340 + k * 60, color='cyan', dur=0.3, width=4, sfx='tick')
	b.text(640, 400, '≥ 2', L(0, 0.6), size=64, color='green')
	b.path(hourglass(0.9), L(0, 0.7), x=640, y=540, dur=0.4, sfx='tick')
	b.text(420, 560, 'sau 01/01', L(0, 0.75), size=36, color='dim')
	b.text(520, 720, 'không cần viết chương trình', L(1, 0.0), size=40, color='dim')
	b.text(520, 800, 'đếm chữ ký · so thời gian', L(1, 0.3), size=44, color='cyan')
	b.path(check(1.6), L(1, 0.8), x=820, y=250, color='green', sfx='tick')
	b.path(line(0, 120, 0, 900), L(2, 0.0), x=CX, y=0, color='dim', width=3)
	# Phải: luật phức tạp cần ổ khoá biết suy nghĩ
	b.text(1440, 190, 'mỗi người rút bao nhiêu?', L(2, 0.25), size=48)
	b.path(arrow(1440, 250, 1440, 340), L(2, 0.6), color='dim', dur=0.3)
	smart_lock(b, 1440, 450, 3.0, L(2, 0.7))
	b.text(1440, 680, 'Hợp đồng thông minh', L(3, 0.0), size=56, color='chalk')
	b.path(line(-260, 0, 260, 0), L(3, 0.4), x=1440, y=735)
	b.text(1440, 810, 'chương trình canh món tiền', L(3, 0.45), size=40, color='dim')
	b.text(1440, 900, 'script', L(3, 0.8), size=60, color='yellow')


def s04(b, tm):
	L = tm.L
	smart_lock(b, CX, 420, 3.4, L(0, 0.0))
	b.text(CX, 640, 'script', L(0, 0.5), size=46, color='dim')
	# Ba thứ đi vào
	b.path(note(170, 120), L(1, 0.0), x=330, y=300, color='cyan', dur=0.5)
	b.text(330, 190, 'datum', L(1, 0.15), size=52, color='cyan')
	b.path(arrow(440, 320, 800, 420), L(1, 0.6), color='cyan', dur=0.4, sfx='tick')
	b.path(form(130, 170), L(2, 0.0), x=330, y=650, color='red', dur=0.5)
	b.text(330, 790, 'redeemer', L(2, 0.15), size=52, color='red')
	b.path(arrow(420, 620, 800, 500), L(2, 0.6), color='red', dur=0.4, sfx='tick')
	tx_block(b, 1560, 440, L(3, 0.0), w=360, h=210)
	b.text(1560, 600, 'vào · ra · chữ ký', L(3, 0.45), size=38, color='dim')
	b.path(arrow(1370, 450, 1110, 460), L(3, 0.7), color='chalk', dur=0.4, sfx='tick')
	# Một câu trả lời
	b.path(arrow(CX - 40, 690, CX - 200, 790), L(4, 0.25), color='dim', dur=0.3)
	b.path(arrow(CX + 40, 690, CX + 200, 790), L(4, 0.25), color='dim', dur=0.3)
	b.path(rect(220, 100, 14), L(4, 0.4), x=CX - 260, y=860, color='green')
	b.text(CX - 260, 860, 'Có', L(4, 0.5), size=60, color='green')
	b.path(rect(220, 100, 14), L(4, 0.55), x=CX + 260, y=860, color='red')
	b.text(CX + 260, 860, 'Không', L(4, 0.65), size=56, color='red')


def s05(b, tm):
	L = tm.L
	b.path(safe(380, 360), L(0, 0.0), x=460, y=480, dur=1.0)
	b.path(rect(110, 80, 4), L(0, 0.4), x=460, y=360, color='cyan', dur=0.3)
	b.path(rect(720, 400, 8), L(0, 0.55), x=1260, y=420, color='cyan', dur=0.8)
	b.path(arrow(520, 340, 880, 300), L(0, 0.7), color='cyan', dur=0.3)
	b.text(1260, 170, 'tờ ghi chú = datum', L(0, 0.3), size=52, color='cyan')
	rows = ['Người ký: An, Bình, Chi', 'Cần: 2 chữ ký', 'Mở từ: 01/01 năm sau']
	for k, s in enumerate(rows):
		b.text(940, 320 + k * 100, s, L(1, 0.05 + k * 0.32), size=48, anchor='lm')
	# Dán lúc khoá tiền, đi cùng món tiền
	b.utxo(460, 790, '100 ADA', L(2, 0.05), w=260, h=100, size=50)
	b.path(line(0, 0, 0, 90), L(2, 0.35), x=460, y=680, color='cyan', width=3)
	b.text(1260, 720, 'dán lúc khoá tiền', L(2, 0.2), size=46, color='dim')
	b.text(1260, 800, 'đi cùng món tiền đến khi được tiêu', L(2, 0.55), size=46, color='dim')
	b.clear(L(3, 0.0))
	notes = ['An, Bình, Chi · 2', 'Lan, Minh · 1', 'Hà, Tú, Vy · 3', 'Quân, Nam · 2', 'Mai, Hoa, Sơn · 2']
	for k, n in enumerate(notes):
		x = 260 + k * 350
		at = L(3, 0.1 + k * 0.1)
		b.path(safe(200, 180), at, x=x, y=440, dur=0.5)
		smart_lock(b, x, 240, 1.2, at + 0.1, sfx='gear' if k == 0 else None)
		b.path(rect(300, 70, 4), at + 0.25, x=x, y=620, color='cyan', dur=0.3)
		b.text(x, 620, n, at + 0.3, size=28, color='cyan', dur=0.3)
	b.text(CX, 820, 'một ổ khoá  ·  nhiều tờ ghi chú', L(3, 0.65), size=60)


def s06(b, tm):
	L = tm.L
	b.path(form(240, 320), L(0, 0.0), x=330, y=460, color='red', dur=0.8)
	b.text(330, 250, 'tờ đơn = redeemer', L(0, 0.2), size=48, color='red')
	b.path(arrow(470, 470, 760, 470), L(0, 0.7), color='red', dur=0.3)
	smart_lock(b, 900, 430, 3.0, L(0, 0.5))
	# Hai lựa chọn trên tờ đơn
	b.path(arrow(1010, 450, 1160, 360), L(1, 0.1), color='dim', dur=0.3)
	b.text(1200, 350, 'Rút theo hạn', L(1, 0.2), size=56, anchor='lm')
	b.path(arrow(1010, 520, 1160, 620), L(1, 0.5), color='dim', dur=0.3)
	b.text(1200, 630, 'Huỷ trước hạn', L(1, 0.6), size=56, anchor='lm')
	# Mỗi lựa chọn một luật
	b.text(1220, 440, '→ cần 2 chữ ký', L(2, 0.3), size=44, color='green', anchor='lm')
	b.text(1220, 720, '→ cần đủ 3 chữ ký', L(2, 0.7), size=44, color='green', anchor='lm')
	b.path(ellipse(230, 56), L(2, 0.1), x=1370, y=350, color='cyan', dur=0.5, sfx='click')
	# Không phải chìa khoá
	b.path(key(2.0), L(3, 0.0), x=640, y=880, dur=0.5)
	b.path(cross(1.8), L(3, 0.25), x=640, y=880, color='red', width=6, dur=0.3, sfx='strike')
	b.text(800, 880, 'không phải chìa khoá, chỉ là điều bạn xin', L(3, 0.4), size=46, anchor='lm')


def s07(b, tm):
	L = tm.L
	for k, n in enumerate(('Bình', 'Chi')):
		x = 170 + k * 170
		b.path(person(0.9), L(0, 0.0 + k * 0.08), x=x, y=440, dur=0.5)
		b.text(x, 545, n, L(0, 0.05 + k * 0.08), size=42, color='dim')
	tx_block(b, 700, 440, L(0, 0.25), w=340, h=300, label='')
	b.text(700, 320, 'Giao dịch', L(0, 0.3), size=44)
	b.path(form(80, 104), L(0, 0.5), x=640, y=440, color='red', dur=0.4)
	b.text(640, 540, 'rút theo hạn', L(0, 0.55), size=28, color='red')
	for k in range(2):
		b.path(signature(100), L(0, 0.75 + k * 0.08), x=780, y=410 + k * 60, color='cyan', dur=0.3, width=4)
	b.path(arrow(880, 440, 1010, 440), L(0, 0.9), color='dim', dur=0.3)
	closed = b.group(1160, 420)
	smart_lock(b, 0, 0, 3.0, L(0, 0.1), parent=closed)
	b.path(note(110, 80), L(1, 0.0), x=1160, y=160, color='cyan', dur=0.4)
	b.path(arrow(1160, 205, 1160, 300, head=14), L(1, 0.2), color='cyan', dur=0.2)
	b.path(check(1.3), L(1, 0.75), x=1400, y=330, color='green', sfx='tick')
	b.text(1450, 330, '2 chữ ký hợp lệ', L(1, 0.5), size=46, anchor='lm')
	b.path(check(1.3), L(2, 0.75), x=1400, y=450, color='green', sfx='tick')
	b.text(1450, 450, '02/01 ≥ 01/01', L(2, 0.4), size=46, anchor='lm')
	# Ổ mở, món tiền chia cho Bình và Chi
	closed.erase(L(3, 0.3), fade=0.2)
	b.path(lock(3.0, open_=True), L(3, 0.3), x=1160, y=420, dur=0.2, color='green', sfx='click')
	b.text(1450, 560, 'Có', L(3, 0.2), size=64, color='green', anchor='lm', sfx='chime')
	b.utxo(1160, 790, '100 ADA', L(3, 0.45), w=240, h=100, size=46)
	b.path(arrow(1290, 790, 1400, 790), L(3, 0.65), color='dim', dur=0.2)
	b.utxo(1500, 740, 'Bình 50', L(3, 0.7), w=180, h=80, size=36)
	b.utxo(1720, 840, 'Chi 50', L(3, 0.8), w=180, h=80, size=36)
	b.text(120, 1010, 'ví dụ minh hoạ', L(0, 0.5), size=30, color='dim', anchor='lm')


def s08(b, tm):
	L = tm.L
	b.text(CX, 170, 'Hôm nay là ngày nào?', L(0, 0.05), size=64)
	clk = b.path(clock(120), L(0, 0.3), x=660, y=480, dur=0.8, color='dim', sfx='tick')
	smart_lock(b, 1260, 450, 3.0, L(0, 0.4))
	b.text(1450, 330, '?', L(0, 0.8), size=110, color='yellow')
	b.path(cross(3.6), L(1, 0.3), x=660, y=480, color='red', width=8, dur=0.3, sfx='strike')
	b.text(CX, 760, 'script không xem đồng hồ', L(1, 0.5), size=58, color='red')
	clk.erase(L(2, 0.0))
	b.clear(L(2, 0.0))
	# Giao dịch tự ghi khoảng hiệu lực
	b.path(rect(820, 250, 16), L(2, 0.05), x=CX, y=330)
	b.text(CX, 250, 'Giao dịch', L(2, 0.1), size=46, color='dim')
	b.path(timebar(560), L(2, 0.35), x=CX, y=340, color='cyan', dur=0.7)
	b.text(CX - 280, 410, '02/01', L(2, 0.6), size=38, color='cyan')
	b.text(CX + 280, 410, '03/01', L(2, 0.65), size=38, color='cyan')
	b.text(CX, 530, 'chỉ có hiệu lực trong khoảng này', L(2, 0.4), size=48, color='cyan')
	# Mạng kiểm tra giờ thật, script so với tờ ghi chú
	b.path(network(5, 110), L(3, 0.0), x=300, y=790, dur=0.8, color='dim')
	b.text(300, 940, 'giờ thật trong khoảng?', L(3, 0.15), size=38, color='dim')
	b.path(check(1.3), L(3, 0.35), x=470, y=700, color='green', sfx='tick')
	b.text(960, 790, '02/01  ≥  01/01', L(3, 0.6), size=62, color='green')
	b.path(rect(330, 130, 6), L(3, 0.5), x=1570, y=790, color='cyan', dur=0.4)
	b.text(1570, 790, 'Mở từ: 01/01', L(3, 0.55), size=44, color='cyan')
	b.path(arrow(1390, 790, 1240, 790), L(3, 0.75), color='dim', dur=0.3)


def s09(b, tm):
	L = tm.L
	items = [(note(120, 86), 'cyan', 'datum'), (form(90, 116), 'red', 'redeemer'), (rect(140, 90, 12), 'chalk', 'giao dịch')]
	for k, (shape, col, lab) in enumerate(items):
		y = 290 + k * 210
		b.path(shape, L(0, 0.4 + k * 0.12), x=200, y=y, color=col, dur=0.4)
		b.text(290, y, lab, L(0, 0.45 + k * 0.12), size=46, color=col, anchor='lm')
	b.text(200, 130, 'chỉ nhìn ba thứ', L(0, 0.15), size=44, color='dim', anchor='lm')
	# Đều đã nằm trong tay bạn
	b.path([[(560, 230), (590, 230), (590, 770), (560, 770)], [(590, 500), (620, 500)]], L(1, 0.0), color='dim', dur=0.5)
	b.text(650, 470, 'có sẵn', L(1, 0.2), size=40, color='dim', anchor='lm')
	b.text(650, 530, 'trước khi gửi', L(1, 0.35), size=40, color='dim', anchor='lm')
	# Chạy thử trên máy bạn, kết quả giống mạng lưới
	b.path(laptop(300, 190), L(2, 0.0), x=1200, y=420, dur=0.8)
	smart_lock(b, 1200, 400, 1.6, L(2, 0.2))
	b.text(1200, 600, 'máy bạn', L(2, 0.3), size=40, color='dim')
	b.path(arrow(1400, 420, 1530, 420), L(2, 0.5), color='dim', dur=0.3)
	b.path(network(5, 110), L(2, 0.45), x=1700, y=420, dur=0.7, color='dim')
	smart_lock(b, 1700, 400, 1.2, L(2, 0.55), sfx=None)
	b.text(1700, 600, 'mạng lưới', L(2, 0.6), size=40, color='dim')
	b.text(1460, 250, 'cùng kết quả', L(2, 0.8), size=46, color='green', sfx='chime')
	# Hỏng thì không gửi
	b.path(cross(1.6), L(3, 0.1), x=1000, y=720, color='red', width=6, dur=0.3, sfx='thud')
	b.text(1060, 720, 'ổ không mở → ví báo ngay', L(3, 0.15), size=42, color='red', anchor='lm')
	b.text(CX, 900, 'không gửi  ·  không mất phí', L(3, 0.6), size=60, color='green')


def s10(b, tm):
	L = tm.L
	b.path(line(0, 140, 0, 980), L(0, 0.0), x=CX, y=0, color='dim', width=3, dur=0.6)
	# Trái: mô hình tài khoản
	b.text(480, 170, 'Mô hình tài khoản', L(0, 0.0), size=50, color='dim')
	b.path(rect(560, 260, 10), L(0, 0.1), x=480, y=400)
	b.text(480, 310, 'trạng thái chung', L(0, 0.2), size=38, color='dim')
	b.text(480, 400, 'lúc bạn thử: 10', L(0, 0.35), size=46)
	b.text(480, 470, 'lúc chạy thật: 3', L(0, 0.7), size=46, color='red')
	b.path(cross(1.6), L(1, 0.1), x=480, y=640, color='red', width=6, dur=0.3, sfx='thud')
	b.text(480, 730, 'thất bại', L(1, 0.2), size=46, color='red')
	b.path(coin(40), L(1, 0.5), x=480, y=860, color='yellow', dur=0.4)
	b.text(560, 860, '− phí', L(1, 0.6), size=44, color='yellow', anchor='lm', sfx='thud')
	# Phải: eUTxO, chỉ còn tranh nhau một món tiền
	b.text(1440, 170, 'Cardano · eUTxO', L(2, 0.0), size=50, color='dim')
	b.utxo(1440, 330, 'món tiền', L(2, 0.1), w=260, h=100, size=46)
	tx_block(b, 1200, 600, L(2, 0.3), w=280, h=110, label='người khác', size=38, color='cyan')
	b.path(arrow(1220, 540, 1380, 390), L(2, 0.55), color='cyan', dur=0.3)
	b.path(check(1.2), L(2, 0.75), x=1340, y=470, color='green', sfx='tick')
	tx_block(b, 1680, 600, L(2, 0.6), w=280, h=110, label='của bạn', size=38)
	b.path(arrow(1660, 540, 1520, 400), L(3, 0.0), color='dim', dur=0.3)
	b.path(rect(280, 90, 10), L(3, 0.2), x=1680, y=760, color='red', width=6, sfx='thud')
	b.text(1680, 760, 'Từ chối', L(3, 0.22), size=52, color='red', dur=0.25)
	b.text(1440, 880, 'script chưa chạy', L(3, 0.45), size=42, color='dim')
	b.text(1440, 960, 'không mất phí', L(3, 0.7), size=50, color='green')


CODE11 = [
	('import { DatumUtils, RedeemerUtils } from \'@hydra-sdk/core\'', 1, 0.05),
	('const datum = DatumUtils.mkConstr(0, [', 2, 0.15),
	('  DatumUtils.mkBytesList([an, binh, chi]),', 2, 0.35),
	('  DatumUtils.mkInt(2),', 2, 0.55),
	('  DatumUtils.mkInt(unlockAt)', 2, 0.72),
	('])', 2, 0.85),
	('const redeemer = RedeemerUtils.mkSpendRedeemer(', 3, 0.3),
	('  DatumUtils.mkConstr(0, [])  // Rút theo hạn', 3, 0.05),
	(')', 3, 0.55),
]


def s11(b, tm):
	L = tm.L
	b.text(150, 110, 'Cho lập trình viên', L(0, 0.0), size=46, color='cyan', anchor='lm')
	b.text(1770, 110, '@hydra-sdk/core', L(1, 0.3), size=36, color='dim', anchor='rm', mono=True)
	x0, y0, lh = 150, 230, 72
	for i, (src, li, f) in enumerate(CODE11):
		col = 'dim' if src.strip() in ('])', ')') else 'chalk'
		b.text(x0, y0 + i * lh, src, L(li, f), size=36, mono=True, anchor='lm', color=col)
	b.path(note(110, 80), L(2, 0.1), x=1300, y=y0 + 3 * lh, color='cyan', dur=0.4)
	b.text(1380, y0 + 2.6 * lh, 'tờ ghi chú:', L(2, 0.3), size=38, color='cyan', anchor='lm')
	b.text(1380, y0 + 3.4 * lh, '3 khoá · số 2 · mốc mở', L(2, 0.5), size=38, color='cyan', anchor='lm')
	b.path(form(80, 104), L(3, 0.1), x=1300, y=y0 + 7 * lh, color='red', dur=0.4)
	b.text(1380, y0 + 7 * lh, 'tờ đơn', L(3, 0.3), size=38, color='red', anchor='lm')
	intro = [b.path(note(170, 120), L(0, 0.3), x=560, y=520, color='cyan', dur=0.4),
		b.path(form(120, 156), L(0, 0.4), x=800, y=520, color='red', dur=0.4),
		b.path(arrow(920, 520, 1120, 520), L(0, 0.55), color='dim', dur=0.3),
		b.text(1400, 520, 'Plutus Data', L(0, 0.65), size=72, color='yellow')]
	for e in intro:
		e.erase(L(1, 0.0))
	b.text(1770, 950, 'datum, redeemer  →  Plutus Data', L(1, 0.0), size=44, color='yellow', anchor='rm')


CHAIN = [
	('.txInScript(…)', 'script', 'chalk'),
	('.txInInlineDatum(…)', 'datum', 'cyan'),
	('.txInRedeemerValue(…)', 'redeemer', 'red'),
	('.invalidBefore(slot)', 'khoảng hiệu lực', 'cyan'),
	('.txInCollateral(…)', 'tiền thế chấp', 'yellow'),
	('.complete()', 'chạy thử nếu có', 'green'),
]


def s12(b, tm):
	L = tm.L
	b.text(150, 110, 'Cho lập trình viên', L(0, 0.0), size=46, color='cyan', anchor='lm')
	b.text(1770, 110, '@hydra-sdk/core · @hydra-sdk/transaction', L(0, 0.3), size=32, color='dim', anchor='rm', mono=True)
	b.text(150, 240, 'PlutusUtils.applyParamsToScript(…)', L(1, 0.05), size=36, mono=True, anchor='lm')
	b.text(150, 320, 'PlutusUtils.validatorToAddress(…)', L(1, 0.6), size=36, mono=True, anchor='lm')
	smart_lock(b, 1140, 250, 2.2, L(0, 0.3))
	b.text(1140, 360, 'đã biên dịch', L(0, 0.6), size=34, color='dim')
	b.text(1440, 210, 'mã băm', L(1, 0.4), size=36, color='dim')
	b.path(arrow(1240, 260, 1420, 260), L(1, 0.65), color='dim', dur=0.3)
	b.text(1620, 260, 'addr_test1…', L(1, 0.8), size=40, mono=True, color='yellow')
	b.path(line(-830, 0, 830, 0), L(2, 0.0), x=CX, y=430, color='dim', width=3)
	# Chuỗi phương thức TxBuilder
	x0, y0, lh = 150, 510, 72
	b.text(x0, y0, 'new TxBuilder()', L(2, 0.05), size=36, mono=True, anchor='lm', color='cyan')
	marks = [L(2, 0.25), L(2, 0.4), L(2, 0.55), L(2, 0.8), L(3, 0.2), L(4, 0.1)]
	for k, ((src, lab, col), at) in enumerate(zip(CHAIN, marks)):
		y = y0 + (k + 1) * lh
		b.text(x0 + 40, y, src, at, size=36, mono=True, anchor='lm')
		b.text(760, y, lab, at + 0.3, size=36, color=col, anchor='lm')
	b.path(coin(26), L(3, 0.4), x=1110, y=y0 + 5 * lh, color='yellow', dur=0.3)
	b.text(1440, 640, 'phòng khi script lỗi', L(3, 0.5), size=40, color='yellow')
	b.text(1440, 700, 'sau khi đã gửi', L(3, 0.6), size=40, color='yellow')
	b.path(gear(30), L(4, 0.3), x=1180, y=y0 + 6 * lh, color='green', dur=0.5, sfx='gear')
	b.text(1240, y0 + 6 * lh, 'chạy thử → tính phí đúng', L(4, 0.45), size=40, color='green', anchor='lm')


def s13(b, tm):
	L = tm.L
	b.path(line(-760, 0, 760, 0), L(0, 0.0), x=CX, y=760, dur=0.9)
	b.text(260, 830, 'Cardano · lớp 1', L(0, 0.1), size=48, anchor='lm')
	b.path(ellipse(460, 230), L(0, 0.2), x=CX, y=430, color='cyan', dur=1.0)
	b.text(CX, 150, 'Hydra Head · lớp 2', L(0, 0.35), size=52, color='cyan')
	g = b.group(CX, 900)
	b.path(safe(240, 210), L(0, 0.05), parent=g, dur=0.5)
	smart_lock(b, 0, -175, 1.5, L(0, 0.15), parent=g, sfx=None)
	b.path(rect(70, 46, 3), L(0, 0.25), x=0, y=-65, parent=g, color='cyan', dur=0.2)
	g.move(L(0, 0.55), L(0, 0.95), 0, 490 - 900)
	b.text(CX, 960, 'cùng script · cùng datum · cùng redeemer', L(1, 0.05), size=48, color='green')
	b.path(check(1.6), L(1, 0.6), x=CX - 260, y=460, color='green', sfx='tick')
	b.path(timebar(200), L(2, 0.2), x=CX + 280, y=440, color='red', dur=0.5)
	b.text(CX + 280, 370, '!', L(2, 0.35), size=70, color='red', sfx='thud')
	b.text(1680, 830, 'luật thời gian: kiểm tra lại', L(2, 0.45), size=42, color='red', anchor='rm')


def s14(b, tm):
	L = tm.L
	b.text(CX, 170, 'Tóm lại', L(0, 0.0), size=64, color='dim')
	pts = [(note(100, 72), 'cyan', '1. Datum: tờ ghi chú trên món tiền'),
		(form(70, 90), 'red', '2. Redeemer: tờ đơn của người mở'),
		(gear(28), 'chalk', '3. Script: luật, chạy thử được trước')]
	for k, (shape, col, s) in enumerate(pts):
		y = 340 + k * 170
		b.path(shape, L(k + 1, 0.0), x=230, y=y, color=col, dur=0.4)
		b.text(330, y, s, L(k + 1, 0.05), size=58, anchor='lm', color=col, sfx='chime')
	b.clear(L(4, 0.0))
	b.text(CX, 480, 'hydrasdk.com', L(4, 0.15), size=120, color='yellow')
	b.path(line(-380, 0, 380, 0), L(4, 0.6), x=CX, y=570, color='yellow')
	b.text(1840, 1010, 'Thực hiện cùng VTechcom Labs', tm.E(4, 0.3), size=34, color='dim', anchor='rm')


SCENES = {f'{i:02d}': globals()[f's{i:02d}'] for i in range(1, 15)}
