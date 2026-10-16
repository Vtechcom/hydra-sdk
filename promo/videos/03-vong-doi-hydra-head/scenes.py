"""Bố cục 15 cảnh của tập 3 — Vòng đời của một Hydra Head. Mỗi hàm nhận Board và Timing (mốc từ clip giọng thật)."""
import math

from chalk import arrow, check, cross, ellipse, eye, font, line, lock, note, person, rect, signature, wallet

CX, CY = 960, 500
MAIN_Y = 840  # đường kẻ mạng chính Cardano

# Bản đồ sáu chặng (cảnh 02, 12): vòng cung đi lên rồi đi xuống
ARC = [(240, 760), (520, 520), (800, 340), (1120, 340), (1400, 520), (1680, 760)]
STAGES = ['Mở Head', 'Nạp tiền', 'Giao dịch', 'Đóng Head', 'Khiếu nại', 'Trả về']


# ---------------------------------------------------------------- hình riêng của tập


def ticks(r, n=12):
	out = []
	for k in range(n):
		a = 2 * math.pi * k / n
		out.append([(r * 0.82 * math.cos(a), r * 0.82 * math.sin(a)), (r * 0.95 * math.cos(a), r * 0.95 * math.sin(a))])
	return out


def clock(r):
	return ellipse(r) + ticks(r)


def hand(r, deg):
	a = math.radians(deg)
	return [[(0, 0), (r * 0.72 * math.cos(a), r * 0.72 * math.sin(a))]]


def hourglass(s=1.0):
	return [[(-22 * s, -32 * s), (22 * s, -32 * s), (-22 * s, 32 * s), (22 * s, 32 * s), (-22 * s, -32 * s)]]


def brackets(w, h, c=34):
	x0, y0, x1, y1 = -w / 2, -h / 2, w / 2, h / 2
	return [[(x0, y0 + c), (x0, y0), (x0 + c, y0)], [(x1 - c, y0), (x1, y0), (x1, y0 + c)],
		[(x1, y1 - c), (x1, y1), (x1 - c, y1)], [(x0 + c, y1), (x0, y1), (x0, y1 - c)]]


def phone(s=1.0):
	return rect(90 * s, 160 * s, 12 * s) + [[(-14 * s, 64 * s), (14 * s, 64 * s)]]


def dashed(x0, y0, x1, y1, dash=18, gap=14):
	L = math.hypot(x1 - x0, y1 - y0)
	ux, uy = (x1 - x0) / L, (y1 - y0) / L
	out, d = [], 0.0
	while d < L:
		e = min(d + dash, L)
		out.append([(x0 + ux * d, y0 + uy * d), (x0 + ux * e, y0 + uy * e)])
		d = e + gap
	return out


def stage_icon(k):
	if k == 0:
		return ellipse(30, 20, start=-60, sweep=300)
	if k == 1:
		return rect(36, 24, 4) + arrow(0, 26, 0, -26, head=12)
	if k == 2:
		return [[(-28, 0), (0, 0)], *arrow(0, 0, 26, -18, head=10), *arrow(0, 0, 26, 18, head=10)]
	if k == 3:
		return lock(0.7)
	if k == 4:
		return clock(28)
	return rect(36, 24, 4) + arrow(0, -26, 0, 26, head=12)


# ---------------------------------------------------------------- khối dựng chung


def head(b, x, y, rx, ry, at, dur=0.9, label='Head', gap=0):
	"""Vòng tròn Hydra Head; gap > 0 để hở một khoảng ở đỉnh (Head đang mở cửa)."""
	e = b.path(ellipse(rx, ry, start=-90 + gap / 2, sweep=360 - gap), at, x=x, y=y, dur=dur, color='cyan')
	t = b.text(x - rx + 30, y - ry + 10, label, at + 0.3, size=40, color='cyan', anchor='lm') if label else None
	return e, t


def mainline(b, at, y=MAIN_Y, x0=120, x1=1800):
	l = b.path(line(x0, y, x1, y), at, dur=0.8)
	t = b.text(x1, y + 44, 'mạng chính', at + 0.3, size=36, color='dim', anchor='rm')
	return l, t


def minimap(b, at, cur):
	"""Sáu vòng nhỏ ở góc trên phải, sáng chặng đang kể."""
	for k in range(6):
		x = 1510 + k * 56
		c = 'yellow' if k == cur else 'dim'
		b.path(ellipse(17), at + 0.04 * k, x=x, y=86, color=c, dur=0.2, width=3 if k != cur else 5)
		b.text(x, 86, str(k + 1), at + 0.04 * k + 0.1, size=22, color=c, dur=0.1)


def title(b, s, at, color='chalk'):
	return b.text(120, 92, s, at, size=52, anchor='lm', color=color)


def snap(b, x, y, label, at, color='chalk', w=240, h=150, parent=None, size=40, sfx='click'):
	"""Khung snapshot: bốn góc như khung ngắm máy ảnh, số thứ tự ở góc."""
	g = b.group(x, y, parent)
	b.path(brackets(w, h), at, parent=g, color=color, dur=0.4, sfx=sfx)
	b.text(w / 2 - 14, -h / 2 + 12, label, at + 0.25, size=size, color=color, anchor='rt', parent=g, dur=0.25)
	return g


