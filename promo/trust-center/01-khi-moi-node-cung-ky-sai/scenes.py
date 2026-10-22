"""Bố cục 13 cảnh của Trust Center tập 1. Mỗi hàm nhận Board và Timing (mốc từ clip giọng thật).

Mỗi cảnh nói kỹ thuật trước, rồi tới đoạn ví dụ: camera lùi để sơ đồ thu về bên trái,
thẻ "Ví dụ" (lớp HUD, không chịu camera) trượt vào bên phải. Xem example().
Mali thiếu ∈ ∉ Σ nên chuỗi có các ký hiệu này viết bằng font mono.
"""
import math

from chalk import H, W, arrow, bank, check, cross, ellipse, envelope, eye, gear, key, line, lock, monitor, note, person, rect, signature

CX, CY = 960, 540

# Nền phẳng, sạch hơn bảng đen loang của chuỗi cũ
BACKGROUND = 'clean'

# Đổi hợp âm nền: bối cảnh, gian lận, lập luận, hạn chế
CHORD_CHANGES = {'03', '05', '09', '11'}

# ---------------------------------------------------------------- hình riêng của tập


def hourglass(s=1.0):
	return [[(-30 * s, -45 * s), (30 * s, -45 * s), (-30 * s, 45 * s), (30 * s, 45 * s), (-30 * s, -45 * s)],
		[(-40 * s, -50 * s), (40 * s, -50 * s)], [(-40 * s, 50 * s), (40 * s, 50 * s)]]


def book(w=150, h=100):
	rows = [[(sx * 14, -h / 2 + 22 + k * 18), (sx * (w / 2 - 14), -h / 2 + 22 + k * 18)] for sx in (-1, 1) for k in range(int((h - 30) / 18))]
	rows = [[(min(a[0], c[0]), a[1]), (max(a[0], c[0]), c[1])] for a, c in rows]
	return rect(w, h, 8) + [[(0, -h / 2), (0, h / 2)]] + rows


def house(s=1.0):
	return [[(-70 * s, -10 * s), (0, -75 * s), (70 * s, -10 * s)], [(-55 * s, -20 * s), (-55 * s, 60 * s), (55 * s, 60 * s), (55 * s, -20 * s)],
		[(-15 * s, 60 * s), (-15 * s, 15 * s), (15 * s, 15 * s), (15 * s, 60 * s)]]


def moon(s=1.0):
	a = [(32 * s * math.cos(math.radians(k)), 32 * s * math.sin(math.radians(k))) for k in range(60, 301, 10)]
	b = [(14 * s + 26 * s * math.cos(math.radians(k)), 26 * s * math.sin(math.radians(k))) for k in range(280, 79, -10)]
	return [a + b + [a[0]]]


def invoice(w=110, h=140, x=0):
	return [[(px + x, py) for px, py in q] for q in rect(w, h, 6) + [line(-w / 2 + 16, -h / 2 + 30 + 22 * k, w / 2 - 16, -h / 2 + 30 + 22 * k)[0] for k in range(4)]]


def funnel():
	return [[(-120, -120), (-26, 30), (-26, 96)], [(120, -120), (26, 30), (26, 96)]]


def crack(h=120):
	return [[(0, -h / 2), (14, -h / 4), (-10, 0), (16, h / 5), (-4, h / 2)]]


def node(b, x, y, name, at, w=220, h=96, color='cyan', with_key=True, size=40):
	g = b.group(x, y)
	b.path(rect(w, h, 14), at, dur=0.4, color=color, parent=g, sfx='tick')
	b.text(0, 0, name, at + 0.12, size=size, color=color, parent=g, dur=0.25)
	if with_key:
		b.path(key(0.62), at + 0.3, x=w / 2 - 6, y=-h / 2 - 10, dur=0.3, color='yellow', parent=g, width=3)
	g.pop(at)
	return g


def sheet(b, x, y, at, title='bản chốt', rows=(), w=330, h=230, color='cyan', size=34):
	g = b.group(x, y)
	b.path(rect(w, h, 6), at, dur=0.5, color=color, parent=g)
	b.text(0, -h / 2 + 34, title, at + 0.2, size=size, color=color, parent=g)
	for k, (s, c) in enumerate(rows):
		b.text(0, -h / 2 + 84 + k * 38, s, at + 0.4 + k * 0.1, size=28, color=c, parent=g, mono=True)
	return g


def sig_marks(b, g, at, n=3, w=330, h=230, step=0.22, color='cyan'):
	out = []
	for k in range(n):
		x = (k - (n - 1) / 2) * (w / n)
		out.append(b.path(signature(70), at + k * step, x=x, y=h / 2 - 30, dur=0.3, color=color, width=3, parent=g, sfx='strike'))
	return out


def vault(b, x, y, at, fill_at=None, w=170, h=140, bars=4):
	g = b.group(x, y)
	b.path(rect(w, h, 10), at, color='chalk', parent=g, dur=0.45, sfx='tick')
	b.path(ellipse(17, cx=w / 2 - 32), at + 0.3, parent=g, dur=0.25, color='dim', width=3)
	if fill_at is not None:
		for k in range(bars):
			yy = h / 2 - 24 - k * 24
			b.path(line(-w / 2 + 20, yy, w / 2 - 62, yy), fill_at + k * 0.18, parent=g, dur=0.25, color='yellow', width=10, wobble=False)
	g.pop(at)
	return g


def watcher(b, x, y, at, label='canh gác', s=1.0, size=32, color='cyan'):
	g = b.group(x, y)
	b.path(eye(s), at, parent=g, dur=0.4, color=color, sfx='tick')
	if label:
		b.text(0, 52 * s + 10, label, at + 0.2, size=size, color='dim', parent=g)
	g.pop(at)
	return g


