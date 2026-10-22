// Trust Center tập 1 — bản dựng bằng engine Canvas (promo/motion), kiểu chuyển động lấy từ Motion Prompt.
// Mỗi hàm draw(k, t, T): t = giây trong cảnh, T.L(i, f) = lúc câu i đọc được f phần, T.E(i, x) = lúc câu i đọc xong + x.
// Đoạn ví dụ: script.py khai example = (câu đầu, câu cuối); ở đây khai rows (mỗi dòng hiện theo câu) và icon (vẽ trên nền kem).
// Các hàm hiệu ứng phải được gọi vô điều kiện để engine gom đủ tiếng; dùng layer(k, alpha, fn) thay cho if khi ẩn hiện.
import { C, P, circleMark, count, countLand, drawLine, eIO, eIn, eOut, ev, grow, lerp, pop, pulseRings, reveal, rr, scramble, shakeAt, slam, sweep, travel, txt } from '../../../motion/fx.mjs'
import * as ui from '../../../motion/ui.mjs'

const CX = 960

function layer(k, a, fn) {
	k.save(); k.globalAlpha *= Math.max(0, Math.min(1, a)); fn(); k.restore()
}
const fadeOut = (t, t0, d = 0.4) => 1 - P(t, t0 - d, t0)
const fadeIn = (t, t0, d = 0.4) => P(t, t0, t0 + d)
const at = (k, x, y, fn) => { k.save(); k.translate(x, y); fn(k); k.restore() }

function head(k, t, title, sub) {
	reveal(k, t, 0.1, CX, 150, title, { size: 64, sub, subSize: 30 })
}

function shake(k, t, times) {
	let dx = 0, dy = 0, r = 0
	for (const tI of times) { const [a, b, c] = shakeAt(t, tI); dx += a; dy += b; r += c }
	k.translate(CX + dx, 540 + dy); k.rotate(r); k.translate(-CX, -540)
}

function nodes(k, t, spots, t0, step = 0.12, opts = {}) {
	spots.forEach(([x, y, name], i) => pop(k, t, t0 + i * step, x, y, kk => ui.chip(kk, name, { keyIcon: true, ...opts })))
}

const N3 = [[560, 440, 'node X'], [1360, 440, 'node Y'], [CX, 860, 'node Z']]

// ---------------------------------------------------------------- 01 Bối cảnh

function s01(k, t, T) {
	const L = T.L
	head(k, t, 'Một Head, ba node', 'người chơi An có 100 ADA')
	layer(k, fadeIn(t, L(0, 0.1)), () => {
		k.strokeStyle = C.navy3; k.lineWidth = 4; k.setLineDash([14, 12]); rr(k, 380, 300, 1160, 680, 40); k.stroke(); k.setLineDash([])
	})
	pop(k, t, L(0, 0.15), 520, 300, kk => ui.pill(kk, 'Hydra Head', C.blue, { size: 30, fg: '#fff' }), { rot: false })
	nodes(k, t, N3, L(0, 0.45))
	for (let i = 0; i < 3; i++) {
		const a = N3[i], b = N3[(i + 1) % 3]
		travel(k, t, L(0, 0.8) + i * 0.15, 0.9, [[a[0], a[1]], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 40], [b[0], b[1]]], C.blue, { guide: false, sfx: i ? null : 'click' })
	}
	pop(k, t, L(1, 0.1), 1720, 850, kk => ui.person(kk, '#fff', 0.9), { rot: false })
	layer(k, fadeIn(t, L(1, 0.15)), () => txt(k, 'An', 1720, 960, 32, C.dim))
	pop(k, t, L(1, 0.35), 1300, 760, kk => ui.coin(kk))
	const sig = i => t > L(2, 0.5) + i * 0.15 + 0.6
	N3.forEach(([x, y], i) => travel(k, t, L(2, 0.5) + i * 0.15, 0.6, [[x, y], [CX + (i - 1) * 110, 650]], C.blue, { guide: false, sfx: null }))
	pop(k, t, L(2, 0.15), CX, 560, kk => ui.sheet(kk, { rows: [['An: 100', C.navy], ['Bình: 50', C.navy]], sigs: [0, 1, 2].filter(sig).length }), { rot: false })
	layer(k, fadeIn(t, L(2, 0.85)), () => txt(k, '"snapshot"', CX, 405, 28, C.dim, { mono: true }))
	circleMark(k, t, L(3, 0.4), CX, 560, 230, 165, C.mint)
	pop(k, t, L(3, 0.6), CX, 770, kk => ui.pill(kk, 'đủ 3 chữ ký mới có hiệu lực', C.mint, { size: 30 }), { rot: false })
}

// ---------------------------------------------------------------- 02 Gian lận

