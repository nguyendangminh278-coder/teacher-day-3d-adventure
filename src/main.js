import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CLASS_WISHES, TREE_WISHES, STAGES, DIALOGUES, TEACHER_MOM_CHARACTER } from './config.js';

const canvas = document.getElementById('game');
const ui = {
  action: document.getElementById('actionBtn'), actionLabel: document.getElementById('actionLabel'),
  stageNumber: document.getElementById('stageNumber'), objectiveTitle: document.getElementById('objectiveTitle'),
  objectiveText: document.getElementById('objectiveText'), dialogue: document.getElementById('dialogue'),
  dialogueName: document.getElementById('dialogueName'), dialogueText: document.getElementById('dialogueText'),
  classPanel: document.getElementById('classroomPanel'), classWishes: document.getElementById('classWishes'),
  dismissClass: document.getElementById('dismissClass'), finalPanel: document.getElementById('finalPanel'),
  replay: document.getElementById('replayBtn'), loading: document.getElementById('loading'),
  assetStatus: document.getElementById('assetStatus')
};
CLASS_WISHES.forEach(w => { const e=document.createElement('div'); e.className='wish-card'; e.textContent=w; ui.classWishes.appendChild(e); });

let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
} catch(err) {
  ui.loading.classList.add('done');
  ui.objectiveTitle.textContent='Không khởi tạo được WebGL';
  ui.objectiveText.textContent='Hãy bật Hardware Acceleration trong Chrome rồi tải lại trang.';
  throw err;
}
renderer.setPixelRatio(Math.min(devicePixelRatio||1, innerWidth<760?1:1.3));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
renderer.shadowMap.enabled=innerWidth>=760;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xbcdfff);
scene.fog=new THREE.Fog(0xcce7fa,85,290);
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,650);
const world=new THREE.Group(); scene.add(world);
const clock=new THREE.Clock();
scene.add(new THREE.HemisphereLight(0xffffff,0x8a766d,2.25));
const sun=new THREE.DirectionalLight(0xfff0d2,2.75); sun.position.set(-30,60,30); sun.castShadow=renderer.shadowMap.enabled;
if(sun.castShadow){sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-110;sun.shadow.camera.right=110;sun.shadow.camera.top=110;sun.shadow.camera.bottom=-110;} scene.add(sun);

const mats={};
const M=(c,r=.72,m=0)=>mats[`${c}_${r}_${m}`]||(mats[`${c}_${r}_${m}`]=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m}));
const mesh=(g,mat,cast=true,receive=true)=>{const o=new THREE.Mesh(g,mat);o.castShadow=renderer.shadowMap.enabled&&cast;o.receiveShadow=receive;return o;};
const box=(p,s,pos,c)=>{const o=mesh(new THREE.BoxGeometry(...s),M(c));o.position.set(...pos);p.add(o);return o;};
const sphere=(p,r,pos,c,sc=[1,1,1])=>{const o=mesh(new THREE.SphereGeometry(r,18,12),M(c));o.position.set(...pos);o.scale.set(...sc);p.add(o);return o;};
const cyl=(p,rt,rb,h,pos,c,seg=16)=>{const o=mesh(new THREE.CylinderGeometry(rt,rb,h,seg),M(c));o.position.set(...pos);p.add(o);return o;};
function label(text,w=900,h=150,fg='#875064',bg='rgba(255,250,248,.94)',font=46){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle=bg;x.beginPath();if(x.roundRect)x.roundRect(8,8,w-16,h-16,28);else x.rect(8,8,w-16,h-16);x.fill();x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';x.font=`800 ${font}px system-ui`;x.fillText(text,w/2,h/2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(w/115,h/115,1);return s;}
function cloud(x,y,z,s=1){const g=new THREE.Group();[[0,0,0,1.2],[1,.1,.1,.85],[-1,.1,.15,.82],[.25,.5,0,.75],[-.35,.42,.1,.65]].forEach(v=>sphere(g,.9,[v[0],v[1],v[2]],0xfffbf8,[1.35*v[3],.72*v[3],v[3]]));g.position.set(x,y,z);g.scale.setScalar(s);world.add(g);return g;}
function flower(x,z,s=1,c=0xff8daf,y=0){const g=new THREE.Group();cyl(g,.035,.045,.55,[0,.28,0],0x5f9b56,7);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;sphere(g,.13,[Math.cos(a)*.15,.64,Math.sin(a)*.15],c,[1.1,.65,.75]);}sphere(g,.08,[0,.64,0],0xffd56a);g.position.set(x,y,z);g.scale.setScalar(s);world.add(g);return g;}
function person(x,y,z,shirt=0xf3a1ba,hair=0x352824,s=1){const g=new THREE.Group();cyl(g,.32,.42,1.05,[0,.72,0],shirt,12);sphere(g,.36,[0,1.54,0],0xf0c2a4);sphere(g,.39,[0,1.68,.03],hair,[1,.52,1]);cyl(g,.09,.1,.55,[-.18,.13,0],0xd7aa8c,8);cyl(g,.09,.1,.55,[.18,.13,0],0xd7aa8c,8);g.position.set(x,y,z);g.scale.setScalar(s);world.add(g);return g;}
function familyMember(name,x,y,z,shirt,hair=0x352824,s=.95){const g=person(x,y,z,shirt,hair,s);const n=label(name,360,95,'#7c4c5c','rgba(255,250,248,.95)',34);n.position.set(x,y+2.65*s,z);n.scale.multiplyScalar(.75);world.add(n);return g;}