def countdown(b, x, y, r, t0, t1, steps=12, color='chalk', width=6):
	"""Kim quét một vòng từ đỉnh, mỗi bước một nét kim mới, kim cũ lau đi."""
	ts = [t0 + (t1 - t0) * k / steps for k in range(steps + 1)]
	for k, tk in enumerate(ts):
		h = b.path(hand(r, -90 + 360 * k / steps), tk, x=x, y=y, dur=0.06, color=color, width=width,
			sfx='tick' if k % 2 == 0 else None, wobble=False)
		if k < steps:
			h.erase(ts[k + 1], fade=0.05)


def stage_arc(b, at, step=0.12, labels=True, dur=0.4):
	for k, (x, y) in enumerate(ARC):
		t = at + k * step
		b.path(ellipse(60), t, x=x, y=y, dur=dur)
		b.path(stage_icon(k), t + 0.15, x=x, y=y, dur=dur, color='yellow' if k in (1, 5) else 'chalk', width=4)
		if labels:
			b.text(x, y + 100, f'{k + 1}. {STAGES[k]}', t + 0.2, size=40, dur=0.3)
		if k:
			px, py = ARC[k - 1]
			a = math.atan2(y - py, x - px)
			b.path(arrow(px + 74 * math.cos(a), py + 74 * math.sin(a), x - 74 * math.cos(a), y - 74 * math.sin(a), head=16),
				t - 0.05, color='dim', dur=0.25, width=4)


# ---------------------------------------------------------------- cảnh


def s01(b, tm):
	L = tm.L
	mainline(b, L(0, 0.0))
	b.text(120, MAIN_Y + 44, 'Cardano · lớp 1', L(0, 0.75), size=40, anchor='lm')
	ring, _ = head(b, CX, 400, 420, 210, L(0, 0.25), dur=1.0, label=None, gap=40)
	b.text(CX, 145, 'Hydra Head · lớp 2', L(0, 0.4), size=48, color='cyan')
	for j, x in enumerate((780, 960, 1140)):
		b.path(person(0.75), L(0, 0.5 + j * 0.08), x=x, y=420, dur=0.4, color='cyan', width=4)
	b.clear(L(1, 0.0))
	mainline(b, L(1, 0.0))
	head(b, CX, 400, 420, 210, L(1, 0.05), dur=0.6, label=None, gap=40)
	words = b.text(CX, 400, 'Mở → Dùng → Đóng', L(1, 0.25), size=64)
	b.path(ellipse(420, 210, start=-90 - 20, sweep=40, n=8), L(1, 0.85), x=CX, y=400, color='cyan', dur=0.25, sfx='click')
	words.erase(L(2, 0.0))
	coins = []
	for k, (x, v) in enumerate(((560, '20'), (960, '15'), (1360, '8'))):
		coins.append(b.utxo(x, MAIN_Y - 70, v, L(2, 0.05 + k * 0.08), w=150, h=86, size=40))
	b.text(CX, MAIN_Y + 100, 'món tiền chưa tiêu', L(2, 0.3), size=40, color='yellow')
	q = b.text(CX, 640, '?', L(2, 0.4), size=130, color='yellow', sfx='chime')
	d1 = b.path(dashed(560, 700, 760, 560), L(2, 0.5), color='dim', dur=0.4, width=4)
	d2 = b.path(dashed(1360, 700, 1160, 560), L(2, 0.6), color='dim', dur=0.4, width=4)
	for e in (q, d1, d2):
		e.erase(L(3, 0.0))
	for k, g in enumerate(coins):
		dx = (CX - 220 + k * 220) - (560 + k * 400)
		g.move(L(3, 0.1 + k * 0.05), L(3, 0.45 + k * 0.05), dx, 400 - (MAIN_Y - 70))
		g.move(L(3, 0.65 + k * 0.05), L(3, 0.95 + k * 0.05), -dx, (MAIN_Y - 70) - 400)


def s02(b, tm):
	L = tm.L
	b.text(CX, 120, 'Vòng đời của một Head', L(0, 0.0), size=60)
	b.path(line(-330, 0, 330, 0), L(0, 0.3), x=CX, y=175, color='dim', width=3)
	for k, (x, y) in enumerate(ARC):
		t = L(0, 0.25 + k * 0.1)
		b.path(ellipse(60), t, x=x, y=y, dur=0.35, sfx='tick')
	for k, (x, y) in enumerate(ARC):
		line_i, f = (1, 0.15 + k * 0.25) if k < 3 else (2, 0.1 + (k - 3) * 0.3)
		t = L(line_i, f)
		b.path(stage_icon(k), t, x=x, y=y, dur=0.4, color='yellow' if k in (1, 5) else 'chalk', width=4)
		b.text(x, y + 100, f'{k + 1}. {STAGES[k]}', t + 0.1, size=40, dur=0.35)
		if k:
			px, py = ARC[k - 1]
			a = math.atan2(y - py, x - px)
			b.path(arrow(px + 74 * math.cos(a), py + 74 * math.sin(a), x - 74 * math.cos(a), y - 74 * math.sin(a), head=16),
				t - 0.1, color='dim', dur=0.25, width=4)
	b.text(560, 260, 'lên Head', L(1, 0.85), size=40, color='cyan')
	b.text(1360, 260, 'về mạng chính', L(2, 0.9), size=40, color='cyan')
	b.path(ellipse(80), L(3, 0.4), x=ARC[0][0], y=ARC[0][1], color='yellow', dur=0.5, width=6, sfx='chime')


