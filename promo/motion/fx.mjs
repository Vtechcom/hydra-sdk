// Kiểu chuyển động port từ Motion Prompt (https://github.com/showheyohtaki/motion-prompt), cách "move the numbers":
// giữ nguyên thời lượng, easing, độ vượt đích; khoảng cách đổi từ thẻ 539 px sang khung 1920 px theo hệ số riêng từng kiểu.
// Mỗi khối ghi số hiệu phần tử và dòng giấy phép MIT của phần tử đó.
//
// Mọi hàm là hàm thuần của thời gian t (giây trong cảnh). Hàm nào có mốc bắt đầu thì gọi ev(t0, loại) để engine
// gom tiếng hiệu ứng; cảnh phải gọi các hàm này vô điều kiện (kể cả khi t < t0), để lượt gom tiếng thấy đủ.

// Motion Prompt #001-024 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#001
// (bảng màu, easing và tiện ích dùng chung lấy từ kit "motion")
export const C = {
	navy: '#0F1A3D', navy2: '#1B2A5E', navy3: '#2A3D80', dim: '#7F90C4',
	blue: '#3B7BFF', coral: '#FF6B5C', yel: '#FFC83D', mint: '#2EDBA8', white: '#FFFFFF', cream: '#FFF1D6',
}
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const lerp = (a, b, x) => a + (b - a) * x
export const P = (t, a, b) => clamp((t - a) / (b - a))
export const eIO = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
export const eIOs = x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)
export const eOut = x => 1 - Math.pow(1 - x, 3)
export const eOut5 = x => 1 - Math.pow(1 - x, 5)
export const eIn = x => x * x * x
export const backOut = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2)
export const backIn = (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x
export const spring = (t, w = 14, d = 7) => (t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(w * t))
export function rr(k, x, y, w, h, r) { k.beginPath(); k.roundRect(x, y, w, h, r) }
export const H01 = n => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x) }

export const FONT = '"Be Vietnam Pro"'
export const MONO = '"JetBrains Mono"'

// ---------------------------------------------------------------- gom tiếng hiệu ứng

let sink = null
export function collect(fn) { sink = []; fn(); const out = sink; sink = null; return out }
export function ev(t0, kind) { if (sink && kind) sink.push([t0, kind]) }

export function txt(k, s, x, y, size, col, { weight = 700, align = 'center', base = 'middle', mono = false, ls = 0 } = {}) {
	k.font = `${weight} ${size}px ${mono ? MONO : FONT}`
	k.fillStyle = col; k.textAlign = align; k.textBaseline = base
	k.letterSpacing = `${ls}px`
	k.fillText(s, x, y)
	k.letterSpacing = '0px'
}

export function fade(t, t0, d = 0.3) { return clamp((t - t0) / d) }

// ---------------------------------------------------------------- #001 Pop-in
// Motion Prompt #001 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#001
// Scale 0→1 bằng lò xo 1 − e^(−6.5t)·cos(15t) (đỉnh khoảng 1.26); xoay −0.35 rad → 0 bằng 1 − e^(−6t)·cos(11t).

export function popScale(t, t0) { return spring(t - t0, 15, 6.5) }
export function pop(k, t, t0, x, y, draw, { rot = true, sfx = 'tick' } = {}) {
	ev(t0, sfx)
	const sc = popScale(t, t0)
	if (sc <= 0.002) return
	k.save(); k.translate(x, y)
	if (rot) k.rotate((1 - spring(t - t0, 11, 6)) * -0.35)
	k.scale(sc, sc); draw(k); k.restore()
}
// Huy hiệu nhỏ bật ra trễ hơn: lò xo 1 − e^(−7t)·cos(17t)
export function popBadge(t, t0) { return spring(t - t0, 17, 7) }

// ---------------------------------------------------------------- #002 Stagger
// Motion Prompt #002 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#002
// Phần tử i bắt đầu ở t0 + 0.12·i, lớn từ 0 tới đủ trong 0.5 s với backOut (s = 2.6), neo ở đáy.

export function grow(t, t0, i = 0, step = 0.12) { return backOut(P(t, t0 + step * i, t0 + step * i + 0.5), 2.6) }

