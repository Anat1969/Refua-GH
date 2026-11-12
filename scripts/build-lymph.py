# Builds the lymphatic network as a SCHEMA, anchored on the real vessels of BodyParts3D, and adds it to
# models/immune.glb (as parts) and to the immune overview in models/body.glb.
#
# BodyParts3D has no lymphatic structures, and the Human Reference Atlas has a single, enlarged node with no place
# in the body. So the network here is drawn, not scanned: lymph vessels follow the blood vessels they accompany in
# life, and the node groups sit at their textbook regions (Gray's Anatomy, 42nd ed.). Sizes are enlarged to be seen.
# The app says so on the stage (ANATOMY3D.immune.gap_he) and in every part's model line ("schema").
#
# Each vertex carries, in TEXCOORD_0.x, its distance in metres along the path to the venous angle, where lymph
# returns to the blood. The motion layer in js/body3d.js uses it to run the flow in the right direction.
#
# Run: pip install trimesh numpy && python3 scripts/build-lymph.py <bp3d_dir> models
#   <bp3d_dir> holds obj/partof_BP3D_4.0_obj_99/*.obj and partof_element_parts.txt (see build-body3d.py).
import csv, json, os, struct, sys
import numpy as np, trimesh

SRC, OUT = sys.argv[1], sys.argv[2]
D = os.path.join(SRC, 'obj', 'partof_BP3D_4.0_obj_99')
byn = {}
for c, n, f in list(csv.reader(open(os.path.join(SRC, 'partof_element_parts.txt')), delimiter='\t'))[1:]:
    byn.setdefault(n, set()).add(f)
rng = np.random.default_rng(7)


def own(name):
    """The elements of the vessel itself: a name in the part-of list also holds every branch below it."""
    mine = set(byn[name])
    for other, fs in byn.items():
        if other != name and fs < byn[name]: mine -= fs
    return mine or byn[name]


def verts(name):
    return np.vstack([trimesh.load(os.path.join(D, f + '.obj'), process=False).vertices for f in sorted(own(name))])


def centerline(name, n=14):
    """An ordered polyline through a vessel: slices along its main axis, one centroid per slice."""
    v = verts(name); c = v.mean(0)
    axis = np.linalg.svd(v - c, full_matrices=False)[2][0]
    t = (v - c) @ axis
    edges = np.linspace(t.min(), t.max(), n + 1)
    pts = [v[(t >= a) & (t <= b)].mean(0) for a, b in zip(edges[:-1], edges[1:]) if ((t >= a) & (t <= b)).any()]
    return np.array(pts)


def oriented(line, start_near=None, top_first=None):
    if start_near is not None and np.linalg.norm(line[-1] - start_near) < np.linalg.norm(line[0] - start_near): line = line[::-1]
    if top_first is not None and (line[0][2] < line[-1][2]) == top_first: line = line[::-1]
    return line


def smooth(pts, k=2):
    """Catmull-Rom through the points: lymph vessels do not turn at angles."""
    p = np.vstack([pts[0], pts, pts[-1]]); out = []
    for i in range(1, len(p) - 2):
        for s in np.linspace(0, 1, k, endpoint=False):
            a, b, c, d = p[i - 1], p[i], p[i + 1], p[i + 2]
            out.append(0.5 * ((2 * b) + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s * s + (-a + 3 * b - 3 * c + d) * s ** 3))
    out.append(pts[-1]); return np.array(out)


def length(pts): return float(np.linalg.norm(np.diff(pts, axis=0), axis=1).sum())


