// Carriers: small bodies that travel along the centre lines of the 3D model (models/paths.json, built by scripts/build-paths.py).
// They show what each system carries: the egg in the tube, blood in the heart, air in the airways, food in the gut, urine, lymph, signals.
// Everything is drawn from a spec in MOTION3D[system].carriers (js/data.js). Positions are in the body frame, in millimetres.
//   stream:    n bodies spread along a line, moving at speed mm/s. pulse: { rate, amp, phase } makes them surge with a beat.
//   cycle:     the egg: a follicle grows on the ovary, the egg is released, caught, carried along the tube, and enters the uterus.
// Colour is one colour, or stops [[fraction, colour], ...] along the line. hide: [[from, to], ...] fractions where the body is out of sight.

const TAU = Math.PI * 2;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function makeCarriers(THREE, { body, cut, paths, specs, reduced }) {
  const group = new THREE.Group(); group.renderOrder = 5; body.add(group);
  const dummy = new THREE.Object3D();
  const geo = new THREE.SphereGeometry(1, 12, 9);
  const mats = [];
  const basic = (opts = {}) => { const m = new THREE.MeshBasicMaterial({ toneMapped: false, clippingPlanes: [cut], depthTest: false, ...opts }); mats.push(m); return m; }; // depthTest off: the organs around the bodies are faint, and a body behind a wall would hide the story

  // ---- a line: points and the distance along it
  const lines = {};
  const line = (name) => {
    if (lines[name]) return lines[name];
    const raw = name.split('+').flatMap((n) => { const rev = n.startsWith('~'); const p = paths[rev ? n.slice(1) : n] || []; return rev ? [...p].reverse() : p; });
    const pts = raw.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    return (lines[name] = { pts, cum, total: cum[cum.length - 1] || 1 });
  };
  const at = (L, s, out) => {
    s = Math.min(L.total, Math.max(0, s));
    let lo = 0, hi = L.cum.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (L.cum[mid] <= s) lo = mid; else hi = mid; }
    const span = L.cum[hi] - L.cum[lo] || 1, k = (s - L.cum[lo]) / span;
    return out.lerpVectors(L.pts[lo], L.pts[hi], k);
  };
  const colourAt = (stops, f, out) => {
    if (stops.length === 1) return out.copy(stops[0][1]);
    let i = 0; while (i < stops.length - 1 && stops[i + 1][0] <= f) i++;
    const a = stops[i], b = stops[Math.min(i + 1, stops.length - 1)];
    return out.copy(a[1]).lerp(b[1], b[0] === a[0] ? 0 : smooth(a[0], b[0], f));
  };

  const parts = [];
  for (const spec of specs) {
    if (spec.kind === 'stream') parts.push(stream(spec));
    else if (spec.kind === 'cycle') parts.push(cycle(spec));
    else if (spec.kind === 'tide') parts.push(tide(spec));
    if (spec.route) for (const name of spec.paths || [spec.path]) {            // a faint line where the route is only a schema
      const L = line(name); const g = new THREE.BufferGeometry().setFromPoints(L.pts);
      const m = basic({ color: spec.color || '#ffffff', transparent: true, opacity: 0.32, depthWrite: false });
      const ln = new THREE.Line(g, m); ln.frustumCulled = false; group.add(ln);
    }
  }

  // Tide: the bodies move out along their lines and back, together (the air of a breath). rate: breaths a second.
  function tide(spec) {
    const items = spec.paths.map((name) => ({ L: line(name), n: spec.n || 4 }));
    const count = items.reduce((a, b) => a + b.n, 0);
    const mesh = new THREE.InstancedMesh(geo, basic({ color: spec.color || '#ffffff' }), count); mesh.frustumCulled = false; group.add(mesh);
    const pos = new THREE.Vector3(), size = spec.size || 2;
    return {
      update(t) {
        const f = 0.5 - 0.5 * Math.cos(TAU * (spec.rate || 0.2) * t);       // 0 out, 1 in: the same phase as the diaphragm in MOTION3D
        let k = 0;
        for (const { L, n } of items) for (let i = 0; i < n; i++, k++) {
          const s = L.total * f * ((i + 1) / n);
          at(L, s, pos); dummy.position.copy(pos); dummy.scale.setScalar(size * smooth(0, 14, s)); dummy.updateMatrix(); mesh.setMatrixAt(k, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true; return null;
      },
    };
  }

  function stream(spec) {
    const names = spec.paths || [spec.path];
    const items = names.map((name) => {
      const L = line(name); const n = spec.n || Math.max(1, Math.round(L.total / (spec.gap || 40)));
      return { L, n };
    });
    const count = items.reduce((a, b) => a + b.n, 0);
    const mesh = new THREE.InstancedMesh(geo, basic(), count); mesh.frustumCulled = false; mesh.count = count;
    group.add(mesh);
    const stops = (spec.stops || [[0, spec.color || '#ffffff']]).map(([f, c]) => [f, new THREE.Color(c)]);
    const col = new THREE.Color(), pos = new THREE.Vector3();
    const w = TAU * (spec.pulse?.rate || 0);
    const dir = spec.dir || 1, speed = spec.speed || 60, size = spec.size || 2.5, fadeLen = spec.fade ?? 10;
    const hide = spec.hide || [];
    return {
      update(t) {
        let k = 0;
        for (const { L, n } of items) {
          const travel = spec.pulse && !reduced ? speed * (t - (spec.pulse.amp || 0.5) * Math.cos(w * t + (spec.pulse.phase || 0)) / w) : speed * t;
          for (let i = 0; i < n; i++, k++) {
            let s = ((i / n) * L.total + dir * travel) % L.total; if (s < 0) s += L.total;
            const f = s / L.total;
            let sc = size * Math.min(smooth(0, fadeLen, s), smooth(0, fadeLen, L.total - s));
            for (const [a, b] of hide) if (f > a && f < b) sc = 0;
            at(L, s, pos);
            dummy.position.copy(pos); dummy.scale.setScalar(sc * (spec.pulse ? 0.8 + 0.2 * Math.sin(w * t + i) : 1)); dummy.updateMatrix();
            mesh.setMatrixAt(k, dummy.matrix);
            mesh.setColorAt(k, colourAt(stops, dir > 0 ? f : 1 - f, col));
          }
        }
        mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        return null;
      },
    };
  }

  // The egg. One round: the follicle grows, the egg leaves the ovary, the tube takes it to the uterus. The sides alternate.
  function cycle(spec) {
    const T = { grow: 3.4, release: 0.9, hop: 1.6, tube: 10, enter: 2.4, rest: 1.6, ...spec.times };
    const total = T.grow + T.release + T.hop + T.tube + T.enter + T.rest;
    const follicle = new THREE.Mesh(geo, basic({ color: spec.follicle || '#ffe9a8', transparent: true, opacity: 0.55, depthWrite: false })); follicle.frustumCulled = false;
    const egg = new THREE.Mesh(geo, basic({ color: spec.color || '#fff7d0' })); egg.frustumCulled = false;
    const halo = new THREE.Mesh(geo, basic({ color: spec.halo || '#ffd84a', transparent: true, opacity: 0.35, depthWrite: false })); halo.frustumCulled = false;
    group.add(follicle, egg, halo);
    const p = new THREE.Vector3(), q = new THREE.Vector3(), r = new THREE.Vector3();
    return {
      update(t) {
        const k = Math.floor(t / total), side = spec.sides[k % spec.sides.length], u = t - k * total;
        const tube = line('tube_' + side), ov = paths['ovary_' + side]; if (!ov) return null;
        const centre = new THREE.Vector3(...ov[0]), surf = new THREE.Vector3(...ov[1]);
        const tStart = T.grow + T.release, tHop = tStart + T.hop, tTube = tHop + T.tube, tIn = tTube + T.enter;
        follicle.visible = egg.visible = halo.visible = false;
        let stage = 0;
        if (u < T.grow) {                                   // the follicle ripens at the surface of the ovary
          const g = smooth(0, T.grow, u);
          follicle.visible = true; follicle.position.copy(centre).lerp(surf, 0.55 + 0.4 * g); follicle.scale.setScalar(1.5 + 7.5 * g);
          egg.visible = true; egg.position.copy(follicle.position); egg.scale.setScalar(1.2 + 0.8 * g);
          stage = 0;
        } else if (u < tStart) {                            // ovulation: the follicle opens, the egg leaves
          const g = smooth(0, T.release, u - T.grow);
          follicle.visible = g < 0.8; follicle.position.copy(centre).lerp(surf, 0.95); follicle.scale.setScalar(9 * (1 - g * 0.6)); follicle.material.opacity = 0.55 * (1 - g);
          egg.visible = halo.visible = true; egg.position.copy(surf).addScaledVector(r.subVectors(surf, centre).normalize(), 4 * g); egg.scale.setScalar(3.6); halo.position.copy(egg.position); halo.scale.setScalar(3.6 + 6 * g);
          stage = 1;
        } else if (u < tHop) {                              // the fimbriae catch it, at the open end of the tube
          const g = smooth(0, T.hop, u - tStart);
          const from = r.subVectors(surf, centre).normalize().multiplyScalar(4).add(surf);
          q.set(...paths['tube_' + side][0]);
          egg.visible = halo.visible = true; egg.position.lerpVectors(from, q, g); egg.scale.setScalar(3.6); halo.position.copy(egg.position); halo.scale.setScalar(8 + 1.5 * Math.sin(g * Math.PI));
          stage = 2;
        } else if (u < tTube) {                             // along the tube, helped by the cilia and the wall: in small steps, not in a glide
          const g = (u - tHop) / T.tube, step = g + 0.012 * Math.sin(g * 60);
          at(tube, tube.total * Math.min(1, Math.max(0, step)), p);
          egg.visible = halo.visible = true; egg.position.copy(p); egg.scale.setScalar(3.6); halo.position.copy(p); halo.scale.setScalar(8);
          stage = 3;
        } else if (u < tIn) {                               // into the cavity of the uterus
          const g = smooth(0, T.enter, u - tTube);
          const cav = line('cavity'); at(tube, tube.total, p); at(cav, cav.total * 0.5, q);
          egg.visible = halo.visible = true; egg.position.lerpVectors(p, q, g); egg.scale.setScalar(3.6 * (1 - 0.5 * g)); halo.position.copy(egg.position); halo.scale.setScalar(8 * (1 - g));
          stage = 4;
        } else stage = 5;
        return stage < 5 ? spec.stages[stage] : spec.stages[4];
      },
    };
  }

  return {
    group,
    update(t) { let stage = null; for (const p of parts) { const s = p.update(t); if (s) stage = s; } return stage; },
    dispose() { body.remove(group); group.traverse((o) => { if (o.isInstancedMesh) o.dispose(); }); mats.forEach((m) => m.dispose()); geo.dispose(); },
  };
}
