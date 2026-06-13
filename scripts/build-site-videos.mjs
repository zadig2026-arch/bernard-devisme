#!/usr/bin/env node
/**
 * Fabrique les MP4 sonorisés des œuvres animées, destinés au champ `video`
 * des artworks (joués dans la visionneuse à la place du GIF + audio séparés).
 *
 * Principe de synchro : la durée de la vidéo est un multiple entier (m) de la
 * durée de la boucle audio — la musique n'est jamais coupée. Le GIF est bouclé
 * et sa vitesse est ajustée (≤ ~5 %) pour qu'un nombre entier (k) de cycles
 * remplisse exactement la vidéo : image et son rebouclent ensemble, sans
 * couture. Si aucun k raisonnable n'existe, le GIF est coupé au reboucle
 * (imperceptible sur ces animations dessinées à la main).
 *
 * Volume : gain statique vers -16 LUFS (plafonné à -1 dBTP), uniforme sur
 * toute la boucle pour ne pas créer de couture sonore.
 *
 * Sources : data/gifs-live/<nom>.gif + data/audio-src-2026-06-12/<fichier>.WAV
 * Sortie  : data/videos/<slug>.mp4
 *
 * Usage : node scripts/build-site-videos.mjs
 */
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const GIF_DIR = resolve(process.cwd(), "data/gifs-live");
const WAV_DIR = resolve(process.cwd(), "data/audio-src-2026-06-12");
const OUT_DIR = resolve(process.cwd(), "data/videos");
mkdirSync(OUT_DIR, { recursive: true });

// Appariement décidé le 13/06/2026 d'après l'envoi de Bernard du 11/06
// (les noms de ses fichiers désignent les animations) + lecture visuelle des GIF.
const PAIRS = [
  { slug: "les-animations-2-guitares-batterie",     gif: "2-guitares-batterie.gif",  wav: "batterie et 2 guitares______12s.WAV" },
  { slug: "les-animations-animation-2-guitares",    gif: "animation-2-guitares.gif", wav: "Stepp_double guitare.WAV" },
  { slug: "les-animations-animation-drums",         gif: "animation-drums.gif",      wav: "DRUMLOOP104_x8_________15s.WAV" },
  { slug: "les-animations-animation-drums2",        gif: "animation-drums2.gif",     wav: "DRUMLOOP106_x10_______26s ok.WAV" },
  { slug: "les-animations-animation-guit-jaune",    gif: "animation-guit-jaune.gif", wav: "ELECBASS_______________18s.WAV" },
  { slug: "les-animations-batterie-guitare",        gif: "batterie-guitare.gif",     wav: "batterie et guitare.WAV" },
  { slug: "les-animations-bongo-2",                 gif: "bongo-2.gif",              wav: "bongo 1.WAV" },
  { slug: "les-animations-contrebasse",             gif: "contrebasse.gif",          wav: "SNTHBASS121________30s lent.WAV" },
  { slug: "les-animations-jam",                     gif: "jam.gif",                  wav: "Plage 032guit piano______8s.WAV" },
  { slug: "les-animations-la-frite",                gif: "la-frite.gif",             wav: "go west_93_04___orgue bongo.WAV" },
  { slug: "les-animations-animation-piano-drums1",  gif: "piano-drums1.gif",         wav: "PIANO018___________13s métalic.WAV" },
];

const MIN_DUR = 10;   // durée mini visée de la vidéo (s)
const MAX_DUR = 34;   // durée maxi (s)
const MAX_SPEED_DELTA = 0.055; // ajustement de vitesse GIF toléré (±5,5 %)

function ffprobe(args) {
  return execFileSync("ffprobe", ["-v", "error", ...args]).toString().trim();
}
function duration(path) {
  return parseFloat(ffprobe(["-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path]));
}
function measureLoudness(path) {
  // loudnorm écrit son rapport JSON sur stderr
  const res = spawnSync(
    "ffmpeg",
    ["-i", path, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const out = res.stderr;
  const json = JSON.parse(out.slice(out.lastIndexOf("{"), out.lastIndexOf("}") + 1));
  return { i: parseFloat(json.input_i), tp: parseFloat(json.input_tp) };
}

for (const pair of PAIRS) {
  const gif = join(GIF_DIR, pair.gif);
  const wav = join(WAV_DIR, pair.wav);
  if (!existsSync(gif) || !existsSync(wav)) {
    console.error(`✗ source manquante pour ${pair.slug}`);
    process.exitCode = 1;
    continue;
  }

  const audioDur = duration(wav);
  const cycle = duration(gif);

  // m répétitions audio candidates, k cycles GIF : on minimise l'écart de vitesse.
  const mMin = Math.max(1, Math.ceil(MIN_DUR / audioDur));
  const mMax = Math.max(mMin, Math.floor(MAX_DUR / audioDur));
  let best = null;
  for (let m = mMin; m <= mMax; m++) {
    const D = m * audioDur;
    const k = Math.max(1, Math.round(D / cycle));
    const rate = (k * cycle) / D; // vitesse à appliquer au GIF pour k cycles exacts
    const delta = Math.abs(rate - 1);
    if (!best || delta < best.delta - 1e-9) best = { m, k, rate, delta, D };
  }
  const { m, k, D } = best;
  const seamless = best.delta <= MAX_SPEED_DELTA;
  const rate = seamless ? best.rate : 1;

  const { i, tp } = measureLoudness(wav);
  let gain = -16 - i;
  if (tp + gain > -1) gain = -1 - tp; // plafond true peak

  const out = join(OUT_DIR, `${pair.slug}.mp4`);
  const vf = `setpts=PTS/${rate.toFixed(6)},fps=25,scale=iw*2:ih*2:flags=neighbor,format=yuv420p`;
  const af = `volume=${gain.toFixed(2)}dB,aformat=sample_rates=44100:channel_layouts=stereo`;
  execFileSync(
    "ffmpeg",
    [
      "-y", "-v", "error",
      "-stream_loop", "-1", "-i", gif,
      "-stream_loop", String(m - 1), "-i", wav,
      "-t", D.toFixed(3),
      "-filter_complex", `[0:v]${vf}[v];[1:a]${af}[a]`,
      "-map", "[v]", "-map", "[a]",
      "-c:v", "libx264", "-crf", "20", "-preset", "slow",
      "-c:a", "aac", "-b:a", "192k",
      "-movflags", "+faststart",
      out,
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  console.log(
    `✓ ${pair.slug.replace("les-animations-", "").padEnd(24)} ${D.toFixed(1).padStart(5)}s = ${m}× audio (${audioDur.toFixed(2)}s) · GIF ×${k} ${seamless ? `vitesse ${(rate * 100).toFixed(1)}%` : "coupé au reboucle"} · gain ${gain.toFixed(1)} dB`,
  );
}
console.log(`\nMP4 écrits dans ${OUT_DIR}`);