class Part:
    def __init__(self): self.v, self.f, self.u = [], [], []; self.n = 0

    def add(self, v, f, u):
        self.v.append(v); self.f.append(f + self.n); self.u.append(u); self.n += len(v)

    def tube(self, pts, r, d_end, seg=4):
        """A tube along pts, flowing towards pts[-1]; d_end is the distance left to the venous angle at its end."""
        pts = smooth(np.asarray(pts, float)); m = len(pts)
        d = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]); left = d[-1] - d + d_end
        tang = np.gradient(pts, axis=0); tang /= np.linalg.norm(tang, axis=1)[:, None] + 1e-9
        ref = np.array([0.0, 1.0, 0.0]); V = []
        for i in range(m):
            a = np.cross(tang[i], ref); a = a / (np.linalg.norm(a) + 1e-9) if np.linalg.norm(a) > 1e-3 else np.array([1.0, 0, 0])
            b = np.cross(tang[i], a)
            for k in range(seg):
                th = 2 * np.pi * k / seg; V.append(pts[i] + r * (np.cos(th) * a + np.sin(th) * b))
        F = []
        for i in range(m - 1):
            for k in range(seg):
                p, q = i * seg + k, i * seg + (k + 1) % seg
                F += [[p, q, p + seg], [q, q + seg, p + seg]]
        self.add(np.array(V), np.array(F), np.repeat(left, seg))
        return float(left[0])  # the distance left at the start of this tube

    def node(self, c, size, d_left, axis=(0, 0, 1)):
        """A bean-shaped node: an ellipsoid, a little flattened."""
        s = trimesh.creation.icosphere(subdivisions=0)  # 20 faces: a node is a few pixels wide, and the body is drawn without a graphics card in tests
        v = s.vertices * np.array([size * 0.42, size * 0.3, size * 0.5])
        ax = np.asarray(axis, float); ax /= np.linalg.norm(ax)
        R = trimesh.geometry.align_vectors([0, 0, 1], ax)[:3, :3]
        self.add(v @ R.T + np.asarray(c), np.array(s.faces), np.full(len(v), d_left))

    def mesh(self):
        v = np.vstack(self.v); f = np.vstack(self.f); u = np.concatenate(self.u) / 1000.0
        m = trimesh.Trimesh(v, f, process=False)
        m.visual = trimesh.visual.TextureVisuals(uv=np.column_stack([u, np.zeros(len(u))]))
        return m


def cluster(part, line, count, size, d_at, spread=7.0, frac=(0.1, 0.9)):
    """Nodes scattered along a stretch of a vessel; d_at(i) gives the distance left at point i of the line."""
    idx = np.linspace(frac[0] * (len(line) - 1), frac[1] * (len(line) - 1), count)
    out = []
    for t in idx:
        i = int(np.clip(round(t), 0, len(line) - 1)); j = min(i + 1, len(line) - 1)
        ax = line[j] - line[max(i - 1, 0)]
        off = rng.normal(0, spread, 3); off -= off.dot(ax) / (ax.dot(ax) + 1e-9) * ax * 0.6
        c = line[i] + off; part.node(c, size * rng.uniform(0.8, 1.2), d_at(i), ax); out.append(c)
    return np.array(out)


def along(line, d_end):
    """Distance left to the venous angle at each point of a line that flows towards line[-1]."""
    d = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(line, axis=0), axis=1))]); return d[-1] - d + d_end


P = {k: Part() for k in ['thoracic_duct', 'lymph_vessels', 'nodes_neck', 'nodes_axilla', 'nodes_chest', 'nodes_abdomen', 'nodes_groin']}
sites = {}

# --- the two venous angles: where the subclavian and the internal jugular veins meet, and lymph returns to the blood
angle = {}
for side, sx in (('left', 1), ('right', -1)):
    bc = centerline(f'{side} brachiocephalic vein', 8)
    angle[side] = max(bc, key=lambda p: p[0] * sx + p[2] * 0.5)  # the lateral, upper end
    angle[side] = angle[side] + np.array([sx * 14.0, 0.0, 6.0])  # the vein piece in the model stops short of the angle
sites['venous_angle_left'] = angle['left']; sites['venous_angle_right'] = angle['right']

# --- the thoracic duct: from the cisterna chyli in front of the upper lumbar spine, up along the descending aorta
#     (to its right, behind it), crossing to the left in the upper chest, to the left venous angle
ab = oriented(centerline('abdominal aorta', 12), top_first=True)
th = oriented(centerline('descending thoracic aorta', 12), top_first=True)
cisterna = ab[2] + np.array([-9.0, 10.0, 0.0])
duct = [cisterna] + [p + np.array([-13.0, 9.0, 0.0]) for p in th[::-1][1:-2]]
top = th[1]
duct += [top + np.array([-4.0, 12.0, 14.0]), np.array([angle['left'][0] * 0.45, angle['left'][1] + 12.0, angle['left'][2] + 16.0]), angle['left'] + np.array([-4.0, 4.0, 12.0]), angle['left']]
duct = np.array(duct)
d_cisterna = P['thoracic_duct'].tube(duct, 2.4, 0.0)
P['nodes_abdomen'].node(cisterna, 16, d_cisterna, (0, 0, 1))
sites['cisterna_chyli'] = cisterna

