import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CLASS_WISHES, TREE_WISHES, STAGES, DIALOGUES, TEACHER_MOM_CHARACTER } from './config.js';
import { ROUTES, DESKS } from './world-spec.mjs';

const canvas = document.getElementById('game');
const ui = {
  action: document.getElementById('actionBtn'),
  actionLabel: document.getElementById('actionLabel'),
  stageNumber: document.getElementById('stageNumber'),
  objective: document.getElementById('objective'),
  objectiveTitle: document.getElementById('objectiveTitle'),
  objectiveText: document.getElementById('objectiveText'),
  dialogue: document.getElementById('dialogue'),
  dialogueName: document.getElementById('dialogueName'),
  dialogueText: document.getElementById('dialogueText'),
  classPanel: document.getElementById('classroomPanel'),
  classWishes: document.getElementById('classWishes'),
  dismissClass: document.getElementById('dismissClass'),
  finalPanel: document.getElementById('finalPanel'),
  replay: document.getElementById('replayBtn'),
  loading: document.getElementById('loading'),
  assetStatus: document.getElementById('assetStatus')
};

CLASS_WISHES.forEach(w => {
  const e = document.createElement('div');
  e.className = 'wish-card';
  e.textContent = w;
  ui.classWishes.appendChild(e);
});

let fade = document.getElementById('fade');
if (!fade) {
  fade = document.createElement('div');
  fade.id = 'fade';
  fade.className = 'fade';
  document.body.appendChild(fade);
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  ui.loading.classList.add('done');
  ui.objectiveTitle.textContent = 'Không khởi tạo được WebGL';
  ui.objectiveText.textContent = 'Hãy bật Hardware Acceleration/WebGL trong Chrome rồi tải lại trang.';
  throw err;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1 : 1.35));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = innerWidth >= 760;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 700);
const clock = new THREE.Clock();
const loader = new GLTFLoader();
const UP = new THREE.Vector3(0, 1, 0);

const outdoorWorld = new THREE.Group();
const houseWorld = new THREE.Group();
const finaleWorld = new THREE.Group();
const actorLayer = new THREE.Group();
scene.add(outdoorWorld, houseWorld, finaleWorld, actorLayer);
houseWorld.visible = false;
finaleWorld.visible = false;

scene.add(new THREE.HemisphereLight(0xffffff, 0x8f7a70, 2.35));
const sun = new THREE.DirectionalLight(0xffefd1, 2.65);
sun.position.set(-35, 65, 28);
sun.castShadow = renderer.shadowMap.enabled;
if (sun.castShadow) {
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -120;
}
scene.add(sun);

const mats = {};
const blockers = { outdoor: [], house: [], finale: [] };
const cameraRay = new THREE.Raycaster();
let currentSpace = 'outdoor';

const M = (c, r = .72, m = 0) => mats[`${c}_${r}_${m}`] || (mats[`${c}_${r}_${m}`] = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }));
const mesh = (g, mat, cast = true, receive = true) => {
  const o = new THREE.Mesh(g, mat);
  o.castShadow = renderer.shadowMap.enabled && cast;
  o.receiveShadow = receive;
  return o;
};
const box = (parent, size, pos, color, blockSpace = null) => {
  const o = mesh(new THREE.BoxGeometry(...size), M(color));
  o.position.set(...pos);
  parent.add(o);
  if (blockSpace) blockers[blockSpace].push(o);
  return o;
};
const sphere = (parent, r, pos, color, scale = [1, 1, 1]) => {
  const o = mesh(new THREE.SphereGeometry(r, 18, 12), M(color));
  o.position.set(...pos);
  o.scale.set(...scale);
  parent.add(o);
  return o;
};
const cyl = (parent, rt, rb, h, pos, color, seg = 16) => {
  const o = mesh(new THREE.CylinderGeometry(rt, rb, h, seg), M(color));
  o.position.set(...pos);
  parent.add(o);
  return o;
};

function label(text, w = 900, h = 150, fg = '#875064', bg = 'rgba(255,250,248,.94)', font = 46) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = bg;
  x.beginPath();
  if (x.roundRect) x.roundRect(8, 8, w - 16, h - 16, 28); else x.rect(8, 8, w - 16, h - 16);
  x.fill();
  x.fillStyle = fg;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.font = `800 ${font}px system-ui`;
  x.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(w / 115, h / 115, 1);
  return s;
}

function cloud(parent, x, y, z, s = 1) {
  const g = new THREE.Group();
  [[0,0,0,1.2],[1,.1,.1,.85],[-1,.1,.15,.82],[.25,.5,0,.75],[-.35,.42,.1,.65]].forEach(v => {
    sphere(g, .9, [v[0], v[1], v[2]], 0xfffbf8, [1.35 * v[3], .55 * v[3], v[3]]);
  });
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  parent.add(g);
  return g;
}

function flower(parent, x, z, s = 1, c = 0xff8daf, y = 0) {
  const g = new THREE.Group();
  cyl(g, .035, .045, .55, [0, .28, 0], 0x5f9b56, 7);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    sphere(g, .13, [Math.cos(a) * .15, .64, Math.sin(a) * .15], c, [1.1, .65, .75]);
  }
  sphere(g, .08, [0, .64, 0], 0xffd56a);
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  parent.add(g);
  return g;
}

function person(parent, x, y, z, shirt = 0xf3a1ba, hair = 0x352824, s = 1) {
  const g = new THREE.Group();
  cyl(g, .32, .42, 1.05, [0, .72, 0], shirt, 12);
  sphere(g, .36, [0, 1.54, 0], 0xf0c2a4);
  sphere(g, .39, [0, 1.68, .03], hair, [1, .52, 1]);
  cyl(g, .09, .1, .55, [-.18, .13, 0], 0xd7aa8c, 8);
  cyl(g, .09, .1, .55, [.18, .13, 0], 0xd7aa8c, 8);
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  parent.add(g);
  return g;
}

const vec = arr => new THREE.Vector3(arr[0], arr[1], arr[2]);
const route = name => ROUTES[name].map(vec);

