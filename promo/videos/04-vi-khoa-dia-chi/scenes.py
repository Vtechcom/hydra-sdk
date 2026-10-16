"""Bố cục 13 cảnh của tập 4. Mỗi hàm nhận Board và Timing (mốc từ clip giọng thật).

Màu: red = cụm từ khôi phục và khoá bí mật (thứ phải giấu), cyan = khoá công khai và địa chỉ
(thứ được đưa người khác), yellow = món tiền chưa tiêu như tập 1.
"""
import math

from chalk import (arrow, check, cross, ellipse, fingerprint, key, line, lock, monitor, person, rect, signature,
	wallet)

CX, CY = 960, 500

# Từ minh hoạ, không phải cụm từ của ví thật. Mười hai từ sau vẽ màu dim.
WORDS = ['apple', 'river', 'stone', 'cloud', 'tiger', 'lemon', 'piano', 'chair', 'ocean', 'pencil', 'garden', 'rocket',
	'violin', 'castle', 'butter', 'window', 'planet', 'candle', 'forest', 'mirror', 'basket', 'island', 'silver', 'jacket']
NUMBER = '5f1d9e3a7c0fb244e19a63c2d8…'

# ---------------------------------------------------------------- hình riêng của tập


def phone(s=1.0):
	return rect(130 * s, 240 * s, 18 * s) + [line(-22 * s, 100 * s, 22 * s, 100 * s)[0], line(-14 * s, -104 * s, 14 * s, -104 * s)[0]]


def crack(s=1.0):
	return [[(-30 * s, -60 * s), (-6 * s, -24 * s), (-20 * s, 4 * s), (12 * s, 40 * s)], [(-6 * s, -24 * s), (24 * s, -36 * s)]]


def grid_icon(s=1.0):
	"""Tờ giấy ghi cụm từ thu nhỏ: khung và các dòng chữ."""
	return rect(150 * s, 110 * s, 8 * s) + [line(-56 * s, (-30 + 20 * k) * s, 56 * s, (-30 + 20 * k) * s)[0] for k in range(4)]


def paper(w=300, h=380):
	rows = [line(-w / 2 + 30, -h / 2 + 90 + 40 * k, w / 2 - 30 - (k % 2) * 40, -h / 2 + 90 + 40 * k)[0] for k in range(5)]
	return rect(w, h, 8) + rows


def blob(r=56):
	"""Vệt sơn: vòng méo và vài nét gạch bên trong."""
	pts = [(r * (1 + 0.12 * math.sin(3 * a)) * math.cos(a), r * (1 + 0.12 * math.sin(3 * a)) * math.sin(a))
		for a in [2 * math.pi * k / 40 for k in range(41)]]
	hatch = [line(-r * 0.5, r * (0.3 * k - 0.45), r * 0.5, r * (0.3 * k - 0.6))[0] for k in range(4)]
	return [pts] + hatch


def chest(w=300, h=180):
	return rect(w, h, 12) + [line(-w / 2, -h / 2 + 50, w / 2, -h / 2 + 50)[0]]


def camera(s=1.0):
	return rect(120 * s, 80 * s, 10 * s) + ellipse(24 * s) + [[(-30 * s, -40 * s), (-20 * s, -54 * s), (20 * s, -54 * s), (30 * s, -40 * s)]]


def cloud(s=1.0):
	arcs = []
	for cx, cy, r, a0, sw in ((-40, 10, 32, 90, 180), (-10, -18, 38, 180, 160), (34, -4, 34, 250, 160), (50, 26, 22, 270, 180)):
		arcs += ellipse(r * s, start=a0, sweep=sw, n=16, cx=cx * s, cy=cy * s)
	return arcs + [line(-40 * s, 42 * s, 50 * s, 48 * s)[0]]


def bubble(w=130, h=90):
	x0, y0, x1, y1 = -w / 2, -h / 2, w / 2, h / 2
	return [[(x0, y0), (x1, y0), (x1, y1), (-w * 0.1, y1), (-w * 0.3, y1 + 28), (-w * 0.28, y1), (x0, y1), (x0, y0)]]


