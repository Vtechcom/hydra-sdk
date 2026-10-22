"""Vẽ phấn trên bảng đen: mọi phần tử là hàm thuần của t (giây tính từ đầu cảnh).

Khung 1920×1080, 25 fps. Phần tử vẽ dần (nét chạy theo đường, chữ hiện từ trái sang),
có thể di chuyển, và được lau đi (mờ dần). Âm thanh hiệu ứng lấy từ chính các mốc này.
"""
import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1920, 1080, 25
FONTS = Path(__file__).resolve().parent / 'fonts'

COL = {
	'chalk': (236, 234, 224),
	'dim': (128, 128, 122),
	'yellow': (244, 207, 102),
	'red': (236, 120, 104),
	'cyan': (124, 198, 232),
	'green': (150, 212, 134),
}
BG = (21, 23, 22)

_fonts = {}


def font(size, mono=False):
	key = (size, mono)
	if key not in _fonts:
		f = 'JetBrainsMono-VF.ttf' if mono else 'Mali-Medium.ttf'
		_fonts[key] = ImageFont.truetype(str(FONTS / f), size)
	return _fonts[key]


def clamp01(x):
	return 0.0 if x < 0 else 1.0 if x > 1 else x


def ease(x):
	x = clamp01(x)
	return x * x * (3 - 2 * x)


def _out_cubic(x):
	return 1 - (1 - x) ** 3


def _in_out_expo(x):
	if x <= 0 or x >= 1:
		return x
	return 2 ** (20 * x - 10) / 2 if x < 0.5 else (2 - 2 ** (-20 * x + 10)) / 2


def _out_back(x, k=1.7):
	return 1 + (k + 1) * (x - 1) ** 3 + k * (x - 1) ** 2


def _spring(x):
	"""Lò xo tắt dần: vượt đích một chút rồi lắc về."""
	return 1 - math.exp(-6.5 * x) * math.cos(10.5 * x)


EASES = {'smooth': ease, 'linear': lambda x: x, 'out': _out_cubic, 'expo': _in_out_expo, 'back': _out_back, 'spring': _spring}


def eased(x, kind='smooth'):
	x = clamp01(x)
	return 1.0 if x >= 1 and kind != 'spring' else EASES[kind](x)


class Timing:
	"""Mốc thời gian của một cảnh, tính từ độ dài thật của từng clip giọng."""

	def __init__(self, durs, lead=0.8, gap=0.45, tail=1.4, beats=None):
		self.durs = list(durs)
		self.starts = []
		t = lead
		for d in self.durs:
			self.starts.append(t)
			t += d + gap
		self.total = t - gap + tail
		# beats: nhịp hình → (câu, từ phần, đến phần). Khi gộp hai câu đọc thành một,
		# cảnh vẫn neo theo nhịp cũ, mỗi nhịp là một đoạn của câu mới.
		self.beats = beats or [(i, 0.0, 1.0) for i in range(len(self.durs))]

	def L(self, i, f=0.0):
		line, a, b = self.beats[i]
		return self.starts[line] + (a + f * (b - a)) * self.durs[line]

	def E(self, i, extra=0.0):
		line, _, b = self.beats[i]
		return self.starts[line] + b * self.durs[line] + extra


# ---------------------------------------------------------------- phần tử