def player(b, x, y, at, name='An', s=0.8, size=36):
	g = b.group(x, y)
	b.path(person(s), at, parent=g, dur=0.45, width=4)
	b.text(0, 70 * s + 20, name, at + 0.2, size=size, color='dim', parent=g)
	return g


def card(b, x, y, at, title, color, w=420, h=250, sub=None, size=44):
	g = b.group(x, y)
	b.path(rect(w, h, 18), at, parent=g, dur=0.4, color=color, sfx='chime')
	b.text(0, -14 if sub else 0, title, at + 0.15, size=size, color=color, parent=g, dur=0.3)
	if sub:
		b.text(0, 46, sub, at + 0.3, size=28, color='dim', parent=g, dur=0.3)
	g.pop(at)
	return g


def example(b, tm, rows, icon=None, exit_at=None, icon_color='yellow'):
	"""Đoạn ví dụ: camera lùi (sơ đồ thu về bên trái), thẻ HUD trượt vào bên phải.

	rows: [(mã câu, phần câu 0–1, chữ)] — mỗi dòng chữ hiện đúng lúc câu đó được đọc.
	icon: danh sách polys vẽ ở đầu thẻ. exit_at: lúc rút thẻ và trả camera (cảnh còn tiếp sau ví dụ).
	"""
	L = tm.L
	t0 = L(rows[0][0], 0.0) - 0.25
	b.cam(t0, t0 + 0.9, 0.62, 1484, 540)
	g = b.group(1575, 540, hud=True)
	g.x += 760
	g.move(t0 + 0.05, t0 + 0.85, -760, 0, 'expo')
	b.path(rect(600, 780, 24), t0, parent=g, dur=0.05, color='yellow', width=4, fill='chalk', fill_level=0.07, wobble=False)
	b.text(0, -330, 'Ví dụ', t0 + 0.4, parent=g, size=48, color='yellow', dur=0.3)
	b.path(line(-70, 0, 70, 0), t0 + 0.6, parent=g, y=-290, color='yellow', width=3, dur=0.3)
	if icon:
		b.path(icon, t0 + 0.7, parent=g, y=-150, dur=0.8, color=icon_color, width=4)
	for k, (i, f, s) in enumerate(rows):
		t = b.text(0, 20 + k * 64, s, L(i, f), parent=g, size=38, dur=0.25, sfx='tick')
		t.pop(L(i, f))
	if exit_at is not None:
		g.move(exit_at, exit_at + 0.7, 760, 0, 'expo')
		g.erase(exit_at + 0.3, fade=0.4)
		b.cam_reset(exit_at, exit_at + 0.8)
	return g


def ratio(v):
	return f'{v:.0f}'


# ---------------------------------------------------------------- cảnh


def s01(b, tm):
	L = tm.L
	b.path(ellipse(560, 300), L(0, 0.0), x=CX, y=470, dur=0.9, color='dim', width=3)
	b.text(CX, 130, 'Hydra Head', L(0, 0.05), size=46, color='cyan', dur=0.4)
	spots = [(560, 330, 'node X'), (1360, 330, 'node Y'), (960, 700, 'node Z')]
	for k, (x, y, n) in enumerate(spots):
		node(b, x, y, n, L(0, 0.5 + k * 0.12))
	for k in range(3):
		(x0, y0, _), (x1, y1, _) = spots[k], spots[(k + 1) % 3]
		b.packet([(x0, y0), (x1, y1)], L(0, 0.8 + k * 0.06), dur=0.7, sfx='click' if k == 0 else None)
	player(b, 1720, 820, L(1, 0.0))
	u = b.utxo(1250, 640, '100 ADA', L(1, 0.25), w=190, h=70, size=34)
	u.pop(L(1, 0.25))
	b.path(line(1660, 780, 1350, 660), L(1, 0.45), color='dim', width=2)
	sh = sheet(b, CX, 430, L(2, 0.25), rows=[('An: 100', 'yellow'), ('Bình: 50', 'chalk')], h=210)
	for k, (x, y, _) in enumerate(spots):
		t = L(2, 0.5 + k * 0.1)
		b.packet([(x, y), (CX + (k - 1) * 110, 500)], t, dur=0.5, color='cyan', sfx=None)
		b.ripple(CX + (k - 1) * 110, 500, t + 0.45, r=22, n=1, dur=0.6)
	sig_marks(b, sh, L(2, 0.65), w=330, h=210)
	b.text(CX, 300, '"snapshot"', L(2, 0.9), size=30, color='dim')
	b.ring(CX, 430, 210, 140, L(3, 0.75), color='green')
	b.text(CX, 580, 'đủ 3 chữ ký mới có hiệu lực', L(3, 0.5), size=32, color='green')
	example(b, tm, [(4, 0.4, 'quỹ chung'), (4, 0.7, 'ba thủ quỹ cùng giữ sổ'), (5, 0.3, 'mỗi trang: đủ 3 chữ ký'), (5, 0.75, 'thiếu một: không tính')],
		icon=book(220, 140) + [[(x + px, 40 + py) for px, py in signature(50)[0]] for x in (-70, 0, 70)])


