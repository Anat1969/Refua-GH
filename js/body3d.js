// The real body in 3D: BodyParts3D models (CC BY 4.0, © DBCLS), one per system, loaded on demand.
// Two looks: ink (porcelain and ink outline, the app's DNA) and tissue (anatomical colour, wet light).
// Three.js comes from cdnjs through the import map in index.html; the add-ons are vendored (MIT).
// If WebGL or the library is missing, mountAtlas throws and the 2D sheets stay.
import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { ANATOMY3D, MODEL_CREDIT, MODEL_SOURCES, SOURCES } from './data.js';

const INK = '#16202b', NAVY = '#1f4e79', PORCELAIN = '#fbf8f2', GHOST_INK = '#c4cad2';
const LOOK_KEY = 'refua.look3d', SEX_KEY = 'refua.sex3d';
const VIEW = { front: [0, 0.12, 1], side: [-1, 0.1, 0.08], back: [0, 0.12, -1] };

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const loadGLB = (() => { const l = new GLTFLoader(); return (url) => new Promise((res, rej) => l.load(url, res, undefined, rej)); })();

// Ink outline: an inverted hull, pushed out along the normals, drawn in ink, and cut with the rest.
function outlineMat(cut, w) {
  return new THREE.ShaderMaterial({
    uniforms: { w: { value: w }, ink: { value: new THREE.Color(INK) }, a: { value: 1 } },
    vertexShader: `uniform float w;
      #include <clipping_planes_pars_vertex>
      void main(){ vec3 p = position + normal * w; vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
      #include <clipping_planes_vertex>
      }`,
    fragmentShader: `uniform vec3 ink; uniform float a;
      #include <clipping_planes_pars_fragment>
      void main(){
      #include <clipping_planes_fragment>
      gl_FragColor = vec4(ink, a); }`,
    side: THREE.BackSide, clipping: true, clippingPlanes: [cut], transparent: true,
  });
}

