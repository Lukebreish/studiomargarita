import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';

/* ============================================================
   SHARED DATA
   ============================================================ */
const BRAND = 'Studio Margarita'; // placeholder — swap for your final brand name

const PALETTES = [
  ['#7d3c2e', '#e8c9a3', '#241d19', '#c46a45'],
  ['#28414f', '#83c1d4', '#eef0ee', '#316384'],
  ['#372a37', '#dcaecb', '#b78fc0', '#98a8ca'],
  ['#20303a', '#5a5290', '#9a83bd', '#dbb0cb'],
  ['#1c1826', '#7f5aba', '#cf59a6', '#e8905f'],
  ['#233f45', '#289084', '#e5bd63', '#e79c5c'],
  ['#191320', '#392a4a', '#71495c', '#ab5b66'],
];

const ARTWORKS = [
  { id: 0, room: 0, wall: 'left', palette: 0, title: 'Untitled Study No. 3', artist: 'Margarita', meta: 'Acrylic on canvas, 2023', note: 'An early piece in a longer series exploring warmth against restraint.', featured: true },
  { id: 1, room: 0, wall: 'right', palette: 1, title: 'Quiet Harbour', artist: 'Margarita', meta: 'Oil on linen, 2021', note: 'Painted from memory, long after the coastline itself had changed.', featured: true },
  { id: 2, room: 1, wall: 'left', palette: 2, title: 'Interior Weather', artist: 'Margarita', meta: 'Mixed media, 2024', note: 'Described as a room with its own private climate.', featured: true },
  { id: 3, room: 1, wall: 'right', palette: 3, title: 'Correspondence No. 7', artist: 'Margarita', meta: 'Ink and gouache, 2020', note: 'Part of a series of unsent letters rendered as colour.', featured: false },
  { id: 4, room: 2, wall: 'left', palette: 4, title: 'Static Bloom', artist: 'Margarita', meta: 'Acrylic on panel, 2022', note: 'Made in a single overnight sitting, never reworked since.', featured: true },
  { id: 5, room: 2, wall: 'right', palette: 5, title: 'Low Tide Archive', artist: 'Margarita', meta: 'Oil on canvas, 2019', note: 'One of three surviving canvases from a studio fire the following year.', featured: false },
  { id: 6, room: 2, wall: 'back', palette: 6, title: 'The Long Room', artist: 'Margarita', meta: 'Oil and pigment on canvas, 2024', note: 'The largest work in the collection, and the newest.', featured: false },
];

const CONTACT_EMAIL = 'hello@studiomargarita.com'; // placeholder — swap for the real inbox
const FORM_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID'; // placeholder — create a free Formspree form and drop the ID in here

