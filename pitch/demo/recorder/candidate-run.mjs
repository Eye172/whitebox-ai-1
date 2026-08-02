/* Drives the candidate journey end to end against the real backend.
   Exported so both the rehearsal script and the video recorder use one path. */

import { ANSWERS, PROBE_ANSWERS } from "./answers.mjs";

const CLIP_FOR_ANSWER = ANSWERS.map((a, i) => ({ ...a, clip: `answer-${i + 1}-${a.key}` }));
const PROBE_CLIPS = PROBE_ANSWERS.map((_, i) => `probe-${i + 1}`);

/* The published question plan is ordered and frozen, so the nth main question
   always gets the nth prepared answer. An adaptive evidence probe is not part
   of that plan, so it gets a probe answer instead. */
export function pickClip({ strategy, mainIndex, probeIndex }) {
  if (strategy === "main") {
    return CLIP_FOR_ANSWER[Math.min(mainIndex, CLIP_FOR_ANSWER.length - 1)].clip;
  }
  return PROBE_CLIPS[Math.min(probeIndex, PROBE_CLIPS.length - 1)];
}

export async function enterCompetition(page, base, code, hooks = {}) {
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await hooks.beat?.("code-entry");
  await page.getByLabel("competition code").fill(code);
  await hooks.beat?.("code-typed");
  await page.getByRole("button", { name: "Review application" }).click();
  await page.getByRole("button", { name: "Start application" }).waitFor({ state: "visible", timeout: 30000 });
  await hooks.beat?.("competition-preview");
  await page.getByRole("button", { name: "Start application" }).click();
  await page.waitForURL(/\/(assessment|interview\/check)/, { timeout: 30000 });

  // Multi-block plans land on the assessment rail first; open the interview stage.
  if (page.url().includes("/assessment")) {
    await hooks.beat?.("assessment-plan");
    const begin = page.getByRole("button", { name: "Begin assessment" });
    await Promise.race([
      begin.waitFor({ state: "visible", timeout: 30000 }).catch(() => {}),
      page.getByRole("button", { name: /Check devices|Start interview|Start stage/ })
        .waitFor({ state: "visible", timeout: 30000 }).catch(() => {}),
    ]);
    if (await begin.isVisible().catch(() => false)) {
      await page.locator('input[type="checkbox"]').first().check();
      await hooks.beat?.("assessment-consent");
      await begin.click();
    }
    const open = page.getByRole("button", { name: /Check devices|Start interview|Start stage/ });
    await open.waitFor({ state: "visible", timeout: 30000 });
    await hooks.beat?.("stage-brief");
    await open.click();
    await page.waitForURL("**/interview/check**", { timeout: 30000 });
  }
}

export async function passDeviceCheck(page, hooks = {}) {
  await page.getByRole("button", { name: "Run secure device checks" }).click();
  await page.getByRole("button", { name: "Run checks again" }).waitFor({ state: "visible", timeout: 40000 });
  // speak into the virtual microphone so the live level meter actually moves
  await page.evaluate(() => window.__wbxSpeak("mic-test")).catch(() => {});
  await hooks.beat?.("device-check-ok");
  await page.getByLabel(/I consent to the disclosed AI-conducted interview/).check();
  await hooks.beat?.("consent");
  await page.getByRole("button", { name: "Start interview" }).click();
  await page.waitForURL("**/interview/live**", { timeout: 30000 });
}

