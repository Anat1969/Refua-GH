import { SYSTEMS, SOURCES, LAYERS, EMERGENCY, REDLIST, REDLIST_ACTION, KEYWORDS, EMERGENCY_NUMBERS, PROFILE_ITEMS } from './data.js';
import { detect, textMatches, normalize } from './match.js';
import { bodySVG } from './body.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---------- Rich text: **bold**, ==insight==, numbers, (Latin) ----------
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function rich(t) {
  let h = esc(t);
  h = h.replace(/\(([A-Za-z][^)]*)\)/g, '<span class="latin" dir="ltr">$1</span>');
  h = h.replace(/(\d[\d.,%-]*\d%?|\d%?)/g, '<span class="num">$1</span>');
  h = h.replace(/==(.+?)==/g, '<mark>$1</mark>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  return h;
}

const srcLine = (id) => {
  const s = SOURCES[id];
  if (!s) return '';
  return `<a class="src" href="${s.url}" target="_blank" rel="noopener" dir="ltr">${esc(s.title)}, ${s.year}</a>`;
};

function item(it) {
  const L = LAYERS[it.layer];
  const meta =
    it.layer === 'known'
      ? `<span class="ev">ראיה ${it.evidence}</span>${srcLine(it.source_id)}`
      : it.layer === 'said'
        ? `<span class="ev">${esc(it.tradition)}</span>${srcLine(it.source_id)}`
        : `<span class="ev">${esc(it.status)}</span>`;
  return `<div class="item l-${it.layer}">
    <span class="ltag">${L.he}</span>
    <p class="itext">${rich(it.text_he)}</p>
    <p class="imeta">${meta}</p>
  </div>`;
}

// ---------- Icons (line set, 24x24, 1.75) ----------
const ico = {
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  warn: '<svg class="tri" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5L22 20.5H2Z"/><path d="M12 10v5M12 17.2v.6"/></svg>',
};
const closeBtn = `<div class="ops"><button class="icon press" data-close title="חזרה למערכת" aria-label="חזרה למערכת">${ico.close}</button></div>`;

// ---------- Local safety profile: on this device only ----------
const PROFILE_KEY = 'refua.profile.v1';
function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; } catch { return {}; }
}
function saveProfile(p) {
  try {
    if (Object.values(p).some(Boolean)) localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    else localStorage.removeItem(PROFILE_KEY);
    return true;
  } catch { return false; }
}
function profileNotes(p) {
  const notes = [];
  const special = PROFILE_ITEMS.filter((i) => i.special && p[i.id]);
  if (special.length) notes.push({ tone: 'urgent', text: `סימנת: **${special.map((i) => i.he).join(', ')}**. לכן **צמח או תוסף מרוכז: לא מתאים בלי ייעוץ** של רופא או רוקח.` });
  if (p.meds) notes.push({ tone: 'doctor', text: 'תרופות קבועות: לפני כל צמח או תוסף, **בדיקת אינטראקציה אצל רוקח**. אין להפסיק תרופה בלי רופא.' });
  PROFILE_ITEMS.filter((i) => i.organ && p[i.id]).forEach((i) => {
    const hits = REDLIST.filter((r) => r.organs.includes(i.organ));
    if (hits.length) notes.push({ tone: 'doctor', text: `${i.he}: ברשימה האדומה **${hits.length}** פריטים שפוגעים באיבר הזה: ${hits.map((r) => r.name_he).join(', ')}.`, link: 'redlist' });
  });
  if (p.allergy) notes.push({ tone: 'doctor', text: 'אלרגיה ידועה: סימן החירום הוא **התנפחות בפנים או בגרון**, או קושי בנשימה. מד"א **101**.', pick: 'immune' });
  return notes;
}
const callCard = (id) => {
  const e = EMERGENCY_NUMBERS[id];
  return `<a class="numcard press" href="tel:${e.num.replace(/-/g, '')}"><span class="label">${e.he}</span><b class="num" dir="ltr">${e.num}</b></a>`;
};