def browser(w=420, h=260):
	return rect(w, h, 10) + [line(-w / 2, -h / 2 + 40, w / 2, -h / 2 + 40)[0]] + \
		[ellipse(6, cx=-w / 2 + 22 + 20 * k, cy=-h / 2 + 20)[0] for k in range(3)]


def stamp(b, x, y, at, label='Lừa đảo', w=260, h=90):
	g = b.group(x, y)
	b.path(rect(w, h, 8), at, parent=g, color='red', width=6, dur=0.2, sfx='thud')
	b.text(0, 0, label, at + 0.05, parent=g, size=54, color='red', rot=8, dur=0.2)
	return g


def word_grid(b, cx, cy, at, step=0.03, cols=6, cw=270, ch=92, size=36):
	"""Lưới 24 ô từ: mười hai ô đầu đỏ phấn, mười hai ô sau mờ đi."""
	rows = (len(WORDS) + cols - 1) // cols
	g = b.group(cx, cy)
	for k, w in enumerate(WORDS):
		r, c = divmod(k, cols)
		x = (c - (cols - 1) / 2) * cw
		y = (r - (rows - 1) / 2) * ch
		color = 'red' if k < 12 else 'dim'
		t = at + k * step
		b.path(rect(cw - 20, ch - 16, 10), t, x=x, y=y, parent=g, color=color, dur=0.25, width=3, sfx='tick' if k % 6 == 0 else None)
		b.text(x, y, f'{k + 1}. {w}', t + 0.1, parent=g, size=size, color=color, dur=0.25)
	return g


# ---------------------------------------------------------------- cảnh


def s01(b, tm):
	L = tm.L
	b.text(CX, 170, 'Ví giữ chìa, không giữ tiền', L(0, 0.35), size=72)
	b.path(line(-420, 0, 420, 0), L(0, 0.8), x=CX, y=240, color='dim')
	b.path(wallet(380, 240), L(0, 0.0), x=780, y=560, dur=0.9)
	for j in range(3):
		b.path(key(1.3), L(0, 0.55 + j * 0.1), x=730, y=500 + j * 52, dur=0.35, color='red')
	b.text(1260, 560, '?', L(1, 0.3), size=220, color='chalk', sfx='chime')
	b.text(CX, 880, 'Chìa khoá là gì? Từ đâu mà có?', L(1, 0.5), size=60)
	b.clear(L(2, 0.0))
	b.path(line(0, 300, 0, 860), L(2, 0.05), x=CX, y=0, color='dim', width=3)
	b.path(chest(300, 180), L(2, 0.1), x=520, y=540, dur=0.6)
	b.path(lock(1.2), L(2, 0.25), x=520, y=470, dur=0.4, width=4)
	b.path(key(1.4), L(2, 0.3), x=520, y=580, dur=0.3, color='red')
	b.text(520, 760, 'giữ thật kỹ', L(2, 0.35), size=64, color='red')
	b.text(1400, 500, 'addr1qx…7k', L(2, 0.6), size=60, mono=True, color='cyan')
	b.path(arrow(1260, 580, 1540, 580), L(2, 0.7), color='dim', dur=0.3)
	b.path(person(0.8), L(2, 0.72), x=1620, y=580, dur=0.4, width=4)
	b.text(1400, 760, 'đưa ai cũng được', L(2, 0.8), size=64, color='cyan')


