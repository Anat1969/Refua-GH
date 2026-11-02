import { SYSTEMS, SOURCES, LAYERS, EMERGENCY, REDLIST, REDLIST_ACTION, KEYWORDS, EMERGENCY_NUMBERS, PROFILE_ITEMS, DEEP, DISEASES, GROUPS } from './data.js';
import { detect, textMatches, normalize } from './match.js';
import { bodySVG } from './body.js';
import { circulationSVG } from './circulation.js';

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
  ${DEEP[s.id] ? `<button class="deep-cta press rise" data-view-go="deep"><span class="label">לעומק</span><b>${DEEP[s.id].title_he}</b><span>שמונה שלבים, איברים, ושלוש מחלות</span></button>` : ''}

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
  const dz = DISEASES.filter((x) => textMatches(q, [x.name_he, x.name_en, ...x.items.map((i) => i.text_he)].join(' ')));
  const red = stopPlants ? [] : REDLIST.filter((r) => textMatches(q, [r.name_he, r.name_la, r.risk_he, r.context_he].join(' ')));
  const total = sys.length + dz.length + red.length;
  return `
  <header class="panel-head">
    <div><p class="label">חיפוש</p><h2>„${esc(q)}”</h2></div>
    ${closeBtn}
  </header>
  ${alertCards(hits)}
  ${stopPlants || (hits.length && !total) ? '' : `
  <p class="counts"><b class="num">${total}</b> תוצאות: <span>מערכות <b class="num">${sys.length}</b></span> <span>מחלות <b class="num">${dz.length}</b></span> <span>רשימה אדומה <b class="num">${red.length}</b></span></p>
  ${total ? '' : `<p class="empty">אין תוצאה ל„${esc(q)}”.<br>נסו שם של איבר, מחלה או צמח, למשל: לב, שבץ, כבד.</p>`}
  <ul class="results">
    ${sys.map((s) => `<li><button class="result-row press" data-pick="${s.id}"><span class="label">מערכת</span><b>${s.name_he}</b><span>${rich(s.insight.replace(/==/g, ''))}</span></button></li>`).join('')}
    ${dz.map((x) => `<li><button class="result-row press" data-open-dz="${x.id}"><span class="label">מחלה</span><b>${x.name_he}</b><span>${rich(x.insight.replace(/==/g, ''))}</span></button></li>`).join('')}
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

// ---------- Stage 4: diseases ----------
const sysName = (id) => SYSTEMS.find((x) => x.id === id).name_he;
const diseasesIn = (f) => (GROUPS[f] ? GROUPS[f].ids.map((id) => DISEASES.find((d) => d.id === id)) : f ? DISEASES.filter((d) => d.system === f) : DISEASES);
const groupOf = (id) => Object.entries(GROUPS).find(([, g]) => g.ids.includes(id))?.[0];
const layerMarks = (d) => ['known', 'said', 'believed'].map((l) => (d.items.some((i) => i.layer === l) ? `<span class="lm lm-${l}" title="${LAYERS[l].he}"></span>` : '<span class="lm lm-none"></span>')).join('');

function systemFilter(f) {
  return `<div class="filter" role="group" aria-label="סינון לפי מערכת">
    <button class="chip" data-f="" aria-pressed="${!f}">הכול <span class="num">${DISEASES.length}</span></button>
    ${Object.entries(GROUPS).map(([gid, g]) => `<button class="chip chip-group" data-f="${gid}" aria-pressed="${f === gid}">${g.name_he} <span class="num">${g.ids.length}</span></button>`).join('')}
    <span class="filter-sep" aria-hidden="true"></span>
    ${SYSTEMS.map((s) => `<button class="chip" data-f="${s.id}" aria-pressed="${f === s.id}">${s.name_he} <span class="num">${diseasesIn(s.id).length}</span></button>`).join('')}
  </div>`;
}

function dzTile(d) {
  return `<li><button class="dz-tile press" data-open-dz="${d.id}">
    <b>${d.name_he}</b><span class="dz-in">${rich(d.insight.replace(/==/g, ''))}</span>
    <span class="lms" aria-label="שכבות: ${['known', 'said', 'believed'].filter((l) => d.items.some((i) => i.layer === l)).map((l) => LAYERS[l].he).join(', ')}">${layerMarks(d)}</span>
    ${d.action.urgency === 'emergency' ? '<span class="dz-urgent">סימן חירום</span>' : ''}
    ${groupOf(d.id) ? `<span class="dz-tag">${GROUPS[groupOf(d.id)].name_he}</span>` : ''}
  </button></li>`;
}