function proceduralTeacher(){
  const r=new THREE.Group(); r.name='TeacherMom_Root';
  const body=new THREE.Group();body.name='TeacherMom_Body';r.add(body);
  const ao=mesh(new THREE.CylinderGeometry(.44,.29,1.15,24),M(0x83b9dc));ao.position.y=1.25;body.add(ao);
  box(body,[.72,.16,1.15],[0,.58,.03],0x9ccbe7);
  const head=new THREE.Group();head.name='Head';head.position.y=2.22;r.add(head);
  sphere(head,.55,[0,0,0],0xefb99c,[.92,.84,1.08]);
  sphere(head,.57,[0,.07,.05],0x1b1312,[1,.48,1.05]);
  sphere(head,.18,[-.43,-.02,-.18],0x1b1312,[1,.8,2]); sphere(head,.18,[.43,-.02,-.18],0x1b1312,[1,.8,2]);
  sphere(head,.052,[-.17,-.44,.08],0x241b1b);sphere(head,.052,[.17,-.44,.08],0x241b1b);
  const smile=label('⌣',130,90,'#a53d4e','rgba(0,0,0,0)',62);smile.scale.set(.55,.38,1);smile.position.set(0,-.49,-.2);head.add(smile);
  for(const side of [-1,1]){const arm=new THREE.Group();arm.name=side<0?'Arm_L':'Arm_R';arm.position.set(side*.42,1.55,0);r.add(arm);cyl(arm,.1,.11,.72,[0,-.35,0],0x83b9dc);sphere(arm,.12,[0,-.76,0],0xefb99c);const leg=new THREE.Group();leg.name=side<0?'Leg_L':'Leg_R';leg.position.set(side*.18,.68,0);r.add(leg);cyl(leg,.105,.105,.7,[0,-.34,0],0xf4f0e9);box(leg,[.26,.18,.34],[0,-.73,-.07],0x553832);}
  return r;
}

