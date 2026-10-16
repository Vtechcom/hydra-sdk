"""Bố cục 17 cảnh của tập 1. Mỗi hàm nhận Board và Timing (mốc từ clip giọng thật)."""
from chalk import (arrow, bank, bill, check, cross, cup, ellipse, envelope, eye, fingerprint, gear, key, line, lock,
	magnifier, monitor, network, note, person, rect, signature, wallet)

CX, CY = 960, 500


def s01(b, tm):
	L = tm.L
	# Hai ô số dư kiểu ngân hàng
	for x, who, val, new in ((620, 'Bạn', '500k', '400k'), (1300, 'Người nhận', '200k', '300k')):
		b.path(rect(360, 220, 18), L(0, 0.0), x=x, y=430)
		b.text(x, 365, who, L(0, 0.1), size=44, color='dim')
		b.text(x, 450, val, L(0, 0.15), size=72)
		b.strike(x - 80, 455, x + 80, 445, L(0, 0.55))
		b.text(x, 600, new, L(0, 0.65), size=60, color='yellow')
	b.path(arrow(820, 430, 1100, 430), L(0, 0.35), dur=0.5, color='cyan')
	b.path(bank(0.9), L(0, 0.0), x=CX, y=170, dur=0.9)
	b.path(cross(5), L(1, 0.45), x=CX, y=430, color='red', dur=0.5, width=8, sfx='thud')
	b.clear(L(1, 0.85))
	b.text(CX, 380, 'Tiền của bạn nằm ở đâu?', L(2, 0.0), size=84)
	for k, (x, y) in enumerate(((330, 230), (1580, 250), (420, 820), (1500, 830))):
		b.path(bill(130, 70), L(2, 0.3 + k * 0.1), x=x, y=y, color='dim', dur=0.4)
		b.text(x, y, '?', L(2, 0.4 + k * 0.1), size=40, color='dim', dur=0.2)
	b.text(CX, 640, 'UTxO', L(3, 0.55), size=150, color='yellow', sfx='chime')
	b.path(line(-170, 0, 170, 0), L(3, 0.85), x=CX, y=730, color='yellow')


def s02(b, tm):
	L = tm.L
	b.path(rect(620, 440, 10), L(0, 0.0), x=640, y=460, dur=0.8)
	b.text(640, 290, 'Sổ cái', L(0, 0.15), size=60)
	b.path(line(-290, 0, 290, 0), L(0, 0.3), x=640, y=340)
	b.path(person(0.42), L(0, 0.5), x=390, y=440, dur=0.4, width=4)
	b.text(430, 430, 'An', L(0, 0.55), size=56, anchor='lm')
	b.path(person(0.42), L(0, 0.6), x=390, y=570, dur=0.4, width=4)
	b.text(430, 560, 'Bình', L(0, 0.65), size=56, anchor='lm')
	b.path(bank(0.7), L(0, 0.0), x=150, y=220, dur=0.7, color='dim')
	b.text(830, 430, '10', L(0, 0.75), size=64, color='yellow')
	b.text(830, 560, '0', L(0, 0.8), size=64, color='yellow')
	b.path(line(-290, 0, 290, 0), L(0, 0.6), x=640, y=495, color='dim', width=3)
	# Lệnh chuyển và kiểm tra số dư
	b.text(1420, 330, 'An → Bình: 5', L(1, 0.0), size=58, color='cyan')
	b.text(1420, 440, '10 ≥ 5 ?', L(1, 0.3), size=52)
	b.path(check(1.4), L(1, 0.45), x=1580, y=440, color='green', sfx='tick')
	b.strike(800, 440, 860, 420, L(1, 0.6))
	b.text(910, 430, '5', L(1, 0.65), size=64, color='chalk')
	b.strike(805, 570, 855, 550, L(1, 0.78))
	b.text(910, 560, '5', L(1, 0.83), size=64, color='chalk')
	b.text(CX, 840, 'Mô hình tài khoản', L(2, 0.0), size=72)
	b.path(line(-280, 0, 280, 0), L(2, 0.3), x=CX, y=895)
	b.text(1500, 930, 'Ethereum', L(2, 0.65), size=44, color='dim')


