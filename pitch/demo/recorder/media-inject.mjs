/* Virtual microphone for the demo run.

   The camera stays real вЂ” the person in front of the laptop is what you see in
   the interview panel. Only the audio track is substituted: pre-synthesized
   speech is played through a WebAudio graph whose destination becomes the
   microphone track handed to getUserMedia. MediaRecorder therefore captures a
   genuine A/V clip, the server stores it, and gpt-4o-transcribe transcribes it
   for real. Nothing in the application is aware of, or altered by, this. */

import { readFileSync, readdirSync } from "node:fs";

const AUDIO_DIR = "D:\\WhiteBoxAI_5\\demo-recorder\\audio";

export function loadClips() {
  const clips = {};
  for (const file of readdirSync(AUDIO_DIR)) {
    if (!file.endsWith(".mp3")) continue;
    clips[file.replace(/\.mp3$/, "")] = readFileSync(`${AUDIO_DIR}\\${file}`).toString("base64");
  }
  return clips;
}

export const INIT_SCRIPT = ({ clips }) => {
  const base64ToBytes = (b64) => {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out.buffer;
  };

  const state = {
    ctx: null,
    bus: null,
    buffers: new Map(),
    current: null,
    lastPlayed: null,
  };

  const ensureContext = async () => {
    if (!state.ctx) {
      state.ctx = new (window.AudioContext || window.webkitAudioContext)();
      state.bus = state.ctx.createGain();
      state.bus.gain.value = 1;
      // A whisper of noise keeps the track continuously "live" so the encoder
      // never treats long silences as a dead source.
      const noise = state.ctx.createBufferSource();
      const buffer = state.ctx.createBuffer(1, state.ctx.sampleRate, state.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() - 0.5) * 0.0006;
      noise.buffer = buffer;
      noise.loop = true;
      noise.connect(state.bus);
      noise.start();
    }
    if (state.ctx.state === "suspended") await state.ctx.resume();
    return state.ctx;
  };

  const decode = async (name) => {
    if (state.buffers.has(name)) return state.buffers.get(name);
    const raw = clips[name];
    if (!raw) throw new Error(`no demo clip named ${name}`);
    const ctx = await ensureContext();
    const buffer = await ctx.decodeAudioData(base64ToBytes(raw));
    state.buffers.set(name, buffer);
    return buffer;
  };

  window.__wbxSpeak = async (name) => {
    const ctx = await ensureContext();
    const buffer = await decode(name);
    if (state.current) {
      try { state.current.stop(); } catch { /* already finished */ }
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(state.bus);
    state.current = source;
    state.lastPlayed = name;
    return new Promise((resolve) => {
      source.onended = () => {
        if (state.current === source) state.current = null;
        resolve(buffer.duration);
      };
      source.start();
    });
  };

  window.__wbxClipDuration = async (name) => (await decode(name)).duration;
  window.__wbxStopSpeaking = () => {
    if (state.current) {
      try { state.current.stop(); } catch { /* already finished */ }
      state.current = null;
    }
  };
  window.__wbxReady = true;

  const devices = navigator.mediaDevices;
  const realGetUserMedia = devices.getUserMedia.bind(devices);

  devices.getUserMedia = async (constraints = {}) => {
    const wantsVideo = Boolean(constraints.video);
    const wantsAudio = Boolean(constraints.audio);
    if (!wantsAudio) return realGetUserMedia(constraints);

    const stream = new MediaStream();
    if (wantsVideo) {
      const camera = await realGetUserMedia({ video: constraints.video });
      camera.getVideoTracks().forEach((track) => stream.addTrack(track));
    }
    const ctx = await ensureContext();
    const destination = ctx.createMediaStreamDestination();
    state.bus.connect(destination);
    destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    return stream;
  };
};
