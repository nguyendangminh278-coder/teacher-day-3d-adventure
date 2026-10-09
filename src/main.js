import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  CLASS_WISHES,
  TREE_WISHES,
  STAGES,
  DIALOGUES,
  TEACHER_MOM_CHARACTER,
} from "./config.js";
import { ROUTES, DESKS, FLOOR_SLABS } from "./world-spec.mjs";
import {
  RouteMotion,
  Timeline,
  readCheckpoint,
  saveCheckpoint,
  CHECKPOINT_KEY,
} from "./journey.mjs";
import {
  createPresentation,
  decorateWorld,
  loadSurfaces,
  createAtmosphere,
} from "./visuals.js";
import { Soundscape } from "./audio.js";

const canvas = document.getElementById("game");
const ui = {
  action: document.getElementById("actionBtn"),
  actionLabel: document.getElementById("actionLabel"),
  stageNumber: document.getElementById("stageNumber"),
  objectiveTitle: document.getElementById("objectiveTitle"),
  objectiveText: document.getElementById("objectiveText"),
  dialogue: document.getElementById("dialogue"),
  dialogueName: document.getElementById("dialogueName"),
  dialogueText: document.getElementById("dialogueText"),
  classPanel: document.getElementById("classroomPanel"),
  classWishes: document.getElementById("classWishes"),
  dismissClass: document.getElementById("dismissClass"),
  finalPanel: document.getElementById("finalPanel"),
  replay: document.getElementById("replayBtn"),
  loading: document.getElementById("loading"),
  assetStatus: document.getElementById("assetStatus"),
};
CLASS_WISHES.forEach((w) => {
  const e = document.createElement("div");
  e.className = "wish-card";
  e.textContent = w;
  ui.classWishes.appendChild(e);
});

const fade = document.getElementById("fade");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
} catch (err) {
  window.showBootError(
    "Không khởi tạo được WebGL 2. Bật tăng tốc phần cứng trong trình duyệt rồi thử lại.",
  );
  throw err;
}
renderer.setPixelRatio(
  Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1 : 1.35),
);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = innerWidth >= 760;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  50,
  innerWidth / innerHeight,
  0.1,
  700,
);
const clock = new THREE.Clock();
const loader = new GLTFLoader();
const UP = new THREE.Vector3(0, 1, 0);
const outdoorWorld = new THREE.Group(),
  houseWorld = new THREE.Group(),
  finaleWorld = new THREE.Group(),
  actorLayer = new THREE.Group();
scene.add(outdoorWorld, houseWorld, finaleWorld, actorLayer);
houseWorld.visible = false;
finaleWorld.visible = false;
scene.add(new THREE.HemisphereLight(0xd9edf0, 0x786c58, 1.1));
const sun = new THREE.DirectionalLight(0xffdfac, 3.1);
sun.position.set(-35, 65, 28);
sun.castShadow = renderer.shadowMap.enabled;
if (sun.castShadow) {
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 90;
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.0002;
}
scene.add(sun, sun.target);

const mats = {};
const blockers = { outdoor: [], house: [], finale: [] };
const cameraRay = new THREE.Raycaster();
let currentSpace = "outdoor";
const M = (c, r = 0.72, m = 0) =>
  mats[`${c}_${r}_${m}`] ||
  (mats[`${c}_${r}_${m}`] = new THREE.MeshStandardMaterial({
    color: c,
    roughness: r,
    metalness: m,
  }));
const mesh = (g, mat, cast = true, receive = true) => {
  const o = new THREE.Mesh(g, mat);
  o.castShadow = cast;
  o.receiveShadow = receive;
  return o;
};
const box = (p, s, pos, c, space = null) => {
  const o = mesh(new THREE.BoxGeometry(...s), M(c));
  o.position.set(...pos);
  p.add(o);
  if (space) blockers[space].push(o);
  return o;
};
const sphere = (p, r, pos, c, sc = [1, 1, 1]) => {
  const o = mesh(new THREE.SphereGeometry(r, 18, 12), M(c));
  o.position.set(...pos);
  o.scale.set(...sc);
  p.add(o);
  return o;
};
const cyl = (p, rt, rb, h, pos, c, seg = 16) => {
  const o = mesh(new THREE.CylinderGeometry(rt, rb, h, seg), M(c));
  o.position.set(...pos);
  p.add(o);
  return o;
};
const vec = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const route = (n) => ROUTES[n].map(vec);

function label(
  text,
  w = 900,
  h = 150,
  fg = "#875064",
  bg = "rgba(255,250,248,.94)",
  font = 46,
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  x.fillStyle = bg;
  x.beginPath();
  if (x.roundRect) x.roundRect(8, 8, w - 16, h - 16, 28);
  else x.rect(8, 8, w - 16, h - 16);
  x.fill();
  x.fillStyle = fg;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = `800 ${font}px system-ui`;
  x.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }),
  );
  s.scale.set(w / 115, h / 115, 1);
  return s;
}
function cloud(parent, x, y, z, s = 1) {
  const g = new THREE.Group(),
    geom = new THREE.SphereGeometry(1, 12, 8),
    material = M(0xf5f0df, 0.96);
  const parts = [
    [0, 0, 0, 1.2],
    [1, 0.1, 0.1, 0.85],
    [-1, 0.1, 0.15, 0.82],
    [0.25, 0.5, 0, 0.75],
    [-0.35, 0.42, 0.1, 0.65],
  ];
  const inst = new THREE.InstancedMesh(geom, material, parts.length),
    d = new THREE.Object3D();
  parts.forEach((v, i) => {
    d.position.set(v[0], v[1], v[2]);
    d.scale.set(1.22 * v[3], 0.5 * v[3], 0.9 * v[3]);
    d.updateMatrix();
    inst.setMatrixAt(i, d.matrix);
  });
  inst.receiveShadow = true;
  g.add(inst);
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  parent.add(g);
  return g;
}
function flower(parent, x, z, s = 1, c = 0xff8daf, y = 0) {
  const g = new THREE.Group();
  cyl(g, 0.035, 0.045, 0.55, [0, 0.28, 0], 0x5f9b56, 7);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    sphere(
      g,
      0.13,
      [Math.cos(a) * 0.15, 0.64, Math.sin(a) * 0.15],
      c,
      [1.1, 0.65, 0.75],
    );
  }
  sphere(g, 0.08, [0, 0.64, 0], 0xffd56a);
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  parent.add(g);
  return g;
}
function person(parent, x, y, z, shirt = 0xf3a1ba, hair = 0x352824, s = 1) {
  const g = new THREE.Group();
  cyl(g, 0.32, 0.42, 1.05, [0, 0.72, 0], shirt, 12);
  sphere(g, 0.36, [0, 1.54, 0], 0xf0c2a4);
  sphere(g, 0.39, [0, 1.68, 0.03], hair, [1, 0.52, 1]);
  cyl(g, 0.09, 0.1, 0.55, [-0.18, 0.13, 0], 0xd7aa8c, 8);
  cyl(g, 0.09, 0.1, 0.55, [0.18, 0.13, 0], 0xd7aa8c, 8);
  for (const side of [-1, 1]) {
    sphere(g, 0.027, [side * 0.115, 1.56, 0.325], 0x241d1a, [1, 1.1, 0.65]);
    sphere(g, 0.009, [side * 0.115 - 0.005, 1.569, 0.343], 0xfff7ea);
    const arm = cyl(g, 0.07, 0.08, 0.68, [side * 0.36, 0.76, 0], shirt, 8);
    arm.rotation.z = side * 0.1;
    sphere(g, 0.085, [side * 0.39, 0.39, 0], 0xf0c2a4);
  }
  sphere(g, 0.04, [0, 1.49, 0.35], 0xe5b197, [0.7, 1, 0.7]);
  const smile = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, 1.43, 0.33),
    new THREE.Vector3(0, 1.405, 0.35),
    new THREE.Vector3(0.08, 1.43, 0.33),
  ]);
  g.add(mesh(new THREE.TubeGeometry(smile, 8, 0.014, 5, false), M(0x9d5861)));
  const parts = g.children.filter((o) => o.isMesh),
    geometries = parts.map((o) => {
      o.updateMatrix();
      const geometry = o.geometry.clone().applyMatrix4(o.matrix).toNonIndexed();
      const color = new Float32Array(geometry.attributes.position.count * 3),
        c = o.material.color;
      for (let i = 0; i < color.length; i += 3) {
        color[i] = c.r;
        color[i + 1] = c.g;
        color[i + 2] = c.b;
      }
      geometry.setAttribute("color", new THREE.BufferAttribute(color, 3));
      return geometry;
    });
  const combined = mergeGeometries(geometries);
  g.clear();
  g.add(
    mesh(
      combined,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72 }),
    ),
  );
  parts.forEach((o) => o.geometry.dispose());
  geometries.forEach((o) => o.dispose());
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  parent.add(g);
  return g;
}