def s03(b, tm):
	L = tm.L
	b.text(CX, 150, 'Lỗ hổng', L(0, 0.2), size=72, color='red')
	net = b.path(network(), L(0, 0.0), x=1420, y=500, dur=1.2, color='dim')
	ey = b.path(eye(1.2), L(1, 0.3), x=1420, y=500, dur=0.5, color='cyan')
	net.erase(L(1, 0.9))
	ey.erase(L(1, 0.9))
	b.path(person(0.9), L(2, 0.0), x=1060, y=560, dur=0.6, color='red')
	b.text(1060, 660, 'kẻ xấu', L(2, 0.1), size=40, color='red')
	b.path(arrow(1000, 520, 800, 520), L(2, 0.25), color='red', dur=0.3)
	cards = []
	for k in range(4):
		g = b.group(520 + k * 30, 330 + k * 125)
		at = L(1, 0.0) if k == 0 else L(2, 0.3 + k * 0.15)
		b.path(rect(440, 110, 12), at, parent=g, dur=0.4, sfx='tick' if k else None)
		b.text(0, 0, 'An → Bình: 5', at + 0.2, size=50, color='cyan', parent=g, dur=0.4)
		cards.append(g)
	b.text(1400, 360, 'Số dư của An', L(2, 0.0), size=46, color='dim')
	vals = ['10', '5', '0', '-5']
	b.text(1400, 460, vals[0], L(2, 0.05), size=96, color='yellow')
	for k, v in enumerate(vals[1:3], 1):
		t = L(2, 0.35 + k * 0.2)
		b.strike(1360, 470 + (k - 1) * 120, 1440, 450 + (k - 1) * 120, t)
		b.text(1400, 460 + k * 120, v, t + 0.1, size=96, color='red' if v == '0' else 'yellow', sfx='thud' if v == '0' else None)
	# Ethereum: đánh số từng lệnh
	for k, g in enumerate(cards):
		b.text(250, 0, f'#{k + 1}', L(3, 0.2 + k * 0.12), size=46, color='green', parent=g, dur=0.3)
	b.text(560, 820, 'mọi máy phải nhớ các số này', L(3, 0.65), size=44, color='green', anchor='lm')
	b.clear(L(4, 0.0))
	b.text(CX, 480, 'Bitcoin chọn một lối khác', L(4, 0.25), size=78)


def s04(b, tm):
	L = tm.L
	b.path(wallet(), L(0, 0.1), x=360, y=500, dur=1.0)
	notes = [('50k', 900), ('20k', 1160), ('10k', 1420)]
	for k, (v, x) in enumerate(notes):
		t = L(1, 0.45 + k * 0.17)
		g = b.group(360, 500)
		b.path(bill(200, 110), t, parent=g, color='yellow', dur=0.45, sfx='tick')
		b.text(-28, 0, v, t + 0.3, parent=g, size=48, color='yellow', dur=0.3)
		g.move(t, t + 0.8, x - 360, -60)
	b.path(line(-330, 0, 330, 0), L(2, 0.5), x=1160, y=560)
	b.text(1160, 640, '= 80k', L(2, 0.7), size=84, color='yellow')
	b.text(CX, 880, 'Bitcoin · Cardano', L(3, 0.1), size=60, color='cyan')


