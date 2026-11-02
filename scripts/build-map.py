"""Builds js/map-data.js: coastlines of Europe and the Mediterranean, projected once.
Source: Natural Earth via world-atlas@2.0.2 land-50m.json (ISC). Usage: python3 scripts/build-map.py land-50m.json"""
import json, math, sys
t = json.load(open(sys.argv[1]))
sx, sy = t['transform']['scale']; tx, ty = t['transform']['translate']
arcs = []
for a in t['arcs']:
    x = y = 0; pts = []
    for dx, dy in a:
        x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)
arc = lambda i: arcs[i] if i >= 0 else arcs[~i][::-1]
LON0, LON1, LAT0, LAT1 = -12, 56, 26, 58
K = 10; C = math.cos(math.radians(42))
proj = lambda lon, lat: ((lon - LON0) * K * C, (LAT1 - lat) * K)
polys = []
for g in t['objects']['land']['geometries']:
    polys += g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
out = []; n = 0
for poly in polys:
    for ring in poly:
        pts = []
        for i in ring:
            a = arc(i); pts.extend(a if not pts else a[1:])
        lons = [p[0] for p in pts]; lats = [p[1] for p in pts]
        if max(lons) < LON0 - 2 or min(lons) > LON1 + 2 or max(lats) < LAT0 - 2 or min(lats) > LAT1 + 2: continue
        P = [proj(*p) for p in pts]; s = [P[0]]
        for p in P[1:]:
            q = s[-1]
            if (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 >= 2.0 ** 2: s.append(p)
        if len(s) < 8: continue
        n += len(s); out.append('M' + ' '.join(f'{round(p[0])},{round(p[1])}' for p in s) + 'Z')
W = (LON1 - LON0) * K * C; H = (LAT1 - LAT0) * K
open('js/map-data.js', 'w').write(f"""// Coastlines: Natural Earth via world-atlas@2.0.2 land-50m (ISC licence). Built by scripts/build-map.py.
// Equirectangular, lon {LON0}..{LON1}, lat {LAT0}..{LAT1}; x scaled by cos(42deg).
export const MAP = {{ lon0: {LON0}, lon1: {LON1}, lat0: {LAT0}, lat1: {LAT1}, k: {K}, c: {C:.6f}, w: {W:.1f}, h: {H:.1f} }};
export const LAND = '{''.join(out)}';
""")
print(len(out), 'rings', n, 'points', round(W), 'x', round(H))
