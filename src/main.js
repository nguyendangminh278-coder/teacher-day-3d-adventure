import * as THREE from 'three';
import { CLASS_WISHES, TREE_WISHES, STAGES } from './config.js';

const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#b9dcff');
scene.fog = new THREE.Fog('#bfdfff', 18, 78);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 400);
camera.position.set(0, 4.8, 10);

const root = new THREE.Group();
scene.add(root);

const hemi = new THREE.HemisphereLight(0xffffff, 0x9b7b70, 2.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d2, 3.1);
sun.position.set(-12, 22, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(1536,1536);
sun.shadow.camera.left = -25; sun.shadow.camera.right = 25; sun.shadow.camera.top = 25; sun.shadow.camera.bottom = -25;
scene.add(sun);

const clock = new THREE.Clock();
let stage = 0;
let busy = false;
let mascot;
let car;
let activeMotion = null;
let treeBloomers = [];
let portal;
let floatingObjects = [];
let cameraLook = new THREE.Vector3(0,1.6,0);
let mouseYaw = 0;

const ui = {
  action: document.querySelector('#actionBtn'),
  actionLabel: document.querySelector('#actionLabel'),
  stageNumber: document.querySelector('#stageNumber'),
  objectiveTitle: document.querySelector('#objectiveTitle'),
  objectiveText: document.querySelector('#objectiveText'),
  dialogue: document.querySelector('#dialogue'),
  dialogueName: document.querySelector('#dialogueName'),
  dialogueText: document.querySelector('#dialogueText'),
  classPanel: document.querySelector('#classroomPanel'),
  classWishes: document.querySelector('#classWishes'),
  dismissClass: document.querySelector('#dismissClass'),
  finalPanel: document.querySelector('#finalPanel'),
  replay: document.querySelector('#replayBtn'),
  fade: document.querySelector('#fade'),
  loading: document.querySelector('#loading')
};

CLASS_WISHES.forEach(w => {
  const el = document.createElement('div');
  el.className = 'wish-card';
  el.textContent = w;
  ui.classWishes.append(el);
});

function mat(color, rough=.72, metal=.02) { return new THREE.MeshStandardMaterial({ color, roughness:rough, metalness:metal }); }
function mesh(geo, material, cast=true, receive=true) {
  const m = new THREE.Mesh(geo, material); m.castShadow=cast; m.receiveShadow=receive; return m;
}
function addBox(group, size, pos, color, round=false) {
  const g = new THREE.BoxGeometry(size[0],size[1],size[2], round ? 3 : 1, round ? 3 : 1, round ? 3 : 1);
  const m = mesh(g,mat(color)); m.position.set(...pos); group.add(m); return m;
}
function addSphere(group, r, pos, color, scale=[1,1,1]) {
  const m=mesh(new THREE.SphereGeometry(r,24,16),mat(color)); m.position.set(...pos); m.scale.set(...scale); group.add(m); return m;
}
function addCylinder(group, rt, rb, h, pos, color, seg=18) {
  const m=mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat(color)); m.position.set(...pos); group.add(m); return m;
}
function cloud(group,x,y,z,s=1){
  const c=new THREE.Group();
  [[0,0,0,1.2],[1.1,.15,.1,.95],[-1,.1,.15,.9],[.35,.55,0,.85],[-.35,.45,.05,.75]].forEach(([px,py,pz,sc])=>addSphere(c,.9,[px,py,pz],'#fffaf7',[1.25*sc,.75*sc,sc]));
  c.position.set(x,y,z); c.scale.setScalar(s); group.add(c); return c;
}
function flower(group,x,y,z,scale=1,color='#ff8eb2'){
  const f=new THREE.Group();
  addCylinder(f,.05,.06,.65,[0,.3,0],'#5f9b56',7);
  for(let i=0;i<5;i++){ const a=i*Math.PI*2/5; const p=addSphere(f,.16,[Math.cos(a)*.18,.72,Math.sin(a)*.18],color,[1.15,.72,.8]); p.rotation.z=-a; }
  addSphere(f,.11,[0,.72,0],'#ffd66d'); f.position.set(x,y,z); f.scale.setScalar(scale); group.add(f); return f;
}
function textPlane(text, width=6, height=1.5, fontSize=54, bg='rgba(255,255,255,.92)', fg='#7a4b55'){
  const c=document.createElement('canvas'); c.width=1024; c.height=256; const ctx=c.getContext('2d');
  ctx.fillStyle=bg; roundRect(ctx,18,18,988,220,46); ctx.fill();
  ctx.fillStyle=fg; ctx.font=`800 ${fontSize}px system-ui`; ctx.textAlign='center'; ctx.textBaseline='middle';
  const lines=String(text).split('\n'); lines.forEach((ln,i)=>ctx.fillText(ln,512,128+(i-(lines.length-1)/2)*(fontSize+8)));
  const tx=new THREE.CanvasTexture(c); tx.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false})); return m;
}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}

