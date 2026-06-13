#!/usr/bin/env python3
"""
Aplatit des GIF en frames pleines opaques (aucune transparence), composées sur
la couleur de fond, en conservant les durées par frame.

Pourquoi : quelques GIF (380px de large) ont une marge transparente que le
décodeur GIF de ffmpeg rend en BLANC sur les côtés, d'où un liseré blanc dans
les MP4 sonorisés (alors que le GIF, décodé proprement par PIL, est tout bleu).
En réécrivant chaque frame pleine et opaque, ffmpeg n'a plus de transparence à
interpréter et le liseré disparaît.

Usage : python3 scripts/flatten_gifs.py data/gifs-live/animation-2-guitares.gif [...]
Écrit sur place (le GIF d'origine est remplacé par sa version aplatie).
"""
import sys
from collections import Counter
from PIL import Image, ImageSequence


def bg_color(rgb):
    w, h = rgb.size
    px = rgb.load()
    edge = []
    for x in range(w):
        edge += [px[x, 0], px[x, h - 1]]
    for y in range(h):
        edge += [px[0, y], px[w - 1, y]]
    for col, _ in Counter(edge).most_common():
        if sum(col) > 60:  # ignore le noir pur (souvent du dessin en bord)
            return col
    return Counter(edge).most_common(1)[0][0]


def flatten(path):
    im = Image.open(path)
    durations, frames = [], []
    for fr in ImageSequence.Iterator(im):
        durations.append(fr.info.get("duration", 100))
        frames.append(fr.convert("RGB"))
    bg = bg_color(frames[0])
    flat = []
    for f in frames:
        base = Image.new("RGB", f.size, bg)
        base.paste(f, (0, 0))
        flat.append(base.convert("P", palette=Image.ADAPTIVE, colors=256))
    flat[0].save(
        path,
        save_all=True,
        append_images=flat[1:],
        duration=durations,
        loop=0,
        disposal=1,
        optimize=False,
    )
    print(f"✓ {path} — {len(flat)} frames aplaties, fond {bg}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/flatten_gifs.py <gif...>")
        sys.exit(1)
    for p in sys.argv[1:]:
        flatten(p)