def s02(b, tm):
	L = tm.L
	spots = [(560, 330, 'node X'), (1360, 330, 'node Y'), (960, 700, 'node Z')]
	for k, (x, y, n) in enumerate(spots):
		node(b, x, y, n, L(0, 0.0) + k * 0.08)
	for k in range(3):
		(x0, y0, _), (x1, y1, _) = spots[k], spots[(k + 1) % 3]
		b.path(line(x0, y0, x1, y1), L(0, 0.35 + k * 0.08), color='red', width=3, dur=0.35)
		b.ripple(x0, y0, L(0, 0.5), r=60, color='red', grow=1.6, n=1)
	b.text(CX, 130, 'thông đồng', L(0, 0.4), size=52, color='red')
	u = b.utxo(1250, 640, '100 ADA', L(0, 0.0), w=190, h=70, size=34)
	sh = sheet(b, CX, 430, L(1, 0.0), rows=[('An: 100', 'yellow'), ('Bình: 50', 'chalk')], h=210)
	b.strike(CX - 100, 430 - 105 + 84, CX + 100, 430 - 105 + 84, L(1, 0.35))
	b.text(CX + 190, 410, 'An: 0', L(1, 0.45), size=30, color='red', mono=True, anchor='lm')
	for k, (x, y, _) in enumerate(spots):
		b.packet([(1250, 640), (x, y)], L(1, 0.55 + k * 0.05), dur=0.8, color='yellow', sfx='click' if k == 0 else None)
	u.erase(L(1, 0.6), fade=0.5)
	sig_marks(b, sh, L(2, 0.05), w=330, h=210)
	b.cam(L(2, 0.15), L(2, 0.15) + 1.0, 1.5, CX, 450)
	stamp = b.group(CX + 330, 520)
	b.path(rect(310, 70, 8), L(2, 0.6), parent=stamp, dur=0.2, color='green', width=6, sfx='thud')
	b.text(0, 0, 'Cardano: hợp lệ', L(2, 0.62), parent=stamp, size=38, color='green', dur=0.15)
	stamp.pop(L(2, 0.6), start=1.8, dur=0.35)
	b.shake(L(2, 0.65), 0.45, 10)
	example(b, tm, [(3, 0.05, 'lệnh chi: 3 chữ ký'), (3, 0.3, 'ngân hàng chỉ đối chiếu chữ ký'), (3, 0.7, 'cả ba ký sai: vẫn chi')],
		icon=bank(1.0), exit_at=tm.E(3, 0.1))
	b.wipe(L(4, 0.0), dur=0.6)
	v1 = b.group(CX, 300)
	b.text(0, 0, 'v1', L(4, 0.15), parent=v1, size=80, color='dim', dur=0.2)
	b.text(0, 80, 'chỉ theo dõi ký đều hay ký chậm', L(4, 0.35), parent=v1, size=36, color='dim')
	b.text(0, 140, 'chưa xử lý được gian lận', L(4, 0.7), parent=v1, size=36, color='red')
	v1.pop(L(4, 0.15))
	b.focus(L(5, 0.0), tm.total + 1, keep=[])
	v2 = b.text(CX, 560, 'v2', L(5, 0.0), size=80, color='cyan', dur=0.15)
	v2.pop(L(5, 0.0))
	for k, (s, c, f) in enumerate((('bằng chứng', 'green', 0.35), ('phạt tự động', 'red', 0.6), ('đền tiền', 'yellow', 0.85))):
		card(b, 480 + k * 480, 790, L(5, f), s, c, w=400, h=150)


