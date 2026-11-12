// The body figure: an ink line drawing with one transparency layer per system.
// Coordinates are drawn for a 400-wide figure centred on x=200; bilateral parts
// are drawn once (viewer's right) and mirrored. Root SVG is LTR (RTL pitfall).

const FIG_X = 80; // figure offset inside the 560-wide viewBox

const mirror = (d) => `<path d="${d}"/><path d="${d}" transform="translate(400,0) scale(-1,1)"/>`;
const single = (d) => `<path d="${d}"/>`;

const OUTLINE_HALF =
  'M199,28 L200,28 C223,28 240,48 240,78 C240,102 230,120 216,128 C214,138 214,146 216,152 ' +
  'C232,160 258,164 274,172 C292,180 300,196 302,214 C306,250 310,290 316,330 C320,360 326,392 330,420 ' +
  'C334,440 340,456 338,470 C336,488 326,496 318,490 C312,484 312,470 314,456 C308,430 300,400 294,372 ' +
  'C290,340 284,300 280,262 C278,250 276,240 272,236 C270,270 266,300 264,330 C262,350 266,372 272,392 ' +
  'C276,420 274,450 268,480 C262,540 258,590 256,630 C254,680 256,720 254,748 C258,760 266,770 266,778 ' +
  'C266,786 240,788 230,784 C226,770 228,756 228,746 C228,700 226,660 226,630 C224,580 218,520 210,470 ' +
  'C206,450 203,440 200,436 L199,436';

function ribs() {
  let d = '';
  for (let i = 0; i < 7; i++) {
    const y = 192 + i * 14;
    const w = 50 - Math.abs(i - 2) * 3;
    d += `M204,${y} C${214 + w / 3},${y - 8} ${200 + w},${y - 2} ${204 + w},${y + 18} `;
  }
  return d;
}

function vertebrae() {
  let s = '';
  for (let y = 134; y <= 424; y += 12) s += `<rect x="196" y="${y}" width="8" height="8" rx="1"/>`;
  return s;
}

const LAYERS = {
  nervous:
    single('M172,62 C172,40 186,30 200,30 C214,30 228,40 228,62 C228,80 216,90 200,90 C184,90 172,80 172,62 Z') +
    single('M180,55 C188,48 194,58 200,50 C206,58 212,48 220,55') +
    single('M178,70 C188,64 194,74 200,66 C206,74 212,64 222,70') +
    single('M200,32 L200,88') +
    single('M188,92 C192,100 208,100 212,92') +
    single('M200,100 L200,420') +
    mirror('M204,170 C240,175 280,190 296,230 C304,280 312,340 320,400 C326,440 330,460 330,480') +
    mirror('M204,420 C222,440 236,470 238,520 C240,580 242,640 242,700 C242,730 244,760 250,775') +
    mirror('M204,240 C220,244 240,250 256,262'),
  respiratory:
    single('M200,128 L200,186') +
    mirror('M200,186 C204,192 212,196 218,204') +
    single('M206,190 C222,180 244,196 250,226 C256,256 256,282 252,300 C238,304 222,300 210,294 C220,282 222,268 214,258 C206,248 206,230 206,190 Z') +
    single('M194,190 C178,180 156,196 150,226 C144,256 144,282 148,300 C162,304 180,302 194,296 Z') +
    mirror('M218,204 C226,214 232,230 236,250 M218,204 C230,206 240,212 246,224'),
  cardio:
    single('M206,232 C214,224 230,228 232,242 C234,258 222,272 210,280 C200,272 190,262 192,248 C194,236 202,232 206,232 Z') +
    single('M210,234 C210,212 196,206 192,214 C190,220 204,222 204,236 L204,410') +
    mirror('M204,410 C214,430 226,450 230,500 C234,560 236,640 238,700 C240,740 242,760 246,772') +
    mirror('M206,212 L210,120') +
    mirror('M212,214 C240,200 276,206 292,240 C300,290 306,340 314,400 C318,440 324,460 326,476'),
  digestive:
    single('M203,128 L203,290') +
    single('M204,290 C214,282 236,284 244,296 C252,312 244,330 228,336 C216,340 206,332 210,320 C214,310 222,308 222,300 C220,294 212,294 204,296 Z') +
    single('M150,292 C170,282 200,284 214,292 C210,306 196,316 176,320 C162,322 150,312 150,292 Z') +
    single('M176,400 L170,350 C170,340 176,336 186,336 L216,336 C226,336 232,342 232,352 L232,404 C232,414 222,418 210,414') +
    single('M182,356 C196,348 212,358 222,352 M180,370 C194,362 214,374 224,366 M182,386 C196,378 212,390 222,382 M186,400 C196,394 206,404 214,398'),
  skeletal:
    vertebrae() +
    mirror(ribs()) +
    mirror('M204,170 C226,166 250,170 270,176') +
    mirror('M204,404 C220,396 244,398 252,414 C256,428 248,442 232,446 C222,448 212,442 204,436') +
    mirror('M282,206 L300,336') +
    mirror('M302,342 L322,460 M296,344 L314,460') +
    mirror('M236,440 L238,616') +
    mirror('M243,624 a5,5 0 1,0 -10,0 a5,5 0 1,0 10,0') +
    mirror('M236,634 L236,752 M246,636 L248,750'),
  immune:
    single('M196,176 C190,186 192,198 200,200 C208,198 210,186 204,176 Z') +
    single('M244,300 C254,296 260,310 254,322 C248,328 240,318 244,300 Z') +
    single('M204,180 L204,400') +
    mirror('M222,142 a4,4 0 1,0 -8,0 a4,4 0 1,0 8,0 M274,232 a4,4 0 1,0 -8,0 a4,4 0 1,0 8,0 M230,440 a4,4 0 1,0 -8,0 a4,4 0 1,0 8,0 M244,620 a4,4 0 1,0 -8,0 a4,4 0 1,0 8,0') +
    mirror('M218,146 C240,170 262,200 270,228 M226,444 C236,500 240,560 240,616'),
  // Kidneys, ureters and bladder: the drainage of the city, behind and below the gut.
  urinary:
    mirror('M178,290 C168,296 164,314 170,330 C176,340 186,336 188,326 C190,312 188,296 178,290 Z') +
    mirror('M188,332 C190,350 194,372 198,392') +
    single('M188,396 C188,386 212,386 212,396 C212,408 206,414 200,414 C194,414 188,408 188,396 Z'),
  // Glands: the pituitary in the head, the thyroid at the neck, the adrenals on the kidneys, the pancreas.
  endocrine:
    single('M200,64 a2.6,2.6 0 1,0 0.1,0') +
    single('M188,128 C190,120 198,122 200,128 C202,122 210,120 212,128 C210,138 202,138 200,132 C198,138 190,138 188,128 Z') +
    mirror('M176,282 C182,274 192,276 192,284') +
    single('M150,320 C170,306 200,308 220,316 C206,324 176,328 150,320 Z'),
  // Breast tissue on the chest wall, and a neutral pelvic organ outline (no sex-specific detail).
  reproductive:
    mirror('M212,252 C220,276 248,284 264,264') +
    mirror('M243,266 a3,3 0 1,0 -6,0 a3,3 0 1,0 6,0') +
    single('M186,404 C186,393 214,393 214,404 C214,418 205,428 200,429 C195,428 186,418 186,404 Z') +
    mirror('M214,404 C220,400 226,400 230,404'),
};

