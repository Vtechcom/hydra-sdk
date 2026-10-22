// Biểu tượng phẳng dùng chung cho engine Canvas, vẽ quanh gốc (0, 0) để ghép với pop/scale.
// Màu theo bảng màu kit "motion" của Motion Prompt (fx.mjs: C).
import { C, rr, txt } from './fx.mjs'

export function chip(k, label, { w = 220, h = 96, col = C.blue, fill = C.navy2, size = 38, keyIcon = false } = {}) {
	k.fillStyle = 'rgba(0,0,0,.28)'; rr(k, -w / 2 + 4, -h / 2 + 10, w, h, 22); k.fill()
	k.fillStyle = fill; rr(k, -w / 2, -h / 2, w, h, 22); k.fill()
	k.lineWidth = 4; k.strokeStyle = col; rr(k, -w / 2, -h / 2, w, h, 22); k.stroke()
	txt(k, label, 0, 2, size, '#fff', { weight: 700 })
	if (keyIcon) { k.save(); k.translate(w / 2 - 6, -h / 2 + 4); key(k, C.yel, 0.8); k.restore() }
}

export function key(k, col = C.yel, s = 1) {
	k.save(); k.scale(s, s); k.strokeStyle = col; k.fillStyle = col; k.lineWidth = 6; k.lineCap = 'round'
	k.beginPath(); k.arc(-14, 0, 11, 0, 7); k.stroke()
	k.beginPath(); k.moveTo(-3, 0); k.lineTo(26, 0); k.moveTo(16, 0); k.lineTo(16, 9); k.moveTo(24, 0); k.lineTo(24, 7); k.stroke()
	k.restore()
}

export function coin(k, label = '100 ADA', { col = C.yel, w = 200, h = 72, size = 32 } = {}) {
	k.fillStyle = col; rr(k, -w / 2, -h / 2, w, h, h / 2); k.fill()
	k.fillStyle = 'rgba(255,255,255,.25)'; rr(k, -w / 2, -h / 2, w, h / 2, [h / 2, h / 2, 0, 0]); k.fill()
	txt(k, label, 0, 2, size, C.navy, { weight: 800 })
}

// Tờ bản chốt: thẻ trắng, tiêu đề xanh, các dòng số dư, hàng chữ ký ở đáy.
export function sheet(k, { title = 'bản chốt', rows = [], w = 360, h = 250, sigs = 0, sigCol = C.blue } = {}) {
	k.fillStyle = 'rgba(0,0,0,.3)'; rr(k, -w / 2 + 6, -h / 2 + 12, w, h, 20); k.fill()
	k.fillStyle = '#fff'; rr(k, -w / 2, -h / 2, w, h, 20); k.fill()
	k.fillStyle = C.blue; rr(k, -w / 2, -h / 2, w, 62, [20, 20, 0, 0]); k.fill()
	txt(k, title, 0, -h / 2 + 32, 30, '#fff', { weight: 800 })
	rows.forEach(([s, col, strike], i) => {
		const y = -h / 2 + 100 + i * 46
		txt(k, s, 0, y, 30, col || C.navy, { weight: 700, mono: true })
		if (strike) { k.strokeStyle = C.coral; k.lineWidth = 6; k.beginPath(); k.moveTo(-110, y); k.lineTo(110, y); k.stroke() }
	})
	for (let i = 0; i < sigs; i++) {
		const x = (i - 1) * (w / 3.2), y = h / 2 - 34
		k.fillStyle = sigCol; k.beginPath(); k.arc(x, y, 19, 0, 7); k.fill()
		k.strokeStyle = '#fff'; k.lineWidth = 5; k.lineCap = 'round'; k.lineJoin = 'round'
		k.beginPath(); k.moveTo(x - 9, y); k.lineTo(x - 2, y + 7); k.lineTo(x + 10, y - 7); k.stroke()
	}
}

export function person(k, col = '#fff', s = 1) {
	k.save(); k.scale(s, s); k.fillStyle = col
	k.beginPath(); k.arc(0, -46, 26, 0, 7); k.fill()
	rr(k, -40, -14, 80, 80, [40, 40, 12, 12]); k.fill()
	k.restore()
}

