"""Bố cục 13 cảnh của tập 2. Mỗi hàm nhận Board và Timing (mốc từ clip giọng thật)."""
import math

from chalk import arrow, check, cross, ellipse, envelope, gear, key, line, lock, monitor, network, note, person, rect, signature

CX, CY = 960, 500

# ---------------------------------------------------------------- hình riêng của tập 2


def book(w=360, h=240):
	"""Cuốn sổ mở: khung, gáy giữa, vài dòng chữ mỗi trang."""
	rows = [line(sx * 30, -h / 2 + 40 + k * 34, sx * (w / 2 - 30), -h / 2 + 40 + k * 34)[0]
		for sx in (-1, 1) for k in range(int((h - 60) / 34))]
	rows = [[(min(a[0], c[0]), a[1]), (max(a[0], c[0]), c[1])] for a, c in rows]
	return rect(w, h, 10) + [[(0, -h / 2), (0, h / 2)]] + rows


def hourglass(s=1.0):
	return [[(-30 * s, -45 * s), (30 * s, -45 * s), (-30 * s, 45 * s), (30 * s, 45 * s), (-30 * s, -45 * s)],
		[(-40 * s, -50 * s), (40 * s, -50 * s)], [(-40 * s, 50 * s), (40 * s, 50 * s)]]


def chain(w, h, r=16):
	"""Sợi xích quấn quanh một khối: các mắt xích nhỏ chạy theo chu vi."""
	pts = []
	step = r * 1.7
	for (x0, y0), (x1, y1) in (((-w / 2, -h / 2), (w / 2, -h / 2)), ((w / 2, -h / 2), (w / 2, h / 2)),
			((w / 2, h / 2), (-w / 2, h / 2)), ((-w / 2, h / 2), (-w / 2, -h / 2))):
		n = max(1, int(math.hypot(x1 - x0, y1 - y0) / step))
		horiz = y0 == y1
		for k in range(n):
			u = k / n
			x, y = x0 + (x1 - x0) * u, y0 + (y1 - y0) * u
			pts += ellipse(r, r * 0.55, cx=x, cy=y, n=16) if horiz else ellipse(r * 0.55, r, cx=x, cy=y, n=16)
	return pts


def hydra_snake():
	"""Con rắn nhiều đầu: thân uốn từ dưới lên, ba cổ toả ra, mỗi cổ một cái đầu."""
	body = [(-420 + k * 30, 260 + 40 * math.sin(k * 0.55)) for k in range(15)]
	neck_base = body[-1]
	heads = [(-330, -230), (20, -300), (360, -230)]
	necks = []
	for hx, hy in heads:
		bx, by = neck_base
		necks.append([(bx + (hx - bx) * u + 50 * math.sin(u * math.pi * 2), by + (hy - by) * u) for u in [k / 12 for k in range(13)]])
	heads_p = [ellipse(46, 28, cx=hx, cy=hy - 10)[0] for hx, hy in heads]
	eyes = [ellipse(5, cx=hx + 18, cy=hy - 16, n=8)[0] for hx, hy in heads]
	return [body] + necks + heads_p + eyes, heads


def sheet(w=380, h=300):
	"""Tờ giấy trơn (snapshot): chỉ có khung, để chữ ký và chữ không bị đè."""
	return rect(w, h, 6)


def coin(b, x, y, at, parent=None, r=30, label='ADA', size=22):
	g = b.group(x, y, parent)
	b.path(ellipse(r), at, dur=0.3, color='yellow', parent=g)
	b.text(0, 0, label, at + 0.15, size=size, color='yellow', parent=g, dur=0.2)
	return g


def people(b, at, spots, s=0.8, color='chalk', names=None, name_dy=None, step=0.08):
	"""Vẽ một nhóm người que; trả về danh sách group để di chuyển được."""
	gs = []
	for k, (x, y) in enumerate(spots):
		g = b.group(x, y)
		b.path(person(s), at + k * step, parent=g, dur=0.45, color=color, width=4)
		if names:
			dy = name_dy if name_dy is not None else 90 * s
			b.text(0, dy, names[k], at + k * step + 0.2, size=38, color='dim', parent=g, dur=0.3)
		gs.append(g)
	return gs


NAMES = ['An', 'Bình', 'Chi', 'Dũng']


# ---------------------------------------------------------------- cảnh