function s02(k, t, T) {
	const L = T.L
	shake(k, t, [L(2, 0.55) + 0.32])
	head(k, t, 'Nếu cả ba cùng gian lận', 'Cardano chỉ đếm chữ ký')
	const main = fadeOut(t, L(4, 0.0), 0.35)
	layer(k, main, () => {
		for (let i = 0; i < 3; i++) {
			const a = N3[i], b = N3[(i + 1) % 3]
			drawLine(k, t, L(0, 0.25) + i * 0.15, 0.6, [[a[0], a[1]], [b[0], b[1]]], C.coral, 8, { smooth: false, tip: false })
		}
		nodes(k, t, N3, 0.2, 0.08)
		N3.forEach(([x, y], i) => layer(k, P(t, L(0, 0.5), L(0, 0.6)), () => at(k, x, y, kk => pulseRings(kk, t, L(0, 0.5) + i * 0.1, q => { rr(q, -110, -48, 220, 96, 22) }, C.coral))))
		pop(k, t, L(0, 0.55), CX, 330, kk => ui.pill(kk, 'thông đồng', C.coral, { fg: '#fff' }), { rot: false })
		layer(k, fadeOut(t, L(1, 0.7), 0.3), () => pop(k, t, 0.3, 1300, 760, kk => ui.coin(kk), { sfx: null }))
		N3.forEach(([x, y], i) => travel(k, t, L(1, 0.55) + i * 0.08, 0.8, [[1300, 760], [x, y]], C.yel, { guide: false, sfx: i ? null : 'click' }))
		const rows = [['An: 100', C.navy, t > L(1, 0.35)], ['Bình: 50', C.navy]]
		if (t > L(1, 0.45)) rows.splice(1, 0, ['An: 0', C.coral])
		pop(k, t, L(1, 0.0), CX, 600, kk => ui.sheet(kk, { rows, h: 290, sigs: t > L(2, 0.1) ? 3 : 0 }), { rot: false })
		slam(k, t, L(2, 0.55), CX + 330, 780, kk => ui.pill(kk, 'Cardano: hợp lệ', C.mint, { size: 36 }))
	})
	// v1 → v2
	layer(k, fadeIn(t, L(4, 0.0)), () => {
		pop(k, t, L(4, 0.05), 560, 600, kk => {
			kk.fillStyle = C.navy2; rr(kk, -330, -200, 660, 400, 30); kk.fill()
			txt(kk, 'v1', 0, -120, 72, C.dim, { weight: 800 })
			txt(kk, 'chỉ theo dõi ký đều, ký chậm', 0, -10, 34, '#fff', { weight: 600 })
			txt(kk, 'chưa xử lý được gian lận', 0, 60, 34, C.coral, { weight: 700 })
		}, { rot: false })
		pop(k, t, L(5, 0.0), 1360, 600, kk => {
			kk.fillStyle = C.navy2; rr(kk, -330, -200, 660, 400, 30); kk.fill()
			kk.strokeStyle = C.blue; kk.lineWidth = 5; rr(kk, -330, -200, 660, 400, 30); kk.stroke()
			txt(kk, 'v2', 0, -120, 72, C.blue, { weight: 800 })
		}, { rot: false })
		;[['bằng chứng', C.mint, 0.3], ['phạt tự động', C.coral, 0.55], ['đền tiền', C.yel, 0.8]].forEach(([s, c, f], i) => {
			const g = grow(t, L(5, f))
			if (g > 0.01) at(k, 1360, 560 + i * 80, kk => { kk.scale(g, g); ui.pill(kk, s, c, { size: 32 }) })
		})
	})
}

// ---------------------------------------------------------------- 03 Biên lai