// ---------- Views ----------
function systemView(s) {
  const i = SYSTEMS.indexOf(s);
  const a = s.action;
  const b = s.bridge;
  const bridgeLabel = b.kind === 'nutrition' ? 'חיבור לתזונה' : 'חיבור לעיר';
  return `
  <header class="panel-head">
    <div>
      <p class="label">מערכת ${i + 1} מתוך ${SYSTEMS.length}</p>
      <h2 id="sys-title">${s.name_he}</h2>
      <p class="latin-line" dir="ltr">${s.name_en}</p>
    </div>
    <div class="ops" role="group" aria-label="מעבר בין מערכות">
      <button class="icon press" data-go="-1" title="הקודמת" aria-label="המערכת הקודמת">${ico.prev}</button>
      <span class="pos num">${i + 1}/${SYSTEMS.length}</span>
      <button class="icon press" data-go="1" title="הבאה" aria-label="המערכת הבאה">${ico.next}</button>
    </div>
  </header>
  <p class="insight rise">${rich(s.insight)}</p>
  <p class="city rise"><span class="label">בעיר</span>${rich(s.city)} <span class="ev">פרשנות</span></p>

  <section class="block rise" aria-labelledby="h-know">
    <h3 id="h-know"><span class="label">הכרה</span>תפקיד</h3>
    ${item(s.role)}
  </section>

  <section class="block rise" aria-labelledby="h-under">
    <h3 id="h-under"><span class="label">הבנה</span>כשל</h3>
    ${s.failure.map(item).join('')}
  </section>

  <section class="block rise" aria-labelledby="h-use">
    <h3 id="h-use"><span class="label">שימוש</span>מתי פונים, ומה שואלים</h3>
    <div class="alert ${a.urgency === 'emergency' ? 'tone-urgent' : 'tone-doctor'}">
      <p class="sign">${rich(a.sign_he)}</p>
      <p class="go">${rich(a.go_he)}</p>
      <p class="imeta">${srcLine(a.source_id)}</p>
    </div>
    <p class="question"><span class="label">שאלה לרופא</span>${rich(a.question_he)}</p>
  </section>

  <section class="block bridge rise" aria-labelledby="h-bridge">
    <h3 id="h-bridge"><span class="label">${bridgeLabel}</span>${rich(b.next_he)}</h3>
    ${item(b)}
  </section>`;
}

function emergencyView() {
  return `
  <header class="panel-head">
    <div><p class="label">שימוש</p><h2>סימנים שמחייבים פנייה</h2></div>
    <div class="ops"><button class="icon press" data-close title="חזרה למערכת" aria-label="חזרה למערכת">${ico.close}</button></div>
  </header>
  <p class="insight">${rich('==סימן חירום: מתקשרים קודם, קוראים אחר כך.==')}</p>
  <ol class="signs">
    ${SYSTEMS.map(
      (s) => `<li class="${s.action.urgency === 'emergency' ? 'urgent' : ''}">
        <button class="sign-row press" data-pick="${s.id}">
          <span class="sname">${s.name_he}</span>
          <span class="stext">${rich(s.action.sign_he)}</span>
          <span class="sgo">${rich(s.action.go_he)}</span>
        </button></li>`,
    ).join('')}
  </ol>
  <div class="numbers">
    ${EMERGENCY.map((e) => `<a class="numcard press" href="tel:${e.num.replace(/-/g, '')}"><span class="label">${e.he}</span><b class="num" dir="ltr">${e.num}</b></a>`).join('')}
  </div>
  <p class="fine">המספרים נבדקו מול כמה מקורות ציבוריים. לפני השקה הם יאומתו מול הגורמים עצמם.</p>`;
}

