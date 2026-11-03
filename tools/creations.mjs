// מפיק את creations.json מתוך הנתונים של האפליקציה (תקן "יצירות", AppOfApp-GH/docs/creations-standard.md).
// הרצה: node tools/creations.mjs
// כל טקסט נלקח מ-js/data.js (או מהמוזיאון שב-js/app.js), עם המקור שלו. שום עובדה לא נכתבת כאן מחדש.
// אחרי הרצה: מייצאים את היצירות לתמונות (ראו CLAUDE.md, יומן 03.11.2026).
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { SYSTEMS, SOURCES, LAYERS, DEEP, DISEASES, TIMELINE, TRADITIONS, HOME, IMAGES, WONDERS } from '../js/data.js';

const sys = (id) => SYSTEMS.find((x) => x.id === id);
const ev = (id) => TIMELINE.find((x) => x.id === id);
const dz = (id) => DISEASES.find((x) => x.id === id);
const said = (sid) => sys(sid).failure.find((f) => f.layer === 'said');
const plain = (s) => s.replace(/==/g, '');
const src = (id) => `${SOURCES[id].title}, ${SOURCES[id].year}`;
const img = (id) => IMAGES[id].src;
const credit = (id) => { const i = IMAGES[id]; return `${i.title_he} · ${i.by_he}, ${i.year}. נחלת הכלל, ויקישיתוף`; };
// הארווי והמוזיאון של ציר הזמן (js/app.js): הטקסטים שמוצגים במסך עצמו
const SNOW_HAIKU = ['משאבת לונדון', 'ידית יורדת לאט', 'העיר נושמת'];
const SNOW_HAIKU_NOTE = 'מפה אחת וידית אחת: כך נולדה האפידמיולוגיה.';
const RAMBAM = 'הואיל והיות הגוף בריא ושלם מדרכי השם הוא.';
const WHO_DEF = 'בריאות היא מצב של רווחה גופנית, נפשית וחברתית מלאה, ולא רק היעדר מחלה או מום.';
const TAGS = ['רפואה', 'גוף_האדם'];

