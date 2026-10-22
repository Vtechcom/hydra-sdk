"""Tạo clip giọng bằng VieNeu-TTS cho một tập.

Chạy bằng môi trường riêng:
  promo/.venv-tts/Scripts/python promo/shared/tts_vieneu.py promo/videos/01-utxo [--only 01-0,05-3] [--force] [--list]
Clip lưu tại <tập>/clips/<cảnh>-<câu>.wav. Mặc định bỏ qua clip đã có.
"""
import argparse
import importlib.util
import os
import sys
import time
from pathlib import Path

SHARED = Path(__file__).resolve().parent
os.environ.setdefault('HF_HUB_CACHE', str(SHARED.parent / 'models' / 'hf-cache'))
sys.path.insert(0, str(SHARED))

import lexicon  # noqa: E402

VOICE = 'Hải Đăng'


def load_script(ep_dir):
	spec = importlib.util.spec_from_file_location('script', ep_dir / 'script.py')
	mod = importlib.util.module_from_spec(spec)
	spec.loader.exec_module(mod)
	return mod


def main():
	ap = argparse.ArgumentParser()
	ap.add_argument('episode')
	ap.add_argument('--only', default='')
	ap.add_argument('--force', action='store_true')
	ap.add_argument('--list', action='store_true')
	ap.add_argument('--voice', default=VOICE)
	args = ap.parse_args()

	from vieneu import Vieneu

	tts = Vieneu()
	if args.list:
		for desc, vid in tts.list_preset_voices():
			print(vid, '-', desc)
		return

	ep = Path(args.episode).resolve()
	script = load_script(ep)
	clips = ep / 'clips'
	clips.mkdir(exist_ok=True)
	only = {s for s in args.only.split(',') if s}
	entries = lexicon.load()

	for sid in script.ORDER:
		for i, line in enumerate(script.SCRIPT[sid]['lines']):
			cid = f'{sid}-{i}'
			out = clips / f'{cid}.wav'
			if only and cid not in only:
				continue
			if out.exists() and not args.force:
				continue
			# READ_MODE = 'quote': thuật ngữ tiếng Anh đã nằm trong nháy kép ở lời đọc, không phiên âm
			spoken = line if getattr(script, 'READ_MODE', 'phonetic') == 'quote' else lexicon.apply(line, entries)
			t0 = time.time()
			tts.save(tts.infer(spoken, voice=args.voice), out)
			print(f'{cid} ({time.time() - t0:.1f}s): {spoken}', flush=True)


if __name__ == '__main__':
	main()