class El:
	def __init__(self, at=0.0, dur=0.6, color='chalk', parent=None, x=0, y=0, sfx=None, fade=0.45, hud=False):
		self.hud = hud  # True: vẽ trên lớp HUD, không chịu camera (chỉ xét ở phần tử gốc)
		self.at, self.dur = at, dur
		self.color = COL[color] if isinstance(color, str) else color
		self.parent, self.x, self.y = parent, x, y
		self.moves = []
		self.out = None
		self.fade = fade
		self.sfx = sfx
		self.children = []
		self.scales = []  # (t0, t1, s0, s1, kiểu easing)
		self.dims = []  # (t0, t1, mức sáng khi bị làm mờ)
		if parent is not None:
			parent.children.append(self)

	def move(self, t0, t1, dx, dy, kind='smooth'):
		self.moves.append((t0, t1, dx, dy, kind))
		return self

	def scale(self, t0, t1, s0, s1, kind='smooth'):
		self.scales.append((t0, t1, s0, s1, kind))
		return self

	def pop(self, at=None, dur=0.55, start=0.4):
		"""Bật ra từ nhỏ, vượt đích một chút rồi về đúng cỡ."""
		at = self.at if at is None else at
		return self.scale(at, at + dur, start, 1.0, 'back')

	def dim(self, t0, t1, level=0.3):
		self.dims.append((t0, t1, level))
		return self

	def root(self):
		return self.parent.root() if self.parent is not None else self

	def start(self):
		"""Lúc phần tử bắt đầu hiện; Group (at = 0) lấy theo phần tử con hiện sớm nhất."""
		if isinstance(self, Group) and self.children:
			return min(c.start() for c in self.children)
		return self.at

	def scale_at(self, t):
		# Trước đoạn đầu tiên giữ cỡ khởi đầu; giữa hai đoạn giữ cỡ cuối của đoạn trước.
		s = self.scales[0][2] if self.scales else 1.0
		for t0, t1, s0, s1, kind in self.scales:
			if t < t0:
				break
			s = s0 + (s1 - s0) * eased((t - t0) / max(t1 - t0, 1e-6), kind)
		return s * (self.parent.scale_at(t) if self.parent else 1.0)

	def _dim_at(self, t, ramp=0.4):
		f = 1.0
		for t0, t1, level in self.dims:
			u = min(clamp01((t - t0) / ramp), 1 - clamp01((t - t1) / ramp))
			f = min(f, 1 - (1 - level) * ease(u))
		return f

	def erase(self, t, fade=None):
		self.out = t
		if fade is not None:
			self.fade = fade
		for c in self.children:
			if c.out is None or c.out > t:
				c.erase(t, fade)
		return self

	def progress(self, t):
		if t < self.at:
			return 0.0
		return 1.0 if self.dur <= 0 else clamp01((t - self.at) / self.dur)

	def alpha(self, t):
		a = 1.0 if self.out is None else 1.0 - clamp01((t - self.out) / self.fade)
		if self.dims:
			a *= self._dim_at(t)
		return a * (self.parent.alpha(t) if self.parent else 1.0)

	def origin(self, t):
		x, y = self.x, self.y
		for t0, t1, dx, dy, kind in self.moves:
			e = eased((t - t0) / max(t1 - t0, 1e-6), kind)
			x += dx * e
			y += dy * e
		if self.parent is not None:
			px, py = self.parent.origin(t)
			s = self.parent.scale_at(t)
			x, y = px + x * s, py + y * s
		return x, y

	def tint(self, a):
		return tuple(int(c * a) for c in self.color)

	def render(self, draw, layer, t):
		pass


class Group(El):
	def __init__(self, x=0, y=0, parent=None):
		super().__init__(at=0, dur=0, parent=parent, x=x, y=y)


def _wobble(poly, seed, amp=1.6, step=14):
	"""Chia nhỏ đường và lệch nhẹ vuông góc theo sóng mượt — nét như vẽ tay."""
	rnd = random.Random(seed)
	ph = [rnd.uniform(0, 6.28) for _ in range(3)]
	out = []
	for (x0, y0), (x1, y1) in zip(poly, poly[1:]):
		L = math.hypot(x1 - x0, y1 - y0)
		n = max(1, int(L / step))
		nx, ny = (-(y1 - y0) / L, (x1 - x0) / L) if L else (0, 0)
		for k in range(n):
			u = k / n
			s = len(out) * 0.21
			off = amp * (math.sin(s + ph[0]) * 0.6 + math.sin(s * 2.3 + ph[1]) * 0.3 + math.sin(s * 5.1 + ph[2]) * 0.1)
			out.append((x0 + (x1 - x0) * u + nx * off, y0 + (y1 - y0) * u + ny * off))
	out.append(poly[-1])
	return out