def s03(b, tm):
	L = tm.L
	title(b, 'Mở Head · Init', L(0, 0.0))
	minimap(b, L(0, 0.0), 0)
	mainline(b, L(1, 0.3))
	for j, x in enumerate((260, 520, 780)):
		b.path(person(0.9), L(0, 0.25 + j * 0.1), x=x, y=330, dur=0.5)
		b.path(rect(170, 64, 10), L(0, 0.6 + j * 0.08), x=x, y=500, dur=0.35, color='cyan')
		b.text(x, 500, 'nút Hydra', L(0, 0.65 + j * 0.08), size=30, color='cyan', dur=0.25)
	b.text(260, 205, 'Init', L(1, 0.1), size=44, color='cyan', mono=True)
	b.path(arrow(330, 540, 900, 700), L(1, 0.25), color='cyan', dur=0.4)
	paper = b.group(1060, 440)
	b.path(note(240, 170), L(1, 0.5), parent=paper, dur=0.5)
	b.text(0, -120, 'giao dịch', L(1, 0.55), size=36, color='dim', parent=paper)
	paper.move(L(1, 0.7), L(1, 0.95), 0, 260)
	b.path(person(0.45), L(2, 0.3), x=1300, y=640, dur=0.4, width=4)
	b.text(1350, 630, 'Thành viên', L(2, 0.35), size=44, anchor='lm')
	b.path(clock(30), L(2, 0.75), x=1300, y=760, dur=0.4)
	b.text(1350, 760, 'Thời gian khiếu nại', L(2, 0.8), size=44, anchor='lm')
	b.path(ellipse(280, 52), L(3, 0.1), x=1510, y=760, color='yellow', dur=0.6)
	b.text(1510, 960, '→ gặp lại ở chặng 5', L(3, 0.6), size=40, color='yellow')
	b.path(ellipse(26), L(3, 0.7), x=1510 + 4 * 56, y=86, color='yellow', dur=0.3, width=4)
	b.clear(L(4, 0.0))
	title(b, 'Mở Head · Init', L(4, 0.0), color='dim')
	mainline(b, L(4, 0.0))
	b.path(note(200, 140), L(4, 0.0), x=CX, y=MAIN_Y - 90, dur=0.4)
	head(b, CX, 360, 420, 190, L(4, 0.25), dur=0.8)
	b.text(CX, 360, 'trống', L(4, 0.75), size=56, color='dim')
	b.path(arrow(CX, MAIN_Y - 170, CX, 570), L(4, 0.15), color='dim', dur=0.3)


def s04(b, tm):
	L = tm.L
	b.text(120, 160, 'Trước đây', L(0, 0.0), size=48, color='dim', anchor='lm')
	b.text(1780, 160, 'Init → Commit → Open', L(0, 0.15), size=38, color='dim', anchor='rm', mono=True)
	for j, x in enumerate((220, 400, 580)):
		b.path(person(0.6), L(0, 0.2 + j * 0.1), x=x, y=330, dur=0.4, width=4)
		if j < 2:
			g = b.utxo(x, 470, '10', L(0, 0.5 + j * 0.1), w=110, h=64, size=32, sfx='tick')
			g.move(L(0, 0.75), L(0, 0.95), 1000 - x + (j * 2 - 1) * 70, 360 - 470)
		else:
			b.text(x, 470, '?', L(1, 0.05), size=64, color='red')
	b.path(ellipse(230, 110), L(0, 0.3), x=1000, y=360, dur=0.7, color='dim')
	b.path(hourglass(1.1), L(1, 0.15), x=1320, y=350, dur=0.4)
	b.text(1320, 430, 'chờ…', L(1, 0.25), size=36, color='dim')
	b.path(cross(4), L(1, 0.7), x=1000, y=360, color='red', width=8, dur=0.35, sfx='thud')
	b.text(1440, 360, 'huỷ', L(1, 0.8), size=56, color='red', anchor='lm')
	b.path(line(120, 0, 1800, 0), L(2, 0.0), y=580, color='dim', width=3)
	b.text(120, 650, 'Hydra phiên bản 2', L(2, 0.05), size=48, color='cyan', anchor='lm')
	b.text(1780, 650, 'Init → Open → nạp dần', L(2, 0.15), size=38, color='cyan', anchor='rm', mono=True)
	head(b, 1000, 830, 260, 120, L(2, 0.2), dur=0.6, label=None)
	b.text(1000, 670, 'mở trước', L(2, 0.35), size=44)
	for k, x in enumerate((220, 400, 580)):
		t = L(2, 0.5 + k * 0.15)
		g = b.utxo(x, 830, '10', t, w=90, h=60, size=30)
		g.move(t + 0.3, t + 0.8, 900 + k * 100 - x, 0)
	b.text(1560, 830, 'nạp vào lúc nào cũng được', L(2, 0.9), size=36, color='dim')