function diseasesView(f) {
  const G = GROUPS[f];
  const groups = G ? `
    <section class="group-intro rise" aria-labelledby="g-intro">
      <h3 id="g-intro"><span>${G.name_he}: התמונה הכוללת</span></h3>
      <p class="insight">${rich(G.insight)}</p>
      ${G.items.map(item).join('')}
    </section>
    <section class="dz-group"><h3><span>${G.ids.length} סוגים</span></h3>
      <ul class="dz-grid">${diseasesIn(f).map(dzTile).join('')}</ul></section>` : SYSTEMS.filter((s) => !f || s.id === f).map((s) => {
    const list = diseasesIn(s.id);
    return `<section class="dz-group" aria-labelledby="g-${s.id}">
      <h3 id="g-${s.id}"><span>${s.name_he}</span><span class="num">${list.length}</span></h3>
      <ul class="dz-grid">${list.map(dzTile).join('')}</ul>
    </section>`;
  }).join('');
  return `
  <header class="panel-head">
    <div><p class="label">מחלות</p><h2>${G ? `${G.name_he}: ${G.ids.length} סוגים` : `${DISEASES.length} מחלות, לפי מערכת`}</h2></div>
    ${closeBtn}
  </header>
  ${G ? '' : `<p class="insight">${rich('==הסיבות המובילות למוות ולנכות, במבט אחד.==')}</p>`}
  ${systemFilter(f)}
  ${groups}
  <p class="fine">לפי גיליונות העובדות של ארגון הבריאות העולמי (WHO). שלוש הקווים בכל כרטיס: אילו שכבות יש בו.</p>`;
}

function diseaseView(id, f) {
  const d = DISEASES.find((x) => x.id === id) || DISEASES[0];
  const list = diseasesIn(f);
  const i = Math.max(0, list.indexOf(d));
  const inDeep = DEEP[d.system]?.diseases?.some((x) => x.id === d.id);
  return `
  <header class="panel-head">
    <div>
      <button class="label linkish-label" data-pick="${d.system}">${sysName(d.system)}</button>
      <h2 id="sys-title">${d.name_he}</h2>
      <p class="latin-line" dir="ltr">${d.name_en}</p>
    </div>
    <div class="ops" role="group" aria-label="מעבר בין מחלות">
      <button class="icon press" data-dz-step="-1" title="המחלה הקודמת" aria-label="המחלה הקודמת">${ico.prev}</button>
      <span class="pos"><span class="num">${i + 1}/${list.length}</span></span>
      <button class="icon press" data-dz-step="1" title="המחלה הבאה" aria-label="המחלה הבאה">${ico.next}</button>
      <button class="icon press" data-view-go="diseases" title="לכל המחלות" aria-label="לכל המחלות">${ico.close}</button>
    </div>
  </header>
  <p class="insight rise">${rich(d.insight)}</p>
  ${groupOf(d.id) ? `<button class="linkish rise" data-group-go="${groupOf(d.id)}">כל סוגי ה${GROUPS[groupOf(d.id)].name_he}, והתמונה הכוללת</button>` : ''}
  <section class="block rise" aria-labelledby="h-dz-l">
    <h3 id="h-dz-l"><span class="label">הבנה</span>מה ידוע, מה נאמר, מה מאמינים</h3>
    ${d.items.map(item).join('')}
  </section>
  <section class="block rise">
    <h3><span class="label">שימוש</span>מתי פונים, ומה שואלים</h3>
    <div class="alert ${d.action.urgency === 'emergency' ? 'tone-urgent' : 'tone-doctor'}">
      <p class="sign">${rich(d.action.sign_he)}</p>
      <p class="go">${rich(d.action.go_he)}</p>
      <p class="imeta">${srcLine(d.action.source_id)}</p>
    </div>
    <p class="question"><span class="label">שאלה לרופא</span>${rich(d.action.question_he)}</p>
  </section>
  ${d.bridge ? `<section class="block bridge rise"><h3><span class="label">${d.bridge.kind === 'nutrition' ? 'חיבור לתזונה' : 'חיבור לעיר'}</span>${rich(d.bridge.next_he)}</h3>${item(d.bridge)}</section>` : ''}
  ${inDeep ? `<button class="deep-cta press rise" data-deep-dz="${d.id}"><span class="label">לעומק</span><b>${DEEP[d.system].title_he}</b><span>המחלה בתוך התרשים, עם האיברים והתהליך</span></button>` : ''}`;
}