const loader=new GLTFLoader();
let teacherRoot=new THREE.Group(),teacherVisual=proceduralTeacher(),teacherParts={},carRoot=new THREE.Group();
let controlled=teacherRoot,moveTask=null,driveTask=null,stage=0,busy=true,animMode='idle',lastForward=new THREE.Vector3(0,0,-1),finalOrbit=false,portal,treeRoot,blooms=[];
let schoolGateLeft=null,schoolGateRight=null,gateTask=null;
let fatherNpc=null,olderBrotherNpc=null,youngerBrotherNpc=null;
teacherRoot.add(teacherVisual);world.add(teacherRoot);world.add(carRoot);carRoot.visible=false;
function mapTeacherParts(){teacherParts={head:teacherVisual.getObjectByName('Head'),armL:teacherVisual.getObjectByName('Arm_L'),armR:teacherVisual.getObjectByName('Arm_R'),legL:teacherVisual.getObjectByName('Leg_L'),legR:teacherVisual.getObjectByName('Leg_R')};}
mapTeacherParts();
function normalizeModel(model,target=2.65){const b=new THREE.Box3().setFromObject(model),sz=new THREE.Vector3();b.getSize(sz);model.scale.setScalar(target/Math.max(sz.y,.001));const b2=new THREE.Box3().setFromObject(model),c=new THREE.Vector3();b2.getCenter(c);model.position.x-=c.x;model.position.z-=c.z;model.position.y-=b2.min.y;}
function loadAssets(){
  ui.assetStatus.textContent='Đang nạp chibi 3D của Mẹ…';
  loader.load(TEACHER_MOM_CHARACTER.modelPath,g=>{const m=g.scene;normalizeModel(m,2.65);m.rotation.y=Math.PI;m.traverse(o=>{if(o.isMesh){o.castShadow=renderer.shadowMap.enabled;o.receiveShadow=true;}});teacherRoot.remove(teacherVisual);teacherVisual=m;teacherRoot.add(m);mapTeacherParts();ui.assetStatus.textContent='Mẹ chibi 3D · Blender GLB · áo dài pastel';},undefined,()=>{ui.assetStatus.textContent='Mẹ chibi 3D · chế độ dự phòng';});
  loader.load('./assets/models/sedan.glb',g=>{const m=g.scene;normalizeModel(m,2.1);m.rotation.y=Math.PI/2;m.traverse(o=>{if(o.isMesh){o.castShadow=renderer.shadowMap.enabled;o.receiveShadow=true;}});carRoot.add(m);},undefined,()=>{box(carRoot,[3.2,.8,5],[0,.8,0],0xe98a97);box(carRoot,[2.5,1.2,2.4],[0,1.6,-.2],0xf2a5ad);});
}

function buildSchoolGate(){
  box(world,[1.1,6,1.1],[-6,3,-79],0xedd3aa);box(world,[1.1,6,1.1],[6,3,-79],0xedd3aa);box(world,[13,1,1],[0,6,-79],0xedd3aa);
  const sign=label('TRƯỜNG TIỂU HỌC HOA MÂY',900,130,'#396d92','rgba(255,252,239,.98)',48);sign.position.set(0,6.25,-78.4);world.add(sign);
  schoolGateLeft=new THREE.Group();schoolGateLeft.position.set(-5.35,0,-78.65);const l=box(schoolGateLeft,[5.2,3.6,.16],[2.6,1.8,0],0xdfeaf0);for(let x=.5;x<5;x+=.7)cyl(schoolGateLeft,.045,.045,3.0,[x,1.75,.08],0x6689a0,8);world.add(schoolGateLeft);
  schoolGateRight=new THREE.Group();schoolGateRight.position.set(5.35,0,-78.65);const r=box(schoolGateRight,[5.2,3.6,.16],[-2.6,1.8,0],0xdfeaf0);for(let x=-.5;x>-5;x-=.7)cyl(schoolGateRight,.045,.045,3.0,[x,1.75,.08],0x6689a0,8);world.add(schoolGateRight);
  l.castShadow=r.castShadow=false;
}

function buildSchoolAndClassroom(){
  // Central axis is intentionally kept empty from school gate to classroom entrance.
  box(world,[8,.18,28],[0,.03,-93],0xead8c6);
  box(world,[10,7,18],[-11.5,3.5,-92],0xf2d2a8);box(world,[10,7,18],[11.5,3.5,-92],0xf2d2a8);
  for(let z=-87;z>=-99;z-=5){box(world,[.25,5,.25],[-6.4,2.5,z],0xf7eadb);box(world,[.25,5,.25],[6.4,2.5,z],0xf7eadb);}
  for(let z=-87;z>=-97;z-=5){box(world,[2.8,2,.2],[-7.1,3.6,z],0xb9dff0);box(world,[2.8,2,.2],[7.1,3.6,z],0xb9dff0);}
  const classSign=label('LỚP HỌC CỦA MẸ',560,105,'#7b5260','rgba(255,248,241,.96)',38);classSign.position.set(0,4.5,-104.7);world.add(classSign);

  // Classroom: front opening in the centre, and a real side exit on the right.
  box(world,[18,.22,18],[0,.02,-115.5],0xd7b98c);
  box(world,[18,5,.35],[0,2.5,-124.5],0xe3c19e);
  box(world,[.35,5,18],[-9.2,2.5,-115.5],0xf0d7bc);
  box(world,[6.2,5,.35],[-6.1,2.5,-106.5],0xf0d7bc);box(world,[6.2,5,.35],[6.1,2.5,-106.5],0xf0d7bc);box(world,[6.0,.45,.35],[0,4.78,-106.5],0xe3c19e);
  box(world,[.35,5,7],[9.2,2.5,-121],0xf0d7bc);box(world,[.35,5,6],[9.2,2.5,-109.5],0xf0d7bc);box(world,[.35,.45,5.2],[9.2,4.78,-115],0xe3c19e);
  const exitSign=label('LỐI RA →',380,90,'#44775c','rgba(250,255,249,.96)',34);exitSign.position.set(9.0,3.8,-115);world.add(exitSign);

  box(world,[10,3,.15],[0,3,-124.25],0x3e6e5a);const board=label('20/11 · Cảm ơn cô vì đã luôn ở đây!',880,125,'#fff4df','rgba(0,0,0,0)',40);board.position.set(0,3,-124.05);world.add(board);
  box(world,[4.2,.25,1.7],[0,.52,-121.8],0xb9825b);

  // Desks leave a clear centre aisle and a right-side exit aisle.
  const xs=[-6,-3.1,3.1,6], zs=[-109.5,-112.5,-115.5,-118.5,-121.2];
  zs.forEach((z,r)=>xs.forEach((x,c)=>{if(z<-120.5&&Math.abs(x)<4)return;box(world,[2.25,.16,1.0],[x,.95,z],0xb9825b);person(x,.15,z-.18,(c+r)%2?0xe8f2ff:0xfff9ef,0x352824,.58);}));
}

