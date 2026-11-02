// Safety gate (docs/SAFETY.md, docs/CONTENT_RULES.md). Exit 1 blocks merge.
// Run: node scripts/check-safety.mjs
import { readFileSync, existsSync, statSync } from 'node:fs';
import { SYSTEMS, SOURCES, LAYERS, REDLIST, KEYWORDS, EMERGENCY_NUMBERS, PROFILE_ITEMS, DEEP, DISEASES, GROUPS, TIMELINE, TRADITIONS, HOME, nutritionHref, WONDERS, IMAGES, COUNTRIES } from '../js/data.js';
import { detect } from '../js/match.js';

const errors = [];
const err = (m) => errors.push(m);

const FORBIDDEN = [
  'מרפא', 'מרפאת', 'מנקה רעלים', 'מאזן הורמונים', 'מחזק חיסון', 'מוריד לחץ דם', 'מוריד סוכר',
  'עוצמתי', 'מטפל', 'מבריא', 'מבטיח',
  // medicine additions
  'מינון', 'מ"ג', 'תרופה ל', 'מאבחן', 'ריפוי מלא', 'טבעי ובטוח', 'ללא תופעות לוואי',
  // eating disorders (SAFETY.md section 1): no body weight, anywhere
  'משקל', 'קלוריות', 'BMI',
];
// The declaration is the one place these words appear, negated, by design.
const ALLOWED_PHRASES = ['לא מאבחנת ולא מטפלת', 'לא מאבחן ולא מטפל', 'אין משקל, קלוריות או ציון בריאות'];
const BANNED_KEYS = /dose|dosage|mg|calorie|kcal|bmi|weight|score|effect_size/i;
const EVIDENCE = ['גבוהה', 'בינונית', 'ראשונית', 'אין'];
const STATUS = ['לא נבדק', 'לא אוששה'];

function checkItem(it, where) {
  if (!LAYERS[it.layer]) return err(`${where}: unknown layer "${it.layer}"`);
  if (it.layer === 'known') {
    if (!EVIDENCE.includes(it.evidence)) err(`${where}: known without valid evidence`);
    if (!it.source_id) err(`${where}: known without source_id`);
  }
  if (it.layer === 'said') {
    if (!it.tradition) err(`${where}: said without tradition`);
    if (!it.source_id) err(`${where}: said without source_id`);
  }
  if (it.layer === 'believed' && !STATUS.includes(it.status)) err(`${where}: believed without status`);
  if (it.source_id && !SOURCES[it.source_id]) err(`${where}: source "${it.source_id}" not in SOURCES`);
}

function walkKeys(obj, path) {
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (BANNED_KEYS.test(k)) err(`${path}.${k}: banned field (dosage/calories/score)`);
      walkKeys(v, `${path}.${k}`);
    }
  }
}

const ids = new Set();
for (const s of SYSTEMS) {
  if (ids.has(s.id)) err(`duplicate system id ${s.id}`);
  ids.add(s.id);
  checkItem(s.role, `${s.id}.role`);
  if (!s.role.layer || s.role.layer !== 'known') err(`${s.id}.role: role must be a known fact`);
  s.failure.forEach((f, i) => checkItem(f, `${s.id}.failure[${i}]`));
  if (!s.failure.some((f) => f.layer === 'known')) err(`${s.id}: failure needs at least one known item`);
  checkItem(s.bridge, `${s.id}.bridge`);
  if (!s.bridge.link || !['nutrition', 'city'].includes(s.bridge.link.app)) err(`${s.id}.bridge: link.app must be nutrition or city`);
  const a = s.action;
  if (!SOURCES[a.source_id]) err(`${s.id}.action: missing source`);
  if (!['emergency', 'doctor'].includes(a.urgency)) err(`${s.id}.action: urgency must be emergency or doctor`);
  if (a.urgency === 'emergency' && !a.go_he.includes('101')) err(`${s.id}.action: emergency must point to 101`);
  if (!a.question_he.endsWith('?')) err(`${s.id}.action: question to the doctor must be a question`);
  walkKeys(s, s.id);
}
for (const [id, src] of Object.entries(SOURCES)) {
  if (!src.title || !src.year || !src.url) err(`source ${id}: needs title, year and url`);
}