function s03(k, t, T) {
	const L = T.L
	head(k, t, 'Biên lai', 'từ Hydra 2.2.0')
	const A = fadeOut(t, L(3, 0.0))
	layer(k, A, () => {
		for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
			const i = r * 4 + c, x = 330 + c * 150, y = 420 + r * 110, isAn = r === 1 && c === 1
			const g = grow(t, L(0, 0.15), i, 0.06)
			if (g > 0.01) at(k, x, y, kk => { kk.scale(g, g); ui.coin(kk, isAn ? 'An 100' : '', { col: isAn ? C.yel : C.navy3, w: 120, h: 70, size: 26 }) })
		}
		;[0, 3, 5, 8, 10].forEach((i, j) => {
			const x = 330 + (i % 4) * 150, y = 420 + Math.floor(i / 4) * 110
			travel(k, t, L(0, 0.55) + j * 0.08, 0.8, [[x, y], [1000, 360], [1250, 520]], C.yel, { guide: false, r: 9, sfx: j ? null : 'click' })
		})
		pop(k, t, L(0, 0.6), 1350, 520, kk => { kk.fillStyle = C.blue; kk.beginPath(); kk.arc(0, 0, 120, 0, 7); kk.fill() }, { rot: false })
		scramble(k, t, L(0, 0.65), '9F3A·C7E1', 1350, 520, 40)
		layer(k, fadeIn(t, L(0, 0.8)), () => txt(k, 'mã tóm tắt số dư', 1350, 680, 34, '#fff', { weight: 700 }))
		circleMark(k, t, L(1, 0.1), 480, 530, 90, 55, C.mint)
		drawLine(k, t, L(1, 0.3), 1.0, [[560, 540], [800, 700], [1100, 690], [1250, 560]], C.mint, 9, { sfx: 'whoosh' })
		layer(k, fadeIn(t, L(1, 0.6)), () => txt(k, 'chứng minh: 100 ADA của An có trong bản chốt', CX, 790, 34, C.mint, { weight: 700 }))
		pop(k, t, L(2, 0.15), 1460, 420, kk => ui.check(kk, C.mint, 0.8))
		pop(k, t, L(2, 0.35), CX, 900, kk => ui.pill(kk, 'kiểm tra được trên Cardano', '#fff', { size: 34 }), { rot: false })
	})
	layer(k, fadeIn(t, L(3, 0.0)), () => {
		pop(k, t, L(3, 0.05), 300, 440, kk => ui.chip(kk, 'node X', { keyIcon: true }))
		pop(k, t, L(3, 0.1), 300, 640, kk => ui.chip(kk, 'phần mềm cạnh node', { w: 330, size: 28, col: C.dim }))
		pop(k, t, L(3, 0.15), 1640, 560, kk => ui.wallet(kk), { rot: false })
		layer(k, fadeIn(t, L(3, 0.2)), () => txt(k, 'ví của An', 1640, 680, 32, C.dim))
		travel(k, t, L(3, 0.2), 0.7, [[470, 640], [700, 640], [800, 600]], C.mint, { label: 'biên lai', guide: false })
		// biên lai bay vào ví và thu nhỏ
		const f = eIO(P(t, L(4, 0.1), L(4, 0.1) + 0.9))
		const x = lerp(CX, 1640, f), y = lerp(580, 560, f), s = lerp(1, 0.28, f)
		pop(k, t, L(3, 0.4), x, y, kk => {
			kk.scale(s, s)
			ui.sheet(kk, { title: 'biên lai', w: 520, h: 330, rows: [['bản chốt', C.navy], ['đủ 3 chữ ký X, Y, Z', C.navy], ['chứng minh 100 ADA của An', C.coral]] })
		}, { rot: false })
		pop(k, t, L(4, 0.65), 1640, 430, kk => ui.check(kk, C.mint, 0.9))
		pop(k, t, L(4, 0.75), 1640, 780, kk => ui.pill(kk, 'tự kiểm tra thật hay giả', C.mint, { size: 30 }), { rot: false })
	})
}

// ---------------------------------------------------------------- 04 Ký quỹ

function s04(k, t, T) {
	const L = T.L
	head(k, t, 'Tiền ký quỹ', 'khoá vào hợp đồng trên Cardano')
	const memA = t < L(1, 0) ? 1 : t < L(3, 0) ? 1 : 0.28
	const headA = t < L(1, 0) ? 1 : t < L(3, 0) ? 0.28 : 1
	;[560, CX, 1360].forEach((x, i) => {
		pop(k, t, L(0, 0.1) + i * 0.1, x, 330, kk => ui.chip(kk, 'XYZ'[i], { w: 140, h: 80 }))
		layer(k, memA, () => pop(k, t, L(0, 0.4) + i * 0.1, x - 90, 560, kk => ui.vault(kk, { w: 160, h: 130, col: '#fff', fill: P(t, L(0, 0.55), L(0, 0.9)) }), { rot: false }))
		layer(k, headA, () => pop(k, t, L(0, 0.5) + i * 0.1, x + 90, 560, kk => ui.vault(kk, { w: 160, h: 130, col: C.yel, fill: P(t, L(0, 0.65), L(0, 1.0)) }), { rot: false }))
	})
	layer(k, memA, () => pop(k, t, L(0, 0.8), 640, 730, kk => ui.pill(kk, 'ký quỹ thành viên', '#fff', { size: 30 }), { rot: false }))
	layer(k, headA, () => pop(k, t, L(0, 0.9), 1280, 730, kk => ui.pill(kk, 'ký quỹ theo từng Head', C.yel, { size: 30 }), { rot: false }))
	layer(k, fadeIn(t, L(1, 0.4)) * fadeOut(t, L(3, 0)), () => {
		txt(k, 'phạt khi ký chậm, không ký', CX, 850, 38, '#fff', { weight: 700 })
		layer(k, fadeIn(t, L(2, 0.2)), () => txt(k, 'mức phạt có giới hạn · được khiếu nại', CX, 920, 32, C.dim, { weight: 600 }))
	})
	layer(k, fadeIn(t, L(3, 0.4)), () => {
		txt(k, 'tính theo tiền trong Head · đền người chơi', CX, 850, 38, C.yel, { weight: 700 })
		layer(k, fadeIn(t, L(4, 0.2)), () => txt(k, 'hợp đồng tự xử lý · không ai can thiệp', CX + 30, 930, 34, '#fff', { weight: 700 }))
	})
	pop(k, t, L(4, 0.3), 560, 930, kk => ui.padlock(kk, C.mint, 0.9), { rot: false })
}

// ---------------------------------------------------------------- 05 Gian lận kiểu 1

