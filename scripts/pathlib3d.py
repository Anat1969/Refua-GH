"""Centre lines of the tubular structures in models/*.glb, for the moving carriers (egg, blood, air, food, urine, lymph, signals).
A centre line is found in two steps: the shortest way over the mesh surface between two ends, then each point is pulled
to the middle of its ring (the surface points at the same distance along the tube). Needs numpy, scipy, trimesh."""
import numpy as np, trimesh
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra, connected_components
from scipy.spatial import cKDTree


def load(path):
    s = trimesh.load(path, process=False)
    return {k: g for k, g in s.geometry.items()}


def graph(mesh, weld=0.0):
    """The surface graph. weld > 0 also joins vertices closer than that many mm: the models are made of many separate pieces
    (one per named artery, say) that touch at their ends, and this joins them into one tree."""
    v, f = np.asarray(mesh.vertices, float), np.asarray(mesh.faces)
    e = np.vstack([f[:, [0, 1]], f[:, [1, 2]], f[:, [2, 0]]])
    if weld > 0:
        pr = np.array(list(cKDTree(v).query_pairs(weld)), dtype=int).reshape(-1, 2)
        e = np.vstack([e, pr])
    w = np.linalg.norm(v[e[:, 0]] - v[e[:, 1]], axis=1) + 1e-3
    n = len(v)
    g = coo_matrix((np.r_[w, w], (np.r_[e[:, 0], e[:, 1]], np.r_[e[:, 1], e[:, 0]])), shape=(n, n)).tocsr()
    return v, g


def components(mesh, weld=0.0):
    v, g = graph(mesh, weld)
    n, lab = connected_components(g, directed=False)
    return v, g, n, lab


def nearest(v, p, mask=None):
    d = np.linalg.norm(v - np.asarray(p, float), axis=1)
    if mask is not None: d = np.where(mask, d, np.inf)
    return int(np.argmin(d))


def resample(pts, step=3.0):
    pts = np.asarray(pts, float)
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    keep = np.r_[True, seg > 1e-6]
    pts = pts[keep]
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    if d[-1] < 1e-6: return pts[:1]
    t = np.arange(0, d[-1], step); t = np.r_[t, d[-1]]
    return np.column_stack([np.interp(t, d, pts[:, i]) for i in range(3)])


def smooth(pts, k=2, passes=2):
    p = np.asarray(pts, float).copy()
    for _ in range(passes):
        q = p.copy()
        for i in range(len(p)):
            a, b = max(0, i - k), min(len(p), i + k + 1)
            q[i] = p[a:b].mean(axis=0)
        q[0], q[-1] = p[0], p[-1]
        p = q
    return p


def centre_line(mesh, a, b, radius=12.0, step=3.0, iters=3, v=None, g=None):
    """From the vertex nearest point a to the one nearest point b, along the tube. radius: how far a ring point may lie from the path point."""
    if v is None: v, g = graph(mesh)
    ia, ib = nearest(v, a), nearest(v, b)
    dist, pred = dijkstra(g, directed=False, indices=ia, return_predecessors=True)
    path = [ib]
    while path[-1] != ia and pred[path[-1]] >= 0: path.append(pred[path[-1]])
    path = path[::-1]
    P = resample(v[path], step)
    geo = dist
    tree = cKDTree(v)
    # pull each point to the middle of its ring: surface points at the same distance along the tube and near the point
    for _ in range(iters):
        Q = P.copy()
        for i, p in enumerate(P):
            idx = tree.query_ball_point(p, radius)
            if len(idx) < 6: continue
            idx = np.array(idx)
            d0 = geo[nearest(v, p)]
            sel = idx[np.abs(geo[idx] - d0) < max(step, radius * 0.35)]
            if len(sel) >= 6: Q[i] = v[sel].mean(axis=0)
        P = smooth(Q, 1, 1)
    return resample(P, step)


def tree_paths(mesh, root, leaves, radius=8.0, step=3.0, iters=2, v=None, g=None):
    """Centre lines of a branching tree: from the root point to each leaf point (leaves: a list of points)."""
    if v is None: v, g = graph(mesh)
    ir = nearest(v, root)
    dist, pred = dijkstra(g, directed=False, indices=ir, return_predecessors=True)
    tree = cKDTree(v)
    out = []
    for lp in leaves:
        il = nearest(v, lp)
        path = [il]
        while path[-1] != ir and pred[path[-1]] >= 0: path.append(pred[path[-1]])
        P = resample(v[path[::-1]], step)
        for _ in range(iters):
            Q = P.copy()
            for i, p in enumerate(P):
                idx = np.array(tree.query_ball_point(p, radius))
                if len(idx) < 6: continue
                d0 = dist[nearest(v, p)]
                sel = idx[np.abs(dist[idx] - d0) < radius * 0.5]
                if len(sel) >= 6: Q[i] = v[sel].mean(axis=0)
            P = smooth(Q, 1, 1)
        out.append(resample(P, step))
    return out


def spread_points(v, g, root, n, min_sep=30.0, mask=None):
    """n leaf points of a tree: the farthest from the root along the surface first, each at least min_sep mm from the others."""
    ir = nearest(v, root)
    dist = dijkstra(g, directed=False, indices=ir)
    ok = np.isfinite(dist) if mask is None else (np.isfinite(dist) & mask)
    chosen = []
    for i in np.argsort(-np.where(ok, dist, -1)):
        if not ok[i]: break
        if all(np.linalg.norm(v[i] - v[j]) >= min_sep for j in chosen):
            chosen.append(int(i))
            if len(chosen) == n: break
    return [v[i] for i in chosen]


def submesh(mesh, mask):
    """The part of a mesh whose vertices are all in mask (faces kept), as a new mesh."""
    f = np.asarray(mesh.faces); keep = mask[f].all(axis=1)
    m = trimesh.Trimesh(np.asarray(mesh.vertices), f[keep], process=False)
    m.remove_unreferenced_vertices(); return m
