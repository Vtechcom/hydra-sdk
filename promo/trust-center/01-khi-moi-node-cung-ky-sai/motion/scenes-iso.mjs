// Trust Center tập 1 — bản 2.5D isometric (bản chính của engine motion). Bản 2D giữ trong scenes.mjs để tham khảo.
//   promo/.venv-render/bin/python promo/motion/build.py <tập> --scenes scenes-iso.mjs --tag iso
// Thế giới chung: Cardano là mặt đất, Hydra Head là tấm nổi phía trên (chân chấm nối xuống), node, két ký quỹ, hợp đồng,
// cột tiền là khối hộp. Thẻ bản chốt, biên lai, người, con mắt canh gác là nhãn đứng (billboard) để chữ dễ đọc.
// Thẻ "Ví dụ" (split screen) và rows lấy từ scenes.mjs. Mọi hàm hiệu ứng gọi vô điều kiện; ẩn hiện bằng layer().
import base from './scenes.mjs'
import { C, P, backOut, circleMark, count, countLand, drawLine, eIO, eIOs, eIn, eOut, ev, grow, lerp, pop, reveal, scramble, shakeAt, slam, spring, sweep, travel, txt } from '../../../motion/fx.mjs'
import { box, dashed, label, ring, shadow, view } from '../../../motion/iso.mjs'
import * as ui from '../../../motion/ui.mjs'

const CX = 960
const ZH = 120, TH = 14, TOP = ZH + TH          // độ cao và bề dày tấm Head; TOP = mặt trên tấm
const NODES = [[-250, 120, 'node X'], [120, -250, 'node Y'], [150, 150, 'node Z']]   // (x, y) trên tấm Head
const NH = 110                                  // chiều cao khối node
const CARD = [-60, -60, TOP + 150]              // thẻ bản chốt lơ lửng phía trên tấm Head
const COIN = [300, -60], AN = [560, -140]
const VAULTS = [[-300, 300], [0, 300], [300, 300]]   // hàng két ký quỹ trên mặt đất, phía trước

// ---------------------------------------------------------------- tiện ích

function layer(k, a, fn) { k.save(); k.globalAlpha *= Math.max(0, Math.min(1, a)); fn(); k.restore() }
const fadeOut = (t, t0, d = 0.4) => 1 - P(t, t0 - d, t0)
const fadeIn = (t, t0, d = 0.4) => P(t, t0, t0 + d)
const V0 = (s = 0.83) => view(CX, 690, s)
function sorted(items) { items.sort((a, b) => a[0] - b[0]).forEach(([, draw]) => draw()) }

function head(k, t, title, sub) { reveal(k, t, 0.1, CX, 150, title, { size: 64, sub, subSize: 30 }) }

function shake(k, t, times) {
	let dx = 0, dy = 0, r = 0
	for (const tI of times) { const [a, b, c] = shakeAt(t, tI); dx += a; dy += b; r += c }
	k.translate(CX + dx, 540 + dy); k.rotate(r); k.translate(-CX, -540)
}

function caption(k, t, t0, s, col = C.mint, y = 1030, fg = C.navy) {
	pop(k, t, t0, CX, y, kk => ui.pill(kk, s, col, { size: 30, fg }), { rot: false })
}

// ---------------------------------------------------------------- dựng thế giới

function ground(k, V, t, t0 = null) {
	const g = t0 == null ? 1 : eOut(P(t, t0, t0 + 0.7))
	layer(k, g, () => box(k, V, 0, 0, -30 - (1 - g) * 120, 1120, 800, 30, C.navy3, { topCol: '#22346E' }))
	pop(k, t, t0 == null ? -1 : t0 + 0.1, 300, 690, kk => ui.pill(kk, 'Cardano', C.navy3, { size: 28, fg: '#fff' }), { rot: false, sfx: null })
}

// Tấm Head: rơi xuống nảy nhẹ (backOut, s = 1.6) nếu có t0; col đổi khi Head đã đóng. Trả về độ cao mặt trên.
function headPlate(k, V, t, { t0 = null, a = 1, col = C.blue, tag = 'Hydra Head' } = {}) {
	const hz = t0 == null ? ZH : lerp(ZH + 420, ZH, backOut(P(t, t0, t0 + 0.75), 1.6))
	const ha = (t0 == null ? 1 : P(t, t0, t0 + 0.2)) * a
	layer(k, ha * 0.5, () => {
		for (const [x, y] of [[-400, -280], [400, -280], [-400, 280], [400, 280]]) {
			const [p, q] = V.p(x, y, 0), [r, s] = V.p(x, y, hz)
			k.strokeStyle = col; k.lineWidth = 3; k.setLineDash([6, 10]); k.beginPath(); k.moveTo(p, q); k.lineTo(r, s); k.stroke(); k.setLineDash([])
		}
	})
	const fill = col === C.blue ? 'rgba(59,123,255,0.35)' : 'rgba(127,144,196,0.25)'
	layer(k, ha, () => box(k, V, 0, 0, hz, 800, 560, TH, col, { topCol: fill, edge: col }))
	layer(k, a, () => pop(k, t, t0 == null ? -1 : t0 + 0.2, 470, 490, kk => ui.pill(kk, tag, col, { size: 28, fg: '#fff' }), { rot: false, sfx: null }))
	return hz + TH
}

// Khối node trên tấm Head; h[i] = chiều cao hiện tại, alpha[i] = độ rõ (khi focus).
function nodeItems(k, V, top, h, alpha = [1, 1, 1], col = C.navy2) {
	return NODES.map(([x, y], i) => [x + y, () => layer(k, alpha[i], () => box(k, V, x, y, top, 110, 110, h[i], col, { edge: C.blue, topCol: '#2A3D80' }))])
}
function nodeLabels(k, V, t, top, h, t0, alpha = [1, 1, 1], names = null) {
	NODES.forEach(([x, y, n], i) => layer(k, alpha[i], () => label(k, V, x, y, top + h[i] + 34, kk =>
		pop(kk, t, t0 + i * 0.12, 0, 0, q => ui.chip(q, names ? names[i] : n, { w: 150, h: 56, size: 26, keyIcon: true }), { rot: false, sfx: null }))))
}
const nodeH = (t, t0) => [0, 1, 2].map(i => NH * grow(t, t0, i, 0.12))