function buildRoadAndHouse(){
  // Side exit connects directly to the home road; no wall crossing is needed.
  box(world,[9,.18,8],[13.5,.04,-115],0x777171);
  box(world,[77,.18,9],[53,.04,-112.5],0x777171);
  box(world,[9,.18,25],[91.5,.04,-101],0x777171);
  for(let x=19;x<88;x+=6){flower(x,-118,.65,0xff9ab8);flower(x,-107,.65,0xffcf73);}

  // Open-front cutaway house. All stairs occupy their own corridor to avoid geometry overlap.
  for(let f=0;f<3;f++){const y=f*4;box(world,[18,.3,12],[100,y,-106],0xcaa47d);box(world,[.35,4,12],[91,y+2,-106],0xf3e2cf);box(world,[.35,4,12],[109,y+2,-106],0xf3e2cf);box(world,[18,4,.35],[100,y+2,-112],0xecd8c1);}box(world,[18,.35,12],[100,12,-106],0xcaa47d);
  const homeSign=label('NHÀ',320,90,'#8a5b58','rgba(255,250,244,.96)',38);homeSign.position.set(100,3.4,-100.2);world.add(homeSign);

  fatherNpc=familyMember('Bố',96,.25,-105,0x8fa6b8,0x302b29,.95);
  olderBrotherNpc=familyMember('Anh trai',96,4.15,-105,0x6fa8d8,0x352c29,.80);
  youngerBrotherNpc=familyMember('Em trai',102,4.15,-105,0x7eb8df,0x352c29,.80);

  // First staircase: floor 1 -> floor 2, on the right side of the house.
  for(let i=0;i<9;i++)box(world,[1.05,.22,2.1],[104-i*.62,.28+i*.48,-109],0xd7b58e);
  // Second staircase: floor 2 -> floor 3, shifted forward so the two flights never intersect.
  for(let i=0;i<9;i++)box(world,[1.05,.22,2.1],[104-i*.62,4.28+i*.48,-103],0xd7b58e);
}

function buildWishTree(){
  treeRoot=new THREE.Group();treeRoot.position.set(101,8.15,-106);world.add(treeRoot);cyl(treeRoot,.6,.9,5,[0,2.45,0],0x7d5235,18);for(let i=0;i<7;i++){const a=i*Math.PI*2/7,cx=Math.cos(a)*2.2,cz=Math.sin(a)*2.2;const b=cyl(treeRoot,.18,.28,3,[cx*.45,4.6,cz*.45],0x7d5235,10);b.rotation.z=Math.cos(a)*.65;b.rotation.x=Math.sin(a)*.65;sphere(treeRoot,1.45,[cx,5.7,cz],0x78a85b,[1.25,.8,1.15]);}
  TREE_WISHES.forEach((w,i)=>{const a=i*Math.PI*2/TREE_WISHES.length*3.4,r=1.9+(i%4)*.7,y=4.3+(i%5)*.65;const g=new THREE.Group();sphere(g,.24,[0,0,0],[0xff9dbd,0xffcf78,0xc1a7ff][i%3]);const s=label(w,620,100,'#7b4357','rgba(255,252,249,.94)',30);s.scale.multiplyScalar(.7);s.position.set(0,.55,0);g.add(s);g.position.set(Math.cos(a)*r,y,Math.sin(a)*r);g.scale.setScalar(.001);treeRoot.add(g);blooms.push(g);});
}