# --- the neck: the deep cervical chain along each common carotid artery, down to the venous angle
for side in ('left', 'right'):
    cc = oriented(centerline(f'{side} common carotid artery', 10), top_first=True)
    cc = np.vstack([cc[0] + np.array([0, 4.0, 34.0]), cc])  # up to the angle of the jaw
    line = np.vstack([cc + np.array([np.sign(cc[0][0]) * 9.0, 4.0, 0]), angle[side]])
    P['lymph_vessels'].tube(line, 1.2, 0.0)
    cluster(P['nodes_neck'], line, 6, 9, lambda i, l=line: along(l, 0.0)[i], 5.0, (0.05, 0.8))
    sites[f'neck_{side}'] = line[len(line) // 2]

# --- the arm and the armpit: vessels along the arteries of the arm, the axillary group, the subclavian trunk
for side, sx in (('left', 1), ('right', -1)):
    sub = oriented(centerline(f'{side} subclavian artery', 8), start_near=angle[side])  # from the angle outwards
    br0 = oriented(centerline(f'{side} brachial artery', 12), top_first=True)
    axilla = br0[0] + np.array([-sx * 20.0, -6.0, 6.0])  # where the arm meets the chest wall
    keep = [p for p in sub[::-1] if np.linalg.norm(p - angle[side]) > 12 and abs(p[0]) < abs(axilla[0]) - 8]
    trunk = np.vstack([axilla] + [p + np.array([0, -6.0, -4.0]) for p in keep] + [angle[side]])
    d_ax = P['lymph_vessels'].tube(trunk, 1.5, 0.0)
    ax_pts = []
    for k in range(9):  # five textbook groups, drawn as nine nodes
        c = axilla + rng.normal(0, 1, 3) * np.array([11.0, 9.0, 15.0])
        P['nodes_axilla'].node(c, rng.uniform(9, 13), d_ax, (sx * 0.4, 0, 1)); ax_pts.append(c)
    sites[f'axilla_{side}'] = axilla
    arm = np.vstack([br0[::-1] + np.array([0, -5.0, 0]), axilla])  # from the elbow up
    d_elbow = P['lymph_vessels'].tube(arm, 1.0, d_ax)
    for k in range(2): P['nodes_axilla'].node(arm[0] + rng.normal(0, 5, 3), 8, d_elbow, (0, 0, 1))  # cubital nodes
    ra = oriented(centerline(f'{side} radial artery', 10), start_near=arm[0])
    P['lymph_vessels'].tube(np.vstack([ra[::-1], arm[0]]), 0.9, d_elbow)
    # the breast drains mostly to the armpit, and partly to the chain beside the sternum
    it = oriented(centerline(f'{side} internal thoracic artery', 10), top_first=True)
    para = np.vstack([it[::-1][2:] + np.array([0, -3.0, 0]), angle[side]])
    P['lymph_vessels'].tube(para, 1.0, 0.0)
    d_para = along(para, 0.0)
    cluster(P['nodes_chest'], para, 4, 7, lambda i, d=d_para: d[i], 3.0, (0.1, 0.6))
    breast = np.array([sx * 100.0, -205.0, 1185.0])  # behind the nipple of the HRA breast, as placed in the app
    for dz, dy in ((18.0, 0.0), (-6.0, -6.0), (-26.0, 0.0)):
        mid = (breast + axilla) / 2 + np.array([sx * 14.0, -34.0, dz])
        P['lymph_vessels'].tube(np.array([breast + np.array([sx * 8.0, dy, dz * 0.6]), mid, axilla + np.array([0, -8.0, dz * 0.3])]), 0.9, d_ax)
    j = len(para) // 2
    P['lymph_vessels'].tube(np.array([breast + np.array([-sx * 14.0, 6.0, 6.0]), (breast + para[j]) / 2 + np.array([0, -16.0, 4.0]), para[j]]), 0.9, float(d_para[j]))
    sites[f'breast_{side}'] = breast

# --- the chest: the nodes around the fork of the trachea, and a trunk on each side up to the venous angle
tr = oriented(centerline('trachea', 10), top_first=True)
carina = tr[-1]
for side, sx in (('left', 1), ('right', -1)):
    line = np.array([carina + np.array([sx * 16.0, 6.0, -14.0]), carina + np.array([sx * 16.0, 4.0, 30.0]), tr[len(tr) // 2] + np.array([sx * 18.0, 6.0, 0]), angle[side]])
    P['lymph_vessels'].tube(line, 1.2, 0.0)
    cluster(P['nodes_chest'], line, 5, 10, lambda i, l=line: along(l, 0.0)[i], 6.0, (0.0, 0.55))
sites['carina'] = carina

# --- the abdomen: nodes along the aorta, the mesenteric group, both feeding the cisterna chyli
for sx in (1, -1):
    line = np.vstack([ab[::-1][:-3] + np.array([sx * 15.0, -2.0, 0]), cisterna])
    P['lymph_vessels'].tube(line, 1.4, d_cisterna)
    cluster(P['nodes_abdomen'], line, 5, 11, lambda i, l=line: along(l, d_cisterna)[i], 4.0, (0.05, 0.8))
sm = oriented(centerline('superior mesenteric artery', 8), start_near=cisterna)
mes = np.vstack([sm[::-1], cisterna])
P['lymph_vessels'].tube(mes, 1.3, d_cisterna)
cluster(P['nodes_abdomen'], mes, 7, 9, lambda i: along(mes, d_cisterna)[i], 9.0, (0.0, 0.7))
d_aorta_low = float(along(np.vstack([ab[::-1][:-3], cisterna]), d_cisterna)[0])

# --- the pelvis and the leg: iliac nodes, the inguinal group at the groin, and vessels down the leg
for side, sx in (('left', 1), ('right', -1)):
    ci = oriented(centerline(f'{side} common iliac artery', 6), top_first=True)
    ei = oriented(centerline(f'{side} external iliac artery', 8), top_first=True)
    il = np.vstack([ei[::-1], ci[::-1], ab[-1] + np.array([sx * 15.0, -2.0, 0])])
    d_il = P['lymph_vessels'].tube(il, 1.4, d_aorta_low)
    cluster(P['nodes_groin'], il, 5, 10, lambda i, l=il: along(l, d_aorta_low)[i], 5.0, (0.15, 0.9))
    fe = oriented(centerline(f'{side} femoral artery', 14), top_first=True)
    groin = fe[0] + np.array([0, -10.0, -6.0])
    for k in range(6): P['nodes_groin'].node(groin + rng.normal(0, 1, 3) * np.array([13.0, 5.0, 14.0]), rng.uniform(9, 13), d_il, (0, 0, 1))
    sites[f'groin_{side}'] = groin
    po = oriented(centerline(f'{side} popliteal artery', 6), top_first=True)
    leg = np.vstack([po[::-1], fe[::-1][1:], groin, il[0]])
    d_knee = P['lymph_vessels'].tube(leg, 1.1, d_il)
    for k in range(2): P['nodes_groin'].node(po[len(po) // 2] + rng.normal(0, 4, 3), 8, d_knee, (0, 0, 1))  # popliteal nodes
    pt = oriented(centerline(f'{side} posterior tibial artery', 12), top_first=True)
    P['lymph_vessels'].tube(np.vstack([pt[::-1], po[-1]]), 0.9, d_knee)

meshes = {k: p.mesh() for k, p in P.items()}
print({k: (len(m.vertices), len(m.faces)) for k, m in meshes.items()})
print('longest path to the venous angle, m:', round(max(float(m.visual.uv[:, 0].max()) for m in meshes.values()), 3))


def write(scene, path):
    data = trimesh.exchange.gltf.export_glb(scene, include_normals=False)
    open(path, 'wb').write(data); return len(data)


# --- models/immune.glb: keep the scanned organs, replace any earlier lymph parts
sc = trimesh.load(os.path.join(OUT, 'immune.glb'), process=False)
out = trimesh.Scene()
for name, g in sc.geometry.items():
    if name in meshes: continue
    node = [n for n in sc.graph.nodes_geometry if sc.graph[n][1] == name][0]
    g = g.copy(); g.apply_transform(sc.graph[node][0]); g.visual = trimesh.visual.ColorVisuals(g)
    out.add_geometry(g, node_name=name, geom_name=name)
for name, m in meshes.items(): out.add_geometry(m, node_name=name, geom_name=name)
print('immune.glb', write(out, os.path.join(OUT, 'immune.glb')))

# --- models/body.glb: the immune overview gains the whole network, so the home body shows it
body = trimesh.load(os.path.join(OUT, 'body.glb'), process=False)
ov = trimesh.Scene()
base = os.path.join(OUT, 'immune-organs.npz')  # the scanned organs of the overview, kept once so the build can re-run
for name, g in body.geometry.items():
    node = [n for n in body.graph.nodes_geometry if body.graph[n][1] == name][0]
    g = g.copy(); g.apply_transform(body.graph[node][0])
    if name == 'immune':
        if os.path.exists(base): z = np.load(base); g = trimesh.Trimesh(z['v'], z['f'], process=False)
        else: np.savez_compressed(base, v=g.vertices, f=g.faces)
        allm = [trimesh.Trimesh(g.vertices, g.faces, process=False)] + [trimesh.Trimesh(m.vertices, m.faces, process=False) for m in meshes.values()]
        g = trimesh.util.concatenate(allm)
    g.visual = trimesh.visual.ColorVisuals(g)
    ov.add_geometry(g, node_name=name, geom_name=name)
print('body.glb', write(ov, os.path.join(OUT, 'body.glb')))
json.dump({k: [round(float(x), 1) for x in v] for k, v in sites.items()}, open(os.path.join(OUT, 'lymph-sites.json'), 'w'), indent=0)
print(json.dumps({k: [round(float(x), 1) for x in v] for k, v in sites.items()}))