class Path(El):
	def __init__(self, polys, width=5, wobble=True, glow=False, fill=None, fill_level=0.22, **kw):
		super().__init__(**kw)
		self.width = width
		self.glow = glow
		self.fill_level = fill_level
		self.fill = COL[fill] if isinstance(fill, str) else fill
		seed = hash(tuple(tuple(map(lambda p: (round(p[0]), round(p[1])), q)) for q in polys)) & 0xFFFF
		self.polys = [_wobble(q, seed + i) if wobble and len(q) > 1 else q for i, q in enumerate(polys)]
		self.lens = []
		for q in self.polys:
			seg = [math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(q, q[1:])]
			self.lens.append(seg)
		self.total = sum(sum(s) for s in self.lens) or 1.0

	def render(self, draw, layer, t):
		p, a = self.progress(t), self.alpha(t)
		if p <= 0 or a <= 0:
			return
		ox, oy = self.origin(t)
		s = self.scale_at(t)
		if s <= 0.01:
			return
		left = p * self.total
		col = self.tint(a)
		width = max(1, round(self.width * min(s, 1.6)))
		if self.fill is not None and p >= 1:
			fc = tuple(int(c * a * self.fill_level) for c in self.fill)
			for q in self.polys:
				if len(q) > 2:
					draw.polygon([(x * s + ox, y * s + oy) for x, y in q], fill=fc)
		strokes = []
		for q, seg in zip(self.polys, self.lens):
			if left <= 0:
				break
			pts = [(q[0][0] * s + ox, q[0][1] * s + oy)]
			for (b, L) in zip(q[1:], seg):
				bx, by = b[0] * s + ox, b[1] * s + oy
				if left >= L:
					pts.append((bx, by))
					left -= L
				else:
					a0 = pts[-1]
					u = left / L if L else 1
					pts.append((a0[0] + (bx - a0[0]) * u, a0[1] + (by - a0[1]) * u))
					left = 0
					break
			if len(pts) > 1:
				strokes.append(pts)
		if self.glow:
			gc = tuple(int(c * a * 0.28) for c in self.color)
			for pts in strokes:
				draw.line(pts, fill=gc, width=width * 4, joint='curve')
		for pts in strokes:
			draw.line(pts, fill=col, width=width, joint='curve')


class Text(El):
	def __init__(self, s, size=56, anchor='mm', mono=False, rot=0, spacing=1.3, **kw):
		if 'dur' not in kw:
			kw['dur'] = max(0.35, min(2.2, len(s) * 0.045))
		super().__init__(**kw)
		f = font(size, mono)
		self.lines = []
		for line in s.split('\n'):
			l, top, r, b = f.getbbox(line or ' ')
			pad = 6
			m = Image.new('L', (r - l + 2 * pad, int(size * 1.45)), 0)
			ImageDraw.Draw(m).text((pad - l, int(size * 0.2)), line, font=f, fill=255)
			if rot:
				m = m.rotate(rot, resample=Image.BICUBIC, expand=True)
			self.lines.append(m)
		lh = int(size * spacing)
		self.bw = max(m.width for m in self.lines)
		self.bh = lh * (len(self.lines) - 1) + self.lines[-1].height
		self.lh = lh
		self.anchor = anchor
		self.widths = [m.width for m in self.lines]
		self.total = sum(self.widths)

	def render(self, draw, layer, t):
		p, a = self.progress(t), self.alpha(t)
		if p <= 0 or a <= 0:
			return
		ox, oy = self.origin(t)
		s = self.scale_at(t)
		if s <= 0.02:
			return
		h, v = self.anchor[0], self.anchor[1]
		bw, bh, lh = self.bw * s, self.bh * s, self.lh * s
		bx = ox - (bw / 2 if h == 'm' else bw if h == 'r' else 0)
		by = oy - (bh / 2 if v == 'm' else bh if v == 'b' else 0)
		left = p * self.total
		col = self.tint(a)
		for i, m in enumerate(self.lines):
			if left <= 0:
				break
			w = int(min(m.width, left))
			left -= m.width
			mask = m if w >= m.width else m.crop((0, 0, w, m.height))
			if abs(s - 1) > 0.01:
				mask = mask.resize((max(1, round(mask.width * s)), max(1, round(mask.height * s))), Image.BILINEAR)
			mw = m.width * s
			lx = bx + (bw - mw) / 2 if h == 'm' else bx + (bw - mw if h == 'r' else 0)
			x, y = int(lx), int(by + i * lh)
			layer.paste(col, (x, y, x + mask.width, y + mask.height), mask)