def s05(b, tm):
	L = tm.L
	title(b, 'Nạp tiền · Commit', L(0, 0.0))
	minimap(b, L(0, 0.0), 1)
	mainline(b, L(0, 0.0))
	head(b, 1380, 340, 380, 170, L(0, 0.1), dur=0.8)
	coin = b.utxo(250, MAIN_Y - 70, '20 ADA', L(0, 0.2), w=200, h=92, size=40, locked=True)
	b.path(note(200, 130), L(0, 0.45), x=560, y=520, dur=0.4)
	b.text(560, 405, 'giao dịch nạp', L(0, 0.5), size=36, color='dim')
	pick = b.path(ellipse(130, 70), L(0, 0.75), x=250, y=MAIN_Y - 70, color='cyan', dur=0.4)
	pick.erase(L(1, 0.5))
	box = b.group(740, MAIN_Y - 90)
	b.path(rect(280, 170, 14), L(1, 0.0), parent=box, dur=0.6)
	b.path(lock(1.6), L(1, 0.2), x=0, y=-140, parent=box, dur=0.5, sfx='click')
	b.text(0, 130, 'ổ khoá nạp', L(1, 0.4), size=36, color='dim', parent=box)
	coin.move(L(1, 0.5), L(1, 0.85), 740 - 250, -20)
	b.path(clock(44), L(2, 0.0), x=1100, y=620, dur=0.4)
	countdown(b, 1100, 620, 44, L(2, 0.05), L(2, 0.6), steps=8, width=4)
	b.text(1100, 700, 'chờ cho chắc chắn', L(2, 0.1), size=34, color='dim')
	coin.move(L(2, 0.65), L(2, 1.0), 1380 - 740, 340 - (MAIN_Y - 90))
	b.path(arrow(610, 920, 300, 920), L(3, 0.2), color='dim', dur=0.4, width=4)
	b.text(460, 975, 'quá hạn → chủ lấy lại', L(3, 0.4), size=34, color='dim')
	b.path(ellipse(46), L(4, 0.25), x=1380 + 94, y=340 - 50, color='yellow', dur=0.4, width=5)
	b.text(1380, 560, 'vẫn ổ khoá của bạn', L(4, 0.45), size=44, color='yellow')


def s06(b, tm):
	L = tm.L
	title(b, 'Head đang mở · Open', L(0, 0.0))
	minimap(b, L(0, 0.0), 2)
	head(b, CX, 400, 640, 250, L(0, 0.1), dur=0.9, label=None)
	b.utxo(620, 400, '20', L(0, 0.4), w=140, h=80, size=40)
	b.utxo(1180, 320, '10', L(0, 0.5), w=140, h=80, size=40)
	b.utxo(1180, 480, '5', L(0, 0.6), w=140, h=80, size=40)
	b.text(CX, 220, 'tiêu món cũ → sinh món mới', L(1, 0.1), size=44, color='dim')
	b.strike(550, 400, 690, 400, L(1, 0.35))
	b.path(arrow(700, 380, 820, 320, head=14), L(1, 0.45), color='dim', dur=0.25, width=4)
	b.path(arrow(700, 420, 820, 480, head=14), L(1, 0.45), color='dim', dur=0.25, width=4)
	b.utxo(900, 310, '12', L(1, 0.55), w=140, h=80, size=40)
	b.utxo(900, 490, '8', L(1, 0.65), w=140, h=80, size=40)
	b.text(900, 560, 'tiền thối', L(1, 0.75), size=30, color='dim', dur=0.25)
	b.strike(1110, 320, 1250, 320, L(1, 0.7))
	b.strike(1110, 480, 1250, 480, L(1, 0.75))
	b.path(arrow(1260, 320, 1340, 390, head=14), L(1, 0.8), color='dim', dur=0.2, width=4)
	b.path(arrow(1260, 480, 1340, 410, head=14), L(1, 0.8), color='dim', dur=0.2, width=4)
	b.utxo(1430, 400, '15', L(1, 0.88), w=140, h=80, size=40)
	mainline(b, L(2, 0.0), y=900)
	for k in range(4):
		b.path(rect(80, 54, 6), L(2, 0.3 + k * 0.18), x=300 + k * 260, y=900 - 40, color='dim', dur=0.4)
	b.text(1340, 860, 'chờ khối…', L(2, 0.6), size=36, color='dim', anchor='lm')
	b.text(300, 730, 'không chờ khối', L(2, 0.85), size=40, color='green')
	for j, x in enumerate((640, CX, 1280)):
		b.path(rect(150, 56, 10), L(3, 0.0 + j * 0.08), x=x, y=730, color='cyan', dur=0.35)
		b.text(x, 730, 'nút', L(3, 0.05 + j * 0.08), size=30, color='cyan', dur=0.2)
		b.path(check(1.1), L(3, 0.4 + j * 0.12), x=x + 110, y=730, color='green', sfx='tick')


