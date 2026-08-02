/* Assembles the three takes into one silent showcase.

   Cut points come from the beats each recorder emitted, so every segment starts
   on a known state rather than a guessed timestamp. Dead time — model drafting,
   uploads, transcription — is sped up rather than cut, which keeps the demo
   honest about what the product actually does while staying inside 90 seconds. */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";

const FFMPEG =
  "C:\\Users\\Шахназар\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin\\ffmpeg.exe";
const TAKES = "D:\\WhiteBoxAI_5\\demo-recorder\\takes";
const WORK = "D:\\WhiteBoxAI_5\\demo-recorder\\takes\\cut";
const OUT = "D:\\WhiteBoxAI_5\\demo-recorder\\whitebox-demo.mp4";

const take = (part) => {
  const dir = `${TAKES}\\${part}`;
  const file = readdirSync(dir).find((name) => name.endsWith(".webm"));
  if (!file) throw new Error(`no take in ${dir}`);
  return `${dir}\\${file}`;
};

const P1 = take("part1");
const P2 = take("part2");
const P3 = take("part3");

/* [source, start, seconds of source, speed] — output length is seconds/speed. */
const PARTS = {
  one: [
    [P1, 3.8, 4.4, 1.6, "sign in"],
    [P1, 10.3, 3.7, 1.5, "workspace"],
    [P1, 35.2, 3.8, 2.0, "vacancy studio"],
    [P1, 39.0, 23.1, 7.0, "plain-language brief"],
    [P1, 62.6, 45.0, 14.0, "model drafts the vacancy"],
    [P1, 108.4, 9.6, 3.0, "generated profile and criteria"],
    [P1, 118.0, 14.0, 3.5, "pipeline and question plan"],
    [P1, 132.0, 10.5, 3.5, "scoring and preflight"],
    [P1, 143.0, 7.4, 1.25, "published — competition code"],
  ],
  two: [
    [P2, 3.2, 7.1, 2.2, "candidate enters the code"],
    [P2, 10.3, 3.7, 2.0, "what they are applying to"],
    [P2, 14.0, 9.8, 3.5, "disclosed plan and consent"],
    [P2, 26.3, 15.2, 4.0, "device and identity check"],
    [P2, 46.8, 11.7, 3.0, "first published question"],
    [P2, 62.5, 7.0, 1.0, "recorded answer, real time"],
    [P2, 92.0, 4.0, 1.5, "clip accepted"],
    [P2, 124.0, 8.0, 2.0, "provider transcript returns"],
    [P2, 393.0, 6.4, 1.5, "interview complete"],
  ],
  three: [
    [P3, 19.65, 3.6, 1.4, "reviewer queue"],
    [P3, 23.4, 7.1, 2.0, "immutable transcript, hashed"],
    [P3, 63.0, 15.6, 5.0, "human observation receipt"],
    [P3, 84.0, 12.4, 4.0, "evidence evaluation runs"],
    [P3, 101.8, 6.2, 1.6, "summary and strengths"],
    [P3, 108.0, 5.5, 2.0, "engine provenance"],
    [P3, 114.2, 3.4, 1.0, "score per published criterion"],
    [P3, 117.7, 8.3, 2.2, "evidence citations"],
    [P3, 129.3, 12.0, 3.0, "named decision, written reason"],
    /* Ends on the filed receipt rather than the audit tab: that tab renders an
       empty-state line for this record, which is a poor last frame. */
    [P3, 141.3, 4.2, 1.0, "shortlisted — receipt in the decision history"],
  ],
};

const run = (args) => execFileSync(FFMPEG, args, { stdio: ["ignore", "pipe", "pipe"] });

mkdirSync(WORK, { recursive: true });

const partFiles = [];
let total = 0;
for (const [name, segments] of Object.entries(PARTS)) {
  const list = [];
  segments.forEach(([source, start, seconds, speed, label], index) => {
    const out = `${WORK}\\${name}-${String(index).padStart(2, "0")}.mp4`;
    const length = seconds / speed;
    total += length;
    console.log(`  ${name}/${index} ${length.toFixed(1)}s  ${label}`);
    run([
      "-y", "-v", "error",
      "-ss", String(start),
      "-t", String(seconds),
      "-i", source,
      "-an",
      "-vf", `setpts=PTS/${speed},fps=30,scale=1920:1080:flags=lanczos,format=yuv420p`,
      "-c:v", "libx264", "-crf", "18", "-preset", "medium",
      out,
    ]);
    list.push(out);
  });
  const manifest = `${WORK}\\${name}.txt`;
  writeFileSync(manifest, list.map((file) => `file '${file.replaceAll("\\", "/")}'`).join("\n"));
  const merged = `${WORK}\\${name}.mp4`;
  run(["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", manifest, "-c", "copy", merged]);
  partFiles.push(merged);
}

/* Cross-fade the three parts, then top and tail the whole thing. */
const durationOf = (file) =>
  Number(
    execFileSync(FFMPEG.replace("ffmpeg.exe", "ffprobe.exe"), [
      "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file,
    ]).toString().trim(),
  );

const FADE = 0.5;
const [d1, d2, d3] = partFiles.map(durationOf);
const end = d1 + d2 + d3 - FADE * 2;
const filter =
  `[0:v][1:v]xfade=transition=fade:duration=${FADE}:offset=${(d1 - FADE).toFixed(3)}[a];` +
  `[a][2:v]xfade=transition=fade:duration=${FADE}:offset=${(d1 + d2 - FADE * 2).toFixed(3)}[b];` +
  `[b]fade=t=in:st=0:d=0.4,fade=t=out:st=${(end - 0.7).toFixed(3)}:d=0.7[v]`;

run([
  "-y", "-v", "error",
  "-i", partFiles[0], "-i", partFiles[1], "-i", partFiles[2],
  "-filter_complex", filter,
  "-map", "[v]",
  "-c:v", "libx264", "-crf", "18", "-preset", "slow",
  "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  OUT,
]);

console.log(`\n  parts: ${d1.toFixed(1)} + ${d2.toFixed(1)} + ${d3.toFixed(1)}s`);
console.log(`  final: ${durationOf(OUT).toFixed(1)}s -> ${OUT}`);
if (!existsSync(OUT)) throw new Error("no output written");