def s05(b, tm):
	L = tm.L
	b.path(cup(1.3), L(0, 0.05), x=1500, y=330, dur=0.9)
	b.text(1500, 500, 'Cà phê: 30k', L(0, 0.4), size=52)
	b.text(330, 330, 'Ví bạn', L(0, 0.6), size=48, color='dim')
	b.path(person(1.0), L(0, 0.5), x=150, y=480, dur=0.6)
	b.text(150, 580, 'bạn', L(0, 0.6), size=38, color='dim')
	b.path(person(1.0), L(0, 0.2), x=1760, y=330, dur=0.6)
	b.text(1760, 430, 'người bán', L(0, 0.3), size=38, color='dim')
	g50 = b.utxo(330, 450, '50k', L(1, 0.0), w=210, h=115, size=58)
	g50.move(L(1, 0.5), L(1, 0.9), 630, 0)
	b.path(cross(3), L(1, 0.95), x=CX, y=450, color='red', width=7, sfx='strike')
	b.path(arrow(1090, 470, 1320, 600), L(2, 0.05), color='dim')
	b.path(arrow(830, 470, 520, 620), L(2, 0.45), color='dim')
	b.utxo(1440, 650, '30k', L(2, 0.15), w=200, h=110, size=54)
	b.text(1440, 750, 'người bán', L(2, 0.3), size=40, color='dim')
	b.utxo(420, 680, '20k', L(2, 0.6), w=200, h=110, size=54)
	b.text(420, 780, 'tiền thối', L(2, 0.75), size=40, color='dim')
	g50.erase(L(3, 0.2), fade=0.8)
	b.text(CX, 920, '1 tờ cũ  →  2 tờ mới', L(3, 0.45), size=58)


def s06(b, tm):
	L = tm.L
	b.text(CX, 230, 'UTxO', L(0, 0.55), size=150, color='yellow')
	b.text(CX, 400, 'Unspent Transaction Output', L(1, 0.15), size=58, color='dim')
	b.path(bill(170, 90), L(0, 0.0), x=330, y=230, dur=0.5)
	b.path(arrow(440, 230, 660, 230), L(0, 0.35), color='dim', dur=0.3)
	b.text(CX, 560, '= món tiền chưa tiêu', L(2, 0.5), size=84, sfx='chime')
	for k, v in enumerate(['50', '20', '7', '3,5']):
		b.utxo(570 + k * 260, 790, v + ' ADA', L(3, 0.1 + k * 0.15), w=200, h=100, size=46)


def s07(b, tm):
	L = tm.L
	b.utxo(CX - 200, 420, '50 ADA', L(0, 0.0), w=260, h=140, size=70)
	closed = b.path(lock(2.0), L(0, 0.45), x=CX + 150, y=400, dur=0.8)
	b.text(CX + 150, 560, 'ổ khoá', L(0, 0.7), size=44, color='dim')
	k = b.path(key(1.6), L(1, 0.0), x=1650, y=400, dur=0.6, color='cyan')
	k.move(L(1, 0.25), L(1, 0.65), -1390 + CX + 150 - 60, 30)
	closed.erase(L(1, 0.7), fade=0.15)
	b.path(lock(2.0, open_=True), L(1, 0.7), x=CX + 150, y=400, dur=0.15, color='green', sfx='click')
	b.text(1400, 610, 'chìa khoá tạo chữ ký', L(1, 0.5), size=48, color='cyan')
	b.path(signature(220), L(1, 0.75), x=1400, y=690, color='cyan', dur=0.5, width=4)
	b.clear(L(2, 0.0))
	b.text(CX, 300, 'Có tiền ≠ một con số trong sổ', L(2, 0.2), size=66)
	b.text(CX, 440, 'Có tiền = giữ chìa khoá', L(3, 0.2), size=76, color='cyan')
	b.path(wallet(300, 190), L(4, 0.0), x=CX - 120, y=730, dur=0.7)
	for j in range(3):
		b.path(key(0.9), L(4, 0.35 + j * 0.1), x=CX - 160, y=690 + j * 36, dur=0.3, color='cyan')
	b.text(CX + 260, 730, 'Ví giữ chìa,\nkhông giữ tiền', L(4, 0.5), size=48, anchor='lm')