def s02(b, tm):
	L = tm.L
	ph = b.path(phone(1.4), L(0, 0.0), x=520, y=380, dur=0.7)
	ph.move(L(0, 0.3), L(0, 0.42), 0, 260)
	b.path(crack(1.4), L(0, 0.44), x=520, y=640, color='chalk', dur=0.2, width=4, sfx='thud')
	b.text(520, 150, 'Mất điện thoại', L(0, 0.1), size=60)
	q = b.text(1340, 210, 'Mất tiền?', L(0, 0.7), size=76, color='red')
	st = b.strike(1170, 215, 1510, 205, L(1, 0.05))
	b.text(1340, 300, 'Không', L(1, 0.12), size=76, color='green', sfx='chime')
	q.erase(L(1, 0.5), fade=0.8)
	st.erase(L(1, 0.5), fade=0.8)
	b.text(1340, 420, 'trên blockchain', L(1, 0.35), size=42, color='dim')
	for k, (x, v) in enumerate(((1100, '20'), (1340, '8'), (1580, '35'))):
		b.utxo(x, 540, v, L(1, 0.4 + k * 0.1), w=170, h=90, size=44, locked=True)
		if k:
			b.path(line(x - 155, 540, x - 85, 540), L(1, 0.45 + k * 0.1), color='dim', width=3, dur=0.2)
	b.path(key(1.8), L(2, 0.2), x=1220, y=790, dur=0.5, color='red')
	b.text(1430, 790, '?', L(2, 0.4), size=110, color='chalk')
	b.text(CX, 960, 'Còn lấy lại được chìa khoá không?', L(2, 0.5), size=58)


def s03(b, tm):
	L = tm.L
	b.path(key(2.6), L(0, 0.0), x=430, y=300, dur=0.8, color='red')
	b.text(430, 430, 'Khoá bí mật', L(0, 0.15), size=64, color='red')
	b.text(430, 500, '(private key)', L(0, 0.25), size=38, color='dim')
	b.text(760, 300, NUMBER, L(0, 0.4), size=50, mono=True, color='red', anchor='lm')
	b.text(1260, 400, 'một con số rất lớn, ngẫu nhiên', L(0, 0.7), size=46, color='dim')
	guess = [b.path(monitor(1.5), L(1, 0.0), x=430, y=760, dur=0.6, color='dim')]
	for k, g in enumerate(('3a91c4…', 'e07b5d…', '91fc02…', '4d6a18…')):
		t = L(1, 0.15 + k * 0.12)
		guess.append(b.text(700, 640 + k * 76, g, t, size=42, mono=True, color='dim', anchor='lm', dur=0.2, sfx='tick'))
		guess.append(b.strike(690, 640 + k * 76, 900, 640 + k * 76, t + 0.25))
	guess.append(b.text(1400, 760, 'không ai đoán trúng', L(1, 0.7), size=56))
	for e in guess:
		e.erase(L(2, 0.0))
	for k, x in enumerate((900, 1200, 1500)):
		b.utxo(x, 720, ('50', '20', '7')[k], L(2, 0.1 + k * 0.08), w=180, h=96, size=46, locked=True)
		b.path(check(1.2), L(2, 0.45 + k * 0.08), x=x, y=610, color='green', dur=0.25, sfx='click')
	b.text(CX, 940, 'Phải giữ thật kín', L(2, 0.75), size=66, color='red')


def s04(b, tm):
	L = tm.L
	b.path(key(1.8), L(0, 0.0), x=300, y=330, dur=0.6, color='red')
	b.text(300, 430, 'Khoá bí mật', L(0, 0.1), size=50, color='red')
	b.path(arrow(470, 330, 1260, 330), L(0, 0.35), color='chalk', dur=0.6)
	b.path(rect(420, 120, 14), L(0, 0.55), x=1500, y=330, color='cyan', sfx='chime')
	b.text(1500, 330, 'Khoá công khai', L(0, 0.65), size=50, color='cyan')
	b.text(1500, 430, '(public key)', L(0, 0.75), size=36, color='dim')
	b.text(865, 270, 'dễ', L(1, 0.1), size=48, color='green')
	b.path(arrow(1260, 460, 470, 460), L(1, 0.5), color='dim', dur=0.5)
	b.path(cross(1.6), L(1, 0.8), x=865, y=460, color='red', width=7, sfx='thud')
	b.text(865, 540, 'không đi ngược được', L(1, 0.85), size=48, color='red')
	b.path(blob(), L(2, 0.0), x=360, y=800, color='cyan', dur=0.5)
	b.text(470, 800, '+', L(2, 0.08), size=70)
	b.path(blob(), L(2, 0.12), x=580, y=800, color='green', dur=0.5)
	b.path(arrow(680, 800, 840, 800), L(2, 0.25), color='chalk', dur=0.3)
	b.path(blob(66), L(2, 0.35), x=960, y=800, color='chalk', dur=0.5)
	b.path(arrow(1070, 800, 1300, 800), L(2, 0.6), color='dim', dur=0.3)
	b.text(1500, 800, '? + ?', L(2, 0.7), size=70, color='dim')
	b.path(cross(1.6), L(2, 0.8), x=1185, y=800, color='red', width=7)


