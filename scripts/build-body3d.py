# Builds models/<system>.glb and models/body.glb from BodyParts3D (CC BY 4.0, (c) DBCLS).
# Source: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
#   partof_BP3D_4.0_obj_99.zip (unzip to ./obj) and partof_element_parts.txt, next to the working dir.
# Run: pip install trimesh fast-simplification && python3 build-body3d.py <bp3d_dir> <repo>/models
# Names, roles and colours live in js/data.js (ANATOMY3D). Here only: which mesh files make each part.
import csv, os, re, sys, json
import numpy as np, trimesh, fast_simplification as fs

SRC, OUT = sys.argv[1], sys.argv[2]
D = os.path.join(SRC, 'obj', 'partof_BP3D_4.0_obj_99')
rows = [r for r in csv.reader(open(os.path.join(SRC, 'partof_element_parts.txt')), delimiter='\t')][1:]
byn = {}
for c, n, f in rows: byn.setdefault(n, set()).add(f)
N = lambda *names: set().union(*[byn.get(n, set()) for n in names])
U = lambda pred: set().union(*[v for n, v in byn.items() if pred(n)])
rx = lambda p: (lambda n: re.search(p, n) is not None)

heart = byn['heart']
coronary = U(lambda n: 'coronary artery' in n or n == 'right conus artery') & heart
cveins = U(lambda n: 'cardiac vein' in n or n in ('coronary sinus', 'right marginal vein', 'posterior vein of left ventricle')) & heart
lungs = N('right lung', 'left lung')
arteries = U(lambda n: ('artery' in n or 'arterial' in n) and 'pulmonary' not in n and 'segmental' not in n and 'coronary' not in n and 'hepatic' not in n) - heart - lungs
veins = U(lambda n: ('vein' in n or 'venous' in n) and 'pulmonary' not in n and 'segmental' not in n and 'portal' not in n and 'hepatic' not in n and 'cardiac' not in n) - heart - lungs
BONE = r'(bone|phalanx|femur|tibia|fibula|patella|humerus|radius|ulna|scapula|clavicle|vertebra|sacrum|coccyx|\brib\b|sternum|mandible|hyoid|costal cartilage|intervertebral)'
bones = U(lambda n: re.search(BONE, n) is not None and not re.search('artery|vein|nerve|marrow|muscle|ligament', n)) | N('rib cage', 'sternum', 'vertebral column', 'sacrum', 'mandible')
skull = (N('skull') & bones) | N('neurocranium', 'viscerocranium', 'mandible', 'hyoid bone')
skull -= N('left eyeball', 'right eyeball')
spine = N('vertebral column', 'sacrum') | U(lambda n: 'coccy' in n)
thorax = N('rib cage', 'sternum') - spine
pelvis = N('left hip bone', 'right hip bone')
arms = U(rx(r'(clavicle|scapula|humerus|radius|ulna|carpal|metacarpal|of (left|right) (thumb|index finger|middle finger|ring finger|little finger)$|phalanx of (left|right) (thumb|index|middle|ring|little) finger)')) & bones
legs = U(rx(r'(femur|patella|tibia|fibula|tars|metatarsal|calcaneus|talus|navicular|cuboid|cuneiform|toe$)')) & bones
# Each lung element goes by its most specific name: airway, artery or vein.
names_of = {}
for n, fs_ in byn.items():
    for f in fs_: names_of.setdefault(f, []).append(n)
spec = lambda f: min(names_of[f], key=lambda n: len(byn[n]))
airways = {f for f in lungs if 'bronch' in spec(f)} | N('right main bronchus', 'left main bronchus')
pa = {f for f in lungs - airways if 'arter' in spec(f)}
pv = {f for f in lungs - airways - pa if 'vein' in spec(f)}
print('lungs', len(lungs), 'airways', len(airways), 'arteries', len(pa), 'veins', len(pv), 'other', sorted({spec(f) for f in lungs - airways - pa - pv})[:6])

