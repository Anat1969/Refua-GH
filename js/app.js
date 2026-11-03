import { SYSTEMS, SOURCES, LAYERS, EMERGENCY, REDLIST, REDLIST_ACTION, KEYWORDS, EMERGENCY_NUMBERS, PROFILE_ITEMS, DEEP, DISEASES, GROUPS, TIMELINE, TRADITIONS, HOME, NUTRITION_APP, nutritionHref, IMAGES, WONDERS, COUNTRIES, FLAG_URL } from './data.js';
import { historySVG, setEvent } from './history.js';
import { detect, textMatches, normalize } from './match.js';
import { bodySVG, sheetSVG } from './body.js';
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

const bridgeGo = (b) => {
  const href = b && nutritionHref(b.link);
  return href ? `<a class="bridge-go press" href="${href}" target="_blank" rel="noopener"><span class="label">באפליקציית ${NUTRITION_APP.name_he}</span><b>${esc(b.next_he || '')}</b></a>` : '';
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
// ---------- Discovery layer: three depths, plates, flags ----------
const DEPTHS = [[1, 'מבט', 'הפלא במספר אחד'], [2, 'הבנה', 'איך זה עובד'], [3, 'עומק', 'הגילוי, והשאלה הפתוחה']];
function depthBar(l) {
  return `<div class="depth" role="tablist" aria-label="רמת עומק">${DEPTHS.map(([n, he, sub]) => `<button class="depth-tab" role="tab" data-l="${n}" aria-selected="${l === n}"><span class="num">${n}</span><b>${he}</b><small>${sub}</small></button>`).join('')}</div>`;
}
const flag = (cc) => (cc && COUNTRIES[cc] ? `<img class="flag" src="${FLAG_URL(cc)}" alt="${COUNTRIES[cc]}" title="${COUNTRIES[cc]}" width="20" height="15" loading="lazy">` : '');
// Close-up crops of each ink sheet (viewBox in the 400x800 sheet), 2:1 for the cabinet tiles.
const CROP = { nervous: '120 25 160 80', respiratory: '26 128 348 174', cardio: '80 140 240 120', digestive: '0 150 400 200', skeletal: '80 140 240 120', immune: '60 140 280 140', reproductive: '23 252 354 177' };
// A plate: a historical image when one is verified, otherwise the system's own ink sheet.
function plate(imgId, sysId, cls = '') {
  const im = imgId && IMAGES[imgId];
  if (im) {
    return `<figure class="plate ${cls}"><img src="${im.src}" alt="${esc(im.title_he)}" loading="lazy"><figcaption><b>${esc(im.title_he)}</b><span>${esc(im.by_he)} <span class="latin" dir="ltr">${esc(im.by_en)}</span>, <span class="num">${im.year}</span>. <a class="src" href="${im.page}" target="_blank" rel="noopener">ויקישיתוף, נחלת הכלל</a></span></figcaption></figure>`;
  }
  if (!sysId) return '';
  const svg = encodeURIComponent(sheetSVG(sysId, 400));
  return `<figure class="plate plate-sheet ${cls}"><img src="data:image/svg+xml,${svg}" alt="שקף: ${sysName(sysId)}"><figcaption><b>שקף: ${sysName(sysId)}</b><span>קו דיו, מתוך מפת הגוף של האפליקציה</span></figcaption></figure>`;
}
const wonderBlock = (w) => `<div class="wonder"><span class="w-big">${esc(w.big)}</span><span class="w-unit">${esc(w.unit_he)}</span><p class="w-line">${rich(w.line_he)}</p><p class="imeta">${srcLine(w.source_id)}</p></div>`;
const seeAlso = (n) => (n < 3 ? `<button class="next-depth press-soft" data-l="${n + 1}">${n === 1 ? 'איך זה עובד' : 'הגילוי, והשאלה הפתוחה'}</button>` : '');
const momentsFor = (pred) => TIMELINE.map((e, i) => ({ e, i })).filter(({ e }) => pred(e));
const momentRow = ({ e, i }) => `<li><button class="moment press-soft" data-ev-go="${i}">${flag(e.cc)}<span class="num">${e.year < 0 ? -e.year : e.year}</span><b>${e.person_he}</b><span>${e.place_he}</span></button></li>`;
const sourcesOf = (items) => [...new Set(items.filter(Boolean).map((x) => x.source_id).filter((id) => id && SOURCES[id]))];

function systemView(s, l) {
  const i = SYSTEMS.indexOf(s);
  const a = s.action;
  const b = s.bridge;
  const w = WONDERS[s.id];
  const bridgeLabel = b.kind === 'nutrition' ? 'חיבור לתזונה' : 'חיבור לעיר';
  const head = `
  <header class="panel-head">
    <div>
      <p class="label">גיליון ${i + 1} מתוך ${SYSTEMS.length}</p>
      <h2 id="sys-title">${s.name_he}</h2>
      <p class="latin-line" dir="ltr">${s.name_en}</p>
    </div>
    <div class="ops" role="group" aria-label="מעבר בין מערכות">
      <button class="icon press" data-go="-1" title="הקודמת" aria-label="המערכת הקודמת">${ico.prev}</button>
      <span class="pos num">${i + 1}/${SYSTEMS.length}</span>
      <button class="icon press" data-go="1" title="הבאה" aria-label="המערכת הבאה">${ico.next}</button>
    </div>
  </header>
  ${depthBar(l)}`;
  if (l === 1) {
    return `${head}
    <section class="glance rise">
      ${wonderBlock(w)}
      ${readState().m !== '3d' ? `<button class="to-3d press-soft" data-mode-go="3d"><b>${s.name_he}, בגוף אמיתי</b><span>מודל תלת־ממדי מסריקות של אדם. לסובב, לחתוך, לגלות.</span></button>` : ''}
      ${plate(w.image, s.id)}
      <p class="city"><span class="label">בעיר</span>${rich(s.city)} <span class="ev">פרשנות</span></p>
      ${seeAlso(1)}
    </section>`;
  }
  if (l === 2) {
    return `${head}
    <p class="insight rise">${rich(s.insight)}</p>
    <section class="block rise" aria-labelledby="h-know"><h3 id="h-know"><span class="label">מבנה</span>מה המערכת עושה</h3>${item(s.role)}</section>
    <section class="block rise" aria-labelledby="h-under"><h3 id="h-under"><span class="label">כשל</span>מה משבש אותה</h3>${s.failure.map(item).join('')}</section>
    <section class="block bridge rise" aria-labelledby="h-bridge"><h3 id="h-bridge"><span class="label">${bridgeLabel}</span>${rich(b.next_he)}</h3>${item(b)}${bridgeGo(b)}</section>
    <p class="quiet-care"><span class="label">ומתי פונים</span>${rich(a.sign_he)}: ${rich(a.go_he)}. <span class="ev">${esc(a.question_he)}</span></p>
    ${seeAlso(2)}`;
  }
  const moments = momentsFor((e) => e.system === s.id || (e.disease && DISEASES.find((d) => d.id === e.disease)?.system === s.id));
  const said = s.failure.filter((f) => f.layer === 'said');
  const src = sourcesOf([s.role, ...s.failure, b, a, w]);
  return `${head}
  <section class="block rise"><h3><span class="label">שאלה פתוחה</span>מה עוד לא ידוע</h3><p class="open-q">${esc(w.open_q_he)}</p></section>
  ${moments.length ? `<section class="block rise"><h3><span class="label">גילויים</span>מי ראה את זה ראשון</h3><ul class="moments">${moments.map(momentRow).join('')}</ul></section>` : ''}
  ${said.length ? `<section class="block rise"><h3><span class="label">מסורת</span>מה אמרו לפני הראיות</h3>${said.map(item).join('')}</section>` : ''}
  ${DEEP[s.id] ? `<button class="deep-cta press rise" data-view-go="deep"><span class="label">לעומק</span><b>${DEEP[s.id].title_he}</b><span>שמונה שלבים, איברים, ושלוש מחלות</span></button>` : ''}
  <button class="linkish rise" data-sys-dz="${s.id}">כל המחלות של ${s.name_he}</button>
  <section class="block rise"><h3><span class="label">מקורות</span>על מה זה נשען</h3><ul class="src-list">${src.map((id) => `<li>${srcLine(id)}</li>`).join('')}</ul></section>`;
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
        ${r.bridge ? bridgeGo({ link: r.bridge, next_he: 'כורכום במזון' }) : ''}
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

function diseaseView(id, f, l) {
  const d = DISEASES.find((x) => x.id === id) || DISEASES[0];
  const list = diseasesIn(f);
  const i = Math.max(0, list.indexOf(d));
  const inDeep = DEEP[d.system]?.diseases?.some((x) => x.id === d.id);
  const known = d.items.filter((x) => x.layer === 'known');
  const head = `
  <header class="panel-head">
    <div>
      <button class="label linkish-label" data-pick="${d.system}">תיק חקירה: ${sysName(d.system)}</button>
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
  ${depthBar(l)}`;
  if (l === 1) {
    return `${head}
    <section class="glance rise">
      <p class="case-headline">${rich(d.insight)}</p>
      ${known[0] ? item(known[0]) : ''}
      ${groupOf(d.id) ? `<button class="linkish" data-group-go="${groupOf(d.id)}">כל סוגי ה${GROUPS[groupOf(d.id)].name_he}, והתמונה הכוללת</button>` : ''}
      ${seeAlso(1)}
    </section>`;
  }
  if (l === 2) {
    return `${head}
    <section class="block rise" aria-labelledby="h-dz-l"><h3 id="h-dz-l"><span class="label">המנגנון</span>מה ידוע, מה נאמר, מה מאמינים</h3>${d.items.map(item).join('')}</section>
    <p class="quiet-care"><span class="label">ומתי פונים</span>${rich(d.action.sign_he)}: ${rich(d.action.go_he)}. <span class="ev">${esc(d.action.question_he)}</span></p>
    ${seeAlso(2)}`;
  }
  const moments = momentsFor((e) => e.disease === d.id || e.system === d.system);
  const src = sourcesOf([...d.items, d.action, d.bridge]);
  return `${head}
  ${moments.length ? `<section class="block rise"><h3><span class="label">גילויים</span>הדרך אל ההבנה</h3><ul class="moments">${moments.map(momentRow).join('')}</ul></section>` : ''}
  ${d.bridge ? `<section class="block bridge rise"><h3><span class="label">${d.bridge.kind === 'nutrition' ? 'חיבור לתזונה' : 'חיבור לעיר'}</span>${rich(d.bridge.next_he)}</h3>${item(d.bridge)}${bridgeGo(d.bridge)}</section>` : ''}
  ${inDeep ? `<button class="deep-cta press rise" data-deep-dz="${d.id}"><span class="label">לעומק</span><b>${DEEP[d.system].title_he}</b><span>המחלה בתוך התרשים, עם האיברים והתהליך</span></button>` : ''}
  <section class="block rise"><h3><span class="label">מקורות</span>על מה זה נשען</h3><ul class="src-list">${src.map((x) => `<li>${srcLine(x)}</li>`).join('')}</ul></section>
  <div class="alert ${d.action.urgency === 'emergency' ? 'tone-urgent' : 'tone-doctor'}"><p class="sign">${rich(d.action.sign_he)}</p><p class="go">${rich(d.action.go_he)}</p><p class="imeta">${srcLine(d.action.source_id)}</p></div>
  <p class="question"><span class="label">שאלה לרופא</span>${rich(d.action.question_he)}</p>`;
}

// ---------- Home: the whole teaching on one foot ----------
const QUIZ_KEY = 'refua.quiz.v1';
function quizItems() {
  // Three sentences from the app itself, one per layer. The answer is the layer it already carries.
  const sys = (id) => SYSTEMS.find((x) => x.id === id);
  return [
    { ...sys('skeletal').failure.find((f) => f.layer === 'believed') },
    { ...sys('cardio').role },
    { ...sys('nervous').failure.find((f) => f.layer === 'said') },
  ];
}
function loadQuiz() { try { return JSON.parse(localStorage.getItem(QUIZ_KEY)) || {}; } catch { return {}; } }
function saveQuiz(q) { try { localStorage.setItem(QUIZ_KEY, JSON.stringify(q)); } catch { /* private mode: answers stay on screen only */ } }
let quizState = { answers: {} };

function homeLead() {
  const n = (x) => `<span class="num">${x}</span>`;
  return `
    <p class="label">על רגל אחת</p>
    <blockquote class="hillel">
      <p class="h-ar">„${HOME.hillel_he}”</p>
      <p class="h-tr"><span class="q-tag">תרגום</span> ${HOME.hillel_tr}</p>
      <p class="imeta">${srcLine(HOME.hillel_source)}</p>
    </blockquote>
    <h1 class="headline display">${rich(HOME.one_foot)}</h1>
    <p class="lede">${HOME.one_foot_more.split('\n').map(rich).join('<br>')}</p>
    <ul class="home-nums" aria-label="במספרים">
      <li><button class="numcell press-soft" data-view-go="system">${n(SYSTEMS.length)}<span>מערכות</span></button></li>
      <li><button class="numcell press-soft" data-view-go="diseases">${n(DISEASES.length)}<span>מחלות</span></button></li>
      <li><button class="numcell press-soft" data-view-go="history">${n(TIMELINE.length)}<span>גילויים</span></button></li>
      <li><button class="numcell press-soft" data-view-go="sources">${n(Object.keys(SOURCES).length)}<span>מקורות</span></button></li>
    </ul>
    <div id="quiz-box"></div>
    <p class="inspo">בהשראת <b>הלל הזקן</b>, ו<b>ארונות הפלאות</b> של אירופה, <span class="num">1600</span> לערך: כל פריט מעורר שאלה.</p>`;
}

function quizHTML() {
  const items = quizItems();
  const best = loadQuiz().best;
  const answered = Object.keys(quizState.answers).length;
  const right = items.filter((it, i) => quizState.answers[i] === it.layer).length;
  return `
  <section class="quiz block" aria-labelledby="h-quiz">
    <h3 id="h-quiz"><span class="label">בדיקה של דקה</span>ידוע, נאמר, או מאמינים?</h3>
    ${items.map((it, i) => {
      const a = quizState.answers[i];
      return `<div class="q-row${a ? (a === it.layer ? ' ok' : ' miss') : ''}">
        <p class="q-text">${rich(it.text_he)}</p>
        <div class="q-opts" role="group" aria-label="השכבה של המשפט">${['known', 'said', 'believed'].map((l) => `<button class="q-opt l-${l}${a === l ? ' picked' : ''}" data-q="${i}" data-a="${l}" aria-pressed="${a === l}" ${a ? 'disabled' : ''}>${LAYERS[l].he}</button>`).join('')}</div>
        ${a ? `<p class="q-fb">${a === it.layer ? 'נכון.' : `לא בדיוק: זה **${LAYERS[it.layer].he}**.`.replace(/\*\*(.+?)\*\*/, '<b>$1</b>')} ${LAYERS[it.layer].def}</p>` : ''}
      </div>`;
    }).join('')}
    <p class="q-score">${answered === items.length ? `<b class="num">${right}</b> מתוך <b class="num">${items.length}</b>. ${right === items.length ? 'ההבדל ברור.' : 'שווה לעבור על המקרא שוב.'} <button class="linkish" data-quiz-reset>שוב</button>` : `ענית על <span class="num">${answered}</span> מתוך <span class="num">${items.length}</span>.`}${best !== undefined ? ` <span class="ev">השיא שלך: ${best}</span>` : ''}</p>
  </section>`;
}

function homeView() {
  return `
  <header class="panel-head">
    <div><p class="label">ארון פלאות</p><h2 id="sys-title">שבעה פלאות, שבע מערכות</h2></div>
  </header>
  <ul class="cabinet">${SYSTEMS.map((x) => {
    const w = WONDERS[x.id];
    const im = w.image && IMAGES[w.image];
    return `<li><button class="wonder-tile press rise" data-pick="${x.id}">
      ${im ? `<img src="${im.src}" alt="" loading="lazy">` : `<img class="sheet" src="data:image/svg+xml,${encodeURIComponent(sheetSVG(x.id, 360, CROP[x.id]))}" alt="">`}
      <span class="wt-big">${esc(w.big)}</span><span class="wt-unit">${esc(w.unit_he)}</span>
      <span class="wt-line">${esc(w.line_he)}</span>
      <span class="wt-sys">${x.short_he || x.name_he}</span>
    </button></li>`;
  }).join('')}</ul>
  <section class="block" aria-labelledby="h-lines">
    <h3 id="h-lines"><span class="label">ואידך פירושה</span>שבע תובנות על מערכות</h3>
    <ol class="lines">${HOME.lines.map((ln, i) => `
      <li class="line">
        <span class="ln num">${i + 1}</span>
        <p class="lt">${rich(ln.text_he)}</p>
        <p class="imeta">${ln.source_id ? srcLine(ln.source_id) : '<span class="ev">העדשה של האפליקציה</span>'}<button class="linkish" data-line="${i}">${ln.go_he}</button></p>
      </li>`).join('')}</ol>
  </section>`;
}

// ---------- Stage 5: timeline and traditions ----------
const HTABS = [['timeline', 'ציר זמן'], ['traditions', 'מסורות']];
function historyView(ei, h) {
  const tabs = `<div class="tabs" role="tablist" aria-label="היסטוריה">${HTABS.map(([id, he]) => `<button class="chip" role="tab" aria-selected="${h === id}" data-htab="${id}">${he}</button>`).join('')}</div>`;
  let body;
  if (h === 'traditions') {
    body = `<p class="note-line">${rich('אותן שלוש שאלות לכל מסורת, כדי לראות מה משותף ומה ייחודי.')}</p>
    <div class="trad-list">${TRADITIONS.map((t) => `
      <section class="trad l-${t.layer} rise" aria-labelledby="tr-${t.id}">
        <header><span class="flags">${(t.flags || []).map(flag).join('')}</span><h3 id="tr-${t.id}">${t.name_he}</h3><span class="ltag">${LAYERS[t.layer].he}</span><span class="ev">${esc(t.era_he)}</span></header>
        <dl>
          <dt>מהי מחלה</dt><dd>${rich(t.disease_he)}</dd>
          <dt>איך בודקים</dt><dd>${rich(t.look_he)}</dd>
          <dt>מה עושים</dt><dd>${rich(t.act_he)}</dd>
        </dl>
        ${t.warn_he ? `<p class="trad-warn">${rich(t.warn_he)} ${srcLine(t.warn_source)} <button class="linkish" data-view-go="redlist">לרשימה האדומה</button></p>` : ''}
        <p class="imeta">${t.layer === 'known' ? `<span class="ev">ראיה ${t.evidence}</span>` : `<span class="ev">${esc(t.tradition)}</span>`}${srcLine(t.source_id)}</p>
      </section>`).join('')}</div>`;
  } else {
    const e = TIMELINE[ei];
    const rel = e.disease ? DISEASES.find((d) => d.id === e.disease) : null;
    const relSys = e.system ? SYSTEMS.find((x) => x.id === e.system) : null;
    const lv = readState().l;
    body = `
    ${depthBar(lv)}
    <section class="event rise" aria-labelledby="ev-title">
      <p class="ev-year"><span class="num">${e.year < 0 ? -e.year : e.year}</span>${e.year < 0 ? ' לפנה״ס' : ''}</p>
      <h3 id="ev-title">${flag(e.cc)}${e.person_he}<span class="latin" dir="ltr">${esc(e.person_en)}</span></h3>
      <p class="ev-place"><b>${e.place_he}</b><span class="latin" dir="ltr">${esc(e.place_en)}</span>${e.cc ? ` <span class="ev">${COUNTRIES[e.cc]} של היום</span>` : ''}</p>
      ${lv === 1 ? `${plate(e.image)}${seeAlso(1)}` : ''}
      ${lv === 2 ? `${item(e)}${seeAlso(2)}` : ''}
      ${lv === 3 ? item(e) : ''}
      <div class="ev-links">
        ${relSys ? `<button class="linkish" data-pick="${relSys.id}">למערכת: ${relSys.name_he}</button>` : ''}
        ${rel ? `<button class="linkish" data-open-dz="${rel.id}">למחלה: ${rel.name_he}</button>` : ''}
        ${e.deep ? `<button class="linkish" data-deep-sys="${e.system}">לתרשים מחזור הדם</button>` : ''}
      </div>
    </section>
    <ol class="chain ev-chain">${TIMELINE.map((x, i) => `<li><button class="chain-row press-soft${i === ei ? ' on' : ''}" data-ev="${i}" aria-current="${i === ei}"><span class="num">${i + 1}</span><span class="num yr">${x.year < 0 ? -x.year : x.year}</span>${x.person_he}</button></li>`).join('')}</ol>
    <p class="note-line">${rich('הקו על המפה עובר בין המקומות לפי סדר השנים. המרווחים בציר לפי סדר, לא לפי מספר השנים.')}</p>`;
  }
  return `
  <header class="panel-head">
    <div><p class="label">היסטוריה</p><h2 id="sys-title">${h === 'traditions' ? 'ארבע מסורות, שלוש שאלות' : `${TIMELINE.length} גילויים, יומן מסע`}</h2></div>
    ${closeBtn}
  </header>
  <p class="insight">${rich(h === 'traditions' ? '==המסורות שאלו את אותן שאלות. הראיות שינו את התשובות.==' : '==מאיזון ליחות לחיידק: מסע של 2,400 שנה, מעיר לעיר.==')}</p>
  ${tabs}
  ${body}`;
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
    ${dz.bridge ? `<section class="block bridge rise"><h3><span class="label">חיבור לתזונה</span>${rich(dz.bridge.next_he)}</h3>${item(dz.bridge)}${bridgeGo(dz.bridge)}</section>` : ''}`;
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
  let v = VIEWS.includes(p.get('v')) ? p.get('v') : p.get('s') ? 'system' : 'home';
  if (v === 'search' && !normalize(q)) v = 'system';
  if (v === 'deep' && !DEEP[s.id]) v = 'system';
  const D = DEEP[s.id];
  const t = TABS.some(([id]) => id === p.get('t')) ? p.get('t') : 'process';
  const k = D ? Math.min(Math.max(parseInt(p.get('k'), 10) || 0, 0), D.steps.length - 1) : 0;
  const m = p.get('m') === '3d' && !atlasFailed ? '3d' : '2d';
  const f = SYSTEMS.some((x) => x.id === p.get('f')) || GROUPS[p.get('f')] ? p.get('f') : '';
  const e = Math.min(Math.max(parseInt(p.get('e'), 10) || 0, 0), TIMELINE.length - 1);
  const h = p.get('h') === 'traditions' ? 'traditions' : 'timeline';
  const l = [1, 2, 3].includes(parseInt(p.get('l'), 10)) ? parseInt(p.get('l'), 10) : 1;
  return { s, v, q, a: p.get('a') || '', t, k, d: p.get('d') || '', m, f, e, h, l };
}
const VIEWS = ['home', 'emergency', 'sources', 'redlist', 'profile', 'about', 'search', 'deep', 'diseases', 'disease', 'history'];
function go(s, v = 'system', extra = {}, replace = false) {
  const prm = v === 'home' ? new URLSearchParams() : new URLSearchParams({ s: s.id });
  if (v !== 'system') prm.set('v', v);
  const mode = extra.m || readState().m;
  if (mode === '3d' && v !== 'deep' && v !== 'history') prm.set('m', '3d');
  if (v === 'search' && extra.q) prm.set('q', extra.q);
  if (extra.a) prm.set('a', extra.a);
  if ((v === 'diseases' || v === 'disease') && extra.f) prm.set('f', extra.f);
  if (v === 'disease' && extra.d) prm.set('d', extra.d);
  if (v === 'history') { if (extra.e) prm.set('e', String(extra.e)); if (extra.h === 'traditions') prm.set('h', 'traditions'); }
  if (v === 'deep') {
    if (extra.t && extra.t !== 'process') prm.set('t', extra.t);
    if (extra.k) prm.set('k', String(extra.k));
    if (extra.d) prm.set('d', extra.d);
  }
  if (extra.l && extra.l > 1 && ['system', 'disease', 'history'].includes(v)) prm.set('l', String(extra.l));
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
  atlasLoading = import('./body3d.js')
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
let historyMounted = false;
const homeMuseumOf = () => homeMuseum;
function renderHistoryStage(on, ei) {
  $('#map-figure').hidden = !on;
  $('#time-controls').hidden = !on;
  if (!on) { stopHistoryPlay(); return; }
  if (!historyMounted) {
    $('#map-figure').innerHTML = historySVG(TIMELINE);
    $('#year-track').innerHTML = TIMELINE.map((x, i) => `<li><button class="yr-btn" data-ev="${i}"><span class="num">${x.year < 0 ? -x.year : x.year}</span>${x.year < 0 ? '<small>לפנה״ס</small>' : ''}</button></li>`).join('');
    historyMounted = true;
  }
  setEvent($('#map-figure svg'), TIMELINE, ei);
  $$('#year-track .yr-btn').forEach((b) => { const on2 = Number(b.dataset.ev) === ei; b.classList.toggle('on', on2); b.setAttribute('aria-current', String(on2)); });
  // Scroll the track sideways only: scrollIntoView would also move the page and hide the map.
  const cur = $('#year-track .yr-btn.on'), tr = $('#year-track');
  if (cur && tr) {
    const a = cur.getBoundingClientRect(), b = tr.getBoundingClientRect();
    tr.scrollBy({ left: a.left + a.width / 2 - (b.left + b.width / 2), behavior: 'auto' });
  }
}
let historyTimer = null;
function stopHistoryPlay() {
  clearInterval(historyTimer); historyTimer = null;
  const b = $('#ev-play');
  if (b) { b.setAttribute('aria-pressed', 'false'); b.title = 'הפעלה'; b.setAttribute('aria-label', 'הפעלה'); }
}
function eventTo(i, replace = false) {
  const n = TIMELINE.length;
  go(readState().s, 'history', { e: (i + n) % n, l: readState().l }, replace);
}

function renderStage(s, v, k) {
  const hist = v === 'history';
  renderHistoryStage(hist, readState().e);
  if (hist) {
    document.body.classList.remove('is-deep');
    document.body.classList.add('is-history');
    ['#figure', '#atlas', '#deep-figure', '#deep-controls', '#stage-bar', '#atlas-ops'].forEach((sel) => { $(sel).hidden = true; });
    stopPlay();
    $('#figure-note').textContent = 'לחיצה על מספר במפה או על שנה בציר מציגה את הרגע.';
    const museum = $('#museum');
    if (museum.dataset.mode !== 'history') {
      museum.innerHTML = `
        <figure class="quote"><blockquote>
          <p class="q-he">„הואיל והיות הגוף בריא ושלם מדרכי השם הוא.”</p>
        </blockquote><figcaption><a class="src" href="${SOURCES['rambam-deot'].url}" target="_blank" rel="noopener">הרמב״ם, משנה תורה, הלכות דעות ד, א</a></figcaption></figure>
        <figure class="haiku"><p>משאבת לונדון<br>ידית יורדת לאט<br>העיר נושמת</p><figcaption>מפה אחת וידית אחת: כך נולדה האפידמיולוגיה.</figcaption></figure>`;
      museum.dataset.mode = 'history';
    }
    return;
  }
  document.body.classList.remove('is-history');
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
  if (!atlasFailed || deep) $('#figure-note').textContent = dzMode && !deep ? 'לחיצה על מערכת בדמות מסננת את המחלות שלה.' : deep ? 'לחיצה על מספר או על קטע בדרך מציגה את השלב.' : m3 ? 'גוף אמיתי, מסריקות של אדם: לחיצה על מבנה מציגה את שמו ואת התפקיד שלו.' : 'כל מערכת היא שקף. לחיצה על שם או על איבר חושפת אותה.';
  const museum = $('#museum');
  if (!deep && v === 'home') {
    if (museum.dataset.mode !== 'front') {
      museum.innerHTML = `${homeMuseumOf().replace(/<figure class="haiku">[\s\S]*<\/figure>/, '')}<figure class="haiku"><p>${HOME.haiku.join('<br>')}</p><figcaption>${HOME.haiku_note}</figcaption></figure>`;
      museum.dataset.mode = 'front';
    }
    stopPlay();
    return;
  }
  if (!deep) {
    if (museum.dataset.mode !== 'home') { museum.innerHTML = homeMuseumOf(); museum.dataset.mode = 'home'; }
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
  const { t, k, d, f, e, h, l } = readState();
  const views = { home: homeView, history: () => historyView(e, h), diseases: () => diseasesView(f), disease: () => diseaseView(d, f, l), emergency: emergencyView, sources: sourcesView, redlist: () => redlistView(a), profile: profileView, about: aboutView, search: () => searchView(q), deep: () => deepView(s, t, k, d) };
  panel.innerHTML = (views[v] || (() => systemView(s, l)))();
  renderStage(s, v, k);
  const box = $('#search');
  if (v === 'search' && document.activeElement !== box) box.value = q;
  if (v !== 'search' && document.activeElement !== box) box.value = '';
  $('#search-clear').hidden = !box.value;
  if (a) { const el = document.getElementById(`red-${a}`); if (el) el.scrollIntoView({ block: 'nearest' }); }
  panel.setAttribute('aria-labelledby', ['system', 'deep', 'disease', 'history'].includes(v) ? 'sys-title' : '');
  panel.scrollTop = 0;
  const isHome = v === 'home';
  document.body.classList.toggle('is-home', isHome);
  $('#home-lead').hidden = !isHome;
  if (isHome && !$('#home-lead').dataset.ready) { $('#home-lead').innerHTML = homeLead(); $('#home-lead').dataset.ready = '1'; }
  if (isHome) $('#quiz-box').innerHTML = quizHTML();
  $$('.sys').forEach((g) => g.classList.toggle('on', !isHome && g.dataset.id === s.id));
  $$('.sysmark').forEach((g) => {
    const on = !isHome && g.dataset.id === s.id;
    g.classList.toggle('on', on);
    g.setAttribute('aria-pressed', String(on));
  });
  $$('[data-view]').forEach((b) => b.setAttribute('aria-current', String((b.dataset.view === v && v !== 'home') || (b.dataset.view === 'system' && v === 'deep') || (b.dataset.view === 'diseases' && v === 'disease'))));
  document.title = isHome ? 'רפואה: גוף, מחלה, בריאות' : v === 'system' ? `${s.name_he} | רפואה` : v === 'deep' ? `${DEEP[s.id].title_he} | רפואה` : v === 'disease' ? `${(DISEASES.find((x) => x.id === d) || DISEASES[0]).name_he} | רפואה` : v === 'history' ? 'ציר זמן | רפואה' : 'רפואה: גוף, מחלה, בריאות';
  document.body.classList.toggle('has-alert', !!panel.querySelector('.alert-card'));
  // On narrow screens the panel sits below the figure: bring the change into view.
  // Except where the stage itself is the content (map, circulation): there the stage stays first.
  if (render.ready && v !== 'history' && v !== 'deep' && matchMedia('(max-width: 999px)').matches) {
    const r = panel.getBoundingClientRect();
    if (r.top > innerHeight * 0.8) panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  // Entering a stage-first view (map, circulation) on a phone: start from the top, so the stage shows.
  if (render.ready && (v === 'history' || v === 'deep') && render.lastView !== v && matchMedia('(max-width: 999px)').matches) $('.work').scrollTop = 0;
  render.lastView = v;
  render.ready = true;
}

function openDisease(id, f = '') {
  const x = DISEASES.find((y) => y.id === id);
  go(SYSTEMS.find((y) => y.id === x.system), 'disease', { d: id, f, l: readState().v === 'disease' ? readState().l : 1 });
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
  $('#map-figure').addEventListener('click', (e) => {
    const g = e.target.closest('.evp');
    if (g) { stopHistoryPlay(); eventTo(Number(g.dataset.ev)); }
  });
  $('#map-figure').addEventListener('keydown', (e) => {
    const g = e.target.closest('.evp');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); stopHistoryPlay(); eventTo(Number(g.dataset.ev)); }
  });
  $('#year-track').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ev]');
    if (b) { stopHistoryPlay(); eventTo(Number(b.dataset.ev)); }
  });
  $('#ev-prev').addEventListener('click', () => { stopHistoryPlay(); eventTo(readState().e - 1); });
  $('#ev-next').addEventListener('click', () => { stopHistoryPlay(); eventTo(readState().e + 1); });
  $('#ev-play').addEventListener('click', () => {
    if (historyTimer) return stopHistoryPlay();
    const b = $('#ev-play');
    b.setAttribute('aria-pressed', 'true'); b.title = 'עצירה'; b.setAttribute('aria-label', 'עצירה');
    historyTimer = setInterval(() => eventTo(readState().e + 1, true), 2600);
  });
  $('#home-lead').addEventListener('click', (e) => {
    const vg = e.target.closest('[data-view-go]');
    if (vg) go(SYSTEMS.find((x) => x.id === 'cardio'), vg.dataset.viewGo);
    const qa = e.target.closest('[data-q]');
    if (qa) {
      quizState.answers[Number(qa.dataset.q)] = qa.dataset.a;
      const items = quizItems();
      if (Object.keys(quizState.answers).length === items.length) {
        const right = items.filter((it, i) => quizState.answers[i] === it.layer).length;
        const q = loadQuiz(); saveQuiz({ best: Math.max(q.best || 0, right), last: right });
      }
      $('#quiz-box').innerHTML = quizHTML();
    }
    if (e.target.closest('[data-quiz-reset]')) { quizState = { answers: {} }; $('#quiz-box').innerHTML = quizHTML(); }
  });
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
      go(SYSTEMS[i], 'system', { l: readState().l });
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
    if (ch && ch.dataset.ev !== undefined) { stopHistoryPlay(); eventTo(Number(ch.dataset.ev)); }
    else if (ch) { stopPlay(); stepTo(Number(ch.dataset.step)); }
    const ln = e.target.closest('[data-line]');
    if (ln) { const g = HOME.lines[Number(ln.dataset.line)].go; const x = g.d && DISEASES.find((y) => y.id === g.d); go(x ? SYSTEMS.find((y) => y.id === x.system) : SYSTEMS.find((y) => y.id === g.s) || readState().s, g.v, g); }
    const lt = e.target.closest('[data-l]');
    if (lt) { const st = readState(); go(st.s, st.v, { ...st, l: Number(lt.dataset.l) }); }
    const mg = e.target.closest('[data-mode-go]');
    if (mg) { const st = readState(); atlasFailed = false; go(st.s, st.v, { ...st, m: mg.dataset.modeGo }); }
    const evg = e.target.closest('[data-ev-go]');
    if (evg) go(readState().s, 'history', { e: Number(evg.dataset.evGo) });
    const sdz = e.target.closest('[data-sys-dz]');
    if (sdz) go(SYSTEMS.find((y) => y.id === sdz.dataset.sysDz), 'diseases', { f: sdz.dataset.sysDz });
    const ht = e.target.closest('[data-htab]');
    if (ht) go(readState().s, 'history', { h: ht.dataset.htab, e: readState().e });
    const dsys = e.target.closest('[data-deep-sys]');
    if (dsys) go(SYSTEMS.find((x) => x.id === dsys.dataset.deepSys), 'deep');
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
    if (v === 'history') {
      const dh = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0;
      if (dh && !e.target.closest('.tabs')) { stopHistoryPlay(); eventTo(readState().e + dh); }
      return;
    }
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