// ---------------------------------------------------------------- #004 Line draw
// Motion Prompt #004 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#004
// Vẽ theo trim path, cubic ease-in-out; chấm vàng (r 12, lõi trắng r 5) chạy ở đầu nét; vòng khoanh vẽ theo chiều kim đồng hồ từ đỉnh.

export function smoothPath(pts, n = 16) {
	const out = []
	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
		for (let j = 0; j < n; j++) {
			const t = j / n, t2 = t * t, t3 = t2 * t
			out.push([0, 1].map(c => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)))
		}
	}
	out.push(pts[pts.length - 1])
	return out
}
export function pathLen(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c }
export function ptAt(pts, cum, f) {
	const L = cum[cum.length - 1] * clamp(f); let i = 1
	while (i < cum.length - 1 && cum[i] < L) i++
	const u = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1])
	return [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]
}
export function trim(k, pts, cum, f0, f1) {
	if (f1 - f0 <= 0.0005) return
	const L = cum[cum.length - 1], a = L * f0, b = L * f1
	k.beginPath(); const s = ptAt(pts, cum, f0); k.moveTo(s[0], s[1])
	for (let i = 1; i < pts.length - 1; i++) if (cum[i] > a && cum[i] < b) k.lineTo(pts[i][0], pts[i][1])
	const e = ptAt(pts, cum, f1); k.lineTo(e[0], e[1]); k.stroke()
}
export function drawLine(k, t, t0, dur, pts, col, width = 8, { smooth = true, tip = true, sfx = null } = {}) {
	ev(t0, sfx)
	const p = smooth ? smoothPath(pts) : pts, cum = pathLen(p), f = eIO(P(t, t0, t0 + dur))
	k.save(); k.lineCap = 'round'; k.lineJoin = 'round'; k.strokeStyle = col; k.lineWidth = width
	trim(k, p, cum, 0, f); k.restore()
	if (tip && f > 0 && f < 1) {
		const e = ptAt(p, cum, f)
		k.fillStyle = C.yel; k.beginPath(); k.arc(e[0], e[1], 12, 0, 7); k.fill()
		k.fillStyle = '#fff'; k.beginPath(); k.arc(e[0], e[1], 5, 0, 7); k.fill()
	}
}
export function circleMark(k, t, t0, x, y, rx, ry, col = C.coral, width = 7) {
	ev(t0, 'strike')
	const f = eIO(P(t, t0, t0 + 0.6))
	if (f <= 0) return
	k.save(); k.strokeStyle = col; k.lineWidth = width; k.lineCap = 'round'
	k.beginPath(); k.ellipse(x, y, rx, ry, 0, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); k.stroke(); k.restore()
}

// ---------------------------------------------------------------- #005 Mask reveal
// Motion Prompt #005 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#005
// Vạch coral mọc từ giữa ở 0.1–0.5 s (cubic in-out); chữ trên trồi lên từ dưới vạch ở 0.35–1.0 s (quintic out, 120/98 cỡ chữ);
// chữ dưới trượt xuống từ trên vạch ở 0.55–1.15 s (60/32 cỡ chữ). Chữ chỉ bị che bởi vùng cắt, không đổi độ mờ.

export function reveal(k, t, t0, x, y, top, { size = 96, sub = null, subSize = 40, col = '#fff', subCol = C.yel, line = C.coral, lineW = null, out = null, align = 'center' } = {}) {
	ev(t0 + 0.1, 'whoosh')
	const lu = t - t0
	const o = out == null ? 0 : t - out
	k.font = `800 ${size}px ${FONT}`
	const w = lineW || Math.max(k.measureText(top).width, sub ? (k.font = `600 ${subSize}px ${FONT}`, k.measureText(sub).width) : 0) + 40
	const lg = eIO(P(lu, 0.1, 0.5)) * (1 - eIO(P(o, 0.35, 0.6)))
	const cx = align === 'left' ? x + w / 2 - 20 : x
	const up = (1 - eOut5(P(lu, 0.35, 1.0))) * size * 1.22 + backIn(P(o, 0, 0.35), 1.2) * -size * 1.5
	k.save(); k.beginPath(); k.rect(cx - w, y - size * 1.4, w * 2, size * 1.4 - 6); k.clip()
	txt(k, top, x, y - size * 0.3 + up, size, col, { weight: 800, align, base: 'alphabetic' })
	k.restore()
	if (sub) {
		const dn = (1 - eOut5(P(lu, 0.55, 1.15))) * -subSize * 1.9 + eIn(P(o, 0.05, 0.35)) * subSize * 2.2
		k.save(); k.beginPath(); k.rect(cx - w, y + 8, w * 2, subSize * 1.7); k.clip()
		txt(k, sub, x, y + 8 + subSize * 0.8 + dn, subSize, subCol, { weight: 600, align })
		k.restore()
	}
	if (lg > 0.005) { k.fillStyle = line; rr(k, cx - (w / 2) * lg, y - 3, w * lg, 6, 3); k.fill() }
}

