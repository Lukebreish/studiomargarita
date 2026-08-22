import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import ReasonsSwiper from './ReasonsSwiper.jsx';
import { supabase } from './lib/supabaseClient.js';

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

/* ============================================================
   GALLERY DATA — fetched once from Supabase (artists + artworks
   tables) instead of hardcoded. To add or edit an artist/piece, use
   the Supabase dashboard (Table Editor) — no code changes or
   deploys needed. See supabase/migrations/ for the schema and
   README.md for the day-to-day editing workflow.
   ============================================================ */
function useGalleryData() {
  const [artists, setArtists] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [artistsRes, artworksRes] = await Promise.all([
        supabase.from('artists').select('*').order('sort_order'),
        supabase.from('artworks').select('*').order('sort_order'),
      ]);
      if (cancelled) return;
      if (artistsRes.error || artworksRes.error) {
        // eslint-disable-next-line no-console
        console.error(artistsRes.error || artworksRes.error);
        setStatus('error');
        return;
      }
      const artistList = artistsRes.data.map((a) => ({ id: a.id, name: a.name, country: a.country, image: a.image_url, note: a.bio_note }));
      const artistName = (id) => artistList.find((a) => a.id === id)?.name || id;
      setArtists(artistList);
      setArtworks(artworksRes.data.map((a) => ({
        id: a.id,
        artistId: a.artist_id,
        artist: artistName(a.artist_id),
        title: a.title,
        image: a.image_url,
        medium: a.medium,
        meta: a.medium,
        size: a.size,
        price: a.price ?? undefined,
        sold: a.status === 'sold',
        buyNowEnabled: a.buy_now_enabled,
        note: a.note,
        featured: a.featured,
        room: a.tour_room ?? undefined,
        wall: a.tour_wall ?? undefined,
        aspect: a.aspect ?? undefined,
      })));
      setStatus(cancelled ? 'loading' : 'ready');
    })();
    return () => { cancelled = true; };
  }, []);

  const tourArtworks = useMemo(() => artworks.filter((a) => a.room !== undefined && a.room !== null), [artworks]);
  const worksByArtist = (artistId) => artworks.filter((a) => a.artistId === artistId);

  return { artists, artworks, tourArtworks, worksByArtist, status };
}

const ART_STYLES = ['Abstract', 'Portrait', 'Landscape', 'Figurative', 'Contemporary', 'Acrylic', 'Oil Painting', 'Realism', 'Impressionism', 'Digital Art'];