// Két ký quỹ: thân xanh than, núm ở mặt trước, các lớp tiền trên nóc; lock = khung khoá đỏ, crack = vết nứt.
function vault(k, V, x, y, z, { fill = 1, lock = 0, crack = 0, col = C.yel, w = 110, h = 80 } = {}) {
	box(k, V, x, y, z, w, w, h, C.navy3, { topCol: '#33478F' })
	const [dx, dy] = V.p(x, y + w / 2, z + h / 2)
	k.strokeStyle = C.dim; k.lineWidth = 4; k.beginPath(); k.ellipse(dx, dy, 13, 15, 0, 0, 7); k.stroke()
	const n = Math.round(fill * 3)
	for (let i = 0; i < n; i++) box(k, V, x, y, z + h + i * 14, w - 24, w - 24, 10, col)
	if (crack > 0) {
		k.save(); k.globalAlpha *= crack; k.strokeStyle = C.coral; k.lineWidth = 6; k.lineJoin = 'round'; k.beginPath()
		;[[-30, h], [-8, h * 0.7], [-24, h * 0.45], [0, h * 0.2], [-12, 0]].forEach(([ox, oz], i) => { const [p, q] = V.p(x + ox, y + w / 2, z + oz); i ? k.lineTo(p, q) : k.moveTo(p, q) })
		k.stroke(); k.restore()
	}
	if (lock > 0) {
		k.save(); k.globalAlpha *= lock
		ring(k, V, x, y, z + 2, w * 0.85, C.coral, 7)
		label(k, V, x, y, z + h + n * 14 + 50, kk => ui.padlock(kk, C.coral, 0.75))
		k.restore()
	}
}

// Hợp đồng trên Cardano: khối xanh than viền mint, bánh răng đứng quay phía trên.
function contract(k, V, t, x, y, t0, { name = 'hợp đồng', spin = 0 } = {}) {
	const g = grow(t, t0)
	layer(k, fadeIn(t, t0, 0.15), () => box(k, V, x, y, 0, 160, 160, 90 * g, C.navy2, { edge: C.mint, topCol: '#24366F' }))
	label(k, V, x, y, 90 * g + 70, kk => pop(kk, t, t0 + 0.15, 0, 0, q => ui.gear(q, '#fff', 40, spin), { rot: false, sfx: 'gear' }))
	label(k, V, x, y, -10, kk => layer(kk, fadeIn(t, t0 + 0.2), () => { kk.translate(0, 70); ui.pill(kk, name, C.mint, { size: 26 }) }))
	return 90 * g
}

// Cột tiền: chồng các tầng mỏng; levels có thể lẻ (tầng trên cùng đang mọc).
function pillar(k, V, x, y, levels, col, { w = 150, step = 50, h = 40 } = {}) {
	for (let i = 0; i < Math.ceil(levels); i++) {
		const f = Math.min(1, levels - i)
		if (f > 0.01) box(k, V, x, y, i * step, w, w, h * f, col)
	}
}

// Vòng lan trên mặt phẳng (#125 Pulse): mỗi nhịp 1.175 s, hai vòng ở 0.16 s và 0.40 s, bán kính 1.2→2.4 lần (cubic out).
function isoPulse(k, V, t, t0, x, y, z, col, r0 = 70) {
	ev(t0, 'thud')
	if (t < t0) return
	const lu = (t - t0) % 1.175
	for (const [s0, a] of [[0.16, 1], [0.4, 0.6]]) {
		const q = P(lu, s0, s0 + 0.8)
		if (q <= 0 || q >= 1) continue
		k.save(); k.globalAlpha *= (1 - q) * 0.75 * a; ring(k, V, x, y, z, r0 * (1.2 + 1.2 * eOut(q)), col, 7 * (1 - q) + 1.5); k.restore()
	}
}

function person(k, V, t, x, y, z, t0, name, col = '#fff') {
	label(k, V, x, y, z, kk => pop(kk, t, t0, 0, -60, q => ui.person(q, col, 0.8), { rot: false }))
	if (name) label(k, V, x, y, z, kk => layer(kk, fadeIn(t, t0 + 0.05), () => txt(kk, name, 0, 30, 28, C.dim)))
}
function eyeAt(k, V, t, x, y, z, t0, name) {
	label(k, V, x, y, z, kk => pop(kk, t, t0, 0, -50, q => ui.eye(q, C.mint, 0.8), { rot: false }))
	if (name) label(k, V, x, y, z, kk => layer(kk, fadeIn(t, t0 + 0.05), () => txt(kk, name, 0, 20, 26, C.dim)))
}

// ---------------------------------------------------------------- 01 Bối cảnh