function s05(k, t, T) {
	const L = T.L
	shake(k, t, [L(2, 0.7) + 0.32])
	head(k, t, 'Gian lận kiểu thứ nhất', 'hai bản chốt cùng số thứ tự')
	const fly = (x0, x1) => lerp(x0, x1, eOut(P(t, L(0, 0.35), L(0, 0.35) + 0.9)) + 0.04 * Math.sin(Math.PI * P(t, L(0, 0.35), L(0, 0.35) + 0.9)))
	ev(L(0, 0.35), 'whoosh')
	if (t > L(0, 0.35)) {
		at(k, fly(-400, 680), 540, kk => ui.sheet(kk, { title: 'bản chốt #42', rows: [['An: 100', C.navy], ['Bình: 50', C.navy]], sigs: 3 }))
		at(k, fly(2320, 1240), 540, kk => ui.sheet(kk, { title: 'bản chốt #42', rows: [['An: 0', C.coral], ['Bình: 150', C.coral]], sigs: 3 }))
	}
	pop(k, t, L(1, 0.1), CX, 540, kk => txt(kk, '≠', 0, 0, 140, C.coral, { weight: 800 }))
	pop(k, t, L(1, 0.45), CX, 745, kk => ui.pill(kk, 'một số thứ tự, chỉ một bản chốt', C.mint, { size: 30 }), { rot: false })
	pop(k, t, L(2, 0.0), 400, 920, kk => ui.person(kk, '#fff', 0.7), { rot: false })
	layer(k, fadeIn(t, L(2, 0.05)), () => txt(k, 'người nộp', 400, 1010, 28, C.dim))
	travel(k, t, L(2, 0.25), 0.7, [[680, 665], [CX, 900]], C.blue, { guide: false })
	travel(k, t, L(2, 0.3), 0.7, [[1240, 665], [CX, 900]], C.blue, { guide: false, sfx: null })
	pop(k, t, L(2, 0.35), CX, 920, kk => ui.gear(kk, '#fff', 50, (t - L(2, 0.35)) * 1.5), { rot: false, sfx: 'gear' })
	slam(k, t, L(2, 0.7), 1420, 920, kk => ui.pill(kk, 'phạt ngay', C.coral, { size: 40, fg: '#fff', h: 80 }))
	travel(k, t, L(3, 0.1), 0.9, [[CX, 920], [700, 980], [430, 900]], C.yel, { label: 'thưởng', guide: false })
}

// ---------------------------------------------------------------- 06 Gian lận kiểu 2

function s06(k, t, T) {
	const L = T.L
	shake(k, t, [L(2, 0.45) + 0.05])
	head(k, t, 'Gian lận kiểu thứ hai', 'lấy tiền của An')
	layer(k, fadeIn(t, L(0, 0.05)), () => { k.fillStyle = C.navy3; rr(k, 200, 296, 1520, 8, 4); k.fill() })
	pop(k, t, L(0, 0.05), 300, 300, kk => ui.pill(kk, 'Cardano', C.navy3, { size: 28, fg: '#fff' }), { rot: false })
	pop(k, t, L(0, 0.15), 680, 470, kk => ui.sheet(kk, { title: 'Head đóng · bản chốt cuối', w: 480, h: 190, rows: [['An: 0', C.coral]] }), { rot: false })
	pop(k, t, L(0, 0.45), 1260, 470, kk => ui.sheet(kk, { title: 'biên lai', w: 400, h: 190, rows: [['An: 100', C.navy]] }), { rot: false })
	pop(k, t, L(0, 0.7), 970, 470, kk => txt(kk, '≠', 0, 0, 110, C.coral, { weight: 800 }))
	circleMark(k, t, L(0, 0.8), 680, 500, 130, 50, C.coral)
	pop(k, t, L(1, 0.05), 330, 730, kk => ui.eye(kk, C.mint, 1), { rot: false })
	layer(k, fadeIn(t, L(1, 0.1)), () => txt(k, 'dịch vụ canh gác', 330, 810, 30, C.dim))
	pop(k, t, L(1, 0.35), CX, 730, kk => {
		kk.fillStyle = C.navy2; rr(kk, -230, -60, 460, 120, 26); kk.fill(); kk.strokeStyle = C.yel; kk.lineWidth = 4; rr(kk, -230, -60, 460, 120, 26); kk.stroke()
		txt(kk, 'thách thức', -60, 0, 36, '#fff', { weight: 800 })
		kk.translate(130, 0); ui.coin(kk, '5 ADA', { w: 130, h: 56, size: 26 })
	}, { rot: false })
	travel(k, t, L(1, 0.25), 0.6, [[400, 730], [720, 730]], C.mint, { label: 'biên lai', guide: false })
	;[560, CX, 1360].forEach((x, i) => {
		pop(k, t, L(2, 0.0) + i * 0.08, x, 940, kk => ui.vault(kk, { w: 170, h: 120, lock: P(t, L(2, 0.4), L(2, 0.5)) }), { rot: false })
		at(k, x, 940, kk => pulseRings(kk, t, L(2, 0.45) + i * 0.05, q => { rr(q, -95, -70, 190, 140, 24) }, C.coral))
	})
	pop(k, t, L(2, 0.55), 1690, 940, kk => ui.pill(kk, 'khoá ký quỹ', C.coral, { fg: '#fff', size: 30 }), { rot: false })
}

// ---------------------------------------------------------------- 07 48 giờ