// Systems in depth (stage 2): same layer rules, every disease has a sign and a question
for (const [sid, D] of Object.entries(DEEP)) {
  if (!SYSTEMS.find((x) => x.id === sid)) err(`deep ${sid}: unknown system`);
  D.steps.forEach((st, i) => { checkItem(st, `deep.${sid}.steps[${i}]`); if (!['rich', 'poor', 'swap'].includes(st.oxy)) err(`deep.${sid}.steps[${i}]: oxy`); });
  D.organs.forEach((o, i) => checkItem(o, `deep.${sid}.organs[${i}]`));
  for (const dz of D.diseases) {
    const w = `deep.${sid}.${dz.id}`;
    dz.items.forEach((it, i) => checkItem(it, `${w}.items[${i}]`));
    if (!dz.items.some((it) => it.layer === 'known')) err(`${w}: needs a known item`);
    const a = dz.action;
    if (!SOURCES[a.source_id]) err(`${w}.action: missing source`);
    if (a.urgency === 'emergency' && !a.go_he.includes('101')) err(`${w}.action: emergency must point to 101`);
    if (!a.question_he.endsWith('?')) err(`${w}.action: question must end with ?`);
    if (dz.bridge) checkItem(dz.bridge, `${w}.bridge`);
  }
  if (!SOURCES[D.museum.quote_source]) err(`deep.${sid}.museum: quote without source`);
  walkKeys(D, `deep.${sid}`);
}

// Diseases (stage 4): one list, every disease complete and in a known system
const dzIds = new Set();
for (const dz of DISEASES) {
  const w = `disease.${dz.id}`;
  if (dzIds.has(dz.id)) err(`${w}: duplicate id`);
  dzIds.add(dz.id);
  if (!SYSTEMS.find((x) => x.id === dz.system)) err(`${w}: unknown system ${dz.system}`);
  if (!dz.name_he || !dz.name_en || !dz.insight) err(`${w}: needs name_he, name_en and insight`);
  dz.items.forEach((it, i) => checkItem(it, `${w}.items[${i}]`));
  if (!dz.items.some((it) => it.layer === 'known')) err(`${w}: needs a known item`);
  const a = dz.action;
  if (!SOURCES[a.source_id]) err(`${w}.action: missing source`);
  if (!['emergency', 'doctor'].includes(a.urgency)) err(`${w}.action: urgency`);
  if (a.urgency === 'emergency' && !a.go_he.includes('101')) err(`${w}.action: emergency must point to 101`);
  if (!a.question_he.endsWith('?')) err(`${w}.action: question must end with ?`);
  if (dz.bridge) checkItem(dz.bridge, `${w}.bridge`);
  walkKeys(dz, w);
}
if (DISEASES.length < 20) err(`diseases: ${DISEASES.length} of 20 (ROADMAP stage 4)`);
for (const [gid, g] of Object.entries(GROUPS)) {
  g.ids.forEach((id) => { if (!dzIds.has(id)) err(`group ${gid}: unknown disease ${id}`); });
  g.items.forEach((it, i) => checkItem(it, `group.${gid}.items[${i}]`));
}
const ob = DISEASES.find((x) => x.id === 'obesity');
if (ob && !ob.action.go_he.includes('1201')) err('disease obesity: must offer ERAN 1201 for distress about food and body');
const dep = DISEASES.find((x) => x.id === 'depression');
if (!dep || !dep.action.go_he.includes('1201')) err('disease depression: must point to ERAN 1201');