def s03(b, tm):
	L = tm.L
	boxes = []
	u_pos = (330, 480)
	for r in range(3):
		for c in range(4):
			x, y = 200 + c * 130, 380 + r * 100
			lbl = 'An' if (x, y) == u_pos else ''
			boxes.append((x, y, b.utxo(x, y, lbl, L(0, 0.15), w=100, h=64, size=30, sfx=None)))
	b.stagger([g for _, _, g in boxes], L(0, 0.25), step=0.05)
	b.text(395, 270, 'số dư trong Head', L(0, 0.1), size=40, color='yellow')
	b.text(CX, 130, 'Hydra 2.2.0', L(0, 0.05), size=48, color='cyan')
	b.path(funnel(), L(0, 0.55), x=1000, y=470, dur=0.5, color='dim')
	seal = b.group(1380, 500)
	b.path(ellipse(80), L(0, 0.7), parent=seal, dur=0.5, color='cyan', glow=True)
	b.text(0, 0, '#', L(0, 0.8), parent=seal, size=90, color='cyan', dur=0.15)
	seal.pop(L(0, 0.7), dur=0.7)
	b.text(1380, 640, 'mã tóm tắt', L(0, 0.8), size=44, color='cyan')
	for k, (x, y, _) in enumerate(boxes[::2]):
		b.packet([(x, y), (1000, 360), (1000, 560), (1300, 500)], L(0, 0.75 + k * 0.03), dur=0.9, color='yellow', r=8, sfx='click' if k % 2 == 0 else None)
	ux, uy = u_pos
	b.ring(ux, uy, 80, 55, L(1, 0.15))
	b.focus(L(1, 0.2), L(3, 0.0), keep=[seal] + [g for x, y, g in boxes if (x, y) == u_pos])
	b.path([[(ux + 60, uy), (700, 640), (1100, 660), (1300, 540)]], L(1, 0.35), dur=0.8, color='green', width=4, glow=True)
	b.text(900, 710, '100 ADA của An có trong bản chốt', L(1, 0.6), size=34, color='green')
	b.path(check(1.6), L(2, 0.2), x=1500, y=420, dur=0.25, color='green', width=6, sfx='chime')
	b.ripple(1380, 500, L(2, 0.2), r=80, color='green', grow=1.8)
	t = b.text(CX, 900, 'kiểm tra được trên Cardano', L(2, 0.35), size=52, dur=0.2)
	t.pop(L(2, 0.35))
	b.wipe(L(3, 0.0), dur=0.6)
	node(b, 230, 380, 'node X', L(3, 0.1), w=230)
	sw = b.group(230, 590)
	b.path(rect(260, 100, 12), L(3, 0.15), parent=sw, dur=0.4)
	b.text(0, -14, 'phần mềm', L(3, 0.2), parent=sw, size=30)
	b.text(0, 22, 'cạnh node', L(3, 0.22), parent=sw, size=26, color='dim')
	sw.pop(L(3, 0.15))
	b.path(line(0, 0, 0, 70), L(3, 0.15), x=230, y=435, color='dim', width=3, dur=0.2)
	wal = b.group(1680, 480)
	b.path(rect(260, 170, 18), L(3, 0.2), parent=wal, dur=0.5, color='yellow')
	b.path(ellipse(9, cx=90), L(3, 0.3), parent=wal, dur=0.2, color='yellow')
	b.text(0, 140, 'ví của An', L(3, 0.3), parent=wal, size=38, color='dim')
	wal.pop(L(3, 0.2))
	b.packet([(360, 590), (700, 590), (760, 560)], L(3, 0.3), dur=0.6, color='green', label='biên lai', size=24)
	rc = b.group(CX, 600)
	b.path(rect(560, 330, 10), L(3, 0.4), parent=rc, dur=0.4, color='green', sfx='tick')
	b.text(0, -120, 'Biên lai', L(3, 0.42), parent=rc, size=52, color='green', dur=0.3)
	for k, (s, c, f) in enumerate((('bản chốt', 'cyan', 0.5), ('đủ 3 chữ ký X, Y, Z', 'cyan', 0.6), ('chứng minh: 100 ADA của An', 'yellow', 0.8))):
		r = b.text(0, -40 + k * 62, s, L(3, f), parent=rc, size=36, color=c, dur=0.2, sfx='tick')
		r.pop(r.at)
	rc.pop(L(3, 0.4), start=0.7)
	b.focus(L(4, 0.0), tm.total + 1, keep=[wal, rc])
	rc.move(L(4, 0.15), L(4, 0.15) + 0.9, 1680 - CX, 480 - 600, 'expo')
	rc.scale(L(4, 0.15), L(4, 0.15) + 0.9, 1.0, 0.32, 'expo')
	b.cam(L(4, 0.3), L(4, 0.3) + 0.9, 1.5, 1600, 500)
	b.path(check(1.8), L(4, 0.6), x=1680, y=360, dur=0.3, color='green', width=7, sfx='chime')
	b.ripple(1680, 480, L(4, 0.6), r=90, color='green', grow=1.7)
	b.text(1680, 690, 'tự kiểm tra thật hay giả', L(4, 0.7), size=36, color='green')
	example(b, tm, [(5, 0.3, 'biên lai gửi tiền'), (5, 0.7, 'có chữ ký 3 thủ quỹ'), (6, 0.2, 'ai chối: đưa biên lai ra'), (6, 0.7, 'ai cũng đối chiếu được')],
		icon=invoice(150, 180) + [[(x + px, 60 + py) for px, py in signature(36)[0]] for x in (-40, 0, 40)], icon_color='green')


def s04(b, tm):
	L = tm.L
	xs = (480, 960, 1440)
	left, right = [], []
	for k, (x, n) in enumerate(zip(xs, ('X', 'Y', 'Z'))):
		node(b, x, 160, n, L(0, 0.1 + k * 0.08), w=180, h=80, with_key=False, size=36)
		b.path(arrow(0, 0, 0, 80), L(0, 0.35 + k * 0.08), x=x, y=205, color='dim', width=3, dur=0.25)
		b.path(rect(320, 180, 12), L(0, 0.5 + k * 0.06), x=x, y=410, dur=0.4, sfx='tick')
		lg = b.group(x - 80, 410)
		for j in range(3):
			b.path(line(-55, 50 - j * 32, 55, 50 - j * 32), L(0, 0.6) + j * 0.1, parent=lg, color='chalk', width=10, wobble=False)
		rg = b.group(x + 80, 410)
		for j in range(3):
			b.path(line(-55, 50 - j * 32, 55, 50 - j * 32), L(0, 0.7) + j * 0.1, parent=rg, color='yellow', width=10, wobble=False)
		b.path(line(0, -80, 0, 80), L(0, 0.55), x=x, y=410, color='dim', width=3)
		left.append(lg)
		right.append(rg)
	b.text(CX, 560, 'khoá vào hợp đồng trên Cardano', L(0, 0.8), size=36, color='dim')
	b.focus(L(1, 0.0), L(3, 0.0), keep=left)
	l1 = b.text(CX, 680, 'ký quỹ thành viên', L(1, 0.05), size=52)
	l2 = b.text(CX, 750, 'phạt khi ký chậm, không ký', L(1, 0.55), size=36, color='dim')
	l3 = b.text(CX, 820, 'mức phạt có giới hạn · được khiếu nại', L(2, 0.2), size=36, color='dim')
	for t in (l1, l2, l3):
		t.erase(L(3, 0.0), fade=0.4)
	b.focus(L(3, 0.0), tm.E(4), keep=right)
	b.text(CX, 680, 'ký quỹ theo từng Head', L(3, 0.1), size=52, color='yellow')
	b.text(CX, 750, 'tính theo tiền trong Head · đền người chơi', L(3, 0.55), size=36, color='dim')
	b.text(CX, 840, 'hợp đồng tự xử lý · không ai can thiệp', L(4, 0.2), size=40, color='yellow')
	b.path(key(0.8), L(4, 0.5), x=530, y=840, color='dim', width=3, dur=0.2)
	b.path(cross(1.0), L(4, 0.6), x=530, y=840, color='red', width=4, dur=0.2)
	example(b, tm, [(5, 0.3, 'tiền cọc thuê nhà'), (5, 0.7, 'làm hỏng đồ: trừ cọc'), (6, 0.3, 'cọc nằm trong hợp đồng'), (6, 0.75, 'chỉ hợp đồng được trừ')],
		icon=house(1.1) + [[(x + 75, y + 30) for x, y in q] for q in lock(0.9)])