const cardio = DEEP.cardio;
const hyp = dz('hypertension');
const topics = [
  {
    id: 'harvey', zone: 'ידע', title: 'הארווי: הדם חוזר במעגל',
    sub: ev('harvey').text_he,
    creations: [
      { id: 'quote', style: 'quote', quote: cardio.museum.quote_he, who: 'ויליאם הארווי (William Harvey)', cite: src('harvey-1628'), kicker: 'על תנועת הלב, 1628' },
      { id: 'fromto', style: 'fromto', title: 'מנהר שנגמר אל מעגל', fromLabel: 'נאמר · גלנוס, כ-170', toLabel: 'ידוע · הארווי, 1628', from: ev('galen').text_he.split('.')[0] + '.', to: ev('harvey').text_he, text: cardio.organs.find((o) => o.name_he === 'הגילוי').text_he, kicker: 'מקור: ' + src('harvey-1628') },
      { id: 'insight', style: 'insight', title: plain(cardio.insight), text: cardio.insight_note, kicker: 'מחזור הדם · ' + src('guyton-2020') },
      { id: 'haiku', style: 'haiku', lines: cardio.museum.haiku, text: cardio.museum.haiku_note, kicker: 'הייקו · מחזור הדם' },
      { id: 'essay', style: 'essay', title: 'מחזור הדם בשמונה שלבים', text: sys('cardio').role.text_he, image: img('harvey-veins'), credit: credit('harvey-veins'), body: [0, 2, 4, 6].map((i) => `${cardio.steps[i].text_he} ${cardio.steps[i + 1].text_he}`), kicker: 'מקור: ' + src('guyton-2020') },
    ],
  },
  {
    id: 'vesalius', zone: 'ידע', title: 'וסאליוס: הגוף כאטלס',
    sub: ev('vesalius').text_he,
    creations: [
      { id: 'poster', style: 'poster', title: 'על מבנה גוף האדם, **1543**', text: ev('vesalius').text_he, image: img('vesalius-fabrica'), pos: 'center 30%', credit: credit('vesalius-fabrica'), kicker: 'אנדראס וסאליוס (Andreas Vesalius), פדובה' },
      { id: 'fromto', style: 'fromto', title: 'מבעלי חיים אל גוף האדם', fromLabel: 'נאמר · גלנוס', toLabel: 'ידוע · וסאליוס, 1543', from: 'לסת תחתונה **משתי עצמות**, לפי ניתוח בעלי חיים.', to: 'באדם הלסת התחתונה היא **עצם אחת**.', text: ev('vesalius').text_he.split('.')[0] + '.', kicker: 'מקור: ' + src('vesalius-1543') },
      { id: 'gradient', style: 'gradient', title: `**${WONDERS.skeletal.big}** ${WONDERS.skeletal.unit_he}`, text: WONDERS.skeletal.line_he + '.', kicker: 'מקור: ' + src(WONDERS.skeletal.source_id) },
      { id: 'insight', style: 'insight', title: 'החומר זורם, הצורה נשארת', text: 'השאלה שעוד פתוחה: ' + WONDERS.skeletal.open_q_he, kicker: 'השלד והשרירים' },
      { id: 'post', style: 'post', title: 'וסאליוס, פדובה, **1543**', text: [ev('vesalius').text_he.split('.')[0] + '.', 'גלנוס תיאר לסת משתי עצמות.', 'וסאליוס הראה: באדם זו **עצם אחת**.', sys('skeletal').role.text_he], tags: [...TAGS, 'וסאליוס'], kicker: 'מקור: ' + src('vesalius-1543') },
    ],
  },
  {
    id: 'immune', zone: 'ידע', title: 'הזיכרון שמאחורי כל חיסון',
    sub: sys('immune').role.text_he,
    creations: [
      { id: 'gradient', style: 'gradient', title: '**3.5** עד **5** ' + WONDERS.immune.unit_he, text: WONDERS.immune.line_he + '.', kicker: 'מקור: ' + src('who-immunization') },
      { id: 'insight', style: 'insight', title: plain(sys('immune').insight), text: 'השאלה שעוד פתוחה: ' + WONDERS.immune.open_q_he, kicker: 'מערכת החיסון' },
      { id: 'fromto', style: 'fromto', title: 'מחיסון ראשון למחלה שנמחקה', fromLabel: 'ג׳נר, ברקלי, 1796', toLabel: 'WHO, ז׳נבה, 1980', from: ev('jenner').text_he, to: ev('smallpox').text_he, text: 'בין שתי הנקודות: **184** שנים.', kicker: 'מקורות: ' + src('porter-1997') + '; ' + src('who-smallpox') },
      { id: 'post', style: 'post', title: 'זיכרון של פולשים', text: [sys('immune').role.text_he.split('.')[0] + '.', '**1796**: ' + ev('jenner').text_he, '**1980**: ' + ev('smallpox').text_he.split(':')[0] + '.'], tags: [...TAGS, 'חיסון'], kicker: 'מקור: ' + src('who-immunization') },
    ],
  },
  {
    id: 'city', zone: 'הבנה', title: 'הגוף כעיר של רשתות',
    sub: HOME.one_foot_more.split('\n')[0],
    creations: [
      { id: 'insight', style: 'insight', title: plain(HOME.one_foot), text: HOME.one_foot_more.split('\n')[0], kicker: 'על רגל אחת' },
      { id: 'essay', style: 'essay', title: 'שבע רשתות, עיר אחת', text: HOME.lines[1].text_he, body: [['nervous', 'respiratory'], ['cardio', 'digestive'], ['skeletal', 'immune'], ['reproductive']].map((ids) => ids.map((id) => `**${sys(id).short_he || sys(id).name_he}:** ${sys(id).city}`).join(' ')), kicker: 'מפת הגוף' },
      { id: 'gradient', style: 'gradient', title: plain(sys('digestive').insight), text: sys('digestive').city, kicker: 'מקור: ' + src('sender-2016') },
      { id: 'quote', style: 'quote', quote: HOME.hillel_tr, who: 'הלל הזקן', cite: SOURCES[HOME.hillel_source].title, kicker: 'על רגל אחת' },
      { id: 'haiku', style: 'haiku', lines: HOME.haiku, text: HOME.haiku_note, kicker: 'הייקו · דף הבית' },
    ],
  },
  {
    id: 'layers', zone: 'הבנה', title: 'ידוע, נאמר, מאמינים',
    sub: 'כל משפט באפליקציה מסומן בשכבה אחת. כך מסורת נבדקת מול ראיה.',
    creations: [
      { id: 'post', style: 'post', title: 'שלוש שכבות לכל משפט', text: Object.values(LAYERS).map((l) => `**${l.he}:** ${l.def}`), tags: [...TAGS, 'מקורות'], kicker: 'מקרא השכבות' },
      { id: 'insight', style: 'insight', title: 'מסורת היא השערה שמחכה לבדיקה', text: 'חלקן אוששו, חלקן הופרכו. ארבע מסורות, באותו פורמט.', kicker: 'ארבע מסורות' },
      { id: 'fromto', style: 'fromto', title: 'ממה נגרמת מחלה', fromLabel: 'נאמר · רפואה יוונית', toLabel: 'ידוע · רפואה מודרנית', from: TRADITIONS.find((t) => t.id === 'greek').disease_he, to: TRADITIONS.find((t) => t.id === 'modern').disease_he, text: 'היפוקרטס, קוס: ' + ev('hippocrates').text_he.split('.')[0] + '.', kicker: 'מקור: ' + src('porter-1997') },
      { id: 'essay', style: 'essay', title: 'ארבע מסורות, שאלה אחת', text: 'מהי מחלה? ארבע תשובות, ובכל אחת גם איך מתבוננים.', body: TRADITIONS.map((t) => `**${t.name_he}** (${t.era_he}): ${t.disease_he} ${t.look_he}`), kicker: 'מקורות: ' + src('porter-1997') + '; ' + src('rambam-deot') },
      { id: 'quote', style: 'quote', quote: RAMBAM, who: 'הרמב״ם', cite: 'משנה תורה, הלכות דעות ד, א', kicker: 'מסורת · ' + SOURCES['rambam-deot'].year },
    ],
  },
  {
    id: 'pressure', zone: 'יישום', title: 'לחץ הדם: מודדים, לא מנחשים',
    sub: hyp.items[1].text_he,
    creations: [
      { id: 'gradient', style: 'gradient', title: plain(hyp.insight), text: hyp.items[0].text_he, kicker: 'מקור: ' + src('who-hypertension') },
      { id: 'fromto', style: 'fromto', title: 'מתחושה אל מדידה', fromLabel: 'מאמינים · לא אוששה', toLabel: 'ידוע · WHO', from: hyp.items.find((i) => i.layer === 'believed').text_he, to: hyp.action.sign_he + '.', text: hyp.items[1].text_he, kicker: 'מקור: ' + src('who-hypertension') },
      { id: 'insight', style: 'insight', title: 'רק מדידה מגלה אותו', text: `מחר בבוקר: ${hyp.action.go_he}.`, kicker: 'יתר לחץ דם' },
      { id: 'post', style: 'post', title: 'שאלה אחת לרופא', text: [hyp.action.question_he, `איפה: ${hyp.action.go_he}.`, hyp.bridge.text_he], tags: [...TAGS, 'לחץ_דם'], kicker: 'מקורות: ' + src('who-hypertension') + '; ' + src('dash-2001') },
    ],
  },
  {
    id: 'pump', zone: 'יישום', title: 'משאבה אחת ברחוב ברוד',
    sub: sys('immune').bridge.text_he,
    creations: [
      { id: 'veil', style: 'veil', title: 'מפה אחת, משאבה אחת', text: ev('snow').text_he, image: img('snow-cholera-map'), credit: credit('snow-cholera-map'), kicker: 'ג׳ון סנואו (John Snow), לונדון, 1854' },
      { id: 'haiku', style: 'haiku', lines: SNOW_HAIKU, text: SNOW_HAIKU_NOTE, kicker: 'הייקו · ציר הזמן' },
      { id: 'fromto', style: 'fromto', title: 'מאוויר רע אל חיידק', fromLabel: 'נאמר · תורת המיאזמה', toLabel: 'ידוע · קוך, ברלין, 1882', from: said('immune').text_he, to: ev('koch').text_he, text: 'זמלווייס, וינה, **1847**: ' + ev('semmelweis').text_he.split('.')[0] + '.', kicker: 'מקור: ' + src('porter-1997') },
      { id: 'post', style: 'post', title: 'האוויר ברחוב שלי', text: [plain(sys('respiratory').insight), sys('respiratory').bridge.text_he, `השאלה למחר בבוקר: ${sys('respiratory').bridge.next_he}.`], image: img('snow-cholera-map'), credit: credit('snow-cholera-map'), tags: [...TAGS, 'עיר_בריאה'], kicker: 'מקור: ' + src('who-aqg-2021') },
      { id: 'quote', style: 'quote', quote: WHO_DEF, who: 'ארגון הבריאות העולמי (WHO)', cite: src('who-constitution'), kicker: 'חוקת WHO' },
    ],
  },
];