function s01(k, t, T) {
	const L = T.L
	// camera zoom chậm suốt cảnh (kiểu #028 Zoom in của pack camera): tỉ lệ 0.80 → 0.86
	const V = view(CX, 690, lerp(0.8, 0.86, eIOs(P(t, 0, T.total))))
	head(k, t, 'Một Head, ba node', 'người chơi An có 100 ADA')
	ground(k, V, t, L(0, 0.0))
	const top = headPlate(k, V, t, { t0: L(0, 0.15) })
	const cardIn = spring(t - L(2, 0.15), 15, 6.5)
	layer(k, Math.min(1, cardIn), () => shadow(k, V, CARD[0], CARD[1], top, 110 * Math.min(1, cardIn), 0.22))
	ring(k, V, CARD[0], CARD[1], top, 150, C.mint, 7, eIO(P(t, L(3, 0.35), L(3, 0.35) + 0.6)))
	const h = nodeH(t, L(0, 0.45))
	ev(L(0, 0.45), 'tick')
	const cz = lerp(top + 160, top, backOut(P(t, L(1, 0.3), L(1, 0.3) + 0.55), 2))
	const items = nodeItems(k, V, top, h)
	items.push([COIN[0] + COIN[1], () => layer(k, P(t, L(1, 0.3), L(1, 0.3) + 0.1), () => box(k, V, COIN[0], COIN[1], cz, 130, 130, 16, C.yel))])
	sorted(items)
	layer(k, P(t, L(1, 0.5), L(1, 0.7)), () => dashed(k, V, [[AN[0], AN[1], 0], [COIN[0] + 40, COIN[1], top]], C.dim))
	person(k, V, t, AN[0], AN[1], 0, L(1, 0.05), 'An')
	for (let i = 0; i < 3; i++) {
		const a = NODES[i], b = NODES[(i + 1) % 3]
		const pts = [V.p(a[0], a[1], top + 4), V.p((a[0] + b[0]) / 2 + 40, (a[1] + b[1]) / 2 + 40, top + 4), V.p(b[0], b[1], top + 4)]
		travel(k, t, L(0, 0.85) + i * 0.15, 0.9, pts, C.mint, { guide: false, r: 10, sfx: i ? null : 'click' })
	}
	nodeLabels(k, V, t, top, h, L(0, 0.6))
	label(k, V, COIN[0], COIN[1], cz + 50, kk => pop(kk, t, L(1, 0.45), 0, 0, q => ui.coin(q, '100 ADA', { w: 150, h: 52, size: 24 }), { rot: false }))
	const [cx, cy] = V.p(...CARD)
	NODES.forEach(([x, y], i) => travel(k, t, L(2, 0.5) + i * 0.15, 0.6, [V.p(x, y, top + NH), [cx + (i - 1) * 85, cy + 90]], C.blue, { guide: false, sfx: null }))
	const sigs = [0, 1, 2].filter(i => t > L(2, 0.5) + i * 0.15 + 0.6).length
	const bob = Math.sin(t * 1.6) * 6
	pop(k, t, L(2, 0.15), cx, cy + bob, kk => { kk.scale(0.75, 0.75); ui.sheet(kk, { rows: [['An: 100', C.navy], ['Bình: 50', C.navy]], sigs }) }, { rot: false })
	layer(k, P(t, L(2, 0.85), L(2, 0.95)), () => txt(k, '"snapshot"', cx, cy - 118 + bob, 26, C.dim, { mono: true }))
	caption(k, t, L(3, 0.6), 'đủ 3 chữ ký mới có hiệu lực')
}

// ---------------------------------------------------------------- 02 Gian lận

function s02(k, t, T) {
	const L = T.L, V = V0()
	shake(k, t, [L(2, 0.75) + 0.32])
	head(k, t, 'Nếu cả ba cùng gian lận', 'Cardano chỉ đếm chữ ký')
	ground(k, V, t)
	layer(k, fadeOut(t, L(4, 0.0), 0.35), () => {
		const top = headPlate(k, V, t)
		const h = nodeH(t, 0.1)
		layer(k, fadeOut(t, L(1, 0.7), 0.3), () => box(k, V, COIN[0], COIN[1], top, 130, 130, 16, C.yel))
		sorted(nodeItems(k, V, top, h))
		NODES.forEach(([x, y], i) => isoPulse(k, V, t, L(0, 0.5) + i * 0.1, x, y, top + 2, C.coral))
		for (let i = 0; i < 3; i++) {
			const a = NODES[i], b = NODES[(i + 1) % 3]
			drawLine(k, t, L(0, 0.25) + i * 0.15, 0.6, [V.p(a[0], a[1], top + NH), V.p(b[0], b[1], top + NH)], C.coral, 7, { smooth: false, tip: false })
		}
		nodeLabels(k, V, t, top, h, 0.2)
		pop(k, t, L(0, 0.6), CX + 360, 290, kk => ui.pill(kk, 'thông đồng', C.coral, { fg: '#fff' }), { rot: false })
		NODES.forEach(([x, y], i) => travel(k, t, L(1, 0.55) + i * 0.08, 0.8, [V.p(COIN[0], COIN[1], top + 20), V.p(x, y, top + NH)], C.yel, { guide: false, sfx: i ? null : 'click' }))
		// bản chốt gian lận rơi từ trên tấm Head xuống mặt đất Cardano và được nhận
		const rows = [['An: 100', C.navy, t > L(1, 0.35)], ['Bình: 50', C.navy]]
		if (t > L(1, 0.45)) rows.splice(1, 0, ['An: 0', C.coral])
		const [cx, cy] = V.p(...CARD), [gx, gy] = V.p(150, 390, 0)
		const f = eIn(P(t, L(2, 0.4), L(2, 0.4) + 0.55))
		const x = lerp(cx, gx, f), y = lerp(cy, gy - 110, f)
		pop(k, t, L(1, 0.0), x, y, kk => { kk.scale(0.75, 0.75); ui.sheet(kk, { rows, h: 290, sigs: t > L(2, 0.1) ? 3 : 0 }) }, { rot: false })
		slam(k, t, L(2, 0.75), gx + 250, gy - 60, kk => ui.pill(kk, 'Cardano: hợp lệ', C.mint, { size: 34 }))
	})
	// v1 → v2: hai bệ trên mặt đất
	layer(k, fadeIn(t, L(4, 0.0)), () => {
		const lg = grow(t, L(4, 0.05)), rg = grow(t, L(5, 0.0))
		box(k, V, -250, 150, 0, 260, 260, 60 * lg, C.navy2, { topCol: '#24366F' })
		layer(k, fadeIn(t, L(5, 0.0), 0.15), () => box(k, V, 150, -250, 0, 260, 260, 60 * rg, C.navy2, { edge: C.blue, topCol: '#24366F' }))
		label(k, V, -250, 150, 60 * lg + 50, kk => pop(kk, t, L(4, 0.15), 0, 0, q => txt(q, 'v1', 0, 0, 72, C.dim, { weight: 800 }), { rot: false }))
		label(k, V, -250, 150, 0, kk => layer(kk, fadeIn(t, L(4, 0.35)), () => {
			txt(kk, 'chỉ theo dõi ký đều, ký chậm', 0, 150, 30, '#fff', { weight: 600 })
			layer(kk, fadeIn(t, L(4, 0.7)), () => txt(kk, 'chưa xử lý được gian lận', 0, 200, 30, C.coral, { weight: 700 }))
		}))
		label(k, V, 150, -250, 60 * rg + 50, kk => pop(kk, t, L(5, 0.1), 0, 0, q => txt(q, 'v2', 0, 0, 72, C.blue, { weight: 800 }), { rot: false }))
		;[['bằng chứng', C.mint, 0.3], ['phạt tự động', C.coral, 0.55], ['đền tiền', C.yel, 0.8]].forEach(([s, c, f], i) => {
			label(k, V, 150, -250, 0, kk => pop(kk, t, L(5, f), 0, 120 + i * 78, q => ui.pill(q, s, c, { size: 30 }), { rot: false }))
		})
	})
}

