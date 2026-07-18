import { chromium } from "playwright";

const out = process.argv[2] ?? "screenshots";
const base = "http://localhost:3100";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

// ---- HR: create vacancy via NL→config wizard ----
await page.goto(base + "/vacancies/new", { waitUntil: "networkidle" });
await page.screenshot({ path: `${out}/10-wizard-branch.png` });

await page.getByText("Describe in natural language").click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/11-wizard-nl.png` });

await page.getByText("Generate config").click();
await page.waitForSelector("text=Evaluation categories", { timeout: 15000 });
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/12-wizard-config.png` });

await page.getByText("Publish competition").click();
await page.waitForSelector("text=Competition live", { timeout: 5000 });
await page.screenshot({ path: `${out}/13-wizard-published.png` });
const publishedCode = await page.locator("button.font-mono").first().innerText();
console.log("PUBLISHED CODE:", publishedCode.trim());

// ---- Candidate: enter code → system check → interview ----
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.getByLabel("competition code").fill("WBX-3N8D");
await page.getByText("Continue").click();
await page.waitForURL("**/interview/check**", { timeout: 8000 });
await page.waitForTimeout(3400); // checks run
await page.screenshot({ path: `${out}/14-system-check.png` });

await page.locator("input[type=checkbox]").check();
await page.getByText("Start interview").click();
await page.waitForURL("**/interview/live**", { timeout: 8000 });
await page.waitForSelector("textarea", { timeout: 15000 });
await page.screenshot({ path: `${out}/15-interview-question.png` });

// answer with a long, substantive answer (no follow-up path)
await page.locator("textarea").fill(
  "When our checkout conversion dropped 12% after a redesign, I pulled the funnel data, segmented by device, found the regression was mobile-only, and rolled back that surface the same day while we A/B tested the fix. I made the rollback call myself and walked the design team through the numbers behind it afterwards."
);
await page.getByText("Send answer").click();
await page.waitForTimeout(1600);
await page.screenshot({ path: `${out}/16-interview-next.png` });

// short answer → expect a follow-up probe
await page.locator("textarea").fill("I talked to the team and we fixed it.");
await page.getByText("Send answer").click();
await page.waitForTimeout(1600);
const followup = await page.locator("body").innerText();
console.log("FOLLOW-UP SHOWN:", /FOLLOW-UP/.test(followup));
await page.screenshot({ path: `${out}/17-interview-followup.png` });

// run to completion
for (let i = 0; i < 8; i++) {
  const ta = page.locator("textarea");
  if ((await ta.count()) === 0) break;
  await ta.fill(
    "A concrete example: I owned the situation end to end, made the decision explicitly, measured the outcome afterwards — retention improved by eight percent over the next quarter — and I documented what I would do differently next time."
  );
  await page.getByText("Send answer").click();
  await page.waitForTimeout(1500);
  if (await page.getByText("Interview complete").count()) break;
}
await page.screenshot({ path: `${out}/18-interview-complete.png` });
console.log("COMPLETE SHOWN:", (await page.getByText("Interview complete").count()) > 0);

await browser.close();
console.log("E2E OK");
