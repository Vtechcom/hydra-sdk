// Engine dựng video bằng Canvas 2D: mỗi khung là hàm thuần của thời gian, mốc lấy từ clip giọng thật (timeline.json do build.py tạo).
//
//   node promo/motion/render.mjs <tập> [--stills] [--only 03,07]
//
// Cảnh nằm ở <tập>/motion/scenes.mjs: export default { '01': { draw(k, t, T), example: { rows, icon } }, ... }.
// Đoạn ví dụ (khai trong script.py) hiện bằng split screen (#144): khung tách đôi, nửa phải là thẻ "Ví dụ".
// Giữa hai cảnh là chuyển cảnh bằng dải màu (#018). Xem fx.mjs cho các kiểu chuyển động.
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createCanvas, GlobalFonts } from '@napi-rs/canvas'
import { C, P, bands, collect, eOut5, popScale, rr, splitAt, txt } from './fx.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const FONTS = join(HERE, '..', 'shared', 'fonts')
for (const w of ['Medium', 'SemiBold', 'Bold', 'ExtraBold']) GlobalFonts.registerFromPath(join(FONTS, `BeVietnamPro-${w}.ttf`), 'Be Vietnam Pro')
GlobalFonts.registerFromPath(join(FONTS, 'JetBrainsMono-VF.ttf'), 'JetBrains Mono')

const args = process.argv.slice(2)
const ep = resolve(args[0])
const STILLS = args.includes('--stills')
const opt = name => (args.includes(name) ? args[args.indexOf(name) + 1] : null)
const only = new Set((opt('--only') || '').split(',').filter(Boolean))
const SCENE_FILE = opt('--scenes') || 'scenes.mjs'   // ví dụ scenes-iso.mjs: bản dựng thử của vài cảnh
const TAG = opt('--tag') || 'motion'
const TL = JSON.parse(readFileSync(join(ep, 'motion', 'timeline.json'), 'utf8'))
const { W, H, fps } = TL
const SCENES = (await import(pathToFileURL(join(ep, 'motion', SCENE_FILE)).href)).default

function timing(s) {
	return {
		total: s.total,
		L: (i, f = 0) => s.starts[i] + f * s.durs[i],
		E: (i, x = 0) => s.starts[i] + s.durs[i] + x,
	}
}
const scenes = TL.scenes.map(s => ({ ...s, T: timing(s), def: SCENES[s.sid] }))

// ---------------------------------------------------------------- nền

function background(k) {
	k.fillStyle = C.navy; k.fillRect(0, 0, W, H)
	const g = k.createRadialGradient(W / 2, H * 0.45, 80, W / 2, H * 0.45, W * 0.7)
	g.addColorStop(0, 'rgba(59,123,255,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0)')
	k.fillStyle = g; k.fillRect(0, 0, W, H)
	k.fillStyle = 'rgba(127,144,196,0.10)'
	for (let y = 60; y < H; y += 60) for (let x = 60; x < W; x += 60) k.fillRect(x - 1.5, y - 1.5, 3, 3)
}

// ---------------------------------------------------------------- thẻ "Ví dụ" (nửa phải của split screen)

function examplePanel(k, s, t, x0) {
	const ex = s.def.example, [i0] = s.example, T = s.T
	const tOpen = T.L(i0, 0) - 0.35
	const w = W - x0
	k.save(); k.beginPath(); k.rect(x0, 0, w, H); k.clip()
	k.fillStyle = C.cream; k.fillRect(x0, 0, w, H)
	const cx = x0 + w / 2
	// nhãn "Ví dụ": viên thuốc coral bật ra (#001)
	const ps = popScale(t, tOpen + 0.35)
	if (ps > 0.01) {
		k.save(); k.translate(cx, 150); k.scale(ps, ps)
		k.fillStyle = C.coral; rr(k, -110, -36, 220, 72, 36); k.fill()
		txt(k, 'Ví dụ', 0, 2, 40, '#fff', { weight: 800 })
		k.restore()
	}
	if (ex.icon) {
		const is = popScale(t, tOpen + 0.55)
		if (is > 0.01) { k.save(); k.translate(cx, 360); k.scale(is, is); ex.icon(k); k.restore() }
	}
	// từng dòng trồi lên từ dưới vạch khi câu tương ứng được đọc (#005, quintic out)
	ex.rows.forEach(([line, f, text, hl], j) => {
		const t0 = T.L(line, f), y = 560 + j * 92
		const up = (1 - eOut5(P(t, t0, t0 + 0.6))) * 70
		if (t < t0) return
		k.save(); k.beginPath(); k.rect(x0, y - 50, w, 80); k.clip()
		txt(k, text, cx, y + up, 44, hl ? C.coral : C.navy, { weight: hl ? 800 : 700 })
		k.restore()
	})
	k.restore()
}