// ---------------------------------------------------------------- 03 Biên lai

const ORB = [260, -200, TOP + 300], CHECK_G = [520, -330, 0]

function s03(k, t, T) {
	const L = T.L, V = V0()
	head(k, t, 'Biên lai', 'từ Hydra 2.2.0')
	ground(k, V, t)
	const A = fadeOut(t, L(3, 0.0))
	layer(k, A, () => {
		const top = headPlate(k, V, t)
		const tiles = []
		for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) tiles.push([-300 + c * 120, -150 + r * 120, r === 1 && c === 1])
		ev(L(0, 0.15), 'tick')
		tiles.forEach(([x, y, isAn], i) => {
			const g = grow(t, L(0, 0.15), i, 0.05)
			if (g > 0.01) box(k, V, x, y, top, 90, 90, 12 * g, isAn ? C.yel : C.navy3)
		})
		const an = tiles.find(q => q[2])
		label(k, V, an[0], an[1], top + 40, kk => pop(kk, t, L(0, 0.4), 0, 0, q => ui.coin(q, 'An 100', { w: 120, h: 46, size: 22 }), { rot: false, sfx: null }))
		const [ox, oy] = V.p(...ORB)
		tiles.filter((_, i) => i % 2 === 0).forEach(([x, y], j) => travel(k, t, L(0, 0.55) + j * 0.07, 0.8, [V.p(x, y, top + 12), [ox, oy + 60]], C.yel, { guide: false, r: 8, sfx: j ? null : 'click' }))
		pop(k, t, L(0, 0.6), ox, oy, kk => { kk.fillStyle = C.blue; kk.beginPath(); kk.arc(0, 0, 105, 0, 7); kk.fill() }, { rot: false })
		scramble(k, t, L(0, 0.65), '9F3A·C7E1', ox, oy, 34)
		layer(k, fadeIn(t, L(0, 0.8)), () => txt(k, 'mã tóm tắt số dư', ox, oy - 140, 32, '#fff', { weight: 700 }))
		ring(k, V, an[0], an[1], top + 2, 85, C.mint, 7, eIO(P(t, L(1, 0.1), L(1, 0.1) + 0.6)))
		ev(L(1, 0.1), 'strike')
		drawLine(k, t, L(1, 0.3), 1.0, [V.p(an[0], an[1], top + 20), V.p(an[0] + 150, an[1] - 150, top + 220), [ox - 80, oy + 40]], C.mint, 8, { sfx: 'whoosh' })
		caption(k, t, L(1, 0.6), 'chứng minh: 100 ADA của An có trong bản chốt', C.mint, 1030)
		pop(k, t, L(2, 0.1), ox + 90, oy - 80, kk => ui.check(kk, C.mint, 0.7))
		const [gx, gy] = V.p(...CHECK_G)
		drawLine(k, t, L(2, 0.2), 0.6, [[ox, oy + 105], [gx, gy - 10]], C.mint, 6, { smooth: false })
		label(k, V, ...CHECK_G, kk => pop(kk, t, L(2, 0.5), 0, 40, q => ui.pill(q, 'kiểm tra được trên Cardano', '#fff', { size: 28 }), { rot: false }))
	})
	layer(k, fadeIn(t, L(3, 0.0)), () => {
		const top = headPlate(k, V, t)
		box(k, V, -250, 120, top, 110, 110, NH, C.navy2, { edge: C.blue, topCol: '#2A3D80' })
		box(k, V, -60, 230, top, 120, 90, 50 * grow(t, L(3, 0.1)), C.navy3, { edge: C.dim, topCol: '#33478F' })
		label(k, V, -250, 120, top + NH + 34, kk => pop(kk, t, L(3, 0.05), 0, 0, q => ui.chip(q, 'node X', { w: 150, h: 56, size: 26, keyIcon: true }), { rot: false }))
		label(k, V, -60, 230, top + 50, kk => pop(kk, t, L(3, 0.15), 0, 40, q => ui.pill(q, 'phần mềm cạnh node', C.navy3, { size: 24, fg: '#fff' }), { rot: false }))
		label(k, V, AN[0], AN[1], 0, kk => pop(kk, t, L(3, 0.15), 0, -70, q => ui.wallet(q, C.yel, 0.7), { rot: false }))
		label(k, V, AN[0], AN[1], 0, kk => layer(kk, fadeIn(t, L(3, 0.2)), () => txt(kk, 'ví của An', 0, 20, 28, C.dim)))
		const [sx, sy] = V.p(-60, 230, top + 50), [wx, wy] = V.p(AN[0], AN[1], 0)
		travel(k, t, L(3, 0.2), 0.7, [[sx, sy], [CX - 20, 480]], C.mint, { label: 'biên lai', guide: false })
		const f = eIO(P(t, L(4, 0.1), L(4, 0.1) + 0.9))
		pop(k, t, L(3, 0.4), lerp(CX + 100, wx, f), lerp(420, wy - 70, f), kk => {
			const s = lerp(0.85, 0.22, f); kk.scale(s, s)
			ui.sheet(kk, { title: 'biên lai', w: 520, h: 330, rows: [['bản chốt', C.navy], ['đủ 3 chữ ký X, Y, Z', C.navy], ['chứng minh 100 ADA của An', C.coral]] })
		}, { rot: false })
		pop(k, t, L(4, 0.65), wx, wy - 170, kk => ui.check(kk, C.mint, 0.8))
		caption(k, t, L(4, 0.75), 'ví tự kiểm tra thật hay giả')
	})
}

// ---------------------------------------------------------------- 04 Ký quỹ

