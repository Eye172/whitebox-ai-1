/* PART 2 — the candidate side.

   Real camera, real MediaRecorder, real upload, real transcription. The only
   substitution is the microphone signal: pre-synthesized speech stands in for
   the person on camera, because the finished video is silent and nobody should
   have to perform four interview answers on cue. */

import { readFileSync } from "node:fs";
import { openSession, BASE } from "./session.mjs";
import { enterCompetition, passDeviceCheck, runInterview } from "./candidate-run.mjs";

const code = process.env.WBX_CODE ?? JSON.parse(readFileSync("D:\\WhiteBoxAI_5\\demo-recorder\\.published.json", "utf8")).code;

/* WBX_DRY=1 rehearses the identical timeline against a synthetic camera with no
   window on screen, so the take itself is never the first time this path runs. */
const dry = process.env.WBX_DRY === "1";
const { page, human, beat, finish } = await openSession(dry ? 98 : 2, { camera: !dry, headless: dry });

console.log(`  competition code: ${code}`);

try {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await human.sleep(1600);
  await beat("landing");

  // typed by hand, character by character, like a candidate would
  const field = page.getByLabel("competition code");
  await human.type(field, code, { perChar: [110, 190] });
  await human.sleep(700);
  await beat("code-typed");

  await human.click(page.getByRole("button", { name: "Review application" }));
  await page.getByRole("button", { name: "Start application" }).waitFor({ state: "visible", timeout: 40000 });
  await human.sleep(2600);
  await beat("competition-preview");

  await human.click(page.getByRole("button", { name: "Start application" }));
  await page.waitForURL(/\/(assessment|interview\/check)/, { timeout: 40000 });
  await human.sleep(1500);

  if (page.url().includes("/assessment")) {
    await beat("assessment-plan");
    await human.scroll(260);
    await human.sleep(1800);
    const notice = page.locator('input[type="checkbox"]').first();
    if (!(await notice.isChecked())) await human.click(notice);
    await human.sleep(600);
    await beat("assessment-consent");
    await human.click(page.getByRole("button", { name: "Begin assessment" }));
    const open = page.getByRole("button", { name: /Check devices|Start interview|Start stage/ });
    await open.waitFor({ state: "visible", timeout: 40000 });
    await human.sleep(1900);
    await beat("stage-brief");
    await human.click(open);
    await page.waitForURL("**/interview/check**", { timeout: 40000 });
  }

  // ---- device check --------------------------------------------------------
  await human.sleep(1400);
  await beat("device-check");
  await human.click(page.getByRole("button", { name: "Run secure device checks" }));
  await page.getByRole("button", { name: "Run checks again" }).waitFor({ state: "visible", timeout: 60000 });
  await human.sleep(900);
  await page.evaluate(() => window.__wbxSpeak("mic-test")).catch(() => {});
  await human.sleep(3200);
  await beat("device-check-ok");

  /* Accepting the notice on the assessment page already recorded consent, so
     this box loads ticked. Clicking it would switch consent off and disable the
     start button, so the cursor reads down the disclosure instead. */
  const consentBox = page.getByLabel(/I consent to the disclosed AI-conducted interview/);
  const textOnlyBox = page.getByLabel(/I need the text-only accessibility mode/);
  await consentBox.scrollIntoViewIfNeeded().catch(() => {});
  if (await consentBox.isChecked()) {
    const box = await consentBox.boundingBox();
    if (box) {
      await human.driftTo(box.x + 60, box.y + 4);
      await human.sleep(600);
      await human.driftTo(box.x + 430, box.y + 56);
      await human.sleep(900);
    }
  } else {
    await human.click(consentBox);
  }
  await human.sleep(700);
  await beat("consent");

  const start = page.getByRole("button", { name: "Start interview" });
  for (let attempt = 1; ; attempt += 1) {
    // Every gate the start button reads, restored before the cursor commits.
    if (await textOnlyBox.isChecked()) {
      await textOnlyBox.uncheck();
      await human.click(page.getByRole("button", { name: "Run checks again" }));
      await page.waitForFunction(
        () => !document.body.innerText.includes("Checking devices"),
        { timeout: 60000 },
      );
      await human.sleep(1200);
    }
    if (!(await consentBox.isChecked())) await consentBox.check();
    await human.click(start);
    try {
      await page.waitForURL("**/interview/live**", { timeout: 12000 });
      break;
    } catch (reason) {
      if (attempt >= 3) throw reason;
      console.log(`  start interview did not open (attempt ${attempt}) — retrying`);
      await human.sleep(900);
    }
  }

  // ---- the interview -------------------------------------------------------
  const turns = await runInterview(page, { beat }, { maxTurns: 6, human });
  await human.sleep(3000);
  await beat("done");

  console.log("\n  turns:");
  for (const turn of turns) {
    console.log(`   #${turn.turn} [${turn.strategy}/${turn.transcription}] ${turn.clip}`);
    console.log(`      Q: ${turn.question.slice(0, 100)}`);
    console.log(`      T: ${(turn.transcript ?? "").slice(0, 100)}`);
  }
} catch (error) {
  console.log("  TAKE FAILED:", error.message);
  await page.screenshot({ path: `D:\\WhiteBoxAI_5\\demo-recorder\\takes\\part${dry ? 98 : 2}-failure.png` }).catch(() => {});
  process.exitCode = 1;
}

const { path } = await finish();
console.log("  video:", path);
