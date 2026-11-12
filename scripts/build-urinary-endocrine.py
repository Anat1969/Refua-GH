# Builds models/urinary.glb and models/endocrine.glb from BodyParts3D (CC BY 4.0, (c) DBCLS), and adds both
# systems to the whole-body overview in models/body.glb.
#
# Urinary: kidneys, ureters, bladder, renal arteries. Endocrine: pituitary, pineal, adrenals, pancreas.
# The thyroid is the one gap: BodyParts3D has no thyroid gland, and the Human Reference Atlas file was not
# fetched, so it is a SCHEMA, two lobes and an isthmus, set on the trachea of the model, at its textbook place
# (Gray's Anatomy). The app says so on the stage (ANATOMY3D.endocrine.gap_he) and in the part's model line.
#
# Run: pip install trimesh numpy fast-simplification && python3 scripts/build-urinary-endocrine.py <bp3d_dir> models
#   <bp3d_dir> holds obj/partof_BP3D_4.0_obj_99/*.obj and partof_element_parts.txt (see build-body3d.py).
import csv, os, sys
import numpy as np, trimesh, fast_simplification as fs

SRC, OUT = sys.argv[1], sys.argv[2]
D = os.path.join(SRC, 'obj', 'partof_BP3D_4.0_obj_99')
byn = {}
for c, n, f in list(csv.reader(open(os.path.join(SRC, 'partof_element_parts.txt')), delimiter='\t'))[1:]:
    byn.setdefault(n, set()).add(f)


def bp(names, target):
    """Several BodyParts3D parts as one mesh, simplified to about `target` triangles."""
    els = set().union(*[byn[n] for n in names])
    ms = [trimesh.load(os.path.join(D, f + '.obj'), process=False) for f in sorted(els)]
    m = trimesh.util.concatenate(ms)
    v, f = np.asarray(m.vertices, dtype=np.float32), np.asarray(m.faces, dtype=np.int32)
    if len(f) > target: v, f = fs.simplify(v, f, target_reduction=1 - target / len(f))
    return trimesh.Trimesh(v, f, process=False)


def ellipsoid(c, r, ax=(0, 0, 1)):
    s = trimesh.creation.icosphere(subdivisions=2)
    v = s.vertices * np.array(r)
    R = trimesh.geometry.align_vectors([0, 0, 1], np.asarray(ax, float))[:3, :3]
    return trimesh.Trimesh(v @ R.T + np.asarray(c), s.faces, process=False)


def trachea_front():
    v = np.vstack([trimesh.load(os.path.join(D, f + '.obj'), process=False).vertices for f in byn['trachea']])
    return v[:, 1].min(), v[:, 2].min(), v[:, 2].max()


y0, z0, z1 = trachea_front()
zt = z1 - 28  # the lobes lie beside the upper trachea, below the larynx
thyroid = trimesh.util.concatenate([
    ellipsoid((22, y0 + 8, zt), (8, 7, 22), (0.15, 0, 1)),
    ellipsoid((-22, y0 + 8, zt), (8, 7, 22), (-0.15, 0, 1)),
    ellipsoid((0, y0 + 4, zt - 12), (14, 4, 4)),  # the isthmus, across the trachea
])

URINARY = {
    'kidneys': bp(['left kidney', 'right kidney'], 5200),
    'ureters': bp(['left ureter', 'right ureter'], 1600),
    'bladder': bp(['urinary bladder'], 1800),
    'renal_arteries': bp(['left renal artery', 'right renal artery'], 3200),
}
ENDOCRINE = {
    'pituitary': bp(['pituitary gland'], 700),
    'pineal': bp(['pineal body'], 400),
    'thyroid': thyroid,
    'adrenals': bp(['left adrenal gland', 'right adrenal gland'], 2000),
    'pancreas': bp(['pancreas'], 4200),
}


def write(scene, path):
    data = trimesh.exchange.gltf.export_glb(scene, include_normals=False)
    open(path, 'wb').write(data); return len(data)


def system_scene(parts):
    sc = trimesh.Scene()
    for name, m in parts.items():
        m = m.copy(); m.visual = trimesh.visual.ColorVisuals(m)
        sc.add_geometry(m, node_name=name, geom_name=name)
    return sc


for sid, parts in (('urinary', URINARY), ('endocrine', ENDOCRINE)):
    print(sid, {k: len(m.faces) for k, m in parts.items()}, write(system_scene(parts), os.path.join(OUT, f'{sid}.glb')), 'bytes')

# --- the whole-body overview: one light mesh per system
body = trimesh.load(os.path.join(OUT, 'body.glb'), process=False)
ov = trimesh.Scene()
for name, g in body.geometry.items():
    if name in ('urinary', 'endocrine'): continue
    node = [n for n in body.graph.nodes_geometry if body.graph[n][1] == name][0]
    g = g.copy(); g.apply_transform(body.graph[node][0]); g.visual = trimesh.visual.ColorVisuals(g)
    ov.add_geometry(g, node_name=name, geom_name=name)
for sid, parts in (('urinary', URINARY), ('endocrine', ENDOCRINE)):
    m = trimesh.util.concatenate([trimesh.Trimesh(p.vertices, p.faces, process=False) for p in parts.values()])
    m.visual = trimesh.visual.ColorVisuals(m)
    ov.add_geometry(m, node_name=sid, geom_name=sid)
print('body.glb', write(ov, os.path.join(OUT, 'body.glb')), 'bytes')