// ---------------------------------------------------------------- một khung

const SPLIT = 0.56

function drawScene(k, s, t) {
	k.save(); s.def.draw(k, t, s.T); k.restore()
}

function frame(k, gt) {
	let si = scenes.findIndex(s => gt < s.off + s.total)
	if (si < 0) si = scenes.length - 1
	const s = scenes[si], t = gt - s.off
	background(k)
	let f = 1
	if (s.example && s.def.example) {
		const [i0, i1] = s.example, last = s.starts.length - 1
		f = splitAt(t, s.T.L(i0, 0) - 0.35, i1 < last ? s.T.E(i1, 0.15) : null, SPLIT)
	}
	if (f < 0.999) {
		const pw = W * f
		k.save(); k.beginPath(); k.rect(0, 0, pw, H); k.clip()
		k.translate(pw / 2, H / 2); k.scale(f * 1.04, f * 1.04); k.translate(-W / 2, -H / 2)
		drawScene(k, s, t); k.restore()
		examplePanel(k, s, t, pw)
		k.fillStyle = '#fff'; k.fillRect(pw - 3, 0, 6, H)
	} else drawScene(k, s, t)
	// chuyển cảnh: dải màu che ở cuối cảnh trước, mở ở đầu cảnh sau (#018)
	for (let j = 1; j < scenes.length; j++) {
		const tb = scenes[j].off
		if (gt > tb - 0.7 && gt < tb + 0.8) bands(k, W, H, gt, tb, j % 2 ? 1 : -1)
	}
}

// ---------------------------------------------------------------- tiếng hiệu ứng

// Mốc tiếng tính theo thời gian của video xuất ra: chỉ các cảnh được chọn, nối liền nhau.
function sfxEvents(sel) {
	const c = createCanvas(W, H), k = c.getContext('2d')
	const out = []
	let acc = 0
	for (const s of sel) {
		const evs = collect(() => { s.def.draw(k, s.total, s.T) })
		for (const [t0, kind] of evs) out.push([+(acc + t0).toFixed(3), kind, 0])
		if (s.example && s.def.example) out.push([+(acc + s.T.L(s.example[0], 0) - 0.35).toFixed(3), 'whoosh', 0])
		if (scenes.indexOf(s) > 0) out.push([+(acc - 0.62).toFixed(3), 'whoosh', 0])
		acc += s.total
	}
	return out.filter(e => e[0] >= 0).sort((a, b) => a[0] - b[0])
}

// ---------------------------------------------------------------- chạy

const canvas = createCanvas(W, H), k = canvas.getContext('2d')
const outDir = join(ep, 'out'); mkdirSync(outDir, { recursive: true })

if (STILLS) {
	const dir = join(ep, `stills-${TAG}`); mkdirSync(dir, { recursive: true })
	for (const s of scenes) {
		if (only.size && !only.has(s.sid)) continue
		const ts = s.starts.map((_, i) => s.T.E(i, -0.05))
		const cols = 3, rows = Math.ceil(ts.length / cols)
		const sheet = createCanvas(640 * cols, 360 * rows), sk = sheet.getContext('2d')
		ts.forEach((t, i) => { frame(k, s.off + t); sk.drawImage(canvas, (i % cols) * 640, Math.floor(i / cols) * 360, 640, 360) })
		writeFileSync(join(dir, `${s.sid}.png`), sheet.toBuffer('image/png'))
		console.log('still', s.sid, ts.map(t => t.toFixed(1)).join(' '))
	}
} else {
	const sel = scenes.filter(s => !only.size || only.has(s.sid))
	// thời điểm toàn tập của từng khung xuất ra (bỏ qua cảnh không chọn)
	const times = sel.flatMap(s => Array.from({ length: Math.round(s.total * fps) }, (_, i) => s.off + i / fps))
	const n = times.length
	writeFileSync(join(outDir, `sfx-${TAG}.json`), JSON.stringify(sfxEvents(sel)))
	const vid = join(outDir, `video-${TAG}.mp4`)
	const ff = spawn(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(fps), '-i', '-',
		'-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', vid], { stdio: ['pipe', 'inherit', 'inherit'] })
	const t0 = Date.now()
	for (let i = 0; i < n; i++) {
		frame(k, times[i])
		const buf = Buffer.from(k.getImageData(0, 0, W, H).data.buffer)
		if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r))
		if (i % 500 === 0) console.log(`frame ${i}/${n} (${(i / Math.max((Date.now() - t0) / 1000, 1e-3)).toFixed(1)} fps)`)
	}
	ff.stdin.end()
	await new Promise(r => ff.on('close', r))
	console.log(`video: ${vid} ${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`)
}