class Packet(El):
	"""Chấm sáng chạy dọc một đường gấp khúc, kéo theo vệt mờ — dòng dữ liệu đi giữa hai bên."""

	def __init__(self, pts, r=11, trail=0.22, kind='expo', keep=False, label=None, size=26, **kw):
		super().__init__(**kw)
		self.pts, self.r, self.trail, self.kind, self.keep = pts, r, trail, kind, keep
		self.seg = [math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:])]
		self.total = sum(self.seg) or 1.0
		self.label = Text(label, size=size, dur=0, color=self.color) if label else None

	def point(self, u):
		left = clamp01(u) * self.total
		for (a, b), L in zip(zip(self.pts, self.pts[1:]), self.seg):
			if left <= L:
				k = left / L if L else 0
				return a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k
			left -= L
		return self.pts[-1]

	def render(self, draw, layer, t):
		if t < self.at:
			return
		raw = self.progress(t)
		if raw >= 1 and not self.keep:
			return
		a = self.alpha(t)
		if a <= 0:
			return
		ox, oy = self.origin(t)
		u = eased(raw, self.kind)
		for k in range(6, 0, -1):  # vệt: chấm nhỏ dần phía sau
			uu = u - self.trail * k / 6
			if uu <= 0:
				continue
			x, y = self.point(uu)
			rr = self.r * (1 - k / 7)
			draw.ellipse((x + ox - rr, y + oy - rr, x + ox + rr, y + oy + rr), fill=self.tint(a * (1 - k / 7) * 0.5))
		x, y = self.point(u)
		r = self.r
		draw.ellipse((x + ox - r * 1.9, y + oy - r * 1.9, x + ox + r * 1.9, y + oy + r * 1.9), fill=self.tint(a * 0.25))
		draw.ellipse((x + ox - r, y + oy - r, x + ox + r, y + oy + r), fill=self.tint(a))
		if self.label:
			self.label.x, self.label.y = x + ox, y + oy - r - 26
			self.label.color = self.tint(a)
			self.label.render(draw, layer, max(t, self.label.at + 1))


class Counter(El):
	"""Số đếm từ v0 tới v1 trong khoảng [at, at + dur]; fmt quyết định cách viết."""

	def __init__(self, v0, v1, fmt='{:.0f}', size=64, anchor='mm', mono=False, kind='out', **kw):
		super().__init__(**kw)
		self.v0, self.v1, self.fmt, self.kind = v0, v1, fmt, kind
		self.f = font(size, mono)
		self.anchor = anchor

	def value(self, t):
		return self.v0 + (self.v1 - self.v0) * eased(self.progress(t), self.kind)

	def render(self, draw, layer, t):
		if t < self.at:
			return
		a = self.alpha(t)
		if a <= 0:
			return
		ox, oy = self.origin(t)
		v = self.value(t)
		s = self.fmt(v) if callable(self.fmt) else self.fmt.format(v)
		draw.text((ox, oy), s, font=self.f, fill=self.tint(a), anchor=self.anchor)


# ---------------------------------------------------------------- hình mẫu (toạ độ tương đối quanh 0,0)


def rect(w, h, r=0):
	x0, y0, x1, y1 = -w / 2, -h / 2, w / 2, h / 2
	if not r:
		return [[(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0 - 2)]]
	pts = []
	for cx, cy, a0 in ((x1 - r, y0 + r, -90), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90), (x0 + r, y0 + r, 180)):
		for k in range(7):
			a = math.radians(a0 + k * 15)
			pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
	return [pts + [pts[0]]]


def ellipse(rx, ry=None, start=-90, sweep=360, n=48, cx=0, cy=0):
	ry = ry or rx
	return [[(cx + rx * math.cos(math.radians(start + sweep * k / n)), cy + ry * math.sin(math.radians(start + sweep * k / n))) for k in range(n + 1)]]


def line(x0, y0, x1, y1):
	return [[(x0, y0), (x1, y1)]]


def arrow(x0, y0, x1, y1, head=22):
	a = math.atan2(y1 - y0, x1 - x0)
	l = (x1 - head * math.cos(a - 0.45), y1 - head * math.sin(a - 0.45))
	r = (x1 - head * math.cos(a + 0.45), y1 - head * math.sin(a + 0.45))
	return [[(x0, y0), (x1, y1)], [l, (x1, y1), r]]


def lock(s=1.0, open_=False):
	body = [[(x * s, y * s) for x, y in q] for q in rect(52, 42, 6)]
	for q in body:
		for i, (x, y) in enumerate(q):
			q[i] = (x, y + 14 * s)
	lift = -14 * s if open_ else 0
	shackle = [(x, y + lift) for x, y in ellipse(16 * s, 18 * s, start=180, sweep=180, n=16, cy=-6 * s)[0]]
	shackle = [(-16 * s, -6 * s + 12 * s)] + shackle + [(16 * s, -6 * s + lift + (0 if open_ else 12 * s))]
	return body + [shackle]


