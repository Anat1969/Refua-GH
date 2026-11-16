"""Builds models/paths.json: centre lines, in millimetres of the body frame, for the carriers that move on the 3D model
(the egg in the tube, blood in the heart, air in the airways, food in the gut, urine in the ureters, lymph, nerve signals).
Run: python3 scripts/build-paths.py            (needs numpy, scipy, trimesh)
Every line follows a real structure of the model (the middle of its tube). Where the model has no structure (a nerve to the foot,
a path through the lungs) the line is a short, labelled schema, and the stage says so."""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import pathlib3d as P

ROOT = os.path.join(os.path.dirname(__file__), '..', 'models')
OUT = {}


def rnd(a): return [[round(float(x), 1) for x in p] for p in np.asarray(a)]
def M(name): return P.load(os.path.join(ROOT, name + '.glb'))
def far_end(v, g, i):
    from scipy.sparse.csgraph import dijkstra
    d = dijkstra(g, directed=False, indices=i); d[~np.isfinite(d)] = -1
    return int(np.argmax(d))
def ends(mesh, weld=3.0):
    """The two ends of a tube: the far end of the far end."""
    v, g = P.graph(mesh, weld)
    a = far_end(v, g, 0); b = far_end(v, g, a)
    return v, g, v[a], v[b]


# ---- reproductive: the tubes (fimbria end to uterus end), the ovaries, the cavity of the uterus
def reproductive():
    R = M('reproductive'); T = R['tubes']; v, g, n, lab = P.components(T)
    from scipy.sparse.csgraph import dijkstra
    uc = np.asarray(R['uterus'].vertices).mean(0)
    out = {}
    ovv, _, on, ol = P.components(R['ovaries'])
    for c in range(n):
        idx = np.where(lab == c)[0]
        iu = idx[np.argmin(np.linalg.norm(v[idx] - uc, axis=1))]
        d = dijkstra(g, directed=False, indices=iu); d[~np.isfinite(d)] = -1
        ifim = int(np.argmax(np.where(lab == c, d, -1)))
        cl = P.centre_line(T, v[iu], v[ifim], radius=7, step=2.5, v=v, g=g)[::-1]  # fimbria end first
        side = 'r' if v[idx].mean(0)[0] > uc[0] else 'l'
        out['tube_' + side] = cl
        # the ovary of that side, and the point of it nearest the fimbria end
        for oc in range(on):
            pts = ovv[ol == oc]
            if (pts.mean(0)[0] > uc[0]) == (side == 'r'):
                out['ovary_' + side] = np.array([pts.mean(0), pts[np.argmin(np.linalg.norm(pts - cl[0], axis=1))]])
    # the cavity: a short line inside the uterus, from the openings of the tubes to the middle
    U = np.asarray(R['uterus'].vertices)
    out['cavity'] = np.array([[uc[0] - 22, uc[1], uc[2] + 3], uc + [0, 0, 6], [uc[0] + 12, uc[1], uc[2] + 3]])
    return out


def centres(mesh):
    b = np.asarray(mesh.vertices); return (b.min(0) + b.max(0)) / 2


# ---- cardio: the blood path through the chambers and the great vessels. Right side (oxygen-poor) and left side (oxygen-rich).
def cardio():
    C = M('cardio'); out = {}
    c = {k: centres(C[k]) for k in ['lv', 'rv', 'la', 'ra', 'mitral', 'tricuspid', 'aorticv', 'pulmv']}
    # the vena cava: top to bottom; the pulmonary trunk: valve to bifurcation; the aorta: root, arch, descending
    v, g, a, b = ends(C['svc'], 3.0)
    top, bot = (a, b) if a[2] > b[2] else (b, a)
    svc = P.centre_line(C['svc'], top, bot, radius=9, step=3, v=v, g=g)
    v, g, a, b = ends(C['pulmtrunk'], 3.0)
    lo, hi = (a, b) if a[2] < b[2] else (b, a)
    trunk = P.centre_line(C['pulmtrunk'], lo, hi, radius=14, step=3, v=v, g=g)
    v, g = P.graph(C['aorta'], 2.0)
    iroot = P.nearest(v, c['aorticv']); idesc = int(np.argmin(v[:, 2]))
    aorta = P.centre_line(C['aorta'], v[iroot], v[idesc], radius=14, step=3, v=v, g=g)
    la = np.asarray(C['la'].vertices); la_in = la[np.argmax(la[:, 1])]  # where the pulmonary veins join: the back of the left atrium
    ra = np.asarray(C['ra'].vertices)
    out['right'] = P.resample(P.smooth(P.resample(np.vstack([svc, [c['ra']], [c['tricuspid']], [c['rv']], [c['pulmv']], trunk]), 3), 4, 3), 3)
    out['left'] = P.resample(P.smooth(P.resample(np.vstack([[la_in], [c['la']], [c['mitral']], [c['lv']], [c['aorticv']], aorta]), 3), 4, 3), 3)
    return out