function sourcesView() {
  const used = new Map();
  SYSTEMS.forEach((s) => {
    [s.role, ...s.failure, s.bridge, s.action].forEach((x) => {
      if (x.source_id) used.set(x.source_id, (used.get(x.source_id) || []).concat(s.name_he));
    });
  });
  REDLIST.forEach((r) => r.sources.forEach((id) => used.set(id, (used.get(id) || []).concat('רשימה אדומה'))));
  used.set('who-constitution', ['ציטוט פתיחה']);
  const rows = [...used.entries()]
    .sort((a, b) => SOURCES[a[0]].year - SOURCES[b[0]].year)
    .map(([id, where]) => {
      const s = SOURCES[id];
      return `<li class="dense-row"><span class="num">${s.year}</span><span class="stitle"><a href="${s.url}" target="_blank" rel="noopener" dir="ltr">${esc(s.title)}</a><small>${esc(s.type)}${s.note ? ', ' + esc(s.note) : ''}</small></span><span class="swhere">${[...new Set(where)].join(', ')}</span></li>`;
    })
    .join('');
  return `
  <header class="panel-head">
    <div><p class="label">אמינות</p><h2>${used.size} מקורות, לפי שנה</h2></div>
    <div class="ops"><button class="icon press" data-close title="חזרה למערכת" aria-label="חזרה למערכת">${ico.close}</button></div>
  </header>
  <p class="insight">${rich('==אין עובדה בלי מקור, ואין מקור בלי עוצמת ראיה.==')}</p>
  <ul class="sources">${rows}</ul>`;
}

function alertCards(hits) {
  return hits.map((k) => `
    <section class="alert-card" data-alert="${k.id}" role="alert">
      <h3>${ico.warn}${esc(k.title_he)}</h3>
      <ul>${k.do_he.map((d) => `<li>${rich(d)}</li>`).join('')}</ul>
      <div class="numbers">${k.calls.map(callCard).join('')}</div>
      ${k.system ? `<button class="linkish press-soft" data-pick="${k.system}">למה זה סימן: ${SYSTEMS.find((x) => x.id === k.system).name_he}</button>` : ''}
    </section>`).join('');
}

function searchView(q) {
  const hits = detect(q, KEYWORDS);
  const stopPlants = hits.some((k) => k.plants === false);
  const sys = SYSTEMS.filter((s) => textMatches(q, [s.name_he, s.city, s.role.text_he, ...s.failure.map((f) => f.text_he), s.action.sign_he, s.bridge.text_he].join(' ')));
  const red = stopPlants ? [] : REDLIST.filter((r) => textMatches(q, [r.name_he, r.name_la, r.risk_he, r.context_he].join(' ')));
  const total = sys.length + red.length;
  return `
  <header class="panel-head">
    <div><p class="label">חיפוש</p><h2>„${esc(q)}”</h2></div>
    ${closeBtn}
  </header>
  ${alertCards(hits)}
  ${stopPlants || (hits.length && !total) ? '' : `
  <p class="counts"><b class="num">${total}</b> תוצאות: <span>מערכות <b class="num">${sys.length}</b></span> <span>רשימה אדומה <b class="num">${red.length}</b></span></p>
  ${total ? '' : `<p class="empty">אין תוצאה ל„${esc(q)}”.<br>נסו שם של איבר, מחלה או צמח, למשל: לב, שבץ, כבד.</p>`}
  <ul class="results">
    ${sys.map((s) => `<li><button class="result-row press" data-pick="${s.id}"><span class="label">מערכת</span><b>${s.name_he}</b><span>${rich(s.insight.replace(/==/g, ''))}</span></button></li>`).join('')}
    ${red.map((r) => `<li><button class="result-row is-red press" data-view-go="redlist" data-anchor="${r.id}"><span class="label">רשימה אדומה</span><b>${r.name_he}</b><span>${rich(r.risk_he)}</span></button></li>`).join('')}
  </ul>`}`;
}