export async function mountAtlas(host, systems, { selected, onPick, reduced }) {
  if (!webglOK()) throw new Error('webgl');
  const sysName = (id) => systems.find((s) => s.id === id)?.short_he || systems.find((s) => s.id === id)?.name_he || id;
  let look = 'ink';
  let sex = 'f';
  try { look = localStorage.getItem(LOOK_KEY) === 'tissue' ? 'tissue' : 'ink'; sex = localStorage.getItem(SEX_KEY) === 'm' ? 'm' : 'f'; } catch { /* private mode */ }

  host.innerHTML = `
    <div class="atlas-labels" role="group" aria-label="מערכות בגוף">${systems.map((s) => `<button class="atlas-label press-soft" data-id="${s.id}" aria-pressed="false">${esc(s.short_he || s.name_he)}</button>`).join('')}</div>
    <div class="b3-tools" role="group" aria-label="מראה וחתך">
      <div class="b3-seg"><button data-b3-look="ink">דיו</button><button data-b3-look="tissue">רקמה</button></div>
      <label class="b3-cut"><span>חתך</span><input type="range" min="0" max="100" value="0" aria-label="חתך מלפנים לאחור"></label>
    </div>
    <div class="b3-tip" hidden></div>
    <div class="b3-pin" hidden><b></b><i></i></div>
    <section class="b3-card" aria-live="polite"></section>
    <p class="b3-credit"><a href="${MODEL_CREDIT.url}" target="_blank" rel="noopener">${esc(MODEL_CREDIT.he)}</a></p>
    <p class="atlas-wait">טוען את הגוף…</p>`;
  const $ = (s) => host.querySelector(s);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0xffffff, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.localClippingEnabled = true;
  renderer.domElement.className = 'atlas-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight('#fff4ea', 2.2); key.position.set(-1, 1.2, 1.4);
  const rim = new THREE.DirectionalLight('#9fc3ff', 1.2); rim.position.set(1.2, 0.4, -1.2);
  scene.add(key, rim, new THREE.HemisphereLight('#ffffff', '#3a2a2a', 0.5));
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 20000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduced; controls.dampingFactor = 0.1;

  const cut = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e6);
  const body = new THREE.Group(); body.rotation.x = -Math.PI / 2; // BodyParts3D: z up, millimetres
  scene.add(body);

  // Overview: every system, light, for context. Detail: the selected system, part by part.
  const over = {}; const detail = {}; const loading = {};
  let sel = selected, part = null, isolate = false, partsOpen = false, hl = [], hlLabel = '';
  // Parts shown for the chosen body: the reproductive system has a woman's and a man's set.
  const showsPart = (p) => !p.sex || p.sex === sex;
  const partsOf = (id) => (ANATOMY3D[id]?.parts || []).filter(showsPart);
  const femaleBody = () => sel === 'reproductive' && sex === 'f' && !!detail.reproductive;
  const tint = (id) => ANATOMY3D[id]?.parts[0]?.tissue || '#c9b8a8';

  function materialFor(color, ghost) {
    let m;
    if (look === 'ink') m = new THREE.MeshStandardMaterial({ color: ghost ? '#ffffff' : PORCELAIN, roughness: 0.92, metalness: 0 });
    else m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, metalness: 0, clearcoat: ghost ? 0 : 0.5, clearcoatRoughness: 0.35 });
    m.side = THREE.DoubleSide; m.clippingPlanes = [cut];
    // Inner walls, revealed by the cut, are darker: the cut reads as depth.
    m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  if (!gl_FrontFacing) diffuseColor.rgb *= 0.5;'); };
    if (ghost) Object.assign(m, { transparent: true, opacity: look === 'ink' ? 0.07 : 0.09, depthWrite: false });
    return m;
  }
  function addMesh(mesh, color, ghost) {
    mesh.geometry.computeVertexNormals();
    mesh.material = materialFor(color, ghost);
    const ol = new THREE.Mesh(mesh.geometry, outlineMat(cut, 0.6)); ol.raycast = () => {};
    mesh.add(ol); mesh.userData.outline = ol; mesh.userData.color = color;
  }
  function restyle() {
    host.classList.toggle('is-tissue', look === 'tissue');
    host.querySelectorAll('[data-b3-look]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.b3Look === look)));
    renderer.toneMappingExposure = look === 'ink' ? 0.95 : 1;
    scene.environmentIntensity = look === 'ink' ? 0.9 : 0.45;
    const hasDetail = !!detail[sel];
    for (const [id, m] of Object.entries(over)) {
      const ctx = id === 'skin';
      const isSel = id === sel;
      m.visible = !(isSel && hasDetail) && !(ctx && femaleBody());
      const ghost = ctx || !isSel;
      m.material.dispose(); m.material = materialFor(ctx ? '#f2dccb' : tint(id), ghost);
      if (ctx) m.material.opacity = look === 'ink' ? 0.05 : 0.08;
      const ol = m.userData.outline;
      ol.visible = look === 'ink' && !ghost;
      ol.material.uniforms.ink.value.set(ghost ? GHOST_INK : INK);
      ol.material.uniforms.a.value = ghost ? 0.35 : 1;
      ol.material.uniforms.w.value = ghost ? 0.8 : 0.6;
    }
    for (const [id, d] of Object.entries(detail)) {
      d.group.visible = id === sel;
      if (id !== sel) continue;
      if (d.skin) {
        d.skin.visible = femaleBody();
        d.skin.material.dispose(); d.skin.material = materialFor('#f2dccb', true); d.skin.material.opacity = look === 'ink' ? 0.05 : 0.08;
        d.skin.userData.outline.visible = false;
      }
      for (const [pid, m] of Object.entries(d.meshes)) {
        const info = ANATOMY3D[id].parts.find((q) => q.id === pid);
        m.visible = showsPart(info);
        const on = pid === part || hl.includes(pid);
        const faded = (isolate && part && !on) || (hl.length > 0 && !on);
        m.material.dispose(); m.material = materialFor(m.userData.color, faded);
        if (faded) m.material.opacity = 0.12;
        if (on && look === 'ink') m.material.color.set('#dfe8f2');
        if (on && look === 'tissue') m.material.emissive = new THREE.Color('#3a1410');
        const ol = m.userData.outline;
        ol.visible = look === 'ink';
        ol.material.uniforms.ink.value.set(on ? NAVY : INK);
        ol.material.uniforms.a.value = faded ? 0.15 : 1;
        ol.material.uniforms.w.value = on ? 1 : 0.6;
      }
    }
    host.querySelectorAll('.atlas-label').forEach((b) => { const on = b.dataset.id === sel; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    card(); request();
  }

  function card() {
    const A = ANATOMY3D[sel];
    const c = $('.b3-card');
    if (!A) { c.innerHTML = ''; return; }
    const list = partsOf(sel);
    const sexSeg = sel === 'reproductive' ? `<div class="b3-seg b3-sex" role="group" aria-label="גוף"><button data-b3-sex="f" aria-pressed="${sex === 'f'}">אישה</button><button data-b3-sex="m" aria-pressed="${sex === 'm'}">גבר</button></div>` : '';
    const lit = hl.map((id) => A.parts.find((p) => p.id === id)).filter(Boolean);
    const litBlock = lit.length ? `<p class="b3-k">${esc(hlLabel)}: <span class="b3-lit">${lit.map((p) => `<button class="b3-part" data-part="${p.id}">${esc(p.he)}</button>`).join('<span>, </span>')}</span></p><p class="b3-hint">מואר בגוף. השאר שקוף.</p>` : '';
    if (!part) {
      c.innerHTML = `${sexSeg}${litBlock}<details class="b3-more"${partsOpen ? ' open' : ''}><summary><b>${list.length} מבנים</b> במודל</summary>
        <ul class="b3-parts">${list.map((p) => `<li><button class="b3-part" data-part="${p.id}"><span class="b3-sw" style="--c:${p.tissue}"></span>${esc(p.he)}</button></li>`).join('')}</ul>
        ${A.gap_he ? `<p class="b3-gap">${esc(A.gap_he)}</p>` : ''}</details>`;
      c.querySelector('details').addEventListener('toggle', (e) => { partsOpen = e.target.open; });
      return;
    }
    const p = A.parts.find((x) => x.id === part);
    const src = SOURCES[p.source_id];
    c.innerHTML = `<button class="b3-x" data-part-clear aria-label="סגירה">×</button>
      <h4>${esc(p.he)}</h4><p class="b3-en" dir="ltr">${esc(p.en)}</p>
      <p class="b3-role">${esc(p.text_he)}</p>
      <p class="b3-meta"><span class="b3-layer">ידוע</span><span dir="ltr">${esc(src.title)}, ${src.year}</span><span>מודל: <span dir="ltr">${esc(MODEL_SOURCES[p.model || 'bp3d'])}</span></span></p>
      <label class="b3-iso"><input type="checkbox" ${isolate ? 'checked' : ''} data-iso> לבודד, והשאר שקוף</label>`;
  }

  // Camera: fly to a box, from a direction, in world space.
  let fly = null;
  function boxOf(id) {
    const b = new THREE.Box3();
    const d = detail[id];
    const A = ANATOMY3D[id];
    const focus = id === sel && hl.length ? hl : (sex === 'm' && A?.focus_m ? A.focus_m : A?.focus || []);
    if (d) focus.forEach((pid) => d.meshes[pid] && b.expandByObject(d.meshes[pid]));
    if (b.isEmpty() && over[id]) b.expandByObject(over[id]);
    return b;
  }
  function frameBox(b, dirv, pad = 3) {
    if (b.isEmpty()) return;
    const c = b.getCenter(new THREE.Vector3());
    // Distance from the field of view, so the bounding sphere fits; pad scales it.
    const r = Math.max(b.getSize(new THREE.Vector3()).length() * 0.5, 40);
    const half = THREE.MathUtils.degToRad(camera.fov / 2);
    const dist = (r / Math.sin(Math.min(half, Math.atan(Math.tan(half) * camera.aspect)))) * pad;
    const to = { t: c, p: c.clone().add(new THREE.Vector3(...dirv).normalize().multiplyScalar(dist)) };
    camera.near = dist / 60; camera.far = dist * 30; camera.updateProjectionMatrix();
    if (reduced || !fly && camera.position.lengthSq() === 0) { controls.target.copy(to.t); camera.position.copy(to.p); request(); return; }
    fly = { t0: performance.now(), from: { t: controls.target.clone(), p: camera.position.clone() }, to };
    request();
  }
  let view = 'front';
  const PAD = { skeletal: 0.7, cardio: 1.15, immune: 2.2, reproductive: 2.2 };
  const frameSel = () => frameBox(boxOf(sel), VIEW[view], PAD[sel] || 0.82);
  function setCut(v) {
    if (!+v) { cut.constant = 1e6; request(); return; }
    const b = boxOf(sel);
    cut.constant = b.max.z + 2 + (b.min.z - b.max.z - 4) * (v / 100); // world z: front of the body faces +z
    request();
  }

  async function ensureDetail(id) {
    if (detail[id] || !ANATOMY3D[id]) return;
    loading[id] ||= loadGLB(`models/${id}.glb`).then((g) => {
      const meshes = {}; const group = new THREE.Group();
      const colors = Object.fromEntries(ANATOMY3D[id].parts.map((p) => [p.id, p.tissue]));
      let skin = null;
      const list = []; g.scene.traverse((o) => { if (o.isMesh && colors[o.name]) list.push(o); else if (o.isMesh && o.name.startsWith('skin')) skin = o; });
      // A context skin (the woman's body for the reproductive system): a ghost, never a part.
      if (skin) { addMesh(skin, '#f2dccb', true); skin.raycast = () => {}; }
      list.forEach((o) => { addMesh(o, colors[o.name], false); o.userData.part = o.name; o.userData.sys = id; meshes[o.name] = o; group.add(o); });
      if (skin) group.add(skin);
      body.add(group); scene.updateMatrixWorld(true);
      detail[id] = { group, meshes, skin };
    });
    await loading[id];
  }

  // Load the overview first, so the body is on screen fast; then the selected system in detail.
  const g = await loadGLB('models/body.glb');
  const list = []; g.scene.traverse((o) => { if (o.isMesh) list.push(o); });
  list.forEach((o) => { addMesh(o, o.name === 'skin' ? '#f2dccb' : tint(o.name), true); o.userData.sys = o.name; over[o.name] = o; body.add(o); });
  scene.updateMatrixWorld(true);
  $('.atlas-wait').hidden = true;

  let lastKey = '';
  async function select(id, opts = {}) {
    if (!id) return;
    const key = [id, (opts.hl || []).join(','), opts.sex || ''].join('|');
    if (key === lastKey) return;
    lastKey = key;
    const changed = id !== sel;
    sel = id; hl = opts.hl || []; hlLabel = opts.label || '';
    if (opts.sex) sex = opts.sex;
    if (changed || hl.length) { part = null; isolate = false; $('.b3-cut input').value = 0; setCut(0); }
    restyle(); frameSel();
    await ensureDetail(id);
    if (sel === id) { restyle(); frameSel(); }
  }

  // Picking: the nearest visible surface that the cut has not removed.
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  function hit(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const cands = [...Object.values(over).filter((m) => m.visible && m.userData.sys !== 'skin'), ...(detail[sel] ? Object.values(detail[sel].meshes).filter((m) => m.visible) : [])];
    return ray.intersectObjects(cands, false).find((h) => cut.distanceToPoint(h.point) >= 0);
  }
  const tip = $('.b3-tip');
  const el = renderer.domElement;
  let down = null;
  el.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; tip.hidden = true; });
  el.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) { down = null; return; }
    down = null;
    const h = hit(e); if (!h) return;
    if (h.object.userData.part) { part = part === h.object.userData.part ? null : h.object.userData.part; restyle(); }
    else if (h.object.userData.sys !== sel) onPick(h.object.userData.sys);
  });
  el.addEventListener('pointermove', (e) => {
    if (e.buttons) return;
    const h = hit(e);
    if (!h) { tip.hidden = true; el.style.cursor = 'grab'; return; }
    const u = h.object.userData;
    const label = u.part ? ANATOMY3D[sel].parts.find((p) => p.id === u.part)?.he : sysName(u.sys);
    const r = host.getBoundingClientRect();
    tip.textContent = label; tip.style.left = `${e.clientX - r.left}px`; tip.style.top = `${e.clientY - r.top}px`; tip.hidden = false;
    el.style.cursor = 'pointer';
  });
  el.addEventListener('pointerleave', () => { tip.hidden = true; });

  host.addEventListener('click', (e) => {
    const lb = e.target.closest('.atlas-label'); if (lb) { onPick(lb.dataset.id); return; }
    const lk = e.target.closest('[data-b3-look]');
    if (lk) { look = lk.dataset.b3Look; try { localStorage.setItem(LOOK_KEY, look); } catch { /* ignore */ } restyle(); return; }
    const sx = e.target.closest('[data-b3-sex]');
    if (sx) { sex = sx.dataset.b3Sex; part = null; try { localStorage.setItem(SEX_KEY, sex); } catch { /* ignore */ } restyle(); frameSel(); return; }
    const pp = e.target.closest('[data-part]'); if (pp) { part = pp.dataset.part; restyle(); return; }
    if (e.target.closest('[data-part-clear]')) { part = null; isolate = false; restyle(); }
  });
  host.addEventListener('change', (e) => { if (e.target.matches('[data-iso]')) { isolate = e.target.checked; restyle(); } });
  $('.b3-cut input').addEventListener('input', (e) => setCut(e.target.value));

  // A name pin above the chosen part.
  const pin = $('.b3-pin'); const tmp = new THREE.Vector3();
  function placePin() {
    const m = part && detail[sel]?.meshes[part];
    if (!m) { pin.hidden = true; return; }
    const b = new THREE.Box3().setFromObject(m);
    tmp.set((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2).project(camera);
    const r = host.getBoundingClientRect();
    const x = (tmp.x * 0.5 + 0.5) * r.width, y = (-tmp.y * 0.5 + 0.5) * r.height;
    const p = ANATOMY3D[sel].parts.find((q) => q.id === part);
    pin.querySelector('b').textContent = p.he; pin.querySelector('i').textContent = p.en;
    pin.style.left = `${x}px`; pin.style.top = `${Math.max(170, y)}px`; pin.hidden = false;
  }

  // Render on demand: on change, while flying, and while the controls glide.
  let raf = 0;
  function request() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame() {
    raf = 0;
    let more = false;
    if (fly) {
      const t = Math.min(1, (performance.now() - fly.t0) / 650), k = 1 - (1 - t) ** 3;
      controls.target.lerpVectors(fly.from.t, fly.to.t, k); camera.position.lerpVectors(fly.from.p, fly.to.p, k);
      if (t < 1) more = true; else fly = null;
    }
    if (controls.update()) more = true;
    renderer.render(scene, camera);
    placePin();
    if (more) request();
  }
  controls.addEventListener('change', request);
  controls.addEventListener('start', () => { fly = null; });

  function resize() {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); request();
  }
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  restyle();
  frameBox(boxOf(sel), VIEW.front, PAD[sel] || 0.82);
  select(sel);

  return {
    select(id, opts) { select(id, opts); },
    // "Whole body": the skin's box, from the front.
    reset() { view = 'front'; part = null; restyle(); frameBox(new THREE.Box3().setFromObject(over.skin), VIEW.front, 0.72); },
    front() { view = 'front'; frameSel(); },
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); pmrem.dispose(); host.innerHTML = '';
    },
  };
}