// ---------------------------------------------------------------- #007 Count-up
// Motion Prompt #007 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#007
// Giá trị = đích × (1 − (1 − p)^4): nhanh lúc đầu, chậm lúc cuối. Khi chạm đích: đổi màu sang vàng và nảy 1 + 0.07·e^(−7t)·cos(15t).

export function count(t, t0, dur, v0, v1) {
	const p = P(t, t0, t0 + dur)
	return v0 + (v1 - v0) * (1 - Math.pow(1 - p, 4))
}
export function countLand(t, tLand) { const l = t - tLand; return l > 0 ? 1 + 0.07 * Math.exp(-7 * l) * Math.cos(15 * l) : 1 }

// ---------------------------------------------------------------- #018 Shape transition
// Motion Prompt #018 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#018
// Bốn dải ngang (blue, coral, yellow, mint), đầu dải xiên 80/539 chiều rộng. Che trong 0.62 s, đổi cảnh khi che kín,
// mở trong 0.63 s bắt đầu 0.12 s sau đó. Dải i trễ 14% pha, mỗi dải chạy cubic in-out trên 58% pha.

export function bands(k, W, H, t, tSwap, dir = 1) {
	const p1 = P(t, tSwap - 0.62, tSwap), p2 = P(t, tSwap + 0.12, tSwap + 0.75), N = 4, sk = 80 * W / 539
	const cols = [C.blue, C.coral, C.yel, C.mint]
	for (let i = 0; i < N; i++) {
		const d = i * 0.14, e1 = eIO(clamp((p1 - d) / (1 - 0.42))), e2 = eIO(clamp((p2 - d) / (1 - 0.42)))
		if (e1 <= 0 || e2 >= 1) continue
		const bh = H / N + 1, y = (i * H) / N, span = W + sk + 20
		const xa = -sk - 10 + e2 * span, xb = -sk - 10 + e1 * span
		k.save(); if (dir < 0) { k.translate(W, 0); k.scale(-1, 1) }
		k.fillStyle = cols[i]; k.beginPath(); k.moveTo(xa + sk, y); k.lineTo(xb + sk, y); k.lineTo(xb, y + bh); k.lineTo(xa, y + bh); k.closePath(); k.fill()
		k.restore()
	}
}

// ---------------------------------------------------------------- #022 Light sweep
// Motion Prompt #022 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#022
// Dải sáng rộng 116 (độ mờ 0.72 ở giữa) và vạch mảnh 12 cách 78, nghiêng 0.42 rad; đi từ 130 trái tới 130 phải trong 0.45–1.5 s
// (quadratic in-out); lấp lánh bốn cánh ở góc phải trên 1.38–1.98 s.

export function sweep(k, t, t0, x, y, w, h, r) {
	ev(t0 + 0.45, 'chime')
	const p = eIOs(P(t - t0, 0.45, 1.5))
	if (p > 0 && p < 1) {
		k.save(); rr(k, x, y, w, h, r); k.clip()
		k.translate(lerp(x - 130, x + w + 130, p), y + h / 2); k.rotate(0.42)
		const g = k.createLinearGradient(-58, 0, 58, 0)
		g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.72)'); g.addColorStop(1, 'rgba(255,255,255,0)')
		k.fillStyle = g; k.fillRect(-58, -h * 2, 116, h * 4); k.fillStyle = 'rgba(255,255,255,.5)'; k.fillRect(78, -h * 2, 12, h * 4)
		k.restore()
	}
	const tt = t - t0 - 1.38
	if (tt > 0 && tt < 0.6) {
		const q = tt / 0.6, sc = Math.sin(Math.PI * q) * (1 + 0.2 * (1 - q))
		k.save(); k.translate(x + w - 8, y + 6); k.rotate(q * 0.9); k.fillStyle = '#fff'; star(k, 0, 0, 34 * sc, 0, 0.22, 4); k.fill(); k.restore()
	}
}
export function star(k, x, y, R, rot = 0, inner = 0.5, n = 5) {
	k.beginPath()
	for (let i = 0; i < n * 2; i++) {
		const r = i % 2 ? R * inner : R, a = rot - Math.PI / 2 + (i * Math.PI) / n
		const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r
		i ? k.lineTo(px, py) : k.moveTo(px, py)
	}
	k.closePath()
}

