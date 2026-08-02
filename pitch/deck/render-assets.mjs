/* Renders brand assets for the deck at print resolution.

   The cube geometry is copied verbatim from components/ui/primitives.tsx so the
   mark on the title slide is the same object that appears in the product and in
   the demo video — not a redraw. */

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "D:\\WhiteBoxAI_5\\deck\\assets";
mkdirSync(OUT, { recursive: true });

const CUBE = `
  <svg viewBox="0 0 100 100" width="100%" height="100%">
    <polygon points="50,8 88,28 50,48 12,28" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="0.75" stroke-linejoin="round"/>
    <polygon points="12,28 50,48 50,92 12,72" fill="#E9E9EC" stroke="#FFFFFF" stroke-width="0.75" stroke-linejoin="round"/>
    <polygon points="88,28 50,48 50,92 88,72" fill="#D8D8DC" stroke="#FFFFFF" stroke-width="0.75" stroke-linejoin="round"/>
  </svg>`;

const page = async (browser, html, width, height) => {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
  });
  const tab = await context.newPage();
  await tab.setContent(
    `<html><body style="margin:0;background:transparent">${html}</body></html>`,
    { waitUntil: "load" },
  );
  return { context, tab };
};

const browser = await chromium.launch({ headless: true, args: ["--force-color-profile=srgb"] });

/* the glowing mark, transparent background */
{
  const { context, tab } = await page(
    browser,
    `<div style="width:520px;height:520px;display:flex;align-items:center;justify-content:center">
       <div style="width:400px;height:400px;filter:drop-shadow(0 0 46px rgba(190,200,255,.42)) drop-shadow(0 0 14px rgba(255,255,255,.30))">${CUBE}</div>
     </div>`,
    520,
    520,
  );
  await tab.screenshot({ path: `${OUT}\\cube.png`, omitBackground: true });
  await context.close();
}

/* small flat mark for slide corners */
{
  const { context, tab } = await page(
    browser,
    `<div style="width:160px;height:160px;padding:10px;box-sizing:border-box">${CUBE}</div>`,
    160,
    160,
  );
  await tab.screenshot({ path: `${OUT}\\cube-flat.png`, omitBackground: true });
  await context.close();
}

await browser.close();
console.log("assets written to", OUT);
