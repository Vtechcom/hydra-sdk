"""Dựng một tập: mốc thời gian từ clip giọng → vẽ khung song song → NVENC → trộn tiếng → MP4.

  promo/.venv-render/Scripts/python promo/shared/build.py promo/videos/01-utxo [--stills] [--only 03,07] [--cpu]

--stills: chỉ xuất ảnh soát (4 khung/cảnh) vào <tập>/stills/.
--only:   chỉ dựng vài cảnh (bản nháp, không trộn tiếng cả tập).
--cpu:    ghép khung bằng numpy và mã hoá bằng libx264 thay vì CuPy + h264_nvenc.
"""
import argparse
import importlib.util
import subprocess
import sys
import time
import wave
from multiprocessing import Pool, cpu_count
from pathlib import Path

import numpy as np
from PIL import Image

SHARED = Path(__file__).resolve().parent
sys.path.insert(0, str(SHARED))

import audio  # noqa: E402
import chalk  # noqa: E402
import imageio_ffmpeg  # noqa: E402

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
LAST_TAIL = 5.0


def _load(path, name):
	spec = importlib.util.spec_from_file_location(name, path)
	mod = importlib.util.module_from_spec(spec)
	spec.loader.exec_module(mod)
	return mod


def read_wav(p):
	with wave.open(str(p)) as w:
		assert w.getframerate() == audio.SR and w.getnchannels() == 1
		return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768


def plan(ep):
	"""Trả về [(sid, Timing, Board, offset)] — bảng của mọi cảnh đã gắn mốc giọng thật."""
	script = _load(ep / 'script.py', 'script')
	sys.path.insert(0, str(ep))
	scenes = _load(ep / 'scenes.py', 'scenes')
	chalk.set_background(getattr(scenes, 'BACKGROUND', 'chalk'))
	out, off = [], 0.0
	for k, sid in enumerate(script.ORDER):
		n = len(script.SCRIPT[sid]['lines'])
		clips = [read_wav(ep / 'clips' / f'{sid}-{i}.wav') for i in range(n)]
		tm = chalk.Timing([len(c) / audio.SR for c in clips], tail=LAST_TAIL if k == len(script.ORDER) - 1 else 1.4,
			beats=getattr(scenes, 'BEATS', {}).get(sid))
		b = chalk.Board()
		scenes.SCENES[sid](b, tm)
		out.append(dict(sid=sid, tm=tm, board=b, off=off, clips=clips, scenes=scenes))
		off += tm.total
	return out


_PLAN = None


def _init(ep):
	global _PLAN
	_PLAN = plan(Path(ep))


def _render(job):
	"""Tiến trình con chỉ vẽ nét (CPU); phần ghép khung chạy ở tiến trình chính trên GPU."""
	si, fi, gpu = job
	layer = chalk.draw_layer(_PLAN[si]['board'], fi / chalk.FPS)
	return layer.tobytes() if gpu else chalk.compose(layer).tobytes()


def frames_of(p, only):
	jobs = []
	for si, s in enumerate(p):
		if only and s['sid'] not in only:
			continue
		n = int(round(s['tm'].total * chalk.FPS))
		jobs += [(si, fi) for fi in range(n)]
	return jobs