function s07(k, t, T) {
	const L = T.L
	head(k, t, 'Bốn mươi tám giờ để trả lời', 'một trong hai cách')
	const v = count(t, L(0, 0.1), T.E(2) - L(0, 0.1), 48, 31)
	layer(k, fadeIn(t, L(0, 0.05)), () => {
		k.fillStyle = C.navy2; rr(k, CX - 220, 250, 440, 140, 30); k.fill()
		txt(k, `${Math.ceil(v)} giờ`, CX, 322, 76, C.yel, { weight: 800, mono: true })
	})
	drawLine(k, t, L(1, 0.0), 0.5, [[CX - 120, 390], [560, 500]], C.dim, 6, { smooth: false, tip: false })
	pop(k, t, L(1, 0.2), 560, 600, kk => {
		kk.fillStyle = C.navy2; rr(kk, -330, -110, 660, 220, 28); kk.fill()
		txt(kk, 'vẫn còn trong bản chốt cuối', 0, -50, 34, C.mint, { weight: 700 })
		kk.save(); kk.translate(-90, 40); ui.coin(kk, '100 ADA', { w: 180, h: 64, size: 28 }); kk.restore()
		kk.strokeStyle = C.mint; kk.lineWidth = 6; kk.beginPath(); kk.moveTo(0, 40); kk.lineTo(60, 40); kk.stroke()
		kk.fillStyle = '#fff'; rr(kk, 70, 5, 110, 70, 10); kk.fill(); kk.fillStyle = C.blue; rr(kk, 70, 5, 110, 20, [10, 10, 0, 0]); kk.fill()
	}, { rot: false })
	drawLine(k, t, L(2, 0.0), 0.5, [[CX + 120, 390], [1360, 500]], C.dim, 6, { smooth: false, tip: false })
	pop(k, t, L(2, 0.2), 1360, 600, kk => {
		kk.fillStyle = C.navy2; rr(kk, -330, -110, 660, 220, 28); kk.fill()
		txt(kk, 'giao dịch có chữ ký của An', 0, -50, 34, C.mint, { weight: 700 })
		kk.save(); kk.translate(-60, 40); ui.key(kk, C.yel, 1.4); kk.restore()
		kk.save(); kk.translate(60, 40); ui.check(kk, C.mint, 0.6); kk.restore()
	}, { rot: false })
	drawLine(k, t, L(3, 0.0), 0.5, [[560, 710], [CX - 60, 830]], C.mint, 7, { smooth: false, tip: false })
	drawLine(k, t, L(3, 0.0), 0.5, [[1360, 710], [CX + 60, 830]], C.mint, 7, { smooth: false, tip: false })
	layer(k, fadeOut(t, L(3, 0.3), 0.5), () => pop(k, t, 0.3, CX, 860, kk => ui.vault(kk, { w: 150, h: 110, lock: 1 }), { rot: false, sfx: null }))
	pop(k, t, L(3, 0.35), CX, 860, kk => ui.check(kk, C.mint, 1), { sfx: 'chime' })
	layer(k, fadeIn(t, L(3, 0.4)), () => txt(k, 'gỡ khoá ký quỹ', CX, 945, 32, C.mint, { weight: 700 }))
	layer(k, fadeIn(t, L(3, 0.5)), () => { txt(k, 'An', 300, 955, 30, C.dim); txt(k, 'node trả lời', 1640, 955, 30, C.dim) })
	travel(k, t, L(3, 0.6), 1.1, [[360, 1010], [CX, 1045], [1540, 1010]], C.yel, { label: '5 ADA', keep: true })
}

// ---------------------------------------------------------------- 08 Hết hạn

function s08(k, t, T) {
	const L = T.L
	shake(k, t, [L(0, 0.6) + 0.32])
	head(k, t, 'Không ai trả lời được', 'hợp đồng tự phạt ký quỹ')
	layer(k, fadeIn(t, L(0, 0.0)), () => {
		k.fillStyle = C.navy2; rr(k, 1380, 250, 420, 110, 26); k.fill()
		const s = countLand(t, L(0, 0.3))
		k.save(); k.translate(1590, 305); k.scale(s, s); txt(k, '0 giờ', 0, 0, 60, C.coral, { weight: 800, mono: true }); k.restore()
	})
	;[560, CX, 1360].forEach((x, i) => pop(k, t, L(0, 0.1) + i * 0.08, x, 470, kk => {
		ui.vault(kk, { w: 200, h: 150, lock: 1 })
		if (t > L(0, 0.6) + 0.32) { kk.strokeStyle = C.coral; kk.lineWidth = 7; kk.lineJoin = 'round'; kk.beginPath(); kk.moveTo(-10, -75); kk.lineTo(14, -30); kk.lineTo(-12, 5); kk.lineTo(16, 40); kk.lineTo(-4, 75); kk.stroke() }
	}, { rot: false }))
	slam(k, t, L(0, 0.6), 1660, 470, kk => ui.pill(kk, 'phạt', C.coral, { size: 44, fg: '#fff', h: 84 }))
	const dests = [[300, L(1, 0.15), 'đền 100 ADA', 'person'], [760, L(1, 0.55), 'thưởng', 'eye'], [1200, L(1, 0.82), 'trả lại 5 ADA cọc', 'eye'], [1640, L(2, 0.1), 'quỹ bảo hiểm', 'pool']]
	dests.forEach(([x, t0, label, kind], i) => {
		travel(k, t, t0 - 0.4, 0.75, [[CX, 560], [CX, 660], [x, 760]], C.yel, { guide: false, sfx: 'click' })
		pop(k, t, t0, x, 820, kk => {
			if (kind === 'person') ui.person(kk, '#fff', 0.75)
			else if (kind === 'eye') ui.eye(kk, C.mint, 0.8)
			else { kk.fillStyle = C.blue; rr(kk, -130, -70, 260, 140, 24); kk.fill(); txt(kk, 'quỹ', 0, -14, 34, '#fff', { weight: 800 }); txt(kk, 'bảo hiểm', 0, 28, 30, '#fff', { weight: 700 }) }
		}, { rot: false })
		if (kind !== 'pool') pop(k, t, t0 + 0.15, x, 930, kk => ui.pill(kk, label, C.yel, { size: 28 }), { rot: false, sfx: null })
	})
}