function makeMascot(){
  const g=new THREE.Group(); g.name='mascot';
  addSphere(g,1.08,[0,1.35,0],'#fff6ed',[1,1.02,.9]);
  addSphere(g,.83,[0,2.45,.02],'#fff8f0',[1.05,.95,.92]);
  addSphere(g,.09,[-.28,2.55,.72],'#2d2424'); addSphere(g,.09,[.28,2.55,.72],'#2d2424');
  addSphere(g,.13,[-.49,2.35,.72],'#ff9eab',[1.25,.65,.4]); addSphere(g,.13,[.49,2.35,.72],'#ff9eab',[1.25,.65,.4]);
  const smile=mesh(new THREE.TorusGeometry(.16,.035,8,20,Math.PI),mat('#5b343a')); smile.position.set(0,2.34,.76); smile.rotation.z=Math.PI; g.add(smile);
  addCylinder(g,.04,.05,.35,[0,3.15,0],'#5f9c55',8).rotation.z=.1;
  const l=addSphere(g,.24,[-.18,3.36,0],'#72b764',[1.25,.55,.7]); l.rotation.z=.45;
  const r=addSphere(g,.24,[.2,3.36,0],'#72b764',[1.25,.55,.7]); r.rotation.z=-.45;
  addSphere(g,.28,[-1.02,1.56,.02],'#fff6ed',[.7,1.2,.7]); addSphere(g,.28,[1.02,1.56,.02],'#fff6ed',[.7,1.2,.7]);
  addSphere(g,.32,[-.48,.43,.04],'#fff1e6',[1.25,.55,1]); addSphere(g,.32,[.48,.43,.04],'#fff1e6',[1.25,.55,1]);
  addBox(g,[1.0,1.0,.45],[0,1.55,-.82],'#825a3e');
  addBox(g,[.86,.16,.13],[0,1.53,-1.07],'#d5a46f');
  g.scale.setScalar(.78); return g;
}

function clearRoot(){ while(root.children.length) root.remove(root.children[0]); floatingObjects=[]; treeBloomers=[]; portal=null; car=null; }
function addMascot(pos=[0,0,0],rotY=0){ mascot=makeMascot(); mascot.position.set(...pos); mascot.rotation.y=rotY; root.add(mascot); return mascot; }
function groundPlane(group,w,d,z=0,color='#dff1d1'){ const p=mesh(new THREE.BoxGeometry(w,.4,d),mat(color),false,true); p.position.set(0,-.2,z); group.add(p); return p; }