def key(s=1.0):
	ring = ellipse(14 * s, cx=-30 * s)[0]
	shaft = [(-16 * s, 0), (34 * s, 0)]
	teeth = [(18 * s, 0), (18 * s, 10 * s)], [(28 * s, 0), (28 * s, 12 * s)]
	return [ring, shaft, *teeth]


def wallet(w=260, h=170):
	body = rect(w, h, 18)
	flap = [(w / 2 - 70, -h / 2 + 50), (w / 2 + 8, -h / 2 + 50), (w / 2 + 8, h / 2 - 50), (w / 2 - 70, h / 2 - 50), (w / 2 - 70, -h / 2 + 50)]
	return body + [flap] + ellipse(9, cx=w / 2 - 40)


def cup(s=1.0):
	body = [(-50 * s, -40 * s), (-38 * s, 60 * s), (38 * s, 60 * s), (50 * s, -40 * s), (-50 * s, -40 * s)]
	handle = ellipse(22 * s, 26 * s, start=-80, sweep=170, n=14, cx=50 * s, cy=4 * s)[0]
	steam = [[(x * s + dx, (-60 - k * 9) * s) for k, x in enumerate([0, 6, 0, -6, 0, 6, 0])] for dx in (-18 * s, 0, 18 * s)]
	return [body, handle] + steam


def envelope(w=360, h=230):
	x0, y0 = -w / 2, -h / 2
	return rect(w, h, 8) + [[(x0 + 4, y0 + 6), (0, 20), (-x0 - 4, y0 + 6)]]


def check(s=1.0):
	return [[(-18 * s, 0), (-5 * s, 14 * s), (20 * s, -18 * s)]]


def cross(s=1.0):
	return [[(-18 * s, -18 * s), (18 * s, 18 * s)], [(18 * s, -18 * s), (-18 * s, 18 * s)]]


def gear(r=26, teeth=8):
	pts = []
	for k in range(teeth * 4 + 1):
		a = 2 * math.pi * k / (teeth * 4)
		rr = r + (7 if (k % 4) in (1, 2) else 0)
		pts.append((rr * math.cos(a), rr * math.sin(a)))
	return [pts] + ellipse(r * 0.38)


def person(s=1.0):
	"""Người que: đầu, thân, tay, chân."""
	head = ellipse(18 * s, cy=-62 * s)[0]
	return [head, [(0, -44 * s), (0, 10 * s)], [(-26 * s, -22 * s), (0, -32 * s), (26 * s, -22 * s)],
		[(-20 * s, 52 * s), (0, 10 * s), (20 * s, 52 * s)]]


def bank(s=1.0):
	roof = [(-80 * s, -40 * s), (0, -85 * s), (80 * s, -40 * s), (-80 * s, -40 * s)]
	base = [(-90 * s, 60 * s), (90 * s, 60 * s)]
	cols = [[(x * s, -30 * s), (x * s, 50 * s)] for x in (-55, -20, 20, 55)]
	return [roof, base, [(-80 * s, -30 * s), (80 * s, -30 * s)]] + cols


def monitor(s=1.0):
	return rect(110 * s, 74 * s, 6 * s) + [[(0, 37 * s), (0, 55 * s)], [(-30 * s, 55 * s), (30 * s, 55 * s)]]


def magnifier(s=1.0):
	return ellipse(26 * s, cx=-8 * s, cy=-8 * s) + [[(12 * s, 12 * s), (40 * s, 40 * s)]]


def eye(s=1.0):
	top = [(x * s, -22 * s * math.cos(x / 50 * math.pi / 2)) for x in range(-50, 51, 5)]
	bot = [(x * s, 22 * s * math.cos(x / 50 * math.pi / 2)) for x in range(-50, 51, 5)]
	return [top, bot] + ellipse(12 * s)


def fingerprint(s=1.0):
	arcs = []
	for k in range(5):
		r = (12 + k * 11) * s
		arcs += ellipse(r * 0.8, r, start=200 - k * 4, sweep=300 + k * 8, n=24)
	return arcs


def bill(w=150, h=80):
	return rect(w, h, 6) + ellipse(h * 0.24, cx=w * 0.3) + [line(-w / 2 + 14, -h / 2 + 14, -w / 2 + 34, -h / 2 + 14)[0]]


def signature(w=160):
	return [[(-w / 2 + k * w / 30, 12 * math.sin(k * 1.3) * (1 - k / 40)) for k in range(31)]]