# system -> [(part id, element set, target faces)]
SYS = {
  'cardio': [
    ('lv', {'FJ2422', 'FJ2429', 'FJ2432', 'FJ2418'}, 9000), ('rv', {'FJ2423', 'FJ2419', 'FJ2430', 'FJ2437'}, 9000),
    ('la', {'FJ2425', 'FJ2438'}, 7000), ('ra', {'FJ2424', 'FJ2439'}, 7000),
    ('mitral', {'FJ2420'}, 3000), ('tricuspid', {'FJ2421', 'FJ2433', 'FJ2436'}, 3000),
    ('aorticv', {'FJ2426', 'FJ2431', 'FJ2435'}, 2000), ('pulmv', {'FJ2417', 'FJ2427', 'FJ2434'}, 2000),
    ('coronary', coronary, 9000), ('cveins', cveins, 4000),
    ('aorta', N('aorta'), 7000), ('pulmtrunk', N('pulmonary trunk'), 3000), ('svc', N('superior vena cava'), 2000),
    ('arteries', arteries - N('aorta'), 45000), ('veins', veins - N('superior vena cava'), 30000),
  ],
  'respiratory': [
    ('trachea', N('trachea'), 6000), ('airways', airways, 40000),
    ('pulmart', pa, 30000), ('pulmvein', pv, 25000), ('diaphragm', N('diaphragm'), 8000),
  ],
  'nervous': [
    ('cerebrum_r', N('right cerebral hemisphere'), 30000), ('cerebrum_l', N('left cerebral hemisphere'), 30000),
    ('cerebellum', N('cerebellum'), 14000), ('brainstem', N('brainstem'), 9000), ('diencephalon', N('diencephalon'), 5000),
    ('cord', N('spinal cord'), 3000), ('eyes', N('left eyeball', 'right eyeball'), 5000),
  ],
  'digestive': [
    ('esophagus', N('esophagus'), 3000), ('stomach', N('stomach'), 8000), ('liver', N('liver'), 22000),
    ('gallbladder', N('gallbladder'), 3000), ('pancreas', N('pancreas'), 6000),
    ('small', N('small intestine', 'duodenum', 'jejunum', 'ileum'), 22000),
    ('large', N('large intestine', 'rectum', 'cecum', 'appendix'), 18000),
  ],
  'skeletal': [
    ('skull', skull, 22000), ('spine', spine, 20000), ('thorax', thorax, 18000), ('pelvis', pelvis, 9000),
    ('arms', arms, 16000), ('legs', legs, 16000),
  ],
  'immune': [('thymus', N('thymus'), 4000)],
  'reproductive': [('prostate', N('prostate'), 3000), ('bladder', N('urinary bladder'), 3000)],
}
CONTEXT = [('skin', N('skin'), 12000)]

def load(els, tgt):
    ms = [trimesh.load(f'{D}/{e}.obj', force='mesh', process=False) for e in sorted(els) if os.path.exists(f'{D}/{e}.obj')]
    if not ms: return None
    m = trimesh.util.concatenate(ms); m.merge_vertices()
    v, f = m.vertices.astype(np.float32), m.faces.astype(np.int64)
    if len(f) > tgt: v, f = fs.simplify(v, f, target_reduction=1 - tgt / len(f))
    return trimesh.Trimesh(v, f, process=True)

def export(scene, path):
    data = trimesh.exchange.gltf.export_glb(scene, include_normals=False)
    open(path, 'wb').write(data)
    return len(data)

os.makedirs(OUT, exist_ok=True)
report = {}
overview = trimesh.Scene()
for sid, parts in SYS.items():
    sc = trimesh.Scene(); used = set(); allm = []
    for pid, els, tgt in parts:
        els = set(els) - used; used |= els
        m = load(els, tgt)
        if m is None: print('EMPTY', sid, pid); continue
        sc.add_geometry(m, node_name=pid, geom_name=pid); allm.append(m)
        report[f'{sid}:{pid}'] = [len(els), len(m.faces)]
    size = export(sc, os.path.join(OUT, f'{sid}.glb'))
    # Overview: the whole system merged, light enough to show all seven at once.
    merged = trimesh.util.concatenate(allm)
    tgt = {'skeletal': 14000, 'cardio': 14000, 'respiratory': 8000, 'nervous': 8000, 'digestive': 8000}.get(sid, 2000)
    v, f = merged.vertices.astype(np.float32), merged.faces.astype(np.int64)
    if len(f) > tgt: v, f = fs.simplify(v, f, target_reduction=1 - tgt / len(f))
    overview.add_geometry(trimesh.Trimesh(v, f, process=True), node_name=sid, geom_name=sid)
    print(f'{sid:13} {size/1e6:5.2f} MB', [(p, report[f"{sid}:{p}"]) for p, _, _ in parts if f'{sid}:{p}' in report])
for pid, els, tgt in CONTEXT:
    overview.add_geometry(load(els, tgt), node_name=pid, geom_name=pid)
size = export(overview, os.path.join(OUT, 'body.glb'))
print(f'body          {size/1e6:5.2f} MB')
json.dump(report, open(os.path.join(OUT, 'parts.json'), 'w'), indent=0)
