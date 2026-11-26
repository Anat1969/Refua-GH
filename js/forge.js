// מנוע התוצרים: בלחיצה, תוצר מלא (כתבה, מאמר, מסה או יצירה) מתוך האטלס בלבד.
// בלי בינה מלאכותית, בלי תשלום ובלי רשת. התבנית היא מנגנון החשיבה של הסוג (הסקיל anat-outputs),
// והתוכן הוא הנתונים: כל "עובדה" היא פריט "ידוע" מ-js/data.js עם המקור שלו. "נאמר" הוא פרשנות של מסורת,
// "מאמינים" הוא השערה שלא אוששה, ומה שהמנוע מנסח בעצמו מסומן פרשנות, השערה או דמיון.
import { SYSTEMS, DISEASES, TIMELINE, WONDERS } from './data.js';

const plain = (t) => String(t || '').replace(/\*\*|==/g, '');
const rot = (xs, k) => (xs.length ? xs.map((_, i) => xs[(i + k) % xs.length]) : xs);
const sysById = Object.fromEntries(SYSTEMS.map((s) => [s.id, s]));
const disById = Object.fromEntries(DISEASES.map((d) => [d.id, d]));

/** הנושאים שאפשר לכתוב עליהם: כל מערכת וכל מחלה */
export const TOPICS = [
  ...SYSTEMS.map((s) => ({ id: `s:${s.id}`, name: s.name_he, group: 'מערכות' })),
  ...DISEASES.map((d) => ({ id: `d:${d.id}`, name: d.name_he, group: 'מחלות' })),
];
export const topicName = (id) => TOPICS.find((t) => t.id === id)?.name || '';

/** החומר של נושא: פריטים לפי שכבה, רגע בציר הזמן, פלא, גשר ושאלה פתוחה */
function material(topic, seed) {
  const [k, id] = topic.split(':');
  const dis = k === 'd' ? disById[id] : null;
  const sys = k === 's' ? sysById[id] : sysById[dis?.system];
  const ref = `${k}:${id}`;
  const items = dis ? dis.items : [sys.role, ...sys.failure];
  const known = rot(items.filter((i) => i.layer === 'known'), seed);
  const said = items.filter((i) => i.layer === 'said');
  const believed = items.filter((i) => i.layer === 'believed');
  const events = rot(TIMELINE.filter((e) => (dis ? e.disease === id : false) || e.system === sys.id), seed);
  const w = WONDERS[sys.id] || {};
  const bridge = (dis || sys).bridge;
  return {
    ref, name: dis ? dis.name_he : sys.name_he, sys, dis, known, said, believed, events, w, bridge,
    insight: plain((dis || sys).insight),
    city: sys.city,
    open: dis ? `מה עוד לא ידוע על ${dis.name_he}, ואיזו ראיה הייתה משנה את מה שאנחנו יודעים?` : (w.open_q_he || ''),
  };
}

const fact = (i, ref, h) => ({ h, level: 'fact', text: plain(i.text_he), refs: [ref, `src:${i.source_id}`] });
const told = (i, ref, h) => ({ h, level: 'interpretation', text: `לפי ${i.tradition}: ${plain(i.text_he)}`, refs: [ref, `src:${i.source_id}`] });
const doubt = (i, h) => ({ h, level: 'hypothesis', text: `יש מי שמאמינים ש${plain(i.text_he).replace(/\.$/, '')} (${i.status}).` });
const moment = (e, h) => ({ h, level: 'fact', text: `${e.year_he}, ${e.place_he}: ${e.person_he}. ${plain(e.text_he)}`, refs: [`e:${e.id}`, `src:${e.source_id}`] });

function story(m) {
  const blocks = [];
  if (m.events[0]) blocks.push(moment(m.events[0], 'הרגע'));
  m.known.slice(0, m.events[0] ? 2 : 3).forEach((i, n) => blocks.push(fact(i, m.ref, n === 0 ? 'מה ידוע היום' : undefined)));
  if (m.events[1]) blocks.push(moment(m.events[1], 'ומה בא אחר כך'));
  if (m.said[0]) blocks.push(told(m.said[0], m.ref, 'מה אמרה המסורת'));
  // מחלה בלי רגע בציר הזמן: ההקשר הוא המערכת שבה היא חיה, והגשר למזון
  if (m.dis && blocks.length < 4) blocks.push(fact(m.sys.role, `s:${m.sys.id}`, `ההקשר: ${m.sys.name_he}`));
  if (blocks.length < 4 && m.bridge && m.bridge.layer === 'known') blocks.push(fact(m.bridge, m.ref, 'והגשר למזון'));
  blocks.push({ h: 'התובנה', level: 'interpretation', text: m.insight });
  return { title: `${m.name}: ${m.insight.split(/,|\.(?!\d)/)[0]}`, lead: m.events[0] ? `מ${m.events[0].person_he}, ${m.events[0].year_he}, ועד מה שידוע היום.` : `מה ידוע על ${m.name}, ואיך הגענו לזה.`, blocks, question: m.open };
}