def s08(b, tm):
	L = tm.L
	b.path(rect(320, 360, 16), L(0, 0.0), x=CX, y=460, dur=0.8)
	b.text(CX, 460, 'Giao dịch', L(0, 0.3), size=58)
	b.text(380, 210, 'Đầu vào', L(1, 0.0), size=52, color='dim')
	b.text(1540, 210, 'Đầu ra', L(2, 0.0), size=52, color='dim')
	ins = [('50 ADA', 360), ('20 ADA', 560)]
	for k, (v, y) in enumerate(ins):
		b.utxo(380, y, v, L(1, 0.15 + k * 0.15))
		b.path(arrow(470, y, 790, 400 + k * 80), L(1, 0.5 + k * 0.1), color='dim', dur=0.4)
	b.path(signature(120), L(1, 0.75), x=630, y=270, color='cyan', dur=0.4, width=4)
	b.text(630, 230, 'chữ ký', L(1, 0.8), size=32, color='cyan', dur=0.3)
	outs = [('40 ADA', 360, 'người nhận'), ('29,8 ADA', 560, 'tiền thối')]
	for k, (v, y, lab) in enumerate(outs):
		b.path(arrow(1130, 400 + k * 80, 1440, y), L(2, 0.2 + k * 0.2), color='dim', dur=0.4)
		b.utxo(1540, y, v, L(2, 0.3 + k * 0.2), locked=True)
		b.text(1540, y + 70, lab, L(2, 0.45 + k * 0.2), size=36, color='dim')
	b.utxo(380, 760, '+ …', L(3, 0.3), color='dim')
	b.utxo(1540, 760, '+ …', L(3, 0.6), color='dim')
	b.text(CX, 920, 'Vào = Ra + Phí', L(4, 0.1), size=76, color='yellow')
	b.text(CX, 990, '70 = 40 + 29,8 + 0,2', L(4, 0.55), size=40, color='dim')


def s09(b, tm):
	L = tm.L
	b.text(400, 180, 'Chưa tiêu', L(0, 0.0), size=52, color='dim')
	vals = ['50 ADA', '20 ADA', '7 ADA', '3,5 ADA']
	for k, v in enumerate(vals):
		b.utxo(400, 300 + k * 140, v, L(0, 0.05 + k * 0.06))
	b.strike(290, 300, 510, 300, L(0, 0.55), width=7)
	b.path(magnifier(1.6), L(1, 0.0), x=820, y=380, dur=0.5, color='cyan')
	b.text(820, 480, 'mạng lưới', L(1, 0.1), size=38, color='cyan')
	b.text(1180, 330, 'Còn trong danh sách?', L(1, 0.45), size=52, anchor='lm')
	b.path(check(1.3), L(1, 0.85), x=1120, y=330, color='green', sfx='tick')
	b.text(1180, 450, 'Mở được khoá?', L(2, 0.0), size=52, anchor='lm')
	b.path(check(1.3), L(2, 0.3), x=1120, y=450, color='green', sfx='tick')
	b.path(check(1.1), L(2, 0.5), x=1120, y=590, color='green', dur=0.3)
	b.text(1180, 590, 'cả hai → hợp lệ', L(2, 0.52), size=50, color='green', anchor='lm')
	b.path(cross(0.8), L(2, 0.78), x=1120, y=670, color='red', dur=0.3)
	b.text(1180, 670, 'thiếu một → từ chối', L(2, 0.8), size=50, color='red', anchor='lm')
	b.path(rect(470, 100, 12), L(3, 0.0), x=860, y=880, color='cyan')
	b.text(860, 880, 'bản sao giao dịch cũ', L(3, 0.1), size=38, color='cyan')
	b.path(arrow(700, 860, 520, 330), L(3, 0.35), color='cyan', dur=0.4)
	b.path(rect(300, 110, 10), L(3, 0.7), x=1350, y=880, color='red', width=6, sfx='thud')
	b.text(1350, 880, 'Từ chối', L(3, 0.72), size=64, color='red', rot=0, dur=0.25)