def s05(b, tm):
	L = tm.L
	b.text(CX, 130, 'Gian lận kiểu thứ nhất', L(0, 0.05), size=52, color='red')
	a = sheet(b, 700, 420, L(0, 0.4), title='bản chốt #42', rows=[('An: 100', 'yellow'), ('Bình: 50', 'chalk')], w=320, h=220)
	c = sheet(b, 1220, 420, L(0, 0.4), title='bản chốt #42', rows=[('An: 0', 'red'), ('Bình: 150', 'red')], w=320, h=220)
	for g, dx in ((a, -900), (c, 900)):
		g.x += dx
		g.move(L(0, 0.4), L(0, 0.4) + 0.9, -dx, 0, 'back')
	b.whooshes.append(L(0, 0.4))
	sig_marks(b, a, L(0, 0.7), w=320, h=220)
	sig_marks(b, c, L(0, 0.75), w=320, h=220)
	ne = b.text(960, 420, '≠', L(1, 0.1), size=110, color='red', dur=0.1, sfx='thud')
	ne.pop(L(1, 0.1))
	b.text(CX, 600, 'một số thứ tự, chỉ một bản chốt', L(1, 0.4), size=38, color='green')
	pl = player(b, 280, 800, L(2, 0.0), 'người nộp', size=32)
	vg = b.group(CX, 820)
	b.path(gear(48, 10), L(2, 0.3), parent=vg, dur=0.5, sfx='gear')
	b.text(0, 100, 'hợp đồng', L(2, 0.35), parent=vg, size=34, color='dim')
	vg.pop(L(2, 0.3))
	b.packet([(700, 530), (CX, 760)], L(2, 0.2), dur=0.6, color='cyan', sfx=None)
	b.packet([(1220, 530), (CX, 760)], L(2, 0.25), dur=0.6, color='cyan')
	st = b.group(1360, 820)
	b.path(rect(260, 80, 10), L(2, 0.75), parent=st, dur=0.15, color='red', width=6, sfx='thud')
	b.text(0, 0, 'phạt ngay', L(2, 0.77), parent=st, size=44, color='red', dur=0.1)
	st.pop(L(2, 0.75), start=1.8, dur=0.35)
	b.shake(L(2, 0.8), 0.5, 12)
	b.packet([(CX, 860), (600, 900), (300, 760)], L(3, 0.1), dur=0.9, color='yellow', label='thưởng', size=24)
	b.ripple(280, 780, L(3, 0.6), r=60, color='yellow', grow=1.6, n=1)
	example(b, tm, [(4, 0.25, 'cùng một số hoá đơn'), (4, 0.6, 'hai bản, hai số tiền'), (5, 0.2, 'đặt hai tờ cạnh nhau'), (5, 0.6, 'là đủ bằng chứng')],
		icon=invoice(100, 130, -60) + invoice(100, 130, 60))


def s06(b, tm):
	L = tm.L
	b.path(line(120, 0, 1800, 0), L(0, 0.0), y=200, color='dim', width=3, dur=0.6)
	b.text(110, 160, 'Cardano', L(0, 0.02), size=36, color='dim', anchor='lm')
	hd = b.group(620, 200)
	b.path(rect(620, 100, 10), L(0, 0.1), parent=hd, dur=0.4, color='cyan', fill='cyan')
	b.text(0, 0, 'Head đóng · bản chốt cuối: An = 0', L(0, 0.15), parent=hd, size=32, color='cyan')
	hd.pop(L(0, 0.1))
	rc = b.group(1360, 330)
	b.path(rect(380, 100, 10), L(0, 0.4), parent=rc, dur=0.4, color='green')
	b.text(0, 0, 'biên lai: An = 100', L(0, 0.45), parent=rc, size=34, color='green')
	rc.pop(L(0, 0.4))
	b.path(arrow(1160, 330, 920, 255), L(0, 0.55), color='dim', dur=0.3)
	mg = b.path([[(-8 + 26 * math.cos(a / 8 * math.pi), -8 + 26 * math.sin(a / 8 * math.pi)) for a in range(17)], [(12, 12), (40, 40)]],
		L(0, 0.6), x=1040, y=330, color='chalk', width=4, dur=0.3)
	mg.move(L(0, 0.65), L(0, 0.85), -120, 0)
	b.ring(620, 200, 330, 70, L(0, 0.85), color='red')
	watcher(b, 240, 560, L(1, 0.15), label='dịch vụ canh gác')
	ch = b.group(960, 560)
	b.path(rect(420, 100, 10), L(1, 0.4), parent=ch, dur=0.4, color='yellow')
	b.text(0, 0, 'thách thức + 5 ADA cọc', L(1, 0.45), parent=ch, size=34, color='yellow')
	ch.pop(L(1, 0.4))
	b.packet([(330, 560), (740, 560)], L(1, 0.35), dur=0.6, color='green', label='biên lai', size=22)
	b.packet([(960, 500), (960, 240)], L(1, 0.8), dur=0.5, color='yellow', sfx='thud')
	xs = (560, 960, 1360)
	for k, x in enumerate(xs):
		vault(b, x, 860, L(2, 0.0) + k * 0.08, fill_at=L(2, 0.05))
	b.cam(L(2, 0.05), L(2, 0.05) + 0.9, 1.7, 960, 760)
	for x in xs:
		t = L(2, 0.5)
		b.path(rect(210, 180, 14), t, x=x, y=860, dur=0.2, color='red', width=7, glow=True, wobble=False)
		b.ripple(x, 860, t + 0.05, r=110, color='red', grow=1.6, n=1)
	b.shake(L(2, 0.52), 0.5, 12)
	b.text(960, 1000, 'khoá ký quỹ', L(2, 0.6), size=48, color='red')
	example(b, tm, [(3, 0.2, 'quầy khiếu nại'), (3, 0.5, 'đơn + biên lai'), (3, 0.75, 'phí nhỏ, tránh khiếu nại bừa'), (4, 0.4, 'phong toả cọc ba thủ quỹ')],
		icon=note(170, 120) + [[(x + 130, y + 10) for x, y in q] for q in person(0.7)])


