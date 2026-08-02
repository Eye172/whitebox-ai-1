/* Completes the hiring-manager stage: one structured observation receipt, then
   an independent BARS rating per published criterion. Until a named human has
   done this, the composite deliberately stays incomplete — that is the whole
   point of the product, so it has to actually happen, not be faked. */

export const OBSERVATION =
  "Scheduled review of the recorded responses against the four published criteria. " +
  "Candidate traced a GMV to finance variance to double-counted refunded orders and left a daily reconciliation " +
  "check in place; modelled the take-rate change against the break-even volume lift before recommending a narrower " +
  "discount; separated confident figures from thin-data estimates when advising the commercial director; and " +
  "escalated a first-payout failure pattern found outside the original request. Evidence is job-related and " +
  "consistent across all four answers.";

const RATINGS = [
  {
    match: /SQL and data accuracy/i,
    level: 5,
    evidence:
      "Rebuilt the metric from raw order events, identified duplicate handling of re-captured refunds, and added a daily warehouse-to-provider reconciliation that has since caught two upstream defects.",
    rationale:
      "Anchor 5 is met: the fix is systematic rather than one-off — reusable reconciliation logic plus daily monitoring that prevents the error class recurring, with the residual variance stated rather than hidden.",
  },
  {
    match: /Unit economics/i,
    level: 4,
    evidence:
      "Modelled contribution margin per order against the volume lift required to break even at a lower take rate, compared it with observed cohort lift, and recommended a narrower new-merchant discount.",
    rationale:
      "Anchor 4 is fully met: two credible options compared, the break-even assumption stated, and the analysis changes the recommended commercial action. Anchor 5 is not reached — no account of interactions or of what further evidence would reverse the recommendation.",
  },
  {
    match: /stakeholder recommendation/i,
    level: 3,
    evidence:
      "Reduced payback to a single decision-ready slide with the median, the channel range and the underlying driver, and named which figure was an estimate on thin data.",
    rationale:
      "Anchor 3 is fully met: finding, trade-off and recommended action in plain language, tied to the director's budget decision. Anchor 4 is not evidenced — no challenge or alternative interpretation was handled in the example given.",
  },
  {
    match: /Outcome ownership/i,
    level: 4,
    evidence:
      "Noticed a first-payout failure pattern while answering a different request, quantified it with the payments team, raised it, and followed the retry-logic change through to a measured churn outcome.",
    rationale:
      "Anchor 4 is fully met: dependency spotted outside the original request, the payments team aligned on the next step, and the analysis adapted once the evidence changed the decision. Anchor 5 would require a repeatable ownership mechanism.",
  },
];

/* Recording the observation invalidates the AI evaluation by design — new human
   evidence must not sit behind a stale score — which drops the candidate out of
   the ranking the card is reached through. So the two halves are separate: the
   receipt is filed, the evaluation is re-run, and only then can the ratings that
   hang off the receipt be recorded. */
export async function recordObservation(page, { human, beat } = {}) {
  const press = async (locator) => (human ? human.click(locator) : locator.click());

  await press(page.getByRole("button", { name: "Assessment", exact: true }));
  await page.waitForTimeout(1400);
  await beat?.("assessment-tab");

  const observation = page.getByPlaceholder(/Observed situation/i);
  await observation.waitFor({ state: "visible", timeout: 30000 });
  await observation.scrollIntoViewIfNeeded();
  if (human) await human.paste(observation, OBSERVATION);
  else await observation.fill(OBSERVATION);
  await beat?.("observation-written");

  const saved = page.waitForResponse(
    (r) => r.url().includes("/observations") && r.request().method() === "POST",
    { timeout: 60000 },
  );
  await press(page.getByRole("button", { name: /Save immutable observation receipt/i }));
  const savedResponse = await saved;
  if (!savedResponse.ok()) {
    throw new Error(`observation receipt failed ${savedResponse.status()}`);
  }
  await page.waitForTimeout(1500);
  await beat?.("observation-saved");
}

/* One independent rating per criterion, in whatever order the page lists them.
   Assumes the card is open on a fresh load carrying the saved receipt. */
export async function recordRatings(page, { human, beat } = {}) {
  const press = async (locator) => (human ? human.click(locator) : locator.click());

  await press(page.getByRole("button", { name: "Assessment", exact: true }));
  await page.waitForTimeout(1600);

  const record = page.getByRole("button", { name: /Record independent review/i });
  await record.first().waitFor({ state: "visible", timeout: 30000 }).catch(() => {});
  const total = await record.count();
  console.log(`  review targets: ${total}`);
  for (let index = 0; index < total; index += 1) {
    const criterion = await page.evaluate((position) => {
      const buttons = [...document.querySelectorAll("button")].filter((b) =>
        /Record independent review/i.test(b.textContent ?? ""),
      );
      let node = buttons[position];
      while (node && !/independent review required/.test(node.textContent ?? "")) {
        node = node.parentElement;
      }
      const heading = [...(node?.querySelectorAll("*") ?? [])].find(
        (el) => el.children.length === 0 && /independent review required/.test(el.textContent ?? ""),
      );
      return heading?.textContent?.trim() ?? "";
    }, index);

    const rating = RATINGS.find((candidate) => candidate.match.test(criterion));
    if (!rating) {
      console.log(`  no rating configured for "${criterion}" — skipped`);
      continue;
    }

    const card = record.nth(index).locator("xpath=ancestor::div[contains(@class,'rounded')][1]");
    const anchor = card.getByRole("button", { name: new RegExp(`^L${rating.level}\\b`) }).first();
    await anchor.scrollIntoViewIfNeeded().catch(() => {});
    await press(anchor);
    await page.waitForTimeout(300);

    await card.getByPlaceholder(/Record only job-related observed evidence/i).fill(rating.evidence);
    await card.getByPlaceholder(/Explain how the evidence maps/i).fill(rating.rationale);
    await page.waitForTimeout(300);

    const recorded = page.waitForResponse(
      (r) => r.url().includes("/assessment-reviews") && r.request().method() === "POST",
      { timeout: 60000 },
    );
    await press(record.nth(index));
    const response = await recorded;
    if (!response.ok()) {
      throw new Error(`review for "${criterion}" failed ${response.status()}: ${(await response.text()).slice(0, 300)}`);
    }
    await page.waitForTimeout(1400);
    await beat?.(`rated-${index + 1}`, { criterion, level: rating.level });
  }
}

/* Kept for the rehearsal scripts that drive both halves in one pass against a
   candidate whose evaluation is re-run in between by the caller. */
export async function completeHumanStage(page, hooks = {}) {
  await recordObservation(page, hooks);
  await page.reload({ waitUntil: "networkidle" });
  await recordRatings(page, hooks);
}
