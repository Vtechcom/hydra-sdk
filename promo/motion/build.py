"""Dựng một tập bằng engine Canvas (motion-prompt): mốc từ clip giọng → render.mjs vẽ khung → trộn tiếng → MP4.

  promo/.venv-render/bin/python promo/motion/build.py promo/trust-center/01-khi-moi-node-cung-ky-sai [--stills] [--only 03,07]

Dùng chung script.py, clip giọng, Timing và phần trộn tiếng với pipeline phấn (shared/build.py); chỉ khác phần vẽ hình.
Kết quả: <tập>/out/<tập>-motion.mp4, ảnh soát ở <tập>/stills-motion/.
"""
import argparse
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'shared'))

import audio  # noqa: E402
import build  # noqa: E402
import chalk  # noqa: E402


def timeline(ep):
	"""Mốc từng câu của mọi cảnh, cùng quy tắc lead/gap/tail với pipeline phấn."""
	script = build._load(ep / 'script.py', 'script')
	out, off = [], 0.0
	for k, sid in enumerate(script.ORDER):
		s = script.SCRIPT[sid]
		clips = [build.read_wav(ep / 'clips' / f'{sid}-{i}.wav') for i in range(len(s['lines']))]
		tm = chalk.Timing([len(c) / audio.SR for c in clips], tail=build.LAST_TAIL if k == len(script.ORDER) - 1 else 1.4)
		out.append(dict(sid=sid, off=off, total=tm.total, starts=tm.starts, durs=tm.durs, example=s.get('example'), clips=clips))
		off += tm.total
	return out


def sound(ep, tl, chord_sids, tag):
	"""Trộn tiếng cho các cảnh trong tl, nối liền nhau (mốc tính lại từ 0)."""
	total = sum(s['total'] for s in tl)
	n = int(total * audio.SR)
	voice = np.zeros(n)
	acc, cps = 0.0, []
	for s in tl:
		for i, c in enumerate(s['clips']):
			j = int((acc + s['starts'][i]) * audio.SR)
			voice[j:j + len(c)] += c[:max(0, n - j)]
		if s['sid'] in chord_sids:
			cps.append(acc)
		acc += s['total']
	events = [tuple(e) for e in json.loads((ep / 'out' / f'sfx-{tag}.json').read_text())]
	mixed = audio.mix(voice, audio.sfx_track(events, total), audio.pad(total, cps))
	wav = ep / 'out' / f'mix-{tag}.wav'
	with wave.open(str(wav), 'wb') as w:
		w.setnchannels(1)
		w.setsampwidth(2)
		w.setframerate(audio.SR)
		w.writeframes((np.clip(mixed, -1, 1) * 32767).astype(np.int16).tobytes())
	return wav


def main():
	ap = argparse.ArgumentParser()
	ap.add_argument('episode')
	ap.add_argument('--stills', action='store_true')
	ap.add_argument('--only', default='')
	ap.add_argument('--scenes', default='scenes.mjs', help='file cảnh trong <tập>/motion/, ví dụ scenes-iso.mjs')
	ap.add_argument('--tag', default='', help='tên bản dựng trong tên file ra; mặc định motion, kèm danh sách cảnh khi có --only')
	a = ap.parse_args()
	only = [s for s in a.only.split(',') if s]
	tag = a.tag or ('motion' + (f"-{'-'.join(only)}" if only else ''))
	ep = Path(a.episode).resolve()
	tl = timeline(ep)
	(ep / 'motion').mkdir(exist_ok=True)
	(ep / 'motion' / 'timeline.json').write_text(json.dumps(dict(W=chalk.W, H=chalk.H, fps=chalk.FPS,
		scenes=[{k: v for k, v in s.items() if k != 'clips'} for s in tl])))
	print(f'{len(tl)} scenes, {sum(s["total"] for s in tl):.1f}s total', flush=True)
	cmd = ['node', str(HERE / 'render.mjs'), str(ep), '--scenes', a.scenes, '--tag', tag] + (['--stills'] if a.stills else []) + (['--only', a.only] if a.only else [])
	subprocess.run(cmd, check=True, env={'FFMPEG': build.FFMPEG, **__import__('os').environ})
	if a.stills:
		return
	chords = json.loads((ep / 'motion' / 'chords.json').read_text()) if (ep / 'motion' / 'chords.json').exists() else ['03', '05', '09', '11']
	wav = sound(ep, [s for s in tl if not only or s['sid'] in only], set(chords), tag)
	build.mux(ep, ep / 'out' / f'video-{tag}.mp4', wav, tag)


if __name__ == '__main__':
	main()
