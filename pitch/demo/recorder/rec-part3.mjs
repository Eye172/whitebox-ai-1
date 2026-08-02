/* PART 3 — the reviewer side.

   Verifies the transcripts, runs the real evaluation, files the human-stage
   receipt and ratings, then records a written decision into the audit chain.
   Every score on screen comes from the provider; nothing here is staged.

   The order is dictated by the product rule, not by convenience: filing human
   evidence invalidates the AI score on purpose, so the evaluation is re-run
   afterwards and the card is read in its final, consistent state. */

import { readFileSync } from "node:fs";
import { openSession, signIn, BASE } from "./session.mjs";
import { recordObservation } from "./human-stage.mjs";

const published = JSON.parse(readFileSync("D:\\WhiteBoxAI_5\\demo-recorder\\.published.json", "utf8"));
const dry = process.env.WBX_DRY === "1";
const candidate = process.env.CND ?? (dry ? "CND-DFA773" : "CND-93BDA7");

const DECISION_REASON =
  "Advancing to the hiring-manager panel. Evidence coverage is complete across all four published criteria and my independent ratings corroborate the AI reading: data accuracy is materially above the bar, commercial trade-off reasoning is sound, and stakeholder communication is the development area to probe on site.";

const { page, human, beat, finish } = await openSession(dry ? 97 : 3, { headless: dry });

const RANKING = `${BASE}/vacancies/${published.id}/ranking`;
const CARD = `${BASE}/vacancies/${published.id}/candidates/${candidate}`;

/* Each pending card carries one candidate id and one evaluate button; match the
   two together rather than trusting position, so the wrong person is never
   scored. */
async function evaluateButtonFor(id) {
  const index = await page.evaluate((wanted) => {
    const buttons = [...document.querySelectorAll("button")].filter((b) =>
      /Evaluate submitted evidence/.test(b.textContent ?? ""),
    );
    return buttons.findIndex((button) => {
      let node = button;
      for (let up = 0; up < 5 && node; up += 1) {
        const text = node.textContent ?? "";
        const owns = (text.match(/Evaluate submitted evidence/g) ?? []).length === 1;
        if (owns && text.includes(wanted)) return true;
        node = node.parentElement;
      }
      return false;
    });
  }, id);
  if (index < 0) return null;
  return page.getByRole("button", { name: "Evaluate submitted evidence" }).nth(index);
}

/* The transcripts href carries the application id, not the candidate id, so the
   link is matched through the card that names the candidate. */
async function transcriptHrefFor(id) {
  return page.evaluate((wanted) => {
    for (const link of document.querySelectorAll('a[href$="/transcripts"]')) {
      let node = link;
      for (let up = 0; up < 5 && node; up += 1) {
        const text = node.textContent ?? "";
        const owns = (text.match(/Review transcripts/g) ?? []).length === 1;
        if (owns && text.includes(wanted)) return link.getAttribute("href");
        node = node.parentElement;
      }
    }
    return null;
  }, id);
}

