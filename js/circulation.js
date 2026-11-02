// Circulation diagram: four chambers, lungs above, body tissues below.
// Anatomical front view: the body's right side is drawn on the viewer's left.
// Oxygen-rich = solid ink, oxygen-poor = thin line + hollow dots. Root SVG is LTR.

export const SEGMENTS = {
  cava: 'M300,700 L130,700 C112,700 104,690 104,672 L104,388 C104,374 112,368 126,368 L196,368',
  'ra-rv': 'M232,384 L232,416',
  pa: 'M200,452 C170,452 156,440 156,418 L156,226 C156,204 168,192 190,188',
  lungs: 'M196,160 C250,124 310,124 364,160',
  pv: 'M370,188 C392,192 404,204 404,226 L404,350 C404,362 396,368 384,368 L364,368',
  'la-lv': 'M328,384 L328,416',
  aorta: 'M362,452 C420,452 456,470 456,500 L456,672 C456,690 448,700 430,700 L300,700',
  body: 'M430,724 C380,756 180,756 130,724',
};

// Number badge position for each step of the chain.
const BADGE = {
  cava: [104, 540], 'ra-rv': [176, 400], pa: [156, 320], lungs: [280, 112],
  pv: [404, 290], 'la-lv': [384, 400], aorta: [456, 590], body: [280, 772],
};

const LABELS = [
  // [x, y, text, anchor]
  [232, 366, 'עלייה', 'middle'], [232, 452, 'חדר', 'middle'],
  [328, 366, 'עלייה', 'middle'], [328, 452, 'חדר', 'middle'],
  [232, 296, 'ימין', 'middle'], [328, 296, 'שמאל', 'middle'],
  [280, 64, 'הריאות', 'middle'], [280, 668, 'רקמות הגוף', 'middle'],
  [92, 450, 'ורידים נבובים', 'end'], [144, 260, 'עורק הריאה', 'end'],
  [416, 260, 'ורידי הריאה', 'start'], [468, 520, 'אאורטה', 'start'],
];

function chamber(x, y, w, h) {
  return `<rect class="ch" x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/>`;
}

function mesh(x1, x2, y, amp) {
  let d = `M${x1},${y}`;
  for (let x = x1; x + 28 <= x2; x += 28) d += ` q7,${amp} 14,0 q7,${-amp} 14,0`;
  return `<path class="mesh" d="${d}"/>`;
}

export function circulationSVG(steps, reduced) {
  const segs = steps
    .map((st, i) => {
      const cls = st.oxy === 'rich' ? 'rich' : st.oxy === 'poor' ? 'poor' : 'swap';
      const dots = reduced
        ? ''
        : [0, 1, 2]
            .map((k) => {
              const begin = `-${(k * 0.8).toFixed(1)}s`; // negative: every dot is already on its path
              // Gas exchange: the dot fills (lungs) or empties (body) on its way.
              const fill = cls !== 'swap' ? '' : `<animate attributeName="fill" dur="2.4s" begin="${begin}" repeatCount="indefinite" values="${st.seg === 'lungs' ? '#ffffff;#16202b' : '#16202b;#ffffff'}"/>`;
              return `<circle class="dot dot-${cls}" r="5"><animateMotion dur="2.4s" begin="${begin}" repeatCount="indefinite" path="${SEGMENTS[st.seg]}"/>${fill}</circle>`;
            })
            .join('');
      const [bx, by] = BADGE[st.seg];
      return `<g class="seg seg-${cls}" data-step="${i}" role="button" tabindex="0" aria-label="שלב ${i + 1}: ${st.name_he}">
        <path class="hitpath" d="${SEGMENTS[st.seg]}"/>
        <path class="flow" d="${SEGMENTS[st.seg]}"/>
        <g class="dots">${dots}</g>
        <circle class="badge" cx="${bx}" cy="${by}" r="13"/>
        <text class="badge-n" x="${bx}" y="${by + 4.5}" text-anchor="middle">${i + 1}</text>
      </g>`;
    })
    .join('');
  const labels = LABELS.map(([x, y, t, a]) => `<text class="lab" x="${x}" y="${y}" text-anchor="${a}">${t}</text>`).join('');
  return `<svg class="circ-svg" viewBox="0 40 560 750" role="group" aria-label="מחזור הדם: שמונה שלבים" preserveAspectRatio="xMidYMid meet">
    <g class="organs">
      <path class="lung" d="M120,96 C150,70 214,72 240,104 C256,126 252,170 236,196 C214,214 150,214 126,192 C104,168 102,120 120,96 Z"/>
      <path class="lung" d="M440,96 C410,70 346,72 320,104 C304,126 308,170 324,196 C346,214 410,214 434,192 C456,168 458,120 440,96 Z"/>
      ${mesh(140, 224, 150, 8)}${mesh(336, 420, 150, 8)}
      <rect class="tissue" x="120" y="680" width="320" height="80" rx="10"/>
      ${mesh(150, 410, 724, 10)}
      <path class="heart" d="M196,340 C196,316 222,304 280,304 C338,304 364,316 364,340 L364,470 C364,520 320,548 280,560 C240,548 196,520 196,470 Z"/>
      ${chamber(204, 334, 56, 54)}${chamber(204, 412, 56, 70)}${chamber(300, 334, 56, 54)}${chamber(300, 412, 56, 76)}
      <path class="septum" d="M280,318 L280,548"/>
    </g>
    <g class="segs">${segs}</g>
    <g class="labels">${labels}</g>
    <text class="side-note" x="280" y="590" text-anchor="middle">ימין הגוף משמאלך, כמו מול אדם</text>
  </svg>`;
}