def s05(b, tm):
	L = tm.L
	b.path(rect(330, 110, 14), L(0, 0.0), x=260, y=230, color='cyan')
	b.text(260, 230, 'Khoá công khai', L(0, 0.05), size=40, color='cyan')
	b.path(arrow(440, 230, 570, 230), L(0, 0.2), color='dim', dur=0.3)
	b.path(fingerprint(1.3), L(0, 0.25), x=680, y=230, dur=0.6, color='cyan', width=4)
	b.text(680, 340, 'dấu vân tay', L(0, 0.35), size=38, color='cyan')
	b.text(860, 230, '+', L(0, 0.5), size=70)
	b.path(rect(160, 80, 8), L(0, 0.55), x=1010, y=230, color='dim')
	b.text(1010, 230, 'mạng…', L(0, 0.6), size=34, color='dim')
	b.path(arrow(1110, 230, 1240, 230), L(0, 0.7), color='dim', dur=0.3)
	b.text(1520, 230, 'addr1qx…7k', L(0, 0.75), size=56, mono=True, color='cyan', sfx='chime')
	b.text(1520, 320, 'Địa chỉ', L(0, 0.85), size=44, color='cyan')
	b.utxo(820, 620, '50 ADA', L(1, 0.0), w=260, h=130, size=60)
	b.path(lock(2.0), L(1, 0.3), x=1060, y=600, dur=0.6)
	ad = b.text(1520, 230, 'addr1…', L(1, 0.4), size=40, mono=True, color='cyan', dur=0.2)
	ad.move(L(1, 0.5), L(1, 0.8), 1060 - 1520, 720 - 230)
	b.path(ellipse(70, 70), L(1, 0.85), x=1060, y=620, color='cyan', dur=0.4, sfx='click')
	b.text(1520, 620, 'Địa chỉ = ổ khoá', L(1, 0.7), size=60)
	b.path(person(0.9), L(2, 0.0), x=230, y=880, dur=0.5)
	b.text(230, 990, 'người gửi', L(2, 0.1), size=36, color='dim')
	b.path(arrow(320, 880, 640, 880), L(2, 0.3), color='dim', dur=0.3)
	b.utxo(800, 880, '20 ADA', L(2, 0.45), w=240, h=110, size=54)
	b.path(lock(1.3), L(2, 0.7), x=980, y=870, dur=0.4, color='cyan')
	b.path(check(1.4), L(3, 0.3), x=1290, y=880, color='green', sfx='tick')
	b.text(1350, 880, 'đưa ai cũng được', L(3, 0.35), size=54, color='green', anchor='lm')
	b.text(1350, 960, 'như số tài khoản', L(3, 0.6), size=40, color='dim', anchor='lm')