function proceduralTeacher() {
  const r = new THREE.Group();
  r.name = 'TeacherMom_Root';
  const body = new THREE.Group();
  body.name = 'TeacherMom_Body';
  r.add(body);
  const ao = mesh(new THREE.CylinderGeometry(.44, .29, 1.15, 24), M(0x83b9dc));
  ao.position.y = 1.25;
  body.add(ao);
  box(body, [.72, .16, 1.15], [0, .58, .03], 0x9ccbe7);
  const head = new THREE.Group();
  head.name = 'Head';
  head.position.y = 2.22;
  r.add(head);
  sphere(head, .55, [0, 0, 0], 0xefb99c, [.92, .84, 1.08]);
  sphere(head, .57, [0, .07, .05], 0x1b1312, [1, .48, 1.05]);
  sphere(head, .052, [-.17, -.44, .08], 0x241b1b);
  sphere(head, .052, [.17, -.44, .08], 0x241b1b);
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.name = side < 0 ? 'Arm_L' : 'Arm_R';
    arm.position.set(side * .42, 1.55, 0);
    r.add(arm);
    cyl(arm, .1, .11, .72, [0, -.35, 0], 0x83b9dc);
    sphere(arm, .12, [0, -.76, 0], 0xefb99c);
    const leg = new THREE.Group();
    leg.name = side < 0 ? 'Leg_L' : 'Leg_R';
    leg.position.set(side * .18, .68, 0);
    r.add(leg);
    cyl(leg, .105, .105, .7, [0, -.34, 0], 0xf4f0e9);
    box(leg, [.26, .18, .34], [0, -.73, -.07], 0x553832);
  }
  return r;
}

let teacherRoot = new THREE.Group();
let teacherVisual = proceduralTeacher();
let teacherParts = {};
let teacherVisualBaseY = 0;
let carRoot = new THREE.Group();
let premiumFlowerSource = null;
let premiumFlowers = [];
let controlled = teacherRoot;
let moveTask = null;
let driveTask = null;
let stage = 0;
let busy = true;
let animMode = 'idle';
let gaitPhase = 0;
let lastForward = new THREE.Vector3(0, 0, -1);
let portal, treeRoot, schoolGateLeft, schoolGateRight, houseDoor;
let gateTask = null, houseDoorTask = null;
let finalOrbit = false;
let cameraMode = 'follow';
let cameraUserYaw = 0, cameraPitch = .16, cameraZoom = 8.5;
let userCameraTouched = false;
let classroomOrbit = Math.PI;
let heartClock = 0;
const hearts = [];
let heartTexture = null;
const blooms = [];

teacherRoot.add(teacherVisual);
actorLayer.add(teacherRoot, carRoot);
carRoot.visible = false;

function buildFallbackCar() {
  carRoot.clear();
  box(carRoot, [3.1, .75, 4.8], [0, .8, 0], 0xe98a97);
  box(carRoot, [2.35, 1.05, 2.25], [0, 1.55, -.15], 0xf2a5ad);
  for (const x of [-1.25, 1.25]) for (const z of [-1.55, 1.55]) {
    const w = cyl(carRoot, .34, .34, .24, [x, .43, z], 0x302b2b, 14);
    w.rotation.z = Math.PI / 2;
  }
}
buildFallbackCar();

function mapTeacherParts() {
  teacherParts = {
    head: teacherVisual.getObjectByName('Head'),
    body: teacherVisual.getObjectByName('TeacherMom_Body'),
    armL: teacherVisual.getObjectByName('Arm_L'),
    armR: teacherVisual.getObjectByName('Arm_R'),
    legL: teacherVisual.getObjectByName('Leg_L'),
    legR: teacherVisual.getObjectByName('Leg_R')
  };
}
mapTeacherParts();

function normalizeModel(model, target = 2.65) {
  const b = new THREE.Box3().setFromObject(model), sz = new THREE.Vector3();
  b.getSize(sz);
  model.scale.setScalar(target / Math.max(sz.y, .001));
  const b2 = new THREE.Box3().setFromObject(model), c = new THREE.Vector3();
  b2.getCenter(c);
  model.position.x -= c.x;
  model.position.z -= c.z;
  model.position.y -= b2.min.y;
}

function fitPremiumFlower(model, targetWidth = 1.35) {
  const b = new THREE.Box3().setFromObject(model), sz = new THREE.Vector3();
  b.getSize(sz);
  const sc = targetWidth / Math.max(sz.x, sz.z, .001);
  model.scale.setScalar(sc);
  const b2 = new THREE.Box3().setFromObject(model);
  model.position.y -= b2.min.y;
}

function clonePremium(parent, x, y, z, s, rot) {
  if (!premiumFlowerSource) return;
  const c = premiumFlowerSource.clone(true);
  c.position.set(x, y, z);
  c.scale.multiplyScalar(s);
  c.rotation.y = rot;
  c.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  parent.add(c);
  premiumFlowers.push(c);
}

function spawnPremiumFlowerGarden() {
  if (!premiumFlowerSource || premiumFlowers.length) return;
  let i = 0;
  for (let z = -10; z > -73; z -= 5.8) {
    clonePremium(outdoorWorld, -4.9, .02, z, .56, (i++ * 2.399) % 6.28);
    clonePremium(outdoorWorld, 4.9, .02, z, .54, (i++ * 2.399) % 6.28);
  }
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
    clonePremium(finaleWorld, Math.cos(a) * 6.2, .08, -1 + Math.sin(a) * 5.1, .58, a + Math.PI);
  }
}

function loadAssets() {
  ui.assetStatus.textContent = 'Đang nạp chibi 3D của Mẹ…';
  loader.load(TEACHER_MOM_CHARACTER.modelPath, g => {
    const m = g.scene;
    normalizeModel(m, 2.65);
    m.rotation.y = 0;
    m.traverse(o => { if (o.isMesh) { o.castShadow = renderer.shadowMap.enabled; o.receiveShadow = true; } });
    teacherRoot.remove(teacherVisual);
    teacherVisual = m;
    teacherRoot.add(m);
    teacherVisualBaseY = m.position.y;
    mapTeacherParts();
    ui.assetStatus.textContent = 'Mẹ chibi 3D · camera 360° · nhà 3D tách riêng';
  }, undefined, () => {
    ui.assetStatus.textContent = 'Mẹ chibi 3D · chế độ dự phòng';
  });

  loader.load('./assets/models/sedan.glb', g => {
    const m = g.scene;
    normalizeModel(m, 2.1);
    m.rotation.y = Math.PI / 2;
    m.traverse(o => { if (o.isMesh) { o.castShadow = renderer.shadowMap.enabled; o.receiveShadow = true; } });
    carRoot.clear();
    carRoot.add(m);
  }, undefined, () => {});

  loader.load('./assets/models/flower_empodium_4k.glb', g => {
    const m = g.scene;
    fitPremiumFlower(m);
    premiumFlowerSource = m;
    spawnPremiumFlowerGarden();
    ui.assetStatus.textContent = 'Mẹ chibi 3D · camera 360° · hoa 4K CC0';
  }, undefined, () => {});
}