// Timeline and traditions (stage 5): every moment carries a layer and a source, in time order
TIMELINE.forEach((e, i) => {
  checkItem(e, `timeline.${e.id}`);
  if (!e.place_he || !e.place_en || !e.person_he || !e.person_en) err(`timeline.${e.id}: Hebrew and Latin names for person and place`);
  if (typeof e.lat !== 'number' || typeof e.lon !== 'number') err(`timeline.${e.id}: coordinates`);
  if (i && TIMELINE[i - 1].year > e.year) err(`timeline.${e.id}: out of time order`);
  if (e.system && !SYSTEMS.find((x) => x.id === e.system)) err(`timeline.${e.id}: unknown system`);
  if (e.disease && !DISEASES.find((x) => x.id === e.disease)) err(`timeline.${e.id}: unknown disease`);
});
for (const t of TRADITIONS) {
  if (!SOURCES[t.source_id]) err(`tradition ${t.id}: source missing`);
  if (!LAYERS[t.layer]) err(`tradition ${t.id}: layer`);
  if (!t.disease_he || !t.look_he || !t.act_he) err(`tradition ${t.id}: the three fields`);
  if (t.warn_source && !SOURCES[t.warn_source]) err(`tradition ${t.id}: warning source missing`);
}

// Home (on one foot): seven lines, each with a real destination; sources exist
if (HOME.lines.length !== 7) err(`home: ${HOME.lines.length} lines, expected 7`);
HOME.lines.forEach((l, i) => {
  if (l.source_id && !SOURCES[l.source_id]) err(`home.lines[${i}]: source missing`);
  if (l.go.d && !DISEASES.find((x) => x.id === l.go.d)) err(`home.lines[${i}]: unknown disease`);
  if (/כללי אצבע|כלל אצבע/.test(l.text_he)) err(`home.lines[${i}]: the lines act, they do not announce themselves`);
});
if (!SOURCES[HOME.hillel_source]) err('home: Hillel quote without source');

// Bridge to the nutrition app: every nutrition link resolves to a live address
const bridges = [...SYSTEMS.map((x) => x.bridge), ...DISEASES.map((x) => x.bridge), ...REDLIST.map((r) => r.bridge && { link: r.bridge })].filter(Boolean);
for (const b of bridges) {
  if (b.link?.app === 'nutrition' && !nutritionHref(b.link)) err(`bridge ${JSON.stringify(b.link)}: no address in the nutrition app`);
}

// Red list (SAFETY.md section 4): scientific name, risk, source, review date
for (const r of REDLIST) {
  if (!r.name_he || !r.name_la || !r.risk_he) err(`redlist ${r.id}: needs name_he, name_la and risk_he`);
  if (!r.sources?.length) err(`redlist ${r.id}: needs at least one source`);
  r.sources?.forEach((id) => { if (!SOURCES[id]) err(`redlist ${r.id}: source "${id}" not in SOURCES`); });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.last_reviewed || '')) err(`redlist ${r.id}: last_reviewed must be YYYY-MM-DD`);
  walkKeys(r, r.id);
}
for (const id of ['teucrium-polium', 'aristolochia', 'rasa-shastra', 'turmeric-supplements']) {
  if (!REDLIST.find((r) => r.id === id)) err(`redlist: ${id} from SAFETY.md is missing`);
}

