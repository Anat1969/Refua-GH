// The pathology lab page: draws a report in 3D, and keeps the report out of the repository.
// Run: python3 -m http.server 8765, then node tests/lab-pathology.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:8765';
let failed = 0;
const ok = (name, cond) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}`); if (!cond) failed++; };

(async () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'lab', 'pathology.html'), 'utf8');
  ok('declaration is on the page', src.includes('לא מאבחנת ולא מטפלת') && src.includes('tel:101'));
  ok('root is rtl', /<html[^>]+dir="rtl"/.test(src));

  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const posts = []; page.on('request', (r) => { if (r.method() !== 'GET') posts.push(r.url()); });
  await page.goto(`${BASE}/lab/pathology.html`);
  await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 90000 });
  ok('example banner shows without a report', await page.locator('#demo').isVisible());
  ok('body view is the first view', (await page.locator('button[data-view="body"]').getAttribute('aria-pressed')) === 'true');
  ok('two pins in the body view', (await page.locator('.tag.pin:visible').count()) === 2);

  await page.locator('button[data-view="spec"]').click();
  ok('six margin labels on the specimen', (await page.locator('.tag[data-dir]:visible').count()) === 6);
  ok('six rows in the margin table', (await page.locator('#mg tr').count()) === 7);
  ok('the nearest margin is marked once', (await page.locator('#mg tr.near').count()) === 1);

  await page.locator('#edit summary').click();
  await page.locator('#form [name="side"]').selectOption('L');
  await page.locator('#form [name="dAnt"]').fill('<1');
  ok('an edit moves the report into the address', /#r=[\w-]+/.test(page.url()));
  ok('the example banner leaves after an edit', !(await page.locator('#demo').isVisible()));
  ok('the glance follows the edit', (await page.locator('#glance').innerText()).includes('קדמי'));
  const link = page.url();
  const p2 = await browser.newPage({ viewport: { width: 390, height: 800 } });
  await p2.goto(link);
  await p2.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 90000 });
  ok('the personal link restores the report', (await p2.locator('#find').innerText()).includes('שד שמאל'));
  ok('no horizontal scroll on a phone', await p2.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  ok('nothing is sent to a server', posts.length === 0);
  ok('no page errors', errors.length === 0);
  if (errors.length) console.log(errors);
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