function buildIntro(){
  scene.background.set('#b7d9ff'); scene.fog.color.set('#bedfff'); scene.fog.near=20; scene.fog.far=75;
  for(let i=0;i<13;i++) cloud(root,(Math.random()-.5)*34,Math.random()*10-1,-Math.random()*42+10,Math.random()*1.8+.8);
  const portalG=new THREE.Group();
  const tor=mesh(new THREE.TorusGeometry(3.2,.28,18,80),new THREE.MeshStandardMaterial({color:'#8b6cff',emissive:'#8b6cff',emissiveIntensity:3,roughness:.25})); portalG.add(tor);
  const inner=mesh(new THREE.CircleGeometry(2.95,64),new THREE.MeshBasicMaterial({color:'#120d2a'}),false,false); inner.position.z=-.04; portalG.add(inner);
  for(let i=0;i<3;i++){ const t=mesh(new THREE.TorusGeometry(3.45+i*.34,.045,8,80),new THREE.MeshBasicMaterial({color:i%2?'#ffd5a6':'#c5a6ff',transparent:true,opacity:.8})); t.rotation.z=i*.4; portalG.add(t); }
  portalG.position.set(0,6,-4); root.add(portalG); portal=portalG;
  cloud(root,0,0,-3,2.25);
  addMascot([0,5.7,-3.2],0);
  mascot.scale.setScalar(.15);
  const title=textPlane('Chúc mừng mẹ ngày Nhà giáo Việt Nam 20/11',10,1.6,40,'rgba(255,248,248,.90)','#d95682'); title.position.set(0,7.3,-8); root.add(title);
  camera.position.set(0,5,13); cameraLook.set(0,2,-3);
  setTimeout(()=>{ tween(1.8,t=>{ const e=easeOutBack(t); mascot.position.y=5.7-(5.7-1.05)*e; mascot.scale.setScalar(.15+(.78-.15)*e; }); },350);
  showDialogue('Mầm Nhỏ','Xin chào! Mình sẽ dẫn bạn đi qua một hành trình đặc biệt dành tặng mẹ.');
}

function buildGarden(){
  scene.background.set('#b9ddff'); scene.fog.color.set('#bfe2ff'); scene.fog.near=18; scene.fog.far=74;
  for(let i=0;i<18;i++) cloud(root,(Math.random()-.5)*42,Math.random()*8-3,-Math.random()*65+18,Math.random()*1.4+.6);
  const island=new THREE.Group(); root.add(island);
  addCylinder(island,8,3.2,2,[0,-1,-5],'#d5c3a4',28); groundPlane(island,16,26,-13,'#d9efc4');
  for(let z=-3;z>-27;z-=2.4){ flower(island,-3.4+Math.sin(z)*.6,.2,z,.9,['#ff8eb2','#ffd77d','#b98cff'][Math.abs(Math.round(z))%3]); flower(island,3.4+Math.cos(z)*.6,.2,z,.9,['#ff8eb2','#ffd77d','#b98cff'][Math.abs(Math.round(z+1))%3]); }
  addMascot([0,10,2],0);
  camera.position.set(0,8,12); cameraLook.set(0,3,-4);
  setTimeout(()=>tween(1.7,t=>{const e=easeInOut(t); mascot.position.y=10-9*e; mascot.position.z=2-7*e; mascot.rotation.x=Math.sin(t*Math.PI)*.5;},()=>{mascot.rotation.x=0;}),120);
  showDialogue('Mầm Nhỏ','Woa! Khu vườn trên mây đây rồi. Con đường hoa sẽ dẫn chúng ta tới trường của mẹ.');
}

function buildRoad(){
  scene.background.set('#c8e8ff'); scene.fog.color.set('#d7ebff'); scene.fog.near=22; scene.fog.far=95;
  groundPlane(root,14,90,-38,'#d9efc9');
  const road=mesh(new THREE.BoxGeometry(5,.22,88),mat('#f4d9c3'),false,true); road.position.set(0,.02,-38); root.add(road);
  for(let z=4;z>-82;z-=2){ flower(root,-3.5,.25,z,.75,(Math.floor(Math.abs(z))%4===0?'#f8cf70':'#ff8aae')); flower(root,3.5,.25,z,.75,(Math.floor(Math.abs(z))%5===0?'#a993ff':'#ff8aae')); }
  for(let z=-5;z>-82;z-=12){ const post=addCylinder(root,.09,.11,2.7,[-5.3,1.35,z],'#6a5043',10); const lamp=addSphere(root,.25,[-5.3,2.82,z],'#fff3b7'); lamp.material.emissive=new THREE.Color('#ffd975'); lamp.material.emissiveIntensity=1.5; const post2=post.clone(); post2.position.x=5.3; root.add(post2); const lamp2=lamp.clone(); lamp2.position.x=5.3; root.add(lamp2); }
  addBox(root,[24,7,5],[0,3.5,-88],'#f3d2a5'); addBox(root,[9,4,2],[0,6.7,-84.7],'#f2c48c');
  addBox(root,[6,5,.6],[-7,2.5,-84.8],'#d9ecff'); addBox(root,[6,5,.6],[7,2.5,-84.8],'#d9ecff');
  addBox(root,[1.2,6,1.2],[-5.4,3,-78.7],'#efd7af'); addBox(root,[1.2,6,1.2],[5.4,3,-78.7],'#efd7af');
  addBox(root,[12,1.1,1],[0,6,-78.7],'#f0d7ae');
  const sign=textPlane('TRƯỜNG TIỂU HỌC HOA MÂY',9.5,1.1,48,'rgba(255,252,239,.96)','#376b93'); sign.position.set(0,6.1,-78.05); root.add(sign);
  addMascot([0,0.2,5],Math.PI);
  camera.position.set(0,4.3,11); cameraLook.set(0,1.7,0);
}

function buildGateAndHall(){
  scene.background.set('#e4eff9'); scene.fog.color.set('#f4eee7'); scene.fog.near=16; scene.fog.far=58;
  groundPlane(root,18,34,-10,'#e8dccd');
  for(let i=0;i<8;i++){ addBox(root,[.6,4,.6],[-7.4,2,-i*4],'#efe0cc'); addBox(root,[.6,4,.6],[7.4,2,-i*4],'#efe0cc'); }
  addBox(root,[16,.5,34],[0,4.25,-10],'#f5e8d8');
  addBox(root,[.4,3.2,30],[-7.8,1.6,-10],'#fff8ed'); addBox(root,[.4,3.2,30],[7.8,1.6,-10],'#fff8ed');
  for(let z=0;z>-28;z-=6){ addSphere(root,.22,[-6.5,3.6,z],'#fff1a3').material.emissive=new THREE.Color('#ffd76a'); addSphere(root,.22,[6.5,3.6,z],'#fff1a3').material.emissive=new THREE.Color('#ffd76a'); }
  addBox(root,[8,5,.4],[0,2.5,-28],'#8db4b8');
  const sign=textPlane('LỚP HỌC YÊU THƯƠNG',6.5,1,42,'rgba(255,255,255,.96)','#5a7773'); sign.position.set(0,5.5,-27.7); root.add(sign);
  addMascot([0,.2,5],Math.PI);
  camera.position.set(0,4.2,11); cameraLook.set(0,1.7,0);
}

function stylizedPerson(group,x,z,shirt='#fff',hair='#3e2c27',scale=.72){
  const p=new THREE.Group(); addCylinder(p,.38,.48,1.15,[0,.95,0],shirt,14); addSphere(p,.42,[0,1.8,0],'#f3c7a8'); addSphere(p,.44,[0,2.04,-.07],hair,[1,.5,1]); addCylinder(p,.12,.13,.8,[-.2,.25,0],'#e0b18e',10); addCylinder(p,.12,.13,.8,[.2,.25,0],'#e0b18e',10); p.position.set(x,0,z); p.scale.setScalar(scale); group.add(p); return p;
}
function buildClassroom(){
  scene.background.set('#f4dfc8'); scene.fog.color.set('#f4dfc8'); scene.fog.near=28; scene.fog.far=65;
  groundPlane(root,22,28,-5,'#d8b98e');
  addBox(root,[22,9,.6],[0,4.5,-18],'#e4c3a1'); addBox(root,[.5,9,28],[-11,4.5,-5],'#f1dac0'); addBox(root,[.5,9,28],[11,4.5,-5],'#f1dac0');
  addBox(root,[12,4,.35],[0,4.5,-17.55],'#3d6d5a');
  const boardText=textPlane('Cảm ơn cô\nvì đã luôn ở đây!',8,2.4,46,'rgba(0,0,0,0)','#fff5df'); boardText.position.set(0,4.4,-17.3); root.add(boardText);
  const teacher=new THREE.Group(); stylizedPerson(teacher,0,0,'#f29db4','#352826',1.2); teacher.position.set(0,0,-14.4); root.add(teacher);
  for(let r=0;r<4;r++) for(let c=0;c<5;c++){ const x=(c-2)*3.3, z=-2-r*3.1; addBox(root,[2.5,.18,1.3],[x,1.05,z],'#b98258'); stylizedPerson(root,x,z-.1,c%2?'#f8f8f4':'#e8f3ff','#382820',.66); }
  addMascot([0,.2,3],Math.PI); camera.position.set(0,5,12); cameraLook.set(0,2,-8);
  showDialogue('Mầm Nhỏ','Có rất nhiều lời chúc đang chờ mẹ. Hãy mở chúng nhé!');
}

function makeCar(){
  const g=new THREE.Group();
  addBox(g,[3.4,.9,5],[0,.9,0],'#ed8b91');
  addBox(g,[2.7,1.4,2.4],[0,1.75,-.25],'#f0a0a2');
  addBox(g,[2.25,.85,.08],[0,1.85,1.0],'#9cc8d7');
  [[-1.45,.55,1.6],[1.45,.55,1.6],[-1.45,.55,-1.55],[1.45,.55,-1.55]].forEach(p=>addCylinder(g,.44,.44,.35,p,'#3b3436',18).rotation.z=Math.PI/2);
  g.scale.setScalar(.8); return g;
}
function buildDrive(){
  scene.background.set('#f4b47f'); scene.fog.color.set('#f5c19a'); scene.fog.near=28; scene.fog.far=105;
  groundPlane(root,22,120,-50,'#98b97f');
  const road=mesh(new THREE.BoxGeometry(8,.22,118),mat('#756e6d'),false,true); road.position.set(0,.03,-50); root.add(road);
  for(let z=5;z>-110;z-=7){ flower(root,-5,.3,z,.8,z%14===0?'#ffcf70':'#ff89aa'); flower(root,5,.3,z,.8,'#ff9fbd'); }
  for(let i=0;i<12;i++) cloud(root,(Math.random()-.5)*34,7+Math.random()*8,-Math.random()*100,Math.random()+.7);
  car=makeCar(); car.position.set(0,0,6); root.add(car); mascot=makeMascot(); mascot.scale.setScalar(.42); mascot.position.set(0,1.95,.35); mascot.rotation.y=Math.PI; car.add(mascot);
  camera.position.set(0,5.5,15); cameraLook.set(0,2.0,0);
}

function buildHome(){
  scene.background.set('#82658b'); scene.fog.color.set('#9a7a92'); scene.fog.near=28; scene.fog.far=80;
  groundPlane(root,28,28,-4,'#668054');
  for(let floor=0;floor<3;floor++){
    const y=floor*4.5; addBox(root,[18,.35,12],[0,y,-7],'#cda77d'); addBox(root,[.4,4.5,12],[-9,y+2.25,-7],'#f5e5d1'); addBox(root,[.4,4.5,12],[9,y+2.25,-7],'#f5e5d1'); addBox(root,[18,4.5,.35],[0,y+2.25,-13],'#f0ddc8');
  }
  addBox(root,[18,.45,12],[0,13.5,-7],'#cda77d');
  for(let floor=0;floor<3;floor++) for(let x=-6;x<=6;x+=6){ const lamp=addSphere(root,.18,[x,floor*4.5+3.8,-9],'#ffe7a3'); lamp.material.emissive=new THREE.Color('#ffcf71'); lamp.material.emissiveIntensity=2.4; }
  stylizedPerson(root,0,-7,'#90a4b7','#2f2b2a',1.0).position.y=.25;
  stylizedPerson(root,-2.2,-7,'#6aa6df','#342c29',.82).position.y=4.7;
  stylizedPerson(root,2.2,-7,'#78b9e3','#342c29',.82).position.y=4.7;
  const l1=textPlane('Tầng 1 · Bố luôn chờ về',6.6,.8,38,'rgba(77,49,47,.75)','#fff'); l1.position.set(-5.2,2.2,0); root.add(l1);
  const l2=textPlane('Tầng 2 · Hai cậu con trai',6.6,.8,38,'rgba(77,49,47,.75)','#fff'); l2.position.set(-5.2,6.7,0); root.add(l2);
  const l3=textPlane('Tầng 3 · Cây điều ước',6.6,.8,38,'rgba(77,49,47,.75)','#fff'); l3.position.set(-5.2,11.2,0); root.add(l3);
  addMascot([0,.2,6],Math.PI); camera.position.set(0,5.2,15); cameraLook.set(0,4,-7);
}

function branch(group,a,b,r1=.28,r2=.08){
  const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b); const dir=end.clone().sub(start); const len=dir.length(); const m=mesh(new THREE.CylinderGeometry(r2,r1,len,10),mat('#7d5138')); m.position.copy(start.clone().add(end).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize()); group.add(m); return m;
}
function buildTree(){
  scene.background.set('#cf9db1'); scene.fog.color.set('#e3b7c4'); scene.fog.near=34; scene.fog.far=110;
  groundPlane(root,34,34,-4,'#6f8d5f');
  const tree=new THREE.Group(); root.add(tree);
  branch(tree,[0,0,-8],[0,10,-8],1.25,.7);
  branch(tree,[0,7,-8],[-5,14,-8],.55,.18); branch(tree,[0,8,-8],[5,14,-8],.55,.18); branch(tree,[0,9,-8],[-2,17,-8],.45,.12); branch(tree,[0,9,-8],[2.5,17,-8],.45,.12);
  branch(tree,[-2.5,11,-8],[-8,15,-8],.3,.08); branch(tree,[2.5,11,-8],[8,15,-8],.3,.08);
  const clusters=[[-6,14],[-3,16],[0,14],[3,16],[6,14],[-1,18],[1,18],[-8,15],[8,15]];
  clusters.forEach(([x,y],i)=>{
    const leaf=addSphere(tree,2.35,[x,y,-8],'#b86f84',[1.2,.85,1]); leaf.material.roughness=.9;
    for(let j=0;j<7;j++){ const f=flower(tree,x+(Math.random()-.5)*3.2,y+(Math.random()-.5)*2.5,-6.2+(Math.random()-.5)*2,.55,['#ffabc4','#ffd3df','#fff0c7'][j%3]); f.scale.setScalar(.02); treeBloomers.push({obj:f,delay:(i*7+j)*.035}); }
  });
  TREE_WISHES.slice(0,12).forEach((w,i)=>{ const a=i/12*Math.PI*2; const sign=textPlane(w,3.6,.75,32,'rgba(255,244,248,.94)','#b85679'); sign.position.set(Math.cos(a)*(6.5+(i%3)),12+(i%4)*1.5,-7+Math.sin(a)*3); sign.lookAt(camera.position); sign.scale.setScalar(.001); root.add(sign); treeBloomers.push({obj:sign,delay:.6+i*.06,sign:true}); });
  addMascot([0,.2,5],Math.PI); camera.position.set(0,8.5,20); cameraLook.set(0,10,-8);
}

