"""Đọc tu-dien-doc.md và thay thuật ngữ trong lời đọc trước khi tạo giọng."""
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def load(path=ROOT / 'tu-dien-doc.md'):
	entries = []
	for line in Path(path).read_text(encoding='utf-8').splitlines():
		cells = [c.strip() for c in line.strip().strip('|').split('|')]
		if len(cells) < 3 or cells[0] in ('Từ', '') or set(cells[0]) <= set('-'):
			continue
		entries.append((cells[0], cells[1], cells[2]))
	# Cụm dài thay trước để "UTxO Object" không bị "UTxO" cắt mất
	return sorted(entries, key=lambda e: -len(e[0]))


def apply(text, entries=None):
	entries = entries if entries is not None else load()
	text = unicodedata.normalize('NFC', text)
	for term, spoken, _ in entries:
		forms = [term]
		if term[0].islower():  # từ thường đứng đầu câu (viết hoa chữ đầu) vẫn được phiên âm
			forms.append(term[0].upper() + term[1:])
		for form in forms:
			text = re.sub(rf'(?<![\w.-]){re.escape(form)}(?![\w-])', spoken, text)
	return text


def syllables(text):
	"""Số âm tiết ước lượng: đếm từ sau khi đã phiên âm."""
	return len(re.findall(r'[^\s,.:;?!]+', apply(text)))