function proceduralTeacher() {
  const r = new THREE.Group();
  r.name = "TeacherMom_Root";
  const body = new THREE.Group();
  body.name = "TeacherMom_Body";
  r.add(body);
  const ao = mesh(
    new THREE.CylinderGeometry(0.44, 0.29, 1.15, 24),
    M(0x83b9dc),
  );
  ao.position.y = 1.25;
  body.add(ao);
  box(body, [0.72, 0.16, 1.15], [0, 0.58, 0.03], 0x9ccbe7);
  const head = new THREE.Group();
  head.name = "Head";
  head.position.y = 2.22;
  r.add(head);
  sphere(head, 0.55, [0, 0, 0], 0xefb99c, [0.92, 0.84, 1.08]);
  sphere(head, 0.57, [0, 0.07, 0.05], 0x1b1312, [1, 0.48, 1.05]);
  sphere(head, 0.052, [-0.17, -0.44, 0.08], 0x241b1b);
  sphere(head, 0.052, [0.17, -0.44, 0.08], 0x241b1b);
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.name = side < 0 ? "Arm_L" : "Arm_R";
    arm.position.set(side * 0.42, 1.55, 0);
    r.add(arm);
    cyl(arm, 0.1, 0.11, 0.72, [0, -0.35, 0], 0x83b9dc);
    sphere(arm, 0.12, [0, -0.76, 0], 0xefb99c);
    const leg = new THREE.Group();
    leg.name = side < 0 ? "Leg_L" : "Leg_R";
    leg.position.set(side * 0.18, 0.68, 0);
    r.add(leg);
    cyl(leg, 0.105, 0.105, 0.7, [0, -0.34, 0], 0xf4f0e9);
    box(leg, [0.26, 0.18, 0.34], [0, -0.73, -0.07], 0x553832);
  }
  return r;
}

let teacherRoot = new THREE.Group(),
  teacherVisual = proceduralTeacher(),
  teacherParts = {},
  teacherVisualBaseY = 0,
  carRoot = new THREE.Group();
let controlled = teacherRoot,
  moveTask = null,
  driveTask = null,
  stage = 0,
  busy = true,
  animMode = "idle",
  gaitPhase = 0,
  lastForward = new THREE.Vector3(0, 0, -1);
let portal,
  schoolGateLeft,
  schoolGateRight,
  houseDoor,
  gateTask = null,
  houseDoorTask = null,
  treeRoot,
  finalOrbit = false;
let cameraMode = "follow",
  cameraUserYaw = 0,
  cameraPitch = 0.16,
  cameraZoom = 8.5,
  userCameraTouched = false,
  classroomOrbit = 0;
const blooms = [],
  hearts = [];
let heartTexture = null,
  heartClock = 0;
teacherRoot.add(teacherVisual);
actorLayer.add(teacherRoot, carRoot);
carRoot.visible = false;

function buildFallbackCar() {
  carRoot.clear();
  box(carRoot, [3.1, 0.75, 4.8], [0, 0.8, 0], 0xe98a97);
  box(carRoot, [2.35, 1.05, 2.25], [0, 1.55, -0.15], 0xf2a5ad);
  for (const x of [-1.25, 1.25])
    for (const z of [-1.55, 1.55]) {
      const w = cyl(carRoot, 0.34, 0.34, 0.24, [x, 0.43, z], 0x302b2b, 14);
      w.rotation.z = Math.PI / 2;
    }
}
buildFallbackCar();
function mapParts() {
  teacherParts = {
    head: teacherVisual.getObjectByName("Head"),
    body: teacherVisual.getObjectByName("TeacherMom_Body"),
    armL: teacherVisual.getObjectByName("Arm_L"),
    armR: teacherVisual.getObjectByName("Arm_R"),
    legL: teacherVisual.getObjectByName("Leg_L"),
    legR: teacherVisual.getObjectByName("Leg_R"),
  };
}
mapParts();
function normalizeModel(m, target = 2.65) {
  const b = new THREE.Box3().setFromObject(m),
    sz = new THREE.Vector3();
  b.getSize(sz);
  m.scale.setScalar(target / Math.max(sz.y, 0.001));
  const b2 = new THREE.Box3().setFromObject(m),
    c = new THREE.Vector3();
  b2.getCenter(c);
  m.position.x -= c.x;
  m.position.z -= c.z;
  m.position.y -= b2.min.y;
}
const assetFailures = [];
async function loadAssets() {
  const loadingProgress = document.getElementById("loadingProgress");
  let complete = 0;
  async function load(path, apply) {
    try {
      const g = await loader.loadAsync(path);
      apply(g.scene);
    } catch {
      assetFailures.push(path);
    } finally {
      complete++;
      loadingProgress.style.width = `${30 + complete * 25}%`;
    }
  }
  await Promise.all([
    load(TEACHER_MOM_CHARACTER.modelPath, (m) => {
      normalizeModel(m, 2.65);
      m.rotation.y = 0;
      m.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      teacherRoot.remove(teacherVisual);
      teacherVisual = m;
      teacherRoot.add(m);
      teacherVisualBaseY = m.position.y;
      mapParts();
    }),
    load("./assets/models/sedan.glb", (m) => {
      normalizeModel(m, 2.1);
      m.rotation.y = Math.PI / 2;
      m.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      carRoot.clear();
      carRoot.add(m);
    }),
  ]);
  ui.assetStatus.textContent = assetFailures.length
    ? "Một số model chưa tải được · Đang dùng hình dự phòng"
    : "Tài nguyên local · Tiến trình tự lưu";
}

