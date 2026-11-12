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
  // The example case: a named person's path, shown at her request, from the disease card and from the home page.
  const p3 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  p3.on('pageerror', (e) => errors.push(e.message));
  await p3.addInitScript(() => { try { localStorage.setItem('refua.mode', '2d'); } catch {} });
  await p3.goto(`${BASE}/lab/pathology.html?case=anat`);
  await p3.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 90000 });
  ok('the case card shows its name and seven steps', (await p3.locator('#case h2').innerText()).length > 3 && (await p3.locator('#case li').count()) === 7);
  ok('the case places the specimen in the breast', (await p3.locator('.tag.pin[data-pin="breast"]').innerText()).includes('שעה 8, חיצוני־תחתון'));
  ok('a case step moves the stage', await (async () => { await p3.locator('#case li[data-view="nodes"]').click(); return (await p3.locator('button[data-view="nodes"]').getAttribute('aria-pressed')) === 'true'; })());
  await p3.goto(`${BASE}/#s=reproductive&v=disease&d=breast-cancer&f=cancer`);
  await p3.waitForSelector('a.case-go');
  ok('the disease card opens the case inside the app', (await p3.locator('a.case-go').getAttribute('href')).includes('&c=anat'));
  await p3.locator('a.case-go').click();
  await p3.waitForSelector('.case-steps.live li.on');
  ok('the case keeps the app frame: same bar, same stage, seven steps', (await p3.locator('.case-steps.live li').count()) === 7 && await p3.locator('header.bar ai-menu').count() === 1 && await p3.locator('.frame-main .stage').isVisible());
  await p3.locator('[data-case-go="5"]').click();
  ok('a step is written into the address', p3.url().includes('cs=5') && (await p3.locator('.case-steps.live li.on > b').innerText()) === 'בלוטות');
  ok('the margins table marks the nearest side once', (await p3.locator('.case-mg tr.near').count()) === 1);
  await p3.goto(`${BASE}/#s=reproductive&v=disease&d=breast-cancer&f=cancer&l=2`);
  await p3.waitForSelector('.case-block');
  ok('level two tells the case in steps', (await p3.locator('.case-steps li').count()) === 7);
  await p3.goto(`${BASE}/`); await p3.reload();
  await p3.waitForSelector('a.home-case img');
  ok('the home page shows the case next to the video slot', await p3.evaluate(() => { const f = document.querySelector('.home-feature'); const im = f.querySelector('a.home-case img'); return !!f.querySelector('[data-aoa-demo]') && im.complete && im.naturalWidth > 100; }));
  // The lymphatic network and the living body, inside the app's own 3D body.
  const p4 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  p4.on('pageerror', (e) => errors.push(e.message));
  await p4.addInitScript(() => { try { localStorage.setItem('refua.mode', '3d'); } catch {} });
  await p4.goto(`${BASE}/#s=immune&m=3d`, { waitUntil: 'domcontentloaded' });
  await p4.waitForSelector('.b3-more summary', { timeout: 90000 });
  await p4.waitForFunction(() => (document.querySelector('.b3-more summary b')?.textContent || '').trim().startsWith('10 '), null, { timeout: 90000 });
  ok('the immune and lymph system holds ten structures: duct, vessels, six node groups, thymus, spleen, tonsils', true);
  await p4.locator('.b3-more summary').click();
  ok('the lymph schema is said to be a schema', (await p4.locator('.b3-gap').innerText()).includes('סכמה'));
  ok('the motion button starts off', (await p4.locator('[data-b3-move]').getAttribute('aria-pressed')) === 'false');
  await p4.locator('[data-b3-move]').click();
  ok('the motion button turns on and says what to press to stop', (await p4.locator('[data-b3-move]').getAttribute('aria-pressed')) === 'true' && (await p4.locator('[data-b3-move]').innerText()) === 'עצירה');
  ok('the caption names the direction of the lymph', (await p4.locator('.b3-motion').innerText()).includes('כיוון אחד'));
  await p4.goto(`${BASE}/#s=cardio&m=3d`, { waitUntil: 'domcontentloaded' });
  await p4.waitForSelector('.b3-card');
  ok('blood has two colours: red for oxygen-rich, blue for oxygen-poor', await p4.evaluate(() => { const r = getComputedStyle(document.documentElement); return r.getPropertyValue('--blood-rich').trim() === '#c8322b' && r.getPropertyValue('--blood-poor').trim() === '#2a55b8'; }));
  await p4.close();
  ok('nothing is sent to a server', posts.length === 0);
  ok('no page errors', errors.length === 0);
  if (errors.length) console.log(errors);
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