function buildCloudRibbon(parent, routeNames, width = 4.5, step = 2.7, y = -.24) {
  const pts = routeNames.flatMap((n, idx) => ROUTES[n].slice(idx ? 1 : 0)).map(vec);
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .2);
  const len = curve.getLength(), count = Math.ceil(len / step);
  const geom = new THREE.SphereGeometry(1, 12, 8), mat = M(0xfffdf8, .88, 0);
  const inst = new THREE.InstancedMesh(geom, mat, (count + 1) * 3);
  const dummy = new THREE.Object3D();
  let k = 0;
  for (let i = 0; i <= count; i++) {
    const t = i / count, p = curve.getPoint(t), tan = curve.getTangent(Math.min(.999, t)).normalize();
    const side = new THREE.Vector3(-tan.z, 0, tan.x);
    for (const off of [-width * .42, 0, width * .42]) {
      const pos = p.clone().addScaledVector(side, off);
      dummy.position.set(pos.x, y, pos.z);
      dummy.scale.set(1.75 + Math.random() * .45, .24, .95 + Math.random() * .28);
      dummy.rotation.y = Math.atan2(tan.x, tan.z);
      dummy.updateMatrix();
      inst.setMatrixAt(k++, dummy.matrix);
    }
  }
  inst.castShadow = false;
  inst.receiveShadow = true;
  parent.add(inst);
}

function buildSchoolGate() {
  box(outdoorWorld, [1.1, 6, 1.1], [-6.5, 3, -79], 0xedd3aa, 'outdoor');
  box(outdoorWorld, [1.1, 6, 1.1], [6.5, 3, -79], 0xedd3aa, 'outdoor');
  box(outdoorWorld, [14, 1, 1], [0, 6, -79], 0xedd3aa, 'outdoor');
  const sign = label('TRƯỜNG TIỂU HỌC HOA MÂY', 900, 130, '#396d92', 'rgba(255,252,239,.98)', 48);
  sign.position.set(0, 6.25, -78.4);
  outdoorWorld.add(sign);
  schoolGateLeft = new THREE.Group();
  schoolGateLeft.position.set(-5.9, 0, -78.65);
  box(schoolGateLeft, [5.7, 3.6, .14], [2.85, 1.8, 0], 0xdfeaf0);
  for (let x = .5; x < 5.6; x += .7) cyl(schoolGateLeft, .045, .045, 3.0, [x, 1.75, .08], 0x6689a0, 8);
  outdoorWorld.add(schoolGateLeft);
  schoolGateRight = new THREE.Group();
  schoolGateRight.position.set(5.9, 0, -78.65);
  box(schoolGateRight, [5.7, 3.6, .14], [-2.85, 1.8, 0], 0xdfeaf0);
  for (let x = -.5; x > -5.6; x -= .7) cyl(schoolGateRight, .045, .045, 3.0, [x, 1.75, .08], 0x6689a0, 8);
  outdoorWorld.add(schoolGateRight);
}

function buildSchoolAndClassroom() {
  box(outdoorWorld, [8, .16, 29], [0, .02, -93], 0xf8f0e6);
  box(outdoorWorld, [10, 7, 19], [-12, 3.5, -92], 0xf2d2a8, 'outdoor');
  box(outdoorWorld, [10, 7, 19], [12, 3.5, -92], 0xf2d2a8, 'outdoor');
  for (let z = -87; z >= -99; z -= 5) {
    box(outdoorWorld, [.25, 5, .25], [-6.4, 2.5, z], 0xf7eadb);
    box(outdoorWorld, [.25, 5, .25], [6.4, 2.5, z], 0xf7eadb);
  }
  const classSign = label('LỚP HỌC CỦA MẸ', 560, 105, '#7b5260', 'rgba(255,248,241,.96)', 38);
  classSign.position.set(0, 4.5, -104.8);
  outdoorWorld.add(classSign);

  box(outdoorWorld, [20, .18, 20], [0, .01, -116.5], 0xd7b98c);
  box(outdoorWorld, [20, 5, .4], [0, 2.5, -126.5], 0xe3c19e, 'outdoor');
  box(outdoorWorld, [.4, 5, 20], [-10.25, 2.5, -116.5], 0xf0d7bc, 'outdoor');
  box(outdoorWorld, [7.1, 5, .4], [-6.75, 2.5, -106.5], 0xf0d7bc, 'outdoor');
  box(outdoorWorld, [7.1, 5, .4], [6.75, 2.5, -106.5], 0xf0d7bc, 'outdoor');
  box(outdoorWorld, [6.2, .42, .4], [0, 4.8, -106.5], 0xe3c19e, 'outdoor');
  box(outdoorWorld, [.4, 5, 8.7], [10.25, 2.5, -122.45], 0xf0d7bc, 'outdoor');
  box(outdoorWorld, [.4, 5, 5.5], [10.25, 2.5, -109.25], 0xf0d7bc, 'outdoor');
  box(outdoorWorld, [.4, .42, 6], [10.25, 4.8, -115], 0xe3c19e, 'outdoor');

  const exitSign = label('LỐI RA →', 380, 90, '#44775c', 'rgba(250,255,249,.96)', 34);
  exitSign.position.set(10.0, 3.8, -115);
  outdoorWorld.add(exitSign);

  box(outdoorWorld, [10, 3, .15], [0, 3, -126.2], 0x3e6e5a);
  const board = label('20/11 · Cảm ơn cô vì đã luôn ở đây!', 880, 125, '#fff4df', 'rgba(0,0,0,0)', 40);
  board.position.set(0, 3, -126.05);
  outdoorWorld.add(board);
  box(outdoorWorld, [4.5, .25, 1.8], [0, .54, -121.8], 0xb9825b);

  DESKS.forEach((d, i) => {
    const x = (d.min[0] + d.max[0]) / 2, z = (d.min[2] + d.max[2]) / 2;
    box(outdoorWorld, [2.1, .16, 1.0], [x, .95, z], 0xb9825b);
    const child = person(outdoorWorld, x, .15, z - .15, i % 2 ? 0xe8f2ff : 0xfff9ef, 0x352824, .57);
    child.rotation.y = i % 2 ? .05 : -.05;
  });
}

