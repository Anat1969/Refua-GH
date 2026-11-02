// 3D exploded atlas: each body system is a transparent sheet in space, the outline at the back.
// Three.js from cdnjs, loaded only when the viewer asks for 3D. If WebGL or the library
// is missing, mountAtlas throws and the 2D figure stays.
import { sheetSVG } from './body.js';

export const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.170.0/three.module.min.js';
let threePromise = null;
const loadThree = () => (threePromise ||= import(THREE_URL));

// Back to front. Outline at the back, skeleton behind the organs, nerves in front.
const ORDER = ['outline', 'skeletal', 'reproductive', 'digestive', 'cardio', 'respiratory', 'immune', 'nervous'];
const GAP = 0.7;
const W = 2, H = 4;
const YAW0 = -0.78, PITCH0 = 0.14;

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

function sheetCanvas(id) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([sheetSVG(id, 512)], { type: 'image/svg+xml' }));
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 1024;
      c.getContext('2d').drawImage(img, 0, 0, 512, 1024);
      URL.revokeObjectURL(url);
      resolve(c);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('sheet')); };
    img.src = url;
  });
}

export async function mountAtlas(host, systems, { selected, onPick, reduced }) {
  if (!webglOK()) throw new Error('webgl');
  const THREE = await loadThree();
  const canvases = Object.fromEntries(await Promise.all(ORDER.map(async (id) => [id, await sheetCanvas(id)])));

  host.innerHTML = '<div class="atlas-labels" role="group" aria-label="שקפי המערכות"></div><p class="atlas-hint">גוררים כדי לסובב. לחיצה על קו בוחרת את המערכת שלו.</p>';
  const labelsEl = host.querySelector('.atlas-labels');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0xffffff, 0);
  renderer.domElement.className = 'atlas-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 13);
  const rig = new THREE.Group();
  scene.add(rig);

  const sheets = ORDER.map((id, i) => {
    const tex = new THREE.CanvasTexture(canvases[id]);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 1 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat);
    const z = (i - (ORDER.length - 1) / 2) * GAP;
    mesh.position.z = z;
    mesh.renderOrder = i;
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(W * 1.04, H * 1.02)),
      new THREE.LineBasicMaterial({ color: 0xc4cad2, transparent: true }),
    );
    mesh.add(frame);
    mesh.userData = { id, z0: z, z: z, frame };
    rig.add(mesh);
    return mesh;
  });

  // Name labels: real buttons that follow the top corner of each sheet.
  const labels = Object.fromEntries(
    systems.map((s) => {
      const b = document.createElement('button');
      b.className = 'atlas-label';
      b.type = 'button';
      b.dataset.id = s.id;
      b.textContent = s.name_he;
      b.addEventListener('click', () => onPick(s.id));
      labelsEl.append(b);
      return [s.id, b];
    }),
  );

  let yaw = YAW0, pitch = PITCH0, sel = selected, dirty = true, raf = 0;
  const target = { yaw, pitch };

  function applySelection() {
    sheets.forEach((m) => {
      const { id, z0, frame } = m.userData;
      const on = id === sel;
      m.userData.zTarget = on ? z0 + 0.35 : z0;
      m.material.opacity = id === 'outline' ? 0.9 : on ? 1 : 0.32;
      frame.material.color.set(on ? 0x16202b : 0xc4cad2);
      frame.material.opacity = id === 'outline' ? 0.6 : on ? 1 : 0.7;
      if (labels[id]) { labels[id].classList.toggle('on', on); labels[id].setAttribute('aria-pressed', String(on)); }
    });
    dirty = true;
    loop();
  }

  function resize() {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    // Fit the exploded stack in the frame, whatever the proportion of the screen.
    const fitH = 5.6, fitW = 6.4;
    const vFov = (camera.fov * Math.PI) / 180;
    const distH = fitH / 2 / Math.tan(vFov / 2);
    const distW = fitW / 2 / (Math.tan(vFov / 2) * camera.aspect);
    camera.position.z = Math.max(distH, distW);
    camera.updateProjectionMatrix();
    dirty = true;
    loop();
  }

  const corner = new THREE.Vector3();
  function placeLabels() {
    const r = renderer.domElement.getBoundingClientRect();
    const hr = host.getBoundingClientRect();
    // A staircase along the outer edge: each sheet's name at its own height, so names never stack.
    const ids = ORDER.filter((id) => labels[id]);
    const edge = Math.cos(yaw) * Math.sign(-yaw || 1) >= 0 ? -1 : 1; // the edge that faces outward
    sheets.forEach((m) => {
      const b = labels[m.userData.id];
      if (!b) return;
      const i = ids.indexOf(m.userData.id);
      corner.set((edge * W) / 2, H / 2 - 0.25 - i * 0.42, 0);
      m.localToWorld(corner);
      corner.project(camera);
      const x = (corner.x * 0.5 + 0.5) * r.width + (r.left - hr.left);
      const y = (-corner.y * 0.5 + 0.5) * r.height + (r.top - hr.top);
      // Keep every name inside the frame.
      const bw = b.offsetWidth, bh = b.offsetHeight;
      let left = edge < 0 ? x - bw - 6 : x + 6;
      left = Math.max(4, Math.min(hr.width - bw - 4, left));
      const top = Math.max(2, Math.min(hr.height - bh - 2, y - bh / 2));
      b.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    });
  }

  function loop() {
    if (raf) return;
    raf = requestAnimationFrame(frame);
  }
  function frame() {
    raf = 0;
    const k = reduced ? 1 : 0.18;
    let moving = false;
    yaw += (target.yaw - yaw) * k;
    pitch += (target.pitch - pitch) * k;
    if (Math.abs(target.yaw - yaw) > 1e-4 || Math.abs(target.pitch - pitch) > 1e-4) moving = true;
    rig.rotation.set(pitch, yaw, 0);
    sheets.forEach((m) => {
      const zt = m.userData.zTarget ?? m.userData.z0;
      m.position.z += (zt - m.position.z) * k;
      if (Math.abs(zt - m.position.z) > 1e-4) moving = true;
    });
    renderer.render(scene, camera);
    placeLabels();
    if (moving || dirty) { dirty = false; loop(); }
  }

  // Drag to rotate; a click without drag picks the sheet that has ink under the pointer.
  const el = renderer.domElement;
  let down = null;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(ev) {
    const r = el.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(sheets, false).filter((h) => h.object.userData.id !== 'outline');
    for (const h of hits) {
      const c = canvases[h.object.userData.id];
      const px = Math.floor(h.uv.x * c.width), py = Math.floor((1 - h.uv.y) * c.height);
      // Look in a small square, so a thin ink line is easy to hit.
      const a = c.getContext('2d').getImageData(Math.max(0, px - 6), Math.max(0, py - 6), 13, 13).data;
      for (let i = 3; i < a.length; i += 4) if (a[i] > 60) return h.object.userData.id;
    }
    return null;
  }
  const onDown = (ev) => { down = { x: ev.clientX, y: ev.clientY, yaw: target.yaw, pitch: target.pitch, moved: false }; el.setPointerCapture?.(ev.pointerId); };
  const onMove = (ev) => {
    if (!down) {
      el.style.cursor = pick(ev) ? 'pointer' : 'grab';
      return;
    }
    const dx = ev.clientX - down.x, dy = ev.clientY - down.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) down.moved = true;
    target.yaw = Math.max(-1.45, Math.min(1.45, down.yaw + dx * 0.008));
    target.pitch = Math.max(-0.5, Math.min(0.7, down.pitch + dy * 0.006));
    loop();
  };
  const onUp = (ev) => {
    if (down && !down.moved) { const id = pick(ev); if (id) onPick(id); }
    down = null;
  };
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', () => (down = null));

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  applySelection();

  return {
    select(id) { if (id !== sel) { sel = id; applySelection(); } },
    reset() { target.yaw = YAW0; target.pitch = PITCH0; loop(); },
    front() { target.yaw = 0; target.pitch = 0; loop(); },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      sheets.forEach((m) => { m.geometry.dispose(); m.material.map.dispose(); m.material.dispose(); m.userData.frame.geometry.dispose(); m.userData.frame.material.dispose(); });
      renderer.dispose();
      host.innerHTML = '';
    },
  };
}