async function backToQueue() {
  const sidebar = page.locator('aside a[href$="/ranking"]').first();
  if (await sidebar.count()) {
    await human.click(sidebar);
    await page.waitForURL("**/ranking", { timeout: 30000 }).catch(() => {});
  } else {
    await page.goto(RANKING, { waitUntil: "networkidle" });
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  await human.sleep(1600);
}

async function runEvaluation(label, { navigate = true } = {}) {
  if (navigate) await backToQueue();
  const button = await evaluateButtonFor(candidate);
  if (!button) throw new Error(`no pending evaluate button for ${candidate}`);
  const settled = page.waitForResponse(
    (r) => r.url().includes("/evaluate") && r.request().method() === "POST",
    { timeout: 600000 },
  );
  await human.click(button);
  await beat(`${label}-started`);
  const response = await settled;
  const body = await response.json().catch(() => ({}));
  if (!response.ok()) throw new Error(`evaluate failed ${response.status()}`);
  const evaluation = body.application?.evaluation ?? body.evaluation;
  await page.waitForLoadState("networkidle").catch(() => {});
  await human.sleep(2400);
  await beat(`${label}-done`, { overall: evaluation?.overall, tier: evaluation?.tier });
  return evaluation;
}

const tab = async (name, label, { hold = 2200, after } = {}) => {
  await human.click(page.getByRole("button", { name, exact: true }));
  await page.waitForTimeout(900);
  await human.sleep(hold);
  await beat(label);
  if (after) await after();
};

try {
  // ---- into the workspace ---------------------------------------------------
  await signIn(page, human, beat);
  await human.click(page.getByRole("button", { name: "Sign in" }));
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await human.sleep(1100);
  await beat("dashboard");

  await human.click(page.locator('aside a[href="/vacancies"]').first());
  await page.waitForLoadState("networkidle").catch(() => {});
  await human.sleep(1400);
  await beat("vacancies");

  await human.click(page.locator(`a[href="/vacancies/${published.id}/ranking"]`).first());
  await page.waitForURL("**/ranking", { timeout: 30000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await human.sleep(2200);
  await beat("candidate-queue");

  // ---- verify the evidence before scoring it --------------------------------
  const transcripts = await transcriptHrefFor(candidate);
  if (!transcripts) throw new Error(`no transcripts link for ${candidate}`);
  await human.click(page.locator(`a[href="${transcripts}"]`).first());
  await page.waitForURL("**/transcripts", { timeout: 30000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await human.sleep(2600);
  await beat("transcript-provenance");
  await human.scroll(420);
  await human.sleep(2600);
  await beat("transcript-hash");

  // ---- first evaluation -----------------------------------------------------
  await runEvaluation("evaluation");

  // ---- the human receipt, which deliberately invalidates that score ----------
  await human.click(page.locator(`a[href$="/candidates/${candidate}"]`).first());
  await page.waitForURL(`**/candidates/${candidate}`, { timeout: 30000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await human.sleep(2000);
  await beat("scorecard-first-look");
  await recordObservation(page, { human, beat });

  // ---- rescore with the human evidence in place -----------------------------
  const evaluation = await runEvaluation("rescore");
  console.log(`  composite: ${evaluation?.overall} · ${evaluation?.tier} · coverage ${evaluation?.coverage}`);

  await human.click(page.locator(`a[href$="/candidates/${candidate}"]`).first());
  await page.waitForURL(`**/candidates/${candidate}`, { timeout: 30000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await human.sleep(2600);
  await beat("scorecard");

  // ---- read the evidence ----------------------------------------------------
  await human.scroll(300);
  await human.sleep(2400);
  await beat("strengths-read");
  await human.scroll(320);
  await human.sleep(2200);
  await beat("provenance");
  await human.scroll(-620);
  await human.sleep(900);

  await tab("Competencies", "competencies", { hold: 2800 });
  await tab("Assessment", "assessment-plan", {
    hold: 1800,
    after: async () => {
      await human.scroll(520);
      await human.sleep(2600);
      await beat("evidence-citations");
      await human.scroll(420);
      await human.sleep(2200);
      await beat("citations-read");
      await human.scroll(-940);
      await human.sleep(700);
    },
  });

  // ---- the decision ---------------------------------------------------------
  /* This vacancy's published review policy binds no per-criterion review
     targets, so the human stage is the immutable observation receipt filed
     above plus this named, written decision. */
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await human.sleep(1300);
  await human.click(page.getByRole("button", { name: "Advance", exact: true }));
  await human.sleep(1000);
  await beat("decision-opened");

  const reason = page.getByPlaceholder(/Cite the job-related evidence/i);
  await reason.waitFor({ state: "visible", timeout: 20000 });
  await human.paste(reason, DECISION_REASON);
  await human.sleep(700);
  await beat("reason-written");

  const filed = page.waitForResponse(
    (r) => /decision/i.test(r.url()) && r.request().method() === "POST",
    { timeout: 60000 },
  );
  const confirm = page.getByRole("button", { name: /Confirm and audit/i });
  await human.click(confirm);
  const filedResponse = await filed;
  if (!filedResponse.ok()) throw new Error(`decision failed ${filedResponse.status()}`);
  await page.waitForLoadState("networkidle").catch(() => {});
  await human.sleep(2400);
  await beat("decision-filed");

  // ---- the receipt ----------------------------------------------------------
  await tab("Audit", "audit-chain", { hold: 2800 });
  await human.scroll(300);
  await human.sleep(2600);
  await beat("done");
} catch (error) {
  console.log("  TAKE FAILED:", error.message);
  await page
    .screenshot({ path: `D:\\WhiteBoxAI_5\\demo-recorder\\takes\\part${dry ? 97 : 3}-failure.png`, fullPage: true })
    .catch(() => {});
  process.exitCode = 1;
}

const { path } = await finish();
console.log("  video:", path);