function buildHouseExterior() {
  const c = 0xf2dfcd, trim = 0xd4b58f;
  box(outdoorWorld, [6.9, 6.5, .6], [95.0, 3.25, -95.2], c, 'outdoor');
  box(outdoorWorld, [6.9, 6.5, .6], [105.0, 3.25, -95.2], c, 'outdoor');
  box(outdoorWorld, [16.0, 1.2, .8], [100, 6.25, -95.15], trim);
  box(outdoorWorld, [16.5, .7, 10], [100, 7.0, -90.6], 0x9f705d);
  box(outdoorWorld, [.5, 6.2, 9], [91.8, 3.1, -90.8], c);
  box(outdoorWorld, [.5, 6.2, 9], [108.2, 3.1, -90.8], c);
  box(outdoorWorld, [16.5, 6.2, .5], [100, 3.1, -86.5], c);

  houseDoor = new THREE.Group();
  houseDoor.position.set(98.55, 0, -95.45);
  box(houseDoor, [2.75, 3.55, .18], [1.37, 1.78, 0], 0x9b6d50);
  box(houseDoor, [.12, 3.1, .22], [2.55, 1.72, -.03], 0xe9d5b8);
  sphere(houseDoor, .07, [2.35, 1.75, -.16], 0xe8c86e);
  outdoorWorld.add(houseDoor);

  const sign = label('NHÀ CỦA MẸ', 480, 100, '#825a54', 'rgba(255,250,244,.96)', 38);
  sign.position.set(100, 5.3, -94.75);
  outdoorWorld.add(sign);

  flower(outdoorWorld, 92.5, -96.6, 1.1, 0xff9db8, .02);
  flower(outdoorWorld, 107.5, -96.6, 1.1, 0xffcf73, .02);
}

function buildOutdoorWorld() {
  scene.background = new THREE.Color(0xbfe2ff);
  scene.fog = new THREE.Fog(0xd7edff, 105, 330);
  for (let i = 0; i < 34; i++) cloud(outdoorWorld, (i % 7 - 3) * 18 + (i % 2) * 4, 7 + (i % 5) * 1.9, 35 - i * 10, .62 + (i % 3) * .24);

  portal = new THREE.Group();
  portal.add(mesh(new THREE.TorusGeometry(3, .25, 14, 54), new THREE.MeshStandardMaterial({ color: 0x9a6fff, emissive: 0x7454ff, emissiveIntensity: 2.8, roughness: .3 })));
  const disk = mesh(new THREE.CircleGeometry(2.72, 48), new THREE.MeshBasicMaterial({ color: 0x120c24 }), false, false);
  disk.position.z = -.05;
  portal.add(disk);
  portal.position.set(0, 8.2, 16);
  outdoorWorld.add(portal);
  cloud(outdoorWorld, 0, 4.2, 10, 2.1);

  const hero = label('Chúc mừng Mẹ ngày Nhà giáo Việt Nam 20/11', 1050, 150, '#cf587f', 'rgba(255,250,249,.95)', 42);
  hero.position.set(0, 10.5, 8);
  outdoorWorld.add(hero);

  buildCloudRibbon(outdoorWorld, ['jump', 'garden', 'toSchool'], 4.7, 2.35, -.30);
  buildCloudRibbon(outdoorWorld, ['exitClass'], 4.4, 2.5, -.28);
  buildCloudRibbon(outdoorWorld, ['driveHome', 'toDoor'], 7.2, 2.8, -.38);
  for (let z = -6; z > -73; z -= 2.4) {
    flower(outdoorWorld, -4.7 + Math.sin(z) * .28, z, .66, Math.round(Math.abs(z)) % 4 === 0 ? 0xf7cf72 : 0xff91b4, .04);
    flower(outdoorWorld, 4.7 + Math.cos(z) * .28, z, .66, Math.round(Math.abs(z)) % 5 === 0 ? 0xb09aff : 0xff91b4, .04);
  }

  buildSchoolGate();
  buildSchoolAndClassroom();
  buildHouseExterior();
}

function addHouseLight(x, y, z, color = 0xffe0bd, intensity = 22) {
  const l = new THREE.PointLight(color, intensity, 22, 2);
  l.position.set(x, y, z);
  houseWorld.add(l);
}

function stairSteps(parent, points, color = 0xd8b88f) {
  for (let i = 1; i < points.length - 1; i++) {
    const p = vec(points[i]);
    const n = vec(points[Math.min(i + 1, points.length - 1)]);
    if (Math.abs(n.y - p.y) < .25) continue;
    const dir = n.clone().sub(p);
    const step = box(parent, [1.15, .18, 2.0], [p.x, Math.max(.12, p.y - .05), p.z], color);
    step.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI / 2;
  }
}

function buildHouseInterior() {
  const floor = 0xd9bb91, wall = 0xf2e3d3, accent = 0xe8c7bb;
  box(houseWorld, [18, .28, 13], [0, 0, 0], floor);
  box(houseWorld, [.5, 9.2, 13], [-9.15, 4.6, 0], wall, 'house');
  box(houseWorld, [.5, 9.2, 13], [9.15, 4.6, 0], wall, 'house');
  box(houseWorld, [18.8, 9.2, .5], [0, 4.6, -6.75], wall, 'house');

  // Floor 2 is split around the first stairwell, so the camera and avatar never intersect a solid ceiling.
  box(houseWorld, [11.2, .28, 13], [-3.5, 4.5, 0], floor);
  box(houseWorld, [2.0, .28, 13], [8.0, 4.5, 0], floor);
  box(houseWorld, [5.4, .18, 1.2], [4.35, 4.5, -5.6], floor);

  // Warm interior details.
  box(houseWorld, [5.2, .15, 3.2], [-3.2, .18, 1.0], 0xd6a9a6);
  box(houseWorld, [3.3, 1.0, 1.1], [2.6, .65, 3.5], 0xb99b86);
  sphere(houseWorld, .65, [6.9, .7, 3.4], 0x7daa72, [1.1, 1.3, 1.0]);
  cyl(houseWorld, .5, .62, .55, [6.9, .3, 3.4], 0xb57855);
  box(houseWorld, [4.8, .14, 2.6], [-2.4, 4.68, 2.2], 0xc9a7b9);
  box(houseWorld, [3.6, .7, 1.0], [3.6, 5.0, -4.3], 0xa9bcd0);

  // Family members intentionally have no giant world-space labels; dialogue UI carries the names cleanly.
  const father = person(houseWorld, -3, .18, 1.0, 0x8fa6b8, 0x302b29, .95);
  father.rotation.y = Math.PI;
  const older = person(houseWorld, -3, 4.58, -1.0, 0x6fa8d8, 0x352c29, .82);
  older.rotation.y = .15;
  const younger = person(houseWorld, 1.2, 4.58, 3.0, 0x7eb8df, 0x352c29, .82);
  younger.rotation.y = -1.1;

  stairSteps(houseWorld, ROUTES.stairs1);
  stairSteps(houseWorld, ROUTES.stairs2, 0xcfa77b);

  // Simple handrails help communicate the stair direction without blocking the route.
  for (let i = 0; i < 8; i++) {
    const x = 5.6 - i * .62, y = .85 + i * .5;
    cyl(houseWorld, .035, .035, .9, [x, y, -3.45], 0x9c765c, 8);
  }
  for (let i = 0; i < 8; i++) {
    const x = -5.5 + i * .62, y = 5.25 + i * .5;
    cyl(houseWorld, .035, .035, .9, [x, y, 1.3], 0x9c765c, 8);
  }

  // Interior entrance frame and magical attic exit.
  box(houseWorld, [3.3, 4.0, .3], [0, 2.0, 6.35], accent);
  box(houseWorld, [2.45, 3.55, .34], [0, 1.78, 6.18], 0x9b6d50);
  const attic = new THREE.Group();
  attic.position.set(0, 9.45, .5);
  attic.add(mesh(new THREE.TorusGeometry(1.45, .14, 12, 40), new THREE.MeshStandardMaterial({ color: 0xffd9ec, emissive: 0xff7eb0, emissiveIntensity: 1.5 })));
  houseWorld.add(attic);

  addHouseLight(-4, 3.8, 2, 0xffd8b0, 26);
  addHouseLight(4, 3.8, -2, 0xffe8c9, 24);
  addHouseLight(-2, 8.2, 1.5, 0xffd6e5, 24);
}