def s06(b, tm):
	L = tm.L
	b.path(wallet(300, 190), L(0, 0.0), x=260, y=850, dur=0.6)
	k = b.path(key(1.6), L(0, 0.05), x=240, y=850, dur=0.4, color='red')
	pg = b.group(470, 480)
	b.path(paper(300, 380), L(0, 0.1), parent=pg, dur=0.7)
	b.text(0, -140, 'Giao dịch', L(0, 0.15), parent=pg, size=40, color='dim')
	k.move(L(0, 0.25), L(0, 0.4), 230, -230)
	k.move(L(0, 0.55), L(0, 0.7), -230, 230)
	b.path(signature(200), L(0, 0.42), x=0, y=130, parent=pg, color='red', dur=0.4, width=4, sfx='thud')
	b.path(rect(260, 70, 10), L(0, 0.6), x=0, y=250, parent=pg, color='cyan', dur=0.3)
	b.text(0, 250, 'khoá công khai', L(0, 0.62), parent=pg, size=34, color='cyan', dur=0.3)
	pg.move(L(0, 0.72), L(0, 0.95), 450, -40)
	b.path(check(1.3), L(1, 0.7), x=1160, y=250, color='green', sfx='tick')
	b.text(1210, 250, 'Chữ ký khớp khoá công khai?', L(1, 0.3), size=42, anchor='lm')
	b.path(check(1.3), L(2, 0.5), x=1160, y=360, color='green', sfx='tick')
	b.text(1210, 360, 'Vân tay khớp ổ khoá?', L(2, 0.1), size=42, anchor='lm')
	b.utxo(1440, 640, '50 ADA', L(2, 0.0), w=240, h=120, size=56)
	cl = b.path(lock(1.8), L(2, 0.05), x=1680, y=620, dur=0.4)
	cl.erase(L(2, 0.85), fade=0.15)
	b.path(lock(1.8, open_=True), L(2, 0.85), x=1680, y=620, dur=0.15, color='green', sfx='click')
	b.path(ellipse(210, 130), L(3, 0.1), x=260, y=850, color='red', dur=0.6)
	b.text(CX, 900, 'Chìa không rời ví', L(3, 0.2), size=66, color='red')
	b.text(CX, 990, 'chữ ký = bằng chứng có chìa', L(3, 0.6), size=44, color='chalk')


def s07(b, tm):
	L = tm.L
	num = b.text(CX, 300, NUMBER, L(0, 0.0), size=60, mono=True, color='red')
	n1 = b.text(700, 430, 'chép tay dễ sai', L(0, 0.45), size=50, color='dim')
	n2 = b.text(1220, 430, 'khó nhớ', L(0, 0.75), size=50, color='dim')
	for e in (num, n1, n2):
		e.erase(L(1, 0.25))
	b.path(wallet(240, 150), L(1, 0.0), x=230, y=170, dur=0.5, color='dim')
	b.text(420, 170, 'ví mới', L(1, 0.05), size=40, color='dim', anchor='lm')
	word_grid(b, CX, 590, L(1, 0.35), step=0.025)
	b.text(CX, 160, 'Cụm từ khôi phục', L(2, 0.0), size=76, color='red', sfx='chime')
	b.text(CX, 245, '(seed phrase · mnemonic)', L(2, 0.15), size=38, color='dim')
	b.text(CX, 940, '24 từ · đúng thứ tự', L(2, 0.6), size=56)
	b.text(1840, 1030, 'từ minh hoạ', L(2, 0.7), size=30, color='dim', anchor='rm')


def s08(b, tm):
	L = tm.L
	b.path(grid_icon(1.0), L(0, 0.0), x=170, y=540, color='red', dur=0.5)
	b.text(170, 640, 'cụm từ', L(0, 0.05), size=38, color='red')
	b.path(arrow(260, 540, 380, 540), L(0, 0.15), color='dim', dur=0.25)
	b.path(key(2.0), L(0, 0.2), x=490, y=540, dur=0.5, color='red')
	b.text(490, 640, 'khoá gốc', L(0, 0.25), size=38, color='red')
	ys = (260, 540, 820)
	for k, y in enumerate(ys):
		t = L(0, 0.5 + k * 0.12)
		b.path([[(590, 540), (680, 540), (680, y), (760, y)]], t, color='chalk', dur=0.35, sfx='tick')
		b.path(key(1.2), t + 0.3, x=830, y=y, dur=0.3, color='red')
		b.text(830, y + 60, f'khoá {k + 1}', t + 0.35, size=32, color='dim', dur=0.2)
	for k, y in enumerate(ys):
		t = L(1, 0.15 + k * 0.12)
		b.path(arrow(920, y, 1040, y), t, color='dim', dur=0.25)
		b.path(rect(90, 50, 8), t + 0.1, x=1100, y=y, color='cyan', dur=0.25)
		b.path(arrow(1160, y, 1260, y), t + 0.2, color='dim', dur=0.2)
		b.text(1290, y, f'addr1…{"abc"[k]}', t + 0.3, size=46, mono=True, color='cyan', anchor='lm', dur=0.3)
	b.text(1290, 400, '…', L(1, 0.65), size=60, color='dim', anchor='lm')
	b.text(1290, 680, '…', L(1, 0.7), size=60, color='dim', anchor='lm')
	b.text(1450, 120, 'một cụm từ, nhiều địa chỉ', L(1, 0.75), size=46, color='cyan')
	b.path(rect(1790, 900, 24), L(2, 0.3), x=CX, y=545, color='green', dur=1.0, width=3)
	b.text(CX, 1030, 'cùng cụm từ → luôn ra đúng những khoá, những địa chỉ ấy', L(2, 0.5), size=40, color='green', sfx='chime')