const TABS = [['process', 'תהליך'], ['organs', 'איברים'], ['diseases', 'מחלות']];
function deepView(s, t, k, d) {
  const D = DEEP[s.id];
  const st = D.steps[k];
  const tabs = `<div class="tabs" role="tablist" aria-label="${D.title_he}">${TABS.map(([id, he]) => `<button class="chip" role="tab" aria-selected="${t === id}" aria-current="${t === id}" data-tab="${id}">${he}</button>`).join('')}</div>`;
  let body = '';
  if (t === 'process') {
    body = `
    <section class="block rise" aria-labelledby="h-step">
      <h3 id="h-step"><span class="label">שלב <span class="num">${k + 1}</span> מתוך <span class="num">${D.steps.length}</span></span>${st.name_he}</h3>
      ${item(st)}
    </section>
    <ol class="chain">${D.steps.map((x, i) => `<li><button class="chain-row press-soft${i === k ? ' on' : ''}" data-step="${i}" aria-current="${i === k}"><span class="num">${i + 1}</span>${x.name_he}</button></li>`).join('')}</ol>
    <p class="note-line">${rich(D.insight_note)}</p>`;
  } else if (t === 'organs') {
    body = `<div class="organ-list rise">${D.organs.map((o) => `<div class="organ"><h4>${o.name_he}</h4>${item(o)}</div>`).join('')}</div>`;
  } else {
    const dz = D.diseases.find((x) => x.id === d) || D.diseases[0];
    body = `
    <div class="dz-pick" role="group" aria-label="בחירת מחלה">${D.diseases.map((x) => `<button class="dz-btn press${x.id === dz.id ? ' on' : ''}" aria-pressed="${x.id === dz.id}" data-dz="${x.id}">${x.name_he}</button>`).join('')}</div>
    <section class="block rise" aria-labelledby="h-dz">
      <h3 id="h-dz"><span class="label">מחלה</span>${dz.name_he}<span class="latin" dir="ltr">${dz.name_en}</span></h3>
      <p class="insight">${rich(dz.insight)}</p>
      ${dz.items.map(item).join('')}
    </section>
    <section class="block rise">
      <h3><span class="label">שימוש</span>מתי פונים, ומה שואלים</h3>
      <div class="alert ${dz.action.urgency === 'emergency' ? 'tone-urgent' : 'tone-doctor'}">
        <p class="sign">${rich(dz.action.sign_he)}</p>
        <p class="go">${rich(dz.action.go_he)}</p>
        <p class="imeta">${srcLine(dz.action.source_id)}</p>
      </div>
      <p class="question"><span class="label">שאלה לרופא</span>${rich(dz.action.question_he)}</p>
    </section>
    ${dz.bridge ? `<section class="block bridge rise"><h3><span class="label">חיבור לתזונה</span>${rich(dz.bridge.next_he)}</h3>${item(dz.bridge)}</section>` : ''}`;
  }
  return `
  <header class="panel-head">
    <div><p class="label">${s.name_he}, לעומק</p><h2 id="sys-title">${D.title_he}</h2></div>
    <div class="ops"><button class="icon press" data-view-go="system" title="חזרה לכרטיס המערכת" aria-label="חזרה לכרטיס המערכת">${ico.close}</button></div>
  </header>
  <p class="insight">${rich(D.insight)}</p>
  ${tabs}
  ${body}`;
}