function buildWorld(){
  for(let i=0;i<30;i++)cloud((i%6-2.5)*17+(i%2)*4,5+(i%5)*1.7,30-i*9,.65+(i%3)*.24);
  portal=new THREE.Group();portal.add(mesh(new THREE.TorusGeometry(3,.25,14,54),new THREE.MeshStandardMaterial({color:0x9a6fff,emissive:0x7454ff,emissiveIntensity:2.8,roughness:.3})));const disk=mesh(new THREE.CircleGeometry(2.72,48),new THREE.MeshBasicMaterial({color:0x120c24}),false,false);disk.position.z=-.05;portal.add(disk);portal.position.set(0,8.2,16);world.add(portal);cloud(0,4.2,10,2.1);
  const hero=label('Chúc mừng Mẹ ngày Nhà giáo Việt Nam 20/11',1050,150,'#cf587f','rgba(255,250,249,.95)',42);hero.position.set(0,10.5,8);world.add(hero);
  cyl(world,8,4,1.8,[0,-1.05,-9],0xd5c29f,26);box(world,[14,.3,32],[0,-.1,-17],0xdceeca);box(world,[6,.18,55],[0,.05,-50],0xf0dac6);
  for(let z=-5;z>-74;z-=2.2){flower(-3.7+Math.sin(z)*.25,z,.7,(Math.round(Math.abs(z))%4===0?0xf7cf72:0xff91b4));flower(3.7+Math.cos(z)*.25,z,.7,(Math.round(Math.abs(z))%5===0?0xb09aff:0xff91b4));}
  buildSchoolGate();buildSchoolAndClassroom();buildRoadAndHouse();buildWishTree();
}

