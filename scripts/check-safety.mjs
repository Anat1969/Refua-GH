// Safety gate (docs/SAFETY.md, docs/CONTENT_RULES.md). Exit 1 blocks merge.
// Run: node scripts/check-safety.mjs
import { readFileSync } from 'node:fs';
import { SYSTEMS, SOURCES, LAYERS } from '../js/data.js';

const errors = [];
const err = (m) => errors.push(m);

const FORBIDDEN = [
  'מרפא', 'מרפאת', 'מנקה רעלים', 'מאזן הורמונים', 'מחזק חיסון', 'מוריד לחץ דם', 'מוריד סוכר',
  'עוצמתי', 'מטפל', 'מבריא', 'מבטיח',
  // medicine additions
  'מינון', 'מ"ג', 'תרופה ל', 'מאבחן', 'ריפוי מלא', 'טבעי ובטוח', 'ללא תופעות לוואי',
];
// The declaration is the one place these words appear, negated, by design.
const ALLOWED_PHRASES = ['לא מאבחנת ולא מטפלת', 'לא מאבחן ולא מטפל'];
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

// Forbidden words in all user-facing text
const files = ['js/data.js', 'index.html', 'js/app.js'];
for (const f of files) {
  let text = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
  for (const p of ALLOWED_PHRASES) text = text.split(p).join('');
  for (const w of FORBIDDEN) if (text.includes(w)) err(`${f}: forbidden word "${w}"`);
}

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
console.log(`SAFETY GREEN  ${SYSTEMS.length} systems, ${counts} items, ${Object.keys(SOURCES).length} sources, 0 forbidden words`);