def s01(b, tm):
	L = tm.L
	b.path(ellipse(280, 80), L(0, 0.0), x=CX, y=600, dur=0.8)
	seats = [(CX - 430, 600), (CX - 150, 430), (CX + 150, 430), (CX + 430, 600)]
	gs = people(b, L(0, 0.1), seats, s=0.9)
	for k, (x, y) in enumerate(seats):
		dy = -150 if y < 500 else 110
		b.text(x, y + dy, NAMES[k], L(0, 0.2 + k * 0.05), size=40, color='dim')
	c = coin(b, CX - 430 + 60, 560, L(0, 0.55))
	c.move(L(0, 0.65), L(0, 0.95), 860 - 120, 0)
	b.text(CX + 430, 460, '+2 ADA', L(0, 0.9), size=44, color='yellow')
	b.text(CX, 140, '100 ván', L(1, 0.1), size=66)
	pairs = [(1, 0), (2, 3), (0, 2), (3, 1)]
	for k, (i, j) in enumerate(pairs):
		(x0, y0), (x1, y1) = seats[i], seats[j]
		t = L(1, 0.35 + k * 0.13)
		g = coin(b, x0, y0 - 30, t, r=24, size=18)
		g.move(t + 0.2, t + 0.6, x1 - x0, y1 - y0)
		g.erase(t + 0.8, fade=0.3)
	b.path(hourglass(1.0), L(2, 0.1), x=CX, y=600, dur=0.5, color='cyan')
	b.text(CX, 820, 'Đang chờ xác nhận…', L(2, 0.25), size=50, color='cyan')
	b.path(network(6, 130), L(2, 0.5), x=1660, y=330, dur=0.9, color='dim')
	b.text(1660, 470, 'cả mạng Cardano', L(2, 0.6), size=36, color='dim')
	for k, (x, y) in enumerate(((240, 300), (330, 430), (210, 560), (320, 690))):
		b.path(hourglass(0.6), L(3, 0.05 + k * 0.1), x=x, y=y, dur=0.3, color='dim', sfx='tick')
	b.text(CX, 950, 'Chuyện của 4 người, sao phải chờ cả thế giới?', L(3, 0.0), size=48, dur=1.2)
	b.clear(L(4, 0.0))
	b.text(CX, 420, '?', L(4, 0.05), size=160, color='dim', dur=0.3)
	b.text(CX, 640, 'Hydra', L(4, 0.6), size=170, color='cyan', sfx='chime')
	b.path(line(-230, 0, 230, 0), L(4, 0.9), x=CX, y=740, color='cyan')


def s02(b, tm):
	L = tm.L
	b.path(book(440, 280), L(0, 0.0), x=CX, y=400, dur=1.0)
	b.text(CX, 220, 'Sổ chung', L(0, 0.3), size=58)
	for k, x in enumerate((CX - 140, CX + 80)):
		b.utxo(x, 400, '', L(0, 0.6 + k * 0.1), w=70, h=40, size=20, sfx=None)
	spots = [(300, 230), (240, 430), (300, 630), (1620, 230), (1680, 430), (1620, 630)]
	for k, (x, y) in enumerate(spots):
		b.path(monitor(0.8), L(1, 0.2 + k * 0.08), x=x, y=y, dur=0.4, color='dim')
		b.path(book(60, 38), L(1, 0.3 + k * 0.08), x=x, y=y, dur=0.3, color='dim', width=3)
		ex = CX - 230 if x < CX else CX + 230
		b.path(line(x + (70 if x < CX else -70), y, ex, 400 + (y - 430) * 0.4), L(1, 0.5 + k * 0.05), color='dim', width=2, dur=0.3)
	b.text(CX, 600, 'nhiều máy, cùng một cuốn sổ', L(1, 0.7), size=36, color='dim')
	b.path(rect(260, 110, 12), L(2, 0.3), x=1180, y=800, color='cyan')
	b.text(1180, 800, 'Khối mới', L(2, 0.4), size=44, color='cyan')
	for k in range(4):
		x = 460 + k * 150
		b.path(rect(110, 64, 8), L(2, 0.05 + k * 0.06), x=x, y=800, dur=0.3, sfx='tick' if k == 0 else None)
		b.text(x, 800, 'tx', L(2, 0.1 + k * 0.06), size=32, color='dim', dur=0.2)
	b.path(arrow(990, 800, 1040, 800), L(2, 0.35), color='dim', dur=0.2)
	b.path(arrow(1300, 745, 1215, 555), L(2, 0.75), color='cyan', dur=0.4, sfx='thud')
	b.path(hourglass(0.7), L(3, 0.05), x=1500, y=800, dur=0.4, color='chalk')
	b.text(1560, 800, '~20 giây / khối', L(3, 0.15), size=44, anchor='lm')
	for k in range(2):
		b.path(rect(110, 64, 8), L(3, 0.55 + k * 0.1), x=310 - k * 150, y=800, dur=0.3, color='dim')
	b.path(lock(1.4), L(4, 0.4), x=CX + 290, y=250, dur=0.5, color='green')
	b.text(CX, 960, 'chậm, nhưng không ai sửa sổ một mình', L(4, 0.3), size=46, color='green')


