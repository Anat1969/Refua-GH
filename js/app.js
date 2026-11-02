import { SYSTEMS, SOURCES, LAYERS, EMERGENCY } from './data.js';
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

// ---------- State in the URL ----------
function readState() {
  const p = new URLSearchParams(location.hash.slice(1));
  const s = SYSTEMS.find((x) => x.id === p.get('s')) || SYSTEMS.find((x) => x.id === 'cardio');
  const v = ['emergency', 'sources'].includes(p.get('v')) ? p.get('v') : 'system';
  return { s, v };
}
function go(s, v = 'system') {
  const h = `#s=${s.id}${v !== 'system' ? `&v=${v}` : ''}`;
  if (location.hash !== h) location.hash = h;
  else render();
}

function render() {
  const { s, v } = readState();
  const panel = $('#panel');
  panel.innerHTML = v === 'emergency' ? emergencyView() : v === 'sources' ? sourcesView() : systemView(s);
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
  });

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