function cloudRibbon(parent, names, width = 4.5, step = 2.7, y = -0.24) {
  const pts = names.flatMap((n, i) => ROUTES[n].slice(i ? 1 : 0)).map(vec),
    curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.2),
    len = curve.getLength(),
    count = Math.ceil(len / step),
    geom = new THREE.SphereGeometry(1, 12, 8),
    inst = new THREE.InstancedMesh(geom, M(0xfffdf8, 0.88, 0), (count + 1) * 3),
    d = new THREE.Object3D();
  let k = 0;
  for (let i = 0; i <= count; i++) {
    const t = i / count,
      p = curve.getPoint(t),
      tan = curve.getTangent(Math.min(0.999, t)).normalize(),
      side = new THREE.Vector3(-tan.z, 0, tan.x);
    for (const off of [-width * 0.42, 0, width * 0.42]) {
      const q = p.clone().addScaledVector(side, off);
      d.position.set(q.x, y, q.z);
      d.scale.set(1.75 + (i % 3) * 0.14, 0.24, 0.98 + (i % 2) * 0.16);
      d.rotation.y = Math.atan2(tan.x, tan.z);
      d.updateMatrix();
      inst.setMatrixAt(k++, d.matrix);
    }
  }
  inst.castShadow = false;
  inst.receiveShadow = true;
  parent.add(inst);
}
function buildSchoolGate() {
  box(outdoorWorld, [1.1, 6, 1.1], [-6.5, 3, -79], 0xedd3aa, "outdoor");
  box(outdoorWorld, [1.1, 6, 1.1], [6.5, 3, -79], 0xedd3aa, "outdoor");
  box(outdoorWorld, [14, 1, 1], [0, 6, -79], 0xedd3aa, "outdoor");
  const sign = label(
    "TRƯỜNG TIỂU HỌC HOA MÂY",
    900,
    130,
    "#396d92",
    "rgba(255,252,239,.98)",
    48,
  );
  sign.position.set(0, 6.25, -78.4);
  outdoorWorld.add(sign);
  schoolGateLeft = new THREE.Group();
  schoolGateLeft.position.set(-5.9, 0, -78.65);
  box(schoolGateLeft, [5.7, 3.6, 0.14], [2.85, 1.8, 0], 0xdfeaf0);
  for (let x = 0.5; x < 5.6; x += 0.7)
    cyl(schoolGateLeft, 0.045, 0.045, 3, [x, 1.75, 0.08], 0x6689a0, 8);
  outdoorWorld.add(schoolGateLeft);
  schoolGateRight = new THREE.Group();
  schoolGateRight.position.set(5.9, 0, -78.65);
  box(schoolGateRight, [5.7, 3.6, 0.14], [-2.85, 1.8, 0], 0xdfeaf0);
  for (let x = -0.5; x > -5.6; x -= 0.7)
    cyl(schoolGateRight, 0.045, 0.045, 3, [x, 1.75, 0.08], 0x6689a0, 8);
  outdoorWorld.add(schoolGateRight);
}
function buildClassroom() {
  box(outdoorWorld, [8, 0.16, 29], [0, 0.02, -93], 0xf8f0e6);
  box(outdoorWorld, [10, 7, 19], [-12, 3.5, -92], 0xf2d2a8, "outdoor");
  box(outdoorWorld, [10, 7, 19], [12, 3.5, -92], 0xf2d2a8, "outdoor");
  const cs = label(
    "LỚP HỌC CỦA MẸ",
    560,
    105,
    "#7b5260",
    "rgba(255,248,241,.96)",
    38,
  );
  cs.position.set(0, 4.5, -104.8);
  outdoorWorld.add(cs);
  box(outdoorWorld, [20, 0.18, 20], [0, 0.01, -116.5], 0xd7b98c);
  box(outdoorWorld, [20, 5, 0.4], [0, 2.5, -126.5], 0xe3c19e, "outdoor");
  box(outdoorWorld, [0.4, 5, 20], [-10.25, 2.5, -116.5], 0xf0d7bc, "outdoor");
  box(outdoorWorld, [7.1, 5, 0.4], [-6.75, 2.5, -106.5], 0xf0d7bc, "outdoor");
  box(outdoorWorld, [7.1, 5, 0.4], [6.75, 2.5, -106.5], 0xf0d7bc, "outdoor");
  box(outdoorWorld, [6.2, 0.42, 0.4], [0, 4.8, -106.5], 0xe3c19e, "outdoor");
  box(outdoorWorld, [0.4, 5, 8.7], [10.25, 2.5, -122.45], 0xf0d7bc, "outdoor");
  box(outdoorWorld, [0.4, 5, 5.5], [10.25, 2.5, -109.25], 0xf0d7bc, "outdoor");
  box(outdoorWorld, [0.4, 0.42, 6], [10.25, 4.8, -115], 0xe3c19e, "outdoor");
  const es = label("LỐI RA →", 380, 90, "#44775c", "rgba(250,255,249,.96)", 34);
  es.position.set(10, 3.8, -115);
  outdoorWorld.add(es);
  box(outdoorWorld, [10, 3, 0.15], [0, 3, -126.2], 0x3e6e5a);
  const board = label(
    "20/11 · Cảm ơn cô vì đã luôn ở đây!",
    880,
    125,
    "#fff4df",
    "rgba(0,0,0,0)",
    40,
  );
  board.position.set(0, 3, -126.05);
  outdoorWorld.add(board);
  box(outdoorWorld, [4.5, 0.12, 1.2], [0, 1.05, -124], 0xb9825b);
  for (const x of [-1.8, 1.8])
    box(outdoorWorld, [0.12, 0.92, 0.8], [x, 0.53, -124], 0x796349);
  DESKS.forEach((d, i) => {
    const x = (d.min[0] + d.max[0]) / 2,
      z = (d.min[2] + d.max[2]) / 2;
    box(outdoorWorld, [2.1, 0.16, 1], [x, 0.95, z], 0xb9825b);
    const child = person(
      outdoorWorld,
      x,
      0.55,
      z + 0.8,
      i % 2 ? 0xe8f2ff : 0xfff9ef,
      0x352824,
      0.57,
    );
    child.rotation.y = Math.PI;
    if (i < 9) {
      child.position.x -= 0.48;
      const other = person(
        outdoorWorld,
        x + 0.48,
        0.55,
        z + 0.8,
        i % 2 ? 0xfff9ef : 0xe8f2ff,
        0x352824,
        0.57,
      );
      other.rotation.y = Math.PI;
    }
  });
}
function buildHouseExterior() {
  const c = 0xf2dfcd,
    trim = 0xd4b58f;
  box(outdoorWorld, [6.9, 6.5, 0.6], [95, 3.25, -95.2], c, "outdoor");
  box(outdoorWorld, [6.9, 6.5, 0.6], [105, 3.25, -95.2], c, "outdoor");
  box(outdoorWorld, [16, 1.2, 0.8], [100, 6.25, -95.15], trim);
  box(outdoorWorld, [16.5, 0.7, 10], [100, 7, -90.6], 0x9f705d);
  box(outdoorWorld, [0.5, 6.2, 9], [91.8, 3.1, -90.8], c);
  box(outdoorWorld, [0.5, 6.2, 9], [108.2, 3.1, -90.8], c);
  box(outdoorWorld, [16.5, 6.2, 0.5], [100, 3.1, -86.5], c);
  houseDoor = new THREE.Group();
  houseDoor.position.set(98.55, 0, -95.45);
  box(houseDoor, [2.75, 3.55, 0.18], [1.37, 1.78, 0], 0x9b6d50);
  sphere(houseDoor, 0.07, [2.35, 1.75, -0.16], 0xe8c86e);
  outdoorWorld.add(houseDoor);
  const s = label(
    "NHÀ CỦA MẸ",
    480,
    100,
    "#825a54",
    "rgba(255,250,244,.96)",
    38,
  );
  s.position.set(100, 5.3, -94.75);
  outdoorWorld.add(s);
}
function buildOutdoor() {
  scene.background = new THREE.Color(0xbfe2ff);
  scene.fog = new THREE.Fog(0xd7edff, 105, 330);
  for (let i = 0; i < 34; i++)
    cloud(
      outdoorWorld,
      ((i % 7) - 3) * 18 + (i % 2) * 4,
      7 + (i % 5) * 1.9,
      35 - i * 10,
      0.62 + (i % 3) * 0.24,
    );
  portal = new THREE.Group();
  portal.add(
    mesh(
      new THREE.TorusGeometry(3, 0.25, 14, 54),
      new THREE.MeshStandardMaterial({
        color: 0x9a6fff,
        emissive: 0x7454ff,
        emissiveIntensity: 2.8,
        roughness: 0.3,
      }),
    ),
  );
  const disk = mesh(
    new THREE.CircleGeometry(2.72, 48),
    new THREE.MeshBasicMaterial({ color: 0x120c24 }),
    false,
    false,
  );
  disk.position.z = -0.05;
  portal.add(disk);
  portal.position.set(0, 8.2, 16);
  outdoorWorld.add(portal);
  cloud(outdoorWorld, 0, 4.2, 10, 2.1);
  const hero = label(
    "Chúc mừng Mẹ ngày Nhà giáo Việt Nam 20/11",
    1050,
    150,
    "#cf587f",
    "rgba(255,250,249,.95)",
    42,
  );
  hero.position.set(0, 10.5, 8);
  outdoorWorld.add(hero);
  cloudRibbon(outdoorWorld, ["jump", "garden", "toSchool"], 4.7, 2.35, -0.3);
  cloudRibbon(outdoorWorld, ["exitClass"], 4.4, 2.5, -0.28);
  cloudRibbon(outdoorWorld, ["driveHome", "toDoor"], 7.2, 2.8, -0.38);
  buildSchoolGate();
  buildClassroom();
  buildHouseExterior();
}