export function wallet(k, col = C.yel, s = 1) {
	k.save(); k.scale(s, s)
	k.fillStyle = col; rr(k, -110, -70, 220, 140, 24); k.fill()
	k.fillStyle = 'rgba(15,26,61,.18)'; rr(k, 30, -30, 90, 60, 16); k.fill()
	k.fillStyle = C.navy; k.beginPath(); k.arc(64, 0, 10, 0, 7); k.fill()
	k.restore()
}

// Két ký quỹ: thân xám xanh, núm vặn, các vạch tiền vàng (fill 0–1).
export function vault(k, { fill = 1, w = 200, h = 160, lock = 0, col = C.yel } = {}) {
	k.fillStyle = 'rgba(0,0,0,.3)'; rr(k, -w / 2 + 5, -h / 2 + 10, w, h, 22); k.fill()
	k.fillStyle = C.navy3; rr(k, -w / 2, -h / 2, w, h, 22); k.fill()
	k.fillStyle = C.navy2; rr(k, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 14); k.fill()
	const n = 4
	for (let i = 0; i < n; i++) {
		const f = Math.max(0, Math.min(1, fill * n - i))
		if (f <= 0) continue
		k.fillStyle = col; rr(k, -w / 2 + 30, h / 2 - 42 - i * 26, (w - 110) * f, 16, 8); k.fill()
	}
	k.strokeStyle = C.dim; k.lineWidth = 5; k.beginPath(); k.arc(w / 2 - 40, 0, 16, 0, 7); k.stroke()
	if (lock > 0) {
		k.save(); k.globalAlpha *= lock
		k.strokeStyle = C.coral; k.lineWidth = 8; rr(k, -w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 28); k.stroke()
		k.translate(0, -h / 2 - 10); padlock(k, C.coral, 0.9); k.restore()
	}
}

export function padlock(k, col = C.coral, s = 1) {
	k.save(); k.scale(s, s)
	k.strokeStyle = col; k.lineWidth = 8; k.beginPath(); k.arc(0, -14, 18, Math.PI, 0); k.lineTo(18, 0); k.moveTo(-18, 0); k.lineTo(-18, -14); k.stroke()
	k.fillStyle = col; rr(k, -28, -4, 56, 44, 10); k.fill()
	k.fillStyle = C.navy; k.beginPath(); k.arc(0, 14, 6, 0, 7); k.fill()
	k.restore()
}

export function eye(k, col = C.mint, s = 1) {
	k.save(); k.scale(s, s)
	k.fillStyle = col; k.beginPath(); k.moveTo(-60, 0); k.quadraticCurveTo(0, -56, 60, 0); k.quadraticCurveTo(0, 56, -60, 0); k.fill()
	k.fillStyle = C.navy; k.beginPath(); k.arc(0, 0, 20, 0, 7); k.fill()
	k.fillStyle = '#fff'; k.beginPath(); k.arc(7, -7, 6, 0, 7); k.fill()
	k.restore()
}

export function gear(k, col = '#fff', r = 54, rot = 0) {
	k.save(); k.rotate(rot); k.fillStyle = col; k.beginPath()
	const n = 10
	for (let i = 0; i < n * 4; i++) {
		const a = (i / (n * 4)) * Math.PI * 2, rr2 = i % 4 < 2 ? r + 14 : r
		i ? k.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2) : k.moveTo(Math.cos(a) * rr2, Math.sin(a) * rr2)
	}
	k.closePath(); k.fill()
	k.fillStyle = C.navy; k.beginPath(); k.arc(0, 0, r * 0.42, 0, 7); k.fill()
	k.restore()
}

export function check(k, col = C.mint, s = 1) {
	k.save(); k.scale(s, s)
	k.fillStyle = col; k.beginPath(); k.arc(0, 0, 44, 0, 7); k.fill()
	k.strokeStyle = C.navy; k.lineWidth = 11; k.lineCap = 'round'; k.lineJoin = 'round'
	k.beginPath(); k.moveTo(-18, 2); k.lineTo(-4, 16); k.lineTo(20, -14); k.stroke()
	k.restore()
}

export function cross(k, col = C.coral, s = 1) {
	k.save(); k.scale(s, s)
	k.fillStyle = col; k.beginPath(); k.arc(0, 0, 44, 0, 7); k.fill()
	k.strokeStyle = '#fff'; k.lineWidth = 11; k.lineCap = 'round'
	k.beginPath(); k.moveTo(-15, -15); k.lineTo(15, 15); k.moveTo(15, -15); k.lineTo(-15, 15); k.stroke()
	k.restore()
}