def s09(b, tm):
	L = tm.L
	b.path(line(0, 140, 0, 960), L(0, 0.0), x=CX, y=0, color='dim', width=3, dur=0.6)
	b.text(480, 130, 'Còn cụm từ', L(0, 0.1), size=60, color='green')
	b.path(phone(1.2), L(0, 0.2), x=220, y=470, dur=0.6)
	gi = b.path(grid_icon(0.8), L(0, 0.45), x=220, y=760, color='red', dur=0.4)
	gi.move(L(0, 0.65), L(0, 0.9), 0, -290)
	gi.erase(L(1, 0.05), fade=0.3)
	b.path(key(1.3), L(1, 0.1), x=440, y=470, dur=0.4, color='red')
	for k, y in enumerate((330, 470, 610)):
		t = L(1, 0.3 + k * 0.12)
		b.path(arrow(530, 470, 640, y), t, color='dim', dur=0.25)
		b.utxo(740, y, ('20', '8', '35')[k], t + 0.1, w=150, h=80, size=40)
		b.path(check(1.0), t + 0.35, x=850, y=y, color='green', dur=0.2)
	b.text(480, 800, 'khôi phục như cũ', L(1, 0.8), size=52, color='green')
	b.text(1440, 130, 'Mất cụm từ', L(2, 0.0), size=60, color='red')
	g2 = b.path(grid_icon(1.0), L(2, 0.05), x=1440, y=300, color='red', dur=0.3)
	g2.erase(L(2, 0.2), fade=0.8)
	b.path(rect(380, 80, 12), L(2, 0.45), x=1440, y=460, color='dim')
	b.text(1440, 460, 'Quên mật khẩu?', L(2, 0.5), size=44, color='dim')
	b.strike(1230, 470, 1650, 450, L(2, 0.75))
	b.text(1440, 560, 'không ai cấp lại', L(2, 0.8), size=46, color='red')
	for k, x in enumerate((1220, 1440, 1660)):
		b.utxo(x, 720, ('20', '8', '35')[k], L(3, 0.0 + k * 0.08), w=150, h=80, size=40, color='dim')
		b.path(lock(0.9), L(3, 0.2 + k * 0.08), x=x + 62, y=668, color='dim', dur=0.3, width=4)
	b.text(1440, 860, 'tiền còn đó,', L(3, 0.45), size=46)
	b.text(1440, 930, 'không ai mở được', L(3, 0.6), size=46, color='red')