const CONTACT_EMAIL = 'margartia@studiomargarita.art';

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
  ctx.font = '600 38px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText(title, w / 2, 76);
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillStyle = '#6B1F30';
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
  ctx.fillStyle = '#f4f0e2';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.035)';
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
  ctx.fillStyle = '#8a6135';
  ctx.fillRect(0, 0, w, h);
  const rand = mulberry32(7);
  for (let x = 0; x < w; x += 42) {
    ctx.strokeStyle = 'rgba(30,18,8,0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 18) {
    ctx.strokeStyle = `rgba(50,30,12,${0.12 + rand() * 0.12})`;
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

function MuseumTour({ onEnquire, artworks }) {
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
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xfff4e0, 0.42));
    scene.add(new THREE.HemisphereLight(0xf3ecd8, 0xc9a878, 0.4));

    const WAINSCOT_H = 1.05;
    const wallTex = generateWallTexture();
    wallTex.repeat.set(HALL_LEN / 4, (WALL_H - WAINSCOT_H) / 3);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.92 });
    const wainscotMat = new THREE.MeshStandardMaterial({ color: 0xd7cdb2, roughness: 0.85 });
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0xf7f3e8, roughness: 1 });
    const floorTex = generateFloorTexture();
    floorTex.repeat.set(ROOM_W / 2.2, HALL_LEN / 2.2);
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.35, metalness: 0.08 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x2a2016, roughness: 0.55, metalness: 0.15 });
    const frameMat = trimMat;
    const linerMat = new THREE.MeshStandardMaterial({ color: 0xb8925a, roughness: 0.3, metalness: 0.7 });
    const thresholdMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c0, roughness: 0.25, metalness: 0.05 });
    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x1c1a17, roughness: 0.4, metalness: 0.5 });
    const fixtureGlowMat = new THREE.MeshBasicMaterial({ color: 0xfff2d0 });

    const collidableBoxes = [];
    const artMeshes = [];
    const placardMeshes = [];
    const textureLoader = new THREE.TextureLoader();

    function buildWallX(cx, cz, tX, lenZ) {
      const wain = new THREE.Mesh(new THREE.BoxGeometry(tX, WAINSCOT_H, lenZ), wainscotMat);
      wain.position.set(cx, WAINSCOT_H / 2, cz); wain.receiveShadow = true; scene.add(wain);
      const upperH = WALL_H - WAINSCOT_H;
      const upper = new THREE.Mesh(new THREE.BoxGeometry(tX, upperH, lenZ), wallMat);
      upper.position.set(cx, WAINSCOT_H + upperH / 2, cz); upper.receiveShadow = true; scene.add(upper);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(tX + 0.02, 0.05, lenZ), trimMat);
      rail.position.set(cx, WAINSCOT_H, cz); scene.add(rail);
      const base = new THREE.Mesh(new THREE.BoxGeometry(tX + 0.02, 0.12, lenZ), trimMat);
      base.position.set(cx, 0.06, cz); scene.add(base);
    }
    function buildWallZ(cx, cz, lenX, tZ) {
      const wain = new THREE.Mesh(new THREE.BoxGeometry(lenX, WAINSCOT_H, tZ), wainscotMat);
      wain.position.set(cx, WAINSCOT_H / 2, cz); wain.receiveShadow = true; scene.add(wain);
      const upperH = WALL_H - WAINSCOT_H;
      const upper = new THREE.Mesh(new THREE.BoxGeometry(lenX, upperH, tZ), wallMat);
      upper.position.set(cx, WAINSCOT_H + upperH / 2, cz); upper.receiveShadow = true; scene.add(upper);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(lenX, 0.05, tZ + 0.02), trimMat);
      rail.position.set(cx, WAINSCOT_H, cz); scene.add(rail);
      const base = new THREE.Mesh(new THREE.BoxGeometry(lenX, 0.12, tZ + 0.02), trimMat);
      base.position.set(cx, 0.06, cz); scene.add(base);
    }

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, HALL_LEN), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -HALL_LEN / 2); floor.receiveShadow = true; scene.add(floor);

    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W, HALL_LEN), ceilMat);
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, WALL_H, -HALL_LEN / 2); scene.add(ceil);

    const thickness = 0.25;
    [-1, 1].forEach((side) => {
      buildWallX(side * (ROOM_W / 2), -HALL_LEN / 2, thickness, HALL_LEN);
      collidableBoxes.push({ minX: side * (ROOM_W / 2) - thickness, maxX: side * (ROOM_W / 2) + thickness, minZ: -HALL_LEN - 1, maxZ: 1 });
    });

    const doorW = 3;
    for (let i = 1; i < ROOMS; i++) {
      const z = -ROOM_D * i;
      [-1, 1].forEach((side) => {
        const segW = ROOM_W / 2 - doorW / 2;
        const segX = side * (doorW / 2 + segW / 2);
        buildWallZ(segX, z, segW, thickness);
        collidableBoxes.push({ minX: segX - segW / 2, maxX: segX + segW / 2, minZ: z - thickness, maxZ: z + thickness });
      });
      const threshold = new THREE.Mesh(new THREE.PlaneGeometry(doorW - 0.1, 1.0), thresholdMat);
      threshold.rotation.x = -Math.PI / 2; threshold.position.set(0, 0.006, z); threshold.receiveShadow = true; scene.add(threshold);
      [-1, 1].forEach((side) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, WALL_H * 0.82, thickness + 0.06), trimMat);
        post.position.set(side * (doorW / 2), (WALL_H * 0.82) / 2, z); scene.add(post);
      });
      const header = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.2, 0.14, thickness + 0.06), trimMat);
      header.position.set(0, WALL_H * 0.82 + 0.07, z); scene.add(header);
      const glow = new THREE.PointLight(0xfff0d8, 0.55, 8, 2);
      glow.position.set(0, 2.2, z - 2); scene.add(glow);
    }

    buildWallZ(0, -HALL_LEN, ROOM_W, thickness);
    collidableBoxes.push({ minX: -ROOM_W / 2 - 1, maxX: ROOM_W / 2 + 1, minZ: -HALL_LEN - thickness, maxZ: -HALL_LEN + thickness });

    artworks.forEach((info) => {
      const roomCenterZ = -(info.room * ROOM_D + ROOM_D / 2);
      let x, z, rotY, spotOffsetX = 0, spotOffsetZ = 0;
      if (info.wall === 'left') { x = -ROOM_W / 2; z = roomCenterZ; rotY = Math.PI / 2; spotOffsetX = 1.4; }
      else if (info.wall === 'right') { x = ROOM_W / 2; z = roomCenterZ; rotY = -Math.PI / 2; spotOffsetX = -1.4; }
      else { x = 0; z = -HALL_LEN; rotY = 0; spotOffsetZ = 1.4; }

      const dirX = info.wall === 'left' ? 1 : info.wall === 'right' ? -1 : 0;
      const dirZ = info.wall === 'back' ? 1 : 0;
      const w = info.wall === 'back' ? ART_W * 1.6 : ART_W;
      const hgt = w / (info.aspect || (ART_W / ART_H));

      const frame = new THREE.Mesh(new THREE.BoxGeometry(
        info.wall === 'back' ? w + 0.16 : 0.06,
        hgt + 0.16,
        info.wall === 'back' ? 0.06 : w + 0.16
      ), frameMat);
      frame.castShadow = true;
      const liner = new THREE.Mesh(new THREE.BoxGeometry(
        info.wall === 'back' ? w + 0.04 : 0.02,
        hgt + 0.04,
        info.wall === 'back' ? 0.02 : w + 0.04
      ), linerMat);
      const artTex = textureLoader.load(info.image);
      if (THREE.SRGBColorSpace) artTex.colorSpace = THREE.SRGBColorSpace; else artTex.encoding = THREE.sRGBEncoding;
      const artMat = new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.8 });
      const art = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), artMat);
      art.rotation.y = rotY; art.userData.info = info; artMeshes.push(art);

      const placardTex = new THREE.CanvasTexture(generatePlacardCanvas(info.title, info.artist, info.meta));
      const placard = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.34), new THREE.MeshBasicMaterial({ map: placardTex, transparent: true }));
      placard.rotation.y = rotY;

      const artY = 2.15;
      const placardY = artY - hgt / 2 - 0.28;
      frame.position.set(x + dirX * 0.03, artY, z + dirZ * 0.03);
      liner.position.set(x + dirX * 0.05, artY, z + dirZ * 0.05);
      art.position.set(x + dirX * 0.07, artY, z + dirZ * 0.07);
      placard.position.set(x + dirX * 0.07, placardY, z + dirZ * 0.07);
      scene.add(frame, liner, art, placard);
      placardMeshes.push({ mesh: placard, info });

      const spot = new THREE.SpotLight(0xfff2df, 2.1, 11, 0.5, 0.6);
      spot.position.set(x + spotOffsetX, WALL_H - 0.6, z + spotOffsetZ + (info.wall === 'back' ? 0 : 0.6));
      spot.castShadow = true;
      spot.shadow.mapSize.set(512, 512);
      spot.shadow.bias = -0.0018;
      const target = new THREE.Object3D();
      target.position.set(x + dirX * 0.5, artY - 0.2, z + dirZ * 0.5);
      scene.add(target); spot.target = target; scene.add(spot);

      const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.16), fixtureMat);
      fixture.position.set(spot.position.x, WALL_H - 0.05, spot.position.z);
      scene.add(fixture);
      const fixtureGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.1), fixtureGlowMat);
      fixtureGlow.rotation.x = Math.PI / 2;
      fixtureGlow.position.set(spot.position.x, WALL_H - 0.1, spot.position.z);
      scene.add(fixtureGlow);
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.load('600 38px "Space Grotesk"').then(() => document.fonts.ready).then(() => {
        placardMeshes.forEach(({ mesh, info }) => {
          mesh.material.map = new THREE.CanvasTexture(generatePlacardCanvas(info.title, info.artist, info.meta));
          mesh.material.needsUpdate = true;
        });
      }).catch(() => {});
    }


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
        const info = artworks.find((a) => a.id === st.hoveredId);
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
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 6, height: 6, marginLeft: -3, marginTop: -3, borderRadius: '50%', background: hovered ? '#6B1F30' : 'rgba(26,26,26,0.4)', transition: 'background 120ms', pointerEvents: 'none' }} />
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
          <div style={{ fontSize: 11, letterSpacing: '3px', color: '#6B1F30', marginBottom: 10 }}>THE VIRTUAL MUSEUM</div>
          <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 600, fontSize: 'clamp(24px,4vw,36px)', marginBottom: 14 }}>Walk through the collection</div>
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
            <div style={{ fontSize: 11, letterSpacing: '2px', color: '#6B1F30', marginBottom: 6 }}>ROOM {active.room + 1} OF {ROOMS}</div>
            <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 600, fontSize: 22, marginBottom: 4 }}>{active.title}</div>
            <div style={{ fontSize: 12, letterSpacing: '1.5px', color: '#6B1F30', textTransform: 'uppercase', marginBottom: 3 }}>{active.artist}</div>
            <div style={{ fontSize: 12, color: '#8a887f', marginBottom: 12 }}>{active.meta}</div>
            <div style={{ fontSize: 13, color: '#4a4a45', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 16px' }}>{active.note}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-solid" onClick={() => { onEnquire && onEnquire(active); closePanel(); }}>Enquire to purchase</button>
              <button className="btn-outline" onClick={() => { document.dispatchEvent(new CustomEvent('go-artists')); closePanel(); }}>View full collection</button>
            </div>
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
  const [arOpen, setArOpen] = useState(false);
  return (
    <div className="card">
      <div className="card-frame">
        <img src={artwork.image} alt={artwork.title} loading="lazy" />
        <img src="/assets/watermark.svg" alt="" className="card-watermark" />
      </div>
      <div className="card-title">{artwork.title}</div>
      <div className="card-artist">{artwork.artist}</div>
      <div className="card-meta-row">
        <span className="card-meta">{artwork.meta}</span>
        <span className="tag">Enquire</span>
      </div>
      <p className="card-note">{artwork.note}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn-outline btn-sm" onClick={() => onEnquire(artwork)}>Enquire to purchase</button>
        <button className="btn-outline btn-sm" onClick={() => setArOpen(true)}>View in your room</button>
      </div>
      {arOpen && <TryInRoom artwork={artwork} onClose={() => setArOpen(false)} />}
    </div>
  );
}

/* ============================================================
   TRY IN YOUR ROOM — camera preview with a draggable, resizable
   painting overlay (MVP: no real surface tracking, just a live
   camera feed behind a positionable image)
   ============================================================ */
function TryInRoom({ artwork, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const stateRef = useRef({ x: 0, y: 0, scale: 1, dragging: false, lastX: 0, lastY: 0, pinchDist: null });
  const imgRef = useRef(null);

  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (err) {
        setError('Camera access was blocked or unavailable. Check your browser\'s camera permission for this site and try again.');
      }
    })();
    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, []);

  useEffect(() => {
    const applyTransform = () => {
      if (imgRef.current) {
        const s = stateRef.current;
        imgRef.current.style.transform = `translate(-50%, -50%) translate(${s.x}px, ${s.y}px) scale(${s.scale})`;
      }
    };
    const dist = (t1, t2) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

    const onDown = (e) => {
      const p = e.touches ? e.touches[0] : e;
      stateRef.current.dragging = true;
      stateRef.current.lastX = p.clientX; stateRef.current.lastY = p.clientY;
      if (e.touches && e.touches.length === 2) stateRef.current.pinchDist = dist(e.touches[0], e.touches[1]);
    };
    const onMove = (e) => {
      const s = stateRef.current;
      if (e.touches && e.touches.length === 2) {
        const d = dist(e.touches[0], e.touches[1]);
        if (s.pinchDist) s.scale = Math.max(0.3, Math.min(3, s.scale * (d / s.pinchDist)));
        s.pinchDist = d;
        applyTransform();
        return;
      }
      if (!s.dragging) return;
      const p = e.touches ? e.touches[0] : e;
      s.x += p.clientX - s.lastX; s.y += p.clientY - s.lastY;
      s.lastX = p.clientX; s.lastY = p.clientY;
      applyTransform();
    };
    const onUp = () => { stateRef.current.dragging = false; stateRef.current.pinchDist = null; };
    const onWheel = (e) => {
      e.preventDefault();
      stateRef.current.scale = Math.max(0.3, Math.min(3, stateRef.current.scale * (1 - e.deltaY * 0.001)));
      applyTransform();
    };

    const el = imgRef.current;
    el?.addEventListener('mousedown', onDown);
    el?.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    el?.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el?.removeEventListener('mousedown', onDown);
      el?.removeEventListener('touchstart', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
      el?.removeEventListener('wheel', onWheel);
    };
  }, [ready]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000' }}>
      <video ref={videoRef} playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      {ready && !error && (
        <img
          ref={imgRef}
          src={artwork.image}
          alt={artwork.title}
          draggable={false}
          style={{
            position: 'absolute', top: '50%', left: '50%', width: 220, touchAction: 'none',
            transform: 'translate(-50%, -50%)', boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
            border: '10px solid #161514', cursor: 'grab', userSelect: 'none',
          }}
        />
      )}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="tour-chip" style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none' }}>
          {error ? 'Camera unavailable' : ready ? 'Drag to move · pinch or scroll to resize' : 'Starting camera…'}
        </div>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 18, cursor: 'pointer' }}>×</button>
      </div>
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <p style={{ color: '#fff', textAlign: 'center', maxWidth: 320, fontSize: 14, lineHeight: 1.6 }}>{error}</p>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   NAV
   ============================================================ */
