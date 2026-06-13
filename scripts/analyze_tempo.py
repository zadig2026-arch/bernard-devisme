#!/usr/bin/env python3
"""
Analyse "dansabilité" des boucles de Bernard sans librairie audio :
énergie RMS, tempo (BPM) estimé par autocorrélation de l'enveloppe d'énergie,
et force du pouls (régularité du beat). Sert à choisir une musique pour
l'animation des danseurs sans pouvoir l'écouter.

Usage : python3 scripts/analyze_tempo.py data/audio-src-2026-06-12
"""
import sys, os, wave, struct, math

WIN = 0.02  # fenêtre d'enveloppe (s)

def load_mono(path):
    w = wave.open(path, "rb")
    n, sw, ch, fr = w.getnframes(), w.getsampwidth(), w.getnchannels(), w.getframerate()
    raw = w.readframes(n); w.close()
    if sw == 2:
        fmt = "<" + str(len(raw)//2) + "h"; data = struct.unpack(fmt, raw); norm = 32768.0
    elif sw == 1:
        data = [b - 128 for b in raw]; norm = 128.0
    elif sw == 3:
        data = []
        for i in range(0, len(raw), 3):
            v = raw[i] | (raw[i+1] << 8) | (raw[i+2] << 16)
            if v & 0x800000: v -= 1 << 24
            data.append(v)
        norm = 8388608.0
    else:
        fmt = "<" + str(len(raw)//4) + "i"; data = struct.unpack(fmt, raw); norm = 2147483648.0
    if ch > 1:
        data = [sum(data[i:i+ch]) / ch for i in range(0, len(data), ch)]
    return data, fr, norm

def envelope(data, fr, norm):
    hop = max(1, int(fr * WIN))
    env = []
    for i in range(0, len(data) - hop, hop):
        s = 0.0
        for j in range(i, i + hop):
            v = data[j] / norm; s += v * v
        env.append(math.sqrt(s / hop))
    return env, fr / hop  # enveloppe + sa fréquence d'échantillonnage

def rms(data, norm):
    s = sum((v / norm) ** 2 for v in data)
    return math.sqrt(s / len(data)) if data else 0.0

def tempo(env, efr):
    # flux positif (onset envelope)
    flux = [max(0.0, env[i] - env[i-1]) for i in range(1, len(env))]
    m = sum(flux) / len(flux) if flux else 0
    flux = [max(0.0, f - m) for f in flux]
    best_bpm, best_score = 0, 0.0
    for bpm in range(70, 161):
        lag = efr * 60.0 / bpm
        il = int(round(lag))
        if il < 1 or il >= len(flux): continue
        s = sum(flux[i] * flux[i - il] for i in range(il, len(flux)))
        norm = sum(f * f for f in flux) or 1
        score = s / norm
        if score > best_score: best_score, best_bpm = score, bpm
    return best_bpm, best_score

src = sys.argv[1] if len(sys.argv) > 1 else "data/audio-src-2026-06-12"
USED = {  # musiques déjà attribuées à une animation
    "batterie et 2 guitares": "2-guitares-batterie", "Stepp_double": "anim-2-guitares",
    "DRUMLOOP104_x8_": "drums", "DRUMLOOP106": "drums2", "ELECBASS_": "guit-jaune",
    "batterie et guitare": "batterie-guitare", "bongo 1": "bongo-2",
    "SNTHBASS121": "contrebasse", "Plage 032": "jam", "go west": "la-frite",
    "PIANO077": "piano", "SOUL": "danseurs (rejetée)",
}
def used_for(name):
    for k, v in USED.items():
        if k in name: return v
    return ""

rows = []
for f in sorted(os.listdir(src)):
    if not f.lower().endswith(".wav"): continue
    try:
        data, fr, norm = load_mono(os.path.join(src, f))
        env, efr = envelope(data, fr, norm)
        bpm, pulse = tempo(env, efr)
        rows.append((f, len(data)/fr, rms(data, norm), bpm, pulse, used_for(f)))
    except Exception as e:
        rows.append((f, 0, 0, 0, 0, f"erreur: {e}"))

rows.sort(key=lambda r: (-r[4], -r[2]))  # tri par force du pouls puis énergie
print(f"{'fichier':40} {'durée':>6} {'énergie':>8} {'BPM':>4} {'pouls':>6}  attribution")
print("-" * 90)
for f, dur, e, bpm, pulse, used in rows:
    print(f"{f:40} {dur:5.1f}s {e:8.4f} {bpm:4d} {pulse:6.2f}  {used}")