// פוסט: שורות ב-\n
for (const t of topics) for (const c of t.creations) if (Array.isArray(c.text)) c.text = c.text.join('\n');

// בדיקת זיקוק: כותרת עד 8 מילים, הסבר עד 20, פוסט עד 6 שורות, הייקו 3 שורות, מאמר 3 עד 5 פסקאות, בלי עיצוב חוזר בחדר
const words = (s) => (s || '').replace(/\*\*|==/g, '').split(/\s+/).filter(Boolean).length;
const warn = [];
for (const t of topics) {
  const seen = new Set();
  if (words(t.title) > 8) warn.push(`${t.id}: כותרת החדר ארוכה`);
  for (const c of t.creations) {
    const k = `${t.id}/${c.id}`;
    if (seen.has(c.style)) warn.push(`${k}: עיצוב חוזר בחדר`);
    seen.add(c.style);
    if (c.title && words(c.title) > 8) warn.push(`${k}: כותרת של ${words(c.title)} מילים`);
    if (c.style === 'post' && c.text.split('\n').length > 6) warn.push(`${k}: פוסט ארוך`);
    if (c.style === 'haiku' && c.lines.length !== 3) warn.push(`${k}: הייקו בלי שלוש שורות`);
    if (c.style === 'essay' && (c.body.length < 3 || c.body.length > 5)) warn.push(`${k}: מספר פסקאות`);
    if (['insight', 'gradient', 'poster', 'veil'].includes(c.style) && words(c.text) > 20) warn.push(`${k}: הסבר של ${words(c.text)} מילים`);
  }
}
if (new Set(['ידע', 'הבנה', 'יישום'].filter((z) => topics.some((t) => t.zone === z))).size < 3) warn.push('חסר שלב');
if (new Set(topics.flatMap((t) => t.creations.map((c) => c.style))).size < 7) warn.push('פחות משבעה עיצובים');