function setUI(){ const s=STAGES[stage]; ui.stageNumber.textContent=stage+1; ui.objectiveTitle.textContent=s.title; ui.objectiveText.textContent=s.text; ui.actionLabel.textContent=s.action; ui.action.disabled=busy; }
function showDialogue(name,text){ ui.dialogueName.textContent=name; ui.dialogueText.textContent=text; ui.dialogue.classList.remove('hidden'); setTimeout(()=>ui.dialogue.classList.add('hidden'),4200); }
function hidePanels(){ ui.classPanel.classList.add('hidden'); ui.finalPanel.classList.add('hidden'); }
function fadeTransition(build, after){ busy=true; ui.action.disabled=true; ui.fade.classList.add('on'); setTimeout(()=>{ clearRoot(); build(); ui.fade.classList.remove('on'); setTimeout(()=>{busy=false; setUI(); after?.();},480); },470); }
function tween(duration, update, done){ const start=performance.now(); const fn=(now)=>{ const t=Math.min(1,(now-start)/(duration*1000)); update(t); if(t<1)requestAnimationFrame(fn); else done?.();}; requestAnimationFrame(fn); }
function easeInOut(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
function easeOutBack(x){const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);}
function moveObject(obj, points, speed, done){ activeMotion={obj,points:points.map(p=>new THREE.Vector3(...p)),speed,index:0,done}; busy=true; ui.action.disabled=true; }