// ---------------------------------------------------------------- 09 Vì sao phạt cả ba

function s09(k, t, T) {
	const L = T.L
	head(k, t, 'Vì sao phạt cả ba?', 'bản chốt cuối có đủ ba chữ ký')
	const spots = [[480, 760, 'X'], [CX, 760, 'Y'], [1440, 760, 'Z']]
	const focusZ = t >= L(2, 0) && t < L(3, 0), focusXY = t >= L(3, 0)
	const a = i => (focusZ ? (i === 2 ? 1 : 0.28) : focusXY ? (i < 2 ? 1 : 0.28) : 1)
	pop(k, t, L(1, 0.0), CX, 420, kk => ui.sheet(kk, { title: 'bản chốt cuối', w: 400, h: 170, rows: [], sigs: 3 }), { rot: false })
	spots.forEach(([x, y, n], i) => {
		layer(k, a(i), () => {
			drawLine(k, t, L(1, 0.3) + i * 0.08, 0.5, [[CX + (i - 1) * 125, 505], [x, y - 50]], C.blue, 4, { smooth: false, tip: false })
			pop(k, t, L(1, 0.25) + i * 0.08, x, y, kk => ui.chip(kk, n, { w: 180 }))
		})
	})
	layer(k, focusXY ? 0.28 : 1, () => {
		pop(k, t, L(2, 0.05), 1440, 950, kk => ui.book(kk, C.mint, 0.55), { rot: false })
		travel(k, t, L(2, 0.35), 0.7, [[1520, 950], [1700, 900], [1700, 790]], C.mint, { guide: false })
		pop(k, t, L(2, 0.6), 1700, 760, kk => ui.check(kk, C.mint, 0.8))
		layer(k, fadeIn(t, L(2, 0.65)), () => txt(k, 'trả lời được', 1700, 680, 30, C.mint, { weight: 700 }))
	})
	circleMark(k, t, L(3, 0.15), 480, 760, 140, 75, C.coral)
	circleMark(k, t, L(3, 0.3), CX, 760, 140, 75, C.coral)
	pop(k, t, L(3, 0.5), 720, 920, kk => ui.pill(kk, 'gian lận hoặc làm mất dữ liệu', C.coral, { fg: '#fff', size: 30 }), { rot: false })
}

// ---------------------------------------------------------------- 10 Không có lời

function s10(k, t, T) {
	const L = T.L
	head(k, t, 'Gian lận không có lời', 'so sánh ký quỹ với tiền trong Head')
	const base = 840, nLeft = t < L(5, 0.15) ? 6 : 3
	for (let i = 0; i < 5; i++) {
		const g = grow(t, L(0, 0.3), i, 0.08)
		if (g > 0.01) at(k, 1200, base - i * 56, kk => { kk.scale(1, g); ui.stack(kk, 1, C.blue) })
	}
	for (let i = 0; i < 6; i++) {
		const t0 = i < 2 ? L(0, 0.5) + i * 0.1 : L(1, 0.05) + (i - 2) * 0.16
		const out = i >= 3 ? 1 - eIn(P(t, L(5, 0.15) + (5 - i) * 0.08, L(5, 0.15) + (5 - i) * 0.08 + 0.3)) : 1
		const g = grow(t, t0) * out
		if (g > 0.01) at(k, 720, base - i * 56, kk => { kk.scale(1, g); ui.stack(kk, 1, C.yel) })
	}
	layer(k, fadeIn(t, L(0, 0.25)), () => { txt(k, 'tổng ký quỹ', 720, 900, 34, C.yel, { weight: 700 }); txt(k, 'tiền trong Head', 1200, 900, 34, C.blue, { weight: 700 }) })
	layer(k, fadeOut(t, L(5, 0.15), 0.3), () => {
		pop(k, t, L(1, 0.5), CX, 650, kk => txt(kk, '≥', 0, 0, 130, C.mint, { weight: 800 }), { sfx: 'chime' })
		pop(k, t, L(1, 0.7), CX, 990, kk => ui.pill(kk, 'gian lận không có lời', C.mint, { size: 34 }), { rot: false })
	})
	// huy hiệu có dải sáng quét qua (#022)
	const ba = t >= L(5, 0.3) ? 0.3 : 1
	layer(k, ba, () => {
		pop(k, t, L(3, 0.15), CX, 300, kk => {
			const g = kk.createLinearGradient(-200, -56, 200, 56); g.addColorStop(0, '#1FB98C'); g.addColorStop(1, C.mint)
			kk.fillStyle = g; rr(kk, -200, -56, 400, 112, 28); kk.fill()
			txt(kk, 'BONDED', 0, 2, 52, C.navy, { weight: 800, ls: 3 })
		}, { rot: false, sfx: 'chime' })
		sweep(k, t, L(3, 0.25), CX - 200, 244, 400, 112, 28)
		layer(k, fadeIn(t, L(3, 0.65)), () => txt(k, 'ưu tiên hiển thị · chia phí cao hơn', CX, 395, 28, C.dim, { weight: 600 }))
	})
	pop(k, t, L(4, 0.2), 1600, 560, kk => {
		kk.fillStyle = C.navy2; rr(kk, -230, -90, 460, 180, 26); kk.fill()
		txt(kk, 'nhà cung cấp uy tín', 0, -30, 30, '#fff', { weight: 600 })
		txt(kk, 'giảm ký quỹ thành viên', 0, 30, 32, C.mint, { weight: 800 })
	}, { rot: false })
	pop(k, t, L(5, 0.35), CX, 650, kk => txt(kk, '<', 0, 0, 130, C.coral, { weight: 800 }))
	pop(k, t, L(5, 0.6), CX, 990, kk => ui.pill(kk, 'hiển thị số thật · đền theo tỷ lệ', C.yel, { size: 32 }), { rot: false })
}

