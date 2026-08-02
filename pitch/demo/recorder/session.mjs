import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { CURSOR_SCRIPT, makeHuman } from "./human.mjs";
import { INIT_SCRIPT, loadClips } from "./media-inject.mjs";

export const BASE = "http://127.0.0.1:3100";
export const TAKES_DIR = "D:\\WhiteBoxAI_5\\demo-recorder\\takes";

/* 1600x900 at 1.2x device scale renders into a 1920x1080 frame: native
   resolution for the deck, with UI large enough to read from a projector. */
const VIEWPORT = { width: 1600, height: 900 };
const VIDEO = { width: 1920, height: 1080 };

export async function openSession(part, { camera = false, headless = false } = {}) {
  const dir = `${TAKES_DIR}\\part${part}`;
  mkdirSync(dir, { recursive: true });

  const args = ["--autoplay-policy=no-user-gesture-required", "--use-fake-ui-for-media-stream"];
  if (!camera) args.push("--use-fake-device-for-media-stream");

  const browser = await chromium.launch({
    headless,
    // Bundled Chromium cannot open a window from this shell session, and only a
    // real browser build reaches the physical camera. Recording captures the
    // page viewport, so no browser chrome ends up in the frame either way.
    ...(headless ? {} : { channel: "chrome" }),
    args,
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1.2,
    recordVideo: { dir, size: VIDEO },
    userAgent: `WhiteBox-Demo/${Date.now()}`,
    colorScheme: "dark",
    reducedMotion: "no-preference",
    // Without this the host locale leaks into native date inputs and every
    // toLocaleString() on screen — the demo has to be English throughout.
    locale: "en-US",
    timezoneId: "Asia/Almaty",
  });
  await context.grantPermissions(["camera", "microphone"], { origin: new URL(BASE).origin });
  await context.addInitScript(CURSOR_SCRIPT);
  await context.addInitScript(INIT_SCRIPT, { clips: loadClips() });

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 300)));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 300)); });

  const started = Date.now();
  const beats = [];
  const beat = async (name, data) => {
    const at = (Date.now() - started) / 1000;
    beats.push({ at: Number(at.toFixed(2)), name, ...(data ?? {}) });
    console.log(`  [${at.toFixed(1)}s] ${name}`);
  };

  const human = makeHuman(page);

  const finish = async () => {
    const video = page.video();
    await context.close();
    const path = video ? await video.path() : null;
    await browser.close();
    writeFileSync(`${dir}\\beats.json`, JSON.stringify({ part, beats, errors, video: path }, null, 2));
    if (errors.length) console.log("  page errors:", [...new Set(errors)].slice(0, 5).join(" | "));
    return { path, beats };
  };

  return { browser, context, page, human, beat, beats, finish, errors };
}

export async function signIn(page, human, beat) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await human.sleep(700);
  await beat("login-screen");
  const email = page.locator('input[name="email"]');
  const password = page.locator('input[name="password"]');
  await email.fill("");
  await password.fill("");
  await human.type(email, "aizhan.rakhimova@northstar.kz", { perChar: [26, 48] });
  await human.sleep(160);
  await human.type(password, "Northstar2026", { perChar: [26, 46] });
  await human.sleep(260);
  await beat("credentials-entered");
}