function s04(k, t, T) {
	const L = T.L, V = V0()
	head(k, t, 'Tiền ký quỹ', 'khoá vào hợp đồng trên Cardano')
	ground(k, V, t)
	const memA = t >= L(1, 0) && t >= L(3, 0) ? 0.3 : 1
	const headA = t >= L(1, 0) && t < L(3, 0) ? 0.3 : 1
	layer(k, fadeIn(t, L(0, 0.0)), () => box(k, V, 0, 70, 0, 1000, 330, 8, C.navy2, { edge: C.mint, topCol: '#1E2F66' }))
	label(k, V, 500, -95, 0, kk => pop(kk, t, L(0, 0.75), 60, -30, q => ui.pill(q, 'hợp đồng trên Cardano', C.mint, { size: 24 }), { rot: false }))
	const xs = [-330, 0, 330]
	ev(L(0, 0.1), 'tick')
	const items = []
	xs.forEach((bx, i) => {
		items.push([bx - 260, () => box(k, V, bx, -260, 0, 100, 100, 90 * grow(t, L(0, 0.1), i), C.navy2, { edge: C.blue, topCol: '#2A3D80' })])
		items.push([bx - 70 + 70, () => layer(k, memA, () => vault(k, V, bx - 75, 70, 8, { col: '#fff', fill: P(t, L(0, 0.5), L(0, 0.9)), w: 100, h: 70 * grow(t, L(0, 0.35), i) }))])
		items.push([bx + 75 + 70, () => layer(k, headA, () => vault(k, V, bx + 75, 70, 8, { col: C.yel, fill: P(t, L(0, 0.6), L(0, 1.0)), w: 100, h: 70 * grow(t, L(0, 0.45), i) }))])
	})
	sorted(items)
	xs.forEach((bx, i) => {
		label(k, V, bx, -260, 140, kk => pop(kk, t, L(0, 0.2) + i * 0.1, 0, 0, q => ui.chip(q, 'XYZ'[i], { w: 90, h: 56, size: 28 }), { rot: false, sfx: null }))
		layer(k, 0.5 * fadeIn(t, L(0, 0.5)), () => { dashed(k, V, [[bx, -210, 0], [bx - 75, 20, 8]], C.dim, 4); dashed(k, V, [[bx, -210, 0], [bx + 75, 20, 8]], C.dim, 4) })
	})
	layer(k, fadeOut(t, L(3, 0)), () => {
		layer(k, memA, () => caption(k, t, L(1, 0.05), 'ký quỹ thành viên', '#fff', 900))
		layer(k, fadeIn(t, L(1, 0.4)), () => txt(k, 'phạt khi ký chậm, không ký', CX, 970, 34, '#fff', { weight: 700 }))
		layer(k, fadeIn(t, L(2, 0.2)), () => txt(k, 'mức phạt có giới hạn · được khiếu nại', CX, 1025, 30, C.dim, { weight: 600 }))
	})
	layer(k, fadeIn(t, L(3, 0.0)), () => {
		caption(k, t, L(3, 0.1), 'ký quỹ theo từng Head', C.yel, 900)
		layer(k, fadeIn(t, L(3, 0.5)), () => txt(k, 'tính theo tiền trong Head · đền người chơi', CX, 970, 34, C.yel, { weight: 700 }))
		layer(k, fadeIn(t, L(4, 0.2)), () => txt(k, 'hợp đồng tự xử lý · không ai can thiệp', CX, 1025, 30, '#fff', { weight: 700 }))
	})
}

// ---------------------------------------------------------------- 05 Gian lận kiểu 1

const CT = [480, -100]   // hợp đồng trên mặt đất, bên phải tấm Head

function s05(k, t, T) {
	const L = T.L, V = V0()
	shake(k, t, [L(2, 0.75) + 0.32])
	head(k, t, 'Gian lận kiểu thứ nhất', 'hai bản chốt cùng số thứ tự')
	ground(k, V, t)
	layer(k, 0.45, () => { const top = headPlate(k, V, t); const h = [NH, NH, NH]; sorted(nodeItems(k, V, top, h)) })
	const ch = contract(k, V, t, CT[0], CT[1], L(2, 0.0), { spin: (t - L(2, 0.0)) * 1.5 })
	person(k, V, t, -200, 380, 0, L(2, 0.0), 'người nộp')
	ev(L(0, 0.35), 'whoosh')
	const fl = eOut(P(t, L(0, 0.35), L(0, 0.35) + 0.9))
	const down = eIO(P(t, L(2, 0.2), L(2, 0.2) + 0.7))
	const [cx, cy] = V.p(CT[0], CT[1], ch + 40)
	const sheetAt = (x0, x1, rows) => {
		if (t < L(0, 0.35)) return
		const x = lerp(lerp(x0, x1, fl), cx, down), y = lerp(330, cy, down), s = lerp(0.8, 0.15, down)
		if (down < 0.98) { k.save(); k.translate(x, y); k.scale(s, s); ui.sheet(k, { title: 'bản chốt #42', rows, sigs: 3 }); k.restore() }
	}
	sheetAt(-400, 700, [['An: 100', C.navy], ['Bình: 50', C.navy]])
	sheetAt(2320, 1220, [['An: 0', C.coral], ['Bình: 150', C.coral]])
	layer(k, fadeOut(t, L(2, 0.25), 0.3), () => pop(k, t, L(1, 0.1), CX, 330, kk => txt(kk, '≠', 0, 0, 130, C.coral, { weight: 800 })))
	caption(k, t, L(1, 0.45), 'một số thứ tự, chỉ một bản chốt')
	slam(k, t, L(2, 0.75), cx, cy - 150, kk => ui.pill(kk, 'phạt ngay', C.coral, { size: 40, fg: '#fff', h: 80 }))
	const [px, py] = V.p(-200, 380, 0)
	travel(k, t, L(3, 0.1), 1.0, [[cx, cy], [CX, 560], [px, py - 140]], C.yel, { label: 'thưởng', guide: false })
}

// ---------------------------------------------------------------- 06 Gian lận kiểu 2

const CC = [-100, -150]   // hợp đồng giữa mặt đất (khi Head đã đóng)