// שומרים את קובצי התמונה ואת חדר התערוכה מהריצה הקודמת
const out = new URL('../creations.json', import.meta.url);
const prev = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : null;
for (const t of topics) {
  const pt = prev?.topics?.find((x) => x.id === t.id);
  if (pt?.room) t.room = pt.room;
  for (const c of t.creations) { const pc = pt?.creations?.find((x) => x.id === c.id); if (pc?.png) c.png = pc.png; }
}
const data = {
  app: {
    id: 'refua', name: 'רפואה', url: 'https://refua-gh.vercel.app', repo: 'Anat1969/Refua-GH',
    palette: { a: '#1f4e79', b: '#5b7f3a', c: '#737373', s: '#1f4e79', accent: '#1f4e79', marker: '#fff0a0', paper: '#ffffff', paper2: '#f6f1e7', ink: '#16202b', 'b-wash': '#eef3e8', 's-wash': '#e9eff6', serif: '"Frank Ruhl Libre", serif' },
  },
  topics,
};
writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
console.log(`${topics.length} חדרים, ${topics.reduce((n, t) => n + t.creations.length, 0)} יצירות, ${new Set(topics.flatMap((t) => t.creations.map((c) => c.style))).size} עיצובים`);
if (warn.length) { console.error(warn.join('\n')); process.exit(1); }