def stills(ep, p):
	d = ep / 'stills'
	d.mkdir(exist_ok=True)
	for s in p:
		T = s['tm'].total
		n = len(s['tm'].beats)
		ts = [s['tm'].E(i, -0.05) for i in sorted({0, n // 3, (2 * n) // 3})] + [T - 0.1]
		ts = ts[-4:]
		ims = [Image.fromarray(chalk.frame(s['board'], t)).resize((960, 540)) for t in ts]
		sheet = Image.new('RGB', (1920, 1080))
		for k, im in enumerate(ims):
			sheet.paste(im, ((k % 2) * 960, (k // 2) * 540))
		sheet.save(d / f'{s["sid"]}.png')
		print('still', s['sid'], [round(t, 1) for t in ts[:4]], flush=True)


def encode(ep, p, only, cpu):
	out_dir = ep / 'out'
	out_dir.mkdir(exist_ok=True)
	tag = '-'.join(sorted(only)) if only else 'full'
	vid = out_dir / f'video-{tag}.mp4'
	# Không có CUDA (máy Mac, hoặc --cpu): ghép khung bằng numpy và mã hoá bằng libx264.
	gpu = None if cpu else chalk.gpu_composer()
	enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '20'] if gpu is None else \
		['-c:v', 'h264_nvenc', '-preset', 'p6', '-rc', 'vbr', '-cq', '21', '-b:v', '0', '-profile:v', 'high']
	cmd = [FFMPEG, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{chalk.W}x{chalk.H}',
		'-r', str(chalk.FPS), '-i', '-', *enc, '-pix_fmt', 'yuv420p', str(vid)]
	ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
	jobs = [(si, fi, gpu is not None) for si, fi in frames_of(p, only)]
	t0 = time.time()
	with Pool(max(1, cpu_count() - 1), initializer=_init, initargs=(str(ep),)) as pool:
		for k, buf in enumerate(pool.imap(_render, jobs, chunksize=4)):
			ff.stdin.write(gpu(buf) if gpu else buf)
			if k % 500 == 0:
				print(f'frame {k}/{len(jobs)} ({k / max(time.time() - t0, 1e-6):.1f} fps)', flush=True)
	ff.stdin.close()
	ff.wait()
	print(f'video: {vid.name} {len(jobs)} frames in {time.time() - t0:.0f}s', flush=True)
	return vid, tag


def sound(ep, p, only, tag):
	sel = [s for s in p if not only or s['sid'] in only]
	off0 = sel[0]['off']
	total = sum(s['tm'].total for s in sel)
	n = int(total * audio.SR)
	voice = np.zeros(n)
	events, changes = [], []
	acc = 0.0
	for s in sel:
		for i, c in enumerate(s['clips']):
			j = int((acc + s['tm'].starts[i]) * audio.SR)
			voice[j:j + len(c)] += c[:max(0, n - j)]
		events += [(acc + t, k, d) for t, k, d in s['board'].sfx_events()]
		changes.append(acc)
		acc += s['tm'].total
	# Đổi hợp âm theo nhóm cảnh: mở đầu, mô hình, Cardano, lập trình, kết. Tập có thể tự khai CHORD_CHANGES trong scenes.py.
	groups = set(getattr(p[0].get('scenes'), 'CHORD_CHANGES', None) or {'03', '06', '11', '13', '16'})
	cps = [acc_s for acc_s, s in zip(changes, sel) if s['sid'] in groups]
	mixed = audio.mix(voice, audio.sfx_track(events, total), audio.pad(total, cps))
	wav = ep / 'out' / f'mix-{tag}.wav'
	with wave.open(str(wav), 'wb') as w:
		w.setnchannels(1)
		w.setsampwidth(2)
		w.setframerate(audio.SR)
		w.writeframes((np.clip(mixed, -1, 1) * 32767).astype(np.int16).tobytes())
	return wav


def mux(ep, vid, wav, tag):
	out = ep / 'out' / f'{ep.name}-{tag}.mp4'
	subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', str(vid), '-i', str(wav), '-c:v', 'copy',
		'-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.72:level=false', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-shortest',
		'-movflags', '+faststart', str(out)], check=True)
	print('done:', out, flush=True)


def main():
	ap = argparse.ArgumentParser()
	ap.add_argument('episode')
	ap.add_argument('--stills', action='store_true')
	ap.add_argument('--only', default='')
	ap.add_argument('--cpu', action='store_true')
	a = ap.parse_args()
	ep = Path(a.episode).resolve()
	only = {s for s in a.only.split(',') if s}
	p = plan(ep)
	print(f'{len(p)} scenes, {sum(s["tm"].total for s in p):.1f}s total', flush=True)
	if a.stills:
		stills(ep, [s for s in p if not only or s['sid'] in only])
		return
	vid, tag = encode(ep, p, only, a.cpu)
	mux(ep, vid, sound(ep, p, only, tag), tag)


if __name__ == '__main__':
	main()