def top_bottom(a, b):
    return (a, b) if a[2] > b[2] else (b, a)


# ---- respiratory: the trachea, and the airways from the carina to the far branches in both lungs
def respiratory():
    R = M('respiratory'); out = {}
    v, g, a, b = ends(R['trachea'], 3.0); top, bot = top_bottom(a, b)
    out['trachea'] = P.centre_line(R['trachea'], top, bot, radius=14, step=3, v=v, g=g)
    va, ga = P.graph(R['airways'], 2.0)
    leaves = P.spread_points(va, ga, bot, 14, min_sep=38)
    for i, p in enumerate(P.tree_paths(R['airways'], bot, leaves, radius=6, step=3, v=va, g=ga)): out[f'air_{i}'] = P.smooth(p, 2, 2)
    return out


# ---- digestive: the gut from the mouth to the anus, as one line, in four pieces
def digestive():
    D = M('digestive'); out = {}
    v, g, a, b = ends(D['esophagus'], 3.0); top, bot = top_bottom(a, b)
    out['esophagus'] = P.centre_line(D['esophagus'], top, bot, radius=10, step=3, v=v, g=g)
    sv, sg = P.graph(D['stomach'], 3.0)
    cardia = sv[P.nearest(sv, bot)]
    smv, smg, sa, sb = ends(D['small'], 4.0)
    lv, lg, la_, lb = ends(D['large'], 4.0)
    # the pylorus: the part of the stomach nearest the small intestine; the duodenal end: the end of the small intestine nearest to it
    pairs = [(np.linalg.norm(sv[i] - e), i, e) for e in (sa, sb) for i in range(0, len(sv), 3)]
    _, ipy, duo = min(pairs, key=lambda t: t[0])
    ile = sb if np.allclose(duo, sa) else sa
    out['stomach'] = P.centre_line(D['stomach'], cardia, sv[ipy], radius=30, step=3, v=sv, g=sg)
    out['small'] = P.centre_line(D['small'], duo, ile, radius=9, step=3, v=smv, g=smg)
    cec, rec = (la_, lb) if np.linalg.norm(la_ - ile) < np.linalg.norm(lb - ile) else (lb, la_)
    out['large'] = P.centre_line(D['large'], cec, rec, radius=14, step=3, v=lv, g=lg)
    return out


# ---- urinary: the ureters (kidney to bladder) and the renal arteries (aorta to kidney)
def urinary():
    U = M('urinary'); out = {}
    v, g, n, lab = P.components(U['ureters'], 2.0)
    for c in np.argsort([-(lab == i).sum() for i in range(n)])[:2]:
        m = P.submesh(U['ureters'], lab == c); vv, gg, a, b = ends(m, 3.0); top, bot = top_bottom(a, b)
        out['ureter_' + ('r' if vv.mean(0)[0] < 0 else 'l')] = P.centre_line(m, top, bot, radius=5, step=2.5, v=vv, g=gg)
    return out


# ---- nervous: the spinal cord, the brainstem, and a schematic line from the motor cortex through the brainstem into the cord.
# The model has no tracts and no peripheral nerves: the line from the cortex is a schema (the corticospinal route, as in Gray's), and the stage says so.
def nervous():
    N = M('nervous'); out = {}
    v, g, a, b = ends(N['cord'], 3.0); top, bot = top_bottom(a, b)
    cord = P.centre_line(N['cord'], top, bot, radius=7, step=2.5, v=v, g=g)
    bs = np.asarray(N['brainstem'].vertices); bs_top = bs[bs[:, 2] > bs[:, 2].max() - 8].mean(0); bs_bot = bs[bs[:, 2] < bs[:, 2].min() + 8].mean(0)
    di = centres(N['diencephalon'])
    for side, name in ((1, 'l'), (-1, 'r')):
        cx = np.asarray(N['cerebrum_' + name].vertices)
        target = np.array([side * 38.0, -95.0, 1700.0])
        cortex = cx[np.argmin(np.linalg.norm(cx[:, :2] - target[:2], axis=1) - 0.02 * cx[:, 2])]   # the surface above the motor strip
        way = np.array([cortex, [side * 32, cortex[1] + 4, cortex[2] - 40], [side * 14, di[1], di[2] + 12], [side * 5, di[1] + 6, di[2] - 8], bs_top, bs_bot])
        line = np.vstack([P.resample(way, 3), cord])
        out['motor_' + name] = P.resample(P.smooth(P.resample(line, 3), 3, 2), 3)
    out['cord'] = cord
    return out