def s07(b, tm):
	L = tm.L
	title(b, 'Snapshot', L(0, 0.0), color='yellow')
	minimap(b, L(0, 0.0), 2)
	for k, (dx, dy, v) in enumerate(((-150, -50, '12'), (20, -50, '8'), (-65, 50, '15'), (110, 50, '5'))):
		b.utxo(620 + dx, 430 + dy, v, L(0, 0.05 + k * 0.06), w=130, h=72, size=36, sfx=None)
	snap(b, 600, 430, '#3', L(0, 0.45), w=560, h=330, size=48)
	b.text(600, 660, 'chốt lại cả sổ cái', L(0, 0.7), size=40, color='dim')
	for k, x in enumerate((1300, 1500, 1700)):
		snap(b, x, 340, f'#{k + 1}', L(1, 0.05 + k * 0.12), w=160, h=110, size=34, color='chalk' if k == 2 else 'dim')
	b.path(arrow(1220, 450, 1780, 450, head=16), L(1, 0.35), color='dim', dur=0.4, width=4)
	b.text(1500, 500, 'tăng dần', L(1, 0.4), size=34, color='dim')
	for j, x in enumerate((420, 600, 780)):
		b.path(signature(130), L(1, 0.55 + j * 0.12), x=x, y=760, color='cyan', dur=0.35, width=4)
	b.text(600, 840, 'đủ chữ ký cả nhóm', L(1, 0.9), size=44, color='cyan')
	b.path(ellipse(110, 80), L(2, 0.0), x=1700, y=340, color='yellow', dur=0.5, width=5)
	b.text(1500, 640, 'mới nhất', L(2, 0.25), size=48, color='yellow')
	b.text(1500, 710, 'món nào thuộc về ai', L(2, 0.45), size=40)
	b.text(CX, 960, 'nhớ kỹ: quyết định mọi thứ khi đóng Head', L(3, 0.2), size=48, color='yellow', sfx='chime')


def s08(b, tm):
	L = tm.L
	title(b, 'Rút ra · Decommit', L(0, 0.0))
	minimap(b, L(0, 0.0), 2)
	head(b, CX, 380, 560, 220, L(0, 0.05), dur=0.8)
	mainline(b, L(0, 0.1))
	coin = b.utxo(1240, 400, '7', L(0, 0.3), w=140, h=80, size=40, locked=True)
	b.utxo(720, 330, '12', L(0, 0.35), w=140, h=80, size=40)
	b.utxo(720, 470, '6', L(0, 0.4), w=140, h=80, size=40)
	no_close = b.text(CX, 680, 'không cần đóng Head', L(0, 0.7), size=44, color='green')
	coin.move(L(1, 0.0), L(1, 0.5), 1500 - 1240, (MAIN_Y - 70) - 400)
	no_close.erase(L(1, 0.0))
	b.strike(650, 330, 790, 330, L(1, 0.5))
	b.path(arrow(800, 330, 900, 290, head=14), L(1, 0.6), color='dim', dur=0.2, width=4)
	b.path(arrow(800, 330, 900, 430, head=14), L(1, 0.6), color='dim', dur=0.2, width=4)
	b.utxo(990, 280, '9', L(1, 0.7), w=130, h=74, size=38)
	b.utxo(990, 440, '3', L(1, 0.8), w=130, h=74, size=38)
	b.text(CX, 680, 'Head vẫn mở, vẫn giao dịch', L(1, 0.85), size=40, color='dim')
	b.path(ellipse(46), L(2, 0.3), x=1500 + 64, y=MAIN_Y - 70 - 44, color='yellow', dur=0.4, width=5)
	b.text(1500, 640, 'vẫn ổ khoá của bạn', L(2, 0.5), size=40, color='yellow')