function makeBloom(parent, wish, i) {
  const g = new THREE.Group();
  const colors = [0xff91b4, 0xffc96f, 0xb8a3ff, 0x9fd9c2];
  const color = colors[i % colors.length];
  for (let k = 0; k < 6; k++) {
    const a = k * Math.PI * 2 / 6;
    sphere(g, .18, [Math.cos(a) * .2, Math.sin(a) * .08, Math.sin(a) * .2], color, [1.15, .72, .9]);
  }
  sphere(g, .08, [0, 0, 0], 0xffe49a);
  const s = label(wish, 620, 95, '#7b4357', 'rgba(255,252,249,.94)', 29);
  s.scale.multiplyScalar(.62);
  s.position.set(0, .65, 0);
  s.visible = false;
  g.add(s);
  g.userData.label = s;
  g.userData.birth = Infinity;
  g.scale.setScalar(.001);
  parent.add(g);
  return g;
}

function buildFinaleWorld() {
  for (let i = 0; i < 18; i++) {
    const a = i * Math.PI * 2 / 18;
    cloud(finaleWorld, Math.cos(a) * 10.5, -1.0 + (i % 3) * .12, -1 + Math.sin(a) * 8.2, 1.6 + (i % 2) * .3);
  }
  cyl(finaleWorld, 7.8, 6.5, 1.1, [0, -.55, -1], 0x9fc384, 40);
  for (let i = 0; i < 22; i++) {
    const a = i * 2.399, r = 3.8 + (i % 4) * .7;
    flower(finaleWorld, Math.cos(a) * r, -1 + Math.sin(a) * r, .72, [0xff91b4, 0xffcf73, 0xb7a4ff][i % 3], .02);
  }

  treeRoot = new THREE.Group();
  treeRoot.position.set(0, .05, -2.1);
  finaleWorld.add(treeRoot);
  cyl(treeRoot, .55, .9, 4.6, [0, 2.3, 0], 0x7d5235, 18);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI * 2 / 8, cx = Math.cos(a) * 2.1, cz = Math.sin(a) * 2.1;
    const b = cyl(treeRoot, .16, .25, 2.7, [cx * .42, 4.2, cz * .42], 0x7d5235, 10);
    b.rotation.z = Math.cos(a) * .62;
    b.rotation.x = Math.sin(a) * .62;
    sphere(treeRoot, 1.28, [cx, 5.15, cz], 0x78a85b, [1.2, .75, 1.1]);
  }
  TREE_WISHES.forEach((wish, i) => {
    const a = i * Math.PI * 2 / TREE_WISHES.length * 3.1;
    const r = 1.8 + (i % 4) * .62, y = 4.0 + (i % 5) * .52;
    const b = makeBloom(treeRoot, wish, i);
    b.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    blooms.push(b);
  });

  const finalLight = new THREE.PointLight(0xffd2e5, 38, 30, 2);
  finalLight.position.set(0, 8, -2);
  finaleWorld.add(finalLight);
}

function buildWorlds() {
  buildOutdoorWorld();
  buildHouseInterior();
  buildFinaleWorld();
}

function setSpace(space) {
  currentSpace = space;
  outdoorWorld.visible = space === 'outdoor';
  houseWorld.visible = space === 'house';
  finaleWorld.visible = space === 'finale';
  premiumFlowers.forEach(p => { p.visible = p.parent === (space === 'outdoor' ? outdoorWorld : finaleWorld); });
  if (space === 'outdoor') {
    scene.background = new THREE.Color(0xbfe2ff);
    scene.fog = new THREE.Fog(0xd7edff, 105, 330);
  } else if (space === 'house') {
    scene.background = new THREE.Color(0xead8c5);
    scene.fog = new THREE.Fog(0xead8c5, 26, 75);
  } else {
    scene.background = new THREE.Color(0xcceaff);
    scene.fog = new THREE.Fog(0xeaf7ff, 32, 105);
  }
  cameraUserYaw = 0;
  cameraPitch = .16;
  userCameraTouched = false;
}

function makeHeartTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.translate(64, 68);
  x.scale(1.35, 1.35);
  x.beginPath();
  x.moveTo(0, 24);
  x.bezierCurveTo(-34, 2, -34, -24, -14, -28);
  x.bezierCurveTo(-3, -30, 0, -19, 0, -13);
  x.bezierCurveTo(0, -19, 3, -30, 14, -28);
  x.bezierCurveTo(34, -24, 34, 2, 0, 24);
  x.closePath();
  x.fillStyle = '#ff7fa5';
  x.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function spawnHeart() {
  if (!heartTexture) heartTexture = makeHeartTexture();
  const mat = new THREE.SpriteMaterial({ map: heartTexture, transparent: true, opacity: .9, depthWrite: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(.32, .32, .32);
  s.position.copy(teacherRoot.position).add(new THREE.Vector3((Math.random() - .5) * .7, .35, (Math.random() - .5) * .5));
  s.userData.life = 0;
  s.userData.vx = (Math.random() - .5) * .22;
  s.userData.vz = (Math.random() - .5) * .18;
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
  const moving = moveTask && teacherRoot.visible;
  if (moving) {
    heartClock += dt;
    if (heartClock > .18) {
      heartClock = 0;
      spawnHeart();
    }
  }
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    h.userData.life += dt;
    h.position.y += dt * .8;
    h.position.x += h.userData.vx * dt;
    h.position.z += h.userData.vz * dt;
    h.material.opacity = Math.max(0, .9 - h.userData.life * .62);
    h.scale.multiplyScalar(1 + dt * .12);
    if (h.userData.life > 1.5) {
      scene.remove(h);
      h.material.dispose();
      hearts.splice(i, 1);
    }
  }
}

function hideDialogue() {
  clearTimeout(showDialogue.t);
  ui.dialogue.classList.add('hidden');
}

function showDialogue(d, ms = 5600) {
  ui.dialogueName.textContent = d.name;
  ui.dialogueText.textContent = d.text;
  ui.dialogue.classList.remove('hidden');
  clearTimeout(showDialogue.t);
  showDialogue.t = setTimeout(() => ui.dialogue.classList.add('hidden'), ms);
}

function setStage(n) {
  stage = n;
  const s = STAGES[n];
  ui.stageNumber.textContent = String(n + 1);
  ui.objectiveTitle.textContent = s.title;
  ui.objectiveText.textContent = s.text;
  ui.actionLabel.textContent = s.action;
  ui.action.disabled = false;
  ui.action.style.display = 'flex';
}

function setBusy(v) {
  busy = v;
  ui.action.disabled = v;
}

function holdForWish(nextStage, dialogue, ms = 2500) {
  setStage(nextStage);
  showDialogue(dialogue, ms + 800);
  setBusy(true);
  setTimeout(() => setBusy(false), ms);
}

function faceDirection(dir) {
  if (dir.lengthSq() < .001) return;
  lastForward.copy(dir).normalize();
  teacherRoot.rotation.y = Math.atan2(lastForward.x, lastForward.z);
}

function startMove(points, speed = 8, onDone, mode = null, cam = null, keepDialogue = false) {
  if (!keepDialogue) hideDialogue();
  const curve = new THREE.CatmullRomCurve3(points.map(p => p.clone()), false, 'catmullrom', .15);
  moveTask = { curve, t: 0, last: points[0].clone(), duration: Math.max(.8, curve.getLength() / speed), done: onDone };
  animMode = mode || (speed > 7 ? 'run' : 'walk');
  setBusy(true);
  controlled = teacherRoot;
  if (cam) cameraMode = cam;
}

function startDrive(points, speed = 20, onDone) {
  hideDialogue();
  const curve = new THREE.CatmullRomCurve3(points.map(p => p.clone()), false, 'catmullrom', .2);
  driveTask = { curve, t: 0, duration: Math.max(1.8, curve.getLength() / speed), done: onDone };
  setBusy(true);
  controlled = carRoot;
  cameraMode = 'follow';
}

function openSchoolGate(onDone) {
  gateTask = { t: 0, duration: 1.15, done: onDone };
  setBusy(true);
}

function openHouseDoor(onDone) {
  houseDoorTask = { t: 0, duration: .9, done: onDone };
  setBusy(true);
}

function updateDoors(dt) {
  if (gateTask && schoolGateLeft && schoolGateRight) {
    gateTask.t = Math.min(1, gateTask.t + dt / gateTask.duration);
    const e = 1 - Math.pow(1 - gateTask.t, 3);
    schoolGateLeft.rotation.y = -e * Math.PI * .52;
    schoolGateRight.rotation.y = e * Math.PI * .52;
    if (gateTask.t >= 1) {
      const done = gateTask.done;
      gateTask = null;
      setBusy(false);
      done?.();
    }
  }
  if (houseDoorTask && houseDoor) {
    houseDoorTask.t = Math.min(1, houseDoorTask.t + dt / houseDoorTask.duration);
    const e = 1 - Math.pow(1 - houseDoorTask.t, 3);
    houseDoor.rotation.y = -e * Math.PI * .52;
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
    const p = moveTask.curve.getPoint(moveTask.t);
    const tan = moveTask.curve.getTangent(Math.min(.999, moveTask.t)).normalize();
    const dist = p.distanceTo(moveTask.last);
    gaitPhase += dist * (animMode === 'run' ? 5.4 : animMode === 'stairs' ? 4.2 : 4.6);
    moveTask.last.copy(p);
    teacherRoot.position.copy(p);
    faceDirection(tan);
    if (moveTask.t >= 1) {
      const done = moveTask.done;
      moveTask = null;
      animMode = 'idle';
      setBusy(false);
      done?.();
    }
  }
  if (driveTask) {
    driveTask.t = Math.min(1, driveTask.t + dt / driveTask.duration);
    const p = driveTask.curve.getPoint(driveTask.t);
    const tan = driveTask.curve.getTangent(Math.min(.999, driveTask.t)).normalize();
    carRoot.position.copy(p);
    lastForward.lerp(tan, .28).normalize();
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
  const moving = animMode === 'walk' || animMode === 'run' || animMode === 'stairs';
  const amp = animMode === 'run' ? .72 : animMode === 'stairs' ? .34 : .48;
  const s = moving ? Math.sin(gaitPhase) * amp : 0;
  const footLift = moving ? Math.max(0, Math.sin(gaitPhase)) * .05 : 0;
  p.legL.rotation.x = s;
  p.legR.rotation.x = -s;
  p.legL.rotation.z = moving ? Math.sin(gaitPhase) * .035 : 0;
  p.legR.rotation.z = moving ? -Math.sin(gaitPhase) * .035 : 0;
  p.armL.rotation.x = -s * .85;
  p.armR.rotation.x = s * .85;
  p.armL.rotation.z = 0;
  p.armR.rotation.z = 0;
  if (animMode === 'wave') {
    p.armR.rotation.z = -1.5;
    p.armR.rotation.x = -.35 + Math.sin(t * 8) * .22;
  } else if (animMode === 'teach') {
    p.armR.rotation.z = -.65;
    p.armR.rotation.x = -.25 + Math.sin(t * 2.6) * .22;
    p.armL.rotation.z = .18;
  } else if (animMode === 'receive') {
    p.armL.rotation.z = .7;
    p.armR.rotation.z = -.7;
    p.armL.rotation.x = -.35;
    p.armR.rotation.x = -.35;
  }
  if (p.body) p.body.rotation.z = moving ? Math.sin(gaitPhase * .5) * .018 : 0;
  if (p.head) p.head.rotation.z = Math.sin(t * 1.5) * .018;
  teacherVisual.position.y = teacherVisualBaseY + (moving ? Math.abs(Math.sin(gaitPhase)) * .035 + footLift * .2 : Math.sin(t * 2) * .02);
}

function activeBlockers() {
  return blockers[currentSpace] || [];
}

function resolveCameraCollision(look, desired) {
  const dir = desired.clone().sub(look), dist = dir.length();
  if (dist < .1) return desired;
  dir.normalize();
  cameraRay.set(look, dir);
  cameraRay.far = dist;
  const hits = cameraRay.intersectObjects(activeBlockers(), false);
  if (hits.length && hits[0].distance < dist) return look.clone().addScaledVector(dir, Math.max(1.3, hits[0].distance - .35));
  return desired;
}

function updateCamera(dt, t) {
  if (finalOrbit || cameraMode === 'finale') {
    const center = new THREE.Vector3(0, 4.9, -2.0);
    const r = 12.5, a = t * .15 + cameraUserYaw;
    const desired = new THREE.Vector3(center.x + Math.sin(a) * r, center.y + 3.5 + cameraPitch * 3, center.z + Math.cos(a) * r);
    camera.position.lerp(desired, 1 - Math.exp(-dt * 2.5));
    camera.lookAt(center);
    return;
  }

  if (cameraMode === 'classroom') {
    if (!userCameraTouched) classroomOrbit += dt * .085;
    const center = new THREE.Vector3(0, 1.45, -116.3), r = 7.7, a = classroomOrbit + cameraUserYaw;
    const desired = new THREE.Vector3(center.x + Math.sin(a) * r, 5.6 + cameraPitch * 2.1, center.z + Math.cos(a) * r);
    camera.position.lerp(resolveCameraCollision(center, desired), 1 - Math.exp(-dt * 3.8));
    camera.lookAt(center);
    return;
  }

  const target = controlled === carRoot ? carRoot : teacherRoot;
  const f = lastForward.clone().normalize();
  let dist = controlled === carRoot ? Math.max(10, cameraZoom + 2) : cameraZoom;
  let height = (controlled === carRoot ? 5.2 : 4.6) + cameraPitch * 3.0;

  if (cameraMode === 'houseFollow') {
    dist = Math.min(cameraZoom, 6.4);
    height = 3.5 + cameraPitch * 2.1;
  }
  if (cameraMode === 'stairs') {
    const side = new THREE.Vector3(-f.z, 0, f.x);
    const look = teacherRoot.position.clone().add(new THREE.Vector3(0, 1.45, 0));
    const desired = teacherRoot.position.clone().addScaledVector(side, 6.2).addScaledVector(f, -2.2).add(new THREE.Vector3(0, 3.3, 0));
    camera.position.lerp(resolveCameraCollision(look, desired), 1 - Math.exp(-dt * 4.0));
    camera.lookAt(look);
    return;
  }

  const back = f.clone().multiplyScalar(-dist).applyAxisAngle(UP, cameraUserYaw);
  const look = target.position.clone().addScaledVector(f, controlled === carRoot ? 2.7 : 1.8).add(new THREE.Vector3(0, controlled === carRoot ? 1.25 : 1.45, 0));
  const desired = target.position.clone().add(back).add(new THREE.Vector3(0, height, 0));
  camera.position.lerp(resolveCameraCollision(look, desired), 1 - Math.exp(-dt * 4.8));
  camera.lookAt(look);
}

function transitionSpace(space, startPos, onReady) {
  setBusy(true);
  hideDialogue();
  clearHearts();
  fade.classList.add('on');
  setTimeout(() => {
    setSpace(space);
    teacherRoot.position.copy(startPos);
    teacherRoot.visible = true;
    carRoot.visible = false;
    controlled = teacherRoot;
    camera.position.copy(startPos).add(new THREE.Vector3(0, 3.4, 7.5));
    setTimeout(() => {
      fade.classList.remove('on');
      setBusy(false);
      onReady?.();
    }, 120);
  }, 430);
}

function enterHouseSequence() {
  teacherRoot.visible = true;
  carRoot.visible = false;
  controlled = teacherRoot;
  teacherRoot.position.copy(vec(ROUTES.driveHome.at(-1)));
  faceDirection(new THREE.Vector3(1, 0, 1));
  cameraMode = 'follow';
  showDialogue(DIALOGUES.home, 3600);
  setTimeout(() => {
    openHouseDoor(() => {
      startMove(route('toDoor'), 4.6, () => {
        transitionSpace('house', vec(ROUTES.houseEntry[0]), () => {
          cameraMode = 'houseFollow';
          faceDirection(new THREE.Vector3(0, 0, -1));
          startMove(route('houseEntry'), 4.0, () => {
            holdForWish(6, DIALOGUES.father, 2800);
          }, 'walk', 'houseFollow');
        });
      }, 'walk', 'follow');
    });
  }, 650);
}

function beginFinale() {
  setStage(9);
  ui.action.style.display = 'none';
  hideDialogue();
  document.body.classList.add('finale-ui');
  cameraMode = 'finale';
  finalOrbit = true;
  animMode = 'receive';
  faceDirection(new THREE.Vector3(0, 0, -1));
  blooms.forEach((b, i) => {
    setTimeout(() => {
      b.userData.birth = performance.now();
      b.userData.growing = true;
    }, i * 115);
  });
  const total = TREE_WISHES.length * 115 + 1300;
  setTimeout(() => ui.finalPanel.classList.remove('hidden'), total);
}

function action() {
  if (busy) return;
  if (stage === 0) {
    animMode = 'jump';
    startMove(route('jump'), 6, () => { setStage(1); showDialogue(DIALOGUES.garden); }, 'jump', 'follow');
  } else if (stage === 1) {
    startMove(route('garden'), 7, () => setStage(2), 'walk', 'follow');
  } else if (stage === 2) {
    startMove(route('toSchool'), 8, () => { setStage(3); showDialogue(DIALOGUES.school); }, 'run', 'follow');
  } else if (stage === 3) {
    openSchoolGate(() => startMove(route('enterClass'), 6.6, () => {
      setStage(4);
      animMode = 'teach';
      faceDirection(new THREE.Vector3(0, 0, 1));
      cameraMode = 'classroom';
      cameraUserYaw = 0;
      classroomOrbit = Math.PI;
      userCameraTouched = false;
      showDialogue(DIALOGUES.classroom);
    }, 'walk', 'follow'));
  } else if (stage === 4) {
    animMode = 'teach';
    cameraMode = 'classroom';
    ui.classPanel.classList.remove('hidden');
    ui.action.style.display = 'none';
    showDialogue(DIALOGUES.classroom);
  } else if (stage === 6) {
    startMove(route('stairs1'), 4.1, () => holdForWish(7, DIALOGUES.olderBrother, 2800), 'stairs', 'stairs');
  } else if (stage === 7) {
    startMove(route('toYounger'), 4.0, () => holdForWish(8, DIALOGUES.youngerBrother, 2800), 'walk', 'houseFollow');
  } else if (stage === 8) {
    startMove(route('stairs2'), 4.0, () => {
      transitionSpace('finale', vec(ROUTES.finaleEntry[0]), () => {
        cameraMode = 'finale';
        startMove(route('finaleEntry'), 3.8, () => beginFinale(), 'walk', 'finale');
      });
    }, 'stairs', 'stairs');
    setTimeout(() => showDialogue(DIALOGUES.upstairs, 3200), 100);
  }
}

ui.action.addEventListener('click', action);
ui.dismissClass.addEventListener('click', () => {
  hideDialogue();
  ui.classPanel.classList.add('hidden');
  setStage(5);
  ui.action.style.display = 'none';
  cameraMode = 'follow';
  cameraUserYaw = 0;
  userCameraTouched = false;
  startMove(route('exitClass'), 6.2, () => {
    teacherRoot.visible = false;
    carRoot.visible = true;
    carRoot.position.copy(teacherRoot.position);
    controlled = carRoot;
    startDrive(route('driveHome'), 18.5, () => {
      enterHouseSequence();
    });
  }, 'walk', 'follow');
});
ui.replay.addEventListener('click', () => location.href = `${location.pathname}?v=10`);

let dragging = false, lastPX = 0, lastPY = 0;
canvas.addEventListener('pointerdown', e => {
  dragging = true;
  lastPX = e.clientX;
  lastPY = e.clientY;
  canvas.setPointerCapture?.(e.pointerId);
  userCameraTouched = true;
});
canvas.addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx = e.clientX - lastPX, dy = e.clientY - lastPY;
  lastPX = e.clientX;
  lastPY = e.clientY;
  cameraUserYaw -= dx * .006;
  cameraPitch = THREE.MathUtils.clamp(cameraPitch - dy * .003, -.28, .72);
});
canvas.addEventListener('pointerup', () => dragging = false);
canvas.addEventListener('pointercancel', () => dragging = false);
canvas.addEventListener('wheel', e => {
  cameraZoom = THREE.MathUtils.clamp(cameraZoom + Math.sign(e.deltaY) * .7, 5.3, 13.5);
  e.preventDefault();
}, { passive: false });