def s10(b, tm):
	L = tm.L
	b.text(200, 130, 'Bitcoin · 2009', L(0, 0.2), size=56, anchor='lm')
	b.text(1760, 140, 'mỗi máy giữ một danh sách', L(1, 0.4), size=40, color='dim', anchor='rm')
	for j, x in enumerate((1220, 1420, 1620)):
		b.path(monitor(0.7), L(1, 0.0 + j * 0.1), x=x, y=62, dur=0.4, color='cyan')
	spots = [(260, 300), (520, 260), (800, 330), (1080, 250), (1360, 320), (1640, 280), (330, 520), (620, 560),
		(930, 500), (1220, 560), (1520, 500), (1750, 600), (420, 760), (760, 790), (1100, 740), (1440, 800)]
	vals = [12, 3, 25, 8, 40, 1, 6, 30, 2, 15, 9, 4, 18, 5, 22, 7]
	mine = {2, 7, 9, 14}
	groups = []
	for k, ((x, y), v) in enumerate(zip(spots, vals)):
		groups.append(b.utxo(x, y, f'{v}', L(1, 0.05 + k * 0.035), w=120, h=70, size=36, sfx='tick' if k % 3 == 0 else None))
	for j, k in enumerate(sorted(mine)):
		x, y = spots[k]
		b.path(key(0.7), L(3, 0.1 + j * 0.12), x=x + 70, y=y - 50, color='cyan', dur=0.3)
	b.text(CX, 960, 'Số dư = 25 + 30 + 15 + 22 = 92 ADA', L(3, 0.6), size=58, color='cyan')
	b.clear(L(4, 0.0))
	for k in range(5):
		x = 260 + k * 350
		b.path(rect(200, 120, 14), L(4, 0.2 + k * 0.12), x=x, y=520, sfx='tick')
		b.text(x, 520, 'tx', L(4, 0.25 + k * 0.12), size=48, color='dim', dur=0.2)
		if k:
			b.path(arrow(x - 250, 520, x - 105, 520), L(4, 0.15 + k * 0.12), color='yellow', dur=0.25)


def s11(b, tm):
	L = tm.L
	b.text(CX, 170, 'eUTxO', L(1, 0.1), size=120, color='yellow')
	b.text(CX, 280, 'UTxO mở rộng', L(1, 0.6), size=52, color='dim')
	b.path(envelope(520, 330), L(2, 0.0), x=760, y=600, dur=0.9, color='yellow')
	b.path(ellipse(46), L(2, 0.35), x=620, y=620)
	b.text(620, 620, 'ADA', L(2, 0.4), size=30)
	b.path([[(-40, 30), (0, -38), (40, 30), (-40, 30)]], L(2, 0.55), x=760, y=630, color='cyan')
	b.path(rect(76, 76, 8), L(2, 0.65), x=890, y=630, color='green')
	b.text(760, 820, 'ADA + nhiều loại token', L(2, 0.75), size=44)
	b.path(lock(2.2), L(3, 0.0), x=1400, y=560, dur=0.7)
	b.path(gear(24), L(3, 0.25), x=1400, y=600, color='cyan', dur=0.5, sfx='gear')
	b.text(1400, 760, 'hợp đồng thông minh', L(3, 0.3), size=40, color='cyan')
	b.path(note(), L(3, 0.55), x=1620, y=470, color='chalk', dur=0.5)
	b.text(1620, 380, 'datum', L(3, 0.6), size=42)
	b.path(arrow(1560, 500, 1460, 540, head=16), L(3, 0.8), color='dim', dur=0.3)


