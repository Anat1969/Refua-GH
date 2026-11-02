// End-to-end check: every button, URL state, RTL, fit to screen, no horizontal scroll,
// reduced motion, installability, no JS errors. Screenshots go to SHOTS (default: tests/shots).
// Run: python3 -m http.server 8765  &&  node tests/e2e.cjs
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.BASE || 'http://localhost:8765/';
const SHOTS = process.env.SHOTS || path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const AIMENU = fs.readFileSync(path.join(__dirname, 'ai-menu.local.js'), 'utf8');

let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };

const SIZES = [[1920, 1080], [1440, 900], [1280, 720], [390, 844]];

(async () => {
  const browser = await chromium.launch();

  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/ai-menu.js', (r) => r.fulfill({ body: AIMENU, contentType: 'text/javascript' }));
    await page.route('**/fonts.g*/**', (r) => r.continue());
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForSelector('.panel h2');

    const m = await page.evaluate(() => {
      const visibleItems = [...document.querySelectorAll('.item, .sysmark, .layers-legend li, .alert')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight;
      }).length;
      return {
        ratio: +(document.documentElement.scrollHeight / innerHeight).toFixed(2),
        hscroll: document.documentElement.scrollWidth > innerWidth + 1,
        dir: getComputedStyle(document.body).direction,
        rootDir: document.documentElement.dir,
        visibleItems,
        panelInView: (() => { const r = document.querySelector('.panel').getBoundingClientRect(); return r.top < innerHeight; })(),
      };
    });
    const tag = `${w}x${h}`;
    ok(m.rootDir === 'rtl' && m.dir === 'rtl', `${tag} RTL at root and body`);
    ok(!m.hscroll, `${tag} no horizontal scroll`);
    ok(w < 1000 ? m.ratio <= 1.5 : m.ratio <= 1.0, `${tag} scroll ratio ${m.ratio} (items visible without scroll: ${m.visibleItems})`);
    ok(await page.locator('ai-menu .logo, ai-menu').first().isVisible(), `${tag} A&I logo in the bar`);
    await page.screenshot({ path: path.join(SHOTS, `home-${tag}.png`) });

    if (w === 1440) {
      // Every system via its label
      const ids = await page.$$eval('.sysmark', (els) => els.map((e) => e.dataset.id));
      ok(ids.length === 6, 'six system labels');
      for (const id of ids) {
        await page.click(`.sysmark[data-id="${id}"] text`);
        await page.waitForFunction((i) => location.hash.includes(`s=${i}`) && document.querySelector(`.sys[data-id="${i}"]`).classList.contains('on') && document.querySelectorAll('.panel .block').length === 4, id);
        const st = await page.evaluate((i) => ({
          on: document.querySelector(`.sys[data-id="${i}"]`).classList.contains('on'),
          pressed: document.querySelector(`.sysmark[data-id="${i}"]`).getAttribute('aria-pressed'),
          blocks: document.querySelectorAll('.panel .block').length,
          src: document.querySelectorAll('.panel .item.l-known .src').length,
          known: document.querySelectorAll('.panel .item.l-known').length,
        }), id);
        ok(st.on && st.pressed === 'true' && st.blocks === 4 && st.src === st.known, `system ${id}: layer on, 4 blocks, ${st.known} known items all sourced`);
      }
      // Click on an organ (not the label)
      await page.locator('.sys[data-id="digestive"] path').nth(1).dispatchEvent('click');
      await page.waitForFunction(() => location.hash.includes('s=digestive'));
      ok(true, 'click on organ selects its system');
      // Prev / next
      await page.click('[data-go="1"]');
      await page.waitForFunction(() => location.hash.includes('s=skeletal'));
      await page.click('[data-go="-1"]');
      await page.waitForFunction(() => location.hash.includes('s=digestive'));
      ok(true, 'next and previous buttons');
      // Keyboard (RTL: left = next)
      await page.keyboard.press('ArrowLeft');
      await page.waitForFunction(() => location.hash.includes('s=skeletal'));
      ok(true, 'arrow keys move between systems');
      await page.focus('.sysmark[data-id="immune"]');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => location.hash.includes('s=immune'));
      ok(true, 'Enter on focused label selects');
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(SHOTS, `immune-${tag}.png`) });
      // Views
      await page.click('[data-view="emergency"]');
      await page.waitForFunction(() => location.hash.includes('v=emergency') && document.querySelectorAll('.signs li').length > 0);
      ok((await page.$$('.signs li')).length === 6, 'emergency view lists 6 signs');
      await page.screenshot({ path: path.join(SHOTS, `emergency-${tag}.png`) });
      await page.click('.sign-row[data-pick="cardio"]');
      await page.waitForFunction(() => location.hash === '#s=cardio');
      ok(true, 'sign row opens its system');
      await page.click('[data-view="sources"]');
      await page.waitForFunction(() => location.hash.includes('v=sources') && document.querySelectorAll('.sources li').length > 0);
      const n = await page.$$eval('.sources li', (l) => l.length);
      ok(n >= 20, `sources view lists ${n} sources`);
      await page.screenshot({ path: path.join(SHOTS, `sources-${tag}.png`) });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !location.hash.includes('v='));
      ok(true, 'Escape closes a view');
      // State survives reload
      await page.goto(BASE + '#s=respiratory&v=sources');
      await page.waitForSelector('.sources');
      ok(await page.evaluate(() => document.querySelector('.sysmark.on').dataset.id === 'respiratory'), 'state restored from URL after reload');
      // Brand goes home
      await page.click('.brand');
      await page.waitForFunction(() => location.hash === '#s=cardio');
      ok(true, 'app name links home');
      // Installability
      const cdp = await ctx.newCDPSession(page);
      await page.goto(BASE);
      await page.waitForTimeout(800);
      const inst = await cdp.send('Page.getInstallabilityErrors');
      ok(inst.installabilityErrors.length === 0, `installable (${JSON.stringify(inst.installabilityErrors.map((e) => e.errorId))})`);
      // Text overlap check on the SVG labels
      const overlap = await page.evaluate(() => {
        const r = [...document.querySelectorAll('.sysmark text')].map((t) => t.getBoundingClientRect());
        for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
          const a = r[i], b = r[j];
          if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) return true;
        }
        return false;
      });
      ok(!overlap, 'labels do not overlap');

      // ---------- Stage 1: safety layer ----------
      const PHRASES = [
        ['קוצר נשימה', 'breath', '101'], ['יש לי כאב חזק בחזה', 'chest', '101'], ['התנפחות', 'swelling', '101'],
        ['הרעלה', 'poison', '04-7771900'], ['בליעה אצל ילד', 'child-swallow', '101'], ['מחשבות אובדניות', 'suicide', '1201'],
        ['הפסקתי לקחת אינסולין', 'med-stop', '101'],
      ];
      for (const [phrase, id, num] of PHRASES) {
        await page.fill('#search', '');
        await page.type('#search', phrase, { delay: 5 });
        await page.waitForSelector(`.alert-card[data-alert="${id}"]`, { timeout: 3000 });
        const r = await page.evaluate(() => ({
          first: document.querySelector('.alert-card').dataset.alert,
          nums: [...document.querySelectorAll('.alert-card .numcard b')].map((b) => b.textContent),
          red: document.querySelectorAll('.results .is-red').length,
          top: document.querySelector('.alert-card').getBoundingClientRect().top < innerHeight,
        }));
        ok(r.first === id && r.nums.includes(num) && r.top, `keyword "${phrase}" shows ${id} first with ${num}, in view`);
        if (id === 'med-stop') ok(r.red === 0 && !(await page.$('.counts')), 'stopped medication: no plant content on screen');
        if (id === 'suicide') { await page.waitForTimeout(400); ok(!(await page.$('.empty')), 'suicide alert: no "no results" text under it'); }
        if (id === 'suicide') await page.screenshot({ path: path.join(SHOTS, `alert-suicide-${tag}.png`) });
      }
      await page.fill('#search', '');
      await page.type('#search', 'כבד', { delay: 5 });
      await page.waitForFunction(() => location.hash.includes('v=search') && document.querySelector('.counts'));
      const liver = await page.$$eval('.results .is-red', (l) => l.length);
      ok(liver === 2 && !(await page.$('.alert-card')), `search "כבד": ${liver} red list results, no false alert`);
      await page.screenshot({ path: path.join(SHOTS, `search-${tag}.png`) });
      await page.click('.results .is-red >> nth=0');
      await page.waitForFunction(() => location.hash.includes('v=redlist') && document.querySelector('.red-item.is-anchor'));
      ok(true, 'search result opens its red list entry');
      ok(await page.inputValue('#search') === '', 'search field cleared when leaving search');
      await page.fill('#search', 'משהו');
      await page.click('#search-clear');
      await page.waitForFunction(() => !location.hash.includes('v=search'));
      ok(await page.inputValue('#search') === '', 'grey X clears the search');

      await page.click('[data-view="redlist"]');
      await page.waitForFunction(() => location.hash.includes('v=redlist') && document.querySelectorAll('.red-item').length > 0);
      const red = await page.evaluate(() => [...document.querySelectorAll('.red-item')].map((li) => ({
        la: !!li.querySelector('.latin')?.textContent.trim(), src: li.querySelectorAll('.src').length, rev: /נבדק/.test(li.textContent),
      })));
      ok(red.length === 4 && red.every((r) => r.la && r.src >= 1 && r.rev), 'red list: 4 entries, each with scientific name, source and review date');
      await page.screenshot({ path: path.join(SHOTS, `redlist-${tag}.png`) });

      await page.click('[data-view="profile"]');
      await page.waitForFunction(() => location.hash.includes('v=profile') && document.querySelector('#profile-form'));
      await page.click('label.check:has(input[name="pregnancy"])');
      await page.click('label.check:has(input[name="liver"])');
      await page.waitForFunction(() => document.querySelectorAll('.profile ~ .block .alert').length >= 2);
      ok((await page.textContent('#saved')).includes('נשמר במכשיר'), 'profile: saved indicator');
      await page.screenshot({ path: path.join(SHOTS, `profile-${tag}.png`) });
      await page.reload();
      await page.waitForSelector('#profile-form');
      ok(await page.isChecked('input[name="pregnancy"]') && await page.isChecked('input[name="liver"]'), 'profile survives reload (device only)');
      await page.click('[data-view="redlist"]');
      await page.waitForSelector('.profile-flag');
      ok(true, 'red list shows the profile flag');
      await page.click('[data-view="profile"]');
      await page.waitForSelector('[data-clear-profile]');
      await page.click('[data-clear-profile]');
      await page.waitForFunction(() => !localStorage.getItem('refua.profile.v1') && !document.querySelector('input[name="pregnancy"]').checked);
      ok(true, 'clear button deletes the profile from the device');

      await page.click('#about-link');
      await page.waitForFunction(() => location.hash.includes('v=about') && document.querySelector('.box-yes'));
      ok(true, 'declaration screen opens from the footer');
      await page.screenshot({ path: path.join(SHOTS, `about-${tag}.png`) });
      await page.click('[data-view="sources"]');
      await page.waitForFunction(() => document.querySelectorAll('.sources li').length > 0);
      const nSrc = await page.$$eval('.sources li', (l) => l.length);
      ok(nSrc >= 30, `sources view includes red list sources (${nSrc})`);
    }

    if (w === 390) {
      await page.click('.sysmark[data-id="nervous"] text');
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(SHOTS, `nervous-${tag}.png`) });
      ok(await page.evaluate(() => document.querySelector('.panel').getBoundingClientRect().top < innerHeight), 'mobile: panel scrolled into view after selection');
      await page.fill('#search', 'כאב בחזה');
      await page.waitForSelector('.alert-card[data-alert="chest"]');
      await page.waitForTimeout(500);
      ok(await page.evaluate(() => { const r = document.querySelector('.alert-card').getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; }), 'mobile: emergency card in view');
      await page.screenshot({ path: path.join(SHOTS, `alert-chest-${tag}.png`) });
    }

    ok(errors.length === 0, `${tag} no JS errors ${errors.join(' | ')}`);
    await ctx.close();
  }

  // Reduced motion
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.route('**/ai-menu.js', (r) => r.fulfill({ body: AIMENU, contentType: 'text/javascript' }));
  await p.goto(BASE);
  await p.waitForSelector('.panel h2');
  const anim = await p.evaluate(() => getComputedStyle(document.querySelector('.rise')).animationName);
  ok(anim === 'none', 'reduced motion disables animation');
  await ctx.close();

  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL GREEN');
  process.exit(fails ? 1 : 0);
})();
