import { chromium } from "playwright";

const out = process.argv[2] ?? "screenshots";
const base = process.env.WBX_BASE_URL ?? "http://localhost:3100";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

// HR: preset → seven-step Studio → candidate preview → publish.
await page.goto(base + "/vacancies/new", { waitUntil: "networkidle" });
await page.screenshot({ path: `${out}/10-studio-entry.png` });

await page.getByRole("button", { name: /From preset/ }).click();
await page.getByText("Team Lead — Platform", { exact: true }).click();
await page.waitForSelector("text=Define the concrete workplace");
await page.screenshot({ path: `${out}/11-studio-profile.png` });

await page.getByRole("button", { name: /Preflight \/ Publish/ }).click();
await page.waitForSelector("text=Continuous validation");
await page.screenshot({ path: `${out}/12-studio-preflight.png` });

await page.getByRole("button", { name: "Preview as candidate" }).click();
await page.waitForSelector("text=Candidate preview");
await page.locator(".wb button.absolute").click();
await page.getByRole("button", { name: "Freeze config & publish" }).click();
await page.waitForSelector("text=Competition is live.", { timeout: 5000 });
await page.screenshot({ path: `${out}/13-studio-published.png` });
const publishedCode = (await page.locator("button.font-mono").filter({ hasText: /^WBX-/ }).innerText()).trim();
console.log("PUBLISHED CODE:", publishedCode);

// Candidate: newly published v2 code resolves through the same durable store.
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.getByLabel("competition code").fill(publishedCode);
await page.getByText("Continue").click();
await page.waitForURL("**/interview/check**", { timeout: 8000 });
await page.waitForTimeout(3400);
await page.screenshot({ path: `${out}/14-system-check.png` });

await page.locator("input[type=checkbox]").check();
await page.getByText("Start interview").click();
await page.waitForURL("**/interview/live**", { timeout: 8000 });
await page.waitForSelector("textarea", { timeout: 15000 });
await page.screenshot({ path: `${out}/15-interview-question.png` });

await page.locator("textarea").fill(
  "When a release failed, I took ownership, split the incident into reversible decisions, delegated recovery work, and kept stakeholders updated. We restored service in 23 minutes, reduced repeat incidents by 31%, and documented what changed.",
);
await page.getByText("Send answer").click();
await page.waitForTimeout(1600);
await page.screenshot({ path: `${out}/16-interview-next.png` });

for (let i = 0; i < 10; i++) {
  const answer = page.locator("textarea");
  if ((await answer.count()) === 0) break;
  await answer.fill(
    "A concrete example: I owned the decision, named the alternative I rejected, measured the outcome afterwards, and changed the team process so the improvement persisted.",
  );
  await page.getByText("Send answer").click();
  await page.waitForTimeout(1500);
  if (await page.getByText("Interview complete").count()) break;
}

await page.screenshot({ path: `${out}/17-interview-complete.png` });
console.log("COMPLETE SHOWN:", (await page.getByText("Interview complete").count()) > 0);
await browser.close();
console.log("E2E OK");