function stairSteps(parent, pts, color = 0xd8b88f) {
  for (let i = 1; i < pts.length - 1; i++) {
    const p = vec(pts[i]),
      n = vec(pts[Math.min(i + 1, pts.length - 1)]);
    if (Math.abs(n.y - p.y) < 0.25) continue;
    const st = box(
      parent,
      [1.15, 0.18, 2],
      [p.x, Math.max(0.12, p.y - 0.05), p.z],
      color,
    );
    st.rotation.y = Math.atan2(n.x - p.x, n.z - p.z) + Math.PI / 2;
  }
}
function buildHouse() {
  const floor = 0xd9bb91,
    wall = 0xf2e3d3;
  box(houseWorld, [18, 0.28, 13], [0, 0, 0], floor);
  box(houseWorld, [0.5, 9.2, 13], [-9.15, 4.6, 0], wall, "house");
  box(houseWorld, [0.5, 9.2, 13], [9.15, 4.6, 0], wall, "house");
  box(houseWorld, [18.8, 9.2, 0.5], [0, 4.6, -6.75], wall, "house");
  for (const slab of FLOOR_SLABS)
    box(houseWorld, slab.size, slab.position, floor);
  box(houseWorld, [5.2, 0.02, 3.2], [-3.2, 0.15, 1], 0xd6a9a6);
  box(houseWorld, [3.3, 1, 1.1], [2.6, 0.65, 3.5], 0xb99b86);
  sphere(houseWorld, 0.65, [6.9, 0.7, 3.4], 0x7daa72, [1.1, 1.3, 1]);
  cyl(houseWorld, 0.5, 0.62, 0.55, [6.9, 0.3, 3.4], 0xb57855);
  const father = person(houseWorld, -3, 0.18, 1, 0x8fa6b8, 0x302b29, 0.95);
  father.rotation.y = Math.PI / 2;
  const older = person(houseWorld, -3, 4.58, -1, 0x6fa8d8, 0x352c29, 0.82);
  older.rotation.y = Math.PI / 2;
  const younger = person(houseWorld, 1.2, 4.58, 3, 0x7eb8df, 0x352c29, 0.82);
  younger.rotation.y = -Math.PI / 2;
  stairSteps(houseWorld, ROUTES.stairs1);
  stairSteps(houseWorld, ROUTES.stairs2, 0xcfa77b);
  const l1 = new THREE.PointLight(0xffd8b0, 26, 22, 2);
  l1.position.set(-4, 3.8, 2);
  houseWorld.add(l1);
  const l2 = new THREE.PointLight(0xffe8c9, 24, 22, 2);
  l2.position.set(4, 7.4, -2);
  houseWorld.add(l2);
}
function makeBloom(parent, wish, i) {
  const g = new THREE.Group(),
    colors = [0xff91b4, 0xffc96f, 0xb8a3ff, 0x9fd9c2],
    color = colors[i % colors.length];
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI * 2) / 6;
    sphere(
      g,
      0.18,
      [Math.cos(a) * 0.2, Math.sin(a) * 0.08, Math.sin(a) * 0.2],
      color,
      [1.15, 0.72, 0.9],
    );
  }
  sphere(g, 0.08, [0, 0, 0], 0xffe49a);
  const s = label(wish, 620, 95, "#7b4357", "rgba(255,252,249,.94)", 29);
  s.scale.multiplyScalar(0.62);
  s.position.set(0, 0.65, 0);
  s.visible = false;
  g.add(s);
  g.userData.label = s;
  g.userData.wish = wish;
  g.userData.birth = Infinity;
  g.scale.setScalar(0.001);
  parent.add(g);
  return g;
}
function buildFinale() {
  for (let i = 0; i < 18; i++) {
    const a = (i * Math.PI * 2) / 18;
    cloud(
      finaleWorld,
      Math.cos(a) * 10.5,
      -1 + (i % 3) * 0.12,
      -1 + Math.sin(a) * 8.2,
      1.6 + (i % 2) * 0.3,
    );
  }
  cyl(finaleWorld, 7.8, 6.5, 1.1, [0, -0.55, -1], 0x9fc384, 40);
  for (let i = 0; i < 22; i++) {
    const a = i * 2.399,
      r = 3.8 + (i % 4) * 0.7;
    flower(
      finaleWorld,
      Math.cos(a) * r,
      -1 + Math.sin(a) * r,
      0.72,
      [0xff91b4, 0xffcf73, 0xb7a4ff][i % 3],
      0.02,
    );
  }
  treeRoot = new THREE.Group();
  treeRoot.position.set(0, 0.05, -2.1);
  finaleWorld.add(treeRoot);
  cyl(treeRoot, 0.55, 0.9, 4.6, [0, 2.3, 0], 0x7d5235, 18);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8,
      cx = Math.cos(a) * 2.1,
      cz = Math.sin(a) * 2.1,
      b = cyl(
        treeRoot,
        0.16,
        0.25,
        2.7,
        [cx * 0.42, 4.2, cz * 0.42],
        0x7d5235,
        10,
      );
    b.rotation.z = Math.cos(a) * 0.62;
    b.rotation.x = Math.sin(a) * 0.62;
  }
  TREE_WISHES.forEach((wish, i) => {
    const a = ((i * Math.PI * 2) / TREE_WISHES.length) * 3.1,
      r = 2.1 + (i % 4) * 0.25,
      y = 4 + (i % 5) * 0.52,
      b = makeBloom(treeRoot, wish, i);
    b.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    blooms.push(b);
  });
  const fl = new THREE.PointLight(0xffd2e5, 38, 30, 2);
  fl.position.set(0, 8, -2);
  finaleWorld.add(fl);
}
function buildWorlds() {
  buildOutdoor();
  buildHouse();
  buildFinale();
}
function setSpace(space) {
  currentSpace = space;
  outdoorWorld.visible = space === "outdoor";
  houseWorld.visible = space === "house";
  finaleWorld.visible = space === "finale";
  cameraUserYaw = 0;
  cameraPitch = 0.16;
  userCameraTouched = false;
  if (space === "outdoor") {
    scene.background = new THREE.Color(0xbfe2ff);
    scene.fog = new THREE.Fog(0xd7edff, 105, 330);
  } else if (space === "house") {
    scene.background = new THREE.Color(0xead8c5);
    scene.fog = new THREE.Fog(0xead8c5, 26, 75);
  } else {
    scene.background = new THREE.Color(0xcceaff);
    scene.fog = new THREE.Fog(0xeaf7ff, 32, 105);
  }
}