// Keywords (SAFETY.md sections 2 and 3): every phrase must be detected, and lead to the right number
const MUST = {
  'קוצר נשימה': ['breath', '101'], 'התנפחות': ['swelling', '101'], 'כאב בחזה': ['chest', '101'],
  'הרעלה': ['poison', '04-7771900'], 'בליעה אצל ילד': ['child-swallow', '101'], 'מחשבות אובדניות': ['suicide', '1201'],
  'הפסקתי לקחת את התרופה': ['med-stop', '101'], 'פנים שמוטות': ['stroke', '101'],
};
for (const [phrase, [id, num]] of Object.entries(MUST)) {
  const hits = detect(phrase, KEYWORDS);
  if (hits[0]?.id !== id) err(`keyword "${phrase}": expected ${id} first, got ${hits.map((h) => h.id).join(',') || 'nothing'}`);
  const nums = hits.flatMap((h) => h.calls.map((c) => EMERGENCY_NUMBERS[c]?.num));
  if (!nums.includes(num)) err(`keyword "${phrase}": number ${num} missing`);
}
for (const k of KEYWORDS) {
  k.calls.forEach((c) => { if (!EMERGENCY_NUMBERS[c]) err(`keyword ${k.id}: unknown call ${c}`); });
  if (k.system && !SYSTEMS.find((s) => s.id === k.system)) err(`keyword ${k.id}: unknown system ${k.system}`);
}
if (KEYWORDS.find((k) => k.id === 'med-stop')?.plants !== false) err('keyword med-stop must stop plant content (plants:false)');
if (detect('תאוריה של אור', KEYWORDS).length || detect('הלב שלי', KEYWORDS).length) err('keywords: false positive on neutral text');
for (const i of PROFILE_ITEMS) if (BANNED_KEYS.test(i.id)) err(`profile item ${i.id}: banned field`);

// Forbidden words in all user-facing text
const files = ['js/data.js', 'index.html', 'js/app.js', 'js/match.js', 'js/circulation.js', 'js/atlas3d.js', 'js/history.js'];
for (const f of files) {
  let text = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
  for (const p of ALLOWED_PHRASES) text = text.split(p).join('');
  for (const w of FORBIDDEN) if (text.includes(w)) err(`${f}: forbidden word "${w}"`);
}

// Discovery layer: every wonder has a source and an open question; every image is a real file; every flag is a known country.
for (const s of SYSTEMS) {
  const w = WONDERS[s.id];
  if (!w) { err(`wonder: ${s.id} missing`); continue; }
  if (!SOURCES[w.source_id]) err(`wonder ${s.id}: source "${w.source_id}" missing`);
  if (!/\?$/.test(w.open_q_he || '')) err(`wonder ${s.id}: open question must end with "?"`);
  if (w.image && !IMAGES[w.image]) err(`wonder ${s.id}: image "${w.image}" not in IMAGES`);
}
for (const [id, im] of Object.entries(IMAGES)) {
  const f = new URL('../' + im.src, import.meta.url);
  if (!existsSync(f) || statSync(f).size < 10000) err(`image ${id}: file ${im.src} missing or broken`);
  if (!/^https:\/\/commons\.wikimedia\.org\//.test(im.page) || !(im.year < 1900)) err(`image ${id}: needs a Commons page and a public-domain year`);
}
for (const e of TIMELINE) {
  if (e.cc && !COUNTRIES[e.cc]) err(`timeline ${e.id}: unknown country ${e.cc}`);
  if (e.image && !IMAGES[e.image]) err(`timeline ${e.id}: image "${e.image}" not in IMAGES`);
}
for (const t of TRADITIONS) for (const cc of t.flags || []) if (!COUNTRIES[cc]) err(`tradition ${t.id}: unknown country ${cc}`);

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
if (!html.includes('לא מאבחנת ולא מטפלת')) err('index.html: declaration missing from the first screen');
if (!/<html[^>]+dir="rtl"/.test(html)) err('index.html: dir="rtl" missing at root');
for (const n of ['101', '1201']) if (!html.includes(`tel:${n}`)) err(`index.html: emergency number ${n} missing`);

if (errors.length) {
  console.error(errors.map((e) => `FAIL  ${e}`).join('\n'));
  console.error(`\n${errors.length} safety errors`);
  process.exit(1);
}
const counts = SYSTEMS.reduce((n, s) => n + 1 + s.failure.length + 1, 0);
console.log(`SAFETY GREEN  ${SYSTEMS.length} systems, ${DISEASES.length} diseases, ${counts} items, ${REDLIST.length} red list, ${KEYWORDS.length} keyword groups, ${Object.keys(SOURCES).length} sources, 0 forbidden words`);