// ---------- State in the URL ----------
function readState() {
  const p = new URLSearchParams(location.hash.slice(1));
  const s = SYSTEMS.find((x) => x.id === p.get('s')) || SYSTEMS.find((x) => x.id === 'cardio');
  const q = p.get('q') || '';
  let v = VIEWS.includes(p.get('v')) ? p.get('v') : 'system';
  if (v === 'search' && !normalize(q)) v = 'system';
  if (v === 'deep' && !DEEP[s.id]) v = 'system';
  const D = DEEP[s.id];
  const t = TABS.some(([id]) => id === p.get('t')) ? p.get('t') : 'process';
  const k = D ? Math.min(Math.max(parseInt(p.get('k'), 10) || 0, 0), D.steps.length - 1) : 0;
  const m = p.get('m') === '3d' && !atlasFailed ? '3d' : '2d';
  const f = SYSTEMS.some((x) => x.id === p.get('f')) || GROUPS[p.get('f')] ? p.get('f') : '';
  return { s, v, q, a: p.get('a') || '', t, k, d: p.get('d') || '', m, f };
}
const VIEWS = ['emergency', 'sources', 'redlist', 'profile', 'about', 'search', 'deep', 'diseases', 'disease'];
function go(s, v = 'system', extra = {}, replace = false) {
  const prm = new URLSearchParams({ s: s.id });
  if (v !== 'system') prm.set('v', v);
  const mode = extra.m || readState().m;
  if (mode === '3d' && v !== 'deep') prm.set('m', '3d');
  if (v === 'search' && extra.q) prm.set('q', extra.q);
  if (extra.a) prm.set('a', extra.a);
  if ((v === 'diseases' || v === 'disease') && extra.f) prm.set('f', extra.f);
  if (v === 'disease' && extra.d) prm.set('d', extra.d);
  if (v === 'deep') {
    if (extra.t && extra.t !== 'process') prm.set('t', extra.t);
    if (extra.k) prm.set('k', String(extra.k));
    if (extra.d) prm.set('d', extra.d);
  }
  const h = '#' + prm.toString();
  if (replace) { history.replaceState(null, '', h); render(); return; }
  if (location.hash !== h) location.hash = h;
  else render();
}

// ---------- 3D atlas: loaded only on request ----------
let atlas = null, atlasLoading = null, atlasFailed = false;
let pickSystem = (id) => go(SYSTEMS.find((x) => x.id === id));
async function ensureAtlas(sid) {
  if (atlas) return atlas.select(sid);
  if (atlasLoading) return;
  const host = $('#atlas');
  host.innerHTML = '<p class="atlas-wait">טוען תלת־ממד…</p>';
  atlasLoading = import('./atlas3d.js')
    .then((mod) => mod.mountAtlas(host, SYSTEMS, {
      selected: sid,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      onPick: (id) => pickSystem(id),
    }))
    .then((a) => { atlas = a; atlas.select(readState().s.id); $('#atlas-ops').hidden = readState().m !== '3d' || readState().v === 'deep'; })
    .catch(() => {
      atlasFailed = true;
      host.innerHTML = '';
      const st = readState();
      go(st.s, st.v, { m: '2d' }, true);
      $('#figure-note').textContent = 'התלת־ממד לא נטען במכשיר הזה. השקפים ממשיכים לעבוד.';
    })
    .finally(() => { atlasLoading = null; });
}

