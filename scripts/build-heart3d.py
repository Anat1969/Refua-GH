# Builds lab/heart.glb from BodyParts3D (CC BY 4.0, DBCLS): download partof_BP3D_4.0_obj_99.zip and partof_element_parts.txt
# from https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html, unzip next to this script, then: pip install trimesh fast-simplification

import csv, json, numpy as np, trimesh, fast_simplification as fs
D='obj/partof_BP3D_4.0_obj_99'
rows=[r for r in csv.reader(open('partof_elem.txt'),delimiter='\t')][1:]
byn={}
for c,n,f in rows: byn.setdefault(n,set()).add(f)
heart=byn['heart']
def names(pred): return {f for n,fs_ in byn.items() if pred(n) for f in fs_}
coronA=names(lambda n:'coronary artery' in n or n=='right conus artery') & heart
veins=names(lambda n:'cardiac vein' in n or n in('coronary sinus','right marginal vein','posterior vein of left ventricle')) & heart
G=[ # id, elements, target faces
 ('lv', {'FJ2422','FJ2429','FJ2432','FJ2418'}, 9000),
 ('rv', {'FJ2423','FJ2419','FJ2430','FJ2437'}, 9000),
 ('la', {'FJ2425','FJ2438'}, 7000),
 ('ra', {'FJ2424','FJ2439'}, 7000),
 ('mitral', {'FJ2420'}, 3000),
 ('tricuspid', {'FJ2421','FJ2433','FJ2436'}, 3000),
 ('aorticv', {'FJ2426','FJ2431','FJ2435'}, 2000),
 ('pulmv', {'FJ2417','FJ2427','FJ2434'}, 2000),
 ('coronary', coronA, 9000),
 ('cveins', veins, 4000),
 ('aorta', {'FJ3413','FJ3411'}, 6000),
 ('pulmtrunk', {'FJ2966'}, 3000),
 ('svc', {'FJ3645'}, 2000),
 ('ribs', byn['rib cage'], 16000),
 ('skin', byn['skin'], 14000),
]
used=set(); scene=trimesh.Scene(); meta={}
for gid, els, tgt in G:
    els=sorted(e for e in els if e not in used); used|=set(els)
    ms=[trimesh.load(f'{D}/{e}.obj', force='mesh', process=False) for e in els]
    m=trimesh.util.concatenate(ms); m.merge_vertices()
    v,f=m.vertices.astype(np.float32), m.faces.astype(np.int64)
    if len(f)>tgt:
        v,f=fs.simplify(v,f,target_reduction=1-tgt/len(f))
    mm=trimesh.Trimesh(v,f,process=True)
    scene.add_geometry(mm, node_name=gid, geom_name=gid)
    meta[gid]={'elements':els,'faces':len(mm.faces)}
    print(gid,len(els),len(m.faces),'->',len(mm.faces))
missing=sorted(heart-used); print('heart elements not grouped:',missing)
scene.export('heart.glb')
import os; print(os.path.getsize('heart.glb')/1e6,'MB')
print('bounds',scene.bounds)