// ---------------------------------------------------------------- #024 Impact shake
// Motion Prompt #024 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#024
// Rơi 0.32 s (cubic ease-in, giãn dọc 1.12×), chạm đất rồi cả khung rung 1.1 s: x 15·e^(−5t)·sin(2π·5t), y 11·e^(−5t)·cos(2π·6.5t),
// xoay 0.02·e^(−5t)·sin(2π·5t + 0.6); bẹp dọc tới 22% trong 0.3 s. Khoảng cách nhân 2 cho khung 1920.

export function shakeAt(t, tI, s = 2) {
	const tau = t - tI
	if (tau <= 0 || tau >= 1.1) return [0, 0, 0]
	const e = Math.exp(-5 * tau), ph = 2 * Math.PI * 5 * tau
	return [15 * s * e * Math.sin(ph), 11 * s * e * Math.cos(ph * 1.3), 0.02 * e * Math.sin(ph + 0.6)]
}
export function slam(k, t, t0, x, yFloor, draw) {
	const tI = t0 + 0.32
	ev(tI, 'thud')
	if (t < t0) return
	const y = t < tI ? lerp(-300, yFloor, eIn(P(t, t0, tI))) : yFloor
	const tau = t - tI
	const sq = tau > 0 && tau < 0.3 ? 1 - 0.22 * Math.sin((tau / 0.3) * Math.PI) : t < tI ? 1.12 : 1
	k.save(); k.translate(x, y); k.scale(2 - sq, sq); draw(k); k.restore()
}

// ---------------------------------------------------------------- #125 Pulse
// Motion Prompt #125 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#125
// Mỗi nhịp 1.175 s là một cặp "thình thịch": scale = 1 + 0.26·G(0.2, 0.065) + 0.15·G(0.44, 0.07); hai vòng lan ra từ 0.16 s và 0.40 s,
// scale 1.2→2.4 trong 0.8 s (cubic out), độ mờ 0.75→0 (vòng hai 60%), nét 8.5→1.5.

export function pulse(t, t0) {
	if (t < t0) return 1
	const lu = (t - t0) % 1.175, g = (c, s) => Math.exp(-Math.pow((lu - c) / s, 2))
	return 1 + 0.26 * g(0.2, 0.065) + 0.15 * g(0.44, 0.07)
}
export function pulseRings(k, t, t0, shape, col) {
	ev(t0, 'thud')
	if (t < t0) return
	const lu = (t - t0) % 1.175
	for (const [s0, a] of [[0.16, 1], [0.4, 0.6]]) {
		const q = P(lu, s0, s0 + 0.8)
		if (q <= 0 || q >= 1) continue
		const sc = 1.2 + 1.2 * eOut(q)
		k.save(); k.scale(sc, sc); shape(k); k.strokeStyle = col; k.globalAlpha *= (1 - q) * 0.75 * a; k.lineWidth = (7 * (1 - q) + 1.5) / sc; k.stroke(); k.restore()
	}
}

// ---------------------------------------------------------------- #126 Motion path
// Motion Prompt #126 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#126
// Đường đi hiện trước bằng chấm (nét 6, gạch 2/15); vệt 24 đoạn phía sau, mảnh và nhạt dần.
// Ở đây vật chạy là chấm/nhãn dữ liệu; tiến độ trên đường dùng eIO thay cho tốc độ góc của đường vòng gốc.