def s03(b, tm):
	L = tm.L
	quad = [(170, 300), (290, 300), (170, 520), (290, 520)]
	people(b, L(0, 0.0), quad, s=0.6)
	b.text(230, 650, 'bốn người bạn', L(0, 0.2), size=36, color='dim')
	b.path(book(380, 250), L(0, 0.1), x=1560, y=420, dur=0.8)
	b.text(1560, 240, 'Sổ chung', L(0, 0.25), size=48)
	tickets = []
	for k in range(5):
		x = 520 + k * 175
		g = b.group(x, 420)
		at = L(0, 0.45 + k * 0.1)
		b.path(rect(150, 90, 10), at, parent=g, dur=0.35, sfx='tick')
		b.text(0, 0, f'Ván {k + 1}', at + 0.15, size=34, parent=g, dur=0.3)
		tickets.append(g)
	b.path(arrow(1305, 420, 1362, 420, head=16), L(0, 0.95), color='dim', dur=0.2)
	for k, g in enumerate(tickets):
		coin(b, 55, 55, L(1, 0.15 + k * 0.1), parent=g, r=20, label='phí', size=16)
	b.path(hourglass(0.8), L(1, 0.6), x=1560, y=640, dur=0.4, color='cyan')
	b.text(1560, 740, 'chờ khối mới', L(1, 0.7), size=38, color='cyan')
	big = b.group(CX, 800)
	b.path(rect(320, 150, 14), L(2, 0.2), parent=big, color='chalk')
	b.text(0, -20, 'Ván 47', L(2, 0.3), size=54, parent=big)
	b.text(0, 40, 'ai thắng? ai thua?', L(2, 0.45), size=32, color='dim', parent=big)
	b.path(cross(1.6), L(2, 0.75), x=CX + 210, y=760, color='red', dur=0.3, sfx='strike')
	b.text(CX + 260, 860, 'cả mạng không cần biết', L(2, 0.55), size=36, color='red', anchor='lm', dur=0.8)
	b.clear(L(3, 0.0))
	b.text(CX, 230, 'Cuối buổi, mỗi người còn bao nhiêu?', L(3, 0.05), size=62)
	for k, (n, v) in enumerate(zip(NAMES, ('14', '6', '11', '9'))):
		x = 420 + k * 360
		b.path(person(0.7), L(3, 0.3 + k * 0.08), x=x, y=520, dur=0.4, width=4)
		b.text(x, 610, n, L(3, 0.35 + k * 0.08), size=38, color='dim')
		b.utxo(x, 730, v + ' ADA', L(3, 0.5 + k * 0.08), w=200, h=90, size=42)
	b.text(CX, 920, 'chỉ cần ghi kết quả này vào sổ chung', L(3, 0.85), size=40, color='dim')


def s04(b, tm):
	L = tm.L
	b.path(book(300, 200), L(0, 0.0), x=290, y=460, dur=0.7, color='dim')
	b.text(290, 310, 'Sổ chung', L(0, 0.1), size=44, color='dim')
	b.path(rect(860, 600, 16), L(0, 0.3), x=1180, y=480, dur=1.0, color='cyan')
	b.text(1180, 130, 'Phòng họp riêng', L(0, 0.45), size=56, color='cyan')
	door = b.path(line(750, 600, 750, 740), L(0, 0.55), color='yellow', width=8, dur=0.2)
	inside = [(900, 400), (900, 640), (1460, 400), (1460, 640)]
	gs = people(b, L(0, 0.0), [(560, 860), (640, 860), (720, 860), (800, 860)], s=0.6)
	for k, (g, (x, y)) in enumerate(zip(gs, inside)):
		g.move(L(0, 0.6 + k * 0.05), L(0, 0.95 + k * 0.03), x - (560 + k * 80), y - 860)
	b.path(book(260, 170), L(1, 0.0), x=1180, y=500, dur=0.7, color='chalk')
	b.text(1180, 360, 'Sổ nhỏ', L(1, 0.15), size=42)
	for k, (x, y) in enumerate(inside):
		nx = x + (90 if x < 1180 else -90)
		b.path(note(70, 52), L(1, 0.45 + k * 0.1), x=nx, y=y - 30, dur=0.3, color='dim', width=3)
	for k in range(4):
		y = 450 + k * 30
		b.path(check(0.6), L(2, 0.1 + k * 0.15), x=1100 + (k % 2) * 170, y=y, color='green', dur=0.2, width=4, sfx='tick')
	b.text(1180, 700, 'ghi ngay, không xếp hàng', L(2, 0.4), size=38, color='green')
	res = b.group(1180, 500)
	b.path(note(110, 80), L(3, 0.35), parent=res, color='yellow', dur=0.4)
	res.move(L(3, 0.5), L(3, 0.9), 290 - 1180, 0)
	door.erase(L(3, 0.2), fade=0.2)
	b.path(line(750, 600, 680, 690), L(3, 0.25), color='yellow', width=8, dur=0.2)
	b.text(CX, 960, 'Kết quả cuối cùng → Sổ chung', L(3, 0.6), size=54, color='yellow')