// Label placement: side ('r' = right column, 'l' = left column), label y, anchor point.
const MARKS = {
  nervous: { side: 'r', y: 56, ax: FIG_X + 222, ay: 56 },
  immune: { side: 'l', y: 132, ax: FIG_X + 182, ay: 142 },
  respiratory: { side: 'l', y: 236, ax: FIG_X + 158, ay: 240 },
  cardio: { side: 'r', y: 250, ax: FIG_X + 228, ay: 250 },
  digestive: { side: 'r', y: 336, ax: FIG_X + 238, ay: 312 },
  skeletal: { side: 'l', y: 532, ax: FIG_X + 163, ay: 532 },
  reproductive: { side: 'r', y: 430, ax: FIG_X + 214, ay: 412 },
  urinary: { side: 'l', y: 336, ax: FIG_X + 172, ay: 312 },
  endocrine: { side: 'r', y: 150, ax: FIG_X + 212, ay: 128 },
};

export function bodySVG(systems) {
  const layers = systems
    .map((s, i) => `<g class="sys" data-id="${s.id}" style="--i:${i}" aria-hidden="true">${LAYERS[s.id]}</g>`)
    .join('');
  const marks = systems
    .map((s) => {
      const m = MARKS[s.id];
      const right = m.side === 'r';
      const tx = right ? 552 : 8;
      const lx = right ? 422 : 138;
      return `<g class="sysmark" data-id="${s.id}" style="--i:${systems.indexOf(s)}" role="button" tabindex="0" aria-pressed="false" aria-label="${s.name_he}">
        <rect class="hit" x="${right ? 414 : 0}" y="${m.y - 21}" width="146" height="32"/>
        <path class="lead" d="M${lx},${m.y - 4} L${right ? lx - 14 : lx + 14},${m.y - 4} L${m.ax},${m.ay}"/>
        <circle class="dot" cx="${m.ax}" cy="${m.ay}" r="3.2"/>
        <text x="${tx}" y="${m.y}" text-anchor="${right ? 'end' : 'start'}">${s.short_he || s.name_he}</text>
      </g>`;
    })
    .join('');
  return `<svg class="body-svg" viewBox="0 0 560 800" role="group" aria-label="מפת הגוף: תשע מערכות" preserveAspectRatio="xMidYMid meet">
    <defs>
      <filter id="paper" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#16202b" flood-opacity="0.10"/></filter>
    </defs>
    <g transform="translate(${FIG_X},0)">
      <g class="outline" filter="url(#paper)">${mirror(OUTLINE_HALF)}</g>
      ${layers}
    </g>
    <g class="sysmarks">${marks}</g>
  </svg>`;
}

// Standalone sheet images for the 3D atlas: one system (or the outline) per sheet,
// inline styles only (CSS does not reach an SVG drawn into a canvas).
export function sheetSVG(id, px = 512, vb = '0 0 400 800') {
  const [, , vw, vh] = vb.split(' ').map(Number);
  const w = px, h = Math.round(px * vh / vw);
  const ink = '#16202b';
  const body = id === 'outline'
    ? `<g fill="#fbfbfc" stroke="#8d96a1" stroke-width="1.6" stroke-linejoin="round">${mirror(OUTLINE_HALF)}</g>`
    : `<g fill="rgba(22,32,43,0.07)" stroke="${ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${LAYERS[id]}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${body}</svg>`;
}