def s09(b, tm):
	L = tm.L
	hx, hy = 860, 360
	title(b, 'Đóng Head · Close', L(0, 0.0))
	minimap(b, L(0, 0.0), 3)
	mainline(b, L(0, 0.0))
	head(b, hx, hy, 460, 200, L(0, 0.1), dur=0.8, gap=50)
	b.path(person(0.9), L(0, 0.3), x=200, y=hy, dur=0.5)
	b.path(arrow(270, 320, 640, 200), L(0, 0.55), color='dim', dur=0.4)
	b.path(ellipse(460, 200, start=-90 - 25, sweep=50, n=8), L(0, 0.8), x=hx, y=hy, color='cyan', dur=0.25, sfx='click')
	b.path(lock(1.0), L(0, 0.85), x=hx, y=hy - 200, dur=0.3)
	fr = snap(b, hx, hy + 10, '#?', L(1, 0.0), w=380, h=220, size=40)
	for k, (dx, dy, v) in enumerate(((-110, -25, '12'), (30, -25, '8'), (-40, 60, '15'))):
		b.utxo(dx, dy, v, L(0, 0.2 + k * 0.05), w=120, h=66, size=34, sfx=None, parent=fr)
	fr.move(L(1, 0.4), L(1, 0.9), 1500 - hx, (MAIN_Y - 130) - (hy + 10))
	b.path(rect(520, 100, 12), L(2, 0.0), x=hx, y=hy, color='red', width=6, sfx='thud')
	b.text(hx, hy, 'Không nhận giao dịch', L(2, 0.05), size=44, color='red', dur=0.4)
	b.text(1500, 990, 'tiền chưa về ngay', L(2, 0.7), size=40, color='dim')
	b.text(1760, MAIN_Y - 250, '?', L(3, 0.3), size=110, color='red', sfx='thud')
	b.text(1500, 530, 'có thể là snapshot cũ', L(3, 0.55), size=42, color='red')


def s10(b, tm):
	L = tm.L
	title(b, 'Khiếu nại · Contest', L(0, 0.0))
	minimap(b, L(0, 0.0), 4)
	mainline(b, L(0, 0.0))
	b.path(person(0.9), L(0, 0.05), x=200, y=430, dur=0.5)
	b.text(200, 530, 'An', L(0, 0.15), size=44)
	b.path(person(0.9), L(0, 0.1), x=1720, y=430, dur=0.5)
	b.text(1720, 530, 'Bình', L(0, 0.2), size=44)
	f5 = snap(b, 1440, 330, '#5', L(0, 0.35), w=260, h=170, size=40)
	b.text(0, 10, 'An → Bình', L(0, 0.55), size=34, color='yellow', parent=f5)
	f4 = snap(b, 480, 330, '#4', L(1, 0.05), w=260, h=170, size=40)
	b.text(0, 10, 'tiền còn ở An', L(1, 0.2), size=30, color='yellow', parent=f4)
	f4.move(L(1, 0.5), L(1, 0.9), 0, (MAIN_Y - 110) - 330)
	b.path(clock(170), L(2, 0.0), x=CX, y=420, dur=0.6)
	countdown(b, CX, 420, 170, L(2, 0.15), L(4, 0.95), steps=24, width=7)
	b.text(1440, 520, 'khiếu nại!', L(2, 0.75), size=44, color='cyan')
	f5.move(L(3, 0.0), L(3, 0.4), 0, (MAIN_Y - 110) - 330)
	for j, x in enumerate((1360, 1440, 1520)):
		b.path(signature(60), L(3, 0.45 + j * 0.1), x=x, y=MAIN_Y - 40, color='cyan', dur=0.3, width=3)
	b.path(ellipse(46, 26), L(3, 0.85), x=1360, y=MAIN_Y - 40, color='yellow', dur=0.3, width=4)
	b.text(1360, MAIN_Y + 50, 'chữ ký của An', L(3, 0.9), size=30, color='yellow')
	b.strike(360, MAIN_Y - 180, 600, MAIN_Y - 40, L(4, 0.05), width=7)
	b.text(CX, 680, '#5 > #4', L(4, 0.15), size=72, color='green', sfx='chime')
	fake = snap(b, 520, 330, '#6', L(4, 0.5), w=220, h=140, size=38, color='red')
	b.path(signature(60), L(4, 0.6), x=0, y=30, color='red', dur=0.25, width=3, parent=fake)
	b.text(520, 440, 'thiếu chữ ký của Bình', L(4, 0.75), size=30, color='red')
	b.path(rect(180, 64, 8), L(4, 0.85), x=520, y=330, color='red', width=5, sfx='thud')
	b.text(520, 330, 'Từ chối', L(4, 0.86), size=40, color='red', dur=0.2)