function completeMotion(){ const d=activeMotion.done; activeMotion=null; busy=false; d?.(); setUI(); }
function updateMotion(dt){ if(!activeMotion) return; const {obj,points,speed}=activeMotion; const target=points[activeMotion.index]; const delta=target.clone().sub(obj.position); const dist=delta.length(); if(dist<.18){ activeMotion.index++; if(activeMotion.index>=points.length){ completeMotion(); return; } } else { const dir=delta.normalize(); obj.position.addScaledVector(dir,Math.min(dist,speed*dt)); obj.rotation.y=Math.atan2(dir.x,dir.z); const bob=Math.sin(performance.now()*.014)*.05; obj.position.y=Math.max(obj.position.y,bob+.2); } }

function advance(){
  if(busy) return;
  if(stage===0){ stage=1; fadeTransition(buildGarden); }
  else if(stage===1){ stage=2; fadeTransition(buildRoad,()=>{ showDialogue('Mầm Nhỏ','Đi thôi! Chỉ cần chạm, mình sẽ chạy theo con đường hoa đến trường.'); }); }
  else if(stage===2){ moveObject(mascot,[[0,.2,-18],[0,.2,-42],[0,.2,-67],[0,.2,-77]],6.2,()=>{stage=3; setUI(); showDialogue('Mầm Nhỏ','Đến cổng trường rồi. Bước vào nơi mẹ đã gieo bao hạt mầm tri thức nhé!');}); }
  else if(stage===3){ stage=3; fadeTransition(buildGateAndHall,()=>{ moveObject(mascot,[[0,.2,-7],[0,.2,-18],[0,.2,-26]],4.8,()=>{ stage=4; setUI(); }); }); }
  else if(stage===4){ stage=4; fadeTransition(buildClassroom,()=>{ setTimeout(()=>ui.classPanel.classList.remove('hidden'),700); ui.action.style.display='none'; }); }
  else if(stage===5){ stage=5; fadeTransition(buildDrive,()=>{ setTimeout(()=>moveObject(car,[[0,0,-20],[0,0,-48],[0,0,-76],[0,0,-104]],12,()=>{stage=6; setUI(); showDialogue('Mầm Nhỏ','Về đến nhà rồi! Bố và hai anh đang chờ chúng ta bên trong.');}),500); }); }
  else if(stage===6){ stage=6; fadeTransition(buildHome,()=>{ tween(4.6,t=>{ const e=easeInOut(t); mascot.position.y=.2+9.1*e; cameraLook.set(0,3+8*e,-7); camera.position.y=5.2+7*e; },()=>{stage=7; setUI(); showDialogue('Mầm Nhỏ','Trên tầng cao nhất là điều bất ngờ cuối cùng. Hãy làm cây điều ước nở hoa!');}); }); }
  else if(stage===7){ stage=7; fadeTransition(buildTree,()=>{ busy=true; ui.action.disabled=true; tween(3.2,t=>{ treeBloomers.forEach(b=>{ const lt=Math.max(0,Math.min(1,(t-b.delay)/(1-b.delay))); const s=b.sign?Math.min(1,lt*1.35):easeOutBack(lt); b.obj.scale.setScalar(Math.max(.001,s*(b.sign?1:.55))); if(b.sign)b.obj.lookAt(camera.position); }); },()=>{ busy=false; ui.action.style.display='none'; ui.finalPanel.classList.remove('hidden'); }); }); }
}