def network(n=6, r=170):
	"""Các máy nối với nhau thành mạng: vòng nút và đường nối."""
	pts = [(r * math.cos(2 * math.pi * k / n - math.pi / 2), r * 0.6 * math.sin(2 * math.pi * k / n - math.pi / 2)) for k in range(n)]
	lines = [[pts[i], pts[j]] for i in range(n) for j in range(i + 1, n) if (j - i) in (1, 2, n - 1)]
	nodes = [ellipse(16, cx=x, cy=y)[0] for x, y in pts]
	return lines + nodes


def note(w=110, h=80):
	return rect(w, h, 4) + [line(-w / 2 + 16, -h / 2 + 22 + 16 * k, w / 2 - 16, -h / 2 + 22 + 16 * k)[0] for k in range(3)]


# ---------------------------------------------------------------- bảng


class Board:
	def __init__(self):
		self.els = []
		self.cams = []  # (t0, t1, zoom, cx, cy, kiểu easing)
		self.shakes = []  # (t0, dur, biên độ px)
		self.whooshes = []  # mốc tiếng gió cho camera và chuyển cảnh
		self.wipes = []  # (bắt đầu, kết thúc) của mỗi vệt lau

	# ------------------------------------------------ camera

	def cam(self, t0, t1, zoom=1.0, cx=W / 2, cy=H / 2, kind='expo', sfx=True):
		"""Đẩy camera tới (zoom, tâm cx, cy) trong [t0, t1]; nối tiếp từ trạng thái trước."""
		self.cams.append((t0, t1, zoom, cx, cy, kind))
		self.cams.sort()
		if sfx:
			self.whooshes.append(t0)
		return self

	def cam_reset(self, t0, t1, kind='expo', sfx=True):
		return self.cam(t0, t1, 1.0, W / 2, H / 2, kind, sfx)

	def shake(self, t0, dur=0.45, amp=9):
		self.shakes.append((t0, dur, amp))
		return self

	def camera(self, t):
		z, cx, cy = 1.0, W / 2, H / 2
		for t0, t1, z1, cx1, cy1, kind in self.cams:
			if t < t0:
				break
			e = eased((t - t0) / max(t1 - t0, 1e-6), kind)
			# nội suy zoom theo log để đẩy và kéo đều nhau
			z = math.exp(math.log(z) + (math.log(z1) - math.log(z)) * e)
			cx, cy = cx + (cx1 - cx) * e, cy + (cy1 - cy) * e
		if z > 1:  # giữ khung nhìn trong bảng, không lộ phần trống ngoài mép
			hw, hh = W / (2 * z), H / (2 * z)
			cx, cy = min(max(cx, hw), W - hw), min(max(cy, hh), H - hh)
		dx = dy = 0.0
		for t0, dur, amp in self.shakes:
			if t0 <= t < t0 + dur:
				k = 1 - (t - t0) / dur
				dx += amp * k * math.sin(t * 83.0)
				dy += amp * k * math.cos(t * 71.0)
		return z, cx + dx, cy + dy

	# ------------------------------------------------ nhấn mạnh

	def focus(self, t0, t1, keep, level=0.28):
		"""Làm mờ mọi phần tử gốc đang hiện, trừ các phần tử trong keep."""
		keep = set(map(id, keep))
		for e in self.els:
			if e.parent is None and id(e) not in keep and e.start() <= t0 and (e.out is None or e.out > t0):
				e.dim(t0, t1, level)
		return self

	def ring(self, x, y, rx, ry, at, color='yellow', dur=0.55, width=5, **kw):
		"""Vòng phấn khoanh quanh một chỗ: vẽ hơn một vòng, hơi lệch như khoanh tay."""
		pts = [((rx + 8 * k / 60) * math.cos(math.radians(-150 + 400 * k / 60)),
			(ry + 6 * k / 60) * math.sin(math.radians(-150 + 400 * k / 60))) for k in range(61)]
		return self.path([pts], at, x=x, y=y, dur=dur, color=color, width=width, sfx='strike', **kw)

	def ripple(self, x, y, at, r=40, color='cyan', grow=2.6, dur=0.9, n=2, gap=0.22, width=4, parent=None):
		"""Gợn sóng toả ra rồi tan: báo một sự kiện (ký, đóng băng, phạt)."""
		for k in range(n):
			t = at + k * gap
			p = self.path(ellipse(r), t, x=x, y=y, dur=0, color=color, width=width, wobble=False, parent=parent)
			p.scale(t, t + dur, 1.0, grow, 'out')
			p.erase(t + dur * 0.15, fade=dur * 0.85)
		return self

	def packet(self, pts, at, dur=0.9, color='cyan', sfx='click', **kw):
		return self.add(Packet(pts, at=at, dur=dur, color=color, sfx=sfx, **kw))

	def counter(self, x, y, v0, v1, at, dur=1.2, **kw):
		return self.add(Counter(v0, v1, at=at, dur=dur, x=x, y=y, **kw))

	def stagger(self, items, at, step=0.08, pop=True):
		"""Cho một nhóm phần tử hiện so le: mỗi phần tử trễ hơn phần tử trước `step` giây."""
		for k, e in enumerate(items):
			t = at + k * step
			dt = t - e.start()
			for d in [e] + self._descendants(e):
				if not isinstance(d, Group):
					d.at += dt
			if pop:
				e.scales = []
				e.pop(t)
		return items

	def _descendants(self, e):
		out = []
		for c in e.children:
			out += [c] + self._descendants(c)
		return out

	# ------------------------------------------------ chuyển cảnh

	def wipe(self, t, dur=0.8, direction=1, fade=0.35, lift=-18):
		"""Lau bảng theo vệt ngang: phần tử bên trái (hoặc phải) tan trước, hơi trôi lên."""
		self.whooshes.append(t)
		self.wipes.append((t, t + dur))
		for e in self.els:
			if e.parent is None and e.start() <= t and (e.out is None or e.out > t):
				x = self._anchor_x(e, t)
				u = clamp01(x / W) if direction > 0 else 1 - clamp01(x / W)
				te = t + dur * u
				e.erase(te, fade)
				e.move(te, te + fade, 0, lift, 'out')
		return self

	def _anchor_x(self, e, t):
		if e.children:
			xs = [self._anchor_x(c, t) for c in e.children]
			return sum(xs) / len(xs)
		ox, _ = e.origin(t)
		if isinstance(e, Path):
			xs = [p[0] for q in e.polys for p in q]
			return ox + (min(xs) + max(xs)) / 2
		return ox

	def add(self, e):
		self.els.append(e)
		return e

	def group(self, x=0, y=0, parent=None, hud=False):
		g = self.add(Group(x, y, parent))
		g.hud = hud
		return g

	def text(self, x, y, s, at, **kw):
		return self.add(Text(s, at=at, x=x, y=y, **kw))

	def path(self, polys, at, x=0, y=0, dur=0.7, **kw):
		return self.add(Path(polys, at=at, x=x, y=y, dur=dur, **kw))

	def utxo(self, x, y, label, at, color='yellow', w=200, h=92, size=42, parent=None, sfx='tick', locked=False):
		g = self.group(x, y, parent)
		self.path(rect(w, h, 14), at, dur=0.45, color=color, parent=g, sfx=sfx)
		self.text(0, 0, label, at + 0.3, size=size, color=color, parent=g, dur=0.3)
		if locked:
			self.path(lock(0.62), at + 0.45, x=w / 2 - 6, y=-h / 2 - 4, dur=0.35, color='chalk', parent=g, width=4)
		return g

	def strike(self, x0, y0, x1, y1, at, color='red', sfx='strike', width=6, **kw):
		return self.path(line(x0, y0, x1, y1), at, dur=0.3, color=color, sfx=sfx, width=width, **kw)

	def clear(self, t, fade=0.6):
		for e in self.els:
			if e.parent is None and (e.out is None or e.out > t):
				e.erase(t, fade)

	def sfx_events(self):
		"""(thời điểm, loại, độ dài) cho phần âm thanh: tiếng phấn tự sinh theo nét vẽ."""
		ev = []
		for e in self.els:
			if isinstance(e, (Path, Text)) and e.dur >= 0.25:
				ev.append((e.at, 'scratch', e.dur))
			if e.sfx:
				ev.append((e.at, e.sfx, 0))
		# Lau theo vệt (wipe) sinh nhiều mốc sát nhau; mỗi vệt chỉ phát một tiếng lau ở đầu vệt.
		erased = sorted({round(e.out, 2) for e in self.els if e.out is not None and e.parent is None})
		erased = [t for t in erased if not any(t0 <= t <= t1 + 1e-6 for t0, t1 in self.wipes)]
		ev += [(t, 'erase', 0) for t in sorted(erased + [round(t0, 2) for t0, _ in self.wipes])]
		ev += [(t, 'whoosh', 0) for t in self.whooshes]
		return sorted(ev)


