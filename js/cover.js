// The cover (כריכה): where the logo and the app name lead. It speaks to feeling: it moves, brands and shares.
// The frame is the shared <app-cover> (AppOfApp-GH/public/cover.js), the same frame in every app.
// Refua's own part is the art: Vesalius's atlas of transparencies (1543). The nine systems are laid on the
// body one by one, each with the number that makes it a wonder, until the whole city of networks is lit.
import { SYSTEMS, DISEASES, TIMELINE, SOURCES, WONDERS } from './data.js';
import { coverSVG } from './body.js';

const STEP = 2600; // one transparency every 2.6 seconds, then the whole body for one more beat
const plain = (t) => String(t || '').replace(/\*\*|==/g, '');

function art() {
  return `<div class="cover-art" slot="art" role="img" aria-label="אטלס של שקפים: ${SYSTEMS.length} מערכות הגוף מונחות זו על זו, עד שהגוף כולו מואר כעיר של רשתות.">
    ${coverSVG(SYSTEMS)}
    <div class="cv-plate" aria-hidden="true">
      <p class="cv-count num"></p>
      <p class="cv-name"></p>
      <p class="cv-big"><span class="num cv-n"></span> <span class="cv-unit"></span></p>
      <p class="cv-line"></p>
      <p class="cv-src"></p>
    </div>
    <p class="cv-tag" aria-hidden="true">שקף על שקף · De humani corporis fabrica, 1543</p>
  </div>`;
}

function animate(host) {
  const el = host.querySelector('.cover-art');
  if (!el) return () => {};
  const $ = (s) => el.querySelector(s);
  const show = (i) => {
    const all = i >= SYSTEMS.length;
    el.classList.toggle('cv-all', all);
    el.querySelectorAll('.cv-sys').forEach((g, j) => {
      g.classList.toggle('on', all || j === i);
      g.classList.toggle('past', !all && j < i);
    });
    if (all) {
      $('.cv-count').textContent = `${SYSTEMS.length} שקפים`;
      $('.cv-name').textContent = 'עיר של רשתות';
      $('.cv-n').textContent = String(TIMELINE.length);
      $('.cv-unit').textContent = 'גילויים';
      $('.cv-line').textContent = 'וכל רשת היא גילוי';
      $('.cv-src').textContent = '';
      return;
    }
    const s = SYSTEMS[i], w = WONDERS[s.id] || {};
    $('.cv-count').textContent = `${i + 1} / ${SYSTEMS.length}`;
    $('.cv-name').textContent = s.name_he;
    $('.cv-n').textContent = w.big || '';
    $('.cv-unit').textContent = w.unit_he || '';
    $('.cv-line').textContent = plain(w.line_he);
    $('.cv-src').textContent = w.source_id && SOURCES[w.source_id] ? SOURCES[w.source_id].title : '';
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { show(SYSTEMS.length); return () => {}; }
  let i = 0;
  show(0);
  const t = setInterval(() => { i = (i + 1) % (SYSTEMS.length + 2); show(Math.min(i, SYSTEMS.length)); }, STEP);
  return () => clearInterval(t);
}

const CONFIG = {
  name: 'רפואה',
  subtitle: 'גוף, מחלה, בריאות',
  kicker: ['ארון פלאות', 'אטלס של שקפים'],
  haiku: ['שקף על שקף', 'הרשתות נדלקות', 'הגוף נקרא'],
  vision: '**הגוף כעיר של רשתות.** לקרוא את גוף האדם כאטלס של גילויים: מה ידוע, מה נאמר, ובמה רק מאמינים.',
  goal: `**להבין מערכות, לא לאבחן:** ${SYSTEMS.length} מערכות, ${DISEASES.length} מחלות ו-${TIMELINE.length} גילויים, וכל משפט עם מקור ושכבה.`,
  open: { label: 'פתיחה', href: '#v=intro' },
  video: {
    src: 'https://ktqmwpbzcnzkhjskqisy.supabase.co/storage/v1/object/public/aoa-media/app-1793620800000/demo-1794559405207.mp4',
    poster: 'https://ktqmwpbzcnzkhjskqisy.supabase.co/storage/v1/object/public/aoa-media/app-1793620800000/demo-poster-1794559405207.jpg',
  },
  share: { title: 'רפואה: גוף, מחלה, בריאות', text: 'הגוף כעיר של רשתות: אטלס של גילויים, מה ידוע, מה נאמר, ובמה רק מאמינים.' },
  credit: 'בהשראת אנדראס וסאליוס, De humani corporis fabrica, 1543. לא מאבחנת ולא מטפלת.',
  palette: { ink: '#16202b', paper: '#ffffff', accent: '#1f4e79', marker: '#fff0a0' },
};

let stop = () => {};
export function mountCover(host) {
  if (!host.firstChild) host.innerHTML = `<app-cover>${art()}</app-cover>`;
  const el = host.querySelector('app-cover');
  // The content is set only after the element is defined, or the property hides its setter.
  customElements.whenDefined('app-cover').then(() => { if (!el.config) el.config = CONFIG; });
  stop();
  stop = animate(host);
}
export function unmountCover() { stop(); stop = () => {}; }
