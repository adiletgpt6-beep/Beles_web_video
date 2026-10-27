// Captures real public pages of https://www.zeket.kg/ in Kyrgyz (/ky).
// Only public pages are opened: no forms, sign-ups or donations.
// Output: public/site/*.png — the Remotion render uses these saved frames (deterministic, no live page).
// Usage: node scripts/capture-site.cjs   (needs Playwright + Chromium)
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');
const OUT = path.join(__dirname, '..', 'public', 'site');
fs.mkdirSync(OUT, { recursive: true });

const settle = async (p) => {
  await p.waitForLoadState('networkidle');
  await p.waitForTimeout(2500);
};

(async () => {
  const b = await chromium.launch();
  const d = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  for (const [url, name] of [
    ['https://www.zeket.kg/ky', 'desktop-home-ky'],
    ['https://www.zeket.kg/ky/fund-reports', 'desktop-reports-ky'],
  ]) {
    await d.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
    await settle(d);
    await d.screenshot({ path: `${OUT}/${name}-full.png`, fullPage: true });
  }

  // Mobile (iPhone 13 emulation, 390 css px wide)
  const mc = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 3 });
  const m = await mc.newPage();
  await m.goto('https://www.zeket.kg/ky', { waitUntil: 'networkidle', timeout: 90000 });
  await settle(m);
  await m.screenshot({ path: `${OUT}/mobile-home-ky-full.png`, fullPage: true });
  await b.close();
  console.log('ok');
})();