// ---------------------------------------------------------------- 11 Hạn chế

function s11(k, t, T) {
	const L = T.L
	head(k, t, 'Những chỗ còn hạn chế', 'thời gian và phạm vi bảo vệ')
	const A = fadeOut(t, L(3, 0.0))
	layer(k, A, () => {
		drawLine(k, t, L(0, 0.0), 0.7, [[240, 470], [1680, 470]], C.navy3, 8, { smooth: false, tip: false })
		pop(k, t, L(0, 0.15), 400, 470, kk => { kk.fillStyle = '#fff'; rr(kk, -6, -40, 12, 80, 6); kk.fill() }, { rot: false })
		layer(k, fadeIn(t, L(0, 0.2)), () => txt(k, 'đóng Head', 400, 390, 34, '#fff', { weight: 700 }))
		const w = eIO(P(t, L(0, 0.5), L(0, 0.5) + 0.8)) * 600
		if (w > 1) { k.fillStyle = C.yel; rr(k, 410, 450, w, 40, 20); k.fill() }
		pop(k, t, L(0, 0.75), 710, 560, kk => ui.pill(kk, '~6–12 giờ', C.yel, { size: 36 }), { rot: false })
		for (let i = 0; i < 6; i++) {
			const g = grow(t, L(1, 0.3), i, 0.1)
			if (g > 0.01) at(k, 410 + i * 220, 720, kk => { kk.scale(g, g); ui.eye(kk, C.mint, 0.7) })
		}
		pop(k, t, L(1, 0.5), CX, 860, kk => ui.pill(kk, 'dịch vụ canh gác tự động', C.mint, { size: 34 }), { rot: false })
		layer(k, fadeIn(t, L(1, 0.8)), () => txt(k, 'ai cũng tự chạy được', CX, 950, 32, C.dim, { weight: 600 }))
	})
	layer(k, fadeIn(t, L(3, 0.0)), () => {
		const left = t >= L(4, 0.05) ? 0.3 : 1
		layer(k, left, () => pop(k, t, L(3, 0.1), 560, 600, kk => {
			kk.fillStyle = C.navy2; rr(kk, -340, -230, 680, 460, 32); kk.fill()
			kk.save(); kk.translate(0, -90); ui.wallet(kk, C.mint, 0.8); kk.restore()
			txt(kk, 'tiền đứng tên ví cá nhân', 0, 60, 38, '#fff', { weight: 800 })
			txt(kk, 'hợp đồng của game: cần quy tắc riêng', 0, 130, 28, C.dim, { weight: 600 })
		}, { rot: false }))
		pop(k, t, L(4, 0.1), 1360, 600, kk => {
			kk.fillStyle = C.navy2; rr(kk, -340, -230, 680, 460, 32); kk.fill()
			kk.strokeStyle = C.yel; kk.lineWidth = 5; rr(kk, -340, -230, 680, 460, 32); kk.stroke()
			kk.save(); kk.translate(0, -90); ui.bank(kk, C.yel, 0.6); kk.restore()
			txt(kk, 'tiền đứng tên nhà vận hành', 0, 60, 38, '#fff', { weight: 800 })
			txt(kk, 'bảo vệ nhà vận hành, chưa phải người chơi', 0, 130, 28, C.yel, { weight: 600 })
		}, { rot: false })
	})
}

// ---------------------------------------------------------------- 13 Kết

