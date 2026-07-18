// Mobile overflow audit: measures scrollWidth vs innerWidth on key screens.
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:5174';
const ROUTES = [
  ['/', 'AuthSelection'],
  ['/#/vet/login', 'VetLogin'],
  ['/#/admin/login', 'AdminLogin'],
  ['/#/vet/register', 'VetRegister'],
  ['/#/vet/forgot', 'VetForgot'],
];
const VIEWPORTS = [
  { width: 360, height: 640, label: '360x640 (Android)' },
  { width: 390, height: 844, label: '390x844 (iPhone)' },
];

(async () => {
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    console.log(`\n=== Viewport ${vp.label} ===`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    for (const [route, name] of ROUTES) {
      try {
        await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(800);
        const m = await page.evaluate(() => {
          const de = document.documentElement;
          const offenders = [];
          document.querySelectorAll('*').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width > window.innerWidth + 1) {
              const cls = (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').toString().slice(0, 80);
              offenders.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} w=${Math.round(r.width)} class="${cls}"`);
            }
          });
          return {
            innerWidth: window.innerWidth,
            scrollWidth: de.scrollWidth,
            overflowX: de.scrollWidth > window.innerWidth + 1,
            offenders: offenders.slice(0, 8),
          };
        });
        const flag = m.overflowX ? '❌ OVERFLOW' : '✅ ok';
        console.log(`${flag} ${name}: scrollWidth=${m.scrollWidth} innerWidth=${m.innerWidth}`);
        m.offenders.forEach((o) => console.log(`    ↳ ${o}`));
      } catch (e) {
        console.log(`⚠️  ${name}: ${e.message.split('\n')[0]}`);
      }
    }
    await page.close();
  }
  await browser.close();
})();