function s06(k, t, T) {
	const L = T.L, V = V0()
	shake(k, t, [L(2, 0.45) + 0.05])
	head(k, t, 'Gian lận kiểu thứ hai', 'lấy tiền của An')
	ground(k, V, t)
	// Head đóng: tấm chuyển xám rồi tan, bản chốt cuối rơi xuống mặt đất
	const close = fadeOut(t, L(0, 0.5), 0.5)
	headPlate(k, V, t, { a: close, col: t < L(0, 0.15) ? C.blue : C.dim, tag: 'Head đóng' })
	const [gx, gy] = V.p(-560, 120, 0)
	const f = eIn(P(t, L(0, 0.15), L(0, 0.15) + 0.5))
	pop(k, t, L(0, 0.05), lerp(CX, gx, f), lerp(330, gy - 100, f), kk => { kk.scale(0.7, 0.7); ui.sheet(kk, { title: 'bản chốt cuối', w: 420, h: 200, rows: [['An: 0', C.coral]] }) }, { rot: false })
	circleMark(k, t, L(0, 0.75), gx, gy - 88, 120, 40, C.coral)
	const W = [480, -250], [wx, wy] = V.p(W[0], W[1], 0)
	eyeAt(k, V, t, W[0], W[1], 0, L(0, 0.35), 'dịch vụ canh gác')
	pop(k, t, L(0, 0.45), wx, wy - 230, kk => { kk.scale(0.7, 0.7); ui.sheet(kk, { title: 'biên lai', w: 380, h: 200, rows: [['An: 100', C.navy]] }) }, { rot: false })
	pop(k, t, L(0, 0.7), (gx + wx) / 2, 470, kk => txt(kk, '≠', 0, 0, 110, C.coral, { weight: 800 }))
	const chH = contract(k, V, t, CC[0], CC[1], L(1, 0.3), { name: 'thách thức + 5 ADA cọc' })
	const [cx, cy] = V.p(CC[0], CC[1], chH)
	travel(k, t, L(1, 0.45), 0.7, [[wx, wy - 230], [cx + 40, cy - 20]], C.mint, { label: 'biên lai', guide: false })
	travel(k, t, L(1, 0.65), 0.7, [[wx, wy - 60], [cx + 40, cy]], C.yel, { label: '5 ADA', guide: false, sfx: null })
	const lock = P(t, L(2, 0.4), L(2, 0.5))
	ev(L(2, 0.0), 'tick')
	layer(k, fadeIn(t, L(2, 0.0), 0.2), () => sorted(VAULTS.map(([x, y], i) => [x + y, () => vault(k, V, x, y, 0, { h: 80 * grow(t, L(2, 0.0), i, 0.08), lock })])))
	VAULTS.forEach(([x, y], i) => isoPulse(k, V, t, L(2, 0.45) + i * 0.05, x, y, 2, C.coral, 75))
	caption(k, t, L(2, 0.55), 'khoá ký quỹ của cả ba node', C.coral, 1030, '#fff')
}

// ---------------------------------------------------------------- 07 48 giờ

function s07(k, t, T) {
	const L = T.L, V = V0()
	head(k, t, 'Bốn mươi tám giờ để trả lời', 'một trong hai cách')
	ground(k, V, t)
	const chH = contract(k, V, t, CC[0], CC[1], -1, { name: 'thách thức' })
	const [cx, cy] = V.p(CC[0], CC[1], chH)
	const v = count(t, L(0, 0.1), T.E(2) - L(0, 0.1), 48, 31)
	layer(k, fadeIn(t, L(0, 0.05)), () => {
		k.save(); k.translate(cx, cy - 190); k.fillStyle = C.navy2; k.beginPath(); k.roundRect(-160, -55, 320, 110, 28); k.fill()
		txt(k, `${Math.ceil(v)} giờ`, 0, 2, 60, C.yel, { weight: 800, mono: true }); k.restore()
	})
	const lock = 1 - P(t, L(3, 0.3), L(3, 0.6))
	sorted(VAULTS.map(([x, y]) => [x + y, () => vault(k, V, x, y, 0, { lock })]))
	pop(k, t, L(1, 0.15), 400, 420, kk => {
		kk.scale(0.8, 0.8); ui.sheet(kk, { title: 'vẫn còn trong bản chốt cuối', w: 460, h: 200, rows: [['An: 100', C.navy]] })
	}, { rot: false })
	travel(k, t, L(1, 0.55), 0.7, [[400, 500], [cx - 60, cy - 40]], C.mint, { guide: false })
	pop(k, t, L(2, 0.15), 1450, 500, kk => {
		kk.scale(0.8, 0.8); ui.sheet(kk, { title: 'giao dịch có chữ ký của An', w: 460, h: 200, rows: [] })
		kk.save(); kk.translate(-50, 30); ui.key(kk, C.yel, 1.3); kk.restore(); kk.save(); kk.translate(60, 30); ui.check(kk, C.mint, 0.55); kk.restore()
	}, { rot: false })
	travel(k, t, L(2, 0.55), 0.7, [[1450, 580], [cx + 60, cy - 40]], C.mint, { guide: false, sfx: null })
	pop(k, t, L(3, 0.2), cx + 230, cy - 190, kk => ui.check(kk, C.mint, 0.9), { sfx: 'chime' })
	VAULTS.forEach(([x, y]) => ring(k, V, x, y, 2, 95, C.mint, 6, eIO(P(t, L(3, 0.35), L(3, 0.35) + 0.5))))
	caption(k, t, L(3, 0.4), 'gỡ khoá ký quỹ · 5 ADA cọc trả cho node trả lời')
}

// ---------------------------------------------------------------- 08 Hết hạn

const VL = [[-380, -200], [-380, 40], [-380, 280]]                 // két bên trái
const DEST = [[300, -300], [300, -80], [300, 140], [300, 360]]     // nơi nhận tiền bên phải

function s08(k, t, T) {
	const L = T.L, V = V0()
	shake(k, t, [L(0, 0.6) + 0.32])
	head(k, t, 'Không ai trả lời được', 'hợp đồng tự phạt ký quỹ')
	ground(k, V, t)
	layer(k, fadeIn(t, L(0, 0.0)), () => {
		k.save(); k.translate(1620, 280); k.fillStyle = C.navy2; k.beginPath(); k.roundRect(-180, -50, 360, 100, 26); k.fill()
		const s = countLand(t, L(0, 0.3)); k.scale(s, s); txt(k, '0 giờ', 0, 2, 52, C.coral, { weight: 800, mono: true }); k.restore()
	})
	const crack = P(t, L(0, 0.6) + 0.32, L(0, 0.6) + 0.45)
	const fill = i => 1 - P(t, L(1, 0.0) + i * 0.3, L(1, 0.0) + i * 0.3 + 0.4) * 0.66
	sorted(VL.map(([x, y], i) => [x + y, () => vault(k, V, x, y, 0, { lock: 1, crack, fill: fill(i) })]))
	slam(k, t, L(0, 0.6), 480, 300, kk => ui.pill(kk, 'phạt', C.coral, { size: 44, fg: '#fff', h: 84 }))
	const times = [L(1, 0.15), L(1, 0.55), L(1, 0.82), L(2, 0.1)]
	const names = ['đền 100 ADA', 'thưởng', 'trả lại 5 ADA cọc', 'quỹ bảo hiểm']
	DEST.forEach(([x, y], i) => {
		const src = VL[Math.min(i, 2)], t0 = times[i]
		travel(k, t, t0 - 0.45, 0.75, [V.p(src[0], src[1], 120), V.p((src[0] + x) / 2, (src[1] + y) / 2, 200), V.p(x, y, 60)], C.yel, { guide: false, sfx: 'click' })
		if (i === 0) person(k, V, t, x, y, 0, t0, null)
		else if (i < 3) eyeAt(k, V, t, x, y, 0, t0, null)
		else layer(k, fadeIn(t, t0, 0.15), () => box(k, V, x, y, 0, 150, 150, 70 * grow(t, t0), C.blue, { topCol: '#5B93FF' }))
	})
	DEST.forEach(([x, y], i) => label(k, V, x, y, 0, kk => pop(kk, t, times[i] + 0.15, 190, -30, q => ui.pill(q, names[i], i === 3 ? C.blue : C.yel, { size: 24, fg: i === 3 ? '#fff' : C.navy }), { rot: false, sfx: null })))
}

