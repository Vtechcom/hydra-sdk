"""Âm thanh tự tổng hợp bằng numpy: nền (pad), tiếng phấn, tick, chuông, trầm, lau bảng.

Mọi thời điểm phát lấy từ mốc của phần tử trên bảng (Board.sfx_events), không đặt tay.
"""
import numpy as np

SR = 48000


def _t(dur):
	return np.arange(int(dur * SR)) / SR


def bandpass(x, lo, hi):
	X = np.fft.rfft(x)
	f = np.fft.rfftfreq(len(x), 1 / SR)
	X *= ((f >= lo) & (f <= hi)) * 1.0
	return np.fft.irfft(X, len(x))


def _norm(x, rms_db):
	r = np.sqrt(np.mean(x ** 2)) + 1e-9
	return x * (10 ** (rms_db / 20) / r)


def tick(rng):
	t = _t(0.09)
	return (np.sin(2 * np.pi * 1900 * t) + 0.4 * np.sin(2 * np.pi * 3800 * t)) * np.exp(-t * 60) * 0.25


def click(rng):
	t = _t(0.05)
	return bandpass(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t * 120) * 0.35


def chime(rng):
	t = _t(1.6)
	parts = [(880, 1.0), (1320 * 1.003, 0.5), (2217, 0.25), (2960, 0.12)]
	x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * (2.2 + f / 1500)) for f, a in parts)
	return x * 0.16


def thud(rng):
	t = _t(0.45)
	f = 70 * np.exp(-t * 2.5) + 38
	x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
	n = bandpass(rng.standard_normal(len(t)), 60, 400) * np.exp(-t * 30) * 0.3
	return (x + n) * 0.5


def strike(rng):
	t = _t(0.22)
	return bandpass(rng.standard_normal(len(t)), 1800, 7000) * np.sin(np.pi * t / t[-1]) * 0.12


def gear(rng):
	out = np.zeros(int(0.5 * SR))
	for k in range(6):
		c = click(rng) * 0.6
		i = int(k * 0.07 * SR)
		out[i:i + len(c)] += c
	return out


def erase(rng):
	t = _t(0.7)
	x = rng.standard_normal(len(t))
	env = np.sin(np.pi * t / t[-1]) ** 1.5
	return bandpass(x, 300, 2500) * env * 0.06


def scratch(rng, dur):
	"""Tiếng phấn: nhiễu dải cao, cắt thành từng nét ngắn theo nhịp viết."""
	t = _t(max(dur, 0.1))
	x = bandpass(rng.standard_normal(len(t)), 2200, 7500)
	env = np.zeros(len(t))
	pos = 0
	while pos < len(t):
		n = int(rng.uniform(0.05, 0.16) * SR)
		g = int(rng.uniform(0.01, 0.05) * SR)
		seg = np.sin(np.linspace(0, np.pi, max(n, 2))) * rng.uniform(0.5, 1.0)
		env[pos:pos + n] = seg[:len(env[pos:pos + n])]
		pos += n + g
	return x * env * 0.035


ONE_SHOT = {'tick': tick, 'click': click, 'chime': chime, 'thud': thud, 'strike': strike, 'gear': gear, 'erase': erase}


def sfx_track(events, total):
	rng = np.random.default_rng(11)
	out = np.zeros(int(total * SR) + SR)
	for t0, kind, dur in events:
		x = scratch(rng, dur) if kind == 'scratch' else ONE_SHOT[kind](rng) if kind in ONE_SHOT else None
		if x is None:
			continue
		i = int(t0 * SR)
		n = min(len(x), len(out) - i)
		if n > 0:
			out[i:i + n] += x[:n]
	return out[:int(total * SR)]


CHORDS = [  # Am – F – C – G, nhẹ và chậm
	(110.0, 130.81, 164.81, 220.0),
	(87.31, 130.81, 174.61, 220.0),
	(130.81, 164.81, 196.0, 261.63),
	(98.0, 123.47, 146.83, 196.0),
]


def pad(total, change_points):
	"""Nền: hợp âm sóng sin hơi lệch tần, đổi hợp âm theo mốc cảnh, vào/ra mờ dần."""
	n = int(total * SR)
	out = np.zeros(n)
	cps = [0.0] + [c for c in change_points if 0 < c < total] + [total]
	for k, (a, b) in enumerate(zip(cps, cps[1:])):
		i0, i1 = int(a * SR), int(b * SR)
		xf = int(1.5 * SR)
		j0, j1 = max(0, i0 - xf), min(n, i1 + xf)
		t = np.arange(j1 - j0) / SR
		chord = CHORDS[k % len(CHORDS)]
		seg = sum(np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.004 * t + 1.3) for f in chord)
		seg *= 1 + 0.15 * np.sin(2 * np.pi * 0.11 * t)
		env = np.ones(len(t))
		r = min(xf, len(t) // 2)
		env[:r] = np.linspace(0, 1, r)
		env[-r:] = np.linspace(1, 0, r)
		out[j0:j1] += seg * env
	fade = int(2.0 * SR)
	out[:fade] *= np.linspace(0, 1, fade)
	out[-fade:] *= np.linspace(1, 0, fade)
	return bandpass(out, 40, 2000)


def envelope(x, win=0.25):
	k = int(win * SR)
	c = np.cumsum(np.abs(x))
	e = (c[k:] - c[:-k]) / k
	return np.concatenate([np.full(k // 2, e[0]), e, np.full(len(x) - len(e) - k // 2, e[-1])])


def mix(voice, sfx, bg):
	"""Giọng là lớp chính: nền giảm còn ~50%, hiệu ứng ~30% khi có giọng."""
	voice = _norm(voice, -20)
	bg = _norm(bg, -37)
	sfx = sfx * (10 ** (-6 / 20))
	env = envelope(voice)
	on = np.clip(env / (env.max() * 0.15 + 1e-9), 0, 1)
	out = voice + bg * (1 - 0.5 * on) + sfx * (1 - 0.7 * on)
	peak = np.abs(out).max()
	return out / peak * 0.89 if peak > 0.89 else out