function revealAllBlooms() {
  blooms.forEach(b => {
    b.scale.setScalar(1);
    b.userData.growing = false;
    if (b.userData.label) b.userData.label.visible = false;
  });
}

function applyQAStage(n) {
  moveTask = null;
  driveTask = null;
  setBusy(false);
  teacherRoot.visible = true;
  carRoot.visible = false;
  document.body.classList.remove('finale-ui');
  ui.finalPanel.classList.add('hidden');
  if (n <= 4) {
    setSpace('outdoor');
    const map = { 0:[0,4.75,10], 4:[0,.18,-121.2] };
    teacherRoot.position.copy(vec(map[n] || map[0]));
    setStage(n);
    if (n === 4) {
      faceDirection(new THREE.Vector3(0,0,1));
      cameraMode = 'classroom';
      classroomOrbit = Math.PI;
    } else {
      faceDirection(new THREE.Vector3(0,0,-1));
      cameraMode = 'follow';
    }
  } else if (n >= 6 && n <= 8) {
    setSpace('house');
    const map = { 6:[-3,.18,1], 7:[-3,4.58,-1], 8:[1.2,4.58,3] };
    teacherRoot.position.copy(vec(map[n]));
    setStage(n);
    faceDirection(new THREE.Vector3(0,0,-1));
    cameraMode = 'houseFollow';
  } else if (n === 9) {
    setSpace('finale');
    teacherRoot.position.set(0,.18,1.5);
    setStage(9);
    revealAllBlooms();
    finalOrbit = true;
    cameraMode = 'finale';
    ui.action.style.display = 'none';
  }
}