def s12(b, tm):
	L = tm.L
	b.path(rect(560, 200, 16), L(0, 0.1), x=CX, y=330)
	b.text(CX, 280, 'Giao dịch', L(0, 0.3), size=48, color='dim')
	h1 = b.text(CX, 360, 'a1b2…f9', L(1, 0.3), size=72, mono=True, color='yellow')
	b.text(CX, 470, '64 ký tự', L(1, 0.6), size=40, color='dim')
	b.path(fingerprint(1.6), L(2, 0.0), x=1560, y=380, dur=0.9, color='cyan', width=4)
	b.text(1560, 520, 'dấu vân tay', L(2, 0.2), size=40, color='cyan')
	b.text(1460, 230, 'sửa 1 chữ', L(2, 0.3), size=44, color='red')
	b.strike(800, 360, 1120, 360, L(2, 0.55))
	h1.erase(L(2, 0.75))
	b.text(CX, 360, '7c0e…3d', L(2, 0.75), size=72, mono=True, color='red')
	b.clear(L(3, 0.0))
	b.path(rect(560, 200, 16), L(3, 0.05), x=CX, y=300, dur=0.4)
	b.text(CX, 300, 'a1b2…f9', L(3, 0.1), size=72, mono=True, color='yellow', dur=0.4)
	for k, x in enumerate((700, 1220)):
		b.path(arrow(CX + (k * 2 - 1) * 120, 400, x, 520), L(3, 0.35 + k * 0.15), color='dim', dur=0.3)
		b.utxo(x, 590, f'#{k}', L(3, 0.45 + k * 0.15), w=180, h=100, size=58)
	b.text(CX, 820, 'a1b2…f9#0', L(4, 0.45), size=96, mono=True, color='yellow', sfx='chime')


CODE = [
	('{', 0),
	('  "a1b2…f9#0": {', 1),
	('    "address": "addr_test1…",', 3),
	('    "value": { "lovelace": 50000000 },', 4),
	('    "datum": null,', 5),
	('    "inlineDatum": null,', 5),
	('    "referenceScript": null', 5),
	('  }', 5),
	('}', 5),
]


def s13(b, tm):
	L = tm.L
	b.text(150, 110, 'Cho lập trình viên', L(0, 0.0), size=46, color='cyan', anchor='lm')
	b.text(1770, 110, '@hydra-sdk/core', L(1, 0.4), size=36, color='dim', anchor='rm', mono=True)
	x0, y0, lh = 170, 230, 66
	rows = []
	for i, (src, li) in enumerate(CODE):
		f = 0.1 if li else 0.5
		f += 0.12 * sum(1 for _, l in CODE[:i] if l == li)
		color = 'dim' if 'null' in src or src.strip() in '{}' else 'chalk'
		rows.append(b.text(x0, y0 + i * lh, src, L(max(li, 1) if li == 0 else li, min(f, 0.85)), size=40, mono=True, anchor='lm', color=color))
	b.path(ellipse(260, 42), L(2, 0.2), x=x0 + 300, y=y0 + lh, color='yellow', dur=0.6)
	b.text(1180, y0 + lh, 'mã giao dịch # số thứ tự', L(2, 0.5), size=42, color='yellow', anchor='lm')
	b.path(lock(0.9), L(3, 0.4), x=1140, y=y0 + 2 * lh, color='cyan', dur=0.4)
	b.text(1190, y0 + 2 * lh, 'ổ khoá', L(3, 0.5), size=42, color='cyan', anchor='lm')
	b.path(line(0, 0, 640, 0), L(4, 0.0), x=x0 + 120, y=y0 + 3 * lh + 30, color='yellow')
	b.text(1450, 860, '1 ADA = 1.000.000 lovelace', L(4, 0.3), size=48, color='yellow')
	b.text(1450, 930, 'token: { mã chính sách: { tên: số lượng } }', L(4, 0.75), size=34, color='dim')
	b.text(1180, y0 + 5 * lh, '← dành cho hợp đồng thông minh', L(5, 0.2), size=40, color='dim', anchor='lm')
	b.text(150, 960, 'UTxOObject', L(6, 0.5), size=84, mono=True, color='yellow', anchor='lm', sfx='chime')