function Nav({ tabKey, setTab }) {
  const tabs = [['studio', 'Studio'], ['art', 'Art'], ['artists', 'Artists'], ['margarita', 'Margarita']];
  return (
    <header className="nav">
      <div className="nav-inner">
        <a className="sm-logo logo-lockup" href="#" aria-label={BRAND} onClick={(e) => { e.preventDefault(); setTab('studio'); }}>
          <span className="sm-logo-studio">Studio</span>
          <span className="sm-logo-name">Margarita</span>
        </a>
        <a className="sm-logo sm-mark logo-symbol" href="#" aria-label={BRAND} onClick={(e) => { e.preventDefault(); setTab('studio'); }}>
          <span className="sm-logo-mark">M</span>
        </a>
        <nav className="tabs">
          {tabs.map(([key, label]) => (
            <button key={key} className={'tab' + (tabKey === key ? ' active' : '')} onClick={() => setTab(key)}>{label}</button>
          ))}
        </nav>
      </div>
    </header>
  );
}

/* ============================================================
   STUDIO TAB (home)
   ============================================================ */
/* ============================================================
   HOME HERO — art-directed banner (different crop for mobile/desktop)
   ============================================================ */
function HomeHero({ onExplore }) {
  return (
    <section className="home-hero">
      <picture>
        <source media="(max-width: 720px)" srcSet="/hero/mobile.jpg" />
        <img src="/hero/desktop.jpg" alt="" className="home-hero-img" />
      </picture>
      <div className="home-hero-panel crop"><div className="crop-b" />
        <h1>Welcome to Studio Margarita</h1>
        <p>A digital gallery for discovering exceptional art and the artists behind it. Explore, connect, and find something that feels uniquely yours.</p>
        <button className="btn-solid" onClick={onExplore}>View exclusive pieces</button>
      </div>
    </section>
  );
}

/* ============================================================
   NEWSLETTER / INTEREST SIGNUP — deliberately minimal
   ============================================================ */