def s10(b, tm):
	L = tm.L
	b.text(CX, 170, 'Có cụm từ = có mọi chìa', L(0, 0.1), size=70, color='red')
	b.path(grid_icon(1.4), L(0, 0.3), x=640, y=480, color='red', dur=0.5)
	b.path(arrow(780, 480, 1040, 480), L(0, 0.5), color='dim', dur=0.3)
	for j in range(4):
		b.path(key(1.3), L(0, 0.6 + j * 0.08), x=1200, y=390 + j * 60, dur=0.3, color='red')
	b.clear(L(1, 0.0))
	b.path(person(1.1), L(1, 0.05), x=240, y=470, dur=0.5, color='red')
	b.text(240, 590, 'người lạ', L(1, 0.1), size=40, color='red')
	b.path(grid_icon(0.8), L(1, 0.2), x=420, y=380, color='red', dur=0.3)
	b.path(arrow(500, 450, 640, 450), L(1, 0.3), color='dim', dur=0.3)
	b.path(monitor(1.6), L(1, 0.35), x=780, y=440, dur=0.5)
	b.text(780, 580, 'máy của họ', L(1, 0.4), size=38, color='dim')
	b.path(key(1.0), L(1, 0.5), x=780, y=430, dur=0.3, color='red')
	for k, (x, v) in enumerate(((1150, '20'), (1350, '8'), (1550, '35'))):
		g = b.utxo(x, 440, v, L(1, 0.15 + k * 0.05), w=150, h=80, size=40)
		g.move(L(1, 0.7 + k * 0.05), L(1, 0.95 + k * 0.05), 260, -60)
		g.erase(L(1, 0.95 + k * 0.05), fade=0.4)
	b.text(1450, 600, 'chuyển hết đi', L(1, 0.75), size=48, color='red')
	b.text(CX, 800, 'Không thể đảo ngược', L(2, 0.1), size=70, color='red', sfx='thud')
	b.text(CX, 890, 'không có ai để khiếu nại', L(2, 0.6), size=46, color='dim')
	b.clear(L(3, 0.0))
	b.text(CX, 160, 'Hỗ trợ chân chính không cần cụm từ của bạn', L(3, 0.15), size=54, color='green')
	helper = [b.path(person(1.3), L(3, 0.3), x=620, y=560, dur=0.5, color='green'),
		b.text(620, 380, 'hỗ trợ', L(3, 0.35), size=44, color='green'),
		b.path(arrow(740, 540, 1080, 540), L(3, 0.45), color='dim', dur=0.3),
		b.path(grid_icon(1.3), L(3, 0.5), x=1260, y=540, color='red', dur=0.4),
		b.path(cross(3.2), L(3, 0.7), x=1260, y=540, color='red', width=7, sfx='strike'),
		b.text(CX, 800, 'không cần, không hỏi', L(3, 0.75), size=52)]
	for e in helper:
		e.erase(L(4, 0.0))
	b.path(bubble(420, 240), L(4, 0.05), x=400, y=540, dur=0.5)
	b.text(400, 540, 'Gửi cụm từ\nđể mở khoá ví', L(4, 0.1), size=40)
	b.path(browser(440, 280), L(4, 0.2), x=CX, y=540, dur=0.5)
	b.text(CX, 570, 'Nhập cụm từ\nđể nhận quà', L(4, 0.25), size=40)
	b.path(person(1.2), L(4, 0.35), x=1520, y=560, dur=0.5)
	b.text(1520, 400, 'Hỗ trợ', L(4, 0.4), size=40)
	for k, x in enumerate((400, CX, 1520)):
		stamp(b, x, 800, L(4, 0.6 + k * 0.12))


def s11(b, tm):
	L = tm.L
	b.text(480, 170, 'Viết ra giấy', L(0, 0.2), size=58)
	b.text(480, 250, 'cất nơi an toàn', L(0, 0.55), size=50, color='dim')
	pp = b.path(paper(240, 280), L(0, 0.15), x=480, y=480, color='red', dur=0.6)
	pp.move(L(0, 0.6), L(0, 0.8), 0, 260)
	pp.erase(L(0, 0.82), fade=0.3)
	b.path(grid_icon(0.8), L(0, 0.82), x=480, y=800, color='red', dur=0.3)
	b.path(chest(340, 200), L(0, 0.45), x=480, y=760, dur=0.6, sfx='thud')
	b.path(lock(1.4), L(0, 0.85), x=480, y=640, dur=0.3, width=4, sfx='click')
	b.path(line(0, 140, 0, 960), L(1, 0.0), x=900, y=0, color='dim', width=3, dur=0.5)
	icons = ((camera(1.4), 1120, 'chụp ảnh'), (cloud(1.4), 1420, 'lưu lên mạng'), (bubble(150, 100), 1720, 'gửi tin nhắn'))
	for k, (shape, x, lab) in enumerate(icons):
		t = L(1, 0.05 + k * 0.18)
		b.path(shape, t, x=x, y=470, dur=0.5)
		b.text(x, 600, lab, t + 0.1, size=40, color='dim')
		b.path(cross(2.6), t + 0.3, x=x, y=470, color='red', width=7, sfx='strike')
	b.text(1420, 800, 'kể cả người thân', L(1, 0.75), size=54, color='red')


