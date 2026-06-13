#!/usr/bin/env node
/**
 * Assemble chaque animation (GIF) avec son son dans un MP4 synchronisé.
 * Le GIF est bouclé pour toute la durée du son ; image et audio démarrent
 * ensemble à t=0 (seule vraie "synchro" possible vu l'écart de durées).
 *
 * Sources GIF : le dossier Downloads de Bernard + data/images/les-animations.
 * Sources son : le dossier Downloads de Bernard (WAV/MP3).
 * Sortie : ~/Downloads/Bernard - animations synchro/<Titre>.mp4
 *
 * Usage : node scripts/build-synced-videos.mjs
 */
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";

const DL = "/Users/zag/Downloads/Animations + sons : Bernard";
const ORIG = resolve(process.cwd(), "data/images/les-animations");
const OUT = join(homedir(), "Downloads", "Bernard - animations synchro");
mkdirSync(OUT, { recursive: true });

// Index des fichiers présents, pour retrouver par sous-chaîne (accents/espaces).
const dlFiles = readdirSync(DL);
const origFiles = existsSync(ORIG) ? readdirSync(ORIG) : [];

function findGif(name) {
  // 1) match exact dans Downloads, 2) sous-chaîne dans Downloads, 3) dans data/
  let f = dlFiles.find((x) => x === name);
  if (f) return join(DL, f);
  f = dlFiles.find((x) => x.toLowerCase().includes(name.toLowerCase()) && x.toLowerCase().endsWith(".gif"));
  if (f) return join(DL, f);
  f = origFiles.find((x) => x.toLowerCase() === name.toLowerCase());
  if (f) return join(ORIG, f);
  return null;
}
function findAudio(sub) {
  const f = dlFiles.find((x) => x.includes(sub) && /\.(wav|mp3)$/i.test(x));
  return f ? join(DL, f) : null;
}

// title -> { gif (nom à chercher), audio (sous-chaîne distinctive) }
const PAIRS = [
  { title: "2 guitares et batterie",   gif: "Animation 2 guitares +batterie.gif", audio: "DRUMLOOP106" },
  { title: "2 guitares",               gif: "Animation 2 guitares (1).gif",        audio: "ELECBASS___" },
  { title: "2 guitares (rapide)",      gif: "2 guit (1).gif",                      audio: "elecguit101" },
  { title: "Animation drums",          gif: "animation-drums.gif",                 audio: "DRUMLOOP104_x8_" },
  { title: "Animation drums 2",        gif: "animation-drums2.gif",                audio: "DRUMLOOP106" },
  { title: "Batterie seule",           gif: "batterie seule (1).gif",              audio: "DRUMLOOP104_x8_" },
  { title: "Batterie et guitare",      gif: "Bat guit R (1).gif",                  audio: "DRUMLOOP104_x8_" },
  { title: "Bongo 2",                  gif: "bongo-2.gif",                         audio: "DRUMLOOP104_x8 echo" },
  { title: "Contrebasse",              gif: "contrebasse.gif",                     audio: "SNTHBASS121" },
  { title: "Drums d01",                gif: "d01.gif",                             audio: "DRUMLOOP104_x8_" },
  { title: "Drums d02",                gif: "d02 (1).gif",                         audio: "DRUMLOOP106" },
  { title: "Guitare jaune",            gif: "animation-guit-jaune.gif",            audio: "ELECBASS echo" },
  { title: "Jam",                      gif: "Jam Animation1 (1).gif",              audio: "PIANO077" },
  { title: "La frite",                 gif: "La frite.gif",                        audio: "DRUMLOOP104_x8 echo" },
  { title: "Orchestre 01",             gif: "orch 01 (1).gif",                     audio: "moore-lookmebody" },
  { title: "Piano drums",              gif: "Animation-piano-drums1.gif",          audio: "PIANO018" },
];

function audioDuration(p) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", p]).toString().trim();
  return parseFloat(out);
}

let ok = 0, skipped = 0;
for (const pair of PAIRS) {
  const gif = findGif(pair.gif);
  const audio = findAudio(pair.audio);
  if (!gif) { console.warn(`⚠ GIF introuvable: ${pair.title} (${pair.gif})`); skipped++; continue; }
  if (!audio) { console.warn(`⚠ Son introuvable: ${pair.title} (${pair.audio})`); skipped++; continue; }
  const dur = audioDuration(audio);
  const outPath = join(OUT, `${pair.title}.mp4`);
  process.stdout.write(`▶ ${pair.title.padEnd(24)} ← ${pair.audio} (${dur.toFixed(1)}s) … `);
  execFileSync("ffmpeg", [
    "-y",
    "-stream_loop", "-1", "-i", gif,   // boucle le GIF à l'infini
    "-i", audio,
    "-t", String(dur),                  // durée = durée du son
    "-map", "0:v:0", "-map", "1:a:0",
    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=25",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium",
    "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart",
    outPath,
  ], { stdio: "ignore" });
  console.log("ok");
  ok++;
}
console.log(`\n${ok} vidéos écrites dans :\n${OUT}${skipped ? `\n${skipped} ignorée(s).` : ""}`);