def s05(b, tm):
	L = tm.L
	b.path(line(-800, 0, 800, 0), L(0, 0.2), x=CX, y=620, dur=0.9)
	b.path(book(360, 220), L(0, 0.35), x=CX, y=820, dur=0.8)
	b.text(260, 820, 'Lớp 1: Cardano', L(0, 0.5), size=52, anchor='lm')
	b.path(rect(620, 300, 16), L(1, 0.0), x=CX, y=360, dur=0.9, color='cyan')
	b.text(260, 360, 'Lớp 2', L(1, 0.3), size=52, color='cyan', anchor='lm')
	b.path(arrow(CX, 600, CX, 530), L(1, 0.6), color='dim', dur=0.3)
	b.text(CX, 300, 'Hydra Head', L(2, 0.65), size=64, color='cyan', sfx='chime')
	people(b, L(2, 0.3), [(CX - 150, 420), (CX - 50, 420), (CX + 50, 420), (CX + 150, 420)], s=0.4)
	b.clear(L(3, 0.0))
	snake, heads = hydra_snake()
	sn = b.path(snake, L(3, 0.05), x=CX, y=560, dur=2.2, color='chalk', width=5)
	b.text(1420, 860, 'thần thoại Hy Lạp', L(3, 0.3), size=40, color='dim')
	hs = [b.text(CX + hx, 560 + hy - 125, 'Head', L(3, 0.75 + k * 0.06), size=38, color='cyan') for k, (hx, hy) in enumerate(heads)]
	sn.erase(L(4, 0.0), fade=0.8)
	for k, (hx, hy) in enumerate(heads):
		x, y = CX + hx, 560 + hy - 10
		b.path(rect(250, 160, 12), L(4, 0.05 + k * 0.15), x=x, y=y, dur=0.5, color='cyan')
		n = 2 + k % 2
		people(b, L(4, 0.2 + k * 0.15), [(x + (j - (n - 1) / 2) * 70, y + 20) for j in range(n)], s=0.35, step=0.05)
	b.text(CX, 990, 'nhiều Head cùng lúc, mỗi nhóm một phòng', L(4, 0.6), size=46, color='cyan')


def s06(b, tm):
	L = tm.L
	b.path(rect(1300, 260, 16), L(0, 0.0), x=CX, y=300, dur=0.9, color='cyan')
	b.text(330, 130, 'Hydra Head', L(0, 0.1), size=46, color='cyan', anchor='lm')
	b.path(line(-800, 0, 800, 0), L(0, 0.2), x=CX, y=560, dur=0.6, color='dim')
	b.text(160, 610, 'Cardano', L(0, 0.3), size=44, color='dim', anchor='lm')
	q = b.text(CX, 300, '?', L(0, 0.5), size=120, color='dim', dur=0.3)
	vals = ['20', '15', '8', '12']
	xs = [570 + k * 260 for k in range(4)]
	for k, (v, x) in enumerate(zip(vals, xs)):
		b.utxo(x, 760, v + ' ADA', L(1, 0.1 + k * 0.08), w=200, h=92, size=40, locked=True)
	b.path(chain(1140, 170), L(1, 0.55), x=CX, y=760, dur=1.0, color='chalk', width=3, sfx='click')
	b.text(CX, 920, 'Khoá trên Cardano, dành riêng cho Head', L(1, 0.45), size=46, dur=1.2)
	b.path(person(0.7), L(2, 0.0), x=150, y=800, dur=0.4, color='red', width=4)
	b.path(arrow(210, 770, 370, 770), L(2, 0.3), color='red', dur=0.3)
	b.path(cross(1.4), L(2, 0.55), x=290, y=700, color='red', dur=0.3, sfx='thud')
	b.text(110, 900, 'tiêu chỗ khác?', L(2, 0.4), size=34, color='red', anchor='lm')
	q.erase(L(3, 0.0), fade=0.3)
	for k, (v, x) in enumerate(zip(vals, xs)):
		t = L(3, 0.1 + k * 0.1)
		g = b.utxo(x, 760, v + ' ADA', t, w=200, h=92, size=40, locked=True, sfx='tick')
		g.move(t + 0.3, t + 1.0, 0, 300 - 760)
	b.text(CX, 480, 'cùng số lượng, cùng ổ khoá', L(3, 0.75), size=40, color='cyan')


