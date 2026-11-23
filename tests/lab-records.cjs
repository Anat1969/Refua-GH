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

  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const sent = []; page.on('request', (r) => { if (r.method() !== 'GET') sent.push(r.url()); });
  await page.goto(`${BASE}/lab/records.html`);
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  ok('example banner shows on an empty file', await page.locator('#demo').isVisible());
  ok('example plates are drawn', (await page.locator('.plate').count()) >= 4);
  ok('a changed or flagged value lands in the questions', (await page.locator('#qs li').count()) >= 2);
  ok('the top bar is on the page, with the tests button marked', (await page.locator('.tb-nav a[aria-current="page"]').innerText()).includes('בדיקות'));
  ok('the top bar leads back into the atlas', (await page.locator('.tb-nav a[data-nav="diseases"]').getAttribute('href')).includes('v=diseases'));
  ok('the file opens on the whole body', (await page.locator('#fcard h2').innerText()).includes('על הגוף'));
  ok('every place the tests touch is listed', (await page.locator('#fcard .place').count()) >= 4);
  ok('the date strip shows two dates', (await page.locator('#dates .dt').count()) === 2);
  await page.locator('#dates .dt').first().click();
  ok('an earlier date moves the file back in time', (await page.locator('#glance').innerText()).includes('התאריך המוצג') && (await page.locator('.row[data-id="inr"]').count()) === 0);
  await page.locator('#dates .dt').last().click();
  ok('a value that moved says which way', (await page.locator('.row[data-id="ast"] .mv').innerText()) === 'עלה');
  await page.locator('#fcard .place').first().click();
  ok('a place opens a test card', (await page.locator('#fcard .chain li').count()) === 3);
  ok('the card tells the chain in three steps', (await page.locator('#fcard .chain li').count()) === 3);
  ok('the card says what moves the value', (await page.locator('#fcard .moves li').count()) >= 3);
  ok('the card says who fixes it, without a treatment', (await page.locator('#fcard .fix').innerText()).includes('הרופא'));
  await page.locator('.row[data-id="creat"]').click();
  ok('a row click moves the card', (await page.locator('#fcard h2').innerText()) === 'קריאטינין');
  ok('the body names the organ', (await page.locator('#where').innerText()).includes('הכליות'));
  await page.waitForFunction(() => document.body.dataset.atlas === '1', null, { timeout: 90000 });
  ok('the 3D body is drawn', (await page.locator('#atlas3d canvas').count()) === 1);
  const pending = await page.locator('#fAsk').innerText();
  await page.locator('#fAsk').click();
  ok('the card button adds the question', (await page.locator('#fAsk').innerText()) !== pending);
  await page.locator('#toMap').click();
  ok('back to the whole body', (await page.locator('#fcard .place').count()) >= 4);

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