function s13(k, t, T) {
	const L = T.L
	layer(k, fadeOut(t, L(1, 0.0), 0.35), () => {
		;[['biên lai cho bằng chứng', C.mint, 0.12], ['ký quỹ có tiền đền', C.yel, 0.4], ['hợp đồng tự phạt', C.blue, 0.68]].forEach(([s, c, f], i) =>
			pop(k, t, L(0, f), CX, 360 + i * 170, kk => ui.pill(kk, s, c, { size: 56, h: 120, padX: 60, fg: c === C.blue ? '#fff' : C.navy }), { rot: false }))
	})
	reveal(k, t, L(1, 0.05), CX, 560, 'Trust Center', { size: 140, sub: 'Hydra delegated topology', subSize: 46 })
	layer(k, fadeIn(t, L(1, 0.6)), () => txt(k, 'Thực hiện cùng VTechcom Labs', 1860, 1030, 28, C.dim, { align: 'right', weight: 600 }))
}

// ---------------------------------------------------------------- thẻ ví dụ: biểu tượng trên nền kem

const two = (a, b, gap = 200) => k => { k.save(); k.translate(-gap / 2, 0); a(k); k.restore(); k.save(); k.translate(gap / 2, 0); b(k); k.restore() }

export default {
	'01': { draw: s01, example: { icon: k => ui.book(k, C.navy, 1.1), rows: [[4, 0.3, 'quỹ chung'], [4, 0.6, 'ba thủ quỹ cùng giữ sổ'], [5, 0.25, 'mỗi trang: đủ 3 chữ ký'], [5, 0.7, 'thiếu một: không tính', true]] } },
	'02': { draw: s02, example: { icon: k => ui.bank(k, C.navy, 1), rows: [[3, 0.1, 'lệnh chi: đủ 3 chữ ký'], [3, 0.35, 'ngân hàng chỉ đối chiếu chữ ký'], [3, 0.7, 'cả ba ký sai: vẫn chi', true]] } },
	'03': { draw: s03, example: { icon: k => ui.invoice(k, { label: 'BIÊN LAI', amount: '100 ADA' }), rows: [[5, 0.3, 'biên lai gửi tiền'], [5, 0.65, 'có chữ ký 3 thủ quỹ'], [6, 0.25, 'ai chối: đưa biên lai ra'], [6, 0.7, 'ai cũng đối chiếu được', true]] } },
	'04': { draw: s04, example: { icon: k => ui.house(k, C.navy, 1), rows: [[5, 0.3, 'tiền cọc thuê nhà'], [5, 0.7, 'làm hỏng đồ: trừ cọc'], [6, 0.3, 'cọc nằm trong hợp đồng'], [6, 0.7, 'chỉ hợp đồng được trừ', true]] } },
	'05': { draw: s05, example: { icon: two(k => ui.invoice(k, { amount: '100' }), k => ui.invoice(k, { amount: '0', amtCol: C.coral })), rows: [[4, 0.25, 'cùng một số hoá đơn'], [4, 0.6, 'hai bản, hai số tiền'], [5, 0.2, 'đặt hai tờ cạnh nhau'], [5, 0.6, 'là đủ bằng chứng', true]] } },
	'06': { draw: s06, example: { icon: k => ui.envelope(k, C.navy, 1), rows: [[3, 0.2, 'quầy khiếu nại'], [3, 0.55, 'đơn + biên lai + phí nhỏ'], [4, 0.35, 'phong toả cọc ba thủ quỹ', true]] } },
	'07': { draw: s07, example: { icon: k => ui.book(k, C.navy, 1.1), rows: [[4, 0.35, '48 giờ trình chứng từ'], [5, 0.2, 'tiền vẫn nằm trong sổ'], [5, 0.6, 'hoặc giấy rút tiền An đã ký', true]] } },
	'08': { draw: s08, example: { icon: k => ui.envelope(k, C.coral, 1), rows: [[3, 0.15, 'không ai trình được chứng từ'], [3, 0.6, 'tiền cọc trả cho An trước', true]] } },
	'09': { draw: s09, example: { icon: two(k => ui.person(k, C.navy, 1.1), k => ui.book(k, C.navy, 0.6), 220), rows: [[4, 0.1, 'thủ quỹ trung thực'], [4, 0.4, 'không ký lệnh chi sai'], [4, 0.72, 'luôn giữ sổ sách', true]] } },
	'10': { draw: s10, example: { icon: two(k => ui.stack(k, 3, C.navy, { w: 150, h: 34 }), k => ui.stack(k, 4, C.yel, { w: 150, h: 34 }), 200), rows: [[2, 0.1, 'giữ hộ 100 triệu'], [2, 0.4, 'đã đặt cọc 120 triệu'], [2, 0.75, 'ôm tiền trốn: chỉ thiệt thêm', true]] } },
	'11': { draw: s11, example: { icon: two(k => ui.person(k, C.navy, 1.1), k => ui.moon(k, C.yel, C.cream, 1), 200), rows: [[2, 0.15, 'thời hạn khiếu nại ngắn'], [2, 0.5, 'cần người trông nhà'], [2, 0.78, 'thức cả ngày lẫn đêm', true]] } },
	'13': { draw: s13 },
}