function SignupForm() {
  const [form, setForm] = useState({ name: '', email: '', styles: [] });
  const [status, setStatus] = useState('idle');

  const toggleStyle = (style) => {
    setForm((f) => {
      if (style === 'All of the above') {
        const allSelected = f.styles.length === ART_STYLES.length;
        return { ...f, styles: allSelected ? [] : [...ART_STYLES] };
      }
      const has = f.styles.includes(style);
      return { ...f, styles: has ? f.styles.filter((s) => s !== style) : [...f.styles, style] };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setStatus('invalid'); return; }
    setStatus('sending');
    const { error } = await supabase.from('signups').insert({
      name: form.name,
      email: form.email,
      style_preferences: form.styles,
    });
    setStatus(error ? 'error' : 'sent');
  };

  const allChecked = form.styles.length === ART_STYLES.length;

  return (
    <section className="section-narrow section-rule">
      <div className="signup-box">
        <div className="eyebrow">Stay in the loop</div>
        <h2>Get first look at new work</h2>
        <p className="lede" style={{ marginBottom: 24 }}>One quick form — no spam, just new pieces and studio news.</p>
        <form className="signup-form" onSubmit={submit}>
          <div className="signup-row">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <fieldset className="style-picker">
            <legend>What styles catch your eye?</legend>
            <div className="style-options">
              {ART_STYLES.map((style) => (
                <label key={style} className="style-check">
                  <input type="checkbox" checked={form.styles.includes(style)} onChange={() => toggleStyle(style)} />
                  {style}
                </label>
              ))}
              <label className="style-check">
                <input type="checkbox" checked={allChecked} onChange={() => toggleStyle('All of the above')} />
                All of the above
              </label>
            </div>
          </fieldset>
          <button className="btn-solid" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Signing up…' : 'Sign up'}</button>
        </form>
        {status === 'invalid' && <div className="form-note error">Name and email, please.</div>}
        {status === 'sent' && <div className="form-note ok">You're on the list — thank you.</div>}
        {status === 'error' && <div className="form-note error">Couldn't sign up just now — try again shortly.</div>}
      </div>
    </section>
  );
}

/* ============================================================
   ARTISTS CAROUSEL — auto-scrolling row of artist portraits,
   teasing the full Artists directory (see ArtistsDirectory below)
   ============================================================ */
function ArtistsCarousel({ onSelectArtist, onSeeAll, onJoinTeam, artists }) {
  const loop = [...artists, ...artists];
  const wrapRef = useRef(null);
  const interacted = useRef(false); // once the visitor takes control, auto-scroll stops for good
  const dragging = useRef(false);
  const drag = useRef({ startX: 0, startScroll: 0, moved: 0 });

  // Auto-scroll via real scrollLeft (not a CSS transform) so it and manual
  // drag/swipe are the same coordinate system — no jump when handing off.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf, last;
    const speed = 26; // px/sec
    const tick = (now) => {
      if (last === undefined) last = now;
      const dt = (now - last) / 1000;
      last = now;
      if (!interacted.current && !dragging.current) {
        const half = el.scrollWidth / 2;
        el.scrollLeft = (el.scrollLeft + speed * dt) % half;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const stopAuto = () => { interacted.current = true; };
    el.addEventListener('touchstart', stopAuto, { passive: true });
    el.addEventListener('wheel', stopAuto, { passive: true });
    return () => { cancelAnimationFrame(raf); el.removeEventListener('touchstart', stopAuto); el.removeEventListener('wheel', stopAuto); };
  }, []);

  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') return; // touch gets native swipe scrolling for free
    interacted.current = true;
    dragging.current = true;
    drag.current = { startX: e.clientX, startScroll: wrapRef.current.scrollLeft, moved: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    wrapRef.current.scrollLeft = drag.current.startScroll - dx;
  };
  const endDrag = () => { dragging.current = false; };
  const handleSelect = (id) => { if (drag.current.moved < 6) onSelectArtist(id); };

  return (
    <section className="section-wide section-rule">
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'inherit', fontWeight: 500, letterSpacing: '-0.035em', fontSize: 'clamp(24px,3.4vw,34px)', margin: 0 }}>
          Our Artists
        </h2>
        <p className="lede" style={{ marginTop: 10 }}>Our artists are from all over the world with a very diverse taste and talent.</p>
      </div>
      <div
        className="community-track-wrap"
        ref={wrapRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <div className="community-track">
          {loop.map((a, i) => (
            <button
              type="button"
              className="community-item"
              key={`${a.id}-${i}`}
              aria-hidden={i >= artists.length ? 'true' : undefined}
              tabIndex={i >= artists.length ? -1 : 0}
              onClick={() => handleSelect(a.id)}
            >
              <div className="community-photo"><img src={a.image} alt={a.name} loading="lazy" draggable={false} /></div>
              <div className="community-name">{a.name}</div>
              <div className="community-country">{a.country}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-outline" onClick={onSeeAll}>Meet the artist</button>
        <button className="btn-outline" onClick={onJoinTeam}>Join the team</button>
      </div>
    </section>
  );
}

/* ============================================================
   ARTISTS DIRECTORY — reached via "Meet the artist" (not in the
   main nav, keeps Studio/Artists/Margarita uncluttered). A single
   page: click a face and their story expands in place below the
   grid — no navigation, no separate profile URL.
   ============================================================ */
function ArtistsDirectory({ onEnquire, initialSelected, artists, worksByArtist }) {
  const [selectedId, setSelectedId] = useState(initialSelected || null);
  const panelRef = useRef(null);

  const worksByArtistId = useMemo(
    () => Object.fromEntries(artists.map((a) => [a.id, worksByArtist(a.id)])),
    [artists, worksByArtist]
  );

  const selected = artists.find((a) => a.id === selectedId) || null;
  const selectedWorks = selected ? worksByArtistId[selected.id] : [];

  const selectArtist = (id) => setSelectedId((current) => (current === id ? null : id));

  useEffect(() => {
    if (selectedId && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  return (
    <section className="section-wide" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <div className="section-head">
        <h2>Our Artists</h2>
      </div>
      <p className="lede" style={{ marginBottom: 32 }}>Every artist in the Studio Margarita community — click a face for their story and available work.</p>

      <div className="artist-directory-grid">
        {artists.map((a) => (
          <button
            type="button"
            className={'artist-directory-card' + (selectedId === a.id ? ' active' : '')}
            key={a.id}
            onClick={() => selectArtist(a.id)}
            aria-pressed={selectedId === a.id}
          >
            <div className="artist-directory-photo"><img src={a.image} alt={a.name} loading="lazy" /></div>
            <div className="artist-directory-name">{a.name}</div>
            <div className="artist-directory-country">{a.country}</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="artist-panel" ref={panelRef}>
          <div className="artist-profile-head">
            <div className="artist-profile-portrait">
              <div className="artist-profile-ring"><img src={selected.image} alt={selected.name} /></div>
              <div className="artist-profile-name">{selected.name}</div>
              <div className="artist-profile-country">{selected.country}</div>
            </div>
            <div className="artist-profile-note">
              <div className="eyebrow">Margarita on {selected.name}</div>
              <blockquote>&ldquo;{selected.note}&rdquo;</blockquote>
              <button className="link" onClick={() => setSelectedId(null)} style={{ marginTop: 18, alignSelf: 'flex-start' }}>Close ×</button>
            </div>
          </div>

          <div style={{ paddingTop: 32 }}>
            <div className="section-head">
              <h3 style={{ fontFamily: 'inherit', fontWeight: 500, letterSpacing: '-0.03em', fontSize: 19, margin: 0 }}>Available from {selected.name}</h3>
              {selectedWorks.length > 0 && <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{selectedWorks.length} piece{selectedWorks.length === 1 ? '' : 's'}</span>}
            </div>
            {selectedWorks.length > 0 ? (
              <div className="grid">
                {selectedWorks.map((w, i) => (
                  <div className="card" key={i}>
                    <div className="card-frame"><img src={w.image} alt={w.title} loading="lazy" /></div>
                    <div className="card-title">{w.title}</div>
                    <button className="btn-outline btn-sm" style={{ marginTop: 10 }} onClick={() => onEnquire({ id: w.id, title: w.title })}>Enquire to purchase</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="artist-empty-state">
                <p>No pieces from {selected.name} are listed for sale right now — enquire directly and Margarita will let you know what's available or coming soon.</p>
                <button className="btn-solid" onClick={() => onEnquire({ title: `${selected.name}'s work` })}>Enquire about {selected.name}'s work</button>
              </div>
            )}
          </div>
        </div>
      )}

      <JoinTeamForm />
    </section>
  );
}

/* ============================================================
   JOIN THE TEAM — artist applications, a separate lead pipeline
   from buyer enquiries (writes to artist_applications, not
   enquiries). See supabase/migrations/003_artist_applications.sql.
   ============================================================ */
// Canonical English values — always what's stored in Supabase, regardless
// of which language the applicant fills the form in, so the exhibition_
// history column stays consistent for whoever reviews applications.
const EXHIBITION_HISTORY_OPTIONS = [
  'Never exhibited/sold',
  'Sold work informally (friends, social media, local markets)',
  'Shown in a gallery or exhibition',
  'Represented by a gallery/agent before',
];

// Add more languages here later — each entry just needs the same keys.
const JOIN_TEAM_I18N = {
  en: {
    label: 'EN',
    eyebrow: 'Join the studio',
    title: 'Are you an artist?',
    subtitle: "We're always looking for new voices to represent — tell us about your work.",
    name: 'Name',
    email: 'Email',
    country: 'Country',
    portfolio: 'Instagram, website, or portfolio link',
    portfolioPlaceholder: '@yourhandle, a link, or anything that shows your work',
    exhibition: 'Exhibition / sales history',
    selectOne: 'Select one',
    exhibitionOptions: [
      'Never exhibited/sold',
      'Sold work informally (friends, social media, local markets)',
      'Shown in a gallery or exhibition',
      'Represented by a gallery/agent before',
    ],
    statement: 'A few words about your work (optional)',
    submit: 'Submit application',
    submitting: 'Submitting…',
    invalid: 'Name, email, and a portfolio link are required.',
    sent: "Thank you — Margarita will be in touch if it's a fit.",
    error: "Couldn't submit just now — try again shortly.",
  },
  ru: {
    label: 'RU',
    eyebrow: 'Присоединяйтесь к студии',
    title: 'Вы художник?',
    subtitle: 'Мы всегда ищем новые имена — расскажите нам о своей работе.',
    name: 'Имя',
    email: 'Email',
    country: 'Страна',
    portfolio: 'Instagram, сайт или ссылка на портфолио',
    portfolioPlaceholder: '@ваш_ник, ссылка — что угодно, где видно ваши работы',
    exhibition: 'Опыт выставок / продаж',
    selectOne: 'Выберите вариант',
    exhibitionOptions: [
      'Никогда не выставлял(а) и не продавал(а) работы',
      'Продавал(а) неофициально (друзьям, в соцсетях, на местных рынках)',
      'Выставлялся(-лась) в галерее или на выставке',
      'Ранее был(а) представлен(а) галереей/агентом',
    ],
    statement: 'Несколько слов о вашей работе (необязательно)',
    submit: 'Отправить заявку',
    submitting: 'Отправка…',
    invalid: 'Имя, email и ссылка на портфолио обязательны.',
    sent: 'Спасибо — Маргарита свяжется с вами, если это подходящий вариант.',
    error: 'Не удалось отправить — попробуйте ещё раз чуть позже.',
  },
};

function JoinTeamForm() {
  const [lang, setLang] = useState('en');
  const t = JOIN_TEAM_I18N[lang];
  const [form, setForm] = useState({ name: '', email: '', country: '', portfolio: '', exhibitionHistory: '', statement: '' });
  const [status, setStatus] = useState('idle');

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.portfolio.trim()) { setStatus('invalid'); return; }
    setStatus('sending');
    const { error } = await supabase.from('artist_applications').insert({
      name: form.name,
      email: form.email,
      country: form.country || null,
      portfolio_url: form.portfolio,
      exhibition_history: form.exhibitionHistory || null,
      statement: form.statement || null,
    });
    setStatus(error ? 'error' : 'sent');
  };

  return (
    <section id="join-team-form" style={{ marginTop: 72, paddingTop: 56, borderTop: '2px solid var(--ink)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {Object.keys(JOIN_TEAM_I18N).map((code) => (
            <button
              key={code}
              type="button"
              className="tag"
              style={lang === code ? undefined : { background: 'transparent', color: 'var(--ink-soft)', borderColor: 'var(--rule)' }}
              onClick={() => setLang(code)}
            >
              {JOIN_TEAM_I18N[code].label}
            </button>
          ))}
        </div>
        <div className="eyebrow">{t.eyebrow}</div>
        <h2 style={{ fontFamily: 'inherit', fontWeight: 500, letterSpacing: '-0.035em', fontSize: 'clamp(24px,3.4vw,34px)', margin: '0 0 10px' }}>{t.title}</h2>
        <p className="lede" style={{ marginBottom: 24 }}>{t.subtitle}</p>
      </div>
      <form className="contact-form" onSubmit={submit} style={{ margin: '0 auto' }}>
        <label>{t.name}<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label>{t.email}<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>{t.country}<input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></label>
        <label>{t.portfolio}
          <input value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} placeholder={t.portfolioPlaceholder} />
        </label>
        <label>{t.exhibition}
          <select value={form.exhibitionHistory} onChange={(e) => setForm({ ...form, exhibitionHistory: e.target.value })}>
            <option value="">{t.selectOne}</option>
            {EXHIBITION_HISTORY_OPTIONS.map((value, i) => <option key={value} value={value}>{t.exhibitionOptions[i]}</option>)}
          </select>
        </label>
        <label>{t.statement}
          <textarea rows={4} value={form.statement} onChange={(e) => setForm({ ...form, statement: e.target.value })} />
        </label>
        {status === 'invalid' && <div className="form-note error">{t.invalid}</div>}
        {status === 'sent' && <div className="form-note ok">{t.sent}</div>}
        {status === 'error' && <div className="form-note error">{t.error}</div>}
        <button className="btn-solid" type="submit" disabled={status === 'sending'}>{status === 'sending' ? t.submitting : t.submit}</button>
      </form>
    </section>
  );
}

function StudioTab({ onEnquire, goMargarita, onSelectArtist, onSeeAllArtists, onJoinTeam, artists, tourArtworks, worksByArtist }) {
  const featured = tourArtworks.filter((a) => a.featured);
  // "A closer look" highlights 4 pieces across different artists (2 x 2, for
  // now Ellisar + Rayan) rather than reusing the tour's featured artworks —
  // swap the titles below to feature different pieces.
  const closerLook = useMemo(() => {
    const pick = (artistId, artistName, titles) =>
      worksByArtist(artistId)
        .filter((w) => titles.includes(w.title))
        .map((w) => ({ image: w.image, title: w.title, artist: artistName, meta: w.medium, note: w.size }));
    return [
      ...pick('ellisar', 'Ellisar', ['Genetically Modified II', 'Digital Painting II']),
      ...pick('rayan', 'Rayan', ['Reflection', 'Within']),
    ];
  }, [worksByArtist]);
  const closerLookRef = useRef(null);
  return (
    <>
      <HomeHero onExplore={() => closerLookRef.current?.scrollIntoView({ behavior: 'smooth' })} />

      <section className="section-narrow" style={{ textAlign: 'center', paddingTop: 48 }}>
        <h2 style={{ fontFamily: 'inherit', fontWeight: 500, letterSpacing: '-0.035em', fontSize: 'clamp(24px,3.4vw,34px)', margin: 0 }}>
          What are you looking for?
        </h2>
      </section>

      <section className="reasons-hero-wrap">
        <ReasonsSwiper artworks={featured} onEnquire={onEnquire} />
      </section>

      <SignupForm />

      <section className="section-wide section-rule" ref={closerLookRef}>
        <div className="section-head">
          <h2>A closer look</h2>
          <button className="link" onClick={() => document.dispatchEvent(new CustomEvent('go-artists'))}>View the full collection →</button>
        </div>
        <div className="grid">
          {closerLook.map((a) => <PaintingCard key={a.title} artwork={a} onEnquire={onEnquire} />)}
        </div>
      </section>

      <div className="poster">
        <div className="eyebrow">Talk to Margarita</div>
        <h2>Not sure which piece is right for the wall?</h2>
        <button className="btn-solid" onClick={goMargarita}>Get in touch</button>
      </div>

      <ArtistsCarousel onSelectArtist={onSelectArtist} onSeeAll={onSeeAllArtists} onJoinTeam={onJoinTeam} artists={artists} />
    </>
  );
}

/* ============================================================
   ARTISTS TAB
   ============================================================ */
/* ============================================================
   ART — headless-commerce catalog. Every artwork (3D-tour pieces and
   artist-profile pieces alike now live in one Supabase table) mapped
   into one filterable collection (artist, medium, price sort).
   ============================================================ */
function useCatalog(artworks) {
  return useMemo(
    () => artworks.map((a) => ({
      key: a.id,
      image: a.image,
      title: a.title,
      artist: a.artist,
      medium: a.medium,
      price: a.price,
      size: a.size,
      sold: !!a.sold,
    })),
    [artworks]
  );
}

// Collapses the raw medium strings in the database into a short, clickable
// tag set — "Oil on canvas on compressed cardboard support" and "Oil on
// linen" both become the one "Oil" tag, etc.
function mediumGroup(medium) {
  if (!medium) return 'Other';
  const m = medium.toLowerCase();
  if (m.includes('charcoal')) return 'Charcoal';
  if (m.includes('digital')) return 'Digital';
  if (m.includes('mixed media')) return 'Mixed media';
  if (m.includes('acrylic')) return 'Acrylic';
  if (m.includes('oil')) return 'Oil';
  return 'Other';
}

const SORT_TAGS = [['featured', 'Featured'], ['price-asc', 'Price ↑'], ['price-desc', 'Price ↓']];

function ArtTab({ onEnquire, artists, artworks }) {
  const catalog = useCatalog(artworks);
  const [artistFilter, setArtistFilter] = useState('all');
  const [mediumFilter, setMediumFilter] = useState('all');
  const [sort, setSort] = useState('featured');

  const artistOptions = useMemo(() => artists.map((a) => a.name), [artists]);
  const mediumOptions = useMemo(
    () => Array.from(new Set(catalog.map((i) => mediumGroup(i.medium)))).sort(),
    [catalog]
  );

  const filtered = useMemo(() => {
    let items = catalog.filter(
      (i) => (artistFilter === 'all' || i.artist === artistFilter) && (mediumFilter === 'all' || mediumGroup(i.medium) === mediumFilter)
    );
    if (sort === 'price-asc') items = [...items].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === 'price-desc') items = [...items].sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    return items;
  }, [catalog, artistFilter, mediumFilter, sort]);

  const clearFilters = () => { setArtistFilter('all'); setMediumFilter('all'); };
  const filtersActive = artistFilter !== 'all' || mediumFilter !== 'all';

  return (
    <section className="section-wide" style={{ paddingTop: 40 }}>
      <div className="art-header">
        <h2 style={{ margin: 0 }}>The Collection</h2>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{filtered.length} piece{filtered.length === 1 ? '' : 's'}{filtersActive ? <> · <button className="link" onClick={clearFilters} style={{ fontSize: 12 }}>clear</button></> : null}</span>
      </div>

      <div className="filter-groups">
        <div className="filter-group">
          <span className="filter-group-label">Artist</span>
          <div className="filter-chips">
            <button type="button" className={'filter-chip' + (artistFilter === 'all' ? ' active' : '')} onClick={() => setArtistFilter('all')}>All</button>
            {artistOptions.map((name) => (
              <button type="button" key={name} className={'filter-chip' + (artistFilter === name ? ' active' : '')} onClick={() => setArtistFilter(name)}>{name}</button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-group-label">Medium</span>
          <div className="filter-chips">
            <button type="button" className={'filter-chip' + (mediumFilter === 'all' ? ' active' : '')} onClick={() => setMediumFilter('all')}>All</button>
            {mediumOptions.map((m) => (
              <button type="button" key={m} className={'filter-chip' + (mediumFilter === m ? ' active' : '')} onClick={() => setMediumFilter(m)}>{m}</button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-group-label">Sort</span>
          <div className="filter-chips">
            {SORT_TAGS.map(([key, label]) => (
              <button type="button" key={key} className={'filter-chip' + (sort === key ? ' active' : '')} onClick={() => setSort(key)}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid">
          {filtered.map((item) => (
            <div className="card" key={item.key}>
              <div className="card-frame">
                <img src={item.image} alt={item.title} loading="lazy" />
                {item.sold && <div className="sold-badge">Sold</div>}
              </div>
              <div className="card-title">{item.title}</div>
              <div className="card-artist">{item.artist}</div>
              <div className="card-meta-row">
                <span className="card-meta">{[item.medium, item.size].filter(Boolean).join(' · ') || '—'}</span>
                <span className="card-meta">{item.price ? `$${item.price.toLocaleString()}` : 'On enquiry'}</span>
              </div>
              <button className="btn-outline btn-sm" disabled={item.sold} onClick={() => onEnquire({ id: item.key, title: item.title })}>
                {item.sold ? 'Sold' : 'Enquire to purchase'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="artist-empty-state">
          <p>No pieces match those filters right now — try clearing them or check back soon.</p>
          <button className="btn-solid" onClick={clearFilters}>Clear filters</button>
        </div>
      )}
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
    const { error } = await supabase.from('enquiries').insert({
      artwork_id: prefill?.id || null,
      artwork_title: prefill?.title || null,
      name: form.name,
      email: form.email,
      message: form.message,
    });
    setStatus(error ? 'error' : 'sent');
  };

  return (
    <section className="section-narrow" style={{ paddingTop: 56 }}>
      <div className="margarita-grid">
        <div>
          <div className="crop portrait-frame"><div className="crop-b" /><img src="/margarita/portrait.jpg" alt="Margarita" /></div>
        </div>
        <div>
          <div className="eyebrow">About</div>
          <h2 style={{ marginTop: 6 }}>Margarita</h2>
          <div className="bio">
            <p>Born in Saint Petersburg, Margarita has spent her career chasing beautiful things across more than forty countries — studios, auction houses, and private collections most people never see.</p>
            <p>She doesn't sell paintings. She reads people, then finds the piece that was always meant for them — available around the clock, wherever you are, to talk about what moves you.</p>
          </div>

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
  const gallery = useGalleryData();
  // Which artist should already be expanded when the Our Artists page loads —
  // set when arriving via a specific face on the home carousel. It's local
  // state, not part of the route: the Artists page never changes URL when
  // you pick an artist, it just expands in place.
  const [pendingArtist, setPendingArtist] = useState(null);

  useEffect(() => { if (typeof window !== 'undefined') window.location.hash = tab; }, [tab]);
  useEffect(() => {
    const goArtists = () => setTab('artists');
    document.addEventListener('go-artists', goArtists);
    return () => document.removeEventListener('go-artists', goArtists);
  }, []);

  const goToArtist = (id) => { setPendingArtist(id); setTab('artists'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goToArtistsDirectory = () => { setPendingArtist(null); setTab('artists'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goToJoinTeam = () => {
    setPendingArtist(null);
    setTab('artists');
    setTimeout(() => document.getElementById('join-team-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleEnquire = (artwork) => {
    setEnquiry(artwork);
    setTab('margarita');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="site">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
        .site { --bg:#f6f4f4; --surface:#ffffff; --ink:#1a1416; --ink-soft:#6f6266; --rule:#d6cfd0;
          --accent:#6b1f30; --accent-deep:#4a1420; --accent-tint:#f2e7ea; --accent-light:#d9a7b3; --rose:#e0c3ca; --radius:0;
          background:var(--bg); color:var(--ink); font-family:'Space Grotesk', system-ui, -apple-system, sans-serif; min-height:100vh; }
        .site * { box-sizing:border-box; }
        @keyframes tourPulse { 0%,100%{opacity:.6} 50%{opacity:1} }

        /* crop-mark bracket wrapper — the brand's signature corner motif */
        .crop { position:relative; padding:32px; }
        .crop::before, .crop::after, .crop .crop-b::before, .crop .crop-b::after {
          content:''; position:absolute; width:22px; height:22px; border-color:var(--accent); border-style:solid; border-width:0; }
        .crop::before { left:0; top:0; border-left-width:3px; border-top-width:3px; }
        .crop::after { right:0; top:0; border-right-width:3px; border-top-width:3px; }
        .crop .crop-b { position:absolute; inset:0; pointer-events:none; }
        .crop .crop-b::before { left:0; bottom:0; border-left-width:3px; border-bottom-width:3px; }
        .crop .crop-b::after { right:0; bottom:0; border-right-width:3px; border-bottom-width:3px; }

        .tag { display:inline-flex; align-items:center; font-size:10px; font-weight:500; letter-spacing:0.16em;
          text-transform:uppercase; padding:5px 9px; border:2px solid var(--accent); color:var(--accent); background:var(--accent-tint); }
        .tag-quiet { border-color:var(--rule); color:var(--ink-soft); background:transparent; }

        .nav { position:sticky; top:0; z-index:20; background:var(--bg); border-bottom:2px solid var(--ink); }
        .nav-inner { max-width:1120px; margin:0 auto; padding:14px 24px; display:flex; align-items:center; justify-content:space-between; }
        /* Logo — pure CSS wordmark, no image asset needed above 16px. */
        .sm-logo {
          --tick: 0.42em; --tick-w: 0.08em;
          position:relative; display:inline-flex; flex-direction:column;
          padding:0.42em 0.47em; font-family:inherit; font-weight:500; line-height:0.9;
          color:var(--ink); text-decoration:none; cursor:pointer;
        }
        .sm-logo::before, .sm-logo::after { content:''; position:absolute; width:var(--tick); height:var(--tick); border:0 solid var(--accent); }
        .sm-logo::before { left:0; top:0; border-left-width:var(--tick-w); border-top-width:var(--tick-w); }
        .sm-logo::after { right:0; bottom:0; border-right-width:var(--tick-w); border-bottom-width:var(--tick-w); }
        .sm-logo-studio { color:var(--accent); letter-spacing:-0.04em; }
        .sm-logo-name { letter-spacing:-0.05em; }
        .sm-logo--reverse { color:#fff; }
        .sm-logo--reverse::before, .sm-logo--reverse::after { border-color:var(--accent-light); }
        .sm-logo--reverse .sm-logo-studio { color:var(--accent-light); }
        .sm-mark .sm-logo-mark { letter-spacing:-0.06em; line-height:0.8; }

        .logo-lockup { display:block; font-size:18px; }
        .logo-symbol { display:none; font-size:16px; }
        .tabs { display:flex; gap:28px; }
        .tab { background:none; border:none; font-size:12px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase;
          color:var(--ink-soft); cursor:pointer; padding:4px 0 6px; box-shadow: inset 0 -2px 0 transparent; }
        .tab:hover, .tab.active { color:var(--accent); box-shadow: inset 0 -2px 0 var(--accent); }
        @media (max-width:520px){ .logo-lockup{ display:none; } .logo-symbol{ display:block; } .tabs{ gap:16px; } }

        .section-rule { border-top:2px solid var(--ink); padding-top:56px; }
        .hero { max-width:760px; margin:0 auto; text-align:center; padding:64px 24px 44px; }
        .hero-crop { display:inline-block; }
        .eyebrow { font-size:11px; font-weight:500; letter-spacing:0.24em; text-transform:uppercase; color:var(--accent); margin-bottom:16px; }
        .hero h1 { font-family:inherit; font-weight:500; letter-spacing:-0.04em; line-height:0.98; font-size:clamp(32px,6vw,60px); margin:0 0 16px; }
        .hero-sub { color:var(--ink-soft); font-size:16px; margin:0 0 28px; }
        .section-narrow { max-width:640px; margin:0 auto; padding:20px 24px; }
        .section-wide { max-width:1120px; margin:0 auto; padding:56px 24px; }
        .lede { font-size:16px; line-height:1.7; color:var(--ink-soft); text-align:center; }
        .bio p { font-size:15px; line-height:1.75; color:var(--ink-soft); text-align:left; margin:0 0 16px; }
        .tour-shell { height:min(72vh, 640px); border:2px solid var(--ink); overflow:hidden; }
        .caption { font-size:12.5px; color:var(--ink-soft); text-align:center; margin-top:14px; }
        .section-head { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:28px; gap:16px; flex-wrap:wrap; }
        .section-head h2 { font-family:inherit; font-weight:500; letter-spacing:-0.035em; font-size:clamp(24px,3.4vw,34px); margin:0; }
        .link { background:none; border:none; color:var(--accent); font-size:13px; font-weight:500; cursor:pointer;
          text-decoration:none; border-bottom:2px solid var(--rose); padding-bottom:1px; }
        .link:hover { border-bottom-color:var(--accent); }

        .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(230px,1fr)); gap:32px; }
        .card { display:flex; flex-direction:column; }
        .card-frame { position:relative; aspect-ratio:4/5; background:var(--rule); overflow:hidden; margin-bottom:14px; }
        .card:hover .card-frame { outline:2px solid var(--accent); outline-offset:6px; }
        .card-frame img { width:100%; height:100%; object-fit:cover; display:block; filter:saturate(0.92); }
        .card-watermark { position:absolute; right:8px; bottom:8px; width:26px; height:auto; opacity:0.95; }
        .card-title { font-family:inherit; font-weight:500; letter-spacing:-0.03em; font-size:17px; }
        .card-artist { font-size:11px; font-weight:500; letter-spacing:0.12em; color:var(--accent); text-transform:uppercase; margin-top:3px; }
        .card-meta-row { display:flex; justify-content:space-between; align-items:center; gap:8px; margin:6px 0 10px; padding-top:8px; border-top:2px solid var(--rule); }
        .card-meta { font-size:12px; color:var(--ink-soft); }
        .card-note { font-size:13px; color:var(--ink-soft); line-height:1.6; margin:0 0 14px; }

        .btn-solid, .btn-outline { font-family:inherit; font-size:12px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase;
          padding:13px 20px; border-radius:0; cursor:pointer; border:2px solid var(--accent); }
        .btn-solid { background:var(--accent); color:#fff; }
        .btn-solid:hover { background:var(--accent-deep); border-color:var(--accent-deep); }
        .btn-outline { background:transparent; color:var(--accent); align-self:flex-start; }
        .btn-outline:hover { background:var(--accent-tint); }
        .btn-sm { padding:10px 14px; font-size:11px; }
        .tour-chip { background:var(--surface); border:2px solid var(--accent); color:var(--ink); font-size:10.5px; font-weight:500;
          letter-spacing:0.12em; text-transform:uppercase; padding:7px 12px; pointer-events:none; }
        .tour-btn { background:var(--surface); border:2px solid var(--ink); color:var(--ink); font-size:14px; cursor:pointer; }

        .poster { background:var(--accent); color:#fff; padding:64px 24px; text-align:center; }
        .poster .eyebrow { color:var(--rose); }
        .poster h2 { font-family:inherit; font-weight:500; letter-spacing:-0.035em; font-size:clamp(22px,3.2vw,32px); margin:0 0 18px; }
        .poster .btn-solid { background:#fff; color:var(--accent); border-color:#fff; }
        .poster .btn-solid:hover { background:var(--rose); border-color:var(--rose); }

        .margarita-grid { display:grid; grid-template-columns:220px 1fr; gap:52px; }
        .crop.portrait-frame { padding:14px; }
        .portrait-frame img { width:100%; display:block; }
        .contact-form { display:flex; flex-direction:column; gap:14px; margin-top:24px; max-width:420px; }
        .contact-form label { font-size:11px; font-weight:500; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-soft); display:flex; flex-direction:column; gap:7px; }
        .contact-form input, .contact-form textarea, .contact-form select { font:inherit; font-size:14px; padding:12px 13px; border:2px solid var(--ink); border-radius:0; color:var(--ink); background:#fff; resize:vertical; }
        .contact-form input:focus, .contact-form textarea:focus, .contact-form select:focus { outline:2px solid var(--accent); outline-offset:2px; border-color:var(--accent); }
        .form-note { font-size:12.5px; }
        .form-note.error { color:#a33; }
        .form-note.ok { color:#2f6b3d; }

        .site-footer { background:var(--ink); color:#fff; padding:56px 24px 32px; margin-top:40px; }
        .site-footer-inner { max-width:1120px; margin:0 auto; display:flex; flex-direction:column; gap:28px; }
        .site-footer .footer-logo { font-size:18px; align-self:flex-start; }
        .site-footer-links { display:flex; gap:24px; flex-wrap:wrap; }
        .site-footer-links a, .site-footer-links button { color:var(--rose); font-size:12px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase;
          background:none; border:none; padding:0; cursor:pointer; text-decoration:none; border-bottom:2px solid transparent; }
        .site-footer-links a:hover, .site-footer-links button:hover { border-bottom-color:var(--rose); }
        .site-footer-bottom { border-top:1px solid rgba(255,255,255,0.15); padding-top:20px; font-size:11.5px; color:rgba(255,255,255,0.55); }

        @media (max-width:720px){ .margarita-grid{ grid-template-columns:1fr; } }

        /* Reasons swiper hero ------------------------------------------- */
        .reasons-hero-wrap { border-bottom:2px solid var(--ink); }
        .reasons-swiper { width:100%; }
        .reasons-swiper .swiper { width:100%; height:min(86vh, 780px); min-height:460px; }
        .reasons-swiper .swiper-slide { position:relative; overflow:hidden; background:var(--ink); }
        .reason-bg { position:absolute; inset:-8%; background-size:cover; background-position:center; }
        .reason-painting-frame { position:absolute; overflow:hidden; box-shadow:0 18px 40px rgba(0,0,0,0.35); }
        .reason-painting-frame img { width:100%; height:100%; object-fit:cover; display:block; }
        .reason-painting-frame.on-glass img { filter:saturate(0.96) brightness(1.02); }
        .glass-sheen { position:absolute; inset:0; pointer-events:none;
          background:linear-gradient(115deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 18%, rgba(255,255,255,0) 34%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.18) 100%); }
        .reason-caption { position:absolute; left:6%; bottom:9%; max-width:340px; background:rgba(255,255,255,0.94); border:2px solid var(--ink); padding:20px 22px; }
        .reason-caption .eyebrow { margin-bottom:8px; }
        .reason-caption p { font-size:14px; color:var(--ink-soft); line-height:1.55; margin:0 0 14px; max-width:none; }
        .reasons-swiper .swiper-button-next, .reasons-swiper .swiper-button-prev {
          color:var(--ink); background:rgba(255,255,255,0.85); width:44px; height:44px; border:2px solid var(--ink); }
        .reasons-swiper .swiper-button-next::after, .reasons-swiper .swiper-button-prev::after { font-size:16px; font-weight:700; }
        .reasons-swiper .swiper-button-next:hover, .reasons-swiper .swiper-button-prev:hover { background:var(--accent); color:#fff; border-color:var(--accent); }
        .reasons-swiper .swiper-pagination-bullet { width:9px; height:9px; border-radius:50%; background:#fff; opacity:0.6; border:2px solid var(--ink); }
        .reasons-swiper .swiper-pagination-bullet-active { background:var(--accent); border-color:var(--accent); opacity:1; }
        @media (max-width:720px){
          .reasons-swiper .swiper-button-next, .reasons-swiper .swiper-button-prev { display:none; }
          .reason-caption { left:5%; right:5%; max-width:none; bottom:7%; padding:16px 18px; }
        }

        /* Home hero banner ------------------------------------------------ */
        .home-hero { position:relative; width:100%; height:min(52vh, 460px); min-height:340px; overflow:hidden; border-bottom:2px solid var(--ink); }
        .home-hero-img { width:100%; height:100%; object-fit:cover; display:block; }
        .home-hero-panel { position:absolute; left:5%; bottom:8%; max-width:460px; background:rgba(255,255,255,0.95); }
        .home-hero-panel h1 { font-family:inherit; font-weight:500; letter-spacing:-0.04em; line-height:1.02; font-size:clamp(22px,3.4vw,34px); margin:0 0 12px; }
        .home-hero-panel p { font-size:14px; color:var(--ink-soft); line-height:1.55; margin:0 0 18px; max-width:none; }
        @media (max-width:720px){ .home-hero { height:min(78vh, 660px); min-height:440px; } .home-hero-panel { left:4%; right:4%; max-width:none; bottom:6%; padding:20px; } }

        /* Minimal signup form ---------------------------------------------- */
        .signup-box { text-align:center; }
        .signup-form { display:flex; flex-direction:column; gap:16px; max-width:520px; margin:0 auto; align-items:center; }
        .signup-row { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; width:100%; }
        .signup-row input { font:inherit; font-size:14px; padding:12px 13px; border:2px solid var(--ink); border-radius:0; color:var(--ink); background:#fff; flex:1 1 160px; min-width:140px; }
        .signup-row input:focus { outline:2px solid var(--accent); outline-offset:2px; border-color:var(--accent); }
        .style-picker { border:2px solid var(--ink); padding:14px 16px; width:100%; text-align:left; }
        .style-picker legend { padding:0 6px; font-size:11px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-soft); }
        .style-options { display:flex; flex-wrap:wrap; gap:10px 18px; margin-top:4px; }
        .style-check { display:flex; align-items:center; gap:7px; font-size:13px; color:var(--ink); cursor:pointer; }
        .style-check input { width:16px; height:16px; accent-color:var(--accent); cursor:pointer; }
        @media (max-width:520px){ .signup-row { flex-direction:column; } .signup-row input { width:100%; flex:0 0 auto; } }

        /* Community carousel — auto-scrolls via JS-driven scrollLeft, hands off
           to native touch swipe (mobile) or click-drag (desktop) the instant
           the visitor touches it, permanently. Same coordinate system for
           both, so there's no jump on handoff. ------------------------------ */
        .community-track-wrap { overflow-x:auto; overflow-y:hidden; margin-top:40px; cursor:grab; scrollbar-width:none;
          -webkit-mask-image:linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); mask-image:linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); }
        .community-track-wrap::-webkit-scrollbar { display:none; }
        .community-track-wrap:active { cursor:grabbing; }
        .community-track { display:flex; gap:56px; width:max-content; }
        .community-item { display:flex; flex-direction:column; align-items:center; width:140px; flex:0 0 auto; text-align:center; background:none; border:none; padding:0; font:inherit; color:inherit; cursor:pointer; }
        .community-photo { width:120px; height:120px; border-radius:50%; border:3px solid var(--accent); padding:4px; }
        .community-photo img { width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; }
        .community-name { margin-top:14px; font-size:15px; font-weight:500; letter-spacing:-0.02em; }
        .community-country { font-size:11px; color:var(--ink-soft); letter-spacing:0.08em; text-transform:uppercase; margin-top:2px; }
        @media (max-width:720px){ .community-item { width:110px; } .community-photo { width:92px; height:92px; } .community-track { gap:36px; } }

        /* Artists directory + inline profile panel --------------------------- */
        .artist-directory-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px,1fr)); gap:32px; }
        .artist-directory-card { display:flex; flex-direction:column; align-items:center; text-align:center; background:none; border:none; padding:12px; font:inherit; color:inherit; cursor:pointer; border-radius:0; }
        .artist-directory-photo { width:110px; height:110px; border-radius:50%; border:3px solid var(--accent); padding:4px; margin-bottom:12px; transition:transform 160ms ease, border-color 160ms ease; }
        .artist-directory-card:hover .artist-directory-photo { transform:translateY(-3px); }
        .artist-directory-photo img { width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; }
        .artist-directory-name { font-size:16px; font-weight:500; letter-spacing:-0.02em; }
        .artist-directory-country { font-size:11px; color:var(--ink-soft); letter-spacing:0.1em; text-transform:uppercase; margin-top:3px; }
        .artist-directory-card.active .artist-directory-photo { border-color:var(--accent-deep); }
        .artist-directory-card.active .artist-directory-name { color:var(--accent); }

        .artist-panel { border-top:2px solid var(--ink); margin-top:44px; }
        .artist-profile-head { display:grid; grid-template-columns:260px 1fr; border:2px solid var(--ink); border-top:none; }
        .artist-profile-portrait { border-right:2px solid var(--ink); padding:40px 32px; display:flex; flex-direction:column; align-items:center; text-align:center; justify-content:center; background:var(--accent-tint); }
        .artist-profile-ring { width:150px; height:150px; border-radius:50%; border:3px solid var(--accent); padding:5px; margin-bottom:18px; background:var(--surface); }
        .artist-profile-ring img { width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; }
        .artist-profile-name { font-family:inherit; font-weight:500; font-size:22px; letter-spacing:-0.02em; margin-bottom:3px; }
        .artist-profile-country { font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--accent); font-weight:500; }
        .artist-profile-note { padding:40px 44px; display:flex; flex-direction:column; justify-content:center; }
        .artist-profile-note blockquote { margin:0; font-size:18px; line-height:1.55; letter-spacing:-0.005em; }
        .artist-empty-state { border:2px dashed var(--rule); padding:44px 32px; text-align:center; }
        .artist-empty-state p { font-size:14px; color:var(--ink-soft); line-height:1.65; max-width:460px; margin:0 auto 20px; }
        @media (max-width:720px){ .artist-profile-head { grid-template-columns:1fr; } .artist-profile-portrait { border-right:none; border-bottom:2px solid var(--ink); } }

        /* Art catalog filters ------------------------------------------ */
        .art-header { display:flex; align-items:baseline; justify-content:space-between; gap:12px; flex-wrap:wrap; }
        .filter-groups { display:flex; flex-wrap:wrap; gap:20px 32px; margin:24px 0 32px; }
        .filter-group { display:flex; flex-direction:column; gap:9px; min-width:0; }
        .filter-group-label { font-size:10.5px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:var(--ink-soft); }
        .filter-chips { display:flex; flex-wrap:wrap; gap:8px; max-width:100%; }
        .filter-chip { font-family:inherit; font-size:12px; font-weight:500; letter-spacing:0.02em; padding:7px 13px; border:2px solid var(--rule); border-radius:0; background:transparent; color:var(--ink-soft); cursor:pointer; white-space:nowrap; }
        .filter-chip:hover { border-color:var(--accent); color:var(--accent); }
        .filter-chip.active { border-color:var(--accent); background:var(--accent-tint); color:var(--accent); }
        @media (max-width:520px){ .filter-groups{ gap:18px 24px; } .filter-chip{ padding:6px 11px; font-size:11.5px; } }
        .sold-badge { position:absolute; top:10px; left:10px; z-index:1; background:var(--ink); color:#fff; font-size:10px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; padding:5px 9px; }
        .btn-outline:disabled, .btn-solid:disabled { opacity:0.4; cursor:not-allowed; }
        .btn-outline:disabled:hover { background:transparent; }
      `}</style>

      <Nav tabKey={tab} setTab={setTab} />
      {gallery.status === 'loading' && (
        <div style={{ padding: '96px 24px', textAlign: 'center', color: 'var(--ink-soft)' }}>Loading the collection…</div>
      )}
      {gallery.status === 'error' && (
        <div style={{ padding: '96px 24px', textAlign: 'center', color: 'var(--ink-soft)' }}>
          Couldn't load the collection right now — check back shortly, or if you're the site owner, check
          the Supabase connection (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
        </div>
      )}
      {gallery.status === 'ready' && (
        <>
          {tab === 'studio' && <StudioTab onEnquire={handleEnquire} goMargarita={() => { setTab('margarita'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onSelectArtist={goToArtist} onSeeAllArtists={goToArtistsDirectory} onJoinTeam={goToJoinTeam} artists={gallery.artists} tourArtworks={gallery.tourArtworks} worksByArtist={gallery.worksByArtist} />}
          {tab === 'artists' && <ArtistsDirectory onEnquire={handleEnquire} initialSelected={pendingArtist} artists={gallery.artists} worksByArtist={gallery.worksByArtist} />}
          {tab === 'art' && <ArtTab onEnquire={handleEnquire} artists={gallery.artists} artworks={gallery.artworks} />}
          {tab === 'margarita' && <MargaritaTab prefill={enquiry} />}
        </>
      )}

      <footer className="site-footer">
        <div className="site-footer-inner">
          <a className="sm-logo sm-logo--reverse footer-logo" href="#" aria-label={BRAND} onClick={(e) => { e.preventDefault(); setTab('studio'); }}>
            <span className="sm-logo-studio">Studio</span>
            <span className="sm-logo-name">Margarita</span>
          </a>
          <nav className="site-footer-links">
            <button onClick={() => setTab('studio')}>Studio</button>
            <button onClick={() => setTab('art')}>Art</button>
            <button onClick={() => setTab('artists')}>Artists</button>
            <button onClick={() => setTab('margarita')}>Margarita</button>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </nav>
          <div className="site-footer-bottom">
            {BRAND} — curated paintings, advisory &amp; sale.
            <br />
            © 2026 Studio Margarita™. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