def s07(b, tm):
	L = tm.L
	b.path(hourglass(1.0), L(0, 0.0), x=760, y=150, dur=0.5, sfx='tick')
	b.counter(980, 150, 48, 31, L(0, 0.1), dur=tm.E(2) - L(0, 0.1), fmt=lambda v: f'{math.ceil(v):.0f} giờ', size=72, mono=True, kind='linear')
	fr = b.path(rect(200, 90, 12), L(0, 0.3), x=960, y=860, color='red', width=6, dur=0.3, wobble=False)
	b.text(960, 860, 'ký quỹ', L(0, 0.35), size=34, dur=0.2)
	b.path(arrow(960, 230, 600, 360), L(1, 0.0), color='dim', dur=0.4)
	lg = b.group(520, 470)
	b.text(0, -50, 'vẫn còn trong bản chốt cuối', L(1, 0.15), parent=lg, size=40, color='green')
	b.utxo(-100, 50, '100', L(1, 0.35), parent=lg, w=110, h=60, size=32, sfx=None)
	b.path(rect(110, 80, 6), L(1, 0.4), parent=lg, x=100, y=50, dur=0.3, color='cyan')
	b.path(line(-40, 50, 40, 50), L(1, 0.55), parent=lg, color='green', width=4)
	lg.pop(L(1, 0.15))
	b.path(arrow(960, 230, 1320, 360), L(2, 0.0), color='dim', dur=0.4)
	rg = b.group(1400, 470)
	b.text(0, -50, 'giao dịch có chữ ký của An', L(2, 0.15), parent=rg, size=40, color='green')
	b.path(signature(140), L(2, 0.35), parent=rg, y=50, dur=0.4, color='green', width=4, sfx='strike')
	b.path(key(0.8), L(2, 0.5), parent=rg, x=130, y=50, dur=0.3, color='yellow', width=3)
	rg.pop(L(2, 0.15))
	b.path(arrow(560, 580, 900, 700), L(3, 0.0), color='green', dur=0.3)
	b.path(arrow(1360, 580, 1020, 700), L(3, 0.0), color='green', dur=0.3)
	b.path(check(2.0), L(3, 0.1), x=960, y=730, color='green', width=7, dur=0.25, sfx='chime')
	b.ripple(960, 730, L(3, 0.12), r=60, color='green', grow=1.8)
	fr.erase(L(3, 0.25), fade=0.6)
	b.text(960, 935, 'mở khoá', L(3, 0.3), size=34, color='green')
	b.text(250, 880, 'An', L(3, 0.45), size=34, color='dim')
	b.text(1670, 880, 'node trả lời', L(3, 0.45), size=34, color='dim')
	b.packet([(330, 950), (960, 1020), (1560, 950)], L(3, 0.55), dur=1.1, color='yellow', label='5 ADA', size=24, keep=True)
	example(b, tm, [(4, 0.4, '48 giờ trình chứng từ'), (5, 0.2, 'tiền vẫn nằm trong sổ'), (5, 0.6, 'hoặc giấy rút tiền An đã ký')],
		icon=book(170, 110) + [[(x + 150, y + 10) for x, y in q] for q in note(90, 110)])


def s08(b, tm):
	L = tm.L
	b.path(hourglass(0.8), L(0, 0.0), x=780, y=120, dur=0.3, color='red')
	b.text(1060, 120, 'hết 48 giờ', L(0, 0.05), size=56, color='red')
	xs = (560, 960, 1360)
	for k, x in enumerate(xs):
		vault(b, x, 380, L(0, 0.1) + k * 0.06, fill_at=L(0, 0.15))
	for k, x in enumerate(xs):
		b.path(crack(130), L(0, 0.7), x=x - 10, y=380, color='red', width=5, dur=0.15, sfx='strike' if k == 0 else None)
	b.shake(L(0, 0.72), 0.55, 14)
	b.text(1640, 380, 'phạt', L(0, 0.75), size=64, color='red', sfx='thud')
	dests = [(260, L(1, 0.25)), (760, L(1, 0.6)), (1200, L(1, 0.85)), (1660, L(2, 0.1))]
	player(b, 260, 760, L(1, 0.25), 'An')
	b.text(260, 930, 'đền 100 ADA', L(1, 0.4), size=34, color='yellow')
	watcher(b, 760, 760, L(1, 0.6), label=None)
	b.text(760, 860, 'thưởng', L(1, 0.65), size=34, color='yellow')
	watcher(b, 1200, 760, L(1, 0.85), label=None)
	b.text(1200, 860, 'trả lại 5 ADA cọc', L(1, 0.9), size=34, color='yellow')
	pool = b.group(1660, 760)
	b.path(rect(260, 150, 16), L(2, 0.1), parent=pool, dur=0.4, color='cyan')
	for k in range(2):
		b.path([[(-100 + j * 20, 20 + k * 30 + 8 * math.sin(j)) for j in range(11)]], L(2, 0.2 + k * 0.1), parent=pool, color='cyan', width=3, dur=0.3)
	b.text(0, -30, 'quỹ bảo hiểm', L(2, 0.15), parent=pool, size=32, color='cyan')
	pool.pop(L(2, 0.1))
	for x, t in dests:
		b.packet([(960, 450), (960, 560), (x, 700)], t - 0.15, dur=0.8, color='yellow', sfx='click')
	b.ripple(1660, 760, L(2, 0.4), r=90, color='cyan', grow=1.6)
	example(b, tm, [(3, 0.2, 'không ai trình được chứng từ'), (3, 0.6, 'tiền cọc trả cho An trước')],
		icon=envelope(200, 130) + [[(x + 170, y + 10) for x, y in q] for q in person(0.7)])