function updateBlooms() {
  const now = performance.now();
  for (const b of blooms) {
    if (b.userData.growing) {
      const age = now - b.userData.birth;
      const k = Math.min(1, age / 620), e = 1 - Math.pow(1 - k, 3);
      b.scale.setScalar(e);
      if (b.userData.label) b.userData.label.visible = age > 300 && age < 2300;
      if (k >= 1) b.userData.growing = false;
    } else if (b.userData.birth !== Infinity && b.userData.label && now - b.userData.birth > 2300) {
      b.userData.label.visible = false;
    }
  }
}

buildWorlds();
loadAssets();
setSpace('outdoor');
teacherRoot.position.copy(vec(ROUTES.intro[0]));
camera.position.set(0, 9.5, 25);
faceDirection(new THREE.Vector3(0, 0, -1));
animMode = 'wave';

const qaStage = new URLSearchParams(location.search).get('qaStage');
if (qaStage !== null) {
  setTimeout(() => applyQAStage(Number(qaStage)), 900);
} else {
  setTimeout(() => startMove(route('intro'), 3.2, () => {
    setStage(0);
    animMode = 'wave';
    showDialogue(DIALOGUES.intro);
  }, 'walk', 'follow'), 350);
}

setTimeout(() => {
  ui.loading.classList.add('done');
  window.__APP_READY__ = true;
}, 720);

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(.04, clock.getDelta()), t = clock.elapsedTime;
  updateDoors(dt);
  updateMovement(dt);
  animateTeacher(t);
  updateHearts(dt);
  updateBlooms();
  if (portal) {
    portal.rotation.z += dt * .28;
    portal.scale.setScalar(1 + Math.sin(t * 2) * .025);
  }
  updateCamera(dt, t);
  renderer.render(scene, camera);
}
loop();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1 : 1.35));
  renderer.setSize(innerWidth, innerHeight);
});