function heartTextureFn() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  x.translate(64, 68);
  x.scale(1.35, 1.35);
  x.beginPath();
  x.moveTo(0, 24);
  x.bezierCurveTo(-34, 2, -34, -24, -14, -28);
  x.bezierCurveTo(-3, -30, 0, -19, 0, -13);
  x.bezierCurveTo(0, -19, 3, -30, 14, -28);
  x.bezierCurveTo(34, -24, 34, 2, 0, 24);
  x.closePath();
  x.fillStyle = "#ff7fa5";
  x.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function spawnHeart() {
  if (!heartTexture) heartTexture = heartTextureFn();
  const m = new THREE.SpriteMaterial({
      map: heartTexture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
    s = new THREE.Sprite(m);
  s.scale.set(0.32, 0.32, 0.32);
  s.position
    .copy(teacherRoot.position)
    .add(
      new THREE.Vector3(
        (Math.random() - 0.5) * 0.7,
        0.35,
        (Math.random() - 0.5) * 0.5,
      ),
    );
  s.userData.life = 0;
  s.userData.vx = (Math.random() - 0.5) * 0.22;
  s.userData.vz = (Math.random() - 0.5) * 0.18;
  scene.add(s);
  hearts.push(s);
}
function clearHearts() {
  while (hearts.length) {
    const h = hearts.pop();
    scene.remove(h);
    h.material.dispose();
  }
}
function updateHearts(dt) {
  if (moveTask && teacherRoot.visible) {
    heartClock += dt;
    if (heartClock > 0.18) {
      heartClock = 0;
      spawnHeart();
    }
  }
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    h.userData.life += dt;
    h.position.y += dt * 0.8;
    h.position.x += h.userData.vx * dt;
    h.position.z += h.userData.vz * dt;
    h.material.opacity = Math.max(0, 0.9 - h.userData.life * 0.62);
    if (h.userData.life > 1.5) {
      scene.remove(h);
      h.material.dispose();
      hearts.splice(i, 1);
    }
  }
}

const timeline = new Timeline(),
  sound = new Soundscape();
let started = false,
  paused = false,
  elapsed = 0,
  dialogueGeneration = 0,
  reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let storage;
try {
  storage = localStorage;
} catch {
  storage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
}
const params = new URLSearchParams(location.search),
  qa = params.get("qa") === "1";
const qaSpeed = qa
  ? THREE.MathUtils.clamp(Number(params.get("qaSpeed")) || 1, 1, 30)
  : 1;
const checkpoint = readCheckpoint(storage);
const el = (id) => document.getElementById(id);
const trace = [];
function visible(element, value) {
  element.classList.toggle("hidden", !value);
  element.inert = !value;
}
function focus(element) {
  element?.focus({ preventScroll: true });
}
function hideDialogue() {
  dialogueGeneration++;
  visible(ui.dialogue, false);
}
function showDialogue(d, ms = 8500) {
  const generation = ++dialogueGeneration;
  ui.dialogueName.textContent = d.name;
  ui.dialogueText.textContent = d.text;
  visible(ui.dialogue, true);
  timeline.after(ms / 1000, () => {
    if (generation === dialogueGeneration) visible(ui.dialogue, false);
  });
}
function setStage(n) {
  stage = n;
  const s = STAGES[n];
  ui.stageNumber.textContent = String(n + 1);
  ui.objectiveTitle.textContent = s.title;
  ui.objectiveText.textContent = s.text;
  ui.actionLabel.textContent = s.action;
  el("chapterProgress").style.width = `${(n + 1) * 10}%`;
  visible(ui.action, n !== 5 && n !== 9);
  ui.action.disabled = busy;
  if (started) saveCheckpoint(storage, n);
  trace.push({
    stage: n,
    space: currentSpace,
    position: teacherRoot.position.toArray(),
  });
}
function setBusy(v) {
  busy = v;
  ui.action.disabled = v;
  ui.dismissClass.disabled = v;
}
function holdForWish(next, d, ms = 3400) {
  setStage(next);
  cameraMode = "family";
  const npc =
    next === 6 ? [-3, 0.18, 1] : next === 7 ? [-3, 4.58, -1] : [1.2, 4.58, 3];
  faceDirection(vec(npc).sub(teacherRoot.position));
  animMode = "receive";
  showDialogue(d, Math.max(8500, ms + 800));
  setBusy(true);
  timeline.after(ms / 1000, () => {
    animMode = "idle";
    setBusy(false);
  });
}
function faceDirection(dir, dt = 1) {
  const horizontal = new THREE.Vector3(dir.x, 0, dir.z);
  if (horizontal.lengthSq() < 0.001) return;
  horizontal.normalize();
  lastForward.lerp(horizontal, 1 - Math.exp(-dt * 12)).normalize();
  teacherRoot.rotation.y = Math.atan2(lastForward.x, lastForward.z);
}
function startMove(
  points,
  speed = 8,
  onDone,
  mode = null,
  cam = null,
  keepDialogue = false,
) {
  if (!keepDialogue) hideDialogue();
  const path = new RouteMotion(points.map((p) => p.toArray()));
  teacherRoot.position.copy(points[0]);
  moveTask = {
    path,
    t: 0,
    last: points[0].clone(),
    duration: Math.max(0.8, path.length / speed),
    done: onDone,
  };
  animMode = mode || (speed > 7 ? "run" : "walk");
  setBusy(true);
  controlled = teacherRoot;
  if (cam) cameraMode = cam;
}
function startDrive(points, speed = 20, onDone) {
  hideDialogue();
  const path = new RouteMotion(points.map((p) => p.toArray()));
  carRoot.position.copy(points[0]);
  driveTask = {
    path,
    t: 0,
    duration: Math.max(1.8, path.length / speed),
    done: onDone,
  };
  setBusy(true);
  controlled = carRoot;
  cameraMode = "follow";
}
function openSchoolGate(done) {
  gateTask = { t: 0, duration: 1.15, done };
  setBusy(true);
}
function openHouseDoor(done) {
  houseDoorTask = { t: 0, duration: 0.9, done };
  setBusy(true);
}
function updateDoors(dt) {
  if (gateTask) {
    gateTask.t = Math.min(1, gateTask.t + dt / gateTask.duration);
    const e = 1 - Math.pow(1 - gateTask.t, 3);
    schoolGateLeft.rotation.y = -e * Math.PI * 0.52;
    schoolGateRight.rotation.y = e * Math.PI * 0.52;
    if (gateTask.t >= 1) {
      const done = gateTask.done;
      gateTask = null;
      setBusy(false);
      done?.();
    }
  }
  if (houseDoorTask) {
    houseDoorTask.t = Math.min(
      1,
      houseDoorTask.t + dt / houseDoorTask.duration,
    );
    const e = 1 - Math.pow(1 - houseDoorTask.t, 3);
    houseDoor.rotation.y = -e * Math.PI * 0.52;
    if (houseDoorTask.t >= 1) {
      const done = houseDoorTask.done;
      houseDoorTask = null;
      setBusy(false);
      done?.();
    }
  }
}
function updateMovement(dt) {
  if (moveTask) {
    moveTask.t = Math.min(1, moveTask.t + dt / moveTask.duration);
    const sample = moveTask.path.sample(moveTask.t),
      p = vec(sample.position),
      direction = vec(sample.direction),
      dist = p.distanceTo(moveTask.last);
    gaitPhase += dist * (animMode === "run" ? 5.4 : 4.6);
    moveTask.last.copy(p);
    teacherRoot.position.copy(p);
    faceDirection(direction, dt);
    if (moveTask.t >= 1) {
      const done = moveTask.done;
      moveTask = null;
      animMode = "idle";
      setBusy(false);
      done?.();
    }
  } else if (driveTask) {
    driveTask.t = Math.min(1, driveTask.t + dt / driveTask.duration);
    const sample = driveTask.path.sample(driveTask.t);
    carRoot.position.copy(vec(sample.position));
    faceDirection(vec(sample.direction), dt);
    carRoot.rotation.y = Math.atan2(lastForward.x, lastForward.z);
    if (driveTask.t >= 1) {
      const done = driveTask.done;
      driveTask = null;
      setBusy(false);
      done?.();
    }
  }
}
function animateTeacher(t) {
  const p = teacherParts;
  if (!p.armL || !p.armR || !p.legL || !p.legR) return;
  const moving = ["walk", "run", "stairs", "jump"].includes(animMode),
    amp = animMode === "run" ? 0.65 : animMode === "stairs" ? 0.28 : 0.4,
    s = moving ? Math.sin(gaitPhase) * amp : 0;
  p.legL.rotation.x = s;
  p.legR.rotation.x = -s;
  p.armL.rotation.x = -s * 0.85;
  p.armR.rotation.x = s * 0.85;
  p.armL.rotation.z = 0;
  p.armR.rotation.z = 0;
  if (animMode === "wave") {
    p.armR.rotation.z = -1.35;
    p.armR.rotation.x = -0.35 + Math.sin(t * 5) * 0.18;
  } else if (animMode === "teach") {
    p.armR.rotation.z = -0.55;
    p.armR.rotation.x = -0.25 + Math.sin(t * 2.6) * 0.18;
    p.armL.rotation.z = 0.18;
  } else if (animMode === "receive") {
    p.armL.rotation.z = 0.5;
    p.armR.rotation.z = -0.5;
    p.armL.rotation.x = p.armR.rotation.x = -0.25;
  }
  if (p.body)
    p.body.rotation.z = moving ? Math.sin(gaitPhase * 0.5) * 0.012 : 0;
  if (p.head) p.head.rotation.z = Math.sin(t * 1.5) * 0.012;
  teacherVisual.position.y =
    teacherVisualBaseY +
    (moving ? Math.abs(Math.sin(gaitPhase)) * 0.035 : Math.sin(t * 2) * 0.015);
}
function resolveCamera(look, desired) {
  const dir = desired.clone().sub(look),
    dist = dir.length();
  if (dist < 0.1) return desired;
  cameraRay.set(look, dir.normalize());
  cameraRay.far = dist;
  scene.updateMatrixWorld();
  const hits = cameraRay.intersectObjects(blockers[currentSpace] || [], false);
  if (hits.length && hits[0].distance < dist)
    return look
      .clone()
      .addScaledVector(dir, Math.max(0.5, hits[0].distance - 0.35));
  return desired;
}
function resetCamera() {
  cameraUserYaw = 0;
  cameraPitch = 0.16;
  cameraZoom = 8.5;
  userCameraTouched = false;
  classroomOrbit = 0;
}
function updateCamera(dt, t) {
  if (!started) {
    const center = new THREE.Vector3(0, 5.8, 10);
    camera.position.set(8 + Math.sin(t * 0.06), 8, 22);
    camera.lookAt(center);
    return;
  }
  const mobile = innerWidth < 760;
  if (cameraMode === "family") {
    const npc = vec(
      stage === 6
        ? [-3, 0.18, 1]
        : stage === 7
          ? [-3, 4.58, -1]
          : [1.2, 4.58, 3],
    );
    const center = teacherRoot.position
      .clone()
      .lerp(npc, 0.5)
      .add(new THREE.Vector3(0, 1.35, 0));
    const f = npc.clone().sub(teacherRoot.position).normalize(),
      side = new THREE.Vector3(-f.z, 0, f.x),
      distance = Math.min(cameraZoom, 6);
    const offset = side
      .multiplyScalar(distance)
      .addScaledVector(f, -distance * 0.35)
      .applyAxisAngle(UP, cameraUserYaw);
    const desired = center
      .clone()
      .add(offset)
      .add(new THREE.Vector3(0, 1.1 + cameraPitch * 2, 0));
    camera.position.lerp(resolveCamera(center, desired), 1 - Math.exp(-dt * 3));
    camera.lookAt(center);
    return;
  }
  if (finalOrbit || cameraMode === "finale") {
    const center = new THREE.Vector3(0, mobile ? 2.2 : 4, -2),
      r = cameraZoom + 5,
      a = (reducedMotion ? 0 : t * 0.07) + cameraUserYaw;
    const desired = new THREE.Vector3(
      Math.sin(a) * r,
      7.8 + cameraPitch * 3,
      -2 + Math.cos(a) * r,
    );
    camera.position.lerp(desired, 1 - Math.exp(-dt * 2.5));
    const forward = center.clone().sub(camera.position).normalize(),
      right = new THREE.Vector3().crossVectors(forward, UP).normalize();
    camera.lookAt(center.addScaledVector(right, mobile ? 0 : -3.2));
    return;
  }
  if (cameraMode === "classroom") {
    if (!userCameraTouched && !reducedMotion) classroomOrbit += dt * 0.022;
    const center = new THREE.Vector3(0, 1.45, -116.3),
      r = THREE.MathUtils.clamp(cameraZoom - 2, 4, 9),
      a = classroomOrbit + cameraUserYaw;
    const desired = new THREE.Vector3(
      Math.sin(a) * r,
      5.3 + cameraPitch * 1.8,
      center.z + Math.cos(a) * r,
    );
    camera.position.lerp(
      resolveCamera(center, desired),
      1 - Math.exp(-dt * 4.6),
    );
    camera.lookAt(center);
    return;
  }
  const target = controlled === carRoot ? carRoot : teacherRoot,
    f = lastForward.clone().normalize();
  let dist = controlled === carRoot ? Math.max(10, cameraZoom + 2) : cameraZoom,
    height = (controlled === carRoot ? 5.2 : 4.1) + cameraPitch * 3;
  if (cameraMode === "houseFollow" || cameraMode === "stairs") {
    dist = Math.min(cameraZoom, 5.3);
    height = 2.8 + cameraPitch * 2;
  }
  const yaw = cameraMode === "stairs" ? cameraUserYaw + 0.9 : cameraUserYaw;
  const back = f.clone().multiplyScalar(-dist).applyAxisAngle(UP, yaw);
  const look = target.position
    .clone()
    .addScaledVector(f, controlled === carRoot ? 2.7 : 1)
    .add(new THREE.Vector3(0, 1.55, 0));
  const desired = target.position
    .clone()
    .add(back)
    .add(new THREE.Vector3(0, height, 0));
  camera.position.lerp(resolveCamera(look, desired), 1 - Math.exp(-dt * 4.8));
  camera.lookAt(look);
}
function transitionSpace(space, start, onReady) {
  setBusy(true);
  hideDialogue();
  clearHearts();
  fade.classList.add("on");
  timeline.after(0.43, () => {
    setSpace(space);
    teacherRoot.position.copy(start);
    teacherRoot.visible = true;
    carRoot.visible = false;
    controlled = teacherRoot;
    camera.position.copy(start).add(new THREE.Vector3(0, 3.2, 5));
    timeline.after(0.15, () => {
      fade.classList.remove("on");
      setBusy(false);
      onReady?.();
    });
  });
}
function enterHouse() {
  teacherRoot.visible = true;
  carRoot.visible = false;
  controlled = teacherRoot;
  teacherRoot.position.copy(vec(ROUTES.driveHome.at(-1)));
  cameraMode = "follow";
  showDialogue(DIALOGUES.home, 6000);
  setBusy(true);
  timeline.after(0.5, () =>
    openHouseDoor(() =>
      startMove(
        route("toDoor"),
        4.6,
        () =>
          transitionSpace("house", vec(ROUTES.houseEntry[0]), () =>
            startMove(
              route("houseEntry"),
              4,
              () => holdForWish(6, DIALOGUES.father),
              "walk",
              "houseFollow",
            ),
          ),
        "walk",
        "follow",
      ),
    ),
  );
}
function revealBlooms() {
  blooms.forEach((b) => {
    b.scale.setScalar(1);
    b.userData.growing = false;
    b.userData.label.visible = false;
  });
}
function beginFinale() {
  setBusy(false);
  setStage(9);
  hideDialogue();
  document.body.classList.add("finale-ui");
  cameraMode = "finale";
  finalOrbit = true;
  animMode = "receive";
  blooms.forEach((b, i) =>
    timeline.after(i * 0.115, () => {
      b.userData.birth = timeline.time;
      b.userData.growing = true;
    }),
  );
  timeline.after(TREE_WISHES.length * 0.115 + 1.3, () => {
    visible(ui.finalPanel, true);
    focus(el("wishesBtn"));
  });
}
function updateBlooms() {
  for (const b of blooms)
    if (b.userData.growing) {
      const k = Math.min(1, (timeline.time - b.userData.birth) / 0.62);
      b.scale.setScalar(1 - Math.pow(1 - k, 3));
      if (k >= 1) b.userData.growing = false;
    }
}
function action() {
  if (!started || busy || paused || !ui.classPanel.inert) return;
  if (stage === 0)
    startMove(
      route("jump"),
      6,
      () => {
        setStage(1);
        showDialogue(DIALOGUES.garden);
      },
      "jump",
      "follow",
    );
  else if (stage === 1)
    startMove(route("garden"), 5.8, () => setStage(2), "walk", "follow");
  else if (stage === 2)
    startMove(
      route("toSchool"),
      7,
      () => {
        setStage(3);
        showDialogue(DIALOGUES.school);
      },
      "run",
      "follow",
    );
  else if (stage === 3)
    openSchoolGate(() =>
      startMove(
        route("enterClass"),
        5.8,
        () => {
          faceDirection(new THREE.Vector3(0, 0, 1));
          setStage(4);
          animMode = "teach";
          cameraMode = "classroom";
          resetCamera();
          showDialogue(DIALOGUES.classroom);
        },
        "walk",
        "follow",
      ),
    );
  else if (stage === 4) {
    hideDialogue();
    visible(ui.classPanel, true);
    visible(ui.action, false);
    focus(ui.dismissClass);
  } else if (stage === 6)
    startMove(
      route("stairs1"),
      3.4,
      () => {
        cameraMode = "houseFollow";
        holdForWish(7, DIALOGUES.olderBrother);
      },
      "stairs",
      "stairs",
    );
  else if (stage === 7)
    startMove(
      route("toYounger"),
      3.5,
      () => {
        cameraMode = "houseFollow";
        holdForWish(8, DIALOGUES.youngerBrother);
      },
      "walk",
      "houseFollow",
    );
  else if (stage === 8) {
    startMove(
      route("stairs2"),
      3.4,
      () =>
        transitionSpace("finale", vec(ROUTES.finaleEntry[0]), () =>
          startMove(route("finaleEntry"), 3.2, beginFinale, "walk", "finale"),
        ),
      "stairs",
      "stairs",
    );
    showDialogue(DIALOGUES.upstairs, 5000);
  }
}
function dismissClass() {
  if (busy || paused || ui.classPanel.inert || stage !== 4) return;
  hideDialogue();
  visible(ui.classPanel, false);
  setStage(5);
  cameraMode = "follow";
  resetCamera();
  focus(canvas);
  startMove(
    route("exitClass"),
    5.4,
    () => {
      teacherRoot.visible = false;
      carRoot.visible = true;
      controlled = carRoot;
      startDrive(route("driveHome"), 14, enterHouse);
    },
    "walk",
    "follow",
  );
}
function restore(n) {
  timeline.clear();
  moveTask = driveTask = gateTask = houseDoorTask = null;
  clearHearts();
  setBusy(false);
  resetCamera();
  finalOrbit = false;
  teacherRoot.visible = true;
  carRoot.visible = false;
  controlled = teacherRoot;
  animMode = "idle";
  visible(ui.finalPanel, false);
  visible(ui.classPanel, false);
  visible(el("wishPanel"), false);
  document.body.classList.remove("finale-ui");
  const positions = {
    0: ROUTES.intro.at(-1),
    1: ROUTES.jump.at(-1),
    2: ROUTES.garden.at(-1),
    3: ROUTES.toSchool.at(-1),
    4: ROUTES.enterClass.at(-1),
    6: ROUTES.houseEntry.at(-1),
    7: ROUTES.stairs1.at(-1),
    8: ROUTES.toYounger.at(-1),
    9: ROUTES.finaleEntry.at(-1),
  };
  setSpace(n >= 6 && n < 9 ? "house" : n === 9 ? "finale" : "outdoor");
  teacherRoot.position.copy(vec(positions[n]));
  cameraMode = currentSpace === "house" ? "houseFollow" : "follow";
  portal.visible = false;
  schoolGateLeft.rotation.y = n >= 4 ? -Math.PI * 0.52 : 0;
  schoolGateRight.rotation.y = n >= 4 ? Math.PI * 0.52 : 0;
  houseDoor.rotation.y = 0;
  faceDirection(new THREE.Vector3(0, 0, n === 4 ? 1 : -1));
  camera.position.copy(teacherRoot.position).add(new THREE.Vector3(0, 4, 8));
  setStage(n);
  hideDialogue();
  if (n === 4) {
    cameraMode = "classroom";
    animMode = "teach";
  }
  if (n >= 6 && n <= 8)
    showDialogue(
      [DIALOGUES.father, DIALOGUES.olderBrother, DIALOGUES.youngerBrother][
        n - 6
      ],
    );
  if (n >= 6 && n <= 8) cameraMode = "family";
  if (n === 9) {
    cameraMode = "finale";
    finalOrbit = true;
    revealBlooms();
    document.body.classList.add("finale-ui");
    visible(ui.finalPanel, true);
  }
}
function start(resume = false) {
  started = true;
  paused = false;
  document.body.classList.remove("welcome-ui", "paused-ui");
  visible(el("welcome"), false);
  visible(el("pausePanel"), false);
  visible(el("restartPanel"), false);
  sound.pause(false);
  focus(canvas);
  if (resume && checkpoint !== null) {
    restore(checkpoint);
    return;
  }
  try {
    storage.removeItem(CHECKPOINT_KEY);
  } catch {}
  timeline.clear();
  clearHearts();
  hideDialogue();
  moveTask = driveTask = gateTask = houseDoorTask = null;
  finalOrbit = false;
  elapsed = 0;
  gaitPhase = 0;
  blooms.forEach((b) => {
    b.userData.birth = Infinity;
    b.userData.growing = false;
    b.scale.setScalar(0.001);
  });
  visible(ui.finalPanel, false);
  visible(ui.classPanel, false);
  visible(el("wishPanel"), false);
  document.body.classList.remove("finale-ui");
  setSpace("outdoor");
  teacherRoot.visible = true;
  carRoot.visible = false;
  controlled = teacherRoot;
  portal.visible = true;
  schoolGateLeft.rotation.y =
    schoolGateRight.rotation.y =
    houseDoor.rotation.y =
      0;
  fade.classList.remove("on");
  resetCamera();
  teacherRoot.position.copy(vec(ROUTES.intro[0]));
  camera.position.set(0, 9.5, 25);
  setStage(0);
  startMove(
    route("intro"),
    3.2,
    () => {
      portal.visible = false;
      setStage(0);
      animMode = "wave";
      showDialogue(DIALOGUES.intro);
    },
    "walk",
    "follow",
  );
}
let pauseFocus = null;
function setPaused(value) {
  if (!started) return;
  paused = value;
  document.body.classList.toggle("paused-ui", value);
  visible(el("pausePanel"), value);
  sound.pause(value);
  if (value) {
    pauseFocus = document.activeElement;
    focus(el("continueBtn"));
  } else focus(pauseFocus || canvas);
}
ui.action.addEventListener("click", action);
ui.dismissClass.addEventListener("click", dismissClass);
el("startBtn").addEventListener("click", () => start());
el("resumeBtn").addEventListener("click", () => start(true));
el("pauseBtn").addEventListener("click", () => setPaused(!paused));
el("continueBtn").addEventListener("click", () => setPaused(false));
el("cameraBtn").addEventListener("click", resetCamera);
el("closeDialogue").addEventListener("click", hideDialogue);
el("reduceMotion").checked = reducedMotion;
el("reduceMotion").addEventListener(
  "change",
  (e) => (reducedMotion = e.target.checked),
);
function askRestart() {
  paused = true;
  document.body.classList.add("paused-ui");
  visible(el("pausePanel"), false);
  visible(el("restartPanel"), true);
  sound.pause(true);
  focus(el("cancelRestart"));
}
ui.replay.addEventListener("click", askRestart);
el("restartBtn").addEventListener("click", askRestart);
el("confirmRestart").addEventListener("click", () => start());
el("cancelRestart").addEventListener("click", () => {
  visible(el("restartPanel"), false);
  setPaused(false);
});
el("wishesBtn").addEventListener("click", () => {
  visible(el("wishPanel"), true);
  focus(el("closeWishes"));
});
el("closeWishes").addEventListener("click", () => {
  visible(el("wishPanel"), false);
  focus(el("wishesBtn"));
});
el("soundBtn").addEventListener("click", async () => {
  try {
    const enabled = await sound.toggle();
    el("soundBtn").setAttribute("aria-pressed", String(enabled));
    el("soundBtn").setAttribute(
      "aria-label",
      enabled ? "Tắt nhạc" : "Bật nhạc",
    );
  } catch {
    ui.assetStatus.textContent = "Âm thanh chưa sẵn sàng trong trình duyệt này";
  }
});
TREE_WISHES.forEach((w) => {
  const p = document.createElement("p");
  p.textContent = w;
  el("treeWishes").appendChild(p);
});
// Native hidden/inert panels plus a focus loop keep keyboard input inside the current dialog.
addEventListener("keydown", (e) => {
  const modal = ["restartPanel", "pausePanel", "wishPanel", "classroomPanel"]
    .map(el)
    .find((p) => !p.inert);
  if (e.key === "Tab" && modal) {
    const nodes = [...modal.querySelectorAll("button,select,input")].filter(
      (n) => !n.disabled,
    );
    if (!nodes.length) return;
    const first = nodes[0],
      last = nodes.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      focus(last);
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      focus(first);
    }
    return;
  }
  if (e.key === "Escape") {
    if (!el("wishPanel").inert) {
      el("closeWishes").click();
      return;
    }
    if (!el("restartPanel").inert) {
      el("cancelRestart").click();
      return;
    }
    setPaused(!paused);
    return;
  }
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLSelectElement ||
    e.target instanceof HTMLButtonElement
  )
    return;
  if (e.key === "Enter") {
    e.preventDefault();
    if (!started && !el("startBtn").disabled) start();
    else action();
  }
  if (e.key.toLowerCase() === "r") resetCamera();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && started && !paused) setPaused(true);
});
let dragging = false,
  lastPX = 0,
  lastPY = 0,
  pointerStart = null;
