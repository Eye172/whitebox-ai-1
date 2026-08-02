/* Synthesize each candidate answer to mp3 with the OpenAI TTS API.
   The audio is only ever used as a virtual microphone signal for the demo run. */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { ANSWERS, PROBE_ANSWERS } from "./answers.mjs";

const AUDIO_DIR = "D:\\WhiteBoxAI_5\\demo-recorder\\audio";
mkdirSync(AUDIO_DIR, { recursive: true });

const keyLine = readFileSync("D:\\WhiteBoxAI_5\\API.md", "utf8");
const apiKey = /open_ai_api\s*=\s*"([^"]+)"/.exec(keyLine)?.[1];
if (!apiKey) throw new Error("no api key in API.md");

const MODELS = ["gpt-4o-mini-tts", "tts-1-hd", "tts-1"];
let model = process.env.TTS_MODEL ?? "";

async function synth(text, file) {
  for (const candidate of model ? [model] : MODELS) {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: candidate,
        voice: "ash",
        input: text,
        response_format: "mp3",
        ...(candidate.startsWith("tts-") ? { speed: 1.05 } : {}),
        ...(candidate.startsWith("gpt-4o")
          ? { instructions: "Speak clearly and naturally at a brisk conversational pace, like someone answering an interview question." }
          : {}),
      }),
    });
    if (!res.ok) {
      console.log(`  ${candidate} -> ${res.status} ${(await res.text()).slice(0, 200)}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(file, buf);
    model = candidate;
    return { candidate, bytes: buf.length };
  }
  throw new Error("no TTS model worked");
}

const items = [
  ...ANSWERS.map((a, i) => ({ name: `answer-${i + 1}-${a.key}`, text: a.text })),
  ...PROBE_ANSWERS.map((t, i) => ({ name: `probe-${i + 1}`, text: t })),
];

for (const item of items) {
  const file = `${AUDIO_DIR}\\${item.name}.mp3`;
  if (existsSync(file) && !process.env.FORCE) {
    console.log(`skip ${item.name} (exists)`);
    continue;
  }
  const r = await synth(item.text, file);
  console.log(`${item.name}: ${r.candidate} ${(r.bytes / 1024).toFixed(0)} KB`);
}
console.log("model used:", model);