export function travel(k, t, t0, dur, pts, col, { label = null, r = 13, guide = true, keep = false, sfx = 'click' } = {}) {
	ev(t0, sfx)
	const p = smoothPath(pts, 10), cum = pathLen(p)
	const f = eIO(P(t, t0, t0 + dur))
	if (guide && t > t0 - 0.4 && (f < 1 || keep)) {
		k.save(); k.globalAlpha *= clamp((t - t0 + 0.4) / 0.4) * (keep ? 1 : 1 - P(t, t0 + dur, t0 + dur + 0.3))
		k.setLineDash([2, 15]); k.lineCap = 'round'; k.strokeStyle = C.dim; k.lineWidth = 6
		k.beginPath(); p.forEach((q, i) => (i ? k.lineTo(q[0], q[1]) : k.moveTo(q[0], q[1]))); k.stroke(); k.restore()
	}
	if (f <= 0 || (f >= 1 && !keep)) return
	k.save(); k.lineCap = 'round'
	const a0 = k.globalAlpha
	for (let j = 0; j < 24; j++) {
		const a = f - j * 0.012, b = f - (j + 1) * 0.012
		if (b <= 0) break
		const A = ptAt(p, cum, a), B = ptAt(p, cum, b)
		k.strokeStyle = col; k.globalAlpha = a0 * 0.9 * (1 - j / 24); k.lineWidth = 9 * (1 - j / 30)
		k.beginPath(); k.moveTo(A[0], A[1]); k.lineTo(B[0], B[1]); k.stroke()
	}
	k.restore()
	const e = ptAt(p, cum, f)
	k.fillStyle = col; k.beginPath(); k.arc(e[0], e[1], r, 0, 7); k.fill()
	k.fillStyle = '#fff'; k.beginPath(); k.arc(e[0], e[1], r * 0.4, 0, 7); k.fill()
	if (label) {
		k.font = `700 26px ${FONT}`
		const w = k.measureText(label).width + 28
		k.fillStyle = col; rr(k, e[0] - w / 2, e[1] - r - 50, w, 40, 20); k.fill()
		txt(k, label, e[0], e[1] - r - 30, 26, C.navy, { weight: 700 })
	}
}

// ---------------------------------------------------------------- #129 Text scramble
// Motion Prompt #129 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#129
// Ô chưa khoá hiện ký tự ngẫu nhiên đổi mỗi 0.062 s (mint, 75%); khoá từ trái sang phải; ký tự vừa khoá vàng trong 0.22 s rồi trắng,
// scale 1 + 0.2·e^(−14t). Bước khoá gốc là 0.18 s cho 5 ô; chuỗi dài hơn dùng bước nhỏ hơn để tổng thời gian tương đương.

const GL = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&@?'
export function scramble(k, t, t0, s, x, y, size, { step = null } = {}) {
	ev(t0, 'tick')
	if (t < t0 - 0.6) return
	const N = s.length, st = step ?? Math.min(0.18, 0.9 / N)
	k.font = `700 ${size}px ${MONO}`
	const cw = k.measureText('M').width + size * 0.12, x0 = x - (cw * (N - 1)) / 2
	const tick = Math.floor(t / 0.062)
	for (let i = 0; i < N; i++) {
		const tl = t0 + 0.45 + i * st, locked = t >= tl
		let ch, col, sc = 1
		if (locked) { ch = s[i]; const age = t - tl; col = age < 0.22 ? C.yel : '#fff'; sc = 1 + 0.2 * Math.exp(-age * 14) }
		else { ch = s[i] === ' ' ? ' ' : GL[Math.floor(H01(tick * 131 + i * 977) * GL.length)]; col = C.mint }
		k.save(); k.translate(x0 + i * cw, y); k.scale(sc, sc); k.globalAlpha *= locked ? 1 : 0.75
		txt(k, ch, 0, 0, size, col, { mono: true }); k.restore()
	}
}

// ---------------------------------------------------------------- #144 Split screen
// Motion Prompt #144 · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#144
// Một khung tách thành hai trong 0.5 s (cubic in-out); vạch chia trắng rộng 6 giữa hai khung; gộp lại cũng cubic in-out.

export function splitAt(t, tOpen, tClose, at = 0.56) {
	const s = eIO(P(t, tOpen, tOpen + 0.5)) * (tClose == null ? 1 : 1 - eIO(P(t, tClose, tClose + 0.65)))
	return lerp(1, at, s)
}