const pointers = new Map();
let pinchDistance = 0;
canvas.addEventListener("pointerdown", (e) => {
  if (paused || e.button !== 0) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  canvas.setPointerCapture(e.pointerId);
  dragging = true;
  lastPX = e.clientX;
  lastPY = e.clientY;
  pointerStart = { x: e.clientX, y: e.clientY };
  userCameraTouched = true;
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
  }
});
canvas.addEventListener("pointermove", (e) => {
  if (!dragging || paused || !pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()],
      distance = Math.hypot(a.x - b.x, a.y - b.y);
    cameraZoom = THREE.MathUtils.clamp(
      cameraZoom + (pinchDistance - distance) * 0.025,
      5.3,
      13.5,
    );
    pinchDistance = distance;
  } else {
    cameraUserYaw -= (e.clientX - lastPX) * 0.006;
    cameraPitch = THREE.MathUtils.clamp(
      cameraPitch - (e.clientY - lastPY) * 0.003,
      -0.28,
      0.72,
    );
  }
  lastPX = e.clientX;
  lastPY = e.clientY;
});
function endPointer(e) {
  const wasPinch = pointers.size > 1;
  pointers.delete(e.pointerId);
  dragging = pointers.size > 0;
  if (dragging) {
    const p = [...pointers.values()][0];
    lastPX = p.x;
    lastPY = p.y;
    pointerStart = null;
  }
  if (
    !wasPinch &&
    pointerStart &&
    e.type === "pointerup" &&
    Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) < 6 &&
    stage === 9
  ) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        (e.clientX / innerWidth) * 2 - 1,
        1 - (e.clientY / innerHeight) * 2,
      ),
      camera,
    );
    const hit = ray.intersectObjects(blooms, true)[0];
    if (hit) {
      let node = hit.object;
      while (node && !node.userData.wish) node = node.parent;
      if (node)
        showDialogue(
          { name: "Một điều ước dành cho Mẹ", text: node.userData.wish },
          10000,
        );
    }
  }
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);
canvas.addEventListener("lostpointercapture", (e) => {
  pointers.delete(e.pointerId);
  dragging = pointers.size > 0;
});
canvas.addEventListener(
  "wheel",
  (e) => {
    if (!paused)
      cameraZoom = THREE.MathUtils.clamp(
        cameraZoom + Math.sign(e.deltaY) * 0.7,
        5.3,
        13.5,
      );
    e.preventDefault();
  },
  { passive: false },
);
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  setPaused(true);
  window.showBootError(
    "Trình duyệt đã mất kết nối với GPU. Thử tải lại và chọn mức hình ảnh Nhẹ.",
  );
});

