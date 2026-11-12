// The real body in 3D: BodyParts3D models (CC BY 4.0, © DBCLS), one per system, loaded on demand.
// Two looks: ink (porcelain and ink outline, the app's DNA) and tissue (anatomical colour, wet light).
// Three.js comes from cdnjs through the import map in index.html; the add-ons are vendored (MIT).
// If WebGL or the library is missing, mountAtlas throws and the 2D sheets stay.
import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { ANATOMY3D, MODEL_CREDIT, MODEL_SOURCES, SOURCES, MOTION3D } from './data.js';

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
  let lookChosen = false;
  try { const lv = localStorage.getItem(LOOK_KEY); lookChosen = lv === 'tissue' || lv === 'ink'; look = lv === 'tissue' ? 'tissue' : 'ink'; sex = localStorage.getItem(SEX_KEY) === 'm' ? 'm' : 'f'; } catch { /* private mode */ }

  host.innerHTML = `
    <div class="atlas-labels" role="group" aria-label="מערכות בגוף">${systems.map((s) => `<button class="atlas-label press-soft" data-id="${s.id}" aria-pressed="false">${esc(s.short_he || s.name_he)}</button>`).join('')}</div>
    <div class="b3-tools" role="group" aria-label="מראה, תנועה וחתך">
      <div class="b3-seg"><button data-b3-look="ink">דיו</button><button data-b3-look="tissue">רקמה</button></div>
      <div class="b3-seg"><button class="b3-move" data-b3-move aria-pressed="false" title="הנפשת התנועה שבתוך הגוף">תנועה</button></div>
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
  let sel = selected, part = null, isolate = false, partsOpen = false, hl = [], hlLabel = '', level = 1, whole = false;
  // Three depth levels, as in the panel: 1 the organ, 2 the outer layer translucent, 3 the inner layer alone.
  const depthOf = (id) => ANATOMY3D[id]?.depth || { outer: [], inner: [] };
  // Parts shown for the chosen body: the reproductive system has a woman's and a man's set.
  const showsPart = (p) => !p.sex || p.sex === sex;
  const partsOf = (id) => (ANATOMY3D[id]?.parts || []).filter(showsPart);
  const femaleBody = () => sel === 'reproductive' && sex === 'f' && !!detail.reproductive;
  const tint = (id) => ANATOMY3D[id]?.parts[0]?.tissue || '#c9b8a8';

  // ---- The living body: one shader layer on every material; each mesh brings its own motion (MOTION3D).
  const MOT = { uTime: { value: 0 }, uOn: { value: 0 } };
  const KIND = { wave: 1, flow: 2, axis: 3, beat: 4, breathe: 5, shift: 6, tide: 7 };
  const NOMOT = { k: 0, o: new THREE.Vector3(), a: new THREE.Vector3(0, 0, 1), c: new THREE.Color('#ffffff'), p: new THREE.Vector4(100, 1, 1, 0) };
  let moving = false, moveT0 = 0;
  const centreOf = (mesh) => { mesh.geometry.computeBoundingBox(); return mesh.geometry.boundingBox.getCenter(new THREE.Vector3()); };
  // Turns one MOTION3D entry into uniform values. A "from" that names a part is resolved against the loaded model.
  function motion(def, mesh, meshes) {
    if (!def) return null;
    const from = Array.isArray(def.from) ? new THREE.Vector3(...def.from) : def.from && meshes?.[def.from] ? centreOf(meshes[def.from]) : centreOf(mesh);
    const amp = def.amp ?? 0;
    return { k: KIND[def.kind] || 0, o: from, a: new THREE.Vector3(...(def.axis || [0, 0, 1])), c: new THREE.Color(def.color || '#ffffff'),
      p: new THREE.Vector4(def.kind === 'beat' ? (def.lag || 0) : def.len || 100, def.rate || 1, def.dir || 1, amp) };
  }
  function materialFor(color, ghost, mot) {
    let m;
    if (look === 'ink') m = new THREE.MeshStandardMaterial({ color: ghost ? '#ffffff' : PORCELAIN, roughness: 0.92, metalness: 0 });
    else m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, metalness: 0, clearcoat: ghost ? 0 : 0.5, clearcoatRoughness: 0.35 });
    m.side = THREE.DoubleSide; m.clippingPlanes = [cut];
    // Inner walls, revealed by the cut, are darker: the cut reads as depth.
    const u = mot || NOMOT;
    // Only moving materials pay for the motion shader; the rest keep the small one, so the programs stay cheap to compile.
    if (!mot) {
      m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  if (!gl_FrontFacing) diffuseColor.rgb *= 0.5;'); };
      m.customProgramCacheKey = () => 'plain';
    } else {
    m.customProgramCacheKey = () => 'motion';
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uTime: MOT.uTime, uOn: MOT.uOn, mK: { value: u.k }, mO: { value: u.o }, mA: { value: u.a }, mC: { value: u.c }, mP: { value: u.p } });
      const pars = 'uniform float uTime, uOn, mK; uniform vec3 mO, mA, mC; uniform vec4 mP; varying vec3 vB; varying float vU;\n';
      sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${pars}`).replace('#include <begin_vertex>', `#include <begin_vertex>
        vB = position; vU = uv.x;
        if (uOn > 0.5 && mK > 3.5) {
          float cyc = uTime * mP.y * 6.2832;
          if (mK < 4.5) transformed = mO + (transformed - mO) * (1.0 - mP.w * pow(max(0.0, sin(cyc + mP.x)), 6.0));       // beat: the wall contracts
          else if (mK < 5.5) transformed = mO + (transformed - mO) * (1.0 + mP.w * (0.5 - 0.5 * cos(cyc)));               // breathe: the volume grows
          else if (mK < 6.5) transformed += mA * mP.w * (0.5 - 0.5 * cos(cyc));                                           // shift: the part moves
        }`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\n${pars}float mW = 0.0;\n`).replace('#include <color_fragment>', `#include <color_fragment>
        if (!gl_FrontFacing) diffuseColor.rgb *= 0.5;
        if (uOn > 0.5 && mK > 0.5 && (mK < 3.5 || mK > 6.5)) {
          float d = mK < 1.5 ? distance(vB, mO) : (mK < 2.5 ? vU * 1000.0 : dot(vB - mO, mA));
          float ph = mK > 6.5 ? fract(d / mP.x + 1.4 * cos(uTime * mP.y * 6.2832)) : fract(d / mP.x - uTime * mP.y * mP.z);
          mW = smoothstep(0.5, 0.9, ph) * (1.0 - smoothstep(0.9, 1.0, ph));
          diffuseColor.rgb = mix(diffuseColor.rgb, mC, 0.3 + 0.7 * mW);
        }`).replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += mC * mW * 0.55;');
    };
    }
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
      const isSel = !whole && id === sel;
      m.visible = whole || (!(isSel && hasDetail) && !(ctx && femaleBody()));
      const ghost = ctx || (!whole && !isSel);
      m.material.dispose(); m.material = materialFor(ctx ? '#f2dccb' : tint(id), ghost, moving && whole && !ctx ? motion(MOTION3D[id]?.over, m) : null);
      if (ctx) m.material.opacity = look === 'ink' ? 0.05 : 0.08;
      const ol = m.userData.outline;
      ol.visible = look === 'ink' && !ghost;
      ol.material.uniforms.ink.value.set(ghost ? GHOST_INK : INK);
      ol.material.uniforms.a.value = ghost ? 0.35 : 1;
      ol.material.uniforms.w.value = ghost ? 0.8 : 0.6;
    }
    for (const [id, d] of Object.entries(detail)) {
      const extra = !whole && cs && id === 'immune' && sel === 'reproductive'; // the case shows the lymph of the armpit beside the breast
      d.group.visible = !whole && (id === sel || extra);
      if (whole || !(id === sel || extra)) continue;
      if (d.skin) {
        d.skin.visible = femaleBody();
        d.skin.material.dispose(); d.skin.material = materialFor('#f2dccb', true); d.skin.material.opacity = look === 'ink' ? 0.05 : 0.08;
        d.skin.userData.outline.visible = false;
      }
      const dp = depthOf(id), deep = !hl.length && !part;
      for (const [pid, m] of Object.entries(d.meshes)) {
        const info = ANATOMY3D[id].parts.find((q) => q.id === pid);
        m.visible = showsPart(info) && !(deep && level === 3 && dp.outer.includes(pid)) && !(extra && !['lymph_vessels', 'nodes_axilla', 'nodes_chest'].includes(pid)) && !(cs && id === 'reproductive' && !pid.startsWith('breast'));
        const on = pid === part || hl.includes(pid) || (deep && level === 3 && dp.inner.includes(pid));
        const peeled = deep && level === 2 && dp.outer.includes(pid);
        const faded = (isolate && part && !on) || (hl.length > 0 && !on) || peeled || (cs && id === 'reproductive');
        m.material.dispose(); m.material = materialFor(m.userData.color, faded, moving ? motion(MOTION3D[id]?.parts?.[pid], m, d.meshes) : null);
        if (faded) m.material.opacity = cs && id === 'reproductive' ? (pid === 'breast' ? 0.16 : 0.3) : peeled ? 0.2 : 0.12;
        if (on && look === 'ink') m.material.color.set('#dfe8f2');
        if (on && look === 'tissue') m.material.emissive = new THREE.Color('#3a1410');
        const ol = m.userData.outline;
        ol.visible = look === 'ink';
        ol.material.uniforms.ink.value.set(on ? NAVY : INK);
        ol.material.uniforms.a.value = faded ? 0.15 : 1;
        ol.material.uniforms.w.value = on ? 1 : 0.6;
      }
    }
    host.querySelectorAll('.atlas-label').forEach((b) => { const on = !whole && b.dataset.id === sel; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    card(); request();
  }

  function card() {
    const A = ANATOMY3D[sel];
    const c = $('.b3-card');
    const M = MOTION3D[sel];
    const bold = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    const moveBlock = moving && !whole && M ? `<div class="b3-motion"><p>${bold(M.text_he)}</p>${M.legend.length ? `<ul>${M.legend.map(([col, t]) => `<li><span class="b3-sw" style="--c:${col}"></span>${esc(t)}</li>`).join('')}</ul>` : ''}<p class="b3-meta"><span class="b3-layer">ידוע</span><span dir="ltr">${esc(SOURCES[M.source_id].title)}, ${SOURCES[M.source_id].year}</span></p></div>` : '';
    if (whole) { c.innerHTML = moving ? `<p class="b3-k">הגוף החי</p><div class="b3-motion"><p>הלב שולח דם, הריאות מתמלאות, אותות חשמליים יוצאים מהמוח, המזון מתקדם, והלימפה חוזרת אל הדם.</p></div>` : `<p class="b3-k">גוף אחד, שבע רשתות</p><p class="b3-hint">לחיצה על מערכת בגוף, או על שמה למעלה, פותחת אותה. גרירה מסובבת, גלגלת מקרבת.</p>`; return; }
    if (!A) { c.innerHTML = ''; return; }
    const list = partsOf(sel);
    const sexSeg = sel === 'reproductive' ? `<div class="b3-seg b3-sex" role="group" aria-label="גוף"><button data-b3-sex="f" aria-pressed="${sex === 'f'}">אישה</button><button data-b3-sex="m" aria-pressed="${sex === 'm'}">גבר</button></div>` : '';
    const lit = hl.map((id) => A.parts.find((p) => p.id === id)).filter(Boolean);
    const dp = depthOf(sel), names = (ids) => ids.map((id) => A.parts.find((p) => p.id === id)).filter((p) => p && showsPart(p)).map((p) => esc(p.he)).join(', ');
    const depthLine = !lit.length && level > 1 && dp.inner.length ? `<p class="b3-depth"><b>${level === 2 ? 'הבנה' : 'עומק'}:</b> ${level === 2 ? `${names(dp.outer)} שקופים, ומתחת: ${names(dp.inner)}.` : `${names(dp.inner)}, בלי המעטפת.`}</p>` : '';
    const litBlock = lit.length ? `<p class="b3-k">${esc(hlLabel)}: <span class="b3-lit">${lit.map((p) => `<button class="b3-part" data-part="${p.id}">${esc(p.he)}</button>`).join('<span>, </span>')}</span></p><p class="b3-hint">מואר בגוף. השאר שקוף.</p>` : '';
    if (!part) {
      c.innerHTML = `${moveBlock}${sexSeg}${litBlock}${depthLine}<details class="b3-more"${partsOpen ? ' open' : ''}><summary><b>${list.length} מבנים</b> במודל</summary>
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
    const inner = (A?.depth?.inner || []).filter((pid) => showsPart(A.parts.find((p) => p.id === pid)));
    const focus = id === sel && hl.length ? hl : id === sel && level === 3 && inner.length ? inner : (sex === 'm' && A?.focus_m ? A.focus_m : A?.focus || []);
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

  // ---- An example case: the findings of one pathology report, drawn inside this same body (js/case.js).
  // The specimen takes its measured size and its ink colours; the sentinel nodes sit at the armpit group of the lymph schema.
  const INKS = { black: '#1b1b1b', yellow: '#e8c21a', green: '#2e8b4a', red: '#c8322b', blue: '#2a55b8', orange: '#e07b1f', '': '#d9d4c8' };
  const CDIRS = [['sup', 'עליון', 'gSup', 'dSup', 'inkSup'], ['inf', 'תחתון', 'gInf', 'dInf', 'inkInf'], ['ant', 'קדמי', 'gAnt', 'dAnt', 'inkAnt'], ['post', 'אחורי', 'gPost', 'dPost', 'inkPost'], ['lat', 'לטרלי', 'gLat', 'dLat', 'inkLat'], ['med', 'מדיאלי', 'gMed', 'dMed', 'inkMed']];
  const QUADS = { uo: 'חיצוני־עליון', lo: 'חיצוני־תחתון', ui: 'פנימי־עליון', li: 'פנימי־תחתון' };
  const num = (v) => { const n = parseFloat(String(v ?? '').replace(/[<>≤~\s]/g, '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
  const lt = (v) => /[<≤]/.test(String(v ?? ''));
  const mmHe = (v) => (num(v) !== null ? `${lt(v) ? 'פחות מ-' : ''}<span class="num">${num(v)}</span> מ״מ` : '');
  let cs = null; // { id, report, view, group, parts: { spec, nodes, piece }, tags: [] }
  const ell = (a, b, c, mat, seg = 40) => { const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.66)); g.scale(a, b, c); g.computeVertexNormals(); return new THREE.Mesh(g, mat); };
  const lineOf = (p, q) => new THREE.Line(new THREE.BufferGeometry().setFromPoints([p, q]), new THREE.LineBasicMaterial({ color: look === 'tissue' ? '#ffffff' : INK, clippingPlanes: [cut] }));
  function clearCase() {
    if (!cs) return;
    body.remove(cs.group); cs.group.traverse((o) => { o.geometry?.dispose(); if (o.material?.dispose) o.material.dispose(); });
    cs.tags.forEach((t) => t.el.remove()); cs = null;
  }
  function caseTag(html, pos, views, cls = '') {
    const el = document.createElement('div'); el.className = `b3-tag ${cls}`; el.innerHTML = html; host.appendChild(el);
    cs.tags.push({ el, pos, views });
  }
  function buildCase(c) {
    clearCase();
    const R = c.report, s = R.side === 'R' ? -1 : 1;
    cs = { id: c.id, report: R, view: c.view || 'body', group: new THREE.Group(), parts: {}, tags: [] };
    body.add(cs.group);
    const ax = { sup: new THREE.Vector3(0, 0, 1), inf: new THREE.Vector3(0, 0, -1), ant: new THREE.Vector3(0, -1, 0), post: new THREE.Vector3(0, 1, 0), lat: new THREE.Vector3(s, 0, 0), med: new THREE.Vector3(-s, 0, 0) };
    const half = new THREE.Vector3(R.ml / 2, R.ap / 2, R.si / 2);
    const spec = new THREE.Group(); cs.group.add(spec); cs.parts.spec = spec;
    // where in the breast: behind the nipple of the model, by the clock hour and the quadrant that were written
    const br = detail.reproductive?.meshes.breast; const nip = new THREE.Vector3(s * 100, -252, 1183);
    if (br) { const p = br.geometry.attributes.position; let best = Infinity; for (let i = 0; i < p.count; i++) if (p.getX(i) * s > 0 && p.getY(i) < best) { best = p.getY(i); nip.fromBufferAttribute(p, i); } }
    const h = parseInt(R.clock, 10), a = h ? (h % 12) / 12 * Math.PI * 2 : 0, rad = h ? (R.near === 'retro' ? 14 : 42) : 0;
    let dx = Math.sin(a) * rad; const out = R.quad && R.quad[1] === 'o', inn = R.quad && R.quad[1] === 'i';
    if ((out && dx * s < 0) || (inn && dx * s > 0)) dx = -dx;
    spec.position.set(nip.x + dx, nip.y + half.y + 5, nip.z + Math.cos(a) * rad);
    // the specimen: an ellipsoid, each side washed in its ink
    const geo = new THREE.SphereGeometry(1, 64, 44); geo.scale(half.x, half.y, half.z); geo.computeVertexNormals();
    const col = [], nn = geo.attributes.normal, v = new THREE.Vector3(), cc = new THREE.Color(), acc = new THREE.Color();
    for (let i = 0; i < nn.count; i++) {
      v.fromBufferAttribute(nn, i); acc.setRGB(0, 0, 0); let sum = 0;
      for (const [k, , , , inkF] of CDIRS) { const w = Math.max(0, v.dot(ax[k])) ** 6; cc.set(INKS[R[inkF]] || INKS['']); acc.r += cc.r * w; acc.g += cc.g * w; acc.b += cc.b * w; sum += w; }
      col.push(acc.r / sum, acc.g / sum, acc.b / sum);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const wall = (side, opacity, order) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, transparent: true, opacity, depthWrite: false, side, clippingPlanes: [cut] })); m.renderOrder = order; m.raycast = () => {}; spec.add(m); };
    wall(THREE.BackSide, 0.62, 5); wall(THREE.FrontSide, 0.2, 8);
    // the tumour, between the margins, by the distances measured by eye
    const mid = (plus, minus, hh) => ((hh - (num(R[plus]) ?? hh)) + (-hh + (num(R[minus]) ?? hh))) / 2;
    const tc = new THREE.Vector3(s * mid('gLat', 'gMed', half.x), -mid('gAnt', 'gPost', half.y), mid('gSup', 'gInf', half.z));
    const reach = (k) => { const d = ax[k]; const A = (d.x / half.x) ** 2 + (d.y / half.y) ** 2 + (d.z / half.z) ** 2; const B = 2 * (tc.x * d.x / half.x ** 2 + tc.y * d.y / half.y ** 2 + tc.z * d.z / half.z ** 2); const C = (tc.x / half.x) ** 2 + (tc.y / half.y) ** 2 + (tc.z / half.z) ** 2 - 1; return (-B + Math.sqrt(Math.max(0, B * B - 4 * A * C))) / (2 * A); };
    const idcR = (num(R.idc) || 1) / 2;
    const idc = ell(idcR, idcR, idcR, new THREE.MeshStandardMaterial({ color: INK, roughness: 0.5, clippingPlanes: [cut] })); idc.position.copy(tc); idc.renderOrder = 6; idc.raycast = () => {}; spec.add(idc);
    const dR = (num(R.dcis) || num(R.idc) || 2) / 2; const ext = {};
    for (const [k, , , dF] of CDIRS) { const m = num(R[dF]), r = reach(k); ext[k] = Math.max(idcR + 0.5, m !== null ? r - (lt(R[dF]) ? m * 0.75 : m) : Math.min(dR, r - 2.5)); }
    const hg = new THREE.SphereGeometry(1, 44, 30), hp = hg.attributes.position;
    for (let i = 0; i < hp.count; i++) { v.fromBufferAttribute(hp, i); hp.setXYZ(i, v.x * (v.dot(ax.lat) > 0 ? ext.lat : ext.med), v.y * (v.y < 0 ? ext.ant : ext.post), v.z * (v.z > 0 ? ext.sup : ext.inf)); }
    hg.computeVertexNormals();
    const halo = new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ color: NAVY, roughness: 0.6, transparent: true, opacity: 0.3, depthWrite: false, clippingPlanes: [cut] })); halo.position.copy(tc); halo.renderOrder = 7; halo.raycast = () => {}; spec.add(halo);
    // six rulers, and the nearest margin marked
    let near = null;
    for (const [k, he, gF, dF] of CDIRS) for (const f of [dF, gF]) { const m = num(R[f]); if (m !== null && (!near || m < near.m)) near = { k, m }; }
    const local = (p) => p.clone().add(spec.position);
    for (const [k, he, gF, dF] of CDIRS) {
      const end = tc.clone().addScaledVector(ax[k], reach(k));
      spec.add(lineOf(tc.clone().addScaledVector(ax[k], idcR), end));
      const g = mmHe(R[gF]), d = mmHe(R[dF]);
      caseTag(`<b>${he}</b>${g ? ` · גוש ${g}` : ''}${d ? ` · DCIS ${d}` : ''}`, local(end.clone().addScaledVector(ax[k], 7)), ['spec'], near && near.k === k ? 'near' : '');
    }
    // the widened margin, beside the side it came from
    if (R.ext === 'yes' && num(R.extA)) {
      const d = new THREE.Vector3(); (R.extWhere || 'inf').split('-').forEach((k) => d.add(ax[k])); d.normalize();
      const A = num(R.extA) / 2, B = (num(R.extB) || 10) / 2, T = (num(R.extC) || 6) / 2;
      const edge = 1 / Math.sqrt((d.x / half.x) ** 2 + (d.z / half.z) ** 2);
      const piece = new THREE.Group(); piece.position.copy(d).multiplyScalar(edge + T + 10);
      piece.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-d.z, 0, d.x), new THREE.Vector3(0, 1, 0), d));
      const pm = ell(A, B, T, new THREE.MeshStandardMaterial({ color: '#e9d9a8', roughness: 0.75, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide, clippingPlanes: [cut] })); pm.renderOrder = 8; pm.raycast = () => {}; piece.add(pm);
      const nd = Math.min(8, Math.max(0, Math.round(num(R.extDucts) || 0))), mg = num(R.extMargin);
      for (let i = 0; i < nd; i++) { const duct = ell(0.9, 0.9, 0.9, new THREE.MeshStandardMaterial({ color: NAVY, roughness: 0.5, clippingPlanes: [cut] }), 16); duct.position.set((i - (nd - 1) / 2) * 2.4, 0, Math.max(-T + 1, T - (mg ?? T) - 0.9)); duct.raycast = () => {}; piece.add(duct); }
      spec.add(piece); cs.parts.piece = piece;
      caseTag(`<b>הרחבת שוליים</b>${nd ? ` · ${nd} צינורות עם DCIS` : ''}${mmHe(R.extMargin) ? ` · ${mmHe(R.extMargin)} מהשוליים החדשים` : ''}`, local(piece.position.clone().addScaledVector(d, T + 6)), ['spec', 'ext']);
    }
    // the sentinel nodes, at their measured size, in the armpit group of the lymph schema
    const nodes = new THREE.Group(); cs.group.add(nodes); cs.parts.nodes = nodes;
    const site = new THREE.Vector3(s * 127, -89, 1276);
    const lymph = detail.immune?.meshes.nodes_axilla;
    if (lymph) { const p = lymph.geometry.attributes.position; const c0 = new THREE.Vector3(); let n = 0; for (let i = 0; i < p.count; i++) if (p.getX(i) * s > 0 && p.getZ(i) > 1200) { c0.x += p.getX(i); c0.y += p.getY(i); c0.z += p.getZ(i); n++; } if (n) site.copy(c0.multiplyScalar(1 / n)); }
    site.add(new THREE.Vector3(-s * 16, -22, -18)); // the lowest nodes of the group, towards the breast: where a sentinel node usually is
    [[R.n1a, R.n1b, R.n1c, R.n1met], [R.n2a, R.n2b, R.n2c, R.n2met]].forEach(([la, lb, lc, met], i) => {
      if (!num(la)) return;
      const g = new THREE.Group(); g.position.set(site.x + s * i * 12, site.y - i * 3, site.z - i * 13);
      const shell = ell(num(la) / 2, (num(lc) || num(la) * 0.5) / 2, (num(lb) || num(la) * 0.7) / 2, new THREE.MeshStandardMaterial({ color: '#8fa86a', roughness: 0.7, transparent: true, opacity: 0.55, depthWrite: false })); shell.renderOrder = 8; shell.raycast = () => {}; g.add(shell);
      if (num(met)) { const m = ell(num(met) / 2, Math.min(num(met), num(lc) || num(met)) / 2 * 0.9, num(met) / 2, new THREE.MeshStandardMaterial({ color: INK, roughness: 0.5 }), 24); m.position.x = num(la) * 0.12; m.raycast = () => {}; g.add(m); }
      nodes.add(g);
      caseTag(`<b>זקיף ${i + 1}</b> · ${num(met) ? `גרורה <span class="num">${num(met)}</span> מ״מ` : 'בלי גרורה'}`, g.position.clone().add(new THREE.Vector3(s * 4, 0, num(la) / 2 + 5)), ['nodes']);
    });
    const hLine = h ? `שעה ${h}${QUADS[R.quad] ? `, ${QUADS[R.quad]}` : ''}${R.near === 'retro' ? ', מאחורי העטרה' : ''}` : 'המיקום בתוך השד לא נכתב בדוח';
    caseTag(`<b>כריתה חלקית, שד ${R.side === 'R' ? 'ימין' : 'שמאל'}</b><small>${hLine}</small>`, spec.position.clone().add(new THREE.Vector3(0, -half.y, half.z + 26)), ['body'], 'pin');
    if (nodes.children.length) caseTag(`<b>${nodes.children.length === 1 ? 'בלוטת זקיף' : `${nodes.children.length} בלוטות זקיף`}, בית השחי</b><small>מיקום מייצג</small>`, site.clone().add(new THREE.Vector3(s * 8, -6, 30)), ['body'], 'pin');
    cs.parts.spec.userData.inBody = !!h;
    spec.visible = !!h;
  }
  function frameCase() {
    if (!cs) return;
    const s = cs.report.side === 'R' ? -1 : 1, v = cs.view;
    const b = new THREE.Box3();
    const target = v === 'nodes' ? cs.parts.nodes : v === 'ext' && cs.parts.piece ? cs.parts.piece : v === 'spec' ? cs.parts.spec : null;
    scene.updateMatrixWorld(true);
    if (target) b.setFromObject(target); else { b.setFromObject(cs.parts.nodes); b.expandByPoint(body.localToWorld(new THREE.Vector3(s * 30, -250, 1110))); b.expandByPoint(body.localToWorld(new THREE.Vector3(s * 150, -100, 1330))); }
    if (cs.parts.piece) cs.parts.piece.visible = v === 'spec' || v === 'ext';
    frameBox(b, [s * (v === 'body' ? 0.4 : 0.75), 0.3, 1], v === 'body' ? 1.0 : v === 'spec' ? 1.25 : 1.9);
    cs.tags.forEach((t) => { t.el.hidden = !t.views.includes(v) || (t.el.classList.contains('pin') ? false : !cs.parts.spec.visible && v === 'spec'); });
  }
  const tagV = new THREE.Vector3();
  function placeTags() {
    if (!cs) return;
    const r = host.getBoundingClientRect(); const live = [];
    for (const t of cs.tags) {
      if (t.el.hidden) continue;
      tagV.copy(t.pos); body.localToWorld(tagV); tagV.project(camera);
      t.x = (tagV.x * 0.5 + 0.5) * r.width; t.y = (-tagV.y * 0.5 + 0.5) * r.height; t.el.style.visibility = tagV.z > 1 ? 'hidden' : 'visible'; live.push(t);
    }
    live.sort((p, q) => p.y - q.y);
    for (let i = 0; i < live.length; i++) for (let j = 0; j < i; j++) { const p = live[j], q = live[i]; const bw = (p.el.offsetWidth + q.el.offsetWidth) / 2 + 6, bh = (p.el.offsetHeight + q.el.offsetHeight) / 2 + 3; if (Math.abs(p.x - q.x) < bw && q.y - p.y < bh) q.y = p.y + bh; }
    for (const t of live) { t.el.style.left = `${t.x}px`; t.el.style.top = `${Math.max(64, t.y)}px`; }
  }
  const PAD = { skeletal: 0.7, cardio: 1.15, immune: 1.02, reproductive: 2.2 };
  const padOf = (id) => (id === 'reproductive' && sex === 'f' ? 0.95 : PAD[id] || 0.82);
  const frameSel = () => frameBox(boxOf(sel), VIEW[view], padOf(sel));
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
    const key = [id, (opts.hl || []).join(','), opts.sex || '', opts.level || 1, opts.whole ? 'w' : '', opts.case ? `${opts.case.id}:${opts.case.view}` : ''].join('|');
    if (key === lastKey) return;
    lastKey = key;
    const changed = id !== sel;
    const wasWhole = whole;
    whole = !!opts.whole;
    // The home page shows the body in tissue colour, until the viewer chooses a look; elsewhere ink is the default.
    if (!lookChosen) look = whole || opts.case ? 'tissue' : 'ink'; // a case reads best in tissue colour: the ink of the margins is colour
    sel = id; hl = opts.hl || []; hlLabel = opts.label || ''; level = opts.level || 1;
    if (!opts.case) clearCase();
    if (whole) { part = null; restyle(); frameBox(new THREE.Box3().setFromObject(over.skin), VIEW.front, 1.0); return; }
    if (opts.sex) sex = opts.sex;
    if (changed || hl.length || wasWhole) { part = null; isolate = false; $('.b3-cut input').value = 0; setCut(0); }
    if (opts.case && cs && cs.id === opts.case.id) { cs.view = opts.case.view; restyle(); frameCase(); return; }
    restyle(); if (!opts.case) frameSel();
    await ensureDetail(id);
    if (opts.case) { await ensureDetail('immune'); if (sel !== id || lastKey !== key) return; buildCase(opts.case); restyle(); frameCase(); return; }
    if (sel === id && !whole) { restyle(); frameSel(); }
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
    else if (whole || h.object.userData.sys !== sel) onPick(h.object.userData.sys);
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
    const mv = e.target.closest('[data-b3-move]');
    if (mv) { setMoving(!moving); return; }
    const lk = e.target.closest('[data-b3-look]');
    if (lk) { look = lk.dataset.b3Look; lookChosen = true; try { localStorage.setItem(LOOK_KEY, look); } catch { /* ignore */ } restyle(); return; }
    const sx = e.target.closest('[data-b3-sex]');
    if (sx) { sex = sx.dataset.b3Sex; part = null; try { localStorage.setItem(SEX_KEY, sex); } catch { /* ignore */ } restyle(); frameSel(); return; }
    const pp = e.target.closest('[data-part]'); if (pp) { part = pp.dataset.part; restyle(); return; }
    if (e.target.closest('[data-part-clear]')) { part = null; isolate = false; restyle(); }
  });
  host.addEventListener('change', (e) => { if (e.target.matches('[data-iso]')) { isolate = e.target.checked; restyle(); } });
  $('.b3-cut input').addEventListener('input', (e) => setCut(e.target.value));

  function setMoving(on) {
    moving = !!on; MOT.uOn.value = moving ? 1 : 0; if (moving) moveT0 = performance.now();
    host.classList.toggle('is-moving', moving);
    const b = $('[data-b3-move]'); b.setAttribute('aria-pressed', String(moving)); b.textContent = moving ? 'עצירה' : 'תנועה';
    restyle();
  }

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
  // While the body moves, 30 frames a second are enough, and leave room for the page.
  let lastDraw = 0;
  function request() { if (raf) return; const wait = moving ? 33 - (performance.now() - lastDraw) : 0; raf = wait > 1 ? setTimeout(() => { raf = requestAnimationFrame(frame); }, wait) : requestAnimationFrame(frame); }
  function frame() {
    raf = 0; lastDraw = performance.now();
    let more = false;
    if (fly) {
      const t = Math.min(1, (performance.now() - fly.t0) / 650), k = 1 - (1 - t) ** 3;
      controls.target.lerpVectors(fly.from.t, fly.to.t, k); camera.position.lerpVectors(fly.from.p, fly.to.p, k);
      if (t < 1) more = true; else fly = null;
    }
    if (controls.update()) more = true;
    if (moving) { MOT.uTime.value = (performance.now() - moveT0) / 1000; more = true; }
    renderer.render(scene, camera);
    placePin(); placeTags();
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
  frameBox(boxOf(sel), VIEW.front, padOf(sel));
  select(sel);

  return {
    select(id, opts) { select(id, opts); },
    // "Whole body": the skin's box, from the front.
    reset() { view = 'front'; part = null; restyle(); frameBox(new THREE.Box3().setFromObject(over.skin), VIEW.front, 1.0); },
    front() { view = 'front'; frameSel(); },
    motion(on) { setMoving(on); },
    get moving() { return moving; },
    destroy() {
      cancelAnimationFrame(raf); clearTimeout(raf); moving = false; ro.disconnect(); controls.dispose(); renderer.dispose(); pmrem.dispose(); host.innerHTML = '';
    },
  };
}