// The stage shows the body, or the system in depth. Museum text follows.
let homeMuseum = '';
function renderStage(s, v, k) {
  const deep = v === 'deep';
  const D = DEEP[s.id];
  const m3 = !deep && readState().m === '3d';
  document.body.classList.toggle('is-deep', deep);
  $('#stage-bar').hidden = deep;
  $$('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === (m3 ? '3d' : '2d'))));
  $('#atlas-ops').hidden = !m3 || !atlas;
  $('#atlas').hidden = !m3;
  if (m3) ensureAtlas(s.id);
  $('#figure').hidden = deep || m3;
  $('#deep-figure').hidden = !deep;
  $('#deep-controls').hidden = !deep;
  const dzMode = v === 'diseases' || v === 'disease';
  if (!atlasFailed || deep) $('#figure-note').textContent = dzMode && !deep ? 'לחיצה על מערכת בדמות מסננת את המחלות שלה.' : deep ? 'לחיצה על מספר או על קטע בדרך מציגה את השלב.' : m3 ? 'שמונה שקפים בחלל: הדמות מאחור, והעצבים מקדימה.' : 'כל מערכת היא שקף. לחיצה על שם או על איבר חושפת אותה.';
  const museum = $('#museum');
  if (!deep) {
    if (museum.dataset.mode !== 'home') { museum.innerHTML = homeMuseum; museum.dataset.mode = 'home'; }
    stopPlay();
    return;
  }
  const fig = $('#deep-figure');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (fig.dataset.sys !== s.id) { fig.innerHTML = circulationSVG(D.steps, reduced); fig.dataset.sys = s.id; }
  $$('#deep-figure .seg').forEach((g) => {
    const on = Number(g.dataset.step) === k;
    g.classList.toggle('on', on);
    g.setAttribute('aria-pressed', String(on));
  });
  $('#ctl-step').innerHTML = `<span class="num">${k + 1}</span>/<span class="num">${D.steps.length}</span> <b>${D.steps[k].name_he}</b>`;
  if (museum.dataset.mode !== s.id) {
    const m = D.museum;
    museum.innerHTML = `
      <figure class="quote"><blockquote>
        <p class="q-he">„${m.quote_he}”</p><p class="q-tag">תרגום</p>
        <p class="q-en" dir="ltr" lang="en">“${m.quote_en}”</p>
      </blockquote><figcaption><a class="src" href="${SOURCES[m.quote_source].url}" target="_blank" rel="noopener">${m.quote_by_he}</a></figcaption></figure>
      <figure class="haiku"><p>${m.haiku.join('<br>')}</p><figcaption>${m.haiku_note}</figcaption></figure>`;
    museum.dataset.mode = s.id;
  }
}

let playTimer = null;
function stopPlay() {
  clearInterval(playTimer);
  playTimer = null;
  const b = $('#step-play');
  if (b) { b.setAttribute('aria-pressed', 'false'); b.title = 'הפעלה'; b.setAttribute('aria-label', 'הפעלה'); }
}
function stepTo(k, replace = false) {
  const st = readState();
  const n = DEEP[st.s.id].steps.length;
  go(st.s, 'deep', { t: 'process', k: (k + n) % n }, replace);
}

function render() {
  const { s, v, q, a } = readState();
  const panel = $('#panel');
  const { t, k, d, f } = readState();
  const views = { diseases: () => diseasesView(f), disease: () => diseaseView(d, f), emergency: emergencyView, sources: sourcesView, redlist: () => redlistView(a), profile: profileView, about: aboutView, search: () => searchView(q), deep: () => deepView(s, t, k, d) };
  panel.innerHTML = (views[v] || (() => systemView(s)))();
  renderStage(s, v, k);
  const box = $('#search');
  if (v === 'search' && document.activeElement !== box) box.value = q;
  if (v !== 'search' && document.activeElement !== box) box.value = '';
  $('#search-clear').hidden = !box.value;
  if (a) { const el = document.getElementById(`red-${a}`); if (el) el.scrollIntoView({ block: 'nearest' }); }
  panel.setAttribute('aria-labelledby', ['system', 'deep', 'disease'].includes(v) ? 'sys-title' : '');
  panel.scrollTop = 0;
  $$('.sys').forEach((g) => g.classList.toggle('on', g.dataset.id === s.id));
  $$('.sysmark').forEach((g) => {
    const on = g.dataset.id === s.id;
    g.classList.toggle('on', on);
    g.setAttribute('aria-pressed', String(on));
  });
  $$('[data-view]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.view === v || (b.dataset.view === 'system' && v === 'deep') || (b.dataset.view === 'diseases' && v === 'disease'))));
  document.title = v === 'system' ? `${s.name_he} | רפואה` : v === 'deep' ? `${DEEP[s.id].title_he} | רפואה` : v === 'disease' ? `${(DISEASES.find((x) => x.id === d) || DISEASES[0]).name_he} | רפואה` : 'רפואה: גוף, מחלה, בריאות';
  document.body.classList.toggle('has-alert', !!panel.querySelector('.alert-card'));
  // On narrow screens the panel sits below the figure: bring the change into view.
  if (render.ready && matchMedia('(max-width: 999px)').matches) {
    const r = panel.getBoundingClientRect();
    if (r.top > innerHeight * 0.8) panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  render.ready = true;
}

function openDisease(id, f = '') {
  const x = DISEASES.find((y) => y.id === id);
  go(SYSTEMS.find((y) => y.id === x.system), 'disease', { d: id, f });
}
function stepDisease(dir) {
  const st = readState();
  const list = diseasesIn(st.f);
  const cur = DISEASES.find((x) => x.id === st.d) || list[0];
  const i = (list.indexOf(cur) + dir + list.length) % list.length;
  openDisease(list[i].id, st.f);
}

// ---------- Boot ----------
function boot() {
  $('#figure').innerHTML = bodySVG(SYSTEMS);
  $('#layers-legend').innerHTML = Object.entries(LAYERS)
    .map(([k, L]) => `<li class="l-${k}"><span class="swatch" aria-hidden="true"></span><b>${L.he}</b><span>${L.def}</span></li>`)
    .join('');

  // On the diseases screens the body becomes a filter: a system on the figure shows its diseases.
  const pickById = (id) => {
    const sys = SYSTEMS.find((x) => x.id === id);
    const st = readState();
    if (st.v === 'diseases' || st.v === 'disease') return go(sys, 'diseases', { f: st.v === 'diseases' && st.f === id ? '' : id });
    go(sys);
  };
  pickSystem = pickById;
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
  $$('[data-mode]').forEach((b) => b.addEventListener('click', () => {
    const st = readState();
    if (b.dataset.mode === '3d') atlasFailed = false;
    go(st.s, st.v, { m: b.dataset.mode, q: st.q, a: st.a });
  }));
  $('#atlas-reset').addEventListener('click', () => atlas?.reset());
  $('#atlas-front').addEventListener('click', () => atlas?.front());
  homeMuseum = $('#museum').innerHTML;
  $('#museum').dataset.mode = 'home';
  $('#deep-figure').addEventListener('click', (e) => {
    const g = e.target.closest('.seg');
    if (g) { stopPlay(); stepTo(Number(g.dataset.step)); }
  });
  $('#deep-figure').addEventListener('keydown', (e) => {
    const g = e.target.closest('.seg');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); stopPlay(); stepTo(Number(g.dataset.step)); }
  });
  $('#step-prev').addEventListener('click', () => { stopPlay(); stepTo(readState().k - 1); });
  $('#step-next').addEventListener('click', () => { stopPlay(); stepTo(readState().k + 1); });
  $('#step-play').addEventListener('click', () => {
    if (playTimer) return stopPlay();
    const b = $('#step-play');
    b.setAttribute('aria-pressed', 'true'); b.title = 'עצירה'; b.setAttribute('aria-label', 'עצירה');
    playTimer = setInterval(() => stepTo(readState().k + 1, true), 2400);
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
    if (step || e.target.closest('[data-close]')) return;
    const pick = e.target.closest('[data-pick]');
    if (pick) pickById(pick.dataset.pick);
    const vg = e.target.closest('[data-view-go]');
    if (vg) go(readState().s, vg.dataset.viewGo, { a: vg.dataset.anchor, f: vg.dataset.viewGo === 'diseases' ? readState().f : '' });
    const tab = e.target.closest('[data-tab]');
    if (tab) { const st = readState(); go(st.s, 'deep', { t: tab.dataset.tab, k: st.k, d: st.d }); }
    const dzb = e.target.closest('[data-dz]');
    if (dzb) { const st = readState(); go(st.s, 'deep', { t: 'diseases', d: dzb.dataset.dz }); }
    const od = e.target.closest('[data-open-dz]');
    if (od) openDisease(od.dataset.openDz, readState().v === 'diseases' ? readState().f : '');
    const fb = e.target.closest('[data-f]');
    if (fb) { const st = readState(); const nf = fb.dataset.f === st.f ? '' : fb.dataset.f; go(SYSTEMS.find((x) => x.id === nf) || st.s, 'diseases', { f: nf }); }
    const gg = e.target.closest('[data-group-go]');
    if (gg) go(readState().s, 'diseases', { f: gg.dataset.groupGo });
    const ds = e.target.closest('[data-dz-step]');
    if (ds) stepDisease(Number(ds.dataset.dzStep));
    const dd = e.target.closest('[data-deep-dz]');
    if (dd) { const x = DISEASES.find((y) => y.id === dd.dataset.deepDz); go(SYSTEMS.find((y) => y.id === x.system), 'deep', { t: 'diseases', d: x.id }); }
    const ch = e.target.closest('.chain-row');
    if (ch) { stopPlay(); stepTo(Number(ch.dataset.step)); }
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
    if (e.key === 'Escape' && v !== 'system') return go(s);
    if (v === 'disease') {
      const dd = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0;
      if (dd) stepDisease(dd);
      return;
    }
    if (v === 'deep') {
      const dd = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0;
      if (dd && !e.target.closest('.tabs')) { stopPlay(); stepTo(readState().k + dd); }
      return;
    }
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
