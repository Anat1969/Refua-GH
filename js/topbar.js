// The app's top bar, for the pages that live outside index.html (lab/records.html, lab/pathology.html).
// The same names and the same order as the nav in index.html, so the reader can always get anywhere from anywhere.
// Each page sets <base href="../">, or passes root, so the links lead back into the atlas.
export const NAV = [
  ['system', '#s=cardio', 'מפת הגוף', 'הגוף'],
  ['diseases', '#s=cardio&v=diseases', 'מחלות', 'מחלות'],
  ['records', 'lab/records.html', 'בדיקות', 'בדיקות'],
  ['history', '#s=cardio&v=history', 'גילויים', 'גילויים'],
  ['sources', '#s=cardio&v=sources', 'מקורות', 'מקורות'],
  ['creations', '#s=cardio&v=creations', 'יצירות', 'יצירות'],
];

const CSS = `
.tb { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 24px; padding: 8px 24px; background: #fff; border-bottom: 1px solid #e5e8ec; box-shadow: 0 6px 16px -14px rgba(22,32,43,.5); direction: rtl; font-family: 'IBM Plex Sans Hebrew', 'Segoe UI', Arial, sans-serif; }
.tb-brand { display: flex; align-items: baseline; gap: 8px; text-decoration: none; color: #16202b; flex: 0 0 auto; }
.tb-brand img { align-self: center; }
.tb-brand b { font-size: 22px; font-weight: 700; }
.tb-brand span { font-size: 13px; color: #4f5965; }
.tb-nav { display: flex; gap: 16px; flex: 1 1 auto; min-width: 0; }
.tb-nav a { text-decoration: none; padding: 6px 2px; font-size: 15px; color: #6b7480; text-shadow: 0 1px 0 #fff, 0 1px 3px rgba(22,32,43,.18); transition: transform .15s, color .15s; white-space: nowrap; }
.tb-nav a:hover { color: #16202b; transform: translateY(-1px); }
.tb-nav a[aria-current="page"] { color: #16202b; font-weight: 700; }
.tb-nav .s { display: none; }
.tb ai-menu { margin-inline-start: auto; }
@media (max-width: 760px) {
  .tb { flex-wrap: wrap; gap: 4px 12px; padding: 8px 16px; }
  .tb-brand span { display: none; }
  .tb-nav { order: 3; flex-basis: 100%; gap: 14px; overflow-x: auto; scrollbar-width: none; }
  .tb-nav::-webkit-scrollbar { display: none; }
  .tb-nav .l { display: none; } .tb-nav .s { display: inline; }
}`;

export function mountTopbar(current, root = '') {
  const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
  const bar = document.createElement('header');
  bar.className = 'tb'; bar.setAttribute('dir', 'rtl');
  bar.innerHTML = `
    <a class="tb-brand" href="${root}#v=intro" aria-label="רפואה, לפתיחה"><img src="${root}icons/icon.svg" alt="" width="28" height="28"><b>רפואה</b><span>גוף, מחלה, בריאות</span></a>
    <nav class="tb-nav" aria-label="ניווט">${NAV.map(([id, href, long, short]) => `<a href="${root}${href}" data-nav="${id}"${id === current ? ' aria-current="page"' : ''}><span class="l">${long}</span><span class="s">${short}</span></a>`).join('')}</nav>
    <ai-menu></ai-menu>`;
  document.body.prepend(bar);
  if (!document.querySelector('script[src*="ai-menu.js"]')) {
    const s = document.createElement('script'); s.src = 'https://appofapp-gh.vercel.app/ai-menu.js'; s.defer = true; document.head.append(s);
  }
  document.documentElement.style.setProperty('--tb-h', `${bar.offsetHeight}px`);
  new ResizeObserver(() => document.documentElement.style.setProperty('--tb-h', `${bar.offsetHeight}px`)).observe(bar);
  return bar;
}