def s11(b, tm):
	L = tm.L
	title(b, 'Trả về · Fanout', L(0, 0.0))
	minimap(b, L(0, 0.0), 5)
	mainline(b, L(0, 0.0))
	b.path(clock(110), L(0, 0.05), x=360, y=360, dur=0.5)
	b.path(hand(110, -90), L(0, 0.3), x=360, y=360, dur=0.1, width=6, sfx='chime')
	b.text(360, 520, 'sẵn sàng trả về', L(0, 0.45), size=44, color='green')
	b.text(360, 580, 'ReadyToFanout', L(0, 0.6), size=32, color='dim', mono=True)
	ring, lab = head(b, 1200, 360, 480, 200, L(0, 0.1), dur=0.8)
	frame = snap(b, 1200, 380, '#5', L(0, 0.3), w=600, h=260, size=40, sfx=None)
	coins = []
	for k, (x, v) in enumerate(((1020, '12'), (1200, '8'), (1380, '15'))):
		coins.append(b.utxo(x, 400, v, L(0, 0.35 + k * 0.05), w=140, h=80, size=38, locked=True, sfx=None))
	for k, g in enumerate(coins):
		dx = (640 + k * 380) - (1020 + k * 180)
		g.move(L(1, 0.3 + k * 0.15), L(1, 0.6 + k * 0.15), dx, (MAIN_Y - 70) - 400)
	b.text(1100, 960, 'cùng địa chỉ, cùng số lượng', L(2, 0.2), size=44, color='yellow')
	for k in range(3):
		x = 640 + k * 380
		b.path(ellipse(40), L(2, 0.5 + k * 0.1), x=x + 64, y=MAIN_Y - 70 - 50, color='yellow', dur=0.3, width=4)
	ring.erase(L(3, 0.0), fade=1.0)
	lab.erase(L(3, 0.0), fade=1.0)
	frame.erase(L(3, 0.0), fade=1.0)
	b.text(1200, 360, 'Head kết thúc', L(3, 0.2), size=60, color='dim')
	b.path(rect(380, 62, 30), L(3, 0.5), x=1650, y=86, color='yellow', dur=0.6, width=4, sfx='chime')


def s12(b, tm):
	L = tm.L
	b.text(CX, 120, 'Món nào cũng có đường về', L(0, 0.05), size=56)
	stage_arc(b, L(0, 0.1), step=0.1, dur=0.3)
	b.path(ellipse(84), L(1, 0.0), x=ARC[4][0], y=ARC[4][1], color='yellow', dur=0.4, width=6)
	b.path(eye(1.2), L(1, 0.3), x=1120, y=640, color='cyan', dur=0.5)
	b.text(1120, 720, 'đúng lúc', L(1, 0.5), size=40, color='cyan')
	b.text(CX, 990, 'không ai lên tiếng → snapshot cũ được dùng', L(2, 0.15), size=44, color='red')
	b.path(phone(1.0), L(3, 0.1), x=820, y=670, dur=0.5)
	b.path(dashed(1060, 650, 880, 660), L(3, 0.35), color='cyan', dur=0.4, width=4)
	b.text(820, 800, 'ứng dụng của bạn', L(3, 0.45), size=36)
	b.text(820, 860, 'theo dõi liên tục', L(3, 0.65), size=40, color='green')


CODE = [
	"const bridge = new HydraBridge({ url: 'ws://…' })",
	'await bridge.connect()',
	"bridge.events.on('onMessage', payload => {",
	'  switch (payload.tag) { … }',
	'})',
]


def s13(b, tm):
	L = tm.L
	b.text(120, 92, 'Cho lập trình viên', L(0, 0.0), size=46, color='cyan', anchor='lm')
	b.text(1800, 92, '@hydra-sdk/bridge', L(0, 0.4), size=34, color='dim', anchor='rm', mono=True)
	x0, y0, lh, sz = 120, 320, 78, 40
	starts = [L(0, 0.6), L(1, 0.05), L(3, 0.05), L(3, 0.35), L(3, 0.5)]
	for i, (src, t) in enumerate(zip(CODE, starts)):
		b.text(x0, y0 + i * lh, src, t, size=sz, mono=True, anchor='lm', color='chalk' if i != 4 else 'dim')
	f = font(sz, True)
	pre = f.getlength("bridge.events.on(")
	wid = f.getlength("'onMessage'")
	b.path(ellipse(wid / 2 + 22, 36), L(3, 0.3), x=x0 + 6 + pre + wid / 2, y=y0 + 2 * lh, color='yellow', dur=0.5, width=4)
	end = x0 + f.getlength(CODE[2]) + 40
	b.text(end, y0 + 2 * lh, '← nghe mọi tin nhắn', L(3, 0.45), size=34, color='yellow', anchor='lm')
	# Sơ đồ: nút Hydra ↔ ứng dụng
	nx, ny, ay = 1660, 300, 760
	b.path(rect(300, 100, 14), L(1, 0.3), x=nx, y=ny, color='cyan')
	b.text(nx, ny, 'nút Hydra', L(1, 0.4), size=40, color='cyan')
	b.path(rect(300, 100, 14), L(1, 0.45), x=nx, y=ay)
	b.text(nx, ay, 'ứng dụng', L(1, 0.55), size=40)
	b.path(arrow(nx - 50, ny + 60, nx - 50, ay - 60), L(1, 0.65), color='dim', dur=0.4, width=4)
	b.path(arrow(nx + 50, ay - 60, nx + 50, ny + 60), L(1, 0.7), color='dim', dur=0.4, width=4)
	b.text(nx - 80, (ny + ay) / 2 + 70, 'WebSocket', L(1, 0.8), size=32, color='dim', anchor='rm', mono=True)
	for k, tag in enumerate(('HeadIsOpen', 'SnapshotConfirmed', 'HeadIsClosed')):
		t = L(2, 0.1 + k * 0.28)
		g = b.group(nx + 120, ny + 90)
		b.path(rect(28, 20, 3), t, parent=g, color='yellow', dur=0.15, sfx='tick')
		b.text(24, 0, tag, t + 0.05, size=24, color='yellow', mono=True, anchor='lm', parent=g, dur=0.2)
		g.move(t + 0.1, t + 0.7, 0, ay - ny - 180)
		g.erase(t + 0.8, fade=0.3)