def s09(b, tm):
	L = tm.L
	q = b.text(CX, 120, 'Vì sao phạt cả ba?', L(0, 0.0), size=64)
	sk = sheet(b, CX, 330, L(1, 0.0), title='bản chốt cuối', rows=[], w=360, h=160)
	sig_marks(b, sk, L(1, 0.15), w=360, h=160)
	xs = ((480, 'X'), (960, 'Y'), (1440, 'Z'))
	nodes = []
	for k, (x, n) in enumerate(xs):
		nodes.append(node(b, x, 640, n, L(1, 0.25 + k * 0.08), w=200, with_key=False))
		b.path(line(CX + (k - 1) * 120, 395, x, 590), L(1, 0.35 + k * 0.08), color='cyan', width=2, dur=0.3)
	b.text(CX, 470, '3 chữ ký', L(1, 0.5), size=34, color='cyan')
	b.text(1440, 520, 'trung thực?', L(1, 0.75), size=32, color='green')
	bk = b.group(1440, 860)
	b.path(book(170, 100), L(2, 0.0), parent=bk, dur=0.5, color='green')
	b.text(0, 90, 'dữ liệu đã lưu', L(2, 0.1), parent=bk, size=32, color='green')
	bk.pop(L(2, 0.0))
	rp = b.text(1720, 640, 'trả lời', L(2, 0.55), size=40, color='green')
	b.packet([(1530, 860), (1720, 860), (1720, 690)], L(2, 0.3), dur=0.7, color='green')
	b.focus(L(2, 0.0), L(3, 0.0), keep=[nodes[2], bk, rp, q])
	b.focus(L(3, 0.05), tm.total + 1, keep=[nodes[0], nodes[1], q])
	for k, (x, _) in enumerate(xs[:2]):
		b.ring(x, 640, 140, 70, L(3, 0.2 + k * 0.12), color='red')
	b.text(720, 790, 'gian lận', L(3, 0.45), size=40, color='red')
	b.text(720, 850, 'hoặc làm mất dữ liệu', L(3, 0.65), size=40, color='red')
	example(b, tm, [(4, 0.15, 'thủ quỹ trung thực'), (4, 0.45, 'không ký lệnh chi sai'), (4, 0.75, 'luôn giữ sổ sách')],
		icon=[[(x - 60, y) for x, y in q] for q in person(1.0)] + [[(x + 70, y + 20) for x, y in q] for q in book(120, 80)], icon_color='green')


def s10(b, tm):
	L = tm.L
	lx, rx, base = 720, 1200, 800

	def block(x, k, at, color):
		p = b.path(rect(220, 48, 8), at, x=x, y=base - k * 60, dur=0.25, color=color, fill=color, fill_level=0.18, sfx='tick')
		p.pop(at, dur=0.4)
		return p

	right = [block(rx, k, L(0, 0.35) + k * 0.08, 'cyan') for k in range(5)]
	left = [block(lx, k, L(0, 0.55) + k * 0.12, 'yellow') for k in range(2)]
	left += [block(lx, k, L(1, 0.05) + (k - 2) * 0.18, 'yellow') for k in range(2, 6)]
	b.text(lx, 870, 'tổng ký quỹ', L(0, 0.3), size=40, color='yellow')
	b.text(rx, 870, 'tiền trong Head', L(0, 0.3), size=40, color='cyan')
	ge = b.text(CX, 560, '≥', L(1, 0.55), size=110, color='green', dur=0.1, sfx='chime')
	ge.pop(L(1, 0.55))
	gl = b.text(CX, 960, 'gian lận không có lời', L(1, 0.75), size=48, color='green')
	example(b, tm, [(2, 0.15, 'giữ hộ 100 triệu'), (2, 0.4, 'đã đặt cọc 120 triệu'), (2, 0.75, 'ôm tiền trốn: chỉ thiệt thêm')],
		icon=bill_stack(), exit_at=tm.E(2, 0.1))
	badge = b.group(CX, 200)
	b.path(rect(380, 100, 50), L(3, 0.2), parent=badge, dur=0.35, color='green', glow=True, sfx='chime')
	b.text(0, 0, 'BONDED', L(3, 0.25), parent=badge, size=56, color='green', dur=0.15)
	badge.pop(L(3, 0.2), dur=0.65)
	b.ripple(CX, 200, L(3, 0.3), r=120, color='green', grow=1.6)
	sub = b.text(CX, 290, 'ưu tiên hiển thị · chia phí cao hơn', L(3, 0.65), size=32, color='dim')
	b.text(1650, 470, 'nhà cung cấp uy tín lâu dài', L(4, 0.15), size=32, color='dim')
	c = b.text(1650, 530, 'giảm ký quỹ thành viên', L(4, 0.6), size=36, color='green', dur=0.2)
	c.pop(L(4, 0.6))
	for p in left[3:]:
		p.erase(L(5, 0.15), fade=0.5)
	ge.erase(L(5, 0.15), fade=0.3)
	gl.erase(L(5, 0.15), fade=0.3)
	lt = b.text(CX, 560, '<', L(5, 0.3), size=110, color='red', dur=0.1)
	lt.pop(L(5, 0.3))
	badge.dim(L(5, 0.3), tm.total + 1, 0.25)
	sub.dim(L(5, 0.3), tm.total + 1, 0.25)
	b.text(CX, 960, 'hiển thị số thật · đền theo tỷ lệ', L(5, 0.6), size=44, color='yellow')