function paper(m) {
  const total = m.known.length + m.said.length + m.believed.length;
  const share = total ? m.known.length / total : 0;
  const certainty = share >= 0.7 ? 'established' : share >= 0.4 ? 'likely' : 'open';
  const blocks = [
    { h: 'השאלה', level: 'interpretation', text: `מה ידוע באמת על ${m.name}, ומה רק נאמר או שמאמינים בו?` },
    ...m.known.slice(0, 3).map((i, n) => fact(i, m.ref, n === 0 ? 'הראיות' : undefined)),
    ...m.said.slice(0, 1).map((i) => told(i, m.ref, 'מה נאמר')),
    ...m.believed.slice(0, 1).map((i) => doubt(i, 'מה לא אושש')),
    { h: 'מסקנה', level: 'interpretation', text: `מתוך ${total} טענות על ${m.name} באטלס, ${m.known.length} ידועות עם מקור, ${m.said.length} נאמרו במסורת, ו-${m.believed.length} לא אוששו.` },
    { h: 'גבולות', level: 'interpretation', text: 'המסקנה היא על הידע, ולא על אדם אחד. האפליקציה לא מאבחנת ולא מטפלת.' },
  ];
  return { title: `מה ידוע על ${m.name}?`, lead: 'ידוע, נאמר, או רק מאמינים: מה כל מקור תורם, וכמה אפשר לסמוך עליו.', blocks, question: m.open, certainty };
}

function essay(m) {
  const blocks = [
    { h: 'הנחה', level: 'interpretation', text: `ההנחה המקובלת: ${m.name} הוא עניין של איבר אחד, שבודקים לבדו.` },
    ...(m.known[0] ? [fact(m.known[0], m.ref, 'סדק')] : []),
    { h: 'מסע בין תחומים', level: 'interpretation', text: `האטלס קורא את הגוף כעיר. ${m.sys.name_he}: ${plain(m.city)} ברשת כזו, תקלה במקום אחד מורגשת רחוק ממנו.` },
    ...(m.bridge && m.bridge.layer === 'known' ? [{ ...fact(m.bridge, m.ref), h: 'והגשר למזון' }] : []),
    { h: 'ערעור', level: 'hypothesis', text: `אולי ${m.name} איננו תקלה במקום אחד, אלא בקשר בין הרשתות: בין מה שנכנס, מה שזורם ומה שמפנים.` },
    { h: 'שאלה חדשה', level: 'interpretation', text: m.open },
  ];
  return { title: `${m.name} כעיר`, lead: 'מה קורה להנחה כשמסתכלים על הגוף כרשת של רשתות.', blocks, question: m.open };
}

function creation(m) {
  const big = m.w.big ? `${m.w.big} ${m.w.unit_he || ''}`.trim() : '';
  const line = plain(m.w.line_he || '');
  const blocks = [
    ...(m.known[0] ? [fact(m.known[0], m.ref, 'הבסיס')] : []),
    { h: 'המהלך', level: 'interpretation', text: `מה אם ${m.name} היה כותב מכתב לעיר שהוא חי בה?` },
    { h: 'היצירה', level: 'imagination', text: `לעיר, שלום. כאן ${m.sys.name_he}.${big ? ` ${big}, ${line}: זו העבודה שלי, יום אחרי יום, בלי שאיש רואה.` : ''} אני ${plain(m.city).replace(/[.:].*$/, '')}.${m.dis ? ` לפעמים נכנס אליי אורח לא קרוא, ${m.name}. ${m.insight}` : ''} כשהכול עובד, אף אחד לא שואל עליי. תשאלי עליי לפני שמשהו נעצר. שלך, מתחת לעור.` },
    { h: 'מה היא מאירה', level: 'interpretation', text: 'המכתב הופך מערכת שקופה לשכנה. מה שלא רואים, קשה לשמור עליו.' },
    { h: 'לאן זה מוביל', level: 'hypothesis', text: m.open },
  ];
  return { title: m.dis ? `מכתב מ${m.sys.name_he}, על ${m.name}` : `מכתב מ${m.sys.name_he}`, lead: 'ניסוי מחשבתי: מערכת בגוף כותבת לעיר.', blocks, question: m.open, form: 'מכתב' };
}

const BUILD = { story, paper, essay, creation };
export const NEXT = { story: 'paper', paper: 'essay', essay: 'creation', creation: 'story' };

/** תוצר מלא בלחיצה. seed מסובב את החומר ("גרסה אחרת"). from: התוצר שממנו התפתח */
export function forge(kind, topic, seed = 0, from = null) {
  const m = material(topic, seed);
  const o = BUILD[kind](m);
  return { id: '', kind, topic, chain: topic, derivedFrom: from?.id || null, ...o, blocks: o.blocks.filter((b) => b.text && b.text.length > 1) };
}
