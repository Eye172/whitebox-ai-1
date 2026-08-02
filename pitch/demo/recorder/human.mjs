/* Makes an automated browser session read like a person driving it.

   Playwright's own clicks teleport and leave no visible pointer, which is the
   single biggest tell in a screen recording. This module draws a cursor into
   the page, eases it to the target on a slightly curved path, pauses the way a
   hand does before committing, and types with uneven key timing. */

export const CURSOR_SCRIPT = () => {
  if (window.__wbxCursor) return;
  const cursor = document.createElement("div");
  cursor.id = "wbx-demo-cursor";
  cursor.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "width:22px",
    "height:22px",
    "margin:-2px 0 0 -2px",
    "pointer-events:none",
    "z-index:2147483647",
    "will-change:transform",
    "transform:translate3d(-100px,-100px,0)",
  ].join(";");
  cursor.innerHTML =
    '<svg viewBox="0 0 24 24" width="22" height="22" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.55))">' +
    '<path d="M5 2.5 L5 19.2 L9.3 15.2 L12.1 21.5 L14.9 20.2 L12.2 14.1 L18 14.1 Z" ' +
    'fill="#ffffff" stroke="rgba(0,0,0,.65)" stroke-width="1.1" stroke-linejoin="round"/></svg>';

  const ring = document.createElement("div");
  ring.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "width:34px",
    "height:34px",
    "margin:-17px 0 0 -17px",
    "border-radius:50%",
    "pointer-events:none",
    "z-index:2147483646",
    "opacity:0",
    "border:2px solid rgba(255,255,255,.9)",
    "will-change:transform,opacity",
  ].join(";");

  const mount = () => {
    if (!document.body) return;
    if (!cursor.isConnected) document.body.appendChild(cursor);
    if (!ring.isConnected) document.body.appendChild(ring);
  };
  mount();
  document.addEventListener("DOMContentLoaded", mount);
  // Client-side navigation can wipe the body children; keep the cursor pinned.
  setInterval(mount, 400);

  const state = { x: -100, y: -100 };
  window.__wbxCursor = {
    move(x, y) {
      state.x = x;
      state.y = y;
      cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
    },
    at: () => ({ ...state }),
    press() {
      ring.style.transition = "none";
      ring.style.transform = `translate3d(${state.x}px,${state.y}px,0) scale(.35)`;
      ring.style.opacity = "0.95";
      requestAnimationFrame(() => {
        ring.style.transition = "transform .42s cubic-bezier(.16,.8,.3,1), opacity .42s ease-out";
        ring.style.transform = `translate3d(${state.x}px,${state.y}px,0) scale(1.25)`;
        ring.style.opacity = "0";
      });
    },
  };
};

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rand = (min, max) => min + Math.random() * (max - min);

export function makeHuman(page, options = {}) {
  const speed = options.speed ?? 1;
  const pointer = { x: 780, y: 520 };

  const sleep = (ms) => page.waitForTimeout(Math.max(0, ms / speed));

  async function moveTo(x, y, { duration } = {}) {
    const from = { ...pointer };
    const distance = Math.hypot(x - from.x, y - from.y);
    if (distance < 1) return;
    const ms = duration ?? Math.min(900, Math.max(180, distance * 1.05)) / speed;
    const steps = Math.max(8, Math.round(ms / 16));
    // A slight arc perpendicular to the travel direction: hands do not draw
    // straight lines between two points.
    const bow = Math.min(46, distance * 0.13) * (Math.random() < 0.5 ? -1 : 1);
    const nx = -(y - from.y) / (distance || 1);
    const ny = (x - from.x) / (distance || 1);

    for (let step = 1; step <= steps; step += 1) {
      const t = easeInOut(step / steps);
      const arc = Math.sin((step / steps) * Math.PI) * bow;
      const px = from.x + (x - from.x) * t + nx * arc;
      const py = from.y + (y - from.y) * t + ny * arc;
      await page.mouse.move(px, py);
      await page.evaluate(([cx, cy]) => window.__wbxCursor?.move(cx, cy), [px, py]).catch(() => {});
      await page.waitForTimeout(Math.max(4, ms / steps));
    }
    pointer.x = x;
    pointer.y = y;
  }

  async function targetOf(locator) {
    await locator.waitFor({ state: "visible", timeout: 60000 });
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    const box = await locator.boundingBox();
    if (!box) throw new Error("target has no box");
    return {
      x: box.x + box.width * rand(0.35, 0.65),
      y: box.y + box.height * rand(0.38, 0.62),
    };
  }

  async function click(locator, { settle = 150 } = {}) {
    const { x, y } = await targetOf(locator);
    await moveTo(x, y);
    await sleep(rand(90, 210));
    await page.evaluate(() => window.__wbxCursor?.press()).catch(() => {});
    await page.mouse.down();
    await sleep(rand(45, 85));
    await page.mouse.up();
    await sleep(settle);
  }

  async function type(locator, text, { perChar = [26, 62] } = {}) {
    await click(locator, { settle: 60 });
    for (const char of text) {
      await page.keyboard.type(char);
      let delay = rand(perChar[0], perChar[1]);
      if (char === " " && Math.random() < 0.12) delay += rand(50, 130);
      if (".,:;".includes(char)) delay += rand(60, 150);
      await page.waitForTimeout(delay / speed);
    }
  }

  async function paste(locator, text) {
    // Long prose: type a natural-looking lead-in, then let the rest land at
    // realistic dictation speed so the shot is not thirty seconds of typing.
    await click(locator, { settle: 60 });
    const head = text.slice(0, 38);
    for (const char of head) {
      await page.keyboard.type(char);
      await page.waitForTimeout(rand(24, 52) / speed);
    }
    const rest = text.slice(38);
    const chunk = 4;
    for (let i = 0; i < rest.length; i += chunk) {
      await page.keyboard.type(rest.slice(i, i + chunk));
      await page.waitForTimeout(rand(9, 20) / speed);
    }
  }

  async function scroll(deltaY, { steps = 14 } = {}) {
    const per = deltaY / steps;
    for (let i = 0; i < steps; i += 1) {
      await page.mouse.wheel(0, per);
      await page.waitForTimeout(rand(14, 26) / speed);
    }
    await sleep(180);
  }

  async function driftTo(x, y) {
    await moveTo(x, y, { duration: rand(500, 800) });
  }

  return { click, type, paste, scroll, moveTo, driftTo, sleep, pointer };
}
