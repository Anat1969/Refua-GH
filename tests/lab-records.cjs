// "התיק שלי": reads a lab report inside the device, and keeps it out of the repository and off the network.
// Run: python3 -m http.server 8765, then node tests/lab-records.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:8765';
let failed = 0;
const ok = (name, cond) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}`); if (!cond) failed++; };

(async () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'lab', 'records.html'), 'utf8');
  ok('declaration is on the page', src.includes('לא מאבחנת ולא מטפלת') && src.includes('tel:101') && src.includes('tel:1201'));
  ok('root is rtl', /<html[^>]+dir="rtl"/.test(src));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const sent = []; page.on('request', (r) => { if (r.method() !== 'GET') sent.push(r.url()); });
  await page.goto(`${BASE}/lab/records.html`);
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  ok('example banner shows on an empty file', await page.locator('#demo').isVisible());
  ok('example plates are drawn', (await page.locator('.plate').count()) >= 4);
  ok('a changed or flagged value lands in the questions', (await page.locator('#qs li').count()) >= 2);

  // Paste path
  await page.locator('#pastebox summary').click();
  await page.locator('#paste').fill('תאריך 03.02.2026\n14.0 g/dL HB\n5.4 K/µl WBC\n0.6 % BASO %\n0 LIPEMIC\n61 U/L ALT (GPT)\n0.9 PT-INR');
  await page.locator('#readPaste').click();
  ok('the review counts five tests', (await page.locator('#revOk').innerText()).includes('5'));
  ok('the report date is read', (await page.locator('#revDate').inputValue()) === '2026-02-03');
  await page.locator('#save').click();
  ok('the example leaves after a save', !(await page.locator('#demo').isVisible()));
  ok('one report in the file', (await page.locator('#reports li').count()) === 1);
  ok('the liver plate shows ALT', (await page.locator('.plate[data-g="liver"] .row[data-id="alt"]').count()) === 1);

  // PDF path (fictional fixture)
  const pdfOk = await page.evaluate(async () => { try { await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs'); return true; } catch { return false; } });
  if (pdfOk) {
    await page.locator('#file').setInputFiles(path.join(__dirname, 'fixtures', 'lab-example.pdf'));
    await page.waitForSelector('#review:not([hidden])', { timeout: 30000 });
    const rev = await page.locator('#revOk').innerText();
    ok('the PDF yields ten tests', rev.includes('10'));
    ok('the earliest date in the PDF is the test date', (await page.locator('#revDate').inputValue()) === '2026-05-14');
    ok('an unknown line is reported, not guessed', (await page.locator('#revMiss').innerText()).includes('UNKNOWN'));
    await page.locator('#save').click();
    ok('two reports in the file', (await page.locator('#reports li').count()) === 2);
    ok('the lab flag is shown', (await page.locator('.row[data-id="alt"] .flag').count()) === 1);
    ok('the lab range is quoted at the depth level', src.includes('בלשון הדוח'));
    ok('a trend line appears with two dates', (await page.locator('.row[data-id="hb"] svg.spark').count()) === 1);
  } else console.log('skip PDF path: cdnjs is not reachable');

  // Persistence and privacy
  await page.reload(); await page.waitForFunction(() => document.body.dataset.ready === '1');
  ok('the file survives a reload', (await page.locator('#reports li').count()) >= 1);
  ok('nothing was sent from the page', sent.length === 0);
  ok('the address carries no values', !/\d/.test(new URL(page.url()).hash));

  // Phone
  const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await p2.goto(`${BASE}/lab/records.html`); await p2.waitForFunction(() => document.body.dataset.ready === '1');
  ok('no horizontal scroll on a phone', await p2.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  if (process.env.SHOTS) {
    await page.screenshot({ path: `${process.env.SHOTS}/records-desktop.png`, fullPage: true });
    await p2.screenshot({ path: `${process.env.SHOTS}/records-phone.png`, fullPage: true });
  }
  ok('no page errors', errors.length === 0);
  if (errors.length) console.log(errors);
  await browser.close();
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();