ROWS = [
	('Mở Head', 'HeadIsOpen', 0, 0.55),
	('Đóng Head', 'HeadIsClosed', 1, 0.05),
	('Khiếu nại', 'HeadIsContested', 2, 0.05),
	('Hết giờ', 'ReadyToFanout', 2, 0.55),
	('Trả về xong', 'HeadIsFinalized', 3, 0.6),
]


def s14(b, tm):
	L = tm.L
	b.text(120, 92, 'Nhãn của từng chặng', L(0, 0.0), size=46, color='cyan', anchor='lm')
	y0, lh = 220, 96
	f = font(40, True)
	for k, (st, tag, li, fr) in enumerate(ROWS):
		y = y0 + k * lh
		b.text(120, y, st, L(li, fr), size=48, anchor='lm')
		b.path(arrow(440, y, 540, y, head=14), L(li, fr + 0.05), color='dim', dur=0.2, width=4)
		b.text(570, y, tag, L(li, fr + 0.1), size=40, color='cyan', mono=True, anchor='lm')
		if tag == 'HeadIsClosed':
			end = 570 + f.getlength(tag) + 24
			b.text(end, y, '(contestationDeadline)', L(1, 0.5), size=28, color='dim', mono=True, anchor='lm')
			b.path(clock(34), L(1, 0.6), x=1560, y=y, dur=0.3)
			b.path(dashed(end + 420, y, 1510, y, dash=12, gap=10), L(1, 0.65), color='dim', dur=0.3, width=3)
		if tag == 'ReadyToFanout':
			end = 570 + f.getlength(tag)
			b.path(line(570, y + 30, end, y + 30), L(3, 0.05), color='green', dur=0.3, width=4)
			b.text(end + 30, y, '→ mới gửi lệnh trả về', L(3, 0.15), size=36, color='green', anchor='lm')
	cmd = 'bridge.commands: init · close · contest · fanout'
	yc = y0 + 5 * lh + 40
	b.text(120, yc, cmd, L(4, 0.1), size=34, mono=True, anchor='lm')
	fc = font(34, True)
	fx = 120 + fc.getlength(cmd[:-6])
	b.path(line(fx, yc + 28, fx + fc.getlength('fanout'), yc + 28), L(4, 0.6), color='yellow', dur=0.3, width=4)
	b.text(1500, yc, 'mỗi lệnh một dòng', L(4, 0.75), size=36, color='dim')
	# Nạp tiền: hàm chỉ soạn giao dịch, ví ký, gửi lên mạng chính
	yd = 940
	b.text(120, yd, 'bridge.commit()', L(5, 0.0), size=34, mono=True, anchor='lm', color='yellow')
	b.path(arrow(460, yd, 560, yd, head=14), L(5, 0.15), color='dim', dur=0.2, width=4)
	b.path(note(110, 76), L(5, 0.2), x=630, y=yd, dur=0.3)
	b.text(720, yd, 'giao dịch nạp chưa ký', L(5, 0.25), size=32, color='dim', anchor='lm')
	b.path(arrow(1080, yd, 1170, yd, head=14), L(5, 0.45), color='dim', dur=0.2, width=4)
	b.path(wallet(130, 86), L(5, 0.5), x=1250, y=yd, dur=0.4)
	b.path(signature(70), L(5, 0.6), x=1250, y=yd - 66, color='cyan', dur=0.25, width=3)
	b.path(arrow(1330, yd, 1420, yd, head=14), L(5, 0.75), color='dim', dur=0.2, width=4)
	b.path(line(1440, yd + 20, 1800, yd + 20), L(5, 0.8), dur=0.3)
	b.text(1620, yd - 14, 'mạng chính', L(5, 0.85), size=32, color='dim')


def s15(b, tm):
	L = tm.L
	b.text(CX, 170, 'Tóm lại', L(0, 0.0), size=64, color='dim')
	pts = ['1. Mở trước, nạp sau', '2. Snapshot đủ chữ ký', '3. Snapshot mới nhất thắng, rồi trả về']
	for k, s in enumerate(pts):
		b.text(330, 340 + k * 150, s, L(k + 1, 0.05), size=62, anchor='lm', color='yellow' if k == 2 else 'chalk', sfx='chime')
	b.clear(L(4, 0.0))
	b.text(CX, 480, 'hydrasdk.com', L(4, 0.15), size=120, color='yellow')
	b.path(line(-380, 0, 380, 0), L(4, 0.45), x=CX, y=570, color='yellow')
	b.text(1840, 1010, 'Thực hiện cùng VTechcom Labs', tm.E(4, 0.3), size=34, color='dim', anchor='rm')


SCENES = {f'{i:02d}': globals()[f's{i:02d}'] for i in range(1, 16)}