def s14(b, tm):
	L = tm.L
	b.text(480, 200, 'Trước', L(1, 0.0), size=60, color='dim')
	b.text(1380, 200, 'Sau', L(2, 0.0), size=60, color='dim')
	b.path(line(0, 260, 0, 860), L(0, 0.3), x=880, y=0, color='dim', width=3)
	b.text(150, 360, '"a1b2…f9#0":', L(1, 0.3), size=38, mono=True, anchor='lm')
	b.text(190, 430, '50 ADA', L(1, 0.65), size=58, color='yellow', anchor='lm')
	b.strike(140, 395, 800, 395, L(2, 0.25), width=7)
	b.text(980, 360, '"c3d4…7a#0":', L(2, 0.6), size=38, mono=True, anchor='lm')
	b.text(1020, 430, '30 ADA', L(3, 0.1), size=58, color='yellow', anchor='lm')
	b.text(1300, 430, '→ người bán', L(3, 0.3), size=44, anchor='lm')
	b.text(980, 560, '"c3d4…7a#1":', L(2, 0.8), size=38, mono=True, anchor='lm')
	b.text(1020, 630, '19,83 ADA', L(3, 0.6), size=58, color='yellow', anchor='lm')
	b.text(1340, 630, '→ ví bạn', L(3, 0.8), size=44, anchor='lm')
	b.text(1020, 760, 'phí: 0,17 ADA', L(4, 0.5), size=48, color='dim', anchor='lm')
	b.text(CX, 980, 'số liệu minh hoạ', L(4, 0.8), size=34, color='dim')


def s15(b, tm):
	L = tm.L
	b.text(CX, 150, 'Trả 30 ADA', L(1, 0.05), size=72, color='cyan')
	pile = [(12, 280, 420), (8, 470, 360), (5, 330, 600), (20, 520, 560), (3, 260, 780), (9, 470, 760)]
	gs = {}
	for k, (v, x, y) in enumerate(pile):
		gs[v] = b.utxo(x, y, str(v), L(0, 0.1 + k * 0.08), w=150, h=86, size=42)
	gs[20].move(L(1, 0.3), L(1, 0.45), 1000 - 520, 420 - 560)
	gs[12].move(L(1, 0.35), L(1, 0.5), 1000 - 280, 560 - 420)
	b.text(1000, 680, '20 + 12 = 32', L(1, 0.5), size=44, color='dim')
	b.path(arrow(1110, 490, 1320, 450), L(1, 0.55), color='dim', dur=0.3)
	b.utxo(1450, 400, '30', L(1, 0.58), w=150, h=86, size=42, locked=True)
	b.utxo(1450, 560, '1,83', L(1, 0.68), w=150, h=86, size=42, locked=True)
	b.text(1450, 640, 'tiền thối', L(1, 0.75), size=34, color='dim', dur=0.3)
	b.text(1450, 720, 'phí 0,17', L(1, 0.82), size=34, color='dim', dur=0.3)
	b.clear(L(2, 0.0))
	b.text(CX, 230, 'Ví · bộ dựng giao dịch', L(2, 0.2), size=66)
	b.path(rect(330, 130, 14), L(3, 0.0), x=CX, y=560, color='cyan')
	b.text(CX, 560, 'TxBuilder', L(3, 0.1), size=56, mono=True, color='cyan')
	b.path(gear(30), L(3, 0.2), x=CX + 200, y=480, dur=0.5, color='cyan', sfx='gear')
	b.path(wallet(200, 130), L(2, 0.0), x=CX - 620, y=230, dur=0.6, color='dim')
	b.text(CX, 660, '@hydra-sdk/transaction', L(3, 0.2), size=32, mono=True, color='dim')
	b.text(330, 500, 'danh sách món tiền', L(3, 0.25), size=40, color='yellow')
	b.text(330, 620, 'địa chỉ tiền thối', L(3, 0.45), size=40)
	b.path(arrow(500, 540, 780, 560), L(3, 0.35), color='dim', dur=0.3)
	b.path(arrow(1140, 560, 1380, 560), L(3, 0.7), color='dim', dur=0.3)
	b.text(1610, 520, 'chọn món', L(3, 0.75), size=44, color='green')
	b.text(1610, 600, 'tính tiền thối', L(3, 0.85), size=44, color='green', sfx='chime')