export async function runInterview(page, hooks = {}, options = {}) {
  const maxTurns = options.maxTurns ?? 12;
  // When a recording session supplies its cursor driver, use it, so the
  // candidate flow is pointed at by the same visible hand as everything else.
  const ui = options.human;
  const press = async (locator) => (ui ? ui.click(locator) : locator.click());
  const pause = async (ms) => (ui ? ui.sleep(ms) : page.waitForTimeout(0));
  let mainIndex = 0;
  let probeIndex = 0;
  const turns = [];

  await page.getByText("CAMERA READY").waitFor({ state: "visible", timeout: 60000 });
  await hooks.beat?.("camera-ready");

  for (let turn = 1; turn <= maxTurns; turn += 1) {
    // Either the next question opens, or the run is over. Wait for whichever
    // arrives — the transition between them is not instantaneous.
    const outcome = await page.waitForFunction(
      () => {
        if (document.body.innerText.includes("Interview complete")) return "complete";
        const button = [...document.querySelectorAll("button")].find((element) =>
          element.textContent?.includes("Start recorded answer"),
        );
        return button && !button.disabled ? "ready" : false;
      },
      { timeout: 120000 },
    );
    if ((await outcome.jsonValue()) === "complete") break;

    const start = page.getByRole("button", { name: "Start recorded answer" });

    const asked = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("p")];
      const question = nodes.find(
        (n) => n.className.includes("font-display") && n.textContent.trim().length > 20,
      );
      const label = [...document.querySelectorAll(".hud-label")]
        .map((n) => n.textContent ?? "")
        .find((text) => /PUBLISHED MAIN|EVIDENCE PROBE|CLARIFICATION|SITUATIONAL/.test(text));
      return { question: question?.textContent?.trim() ?? "", label: label ?? "" };
    });
    const strategy = asked.label.includes("PUBLISHED MAIN") ? "main" : "probe";
    const clip = pickClip({ strategy, mainIndex, probeIndex });
    if (strategy === "main") mainIndex += 1;
    else probeIndex += 1;
    const question = asked.question;
    turns.push({ turn, question, strategy, clip });
    await hooks.beat?.(`question-${turn}`, { question, clip });

    await pause(1400);
    await press(start);
    await page.getByRole("button", { name: "Stop answer" }).waitFor({ state: "visible", timeout: 30000 });
    await hooks.beat?.(`recording-${turn}`);

    await page.evaluate((name) => window.__wbxSpeak(name), clip);
    await page.waitForTimeout(900);
    await press(page.getByRole("button", { name: "Stop answer" }));

    const useRecording = page.getByRole("button", { name: "Use recording" });
    await useRecording.waitFor({ state: "visible", timeout: 30000 });
    await pause(1300);
    await hooks.beat?.(`clip-ready-${turn}`);

    const uploadResponse = page.waitForResponse(
      (r) => r.url().includes("/recording") && r.request().method() === "POST",
      { timeout: 180000 },
    );
    await press(useRecording);
    const upload = await uploadResponse;
    const uploadBody = await upload.json().catch(() => ({}));
    turns[turns.length - 1].transcription = uploadBody.transcription?.status;
    turns[turns.length - 1].transcript = uploadBody.transcript;
    if (!upload.ok()) throw new Error(`recording upload failed ${upload.status()}: ${JSON.stringify(uploadBody).slice(0, 400)}`);

    const answerBox = page.locator("#candidate-answer");
    await answerBox.waitFor({ state: "visible", timeout: 60000 });
    await hooks.beat?.(`transcript-${turn}`, { transcript: uploadBody.transcript });

    const correction = page.locator("#transcript-correction-reason");
    if (await correction.isVisible().catch(() => false)) {
      throw new Error("transcript correction gate appeared вЂ” provider transcription did not succeed");
    }

    const turnResponse = page.waitForResponse(
      (r) => r.url().endsWith("/turn") && r.request().method() === "POST",
      { timeout: 180000 },
    );
    await pause(1900);
    await press(page.getByRole("button", { name: "Submit answer" }));
    const stepped = await turnResponse;
    if (!stepped.ok()) throw new Error(`turn failed ${stepped.status()}`);
    await hooks.beat?.(`submitted-${turn}`);
  }

  await page.getByText("Interview complete").waitFor({ state: "visible", timeout: 120000 });
  await hooks.beat?.("interview-complete");
  return turns;
}