function redlistView(anchor) {
  const p = loadProfile();
  const flagged = PROFILE_ITEMS.filter((i) => p[i.id]);
  return `
  <header class="panel-head">
    <div><p class="label">בטיחות</p><h2 class="red-title">${ico.warn}רשימה אדומה</h2></div>
    ${closeBtn}
  </header>
  <p class="insight">${rich('==טבעי אינו בהכרח בטוח. ארבעה פריטים עם נזק מתועד.==')}</p>
  ${flagged.length ? `<p class="profile-flag">לפי השאלון שלך במכשיר: ${flagged.map((i) => i.he).join(', ')}. <button class="linkish" data-view-go="profile">לשאלון</button></p>` : ''}
  <ol class="redlist">
    ${REDLIST.map((r) => `
      <li class="red-item${r.id === anchor ? ' is-anchor' : ''}" id="red-${r.id}">
        <h3>${r.name_he}<span class="latin" dir="ltr">${esc(r.name_la)}</span></h3>
        <p class="itext">${rich(r.risk_he)}</p>
        <p class="ctx">${rich(r.context_he)}</p>
        <p class="imeta"><span class="ev">נבדק <span class="num">${r.last_reviewed.split('-').reverse().join('.')}</span></span>${r.sources.map(srcLine).join('')}</p>
      </li>`).join('')}
  </ol>
  <div class="alert tone-doctor">
    <p class="sign">${rich(REDLIST_ACTION.sign_he)}</p>
    <p class="go">${rich(REDLIST_ACTION.go_he)}</p>
  </div>
  <p class="question">${rich(REDLIST_ACTION.rule_he)}</p>`;
}

function profileView() {
  const p = loadProfile();
  const notes = profileNotes(p);
  return `
  <header class="panel-head">
    <div><p class="label">בטיחות</p><h2>הבטיחות שלי</h2></div>
    ${closeBtn}
  </header>
  <p class="insight">${rich('==שמונה שאלות. התשובות לא יוצאות מהמכשיר.==')}</p>
  <form class="profile" id="profile-form" onsubmit="return false">
    <fieldset>
      <legend class="label">מה נכון לגביך, או לגבי מי שעבורו את קוראת או אתה קורא?</legend>
      ${PROFILE_ITEMS.map((i) => `<label class="check press-soft"><input type="checkbox" name="${i.id}" ${p[i.id] ? 'checked' : ''}><span class="box" aria-hidden="true"></span>${i.he}</label>`).join('')}
    </fieldset>
    <p class="saved" id="saved" aria-live="polite">${Object.keys(p).length ? 'נשמר במכשיר בלבד' : 'לא נשמר דבר'}</p>
  </form>
  <section class="block" aria-labelledby="h-notes">
    <h3 id="h-notes"><span class="label">מה זה אומר</span>קריאה, לא אבחנה</h3>
    ${notes.length ? notes.map((n) => `<div class="alert tone-${n.tone}"><p>${rich(n.text)}</p>${n.link ? `<button class="linkish" data-view-go="${n.link}">לרשימה האדומה</button>` : ''}${n.pick ? `<button class="linkish" data-pick="${n.pick}">למערכת החיסון</button>` : ''}</div>`).join('') : '<p class="empty">לא סומן דבר. הסימון משנה רק את ההערות כאן ובראש הרשימה האדומה.</p>'}
  </section>
  <button class="btn press" data-clear-profile ${Object.keys(p).length ? '' : 'disabled'}>מחיקת השאלון מהמכשיר</button>`;
}

