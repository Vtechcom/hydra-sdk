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
	def __init__(self, at=0.0, dur=0.6, color='chalk', parent=None, x=0, y=0, sfx=None, fade=0.45):
		self.at, self.dur = at, dur
		self.color = COL[color] if isinstance(color, str) else color
		self.parent, self.x, self.y = parent, x, y
		self.moves = []
		self.out = None
		self.fade = fade
		self.sfx = sfx
		self.children = []
		if parent is not None:
			parent.children.append(self)

	def move(self, t0, t1, dx, dy):
		self.moves.append((t0, t1, dx, dy))
		return self

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
		return a * (self.parent.alpha(t) if self.parent else 1.0)

	def origin(self, t):
		x, y = self.x, self.y
		for t0, t1, dx, dy in self.moves:
			e = ease((t - t0) / max(t1 - t0, 1e-6))
			x += dx * e
			y += dy * e
		if self.parent is not None:
			px, py = self.parent.origin(t)
			x, y = x + px, y + py
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
	def __init__(self, polys, width=5, wobble=True, **kw):
		super().__init__(**kw)
		self.width = width
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
		left = p * self.total
		col = self.tint(a)
		for q, seg in zip(self.polys, self.lens):
			if left <= 0:
				break
			pts = [(q[0][0] + ox, q[0][1] + oy)]
			for (b, L) in zip(q[1:], seg):
				if left >= L:
					pts.append((b[0] + ox, b[1] + oy))
					left -= L
				else:
					a0 = pts[-1]
					u = left / L if L else 1
					pts.append((a0[0] + (b[0] + ox - a0[0]) * u, a0[1] + (b[1] + oy - a0[1]) * u))
					left = 0
					break
			if len(pts) > 1:
				draw.line(pts, fill=col, width=self.width, joint='curve')


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
		h, v = self.anchor[0], self.anchor[1]
		bx = ox - (self.bw / 2 if h == 'm' else self.bw if h == 'r' else 0)
		by = oy - (self.bh / 2 if v == 'm' else self.bh if v == 'b' else 0)
		left = p * self.total
		col = self.tint(a)
		for i, m in enumerate(self.lines):
			if left <= 0:
				break
			w = int(min(m.width, left))
			left -= m.width
			lx = bx + (self.bw - m.width) / 2 if h == 'm' else bx + (self.bw - m.width if h == 'r' else 0)
			x, y = int(lx), int(by + i * self.lh)
			mask = m if w >= m.width else m.crop((0, 0, w, m.height))
			layer.paste(col, (x, y, x + mask.width, y + mask.height), mask)


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

	def add(self, e):
		self.els.append(e)
		return e

	def group(self, x=0, y=0, parent=None):
		return self.add(Group(x, y, parent))

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
		erased = sorted({round(e.out, 2) for e in self.els if e.out is not None and e.parent is None})
		ev += [(t, 'erase', 0) for t in erased]
		return sorted(ev)


# ---------------------------------------------------------------- ghép khung


def _textures():
	rng = np.random.default_rng(7)
	g = rng.uniform(0.45, 1.0, (H, W)).astype(np.float32)
	g = np.asarray(Image.fromarray((g * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255
	low = rng.uniform(0, 1, (H // 60 + 2, W // 60 + 2)).astype(np.float32)
	low = np.asarray(Image.fromarray((low * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32) / 255
	bg = np.array(BG, np.float32)[None, None, :] / 255 * (0.82 + 0.36 * low[..., None])
	yy, xx = np.mgrid[0:H, 0:W]
	vig = 1 - 0.35 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 2
	return g[..., None], (bg * vig[..., None]).astype(np.float32)


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
	for e in board.els:
		e.render(d, layer, t)
	return layer


def frame(board, t):
	return compose(draw_layer(board, t))