def bill_stack():
	out = []
	for k in range(3):
		out += [[(x - 80, y - k * 16 + 20) for x, y in q] for q in rect(120, 60, 6)]
	for k in range(4):
		out += [[(x + 80, y - k * 16 + 30) for x, y in q] for q in rect(120, 60, 6)]
	return out


def s11(b, tm):
	L = tm.L
	b.path(arrow(200, 0, 1740, 0), L(0, 0.0), y=380, color='dim', width=3, dur=0.6)
	b.path(line(0, -40, 0, 40), L(0, 0.15), x=420, y=380, width=5, sfx='tick')
	b.text(420, 300, 'đóng Head', L(0, 0.2), size=42)
	b.path(rect(560, 70, 6), L(0, 0.55), x=720, y=380, dur=0.6, color='yellow', fill='yellow')
	b.text(720, 470, '~6–12 giờ', L(0, 0.65), size=50, color='yellow')
	eyes = [watcher(b, 360 + k * 240, 680, L(1, 0.4), label=None, s=0.7) for k in range(6)]
	b.stagger(eyes, L(1, 0.4), step=0.1)
	b.text(CX, 810, 'dịch vụ canh gác tự động', L(1, 0.45), size=48, color='cyan')
	b.text(CX, 880, 'ai cũng tự chạy được', L(1, 0.8), size=40, color='dim')
	example(b, tm, [(2, 0.2, 'thời hạn khiếu nại ngắn'), (2, 0.6, 'cần người trông nhà'), (2, 0.8, 'thức cả ngày lẫn đêm')],
		icon=[[(x - 60, y) for x, y in q] for q in person(1.0)] + [[(x + 90, y - 30) for x, y in q] for q in moon(1.2)], exit_at=tm.E(2, 0.1))
	b.wipe(L(3, 0.0), dur=0.6)
	c1 = card(b, 560, 520, L(3, 0.1), 'tiền đứng tên ví cá nhân', 'green', w=640, h=280, sub='hợp đồng của game: cần quy tắc riêng', size=40)
	b.path(lock(1.2), L(3, 0.2), x=560, y=330, color='green', width=4)
	c2 = card(b, 1360, 520, L(4, 0.1), 'tiền đứng tên nhà vận hành', 'yellow', w=640, h=280, sub='bảo vệ nhà vận hành, chưa phải người chơi', size=40)
	b.path(bank(0.7), L(4, 0.2), x=1360, y=310, color='yellow', width=4)
	b.focus(L(4, 0.05), tm.total + 1, keep=[c2])


def s12(b, tm):
	L = tm.L
	b.text(CX, 220, 'bản thiết kế, chưa chạy thử', L(0, 0.05), size=60, color='yellow')
	b.ring(CX, 220, 470, 64, L(0, 0.45))
	b.text(CX, 340, 'mới đọc mã nguồn và nhật ký thay đổi của Hydra', L(0, 0.6), size=34, color='dim')
	card(b, 400, 640, L(1, 0.5), 'chi phí kiểm tra', 'cyan', w=480, h=240, sub='biên lai trên Cardano')
	card(b, 960, 640, L(2, 0.1), 'tạo biên lai', 'cyan', w=480, h=240, sub='từ dữ liệu của node')
	card(b, 1520, 640, L(3, 0.1), 'đọc giao dịch', 'red', w=480, h=240, sub='tiêu đúng tiền của An?')
	t = b.text(1520, 820, 'khó nhất', L(3, 0.75), size=44, color='red', dur=0.15)
	t.pop(L(3, 0.75))


def s13(b, tm):
	L = tm.L
	rows = [('biên lai → bằng chứng', 'green', 0.15), ('ký quỹ → tiền đền', 'yellow', 0.4), ('hợp đồng → tự phạt', 'cyan', 0.65)]
	for k, (s, c, f) in enumerate(rows):
		t = b.text(CX, 330 + k * 130, s, L(0, f), size=64, color=c, dur=0.2, sfx='tick')
		t.pop(L(0, f))
	b.wipe(L(1, 0.0), dur=0.6)
	t = b.text(CX, 460, 'Trust Center', L(1, 0.15), size=130, color='cyan', dur=0.2, sfx='chime')
	t.pop(L(1, 0.15), dur=0.7)
	b.path(line(-360, 0, 360, 0), L(1, 0.35), x=CX, y=560, color='cyan', glow=True, dur=0.8)
	b.text(CX, 650, 'Hydra delegated topology', L(1, 0.5), size=52, color='dim')
	b.text(1860, 1030, 'Thực hiện cùng VTechcom Labs', L(1, 0.8), size=28, color='dim', anchor='rm')


SCENES = {f'{i:02d}': globals()[f's{i:02d}'] for i in range(1, 14)}

BEATS = {}
