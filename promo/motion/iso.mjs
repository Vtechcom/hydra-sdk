// 2.5D isometric cho engine Canvas: chiếu điểm (x, y, z) sang khung hình, vẽ khối hộp ba mặt sáng tối và hình trên mặt phẳng.
// Trục: x chạy xuống phải, y chạy xuống trái, z hướng lên. Không có che khuất tự động: cảnh tự vẽ từ xa tới gần
// (theo x + y tăng dần, rồi z tăng dần).
import { rr } from './fx.mjs'

const COS30 = Math.cos(Math.PI / 6)

// Góc nhìn: tâm (cx, cy) trên khung, tỉ lệ s. Đổi s và cx, cy theo thời gian để giả camera dolly hoặc pan.
export function view(cx, cy, s = 1) {
	return {
		s,
		p: (x, y, z = 0) => [cx + (x - y) * COS30 * s, cy + (x + y) * 0.5 * s - z * s],
	}
}

export function shade(hex, f) {
	const n = parseInt(hex.slice(1), 16)
	const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(Math.min(255, v * f)))
	return `rgb(${c[0]},${c[1]},${c[2]})`
}

function poly(k, pts) { k.beginPath(); pts.forEach(([a, b], i) => (i ? k.lineTo(a, b) : k.moveTo(a, b))); k.closePath() }

// Khối hộp tâm đáy (x, y, z), rộng w theo x, sâu d theo y, cao h. Mặt trên sáng nhất, mặt trước trái (y = +d/2) tối vừa,
// mặt trước phải (x = +w/2) tối nhất. edge: màu viền mặt trên (tuỳ chọn).
export function box(k, V, x, y, z, w, d, h, col, { edge = null, alpha = 1, topCol = null } = {}) {
	if (h <= 0.01 && !topCol) return
	const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2, z1 = z + Math.max(h, 0)
	k.save(); k.globalAlpha *= alpha
	poly(k, [V.p(x0, y1, z), V.p(x1, y1, z), V.p(x1, y1, z1), V.p(x0, y1, z1)]); k.fillStyle = shade(col, 0.72); k.fill()
	poly(k, [V.p(x1, y0, z), V.p(x1, y1, z), V.p(x1, y1, z1), V.p(x1, y0, z1)]); k.fillStyle = shade(col, 0.55); k.fill()
	poly(k, [V.p(x0, y0, z1), V.p(x1, y0, z1), V.p(x1, y1, z1), V.p(x0, y1, z1)]); k.fillStyle = topCol || col; k.fill()
	if (edge) { k.strokeStyle = edge; k.lineWidth = 3; k.lineJoin = 'round'; k.stroke() }
	k.restore()
}

// Vòng tròn nằm trên mặt phẳng z (thành elip khi chiếu); f = phần đã vẽ (0–1), vẽ theo chiều kim đồng hồ.
export function ring(k, V, x, y, z, r, col, width = 6, f = 1, start = -Math.PI / 2) {
	if (f <= 0) return
	k.save(); k.strokeStyle = col; k.lineWidth = width; k.lineCap = 'round'; k.beginPath()
	const n = 64
	for (let i = 0; i <= n * f; i++) {
		const a = start + (i / n) * Math.PI * 2, [px, py] = V.p(x + r * Math.cos(a), y + r * Math.sin(a), z)
		i ? k.lineTo(px, py) : k.moveTo(px, py)
	}
	k.stroke(); k.restore()
}

export function shadow(k, V, x, y, z, r, alpha = 0.35) {
	k.save(); k.globalAlpha *= alpha; k.fillStyle = '#000'; k.beginPath()
	for (let i = 0; i <= 48; i++) {
		const a = (i / 48) * Math.PI * 2, [px, py] = V.p(x + r * Math.cos(a), y + r * Math.sin(a), z)
		i ? k.lineTo(px, py) : k.moveTo(px, py)
	}
	k.fill(); k.restore()
}

// Đường nét đứt nằm trên mặt phẳng (dẫn đường cho chấm dữ liệu)
export function dashed(k, V, pts, col, width = 5) {
	k.save(); k.setLineDash([2, 14]); k.lineCap = 'round'; k.strokeStyle = col; k.lineWidth = width; k.beginPath()
	pts.forEach(([x, y, z], i) => { const [a, b] = V.p(x, y, z); i ? k.lineTo(a, b) : k.moveTo(a, b) })
	k.stroke(); k.restore()
}

// Nhãn đứng (billboard) tại một điểm 3D, luôn quay mặt về camera
export function label(k, V, x, y, z, draw) { const [a, b] = V.p(x, y, z); k.save(); k.translate(a, b); draw(k); k.restore() }

export function plate(k, w, h, fill, r = 14) { k.fillStyle = fill; rr(k, -w / 2, -h / 2, w, h, r); k.fill() }