# ---- immune and lymph: the thoracic duct (from the abdomen up to the left venous angle) and the lymph vessels of the limbs, towards the trunk
def immune():
    I = M('immune'); out = {}
    v, g, a, b = ends(I['thoracic_duct'], 3.0); top, bot = top_bottom(a, b)
    out['duct'] = P.centre_line(I['thoracic_duct'], bot, top, radius=6, step=2.5, v=v, g=g)
    LV = I['lymph_vessels']; vv, gg, n, lab = P.components(LV, 10.0)
    k = 0
    for c in np.argsort([-(lab == i).sum() for i in range(n)])[:3]:
        m = P.submesh(LV, lab == c); mv, mg, a, b = ends(m, 3.0)
        far, near = (a, b) if np.linalg.norm(a - top) > np.linalg.norm(b - top) else (b, a)   # flow runs from the far end to the end nearest the neck
        line = P.smooth(P.centre_line(m, far, near, radius=7, step=3, v=mv, g=mg), 2, 2)
        iz = int(np.argmax(line[:, 2]))
        if 5 < iz < len(line) - 5 and line[iz, 2] > line[0, 2] + 100 and line[iz, 2] > line[-1, 2] + 100:   # up one leg and down the other: two lines, both towards the trunk
            out[f'vessel_{k}'] = line[:iz + 1]; out[f'vessel_{k + 1}'] = line[iz:][::-1]; k += 2
        else: out[f'vessel_{k}'] = line; k += 1
    return out


# ---- endocrine: the hormone leaves a gland into the blood and is carried to its target. The model of the glands has no vessels, so the
# routes are schematic: straight and gentle curves in the neck, and the real centre line of the aorta in the trunk. The stage says so.
def endocrine():
    E = M('endocrine'); C = M('cardio'); out = {}
    c = {k: centres(E[k]) for k in ['pituitary', 'pineal', 'thyroid', 'adrenals', 'pancreas']}
    v, g = P.graph(C['aorta'], 2.0)
    iroot = P.nearest(v, centres(C['aorticv'])); idesc = int(np.argmin(v[:, 2]))
    aorta = P.centre_line(C['aorta'], v[iroot], v[idesc], radius=14, step=3, v=v, g=g)
    arch = aorta[np.argmax(aorta[:, 2])]
    def curve(pts): return P.resample(P.smooth(P.resample(np.array(pts, float), 3), 3, 3), 3)
    neck = lambda z, dx=0: [0 + dx, -108, z]
    ad = np.asarray(E['adrenals'].vertices); adl = ad[ad[:, 0] > 0].mean(0); adr = ad[ad[:, 0] < 0].mean(0)
    # the aorta, from the arch down to the level of the glands of the abdomen
    down = aorta[np.argmax(aorta[:, 2]):]
    zi = int(np.argmin(np.abs(down[:, 2] - c['adrenals'][2])))
    out['pituitary_thyroid'] = curve([c['pituitary'], neck(1480, 12), neck(1420, 14), [c['thyroid'][0] + 18, c['thyroid'][1] + 3, c['thyroid'][2] + 8]])
    out['pituitary_adrenals'] = curve([c['pituitary'], neck(1480, -8), neck(1400, -6), arch, *down[:zi:4], down[zi], adl])
    out['adrenals_heart'] = curve([adr, down[zi], *down[:zi][::-4], arch, centres(C['aorticv'])])
    out['pancreas_body'] = curve([c['pancreas'], down[min(len(down) - 1, zi + 6)], *down[zi + 6::5]])
    return out


OUT['reproductive'] = reproductive()
OUT['cardio'] = cardio()
OUT['respiratory'] = respiratory()
OUT['digestive'] = digestive()
OUT['urinary'] = urinary()
OUT['nervous'] = nervous()
OUT['immune'] = immune()
OUT['endocrine'] = endocrine()
if __name__ == '__main__':
    only = sys.argv[1:]
    json.dump({k: {n: rnd(p) for n, p in d.items()} for k, d in OUT.items()}, open(os.path.join(ROOT, 'paths.json'), 'w'), separators=(',', ':'))
    print({k: {n: len(p) for n, p in d.items()} for k, d in OUT.items()})