/* ============================================================
   PROCEDURAL PLACEHOLDER ART
   ============================================================ */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateArtCanvas(paletteIdx, seed, w = 480, h = 320) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const pal = PALETTES[paletteIdx];
  const rand = mulberry32(seed * 97 + 13);
  const variant = seed % 3;

  ctx.fillStyle = pal[2];
  ctx.fillRect(0, 0, w, h);

  if (variant === 0) {
    let y = 0;
    const bands = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < bands; i++) {
      const bh = (h / bands) * (0.7 + rand() * 0.6);
      ctx.fillStyle = pal[i % pal.length];
      ctx.globalAlpha = 0.75 + rand() * 0.25;
      ctx.fillRect(0, y, w, bh);
      y += bh * (0.6 + rand() * 0.3);
    }
  } else if (variant === 1) {
    for (let i = 0; i < 10; i++) {
      ctx.globalAlpha = 0.5 + rand() * 0.4;
      ctx.fillStyle = pal[Math.floor(rand() * pal.length)];
      const cx = rand() * w, cy = rand() * h, r = 30 + rand() * 90;
      if (rand() > 0.5) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); }
      else {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rand() * Math.PI);
        ctx.fillRect(-r / 2, -r / 2, r, r); ctx.restore();
      }
    }
  } else {
    ctx.strokeStyle = pal[3]; ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 14) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    ctx.globalAlpha = 0.85; ctx.fillStyle = pal[1];
    ctx.beginPath();
    ctx.arc(w * (0.3 + rand() * 0.4), h * (0.3 + rand() * 0.4), 70 + rand() * 60, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = rand() > 0.5 ? '#000' : '#fff';
    ctx.fillRect(rand() * w, rand() * h, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;
  return canvas;
}

function generatePlacardCanvas(title, artist, meta) {
  const w = 640, h = 190;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'italic 40px Georgia, "Times New Roman", serif';
  ctx.fillText(title, w / 2, 76);
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillStyle = '#7a2530';
  ctx.fillText(artist.toUpperCase(), w / 2, 118);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = '#8a887f';
  ctx.fillText(meta, w / 2, 150);
  return canvas;
}

function generateWallTexture() {
  const w = 512, h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fbfaf7';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.02)';
  ctx.lineWidth = 2;
  for (let x = 0; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function generateFloorTexture() {
  const w = 512, h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e6dcc7';
  ctx.fillRect(0, 0, w, h);
  const rand = mulberry32(7);
  for (let y = 0; y < h; y += 18) {
    ctx.strokeStyle = `rgba(120,95,55,${0.08 + rand() * 0.08})`;
    ctx.lineWidth = 1 + rand() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y + rand() * 6);
    for (let x = 0; x < w; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.05 + y) * 3 + rand() * 4);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function boxCollides(x, z, r, boxes) {
  for (const b of boxes) {
    if (x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ) return true;
  }
  return false;
}

/* ============================================================
   MUSEUM TOUR — light, white-cube themed 3D walkthrough
   ============================================================ */
const ROOM_W = 11, ROOM_D = 10, ROOMS = 3, WALL_H = 6, HALL_LEN = ROOM_D * ROOMS;
const EYE_H = 1.7, PLAYER_R = 0.35, MOVE_SPEED = 3.4, ART_W = 2.3, ART_H = 1.55;

function MuseumTour({ onEnquire }) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    started: false, panelOpen: false,
    keys: { fwd: false, back: false, left: false, right: false },
    pos: new THREE.Vector3(0, EYE_H, -1.5), yaw: 0, pitch: 0,
    dragging: false, lastX: 0, lastY: 0, hoveredId: null,
  });
  const [started, setStarted] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const wallColor = 0xfbfaf7;
    scene.fog = new THREE.Fog(wallColor, 20, 40);

    const camera = new THREE.PerspectiveCamera(62, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.copy(stateRef.current.pos);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe8ddc9, 0.7));

    const wallTex = generateWallTexture();
    wallTex.repeat.set(HALL_LEN / 4, WALL_H / 4);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 });
    const endWallMat = new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.95 });
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
    const floorTex = generateFloorTexture();
    floorTex.repeat.set(ROOM_W / 3, HALL_LEN / 3);
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x161514, roughness: 0.5, metalness: 0.2 });

    const collidableBoxes = [];
    const artMeshes = [];

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, HALL_LEN), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -HALL_LEN / 2); scene.add(floor);

    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, HALL_LEN), ceilMat);
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, WALL_H, -HALL_LEN / 2); scene.add(ceil);

    const thickness = 0.25;
    [-1, 1].forEach((side) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(thickness, WALL_H, HALL_LEN), wallMat);
      wall.position.set(side * (ROOM_W / 2), WALL_H / 2, -HALL_LEN / 2);
      scene.add(wall);
      collidableBoxes.push({ minX: side * (ROOM_W / 2) - thickness, maxX: side * (ROOM_W / 2) + thickness, minZ: -HALL_LEN - 1, maxZ: 1 });
    });

    const doorW = 3;
    for (let i = 1; i < ROOMS; i++) {
      const z = -ROOM_D * i;
      [-1, 1].forEach((side) => {
        const segW = ROOM_W / 2 - doorW / 2;
        const segX = side * (doorW / 2 + segW / 2);
        const seg = new THREE.Mesh(new THREE.BoxGeometry(segW, WALL_H, thickness), wallMat);
        seg.position.set(segX, WALL_H / 2, z);
        scene.add(seg);
        collidableBoxes.push({ minX: segX - segW / 2, maxX: segX + segW / 2, minZ: z - thickness, maxZ: z + thickness });
      });
    }

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, WALL_H, thickness), endWallMat);
    backWall.position.set(0, WALL_H / 2, -HALL_LEN); scene.add(backWall);
    collidableBoxes.push({ minX: -ROOM_W / 2 - 1, maxX: ROOM_W / 2 + 1, minZ: -HALL_LEN - thickness, maxZ: -HALL_LEN + thickness });

    ARTWORKS.forEach((info) => {
      const roomCenterZ = -(info.room * ROOM_D + ROOM_D / 2);
      let x, z, rotY, spotOffsetX = 0, spotOffsetZ = 0;
      if (info.wall === 'left') { x = -ROOM_W / 2; z = roomCenterZ; rotY = Math.PI / 2; spotOffsetX = 1.4; }
      else if (info.wall === 'right') { x = ROOM_W / 2; z = roomCenterZ; rotY = -Math.PI / 2; spotOffsetX = -1.4; }
      else { x = 0; z = -HALL_LEN; rotY = 0; spotOffsetZ = 1.4; }

      const dirX = info.wall === 'left' ? 1 : info.wall === 'right' ? -1 : 0;
      const dirZ = info.wall === 'back' ? 1 : 0;
      const w = info.wall === 'back' ? ART_W * 1.6 : ART_W;
      const hgt = info.wall === 'back' ? ART_H * 1.6 : ART_H;

      const frame = new THREE.Mesh(new THREE.BoxGeometry(
        info.wall === 'back' ? w + 0.14 : 0.05,
        hgt + 0.14,
        info.wall === 'back' ? 0.05 : w + 0.14
      ), frameMat);
      const artTex = new THREE.CanvasTexture(generateArtCanvas(info.palette, info.id));
      const artMat = new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.8 });
      const art = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), artMat);
      art.rotation.y = rotY; art.userData.info = info; artMeshes.push(art);

      const placardTex = new THREE.CanvasTexture(generatePlacardCanvas(info.title, info.artist, info.meta));
      const placard = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.34), new THREE.MeshBasicMaterial({ map: placardTex, transparent: true }));
      placard.rotation.y = rotY;

      const artY = 2.15;
      const placardY = artY - hgt / 2 - 0.28;
      frame.position.set(x + dirX * 0.03, artY, z + dirZ * 0.03);
      art.position.set(x + dirX * 0.06, artY, z + dirZ * 0.06);
      placard.position.set(x + dirX * 0.06, placardY, z + dirZ * 0.06);
      scene.add(frame, art, placard);

      const spot = new THREE.SpotLight(0xfff2df, 1.1, 11, 0.55, 0.6);
      spot.position.set(x + spotOffsetX, WALL_H - 0.6, z + spotOffsetZ + (info.wall === 'back' ? 0 : 0.6));
      const target = new THREE.Object3D();
      target.position.set(x + dirX * 0.5, artY - 0.2, z + dirZ * 0.5);
      scene.add(target); spot.target = target; scene.add(spot);
    });

    const st = stateRef.current;
    const onKeyDown = (e) => {
      if (!st.started) return;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') st.keys.fwd = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') st.keys.back = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') st.keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') st.keys.right = true;
      if (e.code === 'KeyE' || e.code === 'Enter') interact();
      if (e.code === 'Escape') closePanel();
    };
    const onKeyUp = (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') st.keys.fwd = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') st.keys.back = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') st.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') st.keys.right = false;
    };

    const pointerDownPos = { x: 0, y: 0 };
    const onPointerDown = (e) => {
      if (!st.started || st.panelOpen) return;
      st.dragging = true;
      const p = e.touches ? e.touches[0] : e;
      st.lastX = p.clientX; st.lastY = p.clientY;
      pointerDownPos.x = p.clientX; pointerDownPos.y = p.clientY;
    };
    const onPointerMove = (e) => {
      if (!st.dragging) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - st.lastX, dy = p.clientY - st.lastY;
      st.lastX = p.clientX; st.lastY = p.clientY;
      st.yaw -= dx * 0.0028; st.pitch -= dy * 0.0028;
      st.pitch = Math.max(-1.1, Math.min(1.1, st.pitch));
    };
    const onPointerUp = (e) => {
      if (!st.started) return;
      const p = e.changedTouches ? e.changedTouches[0] : e;
      const dist = Math.hypot(p.clientX - pointerDownPos.x, p.clientY - pointerDownPos.y);
      st.dragging = false;
      if (dist < 6) interact();
    };

    function interact() {
      if (st.panelOpen) return;
      if (st.hoveredId != null) {
        const info = ARTWORKS.find((a) => a.id === st.hoveredId);
        if (info) { st.panelOpen = true; setActive(info); }
      }
    }
    function closePanel() { st.panelOpen = false; setActive(null); }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    renderer.domElement.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    let rafId;
    const tmpDir = new THREE.Vector3();

    function tick() {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.08);

      if (!st.started) {
        st.yaw += dt * 0.05;
      } else if (!st.panelOpen) {
        let mx = 0, mz = 0;
        if (st.keys.fwd) mz -= 1;
        if (st.keys.back) mz += 1;
        if (st.keys.left) mx -= 1;
        if (st.keys.right) mx += 1;
        if (mx || mz) {
          const len = Math.hypot(mx, mz); mx /= len; mz /= len;
          const cos = Math.cos(st.yaw), sin = Math.sin(st.yaw);
          const worldX = mx * cos - mz * sin, worldZ = mx * sin + mz * cos;
          const step = MOVE_SPEED * dt;
          const newX = st.pos.x + worldX * step, newZ = st.pos.z + worldZ * step;
          if (!boxCollides(newX, st.pos.z, PLAYER_R, collidableBoxes)) st.pos.x = newX;
          if (!boxCollides(st.pos.x, newZ, PLAYER_R, collidableBoxes)) st.pos.z = newZ;
          st.pos.x = Math.max(-ROOM_W / 2 + 0.6, Math.min(ROOM_W / 2 - 0.6, st.pos.x));
          st.pos.z = Math.max(-HALL_LEN + 0.6, Math.min(-0.5, st.pos.z));
        }
      }

      camera.position.set(st.pos.x, EYE_H, st.pos.z);
      camera.rotation.set(0, 0, 0);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = st.yaw; camera.rotation.x = st.pitch;

      camera.getWorldDirection(tmpDir);
      raycaster.set(camera.position, tmpDir);
      const hits = raycaster.intersectObjects(artMeshes);
      const hit = hits.length && hits[0].distance < 6.5 ? hits[0].object.userData.info : null;
      const hitId = hit ? hit.id : null;
      if (hitId !== st.hoveredId) { st.hoveredId = hitId; setHovered(hit); }

      renderer.render(scene, camera);
    }
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  const beginTour = () => { stateRef.current.started = true; setStarted(true); };
  const closePanel = () => { stateRef.current.panelOpen = false; setActive(null); };
  const press = (key, val) => () => { stateRef.current.keys[key] = val; };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#fbfaf7', overflow: 'hidden', borderRadius: 12 }}>
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, cursor: started ? (active ? 'default' : 'grab') : 'default' }} />

      {started && !active && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 6, height: 6, marginLeft: -3, marginTop: -3, borderRadius: '50%', background: hovered ? '#7a2530' : 'rgba(26,26,26,0.4)', transition: 'background 120ms', pointerEvents: 'none' }} />
      )}

      {started && !active && (
        <div className="tour-chip" style={{ position: 'absolute', top: 14, left: 14 }}>
          WASD — WALK · DRAG — LOOK · CLICK — VIEW
        </div>
      )}

      {started && hovered && !active && (
        <div className="tour-chip" style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', animation: 'tourPulse 1.6s infinite' }}>
          View — {hovered.title}
        </div>
      )}

      {started && !active && (
        <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'grid', gridTemplateColumns: 'repeat(3,36px)', gridTemplateRows: 'repeat(3,36px)', gap: 4 }}>
          <div /><button className="tour-btn" style={{ gridColumn: 2 }} onPointerDown={press('fwd', true)} onPointerUp={press('fwd', false)} onPointerLeave={press('fwd', false)}>▲</button><div />
          <button className="tour-btn" onPointerDown={press('left', true)} onPointerUp={press('left', false)} onPointerLeave={press('left', false)}>◀</button><div />
          <button className="tour-btn" onPointerDown={press('right', true)} onPointerUp={press('right', false)} onPointerLeave={press('right', false)}>▶</button>
          <div /><button className="tour-btn" style={{ gridColumn: 2 }} onPointerDown={press('back', true)} onPointerUp={press('back', false)} onPointerLeave={press('back', false)}>▼</button><div />
        </div>
      )}

      {!started && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.92))', color: '#1a1a1a', textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: '3px', color: '#7a2530', marginBottom: 10 }}>THE VIRTUAL MUSEUM</div>
          <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', fontSize: 'clamp(24px,4vw,36px)', marginBottom: 14 }}>Walk through the collection</div>
          <div style={{ maxWidth: 400, fontSize: 13.5, color: '#6b6b64', lineHeight: 1.7, marginBottom: 22 }}>
            Seven pieces across three rooms. WASD or arrows to walk, drag to look around, click a piece to view it.
          </div>
          <button onClick={beginTour} className="btn-outline">Enter the museum</button>
        </div>
      )}

      {active && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.98) 26%)', paddingTop: 60, paddingBottom: 22, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 'min(480px, 88%)', textAlign: 'center', position: 'relative' }}>
            <button onClick={closePanel} style={{ position: 'absolute', top: -42, right: 0, width: 32, height: 32, borderRadius: '50%', border: '1px solid #e6e3da', background: '#fff', color: '#1a1a1a', fontSize: 15, cursor: 'pointer' }}>×</button>
            <div style={{ fontSize: 11, letterSpacing: '2px', color: '#7a2530', marginBottom: 6 }}>ROOM {active.room + 1} OF {ROOMS}</div>
            <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', fontSize: 22, marginBottom: 4 }}>{active.title}</div>
            <div style={{ fontSize: 12, letterSpacing: '1.5px', color: '#7a2530', textTransform: 'uppercase', marginBottom: 3 }}>{active.artist}</div>
            <div style={{ fontSize: 12, color: '#8a887f', marginBottom: 12 }}>{active.meta}</div>
            <div style={{ fontSize: 13, color: '#4a4a45', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 16px' }}>{active.note}</div>
            <button className="btn-solid" onClick={() => { onEnquire && onEnquire(active); closePanel(); }}>Enquire to purchase</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   2D PAINTING CARD
   ============================================================ */
function PaintingCard({ artwork, onEnquire }) {
  const dataUrl = useMemo(() => generateArtCanvas(artwork.palette, artwork.id, 400, 300).toDataURL(), [artwork]);
  return (
    <div className="card">
      <div className="card-frame">
        <img src={dataUrl} alt={artwork.title} />
      </div>
      <div className="card-title">{artwork.title}</div>
      <div className="card-artist">{artwork.artist}</div>
      <div className="card-meta">{artwork.meta}</div>
      <button className="btn-outline btn-sm" onClick={() => onEnquire(artwork)}>Enquire to purchase</button>
    </div>
  );
}

/* ============================================================
   NAV
   ============================================================ */
function Nav({ tab, setTab }) {
  const tabs = [['studio', 'Studio'], ['artists', 'Artists'], ['margarita', 'Margarita']];
  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="logo" onClick={() => setTab('studio')}>{BRAND}</div>
        <nav className="tabs">
          {tabs.map(([key, label]) => (
            <button key={key} className={'tab' + (tab === key ? ' active' : '')} onClick={() => setTab(key)}>{label}</button>
          ))}
        </nav>
      </div>
    </header>
  );
}

/* ============================================================
   STUDIO TAB (home)
   ============================================================ */
function StudioTab({ onEnquire }) {
  const tourRef = useRef(null);
  const featured = ARTWORKS.filter((a) => a.featured);
  return (
    <>
      <section className="hero">
        <div className="eyebrow">The virtual museum</div>
        <h1>A gallery you can walk through</h1>
        <p className="hero-sub">Step inside a full 3D museum of the collection before you buy a single piece.</p>
        <button className="btn-solid" onClick={() => tourRef.current?.scrollIntoView({ behavior: 'smooth' })}>Enter the virtual museum</button>
      </section>

      <section className="section-narrow">
        <p className="lede">
          {BRAND} is an online home for original paintings — a place to browse the way you would
          in person, room by room, rather than scroll past thumbnails. Every piece here is available
          to enquire about and buy directly.
        </p>
      </section>

      <section className="section-wide" ref={tourRef}>
        <div className="tour-shell"><MuseumTour onEnquire={onEnquire} /></div>
        <p className="caption">Walk through with WASD or arrows, drag to look around, click any piece to view and enquire.</p>
      </section>

      <section className="section-wide">
        <div className="section-head">
          <h2>A closer look</h2>
          <button className="link" onClick={() => document.dispatchEvent(new CustomEvent('go-artists'))}>View the full collection →</button>
        </div>
        <div className="grid">
          {featured.map((a) => <PaintingCard key={a.id} artwork={a} onEnquire={onEnquire} />)}
        </div>
      </section>
    </>
  );
}

/* ============================================================
   ARTISTS TAB
   ============================================================ */
function ArtistsTab({ onEnquire }) {
  return (
    <section className="section-wide" style={{ paddingTop: 56 }}>
      <div className="section-head">
        <h2>The collection</h2>
      </div>
      <p className="lede" style={{ marginBottom: 32 }}>Every piece currently available, by Margarita.</p>
      <div className="grid">
        {ARTWORKS.map((a) => <PaintingCard key={a.id} artwork={a} onEnquire={onEnquire} />)}
      </div>
    </section>
  );
}

/* ============================================================
   MARGARITA TAB (contact)
   ============================================================ */
function MargaritaTab({ prefill }) {
  const [form, setForm] = useState({ name: '', email: '', message: prefill ? `I'm interested in "${prefill.title}" — could you tell me more?` : '' });
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (prefill) setForm((f) => ({ ...f, message: `I'm interested in "${prefill.title}" — could you tell me more?` }));
  }, [prefill]);

  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Enquiry from the website')}&body=${encodeURIComponent(form.message)}`;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) { setStatus('invalid'); return; }
    setStatus('sending');
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="section-narrow" style={{ paddingTop: 56 }}>
      <div className="margarita-grid">
        <div>
          <div className="portrait-frame"><img src="/margarita/portrait.jpg" alt="Margarita" /></div>
        </div>
        <div>
          <div className="eyebrow">About</div>
          <h2 style={{ marginTop: 6 }}>Margarita</h2>
          <p className="lede">
            Margarita is a painter working mostly in acrylic and oil, building toward a full body of
            work as she establishes herself as an arts specialist. This is placeholder copy — swap it
            for her real story: where she trained, what draws her to a piece, and what she wants people
            to feel standing in front of it.
          </p>

          <form className="contact-form" onSubmit={submit}>
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label>Message<textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
            {status === 'invalid' && <div className="form-note error">Fill in all three fields first.</div>}
            {status === 'sent' && <div className="form-note ok">Sent — thank you, we'll be in touch.</div>}
            {status === 'error' && <div className="form-note error">Couldn't send that yet — email directly below instead.</div>}
            <button className="btn-solid" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send message'}</button>
          </form>
          <a className="link" href={mailtoHref} style={{ display: 'inline-block', marginTop: 10 }}>Or email {CONTACT_EMAIL} directly →</a>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   APP
   ============================================================ */
export default function App() {
  const [tab, setTab] = useState(() => (typeof window !== 'undefined' && window.location.hash.replace('#', '')) || 'studio');
  const [enquiry, setEnquiry] = useState(null);

  useEffect(() => { if (typeof window !== 'undefined') window.location.hash = tab; }, [tab]);
  useEffect(() => {
    const goArtists = () => setTab('artists');
    document.addEventListener('go-artists', goArtists);
    return () => document.removeEventListener('go-artists', goArtists);
  }, []);

  const handleEnquire = (artwork) => {
    setEnquiry(artwork);
    setTab('margarita');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="site">
      <style>{`
        .site { --bg:#ffffff; --bg-soft:#faf8f4; --ink:#1a1a1a; --ink-soft:#6b6b64; --accent:#7a2530; --accent-soft:#f4e8e7; --border:#e6e3da;
          background:var(--bg); color:var(--ink); font-family:system-ui,-apple-system,sans-serif; min-height:100vh; }
        @keyframes tourPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        .nav { position:sticky; top:0; z-index:20; background:rgba(255,255,255,0.92); backdrop-filter:blur(8px); border-bottom:1px solid var(--border); }
        .nav-inner { max-width:1080px; margin:0 auto; padding:16px 24px; display:flex; align-items:center; justify-content:space-between; }
        .logo { font-family:Georgia,'Times New Roman',serif; font-style:italic; font-size:19px; cursor:pointer; }
        .tabs { display:flex; gap:28px; }
        .tab { background:none; border:none; font-size:13px; letter-spacing:0.5px; color:var(--ink-soft); cursor:pointer; padding:6px 0; border-bottom:2px solid transparent; }
        .tab.active { color:var(--ink); border-bottom-color:var(--accent); }
        .hero { max-width:720px; margin:0 auto; text-align:center; padding:72px 24px 40px; }
        .eyebrow { font-size:11px; letter-spacing:3px; color:var(--accent); margin-bottom:14px; }
        .hero h1 { font-family:Georgia,'Times New Roman',serif; font-style:italic; font-size:clamp(30px,5vw,48px); font-weight:400; margin:0 0 14px; }
        .hero-sub { color:var(--ink-soft); font-size:15px; margin:0 0 26px; }
        .section-narrow { max-width:640px; margin:0 auto; padding:20px 24px; }
        .section-wide { max-width:1080px; margin:0 auto; padding:40px 24px; }
        .lede { font-size:15px; line-height:1.75; color:var(--ink-soft); text-align:center; }
        .tour-shell { height:min(72vh, 640px); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
        .caption { font-size:12.5px; color:var(--ink-soft); text-align:center; margin-top:12px; }
        .section-head { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:24px; }
        .section-head h2 { font-family:Georgia,'Times New Roman',serif; font-style:italic; font-weight:400; font-size:26px; margin:0; }
        .link { background:none; border:none; color:var(--accent); font-size:13px; cursor:pointer; text-decoration:none; }
        .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:28px; }
        .card { display:flex; flex-direction:column; }
        .card-frame { background:#161514; padding:10px; border-radius:2px; margin-bottom:12px; }
        .card-frame img { width:100%; display:block; }
        .card-title { font-family:Georgia,'Times New Roman',serif; font-style:italic; font-size:16px; }
        .card-artist { font-size:11px; letter-spacing:1px; color:var(--accent); text-transform:uppercase; margin-top:2px; }
        .card-meta { font-size:12px; color:var(--ink-soft); margin:2px 0 12px; }
        .btn-solid, .btn-outline { font-size:13px; letter-spacing:0.5px; padding:11px 22px; border-radius:999px; cursor:pointer; }
        .btn-solid { background:var(--accent); color:#fff; border:1px solid var(--accent); }
        .btn-outline { background:transparent; color:var(--ink); border:1px solid var(--border); align-self:flex-start; }
        .btn-outline:hover { border-color:var(--accent); color:var(--accent); }
        .btn-sm { padding:8px 16px; font-size:12px; }
        .tour-chip { background:rgba(255,255,255,0.85); border:1px solid var(--border); color:var(--ink); font-size:11px; letter-spacing:0.5px; padding:6px 12px; border-radius:999px; pointer-events:none; }
        .tour-btn { background:rgba(255,255,255,0.85); border:1px solid var(--border); border-radius:999px; color:var(--ink); font-size:14px; cursor:pointer; }
        .margarita-grid { display:grid; grid-template-columns:220px 1fr; gap:48px; }
        .portrait-frame { background:#161514; padding:10px; border-radius:2px; }
        .portrait-frame img { width:100%; display:block; }
        .contact-form { display:flex; flex-direction:column; gap:14px; margin-top:22px; max-width:420px; }
        .contact-form label { font-size:12px; color:var(--ink-soft); display:flex; flex-direction:column; gap:6px; }
        .contact-form input, .contact-form textarea { font:inherit; font-size:14px; padding:10px 12px; border:1px solid var(--border); border-radius:8px; color:var(--ink); background:#fff; resize:vertical; }
        .contact-form input:focus, .contact-form textarea:focus { outline:none; border-color:var(--accent); }
        .form-note { font-size:12.5px; }
        .form-note.error { color:#a33; }
        .form-note.ok { color:#2f6b3d; }
        @media (max-width:720px){ .margarita-grid{ grid-template-columns:1fr; } .tabs{ gap:18px; } }
      `}</style>

      <Nav tab={tab} setTab={setTab} />
      {tab === 'studio' && <StudioTab onEnquire={handleEnquire} />}
      {tab === 'artists' && <ArtistsTab onEnquire={handleEnquire} />}
      {tab === 'margarita' && <MargaritaTab prefill={enquiry} />}

      <footer style={{ textAlign: 'center', padding: '40px 24px', fontSize: 12, color: 'var(--ink-soft)', borderTop: '1px solid var(--border)', marginTop: 40 }}>
        {BRAND} — placeholder site, built with Claude.
      </footer>
    </div>
  );
}