CODE = [
	("import { AppWallet, NETWORK_ID } from '@hydra-sdk/core'", 0, 0.5),
	('', 0, 0),
	('const words = AppWallet.brew()   // 24 từ', 1, 0.05),
	('const wallet = new AppWallet({', 1, 0.35),
	('  networkId: NETWORK_ID.PREPROD,', 1, 0.42),
	("  key: { type: 'mnemonic', words }", 1, 0.5),
	('})', 1, 0.55),
	('wallet.getPaymentAddress()   // addr…', 1, 0.7),
	('wallet.signTx(unsignedTx)', 1, 0.85),
	('', 0, 0),
	("EmbeddedWallet  m/1852'/1815'/0'/0/0", 2, 0.25),
	("key: 'mnemonic' | 'root' | 'cli'", 3, 0.2),
]


def s12(b, tm):
	L = tm.L
	b.text(150, 110, 'Cho lập trình viên', L(0, 0.0), size=46, color='cyan', anchor='lm')
	b.text(1770, 110, '@hydra-sdk/core', L(0, 0.5), size=36, color='dim', anchor='rm', mono=True)
	x0, y0, lh, cw = 150, 220, 62, 23
	for i, (src, li, f) in enumerate(CODE):
		if src:
			color = 'dim' if src.startswith('})') else 'chalk'
			b.text(x0, y0 + i * lh, src, L(li, f), size=38, mono=True, anchor='lm', color=color)
	b.path(ellipse(196, 34), L(1, 0.2), x=x0 + 22 * cw, y=y0 + 2 * lh, color='red', dur=0.5)
	b.path(line(0, 0, 19 * cw, 0), L(1, 0.78), x=x0 + 7 * cw, y=y0 + 7 * lh + 26, color='cyan')
	b.text(1180, y0 + 10 * lh, 'CIP-1852 · BIP39', L(2, 0.6), size=34, mono=True, color='dim', anchor='lm')
	b.text(1050, y0 + 11 * lh, '← khoá gốc, khoá từ cardano-cli', L(3, 0.5), size=38, color='dim', anchor='lm')
	b.text(820, y0 + 8 * lh, '← Cardano và Hydra Head', L(4, 0.2), size=42, color='cyan', anchor='lm')
	b.text(CX, 1010, 'Đừng ghi cụm từ ra log · đừng gửi về máy chủ', L(5, 0.35), size=44, color='red')


def s13(b, tm):
	L = tm.L
	b.text(CX, 170, 'Tóm lại', L(0, 0.0), size=64, color='dim')
	pts = [('1. Cụm từ → khoá bí mật → khoá công khai → địa chỉ', 'chalk'), ('2. Địa chỉ đưa ai cũng được', 'cyan'),
		('3. Cụm từ khôi phục không đưa cho ai', 'red')]
	for k, (s, c) in enumerate(pts):
		b.text(200, 360 + k * 170, s, L(k + 1, 0.05), size=54, anchor='lm', color=c, sfx='chime')
	b.path(line(0, 0, 900, 0), L(3, 0.6), x=230, y=740, color='red')
	b.clear(L(4, 0.0))
	b.text(CX, 480, 'hydrasdk.com', L(4, 0.15), size=120, color='yellow')
	b.path(line(-380, 0, 380, 0), L(4, 0.6), x=CX, y=570, color='yellow')
	b.text(1840, 1010, 'Thực hiện cùng VTechcom Labs', tm.E(4, 0.3), size=34, color='dim', anchor='rm')


SCENES = {f'{i:02d}': globals()[f's{i:02d}'] for i in range(1, 14)}