# ---------------------------------------------------------------- ghép khung


BACKGROUND = 'chalk'  # 'chalk': bảng đen có vết loang; 'clean': nền phẳng, nét gần như trơn


def set_background(style):
	"""Chọn kiểu nền cho cả tập (scenes.py khai BACKGROUND); xoá texture đã dựng để dựng lại."""
	global BACKGROUND, _TEX
	if style != BACKGROUND:
		BACKGROUND, _TEX = style, None


def _textures():
	if BACKGROUND == 'clean':
		return _clean_textures()
	rng = np.random.default_rng(7)
	g = rng.uniform(0.45, 1.0, (H, W)).astype(np.float32)
	g = np.asarray(Image.fromarray((g * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255
	low = rng.uniform(0, 1, (H // 60 + 2, W // 60 + 2)).astype(np.float32)
	low = np.asarray(Image.fromarray((low * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32) / 255
	bg = np.array(BG, np.float32)[None, None, :] / 255 * (0.82 + 0.36 * low[..., None])
	yy, xx = np.mgrid[0:H, 0:W]
	vig = 1 - 0.35 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 2
	return g[..., None], (bg * vig[..., None]).astype(np.float32)


CLEAN_BG = (17, 19, 22)


def _clean_textures():
	"""Nền phẳng màu than, chỉ sáng nhẹ ở giữa; vân trên nét rất nhẹ để nét vẫn mềm như phấn."""
	rng = np.random.default_rng(7)
	g = rng.uniform(0.9, 1.0, (H, W)).astype(np.float32)
	yy, xx = np.mgrid[0:H, 0:W]
	r2 = ((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2
	glow = 1.08 - 0.16 * np.clip(r2 / 2, 0, 1)
	bg = np.array(CLEAN_BG, np.float32)[None, None, :] / 255 * glow[..., None]
	return g[..., None], bg.astype(np.float32)


_TEX = None


def compose(layer):
	global _TEX
	if _TEX is None:
		_TEX = _textures()
	grain, bg = _TEX
	a = np.asarray(layer.filter(ImageFilter.GaussianBlur(0.7)), np.float32) / 255 * grain
	out = 1 - (1 - bg) * (1 - a)
	return (out * 255).astype(np.uint8)


class GpuComposer:
	"""Ghép khung trên GPU (CuPy): làm mờ nhẹ, nhân vân phấn, hoà kiểu screen lên nền bảng."""

	def __init__(self):
		import cupy as cp
		from cupyx.scipy.ndimage import gaussian_filter

		global _TEX
		if _TEX is None:
			_TEX = _textures()
		self.cp, self.blur = cp, gaussian_filter
		self.grain = cp.asarray(_TEX[0])
		self.inv_bg = 1 - cp.asarray(_TEX[1])

	def __call__(self, raw):
		cp = self.cp
		a = cp.asarray(np.frombuffer(raw, np.uint8).reshape(H, W, 3)).astype(cp.float32) * (1 / 255)
		a = self.blur(a, (0.7, 0.7, 0)) * self.grain
		out = (1 - self.inv_bg * (1 - a)) * 255
		return cp.asnumpy(out.astype(cp.uint8)).tobytes()


def gpu_composer():
	try:
		return GpuComposer()
	except Exception as e:  # không có CUDA/CuPy: quay về CPU
		print('GPU compose unavailable, using CPU:', e)
		return None


def draw_layer(board, t):
	layer = Image.new('RGB', (W, H))
	d = ImageDraw.Draw(layer)
	hud = []
	for e in board.els:
		if e.root().hud:
			hud.append(e)
		else:
			e.render(d, layer, t)
	z, cx, cy = board.camera(t)
	if abs(z - 1) > 1e-3 or abs(cx - W / 2) > 0.5 or abs(cy - H / 2) > 0.5:
		# điểm (X, Y) trên khung lấy từ điểm (cx + (X - W/2)/z, cy + (Y - H/2)/z) của bảng
		layer = layer.transform((W, H), Image.AFFINE, (1 / z, 0, cx - W / (2 * z), 0, 1 / z, cy - H / (2 * z)), Image.BICUBIC)
	if hud:  # lớp HUD vẽ sau camera: thẻ ví dụ đứng yên khi bảng zoom
		d = ImageDraw.Draw(layer)
		for e in hud:
			e.render(d, layer, t)
	return layer


def frame(board, t):
	return compose(draw_layer(board, t))