buildWorlds();
const presentation = createPresentation(renderer, scene, camera, sun),
  atmosphere = createAtmosphere(scene);
const initialQuality =
  qa && ["low", "medium", "high"].includes(params.get("qaQuality"))
    ? params.get("qaQuality")
    : innerWidth < 760 || (navigator.hardwareConcurrency || 4) <= 4
      ? "low"
      : "medium";
el("quality").value = presentation.setQuality(initialQuality);
el("quality").addEventListener("change", (e) =>
  presentation.setQuality(e.target.value),
);
setSpace("outdoor");
teacherRoot.position.copy(vec(ROUTES.intro.at(-1)));
faceDirection(new THREE.Vector3(0, 0, 1));
portal.visible = false;
camera.position.set(10, 8.5, 22);
animMode = "wave";
decorateWorld({
  outdoor: outdoorWorld,
  house: houseWorld,
  finale: finaleWorld,
  box,
  sphere,
  cyl,
  M,
  loader,
  desks: DESKS,
  treeRoot,
});
loadSurfaces([outdoorWorld, houseWorld, finaleWorld], renderer);
let frames = 0;
function loop() {
  requestAnimationFrame(loop);
  const raw = Math.min(0.05, clock.getDelta()),
    dt = raw * qaSpeed;
  if (!paused) {
    elapsed += dt;
    if (started) {
      timeline.update(dt);
      updateDoors(dt);
      updateMovement(dt);
      updateHearts(dt);
      updateBlooms();
    }
    animateTeacher(elapsed);
    if (portal.visible && !reducedMotion) portal.rotation.z += dt * 0.2;
    updateCamera(dt, elapsed);
    atmosphere.update(elapsed, controlled.position, currentSpace);
    sound.update(elapsed, !started);
  }
  presentation.render(raw, controlled.position, currentSpace);
  frames++;
}
loop();
loadAssets()
  .then(() => {
    el("loadingProgress").style.width = "100%";
    ui.loading.classList.add("done");
    window.__APP_READY__ = true;
    clearTimeout(window.__BOOT_WATCHDOG__);
    el("startBtn").disabled = false;
    if (checkpoint !== null) visible(el("resumeBtn"), true);
    if (qa && params.has("qaStage")) {
      const n = Number(params.get("qaStage"));
      if ([0, 1, 2, 3, 4, 6, 7, 8, 9].includes(n)) {
        started = true;
        document.body.classList.remove("welcome-ui");
        visible(el("welcome"), false);
        restore(n);
      }
    }
  })
  .catch((err) => window.showBootError(err.message));
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  presentation.resize();
});
// Read-only observability for genuine browser QA; no production skip/teleport controls.
if (qa)
  window.__GAME_DEBUG__ = Object.freeze({
    get stage() {
      return stage;
    },
    get busy() {
      return busy;
    },
    get paused() {
      return paused;
    },
    get space() {
      return currentSpace;
    },
    get position() {
      return teacherRoot.position.toArray();
    },
    get carPosition() {
      return carRoot.position.toArray();
    },
    get teacherVisible() {
      return teacherRoot.visible;
    },
    get carVisible() {
      return carRoot.visible;
    },
    get trace() {
      return trace.map((e) => ({ ...e, position: [...e.position] }));
    },
    get frames() {
      return frames;
    },
    get drawCalls() {
      return renderer.info.render.calls;
    },
    get quality() {
      return presentation.level;
    },
    get gateOpen() {
      return Math.abs(schoolGateLeft.rotation.y) > 1.5;
    },
    get flowerCount() {
      return blooms.length;
    },
    get cameraPosition() {
      return camera.position.toArray();
    },
    get assets() {
      return [...assetFailures];
    },
    get time() {
      return timeline.time;
    },
  });