def s16(b, tm):
	L = tm.L
	b.text(CX, 90, 'Vì sao quan trọng?', L(0, 0.0), size=56, color='dim')
	b.path(line(-760, 0, 760, 0), L(1, 0.0), x=CX, y=760, dur=0.9)
	b.text(260, 830, 'Cardano · lớp 1', L(1, 0.2), size=48, anchor='lm')
	b.path(ellipse(440, 220), L(1, 0.4), x=CX, y=440, color='cyan', dur=1.0)
	b.text(CX, 180, 'Hydra Head · lớp 2', L(1, 0.65), size=48, color='cyan')
	b.text(1660, 830, 'cùng mô hình UTxO', L(1, 0.85), size=40, color='dim', anchor='rm')
	for j, x in enumerate((240, 330, 420)):
		b.path(person(0.8), L(2, 0.0 + j * 0.08), x=x, y=430, dur=0.5, color='cyan')
	b.text(330, 540, 'một nhóm người', L(2, 0.2), size=36, color='cyan')
	moved = []
	for k, (x, v) in enumerate(((620, '20'), (960, '15'), (1300, '8'))):
		g = b.utxo(x, 900, v, L(2, 0.05 + k * 0.1), w=140, h=80, size=40)
		g.move(L(2, 0.4 + k * 0.08), L(2, 0.85 + k * 0.08), (CX - 220 + k * 220) - x, 440 - 900)
		moved.append(g)
	for g in moved:
		g.erase(L(3, 0.2), fade=0.6)
	for k, (x, v) in enumerate(((CX - 270, '12'), (CX - 90, '8'), (CX + 90, '10'), (CX + 270, '13'))):
		b.utxo(x, 440, v, L(3, 0.35 + k * 0.12), w=130, h=76, size=36)
	b.text(CX, 960, 'Tập sau: Hydra là gì?', L(4, 0.55), size=58, color='yellow')


def s17(b, tm):
	L = tm.L
	b.text(CX, 170, 'Tóm lại', L(0, 0.0), size=64, color='dim')
	pts = ['1. Không có ô số dư, chỉ có UTxO', '2. Tiêu trọn món cũ, sinh món mới', '3. txHash#index → UTxO Object']
	for k, s in enumerate(pts):
		b.text(330, 340 + k * 150, s, L(k + 1, 0.05), size=62, anchor='lm', color='yellow' if k == 2 else 'chalk', sfx='chime')
	b.clear(L(4, 0.0))
	b.text(CX, 480, 'hydrasdk.com', L(4, 0.15), size=120, color='yellow')
	b.path(line(-380, 0, 380, 0), L(4, 0.6), x=CX, y=570, color='yellow')
	b.text(1840, 1010, 'Thực hiện cùng VTechcom Labs', tm.E(4, 0.3), size=34, color='dim', anchor='rm')


SCENES = {f'{i:02d}': globals()[f's{i:02d}'] for i in range(1, 18)}

# Nhịp hình khi một câu đọc gộp hai ý: (câu, từ phần, đến phần)
BEATS = {
	'01': [(0, 0, 1), (1, 0, 1), (2, 0, 0.45), (2, 0.45, 1)],
	'03': [(0, 0, 0.5), (0, 0.5, 1), (1, 0, 1), (2, 0, 1), (3, 0, 1)],
	'13': [(0, 0, 0.25), (0, 0.25, 1), (1, 0, 1), (2, 0, 1), (3, 0, 1), (4, 0, 1), (5, 0, 1)],
	'16': [(0, 0, 0.25), (0, 0.25, 1), (1, 0, 1), (2, 0, 1), (3, 0, 1)],
}