// ---------------------------------------------------------------- 09 Vì sao phạt cả ba

function s09(k, t, T) {
	const L = T.L, V = V0()
	head(k, t, 'Vì sao phạt cả ba?', 'bản chốt cuối có đủ ba chữ ký')
	ground(k, V, t)
	const top = headPlate(k, V, t)
	const focusZ = t >= L(2, 0) && t < L(3, 0), focusXY = t >= L(3, 0)
	const al = [0, 1, 2].map(i => (focusZ ? (i === 2 ? 1 : 0.25) : focusXY ? (i < 2 ? 1 : 0.25) : 1))
	const h = nodeH(t, L(0, 0.3))
	ev(L(0, 0.3), 'tick')
	sorted(nodeItems(k, V, top, h, al))
	nodeLabels(k, V, t, top, h, L(0, 0.4), al, ['X', 'Y', 'Z'])
	const [cx, cy] = V.p(...CARD)
	NODES.forEach(([x, y], i) => layer(k, al[i], () => drawLine(k, t, L(1, 0.3) + i * 0.1, 0.5, [[cx + (i - 1) * 85, cy + 80], V.p(x, y, top + NH)], C.blue, 4, { smooth: false, tip: false })))
	pop(k, t, L(1, 0.0), cx, cy, kk => { kk.scale(0.75, 0.75); ui.sheet(kk, { title: 'bản chốt cuối', w: 400, h: 170, rows: [], sigs: 3 }) }, { rot: false })
	layer(k, focusXY ? 0.25 : 1, () => {
		label(k, V, 330, 260, top, kk => pop(kk, t, L(2, 0.05), 0, -40, q => ui.book(q, C.mint, 0.45), { rot: false }))
		const [bx, by] = V.p(330, 260, top), [zx, zy] = V.p(150, 150, top + NH)
		travel(k, t, L(2, 0.35), 0.7, [[bx, by - 40], [bx + 180, by - 80], [zx + 230, zy - 30]], C.mint, { guide: false })
		pop(k, t, L(2, 0.6), zx + 250, zy - 40, kk => ui.check(kk, C.mint, 0.7))
		layer(k, fadeIn(t, L(2, 0.65)), () => txt(k, 'trả lời được', zx + 250, zy - 110, 28, C.mint, { weight: 700 }))
	})
	NODES.slice(0, 2).forEach(([x, y], i) => ring(k, V, x, y, top + 2, 110, C.coral, 7, eIO(P(t, L(3, 0.15) + i * 0.15, L(3, 0.15) + i * 0.15 + 0.6))))
	ev(L(3, 0.15), 'strike')
	caption(k, t, L(3, 0.5), 'gian lận hoặc làm mất dữ liệu', C.coral, 1030, '#fff')
}

// ---------------------------------------------------------------- 10 Không có lời

const PL = [-250, 150], PR = [150, -250]   // hai cột tiền cạnh nhau trên khung hình

function s10(k, t, T) {
	const L = T.L, V = view(CX, 770, 0.83)
	head(k, t, 'Gian lận không có lời', 'so sánh ký quỹ với tiền trong Head')
	ground(k, V, t)
	ev(L(0, 0.3), 'tick')
	const right = 5 * eOut(P(t, L(0, 0.3), L(0, 0.3) + 0.8))
	let left = 2 * eOut(P(t, L(0, 0.5), L(0, 0.5) + 0.5)) + 4 * eOut(P(t, L(1, 0.05), L(1, 0.05) + 0.9))
	left -= 3 * eIn(P(t, L(5, 0.15), L(5, 0.15) + 0.6))
	ev(L(1, 0.05), 'tick')
	sorted([[PL[0] + PL[1] - 0.1, () => pillar(k, V, ...PL, left, C.yel)], [PR[0] + PR[1], () => pillar(k, V, ...PR, right, C.blue)]])
	label(k, V, ...PL, 0, kk => layer(kk, fadeIn(t, L(0, 0.25)), () => txt(kk, 'tổng ký quỹ', 0, 110, 34, C.yel, { weight: 700 })))
	label(k, V, ...PR, 0, kk => layer(kk, fadeIn(t, L(0, 0.25)), () => txt(kk, 'tiền trong Head', 0, 110, 34, C.blue, { weight: 700 })))
	layer(k, fadeOut(t, L(5, 0.15), 0.3), () => {
		pop(k, t, L(1, 0.5), CX, 610, kk => txt(kk, '≥', 0, 0, 120, C.mint, { weight: 800 }), { sfx: 'chime' })
		caption(k, t, L(1, 0.7), 'gian lận không có lời', C.mint, 1030)
	})
	layer(k, t >= L(5, 0.3) ? 0.3 : 1, () => {
		pop(k, t, L(3, 0.15), CX, 270, kk => {
			const g = kk.createLinearGradient(-200, -56, 200, 56); g.addColorStop(0, '#1FB98C'); g.addColorStop(1, C.mint)
			kk.fillStyle = g; kk.beginPath(); kk.roundRect(-200, -56, 400, 112, 28); kk.fill()
			txt(kk, 'BONDED', 0, 2, 52, C.navy, { weight: 800, ls: 3 })
		}, { rot: false, sfx: 'chime' })
		sweep(k, t, L(3, 0.25), CX - 200, 214, 400, 112, 28)
		layer(k, fadeIn(t, L(3, 0.65)), () => txt(k, 'ưu tiên hiển thị · chia phí cao hơn', CX, 355, 28, C.dim, { weight: 600 }))
	})
	pop(k, t, L(4, 0.2), 1620, 560, kk => {
		kk.fillStyle = C.navy2; kk.beginPath(); kk.roundRect(-230, -90, 460, 180, 26); kk.fill()
		txt(kk, 'nhà cung cấp uy tín', 0, -30, 30, '#fff', { weight: 600 })
		txt(kk, 'giảm ký quỹ thành viên', 0, 30, 32, C.mint, { weight: 800 })
	}, { rot: false })
	pop(k, t, L(5, 0.4), CX, 610, kk => txt(kk, '<', 0, 0, 120, C.coral, { weight: 800 }))
	caption(k, t, L(5, 0.6), 'hiển thị số thật · đền theo tỷ lệ', C.yel, 1030)
}

