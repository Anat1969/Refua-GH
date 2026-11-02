// Timeline on a map: places of discovery, a numbered chain in time order, the current year large.
// Root SVG is LTR (RTL pitfall); Hebrew and numbers live in separate <text> elements.
import { MAP, LAND } from './map-data.js';

export const project = (lon, lat) => [(lon - MAP.lon0) * MAP.k * MAP.c, (MAP.lat1 - lat) * MAP.k];

function graticule() {
  let d = '';
  for (let lon = -10; lon <= 50; lon += 10) { const [x] = project(lon, 0); d += `M${x.toFixed(1)},0 V${MAP.h} `; }
  for (let lat = 30; lat <= 50; lat += 10) { const [, y] = project(0, lat); d += `M0,${y.toFixed(1)} H${MAP.w} `; }
  return d;
}

// Several events in one city: spread their badges around the point.
function badgeOffsets(events) {
  const seen = {};
  return events.map((e) => {
    const key = `${Math.round(e.lat)},${Math.round(e.lon)}`;
    const n = (seen[key] = (seen[key] || 0) + 1) - 1;
    const ang = -Math.PI / 2 + n * 0.95;
    return n === 0 ? [12, -12] : [Math.cos(ang) * 22 + 6, Math.sin(ang) * 22 - 6];
  });
}

export function historySVG(events) {
  const pts = events.map((e) => project(e.lon, e.lat));
  const offs = badgeOffsets(events);
  const legs = pts.slice(1).map((p, i) => {
    const a = pts[i];
    const mx = (a[0] + p[0]) / 2, my = (a[1] + p[1]) / 2 - Math.hypot(p[0] - a[0], p[1] - a[1]) * 0.18;
    return `<path class="leg" data-to="${i + 1}" d="M${a[0].toFixed(1)},${a[1].toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${p[0].toFixed(1)},${p[1].toFixed(1)}" marker-end="url(#arrow)"/>`;
  }).join('');
  const marks = events.map((e, i) => {
    const [x, y] = pts[i];
    const [ox, oy] = offs[i];
    return `<g class="evp" data-ev="${i}" role="button" tabindex="0" aria-label="${e.year_he}: ${e.person_he}, ${e.place_he}">
      <circle class="ev-hit" cx="${x}" cy="${y}" r="13"/>
      <circle class="ev-dot" cx="${x}" cy="${y}" r="4.5"/>
      <line class="ev-tick" x1="${x}" y1="${y}" x2="${x + ox}" y2="${y + oy}"/>
      <circle class="ev-badge" cx="${x + ox}" cy="${y + oy}" r="8.5"/>
      <text class="ev-n" x="${x + ox}" y="${y + oy + 3.2}" text-anchor="middle">${i + 1}</text>
    </g>`;
  }).join('');
  return `<svg class="map-svg" viewBox="0 0 ${MAP.w} ${MAP.h}" role="group" aria-label="מפה: מקומות של גילויים ברפואה" preserveAspectRatio="xMidYMid meet">
    <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
    <rect class="sea" width="${MAP.w}" height="${MAP.h}"/>
    <path class="grat" d="${graticule()}"/>
    <path class="land" d="${LAND}"/>
    <g class="legs">${legs}</g>
    <g class="evs">${marks}</g>
    <g class="place-label" aria-hidden="true"><text class="pl-he"></text><text class="pl-en"></text></g>
    <text class="big-year" x="${MAP.w - 14}" y="44" text-anchor="end"></text>
    <text class="big-era" x="${MAP.w - 14}" y="62" text-anchor="end"></text>
  </svg>`;
}

// Mark the current event: earlier legs in ink, later ones faint; the place name beside the point.
export function setEvent(svg, events, i) {
  svg.querySelectorAll('.evp').forEach((g) => {
    const k = Number(g.dataset.ev);
    g.classList.toggle('on', k === i);
    g.classList.toggle('past', k < i);
    g.setAttribute('aria-pressed', String(k === i));
  });
  svg.querySelectorAll('.leg').forEach((l) => l.classList.toggle('past', Number(l.dataset.to) <= i));
  const e = events[i];
  const [x, y] = project(e.lon, e.lat);
  const left = x > MAP.w * 0.72;
  const he = svg.querySelector('.pl-he'), en = svg.querySelector('.pl-en');
  he.textContent = e.place_he; en.textContent = e.place_en;
  he.setAttribute('x', left ? x - 16 : x + 16); en.setAttribute('x', left ? x - 16 : x + 16);
  he.setAttribute('y', y + 26); en.setAttribute('y', y + 40);
  he.setAttribute('text-anchor', left ? 'end' : 'start'); en.setAttribute('text-anchor', left ? 'end' : 'start');
  const yr = svg.querySelector('.big-year');
  yr.textContent = String(Math.abs(e.year));
  svg.querySelector('.big-era').textContent = e.year < 0 ? 'לפנה״ס' : '';
}