export function book(k, col = C.navy, s = 1) {
	k.save(); k.scale(s, s)
	k.fillStyle = col; rr(k, -120, -80, 240, 160, 14); k.fill()
	k.fillStyle = '#fff'; rr(k, -110, -70, 104, 140, 8); k.fill(); rr(k, 6, -70, 104, 140, 8); k.fill()
	k.fillStyle = C.dim
	for (let i = 0; i < 5; i++) { rr(k, -96, -50 + i * 24, 76, 8, 4); k.fill(); rr(k, 20, -50 + i * 24, 76, 8, 4); k.fill() }
	k.restore()
}

export function invoice(k, { col = C.navy, label = '#42', amount = '100', amtCol = C.navy } = {}) {
	k.fillStyle = '#fff'; rr(k, -80, -110, 160, 220, 14); k.fill()
	k.strokeStyle = col; k.lineWidth = 5; rr(k, -80, -110, 160, 220, 14); k.stroke()
	txt(k, label, 0, -70, fit(k, label, 30, 136), col, { weight: 800 })
	k.fillStyle = C.dim; for (let i = 0; i < 3; i++) { rr(k, -54, -30 + i * 24, 108, 8, 4); k.fill() }
	txt(k, amount, 0, 70, fit(k, amount, 40, 136), amtCol, { weight: 800 })
}

// Cỡ chữ lớn nhất (không quá size) để chuỗi nằm gọn trong bề rộng w
export function fit(k, s, size, w, weight = 800) {
	k.font = `${weight} ${size}px "Be Vietnam Pro"`
	const m = k.measureText(s).width
	return m <= w ? size : Math.floor((size * w) / m)
}

export function house(k, col = C.navy, s = 1) {
	k.save(); k.scale(s, s); k.fillStyle = col
	k.beginPath(); k.moveTo(-120, -10); k.lineTo(0, -110); k.lineTo(120, -10); k.closePath(); k.fill()
	rr(k, -90, -20, 180, 120, 10); k.fill()
	k.fillStyle = C.cream; rr(k, -24, 30, 48, 70, 6); k.fill()
	k.restore()
}

export function bank(k, col = C.navy, s = 1) {
	k.save(); k.scale(s, s); k.fillStyle = col
	k.beginPath(); k.moveTo(-130, -40); k.lineTo(0, -110); k.lineTo(130, -40); k.closePath(); k.fill()
	for (const x of [-90, -30, 30, 90]) { rr(k, x - 14, -30, 28, 110, 6); k.fill() }
	rr(k, -140, 84, 280, 22, 6); k.fill()
	k.restore()
}

export function envelope(k, col = C.navy, s = 1) {
	k.save(); k.scale(s, s)
	k.fillStyle = col; rr(k, -120, -80, 240, 160, 16); k.fill()
	k.strokeStyle = C.cream; k.lineWidth = 8; k.lineJoin = 'round'
	k.beginPath(); k.moveTo(-108, -66); k.lineTo(0, 16); k.lineTo(108, -66); k.stroke()
	k.restore()
}

export function moon(k, col = C.yel, bg = C.cream, s = 1) {
	k.save(); k.scale(s, s)
	k.fillStyle = col; k.beginPath(); k.arc(0, 0, 56, 0, 7); k.fill()
	k.fillStyle = bg; k.beginPath(); k.arc(26, -18, 48, 0, 7); k.fill()
	k.restore()
}

export function stack(k, n, col = C.yel, { w = 220, h = 44, gap = 10 } = {}) {
	for (let i = 0; i < n; i++) { k.fillStyle = col; rr(k, -w / 2, -i * (h + gap) - h, w, h, 12); k.fill() }
}

export function pill(k, label, col, { size = 34, fg = C.navy, padX = 34, h = 66 } = {}) {
	k.font = `700 ${size}px "Be Vietnam Pro"`
	const w = k.measureText(label).width + padX * 2
	k.fillStyle = col; rr(k, -w / 2, -h / 2, w, h, h / 2); k.fill()
	txt(k, label, 0, 2, size, fg, { weight: 700 })
	return w
}