// ---------------------------------------------------------------- 11 Hạn chế

function s11(k, t, T) {
	const L = T.L, V = V0()
	head(k, t, 'Những chỗ còn hạn chế', 'thời gian và phạm vi bảo vệ')
	ground(k, V, t)
	layer(k, fadeOut(t, L(3, 0.0)), () => {
		const tr = eIO(P(t, L(0, 0.0), L(0, 0.0) + 0.7))
		box(k, V, -500 + 500 * tr, -60, 0, 1000 * tr, 70, 10, C.navy2, { topCol: '#2A3D80' })
		box(k, V, -350, -60, 10, 16, 90, 90 * grow(t, L(0, 0.15)), '#FFFFFF')
		label(k, V, -350, -60, 120, kk => pop(kk, t, L(0, 0.2), 0, -20, q => ui.pill(q, 'đóng Head', '#fff', { size: 26 }), { rot: false }))
		const w = 520 * eIO(P(t, L(0, 0.5), L(0, 0.5) + 0.8))
		if (w > 1) box(k, V, -342 + w / 2, -60, 10, w, 60, 16, C.yel)
		label(k, V, -80, -60, 30, kk => pop(kk, t, L(0, 0.75), 0, -50, q => ui.pill(q, '~6–12 giờ', C.yel, { size: 32 }), { rot: false }))
		for (let i = 0; i < 6; i++) {
			const g = grow(t, L(1, 0.3), i, 0.1)
			if (g > 0.01) label(k, V, -420 + i * 170, 200, 0, kk => { kk.translate(0, -40); kk.scale(g, g); ui.eye(kk, C.mint, 0.65) })
		}
		ev(L(1, 0.3), 'tick')
		caption(k, t, L(1, 0.5), 'dịch vụ canh gác tự động · ai cũng tự chạy được')
	})
	layer(k, fadeIn(t, L(3, 0.0)), () => {
		const left = t >= L(4, 0.05) ? 0.3 : 1
		const lg = grow(t, L(3, 0.1)), rg = grow(t, L(4, 0.1))
		layer(k, left, () => {
			box(k, V, ...PL, 0, 260, 260, 60 * lg, C.navy2, { edge: C.mint, topCol: '#24366F' })
			label(k, V, ...PL, 60 * lg, kk => pop(kk, t, L(3, 0.2), 0, -80, q => ui.wallet(q, C.mint, 0.6), { rot: false }))
			label(k, V, ...PL, 0, kk => layer(kk, fadeIn(t, L(3, 0.3)), () => { txt(kk, 'tiền đứng tên ví cá nhân', 0, 150, 32, '#fff', { weight: 800 }); txt(kk, 'hợp đồng của game: cần quy tắc riêng', 0, 195, 26, C.dim, { weight: 600 }) }))
		})
		layer(k, fadeIn(t, L(4, 0.1), 0.15), () => box(k, V, ...PR, 0, 260, 260, 60 * rg, C.navy2, { edge: C.yel, topCol: '#24366F' }))
		label(k, V, ...PR, 60 * rg, kk => pop(kk, t, L(4, 0.2), 0, -90, q => ui.bank(q, C.yel, 0.5), { rot: false }))
		label(k, V, ...PR, 0, kk => layer(kk, fadeIn(t, L(4, 0.3)), () => { txt(kk, 'tiền đứng tên nhà vận hành', 0, 150, 32, '#fff', { weight: 800 }); txt(kk, 'bảo vệ nhà vận hành, chưa phải người chơi', 0, 195, 26, C.yel, { weight: 600 }) }))
	})
}

// ---------------------------------------------------------------- 13 Kết

function s13(k, t, T) {
	const L = T.L, V = V0()
	layer(k, fadeOut(t, L(1, 0.0), 0.35), () => {
		ground(k, V, t)
		const cols = [[[-330, 230], C.mint, 'biên lai cho bằng chứng', 0.12, 3], [[-50, -50], C.yel, 'ký quỹ có tiền đền', 0.4, 4], [[230, -330], C.blue, 'hợp đồng tự phạt', 0.68, 5]]
		cols.forEach(([[x, y], c, s, f, n]) => {
			ev(L(0, f), 'tick')
			pillar(k, V, x, y, n * eOut(P(t, L(0, f), L(0, f) + 0.6)), c, { w: 140 })
			label(k, V, x, y, n * 50 + 40, kk => pop(kk, t, L(0, f) + 0.3, 0, 0, q => ui.pill(q, s, c, { size: 30, fg: c === C.blue ? '#fff' : C.navy }), { rot: false, sfx: null }))
		})
	})
	reveal(k, t, L(1, 0.05), CX, 560, 'Trust Center', { size: 140, sub: 'Hydra delegated topology', subSize: 46 })
	layer(k, fadeIn(t, L(1, 0.6)), () => txt(k, 'Thực hiện cùng VTechcom Labs', 1860, 1030, 28, C.dim, { align: 'right', weight: 600 }))
}

const draws = { '01': s01, '02': s02, '03': s03, '04': s04, '05': s05, '06': s06, '07': s07, '08': s08, '09': s09, '10': s10, '11': s11, '13': s13 }
export default Object.fromEntries(Object.entries(base).map(([sid, d]) => [sid, { ...d, draw: draws[sid] || d.draw }]))
