/* PART 1 — the employer side.
   Sign in, move through the workspace, then build and publish a vacancy with
   the real authoring model. Ends on the competition code, which part 2 uses. */

import { writeFileSync } from "node:fs";
import { openSession, signIn, BASE } from "./session.mjs";
import { ROLE_TITLE, ROLE_BRIEF } from "./brief.mjs";
import { guardVacancyDraft } from "./draft-guard.mjs";

const { page, human, beat, finish } = await openSession(1, { headless: false });
await guardVacancyDraft(page, ({ usable, problems, status }) =>
  console.log(`  authoring model: HTTP ${status} · ${usable ? "used live draft" : `substituted verified draft (${problems.join("; ")})`}`),
);

const tour = async (label, href, hold = 1500) => {
  await human.click(page.locator(`aside a[href="${href}"]`).first());
  await page.waitForLoadState("networkidle").catch(() => {});
  await human.sleep(hold);
  await beat(label);
};

try {
  // ---- sign in -------------------------------------------------------------
  await signIn(page, human, beat);
  await human.click(page.getByRole("button", { name: "Sign in" }));
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await human.sleep(1200);
  await beat("dashboard");

  // a slow pass across the KPI strip, the way someone reads it
  await human.driftTo(430, 300);
  await human.sleep(500);
  await human.driftTo(1080, 300);
  await human.sleep(700);
  await human.driftTo(760, 520);
  await human.sleep(900);
  await beat("dashboard-read");

  // ---- workspace tour ------------------------------------------------------
  await tour("tour-vacancies", "/vacancies", 1800);
  await tour("tour-analytics", "/analytics", 1700);
  await tour("tour-fairness", "/bias", 1700);
  await tour("tour-activity", "/audit", 1600);

  // ---- create the vacancy --------------------------------------------------
  await human.click(page.locator('aside a[href="/vacancies"]').first());
  await page.waitForLoadState("networkidle").catch(() => {});
  await human.sleep(600);
  await human.click(page.getByRole("link", { name: /Create vacancy/i }).first());
  await page.waitForURL("**/vacancies/new", { timeout: 30000 });
  await page.evaluate(() => localStorage.removeItem("wbx:v2:studio-draft"));
  await page.reload({ waitUntil: "networkidle" });
  await human.sleep(1100);
  await beat("studio-entry");

  await human.click(page.getByText("Describe", { exact: true }).first());
  await human.sleep(700);
  await beat("describe-mode");

  await human.type(page.getByPlaceholder("For example: Head of Platform Reliability"), ROLE_TITLE, {
    perChar: [42, 78],
  });
  await human.sleep(420);
  await human.paste(page.locator("textarea").first(), ROLE_BRIEF);
  await human.sleep(900);
  await beat("brief-written");

  const draftResponse = page.waitForResponse(
    (r) => r.url().includes("/api/ai/vacancy-draft") && r.request().method() === "POST",
    { timeout: 300000 },
  );
  await human.click(page.getByRole("button", { name: /Draft vacancy/ }));
  await beat("drafting-started");
  const drafted = await draftResponse;
  if (!drafted.ok()) throw new Error(`vacancy-draft returned ${drafted.status()}`);
  await page.waitForTimeout(2500);
  await beat("drafting-done");

  // The take is only usable if the model produced the lean first-screen shape.
  const shape = await page.evaluate(() => {
    const raw = localStorage.getItem("wbx:v2:studio-draft");
    if (!raw) return null;
    const draft = JSON.parse(raw).draft;
    return {
      criteria: draft.categories.flatMap((c) => c.attributes).length,
      blocks: draft.pipeline.map((b) => ({ kind: b.settings.kind, title: b.title, scored: b.scored })),
      questions: draft.pipeline.find((b) => b.settings.kind === "async_interview")?.settings.questions?.length ?? 0,
    };
  });
  console.log("  draft shape:", JSON.stringify(shape));
  const interviewBlocks = shape?.blocks.filter((b) => b.kind === "async_interview") ?? [];
  const extraBlocks = shape?.blocks.filter((b) => b.kind !== "async_interview" && b.kind !== "human_stage") ?? [];
  if (interviewBlocks.length !== 1 || extraBlocks.length > 0) {
    throw new Error(`unusable draft shape: ${JSON.stringify(shape?.blocks)} — rerun the take`);
  }

  // ---- walk the generated configuration ------------------------------------
  const step = async (name, label, hold = 1600) => {
    await human.click(page.getByRole("button", { name: new RegExp(name, "i") }).first());
    await human.sleep(hold);
    await beat(label);
  };

  await human.sleep(1400);
  await beat("step-profile");
  await human.scroll(340);
  await human.sleep(700);

  await step("Criteria", "step-criteria", 1500);
  await human.scroll(420);
  await human.sleep(1100);
  await beat("criteria-read");

  await step("Pipeline Composer", "step-pipeline", 1600);

  // open the interview stage so the depth of the per-block settings is visible,
  // then close it again — the generated configuration is kept as drafted
  const cards = await page
    .locator("div.rounded-xl", { has: page.getByRole("button", { name: "Edit" }) })
    .all();
  await human.click(cards[0].getByRole("button", { name: "Edit" }));
  await human.sleep(1200);
  await beat("block-settings-open");
  await human.scroll(560);
  await human.sleep(1200);

  // linger on the conversation policy and the frozen question plan
  const probes = page.locator('label:has(> span:text-is("Evidence probes")) select').first();
  const box = await probes.boundingBox().catch(() => null);
  if (box) await human.driftTo(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await human.sleep(1600);
  await beat("conversation-policy");
  await human.scroll(420);
  await human.sleep(1600);
  await beat("question-plan");

  await human.scroll(-980);
  await human.sleep(400);
  const done = page.getByRole("button", { name: /^Done$/ });
  if (await done.count()) await human.click(done.first());
  await human.sleep(900);

  await step("Scoring . Ranking", "step-scoring", 1700);
  await human.scroll(300);
  await human.sleep(900);

  await step("Preflight . Publish", "step-preflight", 1600);

  await human.click(page.getByRole("button", { name: /Preview as candidate/i }).first());
  await human.sleep(2200);
  await beat("candidate-preview");
  await human.click(page.getByRole("button", { name: /I reviewed this experience/i }).first());
  await human.sleep(1100);

  const publishResponse = page.waitForResponse(
    (r) => r.url().includes("/api/hr/vacancies/publish") && r.request().method() === "POST",
    { timeout: 120000 },
  );
  await human.click(page.getByRole("button", { name: /Freeze config . publish/i }).first());
  const publishBody = await (await publishResponse).json();
  if (!publishBody.vacancy?.code) throw new Error("publish did not return a code");
  writeFileSync(
    "D:\\WhiteBoxAI_5\\demo-recorder\\.published.json",
    JSON.stringify({ code: publishBody.vacancy.code, id: publishBody.vacancy.id }),
    "utf8",
  );
  await human.sleep(2400);
  await beat("published", { code: publishBody.vacancy.code });
  await human.driftTo(905, 500);
  await human.sleep(2200);
  await beat("code-held");
  console.log("  CODE:", publishBody.vacancy.code);
} catch (error) {
  console.log("  TAKE FAILED:", error.message);
  await page.screenshot({ path: "D:\\WhiteBoxAI_5\\demo-recorder\\takes\\part1-failure.png" }).catch(() => {});
  process.exitCode = 1;
}

const { path } = await finish();
console.log("  video:", path);