def s07(b, tm):
	L = tm.L
	b.path(rect(1640, 820, 18), L(0, 0.0), x=CX, y=540, dur=1.0, color='cyan')
	b.text(CX, 90, 'Bên trong Hydra Head', L(0, 0.2), size=52, color='cyan')
	b.text(CX, 220, 'vẫn là mô hình UTxO', L(0, 0.6), size=48, color='dim')
	b.utxo(330, 420, '50 ADA', L(1, 0.0), w=220, h=110, size=50)
	closed = b.path(lock(1.4), L(1, 0.2), x=330, y=530, dur=0.4)
	k = b.path(key(1.2), L(1, 0.45), x=560, y=560, dur=0.4, color='cyan')
	k.move(L(1, 0.55), L(1, 0.8), -170, -10)
	closed.erase(L(1, 0.85), fade=0.15)
	b.path(lock(1.4, open_=True), L(1, 0.85), x=330, y=530, dur=0.15, color='green', sfx='click')
	b.path(arrow(450, 420, 650, 420), L(2, 0.0), color='dim', dur=0.3)
	b.path(rect(200, 120, 12), L(2, 0.1), x=760, y=420)
	b.text(760, 420, 'tx', L(2, 0.2), size=48, color='dim')
	b.strike(220, 420, 440, 420, L(2, 0.35))
	for j, (v, y, lab) in enumerate((('30 ADA', 330, 'người thắng'), ('20 ADA', 520, 'tiền thối'))):
		b.path(arrow(870, 420, 1000, y), L(2, 0.45 + j * 0.15), color='dim', dur=0.3)
		b.utxo(1110, y, v, L(2, 0.5 + j * 0.15), w=200, h=90, size=42, locked=True)
		b.text(1110, y + 70, lab, L(2, 0.6 + j * 0.15), size=32, color='dim', dur=0.3)
	b.path(envelope(260, 170), L(3, 0.0), x=1520, y=420, dur=0.6, color='yellow')
	b.path([[(-26, 20), (0, -24), (26, 20), (-26, 20)]], L(3, 0.25), x=1470, y=440, color='cyan', dur=0.3)
	b.path(rect(48, 48, 6), L(3, 0.3), x=1560, y=440, color='green', dur=0.3)
	b.path(gear(22), L(3, 0.45), x=1520, y=600, color='cyan', dur=0.4, sfx='gear')
	b.text(1520, 680, 'token · hợp đồng', L(3, 0.5), size=34, color='cyan')
	b.text(CX, 820, 'Dựng giao dịch: như trên mạng chính', L(4, 0.15), size=50)
	b.text(CX, 890, 'TxBuilder', L(4, 0.5), size=40, mono=True, color='dim')