function showDialogue(d){ui.dialogueName.textContent=d.name;ui.dialogueText.textContent=d.text;ui.dialogue.classList.remove('hidden');clearTimeout(showDialogue.t);showDialogue.t=setTimeout(()=>ui.dialogue.classList.add('hidden'),5600);}
function setStage(n){stage=n;const s=STAGES[n];ui.stageNumber.textContent=String(n+1);ui.objectiveTitle.textContent=s.title;ui.objectiveText.textContent=s.text;ui.actionLabel.textContent=s.action;ui.action.disabled=false;ui.action.style.display='flex';}
function setBusy(v){busy=v;ui.action.disabled=v;}
function holdForWish(nextStage,dialogue,ms=2300){showDialogue(dialogue);setStage(nextStage);setBusy(true);setTimeout(()=>setBusy(false),ms);}
function startMove(points,speed=8,onDone,mode=null){const curve=new THREE.CatmullRomCurve3(points.map(p=>p.clone()),false,'catmullrom',.2);moveTask={curve,t:0,duration:Math.max(.8,curve.getLength()/speed),done:onDone};animMode=mode||(speed>7?'run':'walk');setBusy(true);controlled=teacherRoot;}
function startDrive(points,speed=20,onDone){const curve=new THREE.CatmullRomCurve3(points.map(p=>p.clone()),false,'catmullrom',.25);driveTask={curve,t:0,duration:Math.max(1.8,curve.getLength()/speed),done:onDone};setBusy(true);controlled=carRoot;}
function openSchoolGate(onDone){gateTask={t:0,duration:1.15,done:onDone};setBusy(true);}
function updateGate(dt){if(!gateTask||!schoolGateLeft||!schoolGateRight)return;gateTask.t=Math.min(1,gateTask.t+dt/gateTask.duration);const e=1-Math.pow(1-gateTask.t,3);schoolGateLeft.rotation.y=e*Math.PI*.5;schoolGateRight.rotation.y=-e*Math.PI*.5;if(gateTask.t>=1){const done=gateTask.done;gateTask=null;setBusy(false);done?.();}}
function updateMovement(dt){if(moveTask){moveTask.t=Math.min(1,moveTask.t+dt/moveTask.duration);const p=moveTask.curve.getPoint(moveTask.t),tan=moveTask.curve.getTangent(Math.min(.999,moveTask.t)).normalize();teacherRoot.position.copy(p);if(tan.lengthSq()>.1){lastForward.lerp(tan,.28).normalize();teacherRoot.rotation.y=Math.atan2(lastForward.x,lastForward.z);}if(moveTask.t>=1){const done=moveTask.done;moveTask=null;animMode='idle';setBusy(false);done?.();}}if(driveTask){driveTask.t=Math.min(1,driveTask.t+dt/driveTask.duration);const p=driveTask.curve.getPoint(driveTask.t),tan=driveTask.curve.getTangent(Math.min(.999,driveTask.t)).normalize();carRoot.position.copy(p);lastForward.lerp(tan,.25).normalize();carRoot.rotation.y=Math.atan2(lastForward.x,lastForward.z);if(driveTask.t>=1){const done=driveTask.done;driveTask=null;setBusy(false);done?.();}}}
function animateTeacher(t){const p=teacherParts;if(!p.armL||!p.armR)return;const moving=animMode==='walk'||animMode==='run'||animMode==='stairs',freq=animMode==='run'?8:5,amp=animMode==='run'?.7:(animMode==='stairs'?.34:.42),s=Math.sin(t*freq)*amp;p.armL.rotation.x=moving?s:0;p.armR.rotation.x=moving?-s:0;if(p.legL)p.legL.rotation.x=moving?-s:0;if(p.legR)p.legR.rotation.x=moving?s:0;p.armL.rotation.z=0;p.armR.rotation.z=0;if(animMode==='wave'){p.armR.rotation.z=-1.5;p.armR.rotation.x=-.35+Math.sin(t*8)*.22;}else if(animMode==='teach'){p.armR.rotation.z=-.65;p.armR.rotation.x=-.25+Math.sin(t*2.6)*.22;p.armL.rotation.z=.18;}else if(animMode==='receive'){p.armL.rotation.z=.7;p.armR.rotation.z=-.7;p.armL.rotation.x=-.35;p.armR.rotation.x=-.35;}if(p.head)p.head.rotation.z=Math.sin(t*1.5)*.02;teacherVisual.position.y=moving?0:Math.sin(t*2)*.025;}
function updateCamera(dt,t){if(finalOrbit){const center=new THREE.Vector3(101,13,-106),r=12,a=t*.18;camera.position.lerp(new THREE.Vector3(center.x+Math.sin(a)*r,center.y+4.5,center.z+Math.cos(a)*r),1-Math.exp(-dt*2));camera.lookAt(center);return;}const target=controlled===carRoot?carRoot:teacherRoot,f=lastForward.clone().normalize(),dist=controlled===carRoot?11:8.5,height=controlled===carRoot?5.5:4.7,desired=target.position.clone().addScaledVector(f,-dist).add(new THREE.Vector3(0,height,0));camera.position.lerp(desired,1-Math.exp(-dt*4.5));camera.lookAt(target.position.clone().addScaledVector(f,3).add(new THREE.Vector3(0,controlled===carRoot?1.3:1.5,0)));}

