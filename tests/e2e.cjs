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
// Three.js: from a local copy when THREE_LOCAL points to one (offline sandboxes), otherwise from cdnjs.
const THREE_LOCAL = process.env.THREE_LOCAL && fs.existsSync(process.env.THREE_LOCAL) ? fs.readFileSync(process.env.THREE_LOCAL, 'utf8') : null;
async function routeThree(page, mode = 'ok') {
  await page.route('**/three.module.min.js', (r) => {
    if (mode === 'block') return r.abort();
    if (THREE_LOCAL) return r.fulfill({ body: THREE_LOCAL, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } });
    return r.continue();
  });
}

let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };

const SIZES = [[1920, 1080], [1440, 900], [1280, 720], [390, 844]];

(async () => {
  const browser = await chromium.launch();

  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    // The real body is the default stage; these runs check the sheets, so they choose them, as a viewer can.
    await ctx.addInitScript(() => { try { if (!sessionStorage.getItem('t')) { localStorage.setItem('refua.mode', '2d'); sessionStorage.setItem('t', '1'); } } catch {} });
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
      ok(ids.length === 7, 'seven system labels');
      for (const id of ids) {
        await page.click(`.sysmark[data-id="${id}"] text`);
        await page.waitForFunction((i) => location.hash.includes(`s=${i}`) && document.querySelector(`.sys[data-id="${i}"]`).classList.contains('on') && document.querySelector('.panel .wonder'), id);
        const st = await page.evaluate((i) => ({
          on: document.querySelector(`.sys[data-id="${i}"]`).classList.contains('on'),
          pressed: document.querySelector(`.sysmark[data-id="${i}"]`).getAttribute('aria-pressed'),
          wsrc: !!document.querySelector('.panel .wonder .src'),
          plate: !!document.querySelector('.panel .plate img'),
          tab: document.querySelector('.depth-tab[aria-selected="true"]')?.dataset.l,
        }), id);
        ok(st.on && st.pressed === 'true' && st.wsrc && st.plate && st.tab === '1', `system ${id}: layer on, level 1 opens with a sourced wonder and a plate`);
      }
      // Three depth levels on one system
      await page.goto(BASE + '#s=nervous');
      await page.waitForSelector('.next-depth');
      await page.click('.next-depth');
      await page.waitForFunction(() => location.hash.includes('l=2') && document.querySelectorAll('.panel .block').length === 3);
      ok(await page.evaluate(() => [...document.querySelectorAll('.panel .item.l-known')].every((x) => x.querySelector('.src')) && !!document.querySelector('.quiet-care')), 'level 2: role, failure and bridge, every known item sourced, care in a quiet line');
      await page.click('.next-depth');
      await page.waitForFunction(() => location.hash.includes('l=3') && document.querySelector('.open-q'));
      ok(await page.evaluate(() => /\?$/.test(document.querySelector('.open-q').textContent.trim()) && document.querySelectorAll('.src-list li').length > 0), 'level 3: an open question and the sources');
      await page.click('[data-go="1"]');
      await page.waitForFunction(() => location.hash.includes('s=respiratory') && location.hash.includes('l=3'));
      ok(true, 'next system keeps the depth level');
      await page.click('.depth-tab[data-l="1"]');
      await page.waitForFunction(() => !location.hash.includes('l=') && document.querySelector('.panel .wonder'));
      ok(true, 'depth tabs go back to level 1');
      await page.screenshot({ path: path.join(SHOTS, `level1-${tag}.png`) });
      await page.goto(BASE + '#s=cardio&v=history&e=8');
      await page.waitForSelector('.panel .flag');
      ok((await page.getAttribute('.panel .flag', 'src')).includes('/gb.svg'), 'a moment shows the flag of its country');
      await page.goto(BASE + '#s=digestive');
      await page.waitForSelector('.sys[data-id="digestive"].on');
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
      ok((await page.$$('.signs li')).length === 7, 'emergency view lists a sign for each of the 7 systems');
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
      await page.waitForFunction(() => location.hash === '#v=home' && document.body.classList.contains('is-home'));
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

      // ---------- Stage 2: cardio in depth ----------
      await page.goto(BASE + '#s=cardio&l=3');
      await page.waitForSelector('.deep-cta');
      await page.click('.deep-cta');
      await page.waitForFunction(() => location.hash.includes('v=deep') && document.querySelectorAll('#deep-figure .seg').length === 8);
      ok(await page.isHidden('#figure') && await page.isVisible('#deep-figure'), 'deep: circulation diagram replaces the body figure');
      await page.click('#deep-figure .seg[data-step="4"] .badge', { force: true });
      await page.waitForFunction(() => location.hash.includes('k=4') && document.querySelector('#deep-figure .seg.on').dataset.step === '4');
      ok(true, 'deep: click on a numbered step selects it');
      await page.click('#step-next');
      await page.waitForFunction(() => location.hash.includes('k=5'));
      await page.click('#step-prev');
      await page.waitForFunction(() => location.hash.includes('k=4'));
      await page.keyboard.press('ArrowLeft');
      await page.waitForFunction(() => location.hash.includes('k=5'));
      ok(true, 'deep: previous, next and arrow keys move along the chain');
      await page.click('#step-play');
      await page.waitForFunction(() => location.hash.includes('k=6'), null, { timeout: 4000 });
      await page.click('#step-play');
      ok(await page.getAttribute('#step-play', 'aria-pressed') === 'false', 'deep: play advances, and stops');
      await page.click('.chain-row[data-step="0"]');
      await page.waitForFunction(() => document.querySelector('#deep-figure .seg.on').dataset.step === '0');
      ok(true, 'deep: chain list in the panel selects a step');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SHOTS, `deep-process-${tag}.png`) });
      await page.click('[data-tab="organs"]');
      await page.waitForFunction(() => location.hash.includes('t=organs') && document.querySelectorAll('.organ').length >= 5);
      const orgSrc = await page.$$eval('.organ .item.l-known', (l) => l.every((x) => x.querySelector('.src')));
      ok(orgSrc, 'deep organs: every known item has a source');
      await page.click('[data-tab="diseases"]');
      await page.waitForFunction(() => location.hash.includes('t=diseases') && document.querySelectorAll('.dz-btn').length === 3);
      for (const id of ['ischemic', 'hypertension', 'heart-failure']) {
        await page.click(`.dz-btn[data-dz="${id}"]`);
        await page.waitForFunction((i) => location.hash.includes(`d=${i}`) && document.querySelector('.dz-btn.on').dataset.dz === i, id);
        const dz = await page.evaluate(() => ({
          known: [...document.querySelectorAll('#panel .item.l-known')].every((x) => x.querySelector('.src')),
          alert: !!document.querySelector('#panel .alert .go'), q: /\?$/.test(document.querySelector('#panel .question').textContent.trim()),
        }));
        ok(dz.known && dz.alert && dz.q, `disease ${id}: sourced facts, a sign to seek care and a question`);
      }
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(SHOTS, `deep-diseases-${tag}.png`) });
      ok(await page.textContent('#museum .q-he').then((t) => t.includes('במעגל')), 'deep: museum strip shows the Harvey quote');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !location.hash.includes('v=deep') && !document.querySelector('#figure').hidden);
      ok(await page.textContent('#museum .q-he').then((t) => t.includes('רווחה')), 'leaving deep restores the body figure and the WHO quote');
      await page.fill('#search', 'יתר לחץ דם');
      await page.waitForSelector('[data-open-dz="hypertension"]');
      await page.click('[data-open-dz="hypertension"]');
      await page.waitForFunction(() => location.hash.includes('v=disease&') && location.hash.includes('d=hypertension'));
      ok(true, 'search finds a disease and opens its card');

      // ---------- Stage 3: 3D exploded atlas ----------
      await routeThree(page);
      await page.goto(BASE + '#s=cardio');
      await page.waitForSelector('[data-mode="3d"]');
      ok(await page.isVisible('#figure') && await page.isHidden('#atlas'), 'a viewer who chose the sheets gets the sheets');
      // A first visit: the real body is the default, on the home page too, as one body with seven networks.
      const fresh = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const fp = await fresh.newPage();
      await fp.route('**/ai-menu.js', (r) => r.fulfill({ body: AIMENU, contentType: 'text/javascript' }));
      await routeThree(fp);
      await fp.goto(BASE);
      await fp.waitForFunction(() => !document.querySelector('#atlas').hidden && document.querySelector('.atlas-wait')?.hidden && /שבע רשתות/.test(document.querySelector('.b3-card')?.textContent || ''), null, { timeout: 60000 });
      ok(await fp.isHidden('#figure') && await fp.evaluate(() => document.querySelector('#atlas').classList.contains('is-tissue')), 'first visit: the home page opens on the real body, seven networks in one figure, in tissue colour');
      await fp.screenshot({ path: path.join(SHOTS, `home-3d-${tag}.png`), timeout: 120000 });
      await fp.click('[data-mode="2d"]');
      await fp.waitForFunction(() => !document.querySelector('#figure').hidden && localStorage.getItem('refua.mode') === '2d');
      await fp.goto(BASE + '#s=nervous');
      await fp.waitForSelector('.sys[data-id="nervous"].on');
      ok(await fp.isHidden('#atlas'), 'choosing the sheets is remembered across screens');
      await fresh.close();
      await page.click('[data-mode="3d"]');
      await page.waitForFunction(() => location.hash.includes('m=3d') && document.querySelectorAll('.atlas-label').length === 7 && document.querySelector('.atlas-wait')?.hidden, null, { timeout: 60000 });
      await page.waitForTimeout(1500);
      const drawn = await page.evaluate(() => {
        const c = document.querySelector('.atlas-canvas');
        const g = document.createElement('canvas'); g.width = 120; g.height = 120;
        const x = g.getContext('2d'); x.drawImage(c, 0, 0, 120, 120);
        const d = x.getImageData(0, 0, 120, 120).data; let ink = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 40) ink++;
        return ink;
      });
      ok(drawn > 300, `3D: the real body is drawn on the canvas (${drawn} inked pixels)`);
      const lab = await page.evaluate(() => {
        const host = document.querySelector('#atlas').getBoundingClientRect();
        const r = [...document.querySelectorAll('.atlas-label')].map((b) => b.getBoundingClientRect());
        let overlap = false;
        for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
          const a = r[i], b = r[j];
          if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) overlap = true;
        }
        const inside = r.every((x) => x.left >= host.left - 1 && x.right <= host.right + 1 && x.top >= host.top - 1 && x.bottom <= host.bottom + 1);
        return { overlap, inside, on: document.querySelector('.atlas-label.on')?.dataset.id };
      });
      ok(!lab.overlap && lab.inside && lab.on === 'cardio', '3D: seven names, inside the frame, no overlap, selected system marked');
      await page.screenshot({ path: path.join(SHOTS, `atlas-${tag}.png`), timeout: 120000 });
      // Parts: the list opens, a part shows its name, role and source; the look switches.
      await page.click('.b3-more summary');
      const nParts = await page.$$eval('.b3-part', (l) => l.length);
      await page.click('.b3-part[data-part="coronary"]');
      await page.waitForSelector('.b3-card h4');
      const pc = await page.evaluate(() => ({ h: document.querySelector('.b3-card h4').textContent, src: /Gray/.test(document.querySelector('.b3-meta').textContent), layer: !!document.querySelector('.b3-layer') }));
      ok(nParts === 15 && pc.h === 'העורקים הכליליים' && pc.src && pc.layer, `3D parts: ${nParts} heart parts; a part shows its Hebrew name, the known layer and Gray's Anatomy`);
      await page.click('[data-b3-look="tissue"]');
      ok(await page.evaluate(() => document.querySelector('#atlas').classList.contains('is-tissue') && localStorage.getItem('refua.look3d') === 'tissue'), '3D: the tissue look switches on and is remembered on the device');
      await page.screenshot({ path: path.join(SHOTS, `atlas-tissue-${tag}.png`), timeout: 120000 });
      await page.click('[data-b3-look="ink"]');
      await page.click('[data-part-clear]');
      await page.click('.atlas-label[data-id="nervous"]');
      await page.waitForFunction(() => location.hash.includes('s=nervous') && location.hash.includes('m=3d') && document.querySelector('.atlas-label.on')?.dataset.id === 'nervous');
      ok(true, '3D: a system name selects its system, the mode stays 3D');
      const c = await page.$('.atlas-canvas');
      const bb = await c.boundingBox();
      await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
      await page.mouse.down();
      await page.mouse.move(bb.x + bb.width / 2 + 160, bb.y + bb.height / 2 + 20, { steps: 8 });
      await page.mouse.up();
      ok(await page.evaluate(() => location.hash.includes('s=nervous')), '3D: dragging rotates without changing the selection');
      await page.click('#atlas-front');
      await page.click('#atlas-reset');
      await page.click('[data-go="1"]');
      await page.waitForFunction(() => location.hash.includes('s=respiratory') && location.hash.includes('m=3d'));
      ok(true, '3D: next system keeps the 3D mode');
      await page.click('.atlas-label[data-id="reproductive"]');
      await page.waitForFunction(() => location.hash.includes('s=reproductive') && /HRA/.test(document.querySelector('.b3-card').textContent) && document.querySelector('[data-b3-sex="f"]'), null, { timeout: 60000 });
      const sexes = { f: await page.$$eval('.b3-parts .b3-part', (l) => l.length) };
      await page.click('[data-b3-sex="m"]');
      sexes.m = await page.$$eval('.b3-parts .b3-part', (l) => l.length);
      await page.click('[data-b3-sex="f"]');
      ok(sexes.f === 7 && sexes.m === 2, `3D reproductive: a woman's body (${sexes.f} parts, from HRA) and a man's (${sexes.m}), and the sources said in words`);
      await page.goto(BASE + '#s=cardio&v=disease&d=ischemic&m=3d');
      await page.waitForFunction(() => /מחלת לב איסכמית/.test(document.querySelector('.b3-card')?.textContent || '') && /העורקים הכליליים/.test(document.querySelector('.b3-lit')?.textContent || ''), null, { timeout: 60000 });
      ok(true, '3D: a disease card lights up its structure in the body (ischemic heart disease: the coronary arteries)');
      await page.goto(BASE + '#s=respiratory&l=3&m=3d');
      await page.waitForFunction(() => /עץ הסימפונות, בלי המעטפת/.test(document.querySelector('.b3-depth')?.textContent || ''), null, { timeout: 60000 });
      await page.click('.depth-tab[data-l="2"]');
      await page.waitForFunction(() => location.hash.includes('l=2') && /רקמת הריאה/.test(document.querySelector('.b3-depth')?.textContent || ''), null, { timeout: 60000 });
      ok(true, '3D depth levels: level 3 shows the inner layer alone (the bronchial tree), level 2 the lung tissue translucent');
      await page.click('[data-mode="2d"]');
      await page.waitForFunction(() => !location.hash.includes('m=3d') && !document.querySelector('#figure').hidden && document.querySelector('#atlas').hidden);
      ok(true, '3D: back to the 2D sheets');

      // Fallback: the library cannot load, the 2D figure stays and says why.
      const fb = await ctx.newPage();
      await fb.route('**/ai-menu.js', (r) => r.fulfill({ body: AIMENU, contentType: 'text/javascript' }));
      await routeThree(fb, 'block');
      await fb.goto(BASE + '#s=cardio&m=3d');
      await fb.waitForFunction(() => !location.hash.includes('m=3d') && /לא נטען/.test(document.querySelector('#figure-note').textContent), null, { timeout: 10000 });
      ok(await fb.isVisible('#figure'), '3D fallback: blocked library keeps the 2D figure, with a note');
      await fb.close();

      // The invitation on level 1 (a light system: software rendering in CI has no GPU).
      await page.goto(BASE + '#s=immune');
      await page.waitForSelector('.to-3d');
      await page.$eval('.to-3d', (b) => b.click());
      await page.waitForFunction(() => location.hash.includes('s=immune') && location.hash.includes('m=3d') && !document.querySelector('#atlas').hidden, null, { timeout: 60000 });
      ok(true, 'level 1 invites into the real body: one click to 3D');
      await page.click('[data-mode="2d"]');
      await page.waitForFunction(() => !location.hash.includes('m=3d'));

      // ---------- Stage 4: twenty diseases ----------
      await page.goto(BASE + '#s=cardio');
      await page.waitForSelector('[data-view="diseases"]');
      await page.click('[data-view="diseases"]');
      await page.waitForFunction(() => location.hash.includes('v=diseases') && document.querySelectorAll('.dz-tile').length === 24);
      ok(await page.$$eval('.dz-tile .lm-known', (l) => l.length) === 24, 'diseases: 24 tiles, each with a known layer');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SHOTS, `diseases-${tag}.png`) });
      await page.click('[data-f="respiratory"]');
      await page.waitForFunction(() => location.hash.includes('f=respiratory') && document.querySelectorAll('.dz-tile').length === 5 && document.querySelector('.sysmark.on')?.dataset.id === 'respiratory');
      ok(true, 'diseases filter: respiratory shows 5, and the figure marks the system');
      await page.click('[data-f="respiratory"]');
      await page.waitForFunction(() => !location.hash.includes('f=') && document.querySelectorAll('.dz-tile').length === 24);
      ok(true, 'diseases filter: clicking the only choice returns to all');
      await page.click('.sysmark[data-id="digestive"] text');
      await page.waitForFunction(() => location.hash.includes('v=diseases') && location.hash.includes('f=digestive') && document.querySelectorAll('.dz-tile').length === 5);
      ok(true, 'diseases: the body figure works as a filter');
      const dzList = await page.evaluate(async () => (await import('./js/data.js')).DISEASES.map((d) => [d.id, d.system, d.action.urgency]));
      let allOk = true; const bad = [];
      for (const [id, sys, urg] of dzList) {
        await page.goto(BASE + `#s=${sys}&v=disease&d=${id}&l=3`);
        await page.waitForFunction((i) => document.querySelector('#sys-title') && document.title.includes('|'), id);
        const r = await page.evaluate(() => ({
          src: [...document.querySelectorAll('#panel .item.l-known')].every((x) => x.querySelector('.src')),
          q: /\?$/.test(document.querySelector('#panel .question')?.textContent.trim() || ''),
          go: document.querySelector('#panel .alert .go')?.textContent || '',
          urgent: !!document.querySelector('#panel .alert.tone-urgent'),
          on: document.querySelector('.sysmark.on')?.dataset.id,
        }));
        const good = r.src && r.q && r.on === sys && (urg !== 'emergency' || (r.urgent && r.go.includes('101')));
        if (!good) { allOk = false; bad.push(id); }
      }
      ok(allOk, `all ${dzList.length} disease cards: sourced, a question, the right system on the figure, emergencies to 101 ${bad.join(',')}`);
      await page.goto(BASE + '#s=nervous&v=disease&d=depression&l=3');
      await page.waitForSelector('#panel .alert .go');
      ok((await page.textContent('#panel .alert .go')).includes('1201'), 'depression card points to ERAN 1201');
      await page.goto(BASE + '#s=respiratory&v=diseases&f=respiratory');
      await page.waitForSelector('.dz-tile');
      await page.click('.dz-tile >> nth=0');
      await page.waitForFunction(() => location.hash.includes('v=disease&') && location.hash.includes('f=respiratory'));
      const first = await page.textContent('#sys-title');
      await page.click('[data-dz-step="1"]');
      await page.waitForFunction((t) => document.querySelector('#sys-title').textContent !== t, first);
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction((t) => document.querySelector('#sys-title').textContent === t, first);
      ok(await page.evaluate(() => document.querySelector('.pos').textContent.includes('/5')), 'disease card: next, previous and arrows move inside the filter');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SHOTS, `disease-${tag}.png`) });
      await page.fill('#search', 'סוכרת');
      await page.waitForSelector('[data-open-dz="diabetes"]');
      await page.click('[data-open-dz="diabetes"]');
      await page.waitForFunction(() => location.hash.includes('d=diabetes') && document.querySelector('.sysmark.on')?.dataset.id === 'digestive');
      ok(true, 'search finds a disease and opens its card on the right system');
      await page.goto(BASE + '#s=cardio&v=disease&d=hypertension&l=3');
      await page.waitForSelector('[data-deep-dz]');
      await page.click('[data-deep-dz]');
      await page.waitForFunction(() => location.hash.includes('v=deep') && location.hash.includes('d=hypertension'));
      ok(true, 'a cardio disease card opens its place in the circulation view');

      // ---------- Stage 4b: cancer group, breast and reproductive system, obesity ----------
      await page.goto(BASE + '#s=cardio&v=diseases');
      await page.waitForSelector('[data-f="cancer"]');
      await page.click('[data-f="cancer"]');
      await page.waitForFunction(() => location.hash.includes('f=cancer') && document.querySelectorAll('.dz-tile').length === 5 && document.querySelector('.group-intro'));
      const gi = await page.evaluate(() => ({ src: [...document.querySelectorAll('.group-intro .item.l-known')].every((x) => x.querySelector('.src')), n: document.querySelectorAll('.group-intro .item').length }));
      ok(gi.src && gi.n === 3, 'cancer filter: an overview with 3 sourced facts, then 5 types');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SHOTS, `cancer-${tag}.png`) });
      await page.click('[data-open-dz="breast-cancer"]');
      await page.waitForFunction(() => location.hash.includes('d=breast-cancer') && document.querySelector('.sysmark.on')?.dataset.id === 'reproductive');
      await page.click('[data-group-go="cancer"]');
      await page.waitForFunction(() => location.hash.includes('f=cancer') && location.hash.includes('v=diseases'));
      ok(true, 'a cancer card links back to the cancer overview');
      await page.goto(BASE + '#s=reproductive&v=disease&d=breast-cancer&l=2');
      await page.waitForSelector('.quiet-care');
      ok((await page.textContent('#panel')).includes('80%'), 'breast cancer card: on the reproductive system, with the 80% fact');
      await page.goto(BASE + '#s=digestive&v=disease&d=obesity&l=3');
      await page.waitForSelector('#panel .alert .go');
      const ob = await page.evaluate(() => ({ t: document.querySelector('#panel').textContent, go: document.querySelector('#panel .alert .go').textContent }));
      ok(ob.go.includes('1201') && !/משקל|BMI|קלוריות/.test(ob.t), 'obesity card: help line 1201, and no weight, BMI or calories on screen');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SHOTS, `obesity-${tag}.png`) });

      // ---------- Stage 5: timeline map and traditions ----------
      await page.goto(BASE + '#s=cardio');
      await page.waitForSelector('[data-view="history"]');
      await page.click('[data-view="history"]');
      await page.waitForFunction(() => location.hash.includes('v=history') && document.querySelectorAll('#map-figure .evp').length === 15);
      ok(await page.isVisible('#map-figure') && await page.isHidden('#figure'), 'timeline: the map replaces the body figure');
      const seq = await page.evaluate(async () => (await import('./js/data.js')).TIMELINE.every((e, i, a) => !i || a[i - 1].year <= e.year));
      ok(seq, 'timeline: moments in time order');
      await page.click('#map-figure .evp[data-ev="8"] .ev-badge', { force: true });
      await page.waitForFunction(() => location.hash.includes('e=8') && document.querySelector('.map-svg .big-year').textContent === '1854' && document.querySelector('.map-svg .pl-he').textContent === 'לונדון');
      ok(true, 'timeline: a numbered point shows its year large and its place in Hebrew');
      ok(await page.evaluate(() => document.querySelectorAll('.leg.past').length === 8), 'timeline: the chain is drawn in ink up to the current moment');
      await page.click('#ev-next');
      await page.waitForFunction(() => location.hash.includes('e=9'));
      await page.click('#ev-prev');
      await page.waitForFunction(() => location.hash.includes('e=8'));
      await page.keyboard.press('ArrowLeft');
      await page.waitForFunction(() => location.hash.includes('e=9'));
      await page.click('#year-track [data-ev="0"]');
      await page.waitForFunction(() => !location.hash.includes('e=') && document.querySelector('.map-svg .big-era').textContent.length > 0);
      ok(true, 'timeline: next, previous, arrows and the year track; BCE shown apart from the number');
      await page.click('#ev-play');
      await page.waitForFunction(() => location.hash.includes('e=1'), null, { timeout: 5000 });
      await page.click('#ev-play');
      ok(await page.getAttribute('#ev-play', 'aria-pressed') === 'false', 'timeline: play moves on, and stops');
      await page.goto(BASE + '#s=cardio&v=history&e=8');
      await page.waitForSelector('[data-open-dz="diarrhoeal"]');
      await page.click('[data-open-dz="diarrhoeal"]');
      await page.waitForFunction(() => location.hash.includes('d=diarrhoeal'));
      ok(true, 'timeline: a moment opens its related disease');
      await page.goto(BASE + '#s=cardio&v=history&h=traditions');
      await page.waitForFunction(() => document.querySelectorAll('.trad').length === 4);
      const tr = await page.evaluate(() => [...document.querySelectorAll('.trad')].map((t) => ({ dt: t.querySelectorAll('dt').length, src: !!t.querySelector('.src') })));
      ok(tr.every((t) => t.dt === 3 && t.src), 'traditions: four, the same three questions each, with a source');
      ok(await page.isVisible('.trad-warn [data-view-go="redlist"]'), 'traditions: the herbal warning links to the red list');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SHOTS, `traditions-${tag}.png`) });
      await page.goto(BASE + '#s=cardio&v=history&e=8');
      await page.waitForSelector('.map-svg .big-year');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SHOTS, `timeline-${tag}.png`) });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !location.hash.includes('v=history') && !document.querySelector('#figure').hidden && document.querySelector('#map-figure').hidden);
      ok(true, 'leaving the timeline restores the body figure');

      // ---------- Home: on one foot, and the live bridge to nutrition ----------
      await page.goto(BASE);
      await page.waitForSelector('#home-lead .hillel');
      ok(await page.evaluate(() => document.body.classList.contains('is-home') && document.querySelectorAll('.line').length === 7 && !document.querySelector('.sys.on')), 'home: the default page, seven lines, no system preselected');
      ok(!(await page.textContent('body')).includes('כללי אצבע'), 'home: the lines act without being labelled as rules of thumb');
      for (let i = 0; i < 7; i++) {
        await page.goto(BASE + '#v=home');
        await page.waitForSelector(`[data-line="${i}"]`);
        await page.click(`[data-line="${i}"]`);
        await page.waitForFunction(() => !location.hash.includes('v=home') && location.hash.length > 2);
      }
      ok(true, 'home: each of the seven lines opens its screen');
      await page.goto(BASE + '#v=home');
      await page.waitForSelector('#quiz-box .q-row');
      const keys = await page.evaluate(async () => { const { SYSTEMS } = await import('./js/data.js'); const s = (id) => SYSTEMS.find((x) => x.id === id); return [s('skeletal').failure.find((f) => f.layer === 'believed').layer, s('cardio').role.layer, s('nervous').failure.find((f) => f.layer === 'said').layer]; });
      for (let i = 0; i < 3; i++) await page.click(`[data-q="${i}"][data-a="${keys[i]}"]`);
      ok((await page.textContent('.q-score')).includes('3') && await page.evaluate(() => JSON.parse(localStorage.getItem('refua.quiz.v1')).best === 3), 'one-minute check: three right answers, score kept on the device');
      await page.click('[data-quiz-reset]');
      ok(await page.evaluate(() => !document.querySelector('.q-opt[disabled]')), 'one-minute check: again');
      await page.screenshot({ path: path.join(SHOTS, `home-quiz-${tag}.png`) });
      await page.click('.numcell[data-view-go="diseases"]');
      await page.waitForFunction(() => location.hash.includes('v=diseases'));
      ok(true, 'home: the numbers lead to their screens');
      await page.goto(BASE + '#s=cardio&l=2');
      await page.waitForSelector('.bridge-go');
      ok((await page.getAttribute('.bridge-go', 'href')).startsWith('https://tzuna-gh.vercel.app/#/foods?id=olive'), 'bridge: heart card links to olive in the nutrition app');
      await page.goto(BASE + '#s=cardio&v=redlist');
      await page.waitForSelector('.red-item .bridge-go');
      ok((await page.getAttribute('.red-item .bridge-go', 'href')).includes('id=turmeric'), 'bridge: turmeric in the red list links to turmeric as food');
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
      await page.goto(BASE + '#s=cardio&v=deep&k=6');
      await page.waitForSelector('#deep-figure .seg.on');
      ok(await page.evaluate(() => { const r = document.querySelector('#deep-figure').getBoundingClientRect(); return r.top < innerHeight * 0.4 && r.height > 300; }), 'mobile deep: the diagram is the first thing on screen');
      await page.screenshot({ path: path.join(SHOTS, `deep-${tag}.png`) });
      await page.goto(BASE + '#s=cardio');
      await page.waitForSelector('[data-view="diseases"]');
      await page.click('[data-view="diseases"]');
      await page.waitForFunction(() => document.querySelectorAll('.dz-tile').length === 24);
      await page.waitForTimeout(600);
      ok(await page.evaluate(() => document.querySelector('.panel').getBoundingClientRect().top < innerHeight && document.documentElement.scrollWidth <= innerWidth), 'mobile diseases: list in view, nav without horizontal scroll');
      await page.screenshot({ path: path.join(SHOTS, `diseases-${tag}.png`) });
      await page.goto(BASE + '#s=cardio&v=history&e=8');
      await page.waitForSelector('.map-svg .big-year');
      await page.waitForTimeout(500);
      ok(await page.evaluate(() => { const r = document.querySelector('#map-figure').getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight * 0.45 && document.documentElement.scrollWidth <= innerWidth; }), 'mobile timeline: the map comes first and stays on screen, no horizontal scroll');
      await page.screenshot({ path: path.join(SHOTS, `timeline-${tag}.png`) });
    }

    ok(errors.length === 0, `${tag} no JS errors ${errors.join(' | ')}`);
    await ctx.close();
  }

  // Creations (AppOfApp-GH creations standard): a room per topic, cards in nine designs, from the nav, on desktop and phone
  const CR_JS = process.env.CREATIONS_JS || path.join(__dirname, '..', '..', 'appofapp-gh', 'public', 'creations.js');
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const cc = await browser.newContext({ viewport: { width: w, height: h } });
    await cc.addInitScript(() => { try { localStorage.setItem('refua.mode', '2d'); } catch {} });
    const cp = await cc.newPage();
    const cerr = [];
    cp.on('pageerror', (e) => cerr.push(e.message));
    await cp.route('**/ai-menu.js', (r) => r.fulfill({ body: AIMENU, contentType: 'text/javascript' }));
    if (fs.existsSync(CR_JS)) await cp.route('**/creations.js', (r) => r.fulfill({ path: CR_JS, contentType: 'text/javascript' }));
    await cp.goto(BASE + '#s=cardio');
    await cp.waitForSelector('[data-view="creations"]');
    await cp.click('[data-view="creations"]');
    await cp.waitForSelector('app-creations .cr-room .cr-card', { timeout: 20000 });
    const cr = await cp.evaluate(() => ({
      rooms: document.querySelectorAll('app-creations .cr-room').length,
      cards: document.querySelectorAll('app-creations .cr-room .cr-card').length,
      empty: [...document.querySelectorAll('app-creations .cr-room')].filter((r) => r.querySelectorAll('.cr-card').length < 4).length,
      styles: new Set([...document.querySelectorAll('app-creations .cr-card')].map((c) => [...c.classList].find((x) => x.startsWith('cr-') && x !== 'cr-card'))).size,
      hscroll: document.documentElement.scrollWidth > innerWidth + 1,
      stageHidden: getComputedStyle(document.querySelector('.stage')).display === 'none',
      scrolls: document.documentElement.scrollHeight > innerHeight * 2,
      current: document.querySelector('[data-view="creations"]').getAttribute('aria-current'),
    }));
    const tg = `${w}x${h}`;
    ok(cr.rooms >= 6 && cr.empty === 0, `${tg} creations: ${cr.rooms} rooms, each with 4 or more cards (${cr.cards} cards)`);
    ok(cr.styles >= 7, `${tg} creations: ${cr.styles} designs`);
    ok(!cr.hscroll && cr.stageHidden && cr.scrolls && cr.current === 'true', `${tg} creations: full page that scrolls, no horizontal scroll, nav marks it`);
    await cp.screenshot({ path: path.join(SHOTS, `creations-${tg}.png`) });
    ok(cerr.length === 0, `${tg} creations: no JS errors ${cerr.join(' | ')}`);
    await cc.close();
  }

  // Reduced motion
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { localStorage.setItem('refua.mode', '2d'); } catch {} });
  const p = await ctx.newPage();
  await p.route('**/ai-menu.js', (r) => r.fulfill({ body: AIMENU, contentType: 'text/javascript' }));
  await p.goto(BASE);
  await p.waitForSelector('.panel h2');
  const anim = await p.evaluate(() => getComputedStyle(document.querySelector('.rise')).animationName);
  ok(anim === 'none', 'reduced motion disables animation');
  await p.goto(BASE + '#s=cardio&v=deep');
  await p.waitForSelector('#deep-figure .seg');
  ok(await p.$$eval('#deep-figure .dot', (d) => d.length) === 0, 'reduced motion: no moving dots in the circulation diagram');
  await ctx.close();

  await browser.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL GREEN');
  process.exit(fails ? 1 : 0);
})();