function aboutView() {
  return `
  <header class="panel-head">
    <div><p class="label">הצהרה</p><h2>מה זה, ומה לא</h2></div>
    ${closeBtn}
  </header>
  <p class="insight">${rich('==כלי לקריאה של הגוף, לא תחליף לרופא.==')}</p>
  <div class="two">
    <section class="box-tone box-yes"><h3>מה כן</h3><ul>
      <li>מסבירה איך מערכות הגוף עובדות.</li>
      <li>מפרידה בין <b>ידוע</b>, <b>נאמר</b> ו<b>מאמינים</b>.</li>
      <li>מראה מתי פונים, ומה שואלים.</li>
      <li>מציגה מקור לכל עובדה.</li>
    </ul></section>
    <section class="box-tone box-no"><h3>מה לא</h3><ul>
      <li>לא מאבחנת ולא מטפלת, ולא ממליצה על טיפול.</li>
      <li>אין מינונים לתרופה, צמח או תוסף.</li>
      <li>אין משקל, קלוריות או ציון בריאות.</li>
      <li>לא מחליפה רופא, רוקח או דיאטנית.</li>
    </ul></section>
  </div>
  <section class="block"><h3><span class="label">פרטיות</span>מה נשמר</h3>
    <p class="itext">אין שרת ואין חשבון. שאלון הבטיחות נשמר <b>רק במכשיר</b>, ונמחק בלחיצה.</p>
    <p class="itext">מידע בריאותי הוא מידע ברגישות מיוחדת לפי <b>תיקון 13</b> לחוק הגנת הפרטיות. לכן לא אוספים אותו.</p>
  </section>
  <section class="block"><h3><span class="label">לפני השקה</span>מה עוד ייבדק</h3>
    <p class="itext">כל תוכן רפואי ייבדק בידי רופא. מספרי החירום יאומתו מול הגורמים עצמם. ייעוץ משפטי לפי תיקון 13.</p>
  </section>`;
}

// ---------- State in the URL ----------
function readState() {
  const p = new URLSearchParams(location.hash.slice(1));
  const s = SYSTEMS.find((x) => x.id === p.get('s')) || SYSTEMS.find((x) => x.id === 'cardio');
  const q = p.get('q') || '';
  let v = VIEWS.includes(p.get('v')) ? p.get('v') : 'system';
  if (v === 'search' && !normalize(q)) v = 'system';
  return { s, v, q, a: p.get('a') || '' };
}
const VIEWS = ['emergency', 'sources', 'redlist', 'profile', 'about', 'search'];
function go(s, v = 'system', extra = {}) {
  const prm = new URLSearchParams({ s: s.id });
  if (v !== 'system') prm.set('v', v);
  if (v === 'search' && extra.q) prm.set('q', extra.q);
  if (extra.a) prm.set('a', extra.a);
  const h = '#' + prm.toString();
  if (location.hash !== h) location.hash = h;
  else render();
}