def s08(b, tm):
	L = tm.L
	b.path(rect(1560, 740, 18), L(0, 0.0), x=CX, y=540, dur=0.9, color='cyan')
	b.text(CX, 110, 'Ai xác nhận?', L(0, 0.3), size=60)
	seats = [(420, 340), (1500, 340), (420, 720), (1500, 720)]
	for k, (x, y) in enumerate(seats):
		b.path(person(0.6), L(1, 0.3 + k * 0.08), x=x + (-110 if x < CX else 110), y=y + 20, dur=0.4, width=4)
		b.path(monitor(0.9), L(1, 0.4 + k * 0.08), x=x, y=y, dur=0.4, color='chalk')
		b.path(book(56, 34), L(1, 0.5 + k * 0.08), x=x, y=y, dur=0.3, color='dim', width=3)
	b.path(rect(190, 80, 10), L(2, 0.0), x=CX, y=260, color='cyan')
	b.text(CX, 260, 'tx mới', L(2, 0.05), size=40, color='cyan')
	for k, (x, y) in enumerate(seats):
		b.path(check(0.8), L(2, 0.2 + k * 0.05), x=x + (80 if x < CX else -80), y=y - 70, color='green', dur=0.2, width=4, sfx='tick' if k == 0 else None)
	b.path(sheet(380, 300), L(2, 0.5), x=CX, y=560, dur=0.6, color='yellow')
	b.text(CX, 470, 'Snapshot', L(2, 0.6), size=52, color='yellow')
	b.text(CX, 780, '= trạng thái sổ lúc này', L(2, 0.8), size=38, color='dim')
	for k in range(4):
		y = 560 + (k // 2) * 70 + 10
		x = CX - 90 + (k % 2) * 180
		b.path(signature(110), L(3, 0.05 + k * 0.1), x=x, y=y, color='cyan', dur=0.3, width=3, sfx='tick')
	b.path(rect(430, 350, 14), L(3, 0.45), x=CX, y=560, color='green', dur=0.5, sfx='chime')
	b.text(CX, 960, 'thiếu một chữ ký là chưa xong', L(3, 0.5), size=40, color='dim', dur=0.9)
	b.path(hourglass(0.6), L(4, 0.2), x=1760, y=960, dur=0.3, color='dim')
	b.path(cross(1.6), L(4, 0.4), x=1760, y=960, color='red', dur=0.3, width=6)
	b.text(1700, 960, 'không chờ khối mới', L(4, 0.3), size=36, color='dim', anchor='rm')


def s09(b, tm):
	L = tm.L
	paper = b.group(CX, 500)
	b.path(sheet(380, 300), L(0, 0.0), parent=paper, color='yellow', dur=0.5)
	b.text(0, -90, 'Snapshot', L(0, 0.1), size=48, color='yellow', parent=paper)
	for k in range(4):
		b.path(signature(110), L(0, 0.2 + k * 0.05), x=-90 + (k % 2) * 180, y=(k // 2) * 70, color='cyan', dur=0.2, width=3, parent=paper)
	for k, (x, y) in enumerate(((300, 380), (300, 640), (1620, 380))):
		b.path(person(0.6), L(0, 0.1 + k * 0.05), x=x, y=y, dur=0.4, width=4)
	walker = b.group(1620, 640)
	b.path(person(0.6), L(0, 0.25), parent=walker, color='red', dur=0.4, width=4)
	walker.move(L(0, 0.4), L(0, 0.8), 220, 0)
	walker.erase(L(0, 0.9))
	b.text(1640, 790, 'bỏ đi?', L(0, 0.5), size=40, color='red')
	b.text(300, 790, 'gian lận?', L(0, 0.75), size=40, color='red')
	s = b.strike(CX - 150, 520, CX + 150, 480, L(1, 0.1), width=7)
	s.erase(L(1, 0.4), fade=0.2)
	b.path(rect(430, 350, 14), L(1, 0.45), x=CX, y=500, color='green', dur=0.4, sfx='thud')
	b.text(CX, 760, 'đủ 4 chữ ký, không ai sửa được', L(1, 0.6), size=42, color='green')
	b.clear(L(2, 0.0))
	b.path(rect(520, 300, 16), L(2, 0.05), x=420, y=330, dur=0.7, color='cyan')
	b.text(420, 140, 'Hydra Head', L(2, 0.1), size=44, color='cyan')
	b.path(book(380, 240), L(2, 0.1), x=1440, y=760, dur=0.7)
	b.text(1440, 580, 'Cardano', L(2, 0.2), size=44)
	carry = b.group(560, 330)
	b.path(person(0.6), L(2, 0.2), parent=carry, dur=0.3, width=4)
	b.path(note(80, 60), L(2, 0.3), x=60, y=-20, parent=carry, color='yellow', dur=0.3, width=3)
	carry.move(L(2, 0.45), L(2, 0.95), 1180 - 560, 760 - 330)
	b.text(420, 560, 'Đóng Head', L(2, 0.35), size=48, color='cyan')
	people(b, L(2, 0.1), [(300, 360), (420, 360), (540, 360)], s=0.5, step=0.05)
	b.path(arrow(700, 420, 1180, 700), L(2, 0.5), color='dim', dur=0.4)
	b.path(hourglass(1.0), L(3, 0.0), x=1500, y=300, dur=0.5, color='chalk')
	b.text(1500, 420, 'thời gian đối chiếu', L(3, 0.1), size=38)
	for k in range(4):
		x = 300 + k * 230
		b.path(person(0.5), L(3, 0.45 + k * 0.05), x=x, y=880, dur=0.3, width=4)
		b.text(x, 960, NAMES[k], L(3, 0.5 + k * 0.05), size=32, color='dim', dur=0.2)
		b.utxo(x + 80, 830, '', L(3, 0.65 + k * 0.06), w=60, h=40, sfx='tick')
	b.text(1380, 1000, '→ trả tiền về đúng người', L(3, 0.8), size=40, color='yellow')


def s10(b, tm):
	L = tm.L
	b.path(rect(900, 280, 16), L(0, 0.0), x=CX, y=310, dur=0.8, color='cyan')
	b.text(CX, 100, 'Đóng Head', L(0, 0.2), size=56, color='cyan')
	b.path(arrow(CX, 470, CX, 605), L(0, 0.6), color='dim', dur=0.3)
	b.path(book(420, 220), L(0, 0.3), x=CX, y=740, dur=0.7)
	b.text(CX - 280, 740, 'Cardano', L(0, 0.4), size=44, anchor='rm')
	ch = b.path(chain(500, 280), L(0, 0.5), x=CX, y=740, color='dim', width=3, dur=0.6)
	for k, (n, v) in enumerate(zip(NAMES, ('14', '6', '11', '9'))):
		x = CX - 330 + k * 220
		t = L(1, 0.05 + k * 0.1)
		g = b.utxo(x, 290, v + ' ADA', t, w=170, h=80, size=36)
		g.move(t + 0.3, t + 0.9, 0, 670)
		b.text(x, 380, n, t + 0.1, size=32, color='dim', dur=0.2)
	ch.erase(L(1, 0.5), fade=0.6)
	b.clear(L(2, 0.0))
	for k in range(14):
		b.path(rect(380, 22, 4), L(2, 0.05 + k * 0.02), x=520, y=780 - k * 34, dur=0.15, color='dim', width=3)
	b.text(520, 880, '100 ván bên trong', L(2, 0.35), size=50)
	for k, lab in enumerate(('mở', 'nạp tiền', 'đóng')):
		b.path(rect(320, 70, 10), L(2, 0.5 + k * 0.08), x=1400, y=560 + k * 100, dur=0.3, color='yellow')
		b.text(1400, 560 + k * 100, lab, L(2, 0.55 + k * 0.08), size=36, color='yellow', dur=0.2)
	b.text(1400, 880, 'vài giao dịch trên Cardano', L(2, 0.45), size=46, color='yellow', dur=1.0)
	b.path(line(0, 260, 0, 940), L(2, 0.0), x=CX, y=0, color='dim', width=3)


def s11(b, tm):
	L = tm.L
	b.text(CX, 110, 'Giới hạn của phòng họp', L(0, 0.1), size=62)
	x_icon, x_txt = 300, 520
	y1, y2, y3 = 300, 500, 700
	b.path(rect(150, 110, 10), L(1, 0.0), x=x_icon, y=y1, color='cyan', dur=0.4)
	b.path(person(0.45), L(1, 0.1), x=x_icon + 130, y=y1 + 10, dur=0.3, color='dim', width=4)
	b.path(cross(0.8), L(1, 0.25), x=x_icon + 130, y=y1 - 60, color='red', dur=0.2)
	b.text(x_txt, y1, 'Chỉ người trong Head giao dịch với nhau', L(1, 0.15), size=50, anchor='lm', sfx='chime')
	b.path(hourglass(0.7), L(2, 0.0), x=x_icon - 40, y=y2, dur=0.4, color='chalk')
	coin(b, x_icon + 60, y2, L(2, 0.15), r=28, label='phí', size=20)
	b.text(x_txt, y2, 'Mở, đóng = giao dịch lớp 1', L(2, 0.1), size=50, anchor='lm', sfx='chime')
	b.path(monitor(0.8), L(3, 0.0), x=x_icon, y=y3 - 10, dur=0.4, color='dim')
	b.path(cross(1.0), L(3, 0.4), x=x_icon, y=y3 - 10, color='red', dur=0.3)
	b.text(x_txt, y3, 'Cả nhóm phải có mặt để cùng ký', L(3, 0.1), size=50, anchor='lm', sfx='chime')
	b.text(x_txt + 20, y3 + 70, 'một người tắt máy → đóng Head, rút tiền về', L(3, 0.65), size=36, color='dim', anchor='lm')
	b.text(CX, 920, 'Hợp với: nhóm quen, giao dịch nhiều lần', L(4, 0.2), size=56, color='green')
	b.path(line(-520, 0, 520, 0), L(4, 0.7), x=CX, y=980, color='green')


CODE = [
	("import { HydraBridge } from '@hydra-sdk/bridge'", 0, 0.45),
	('const bridge = new HydraBridge({ url })', 0, 0.75),
	('await bridge.connect()', 1, 0.1),
	('const utxos = await bridge.querySnapshotUtxo()', 2, 0.05),
	('new TxBuilder({ isHydra: true })', 3, 0.05),
	('await bridge.submitTxSync(tx)', 4, 0.05),
]


def s12(b, tm):
	L = tm.L
	b.text(130, 100, 'Cho lập trình viên', L(0, 0.0), size=46, color='cyan', anchor='lm')
	b.text(1790, 100, '@hydra-sdk/bridge', L(0, 0.3), size=34, color='dim', anchor='rm', mono=True)
	x0, y0, lh = 140, 220, 84
	for i, (src, li, f) in enumerate(CODE):
		b.text(x0, y0 + i * lh, src, L(li, f), size=38, mono=True, anchor='lm', color='chalk')
	b.path(rect(240, 80, 12), L(1, 0.4), x=1060, y=y0 + 2 * lh, color='cyan', dur=0.4)
	b.text(1060, y0 + 2 * lh, 'máy Hydra', L(1, 0.45), size=34, color='cyan')
	b.path(arrow(700, y0 + 2 * lh, 920, y0 + 2 * lh), L(1, 0.35), color='cyan', dur=0.3)
	b.text(1220, y0 + 2 * lh, 'WebSocket · sự kiện ngay lập tức', L(1, 0.6), size=34, color='dim', anchor='lm')
	b.path(arrow(1230, y0 + 3 * lh, 1330, y0 + 3 * lh, head=16), L(2, 0.4), color='yellow', dur=0.3)
	b.utxo(1540, y0 + 3 * lh, 'UTxOObject', L(2, 0.55), w=360, h=76, size=36)
	b.path(line(0, 0, 330, 0), L(3, 0.25), x=x0 + 380, y=y0 + 4 * lh + 30, color='yellow')
	b.text(1000, y0 + 4 * lh, 'phí trong Head = 0 (trong ví dụ)', L(3, 0.7), size=34, color='dim', anchor='lm')
	b.path(arrow(860, y0 + 5 * lh, 1080, y0 + 5 * lh + 160), L(4, 0.3), color='cyan', dur=0.4)
	b.path(sheet(360, 200), L(4, 0.45), x=1300, y=880, color='yellow', dur=0.5)
	b.text(1300, 820, 'Snapshot', L(4, 0.5), size=40, color='yellow')
	for k in range(4):
		b.path(check(0.7), L(4, 0.6 + k * 0.06), x=1190 + k * 72, y=880, color='green', dur=0.15, width=4, sfx='tick')


def s13(b, tm):
	L = tm.L
	b.text(CX, 150, 'Tóm lại', L(0, 0.0), size=64, color='dim')
	pts = ['1. Lớp 1 giữ sổ chung, lớp 2 ghi sổ riêng', '2. Trong Head vẫn là UTxO', '3. Chỉ người trong Head cần đồng ý']
	for k, s in enumerate(pts):
		b.text(260, 330 + k * 160, s, L(k + 1, 0.05), size=60, anchor='lm', color='cyan' if k == 0 else 'yellow' if k == 1 else 'chalk', sfx='chime')
	b.clear(L(4, 0.0))
	b.path(rect(420, 240, 16), L(4, 0.05), x=CX, y=460, dur=0.7, color='cyan')
	b.text(CX, 460, 'Hydra Head', L(4, 0.2), size=52, color='cyan')
	for k, (x0, y0, x1, y1) in enumerate(((720, 290, 1200, 290), (1260, 330, 1260, 590), (1200, 630, 720, 630), (660, 590, 660, 330))):
		b.path(arrow(x0, y0, x1, y1), L(4, 0.3 + k * 0.08), color='dim', dur=0.3)
	b.text(CX, 820, 'Tập sau: vòng đời một Hydra Head', L(4, 0.55), size=56, color='yellow')
	b.clear(L(5, 0.0))
	b.text(CX, 480, 'hydrasdk.com', L(5, 0.15), size=120, color='yellow')
	b.path(line(-380, 0, 380, 0), L(5, 0.6), x=CX, y=570, color='yellow')
	b.text(1840, 1010, 'Thực hiện cùng VTechcom Labs', tm.E(5, 0.3), size=34, color='dim', anchor='rm')


SCENES = {f'{i:02d}': globals()[f's{i:02d}'] for i in range(1, 14)}

BEATS = {}