ui.action.addEventListener('click',advance);
canvas.addEventListener('pointerdown',()=>{
  const classroomOpen=!ui.classPanel.classList.contains('hidden');
  const finalOpen=!ui.finalPanel.classList.contains('hidden');
  if(!busy && !classroomOpen && !finalOpen && ui.action.style.display!=='none') advance();
});
ui.dismissClass.addEventListener('click',()=>{ ui.classPanel.classList.add('hidden'); ui.action.style.display='flex'; stage=5; setUI(); showDialogue('Mầm Nhỏ','Tan lớp rồi. Cùng mình đưa mẹ về nhà nhé!'); });
ui.replay.addEventListener('click',()=>{ hidePanels(); ui.action.style.display='flex'; stage=0; fadeTransition(buildIntro); });

window.addEventListener('pointermove',e=>{ mouseYaw=((e.clientX/innerWidth)-.5)*.45; });
window.addEventListener('keydown',e=>{ if((e.key==='Enter'||e.key===' ')&&!busy) advance(); });
window.addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.8)); });

function updateCamera(dt){
  if(!mascot && !car) return;
  if(stage===2 || stage===3){ const p=mascot.position; const desired=new THREE.Vector3(p.x+Math.sin(mouseYaw)*5,p.y+4.2,p.z+9.2); camera.position.lerp(desired,1-Math.pow(.001,dt)); cameraLook.lerp(new THREE.Vector3(p.x,p.y+1.5,p.z-4),1-Math.pow(.003,dt)); }
  else if(stage===5 && car){ const p=car.position; const desired=new THREE.Vector3(p.x+Math.sin(mouseYaw)*6,5.4,p.z+13); camera.position.lerp(desired,1-Math.pow(.0015,dt)); cameraLook.lerp(new THREE.Vector3(p.x,1.8,p.z-6),1-Math.pow(.003,dt)); }
  else if(stage===1){ cameraLook.lerp(new THREE.Vector3(0,2,-7),.02); }
  else if(stage===7){ cameraLook.lerp(new THREE.Vector3(0,10,-8),.015); }
  camera.lookAt(cameraLook);
}

function animate(){
  requestAnimationFrame(animate); const dt=Math.min(clock.getDelta(),.04); const t=performance.now()*.001;
  updateMotion(dt); updateCamera(dt);
  if(mascot && !activeMotion){ mascot.rotation.z=Math.sin(t*2.4)*.018; }
  if(portal) portal.rotation.z+=dt*.28;
  floatingObjects.forEach((o,i)=>o.position.y+=Math.sin(t*1.2+i)*.0008);
  renderer.render(scene,camera);
}

buildIntro(); setUI(); animate();
setTimeout(()=>ui.loading.classList.add('done'),950);