function render() {
  const { s, v, q, a } = readState();
  const panel = $('#panel');
  const views = { emergency: emergencyView, sources: sourcesView, redlist: () => redlistView(a), profile: profileView, about: aboutView, search: () => searchView(q) };
  panel.innerHTML = (views[v] || (() => systemView(s)))();
  const box = $('#search');
  if (v === 'search' && document.activeElement !== box) box.value = q;
  if (v !== 'search' && document.activeElement !== box) box.value = '';
  $('#search-clear').hidden = !box.value;
  if (a) { const el = document.getElementById(`red-${a}`); if (el) el.scrollIntoView({ block: 'nearest' }); }
  panel.setAttribute('aria-labelledby', v === 'system' ? 'sys-title' : '');
  panel.scrollTop = 0;
  $$('.sys').forEach((g) => g.classList.toggle('on', g.dataset.id === s.id));
  $$('.sysmark').forEach((g) => {
    const on = g.dataset.id === s.id;
    g.classList.toggle('on', on);
    g.setAttribute('aria-pressed', String(on));
  });
  $$('[data-view]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.view === v)));
  document.title = v === 'system' ? `${s.name_he} | רפואה` : 'רפואה: גוף, מחלה, בריאות';
  document.body.classList.toggle('has-alert', !!panel.querySelector('.alert-card'));
  // On narrow screens the panel sits below the figure: bring the change into view.
  if (render.ready && matchMedia('(max-width: 999px)').matches) {
    const r = panel.getBoundingClientRect();
    if (r.top > innerHeight * 0.8) panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  render.ready = true;
}

// ---------- Boot ----------
function boot() {
  $('#figure').innerHTML = bodySVG(SYSTEMS);
  $('#layers-legend').innerHTML = Object.entries(LAYERS)
    .map(([k, L]) => `<li class="l-${k}"><span class="swatch" aria-hidden="true"></span><b>${L.he}</b><span>${L.def}</span></li>`)
    .join('');

  const pickById = (id) => go(SYSTEMS.find((x) => x.id === id));
  $('#figure').addEventListener('click', (e) => {
    const g = e.target.closest('.sysmark, .sys');
    if (g) pickById(g.dataset.id);
  });
  $('#figure').addEventListener('keydown', (e) => {
    const g = e.target.closest('.sysmark');
    if (g && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      pickById(g.dataset.id);
    }
  });
  $('#figure').addEventListener('mouseover', (e) => {
    const g = e.target.closest('.sysmark, .sys');
    $$('.sys, .sysmark').forEach((x) => x.classList.toggle('hover', !!g && x.dataset.id === g.dataset.id));
  });
  $('#figure').addEventListener('mouseleave', () => $$('.hover').forEach((x) => x.classList.remove('hover')));

  $('#panel').addEventListener('click', (e) => {
    const step = e.target.closest('[data-go]');
    if (step) {
      const { s } = readState();
      const i = (SYSTEMS.indexOf(s) + Number(step.dataset.go) + SYSTEMS.length) % SYSTEMS.length;
      go(SYSTEMS[i]);
    }
    if (e.target.closest('[data-close]')) go(readState().s);
    const pick = e.target.closest('[data-pick]');
    if (pick) pickById(pick.dataset.pick);
    const vg = e.target.closest('[data-view-go]');
    if (vg) go(readState().s, vg.dataset.viewGo, { a: vg.dataset.anchor });
    if (e.target.closest('[data-clear-profile]')) { saveProfile({}); render(); }
  });
  $('#panel').addEventListener('change', (e) => {
    const form = e.target.closest('#profile-form');
    if (!form) return;
    const p = {};
    PROFILE_ITEMS.forEach((i) => { if (form.elements[i.id].checked) p[i.id] = true; });
    const ok = saveProfile(p);
    const name = e.target.name;
    render();
    const again = $(`#profile-form [name="${name}"]`);
    if (again) again.focus();
    const sv = $('#saved');
    if (sv) sv.textContent = ok ? (Object.keys(p).length ? 'נשמר במכשיר בלבד' : 'נמחק מהמכשיר') : 'הדפדפן חוסם שמירה. הסימון יישאר רק עד סגירת הדף.';
  });

  // Search: emergency phrases are checked first, on every keystroke.
  const box = $('#search');
  let t;
  box.addEventListener('input', () => {
    $('#search-clear').hidden = !box.value;
    clearTimeout(t);
    const run = () => {
      const { s } = readState();
      if (normalize(box.value)) go(s, 'search', { q: box.value.trim() });
      else go(s);
    };
    // An emergency phrase is shown at once, without waiting for the debounce.
    if (detect(box.value, KEYWORDS).length) run();
    else t = setTimeout(run, 180);
  });
  box.addEventListener('focus', () => box.select());
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { box.value = ''; go(readState().s); }
  });
  $('#search-clear').addEventListener('click', () => { box.value = ''; go(readState().s); box.focus(); });
  $('#about-link').addEventListener('click', (e) => { e.preventDefault(); go(readState().s, 'about'); });

  $$('[data-view]').forEach((b) =>
    b.addEventListener('click', () => {
      const { s, v } = readState();
      const want = b.dataset.view;
      go(s, v === want && want !== 'system' ? 'system' : want);
    }),
  );

  addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    const { s, v } = readState();
    if (e.key === 'Escape' && v !== 'system') go(s);
    if (v !== 'system') return;
    const d = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0; // RTL: left = next
    if (d) go(SYSTEMS[(SYSTEMS.indexOf(s) + d + SYSTEMS.length) % SYSTEMS.length]);
  });

  addEventListener('hashchange', render);
  render();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

boot();