function action(){
  if(busy)return;
  if(stage===0){
    animMode='jump';
    startMove([teacherRoot.position.clone(),new THREE.Vector3(0,3.2,3),new THREE.Vector3(0,.12,-8)],6,()=>{setStage(1);showDialogue(DIALOGUES.garden);});
  }else if(stage===1){
    startMove([teacherRoot.position.clone(),new THREE.Vector3(-1,.12,-22),new THREE.Vector3(0,.12,-39)],7,()=>setStage(2));
  }else if(stage===2){
    startMove([teacherRoot.position.clone(),new THREE.Vector3(0,.12,-58),new THREE.Vector3(0,.12,-74)],8,()=>{setStage(3);showDialogue(DIALOGUES.school);});
  }else if(stage===3){
    openSchoolGate(()=>startMove([
      teacherRoot.position.clone(),
      new THREE.Vector3(0,.12,-80.5),
      new THREE.Vector3(0,.12,-91),
      new THREE.Vector3(0,.12,-102.5),
      new THREE.Vector3(0,.12,-108.5),
      new THREE.Vector3(0,.12,-121.1)
    ],6.6,()=>{setStage(4);animMode='teach';showDialogue(DIALOGUES.classroom);}));
  }else if(stage===4){
    animMode='teach';ui.classPanel.classList.remove('hidden');ui.action.style.display='none';showDialogue(DIALOGUES.classroom);
  }else if(stage===6){
    startMove([
      teacherRoot.position.clone(),
      new THREE.Vector3(93.5,.12,-101.5),
      new THREE.Vector3(96,.12,-104.2)
    ],5,()=>holdForWish(7,DIALOGUES.father,2600));
  }else if(stage===7){
    const stair=[teacherRoot.position.clone(),new THREE.Vector3(103.5,.12,-109)];
    for(let i=1;i<=8;i++)stair.push(new THREE.Vector3(103.5-i*.62,.2+i*.48,-109));
    stair.push(new THREE.Vector3(96,4.1,-105));
    startMove(stair,4.6,()=>holdForWish(8,DIALOGUES.olderBrother,2600),'stairs');
  }else if(stage===8){
    startMove([teacherRoot.position.clone(),new THREE.Vector3(99,4.1,-105),new THREE.Vector3(102,4.1,-105)],4.2,()=>holdForWish(9,DIALOGUES.youngerBrother,2600));
  }else if(stage===9){
    showDialogue(DIALOGUES.upstairs);
    const stair=[teacherRoot.position.clone(),new THREE.Vector3(104,4.1,-103)];
    for(let i=1;i<=8;i++)stair.push(new THREE.Vector3(104-i*.62,4.2+i*.48,-103));
    stair.push(new THREE.Vector3(101,8.1,-106));
    startMove(stair,4.4,()=>{
      setBusy(true);animMode='receive';
      blooms.forEach((b,i)=>setTimeout(()=>{b.userData.birth=performance.now();b.userData.growing=true;},i*115));
      setTimeout(()=>{finalOrbit=true;ui.finalPanel.classList.remove('hidden');showDialogue(DIALOGUES.finale);setBusy(false);},TREE_WISHES.length*115+1000);
    },'stairs');
  }
}
ui.action.addEventListener('click',action);
ui.dismissClass.addEventListener('click',()=>{
  ui.classPanel.classList.add('hidden');ui.action.style.display='flex';setStage(5);showDialogue(DIALOGUES.afterClass);
  // Exit classroom through the actual right-side doorway, then walk to the parked car.
  startMove([
    teacherRoot.position.clone(),
    new THREE.Vector3(7.2,.12,-121.0),
    new THREE.Vector3(7.2,.12,-115.0),
    new THREE.Vector3(10.7,.12,-115.0),
    new THREE.Vector3(14.7,.12,-112.5)
  ],6.5,()=>{
    teacherRoot.visible=false;carRoot.visible=true;carRoot.position.copy(teacherRoot.position);
    startDrive([
      carRoot.position.clone(),
      new THREE.Vector3(24,.1,-112.5),
      new THREE.Vector3(44,.1,-112.5),
      new THREE.Vector3(68,.1,-112.5),
      new THREE.Vector3(87,.1,-112.5),
      new THREE.Vector3(91.5,.1,-105),
      new THREE.Vector3(91.5,.1,-99)
    ],19,()=>{
      carRoot.visible=false;teacherRoot.visible=true;teacherRoot.position.set(91.5,.12,-99);controlled=teacherRoot;lastForward.set(.35,0,-.94).normalize();animMode='idle';setStage(6);showDialogue(DIALOGUES.home);
    });
  });
});
ui.replay.addEventListener('click',()=>location.reload());

buildWorld();loadAssets();teacherRoot.position.set(0,8.2,16);camera.position.set(0,9.5,25);lastForward.set(0,0,-1);animMode='wave';
setTimeout(()=>startMove([new THREE.Vector3(0,8.2,16),new THREE.Vector3(0,6.5,13),new THREE.Vector3(0,4.75,10)],3.2,()=>{setStage(0);animMode='wave';showDialogue(DIALOGUES.intro);}),350);
setTimeout(()=>{ui.loading.classList.add('done');window.__APP_READY__=true;},650);
function loop(){requestAnimationFrame(loop);const dt=Math.min(.04,clock.getDelta()),t=clock.elapsedTime;updateGate(dt);updateMovement(dt);animateTeacher(t);for(const b of blooms){if(b.userData.growing){const k=Math.min(1,(performance.now()-b.userData.birth)/650),e=1-Math.pow(1-k,3);b.scale.setScalar(e);if(k>=1)b.userData.growing=false;}}if(portal){portal.rotation.z+=dt*.28;portal.scale.setScalar(1+Math.sin(t*2)*.025);}updateCamera(dt,t);renderer.render(scene,camera);}loop();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<760?1:1.3));renderer.setSize(innerWidth,innerHeight);});
