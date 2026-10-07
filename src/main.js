import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CLASS_WISHES, TREE_WISHES, STAGES, DIALOGUES, TEACHER_MOM_CHARACTER } from './config.js';
import { ROUTES, DESKS } from './world-spec.mjs';

const canvas=document.getElementById('game');
const ui={
  action:document.getElementById('actionBtn'),actionLabel:document.getElementById('actionLabel'),stageNumber:document.getElementById('stageNumber'),
  objectiveTitle:document.getElementById('objectiveTitle'),objectiveText:document.getElementById('objectiveText'),dialogue:document.getElementById('dialogue'),
  dialogueName:document.getElementById('dialogueName'),dialogueText:document.getElementById('dialogueText'),classPanel:document.getElementById('classroomPanel'),
  classWishes:document.getElementById('classWishes'),dismissClass:document.getElementById('dismissClass'),finalPanel:document.getElementById('finalPanel'),
  replay:document.getElementById('replayBtn'),loading:document.getElementById('loading'),assetStatus:document.getElementById('assetStatus')
};
CLASS_WISHES.forEach(w=>{const e=document.createElement('div');e.className='wish-card';e.textContent=w;ui.classWishes.appendChild(e);});

let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(err){
  ui.loading.classList.add('done');ui.objectiveTitle.textContent='Không khởi tạo được WebGL';ui.objectiveText.textContent='Hãy bật Hardware Acceleration/WebGL trong Chrome rồi tải lại trang.';throw err;
}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<760?1:1.35));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
renderer.shadowMap.enabled=innerWidth>=760;renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene();scene.background=new THREE.Color(0xbfe2ff);scene.fog=new THREE.Fog(0xd7edff,105,330);
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,700);
const world=new THREE.Group();scene.add(world);const clock=new THREE.Clock();
scene.add(new THREE.HemisphereLight(0xffffff,0x8f7a70,2.35));
const sun=new THREE.DirectionalLight(0xffefd1,2.65);sun.position.set(-35,65,28);sun.castShadow=renderer.shadowMap.enabled;
if(sun.castShadow){sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-120;sun.shadow.camera.right=120;sun.shadow.camera.top=120;sun.shadow.camera.bottom=-120;}scene.add(sun);

const mats={};const cameraBlockers=[];const loader=new GLTFLoader();const UP=new THREE.Vector3(0,1,0);
const M=(c,r=.72,m=0)=>mats[`${c}_${r}_${m}`]||(mats[`${c}_${r}_${m}`]=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m}));
const mesh=(g,mat,cast=true,receive=true)=>{const o=new THREE.Mesh(g,mat);o.castShadow=renderer.shadowMap.enabled&&cast;o.receiveShadow=receive;return o;};
const box=(p,s,pos,c,block=false)=>{const o=mesh(new THREE.BoxGeometry(...s),M(c));o.position.set(...pos);p.add(o);if(block)cameraBlockers.push(o);return o;};
const sphere=(p,r,pos,c,sc=[1,1,1])=>{const o=mesh(new THREE.SphereGeometry(r,16,10),M(c));o.position.set(...pos);o.scale.set(...sc);p.add(o);return o;};
const cyl=(p,rt,rb,h,pos,c,seg=14)=>{const o=mesh(new THREE.CylinderGeometry(rt,rb,h,seg),M(c));o.position.set(...pos);p.add(o);return o;};
function label(text,w=900,h=150,fg='#875064',bg='rgba(255,250,248,.94)',font=46){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle=bg;x.beginPath();if(x.roundRect)x.roundRect(8,8,w-16,h-16,28);else x.rect(8,8,w-16,h-16);x.fill();x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';x.font=`800 ${font}px system-ui`;x.fillText(text,w/2,h/2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(w/115,h/115,1);return s;}
function cloud(x,y,z,s=1){const g=new THREE.Group();[[0,0,0,1.2],[1,.1,.1,.85],[-1,.1,.15,.82],[.25,.5,0,.75],[-.35,.42,.1,.65]].forEach(v=>sphere(g,.9,[v[0],v[1],v[2]],0xfffbf8,[1.35*v[3],.55*v[3],v[3]]));g.position.set(x,y,z);g.scale.setScalar(s);world.add(g);return g;}
function flower(x,z,s=1,c=0xff8daf,y=0){const g=new THREE.Group();cyl(g,.035,.045,.55,[0,.28,0],0x5f9b56,7);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;sphere(g,.13,[Math.cos(a)*.15,.64,Math.sin(a)*.15],c,[1.1,.65,.75]);}sphere(g,.08,[0,.64,0],0xffd56a);g.position.set(x,y,z);g.scale.setScalar(s);world.add(g);return g;}
function person(x,y,z,shirt=0xf3a1ba,hair=0x352824,s=1){const g=new THREE.Group();cyl(g,.32,.42,1.05,[0,.72,0],shirt,12);sphere(g,.36,[0,1.54,0],0xf0c2a4);sphere(g,.39,[0,1.68,.03],hair,[1,.52,1]);cyl(g,.09,.1,.55,[-.18,.13,0],0xd7aa8c,8);cyl(g,.09,.1,.55,[.18,.13,0],0xd7aa8c,8);g.position.set(x,y,z);g.scale.setScalar(s);world.add(g);return g;}
function familyMember(name,x,y,z,shirt,hair=0x352824,s=.95){const g=person(x,y,z,shirt,hair,s);const n=label(name,360,95,'#7c4c5c','rgba(255,250,248,.95)',34);n.position.set(x,y+2.65*s,z);n.scale.multiplyScalar(.75);world.add(n);return g;}
const vec=arr=>new THREE.Vector3(arr[0],arr[1],arr[2]);const route=name=>ROUTES[name].map(vec);

function proceduralTeacher(){
  const r=new THREE.Group();r.name='TeacherMom_Root';const body=new THREE.Group();body.name='TeacherMom_Body';r.add(body);
  const ao=mesh(new THREE.CylinderGeometry(.44,.29,1.15,24),M(0x83b9dc));ao.position.y=1.25;body.add(ao);box(body,[.72,.16,1.15],[0,.58,.03],0x9ccbe7);
  const head=new THREE.Group();head.name='Head';head.position.y=2.22;r.add(head);sphere(head,.55,[0,0,0],0xefb99c,[.92,.84,1.08]);sphere(head,.57,[0,.07,.05],0x1b1312,[1,.48,1.05]);
  sphere(head,.052,[-.17,-.44,.08],0x241b1b);sphere(head,.052,[.17,-.44,.08],0x241b1b);
  for(const side of [-1,1]){const arm=new THREE.Group();arm.name=side<0?'Arm_L':'Arm_R';arm.position.set(side*.42,1.55,0);r.add(arm);cyl(arm,.1,.11,.72,[0,-.35,0],0x83b9dc);sphere(arm,.12,[0,-.76,0],0xefb99c);const leg=new THREE.Group();leg.name=side<0?'Leg_L':'Leg_R';leg.position.set(side*.18,.68,0);r.add(leg);cyl(leg,.105,.105,.7,[0,-.34,0],0xf4f0e9);box(leg,[.26,.18,.34],[0,-.73,-.07],0x553832);}
  return r;
}

let teacherRoot=new THREE.Group(),teacherVisual=proceduralTeacher(),teacherParts={},teacherVisualBaseY=0,carRoot=new THREE.Group();
let premiumFlowerSource=null,premiumFlowers=[];let controlled=teacherRoot,moveTask=null,driveTask=null,stage=0,busy=true,animMode='idle',gaitPhase=0;
let lastForward=new THREE.Vector3(0,0,-1),portal,treeRoot,blooms=[],schoolGateLeft=null,schoolGateRight=null,gateTask=null,finalOrbit=false;
let fatherNpc=null,olderBrotherNpc=null,youngerBrotherNpc=null;let cameraMode='follow',cameraUserYaw=0,cameraPitch=.16,cameraZoom=8.5,userCameraTouched=false;
let classroomOrbit=Math.PI,heartClock=0;const hearts=[];let heartTexture=null;const cameraRay=new THREE.Raycaster();
teacherRoot.add(teacherVisual);world.add(teacherRoot);world.add(carRoot);carRoot.visible=false;

function mapTeacherParts(){teacherParts={head:teacherVisual.getObjectByName('Head'),body:teacherVisual.getObjectByName('TeacherMom_Body'),armL:teacherVisual.getObjectByName('Arm_L'),armR:teacherVisual.getObjectByName('Arm_R'),legL:teacherVisual.getObjectByName('Leg_L'),legR:teacherVisual.getObjectByName('Leg_R')};}
mapTeacherParts();
function normalizeModel(model,target=2.65){const b=new THREE.Box3().setFromObject(model),sz=new THREE.Vector3();b.getSize(sz);model.scale.setScalar(target/Math.max(sz.y,.001));const b2=new THREE.Box3().setFromObject(model),c=new THREE.Vector3();b2.getCenter(c);model.position.x-=c.x;model.position.z-=c.z;model.position.y-=b2.min.y;}
function fitPremiumFlower(model,targetWidth=1.35){const b=new THREE.Box3().setFromObject(model),sz=new THREE.Vector3();b.getSize(sz);const sc=targetWidth/Math.max(sz.x,sz.z,.001);model.scale.setScalar(sc);const b2=new THREE.Box3().setFromObject(model);model.position.y-=b2.min.y;}
function spawnPremiumFlowerGarden(){if(!premiumFlowerSource||premiumFlowers.length)return;const spots=[];for(let z=-10;z>-73;z-=5.4){spots.push([-4.8,.02,z,.66]);spots.push([4.8,.02,z,.63]);}for(let x=19;x<84;x+=9){spots.push([x,.02,-118,.58]);spots.push([x+2,.02,-108,.54]);}spots.forEach((p,i)=>{const c=premiumFlowerSource.clone(true);c.position.set(p[0],p[1],p[2]);c.scale.multiplyScalar(p[3]);c.rotation.y=(i*2.39996)%(Math.PI*2);c.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});world.add(c);premiumFlowers.push(c);});}
function loadAssets(){
  ui.assetStatus.textContent='Đang nạp chibi 3D của Mẹ…';
  loader.load(TEACHER_MOM_CHARACTER.modelPath,g=>{const m=g.scene;normalizeModel(m,2.65);m.rotation.y=0;m.traverse(o=>{if(o.isMesh){o.castShadow=renderer.shadowMap.enabled;o.receiveShadow=true;}});teacherRoot.remove(teacherVisual);teacherVisual=m;teacherRoot.add(m);teacherVisualBaseY=m.position.y;mapTeacherParts();ui.assetStatus.textContent='Mẹ chibi 3D · chuyển động chân tay · camera 360°';},undefined,()=>{ui.assetStatus.textContent='Mẹ chibi 3D · chế độ dự phòng';});
  loader.load('./assets/models/sedan.glb',g=>{const m=g.scene;normalizeModel(m,2.1);m.rotation.y=Math.PI/2;m.traverse(o=>{if(o.isMesh){o.castShadow=renderer.shadowMap.enabled;o.receiveShadow=true;}});carRoot.add(m);},undefined,()=>{box(carRoot,[3.2,.8,5],[0,.8,0],0xe98a97);box(carRoot,[2.5,1.2,2.4],[0,1.6,-.2],0xf2a5ad);});
  loader.load('./assets/models/flower_empodium_4k.glb',g=>{const m=g.scene;fitPremiumFlower(m);premiumFlowerSource=m;spawnPremiumFlowerGarden();ui.assetStatus.textContent='Mẹ chibi 3D · camera 360° · hoa 4K CC0';},undefined,()=>{});
}

function buildCloudRibbon(routeNames,width=4.5,step=2.7,y=-.24){const pts=routeNames.flatMap((n,idx)=>ROUTES[n].slice(idx?1:0)).map(vec);const curve=new THREE.CatmullRomCurve3(pts,false,'catmullrom',.2);const len=curve.getLength(),count=Math.ceil(len/step);const geom=new THREE.SphereGeometry(1,12,8),mat=M(0xfffdf8,.88,0),inst=new THREE.InstancedMesh(geom,mat,(count+1)*3);const dummy=new THREE.Object3D();let k=0;for(let i=0;i<=count;i++){const t=i/count,p=curve.getPoint(t),tan=curve.getTangent(Math.min(.999,t)).normalize(),side=new THREE.Vector3(-tan.z,0,tan.x);for(const off of [-width*.42,0,width*.42]){const pos=p.clone().addScaledVector(side,off);dummy.position.set(pos.x,y,pos.z);dummy.scale.set(1.75+Math.random()*.45,.24,.95+Math.random()*.28);dummy.rotation.y=Math.atan2(tan.x,tan.z);dummy.updateMatrix();inst.setMatrixAt(k++,dummy.matrix);}}inst.castShadow=false;inst.receiveShadow=true;world.add(inst);}
function buildSchoolGate(){
  box(world,[1.1,6,1.1],[-6.5,3,-79],0xedd3aa,true);box(world,[1.1,6,1.1],[6.5,3,-79],0xedd3aa,true);box(world,[14,1,1],[0,6,-79],0xedd3aa,true);
  const sign=label('TRƯỜNG TIỂU HỌC HOA MÂY',900,130,'#396d92','rgba(255,252,239,.98)',48);sign.position.set(0,6.25,-78.4);world.add(sign);
  schoolGateLeft=new THREE.Group();schoolGateLeft.position.set(-5.9,0,-78.65);box(schoolGateLeft,[5.7,3.6,.14],[2.85,1.8,0],0xdfeaf0);for(let x=.5;x<5.6;x+=.7)cyl(schoolGateLeft,.045,.045,3.0,[x,1.75,.08],0x6689a0,8);world.add(schoolGateLeft);
  schoolGateRight=new THREE.Group();schoolGateRight.position.set(5.9,0,-78.65);box(schoolGateRight,[5.7,3.6,.14],[-2.85,1.8,0],0xdfeaf0);for(let x=-.5;x>-5.6;x-=.7)cyl(schoolGateRight,.045,.045,3.0,[x,1.75,.08],0x6689a0,8);world.add(schoolGateRight);
}
function buildSchoolAndClassroom(){
  box(world,[8,.16,29],[0,.02,-93],0xf8f0e6);box(world,[10,7,19],[-12,3.5,-92],0xf2d2a8,true);box(world,[10,7,19],[12,3.5,-92],0xf2d2a8,true);
  for(let z=-87;z>=-99;z-=5){box(world,[.25,5,.25],[-6.4,2.5,z],0xf7eadb);box(world,[.25,5,.25],[6.4,2.5,z],0xf7eadb);}
  const classSign=label('LỚP HỌC CỦA MẸ',560,105,'#7b5260','rgba(255,248,241,.96)',38);classSign.position.set(0,4.5,-104.8);world.add(classSign);
  box(world,[20,.18,20],[0,.01,-116.5],0xd7b98c);box(world,[20,5,.4],[0,2.5,-126.5],0xe3c19e,true);box(world,[.4,5,20],[-10.25,2.5,-116.5],0xf0d7bc,true);
  box(world,[7.1,5,.4],[-6.75,2.5,-106.5],0xf0d7bc,true);box(world,[7.1,5,.4],[6.75,2.5,-106.5],0xf0d7bc,true);box(world,[6.2,.42,.4],[0,4.8,-106.5],0xe3c19e,true);
  box(world,[.4,5,8.7],[10.25,2.5,-122.45],0xf0d7bc,true);box(world,[.4,5,5.5],[10.25,2.5,-109.25],0xf0d7bc,true);box(world,[.4,.42,6],[10.25,4.8,-115],0xe3c19e,true);
  const exitSign=label('LỐI RA →',380,90,'#44775c','rgba(250,255,249,.96)',34);exitSign.position.set(10.0,3.8,-115);world.add(exitSign);
  box(world,[10,3,.15],[0,3,-126.2],0x3e6e5a);const board=label('20/11 · Cảm ơn cô vì đã luôn ở đây!',880,125,'#fff4df','rgba(0,0,0,0)',40);board.position.set(0,3,-126.05);world.add(board);
  box(world,[4.5,.25,1.8],[0,.54,-121.8],0xb9825b);
  DESKS.forEach((d,i)=>{const x=(d.min[0]+d.max[0])/2,z=(d.min[2]+d.max[2])/2;box(world,[2.1,.16,1.0],[x,.95,z],0xb9825b);person(x,.15,z-.15,i%2?0xe8f2ff:0xfff9ef,0x352824,.57);});
}
function buildCloudRoadAndHouse(){
  buildCloudRibbon(['jump','garden','toSchool'],4.7,2.35,-.30);buildCloudRibbon(['exitClass'],4.4,2.5,-.28);buildCloudRibbon(['driveHome'],7.5,3.0,-.38);
  for(let z=-6;z>-73;z-=2.4){flower(-4.7+Math.sin(z)*.28,z,.66,(Math.round(Math.abs(z))%4===0?0xf7cf72:0xff91b4),.04);flower(4.7+Math.cos(z)*.28,z,.66,(Math.round(Math.abs(z))%5===0?0xb09aff:0xff91b4),.04);}
  for(let f=0;f<3;f++){const y=f*4.5;box(world,[20,.28,14],[100,y,-106],0xd7b58e);box(world,[.4,4.5,14],[89.75,y+2.25,-106],0xf3e2cf,true);box(world,[.4,4.5,14],[110.25,y+2.25,-106],0xf3e2cf,true);box(world,[20,4.5,.4],[100,y+2.25,-112.75],0xecd8c1,true);}box(world,[20,.32,14],[100,13.5,-106],0xd7b58e);
  const homeSign=label('NHÀ',320,90,'#8a5b58','rgba(255,250,244,.96)',38);homeSign.position.set(100,3.5,-98.9);world.add(homeSign);
  fatherNpc=familyMember('Bố',95.8,.25,-105,0x8fa6b8,0x302b29,.95);olderBrotherNpc=familyMember('Anh trai',96,4.65,-105,0x6fa8d8,0x352c29,.80);youngerBrotherNpc=familyMember('Em trai',103,4.65,-105,0x7eb8df,0x352c29,.80);
  for(let i=0;i<9;i++)box(world,[1.08,.22,2.1],[103.8-i*.65,.28+i*.49,-109],0xd7b58e);
  for(let i=0;i<9;i++)box(world,[1.08,.22,2.1],[104-i*.65,4.78+i*.49,-102.5],0xd7b58e);
}
function buildWishTree(){
  treeRoot=new THREE.Group();treeRoot.position.set(100,9.1,-106);world.add(treeRoot);cyl(treeRoot,.55,.82,4.4,[0,2.2,0],0x7d5235,18);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7,cx=Math.cos(a)*2.0,cz=Math.sin(a)*2.0;const b=cyl(treeRoot,.16,.25,2.7,[cx*.42,4.25,cz*.42],0x7d5235,10);b.rotation.z=Math.cos(a)*.62;b.rotation.x=Math.sin(a)*.62;sphere(treeRoot,1.25,[cx,5.15,cz],0x78a85b,[1.2,.72,1.1]);}
  TREE_WISHES.forEach((w,i)=>{const a=i*Math.PI*2/TREE_WISHES.length*3.4,r=1.8+(i%4)*.62,y=4.0+(i%5)*.55;const g=new THREE.Group();sphere(g,.22,[0,0,0],[0xff9dbd,0xffcf78,0xc1a7ff][i%3]);const s=label(w,620,100,'#7b4357','rgba(255,252,249,.94)',30);s.scale.multiplyScalar(.65);s.position.set(0,.5,0);g.add(s);g.position.set(Math.cos(a)*r,y,Math.sin(a)*r);g.scale.setScalar(.001);treeRoot.add(g);blooms.push(g);});
}
function buildWorld(){
  for(let i=0;i<34;i++)cloud((i%7-3)*18+(i%2)*4,7+(i%5)*1.9,35-i*10,.62+(i%3)*.24);
  portal=new THREE.Group();portal.add(mesh(new THREE.TorusGeometry(3,.25,14,54),new THREE.MeshStandardMaterial({color:0x9a6fff,emissive:0x7454ff,emissiveIntensity:2.8,roughness:.3})));const disk=mesh(new THREE.CircleGeometry(2.72,48),new THREE.MeshBasicMaterial({color:0x120c24}),false,false);disk.position.z=-.05;portal.add(disk);portal.position.set(0,8.2,16);world.add(portal);cloud(0,4.2,10,2.1);
  const hero=label('Chúc mừng Mẹ ngày Nhà giáo Việt Nam 20/11',1050,150,'#cf587f','rgba(255,250,249,.95)',42);hero.position.set(0,10.5,8);world.add(hero);
  buildCloudRoadAndHouse();buildSchoolGate();buildSchoolAndClassroom();buildWishTree();
}

function makeHeartTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.translate(64,68);x.scale(1.35,1.35);x.beginPath();x.moveTo(0,24);x.bezierCurveTo(-34,2,-34,-24,-14,-28);x.bezierCurveTo(-3,-30,0,-19,0,-13);x.bezierCurveTo(0,-19,3,-30,14,-28);x.bezierCurveTo(34,-24,34,2,0,24);x.closePath();x.fillStyle='#ff7fa5';x.fill();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function spawnHeart(){if(!heartTexture)heartTexture=makeHeartTexture();const mat=new THREE.SpriteMaterial({map:heartTexture,transparent:true,opacity:.9,depthWrite:false});const s=new THREE.Sprite(mat);s.scale.set(.32,.32,.32);s.position.copy(teacherRoot.position).add(new THREE.Vector3((Math.random()-.5)*.7,.35,(Math.random()-.5)*.5));s.userData.life=0;s.userData.vx=(Math.random()-.5)*.22;s.userData.vz=(Math.random()-.5)*.18;world.add(s);hearts.push(s);}
function updateHearts(dt){const moving=moveTask&&teacherRoot.visible;if(moving){heartClock+=dt;if(heartClock>.16){heartClock=0;spawnHeart();}}for(let i=hearts.length-1;i>=0;i--){const h=hearts[i];h.userData.life+=dt;h.position.y+=dt*.8;h.position.x+=h.userData.vx*dt;h.position.z+=h.userData.vz*dt;h.material.opacity=Math.max(0,.9-h.userData.life*.62);h.scale.multiplyScalar(1+dt*.12);if(h.userData.life>1.5){world.remove(h);h.material.dispose();hearts.splice(i,1);}}}

function showDialogue(d){ui.dialogueName.textContent=d.name;ui.dialogueText.textContent=d.text;ui.dialogue.classList.remove('hidden');clearTimeout(showDialogue.t);showDialogue.t=setTimeout(()=>ui.dialogue.classList.add('hidden'),5600);}
function setStage(n){stage=n;const s=STAGES[n];ui.stageNumber.textContent=String(n+1);ui.objectiveTitle.textContent=s.title;ui.objectiveText.textContent=s.text;ui.actionLabel.textContent=s.action;ui.action.disabled=false;ui.action.style.display='flex';}
function setBusy(v){busy=v;ui.action.disabled=v;}
function holdForWish(nextStage,dialogue,ms=2500){showDialogue(dialogue);setStage(nextStage);setBusy(true);setTimeout(()=>setBusy(false),ms);}
function faceDirection(dir){if(dir.lengthSq()<.001)return;lastForward.copy(dir).normalize();teacherRoot.rotation.y=Math.atan2(lastForward.x,lastForward.z);}
function startMove(points,speed=8,onDone,mode=null){const curve=new THREE.CatmullRomCurve3(points.map(p=>p.clone()),false,'catmullrom',.15);moveTask={curve,t:0,last:points[0].clone(),duration:Math.max(.8,curve.getLength()/speed),done:onDone};animMode=mode||(speed>7?'run':'walk');setBusy(true);controlled=teacherRoot;cameraMode='follow';}
function startDrive(points,speed=20,onDone){const curve=new THREE.CatmullRomCurve3(points.map(p=>p.clone()),false,'catmullrom',.2);driveTask={curve,t:0,duration:Math.max(1.8,curve.getLength()/speed),done:onDone};setBusy(true);controlled=carRoot;cameraMode='follow';}
function openSchoolGate(onDone){gateTask={t:0,duration:1.15,done:onDone};setBusy(true);}
function updateGate(dt){if(!gateTask||!schoolGateLeft||!schoolGateRight)return;gateTask.t=Math.min(1,gateTask.t+dt/gateTask.duration);const e=1-Math.pow(1-gateTask.t,3);schoolGateLeft.rotation.y=-e*Math.PI*.52;schoolGateRight.rotation.y=e*Math.PI*.52;if(gateTask.t>=1){const done=gateTask.done;gateTask=null;setBusy(false);done?.();}}
function updateMovement(dt){
  if(moveTask){moveTask.t=Math.min(1,moveTask.t+dt/moveTask.duration);const p=moveTask.curve.getPoint(moveTask.t),tan=moveTask.curve.getTangent(Math.min(.999,moveTask.t)).normalize();const dist=p.distanceTo(moveTask.last);gaitPhase+=dist*(animMode==='run'?5.4:animMode==='stairs'?4.2:4.6);moveTask.last.copy(p);teacherRoot.position.copy(p);faceDirection(tan);if(moveTask.t>=1){const done=moveTask.done;moveTask=null;animMode='idle';setBusy(false);done?.();}}
  if(driveTask){driveTask.t=Math.min(1,driveTask.t+dt/driveTask.duration);const p=driveTask.curve.getPoint(driveTask.t),tan=driveTask.curve.getTangent(Math.min(.999,driveTask.t)).normalize();carRoot.position.copy(p);lastForward.lerp(tan,.28).normalize();carRoot.rotation.y=Math.atan2(lastForward.x,lastForward.z);if(driveTask.t>=1){const done=driveTask.done;driveTask=null;setBusy(false);done?.();}}
}
function animateTeacher(t){const p=teacherParts;if(!p.armL||!p.armR||!p.legL||!p.legR)return;const moving=animMode==='walk'||animMode==='run'||animMode==='stairs';const amp=animMode==='run'?.72:animMode==='stairs'?.34:.48;const s=moving?Math.sin(gaitPhase)*amp:0,footLift=moving?Math.max(0,Math.sin(gaitPhase))*0.05:0;p.legL.rotation.x=s;p.legR.rotation.x=-s;p.legL.rotation.z=moving?Math.sin(gaitPhase)*.035:0;p.legR.rotation.z=moving?-Math.sin(gaitPhase)*.035:0;p.armL.rotation.x=-s*.85;p.armR.rotation.x=s*.85;p.armL.rotation.z=0;p.armR.rotation.z=0;
  if(animMode==='wave'){p.armR.rotation.z=-1.5;p.armR.rotation.x=-.35+Math.sin(t*8)*.22;}else if(animMode==='teach'){p.armR.rotation.z=-.65;p.armR.rotation.x=-.25+Math.sin(t*2.6)*.22;p.armL.rotation.z=.18;}else if(animMode==='receive'){p.armL.rotation.z=.7;p.armR.rotation.z=-.7;p.armL.rotation.x=-.35;p.armR.rotation.x=-.35;}
  if(p.body)p.body.rotation.z=moving?Math.sin(gaitPhase*.5)*.018:0;if(p.head)p.head.rotation.z=Math.sin(t*1.5)*.018;teacherVisual.position.y=teacherVisualBaseY+(moving?Math.abs(Math.sin(gaitPhase))*0.035+footLift*.2:Math.sin(t*2)*.02);
}

function resolveCameraCollision(look,desired){const dir=desired.clone().sub(look),dist=dir.length();if(dist<.1)return desired;dir.normalize();cameraRay.set(look,dir);cameraRay.far=dist;const hits=cameraRay.intersectObjects(cameraBlockers,false);if(hits.length&&hits[0].distance<dist){return look.clone().addScaledVector(dir,Math.max(1.4,hits[0].distance-.4));}return desired;}
function updateCamera(dt,t){
  if(finalOrbit){const center=new THREE.Vector3(100,13.2,-106),r=16,a=t*.18+cameraUserYaw;const desired=new THREE.Vector3(center.x+Math.sin(a)*r,center.y+4.8+cameraPitch*3,center.z+Math.cos(a)*r);camera.position.lerp(desired,1-Math.exp(-dt*2.3));camera.lookAt(center);return;}
  if(cameraMode==='classroom'){
    if(!userCameraTouched)classroomOrbit+=dt*.085;const center=new THREE.Vector3(0,1.4,-116.2),r=7.5,a=classroomOrbit+cameraUserYaw;const desired=new THREE.Vector3(center.x+Math.sin(a)*r,5.2+cameraPitch*2.2,center.z+Math.cos(a)*r);const safe=resolveCameraCollision(center,desired);camera.position.lerp(safe,1-Math.exp(-dt*3.7));camera.lookAt(center);return;
  }
  if(cameraMode==='rooftop'){
    const center=new THREE.Vector3(100,10.8,-105),r=13.5,a=.9+cameraUserYaw;const desired=new THREE.Vector3(center.x+Math.sin(a)*r,14.0+cameraPitch*2.5,center.z+Math.cos(a)*r);camera.position.lerp(desired,1-Math.exp(-dt*3.2));camera.lookAt(new THREE.Vector3(100,10.8,-105));return;
  }
  const target=controlled===carRoot?carRoot:teacherRoot,f=lastForward.clone().normalize(),dist=controlled===carRoot?Math.max(10,cameraZoom+2):cameraZoom,height=(controlled===carRoot?5.2:4.6)+cameraPitch*3.0;
  const back=f.clone().multiplyScalar(-dist).applyAxisAngle(UP,cameraUserYaw);const look=target.position.clone().addScaledVector(f,controlled===carRoot?2.7:2.0).add(new THREE.Vector3(0,controlled===carRoot?1.25:1.45,0));const desired=target.position.clone().add(back).add(new THREE.Vector3(0,height,0));const safe=resolveCameraCollision(look,desired);camera.position.lerp(safe,1-Math.exp(-dt*4.8));camera.lookAt(look);
}

function action(){
  if(busy)return;
  if(stage===0){animMode='jump';startMove(route('jump'),6,()=>{setStage(1);showDialogue(DIALOGUES.garden);});}
  else if(stage===1){startMove(route('garden'),7,()=>setStage(2));}
  else if(stage===2){startMove(route('toSchool'),8,()=>{setStage(3);showDialogue(DIALOGUES.school);});}
  else if(stage===3){openSchoolGate(()=>startMove(route('enterClass'),6.6,()=>{setStage(4);animMode='teach';faceDirection(new THREE.Vector3(0,0,1));cameraMode='classroom';cameraUserYaw=0;classroomOrbit=Math.PI;userCameraTouched=false;showDialogue(DIALOGUES.classroom);}));}
  else if(stage===4){animMode='teach';cameraMode='classroom';ui.classPanel.classList.remove('hidden');ui.action.style.display='none';showDialogue(DIALOGUES.classroom);}
  else if(stage===6){cameraMode='follow';startMove(route('toFather'),4.8,()=>holdForWish(7,DIALOGUES.father,2600));}
  else if(stage===7){startMove(route('stairs1'),4.3,()=>holdForWish(8,DIALOGUES.olderBrother,2600),'stairs');}
  else if(stage===8){startMove(route('toYounger'),4.1,()=>holdForWish(9,DIALOGUES.youngerBrother,2600));}
  else if(stage===9){showDialogue(DIALOGUES.upstairs);cameraMode='follow';startMove(route('stairs2'),4.2,()=>{cameraMode='rooftop';faceDirection(new THREE.Vector3(0,0,-1));setBusy(true);animMode='receive';blooms.forEach((b,i)=>setTimeout(()=>{b.userData.birth=performance.now();b.userData.growing=true;},i*110));setTimeout(()=>{finalOrbit=true;ui.finalPanel.classList.remove('hidden');showDialogue(DIALOGUES.finale);setBusy(false);},TREE_WISHES.length*110+900);},'stairs');}
}
ui.action.addEventListener('click',action);
ui.dismissClass.addEventListener('click',()=>{ui.classPanel.classList.add('hidden');ui.action.style.display='flex';setStage(5);showDialogue(DIALOGUES.afterClass);cameraMode='follow';cameraUserYaw=0;userCameraTouched=false;startMove(route('exitClass'),6.2,()=>{teacherRoot.visible=false;carRoot.visible=true;carRoot.position.copy(teacherRoot.position);controlled=carRoot;startDrive(route('driveHome'),18.5,()=>{carRoot.visible=false;teacherRoot.visible=true;teacherRoot.position.copy(vec(ROUTES.driveHome.at(-1)));controlled=teacherRoot;faceDirection(new THREE.Vector3(0,0,-1));animMode='idle';setStage(6);showDialogue(DIALOGUES.home);});});});
ui.replay.addEventListener('click',()=>location.reload());

let dragging=false,lastPX=0,lastPY=0;
canvas.addEventListener('pointerdown',e=>{dragging=true;lastPX=e.clientX;lastPY=e.clientY;canvas.setPointerCapture?.(e.pointerId);userCameraTouched=true;});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastPX,dy=e.clientY-lastPY;lastPX=e.clientX;lastPY=e.clientY;cameraUserYaw-=dx*.006;cameraPitch=THREE.MathUtils.clamp(cameraPitch-dy*.003,-.28,.72);});
canvas.addEventListener('pointerup',()=>{dragging=false;});canvas.addEventListener('pointercancel',()=>{dragging=false;});
canvas.addEventListener('wheel',e=>{cameraZoom=THREE.MathUtils.clamp(cameraZoom+Math.sign(e.deltaY)*.7,5.5,13.5);e.preventDefault();},{passive:false});

function applyQAStage(n){const map={0:[0,4.75,10],4:[0,.18,-121.2],6:[96,.18,-97],7:[95.8,.18,-105],8:[96,4.58,-105],9:[103,4.58,-105]};if(!map[n])return;teacherRoot.position.copy(vec(map[n]));teacherRoot.visible=true;carRoot.visible=false;stage=n;setStage(n);setBusy(false);if(n===4){faceDirection(new THREE.Vector3(0,0,1));cameraMode='classroom';classroomOrbit=Math.PI;}else if(n===9){cameraMode='rooftop';}else{cameraMode='follow';faceDirection(new THREE.Vector3(0,0,-1));}}

buildWorld();loadAssets();teacherRoot.position.copy(vec(ROUTES.intro[0]));camera.position.set(0,9.5,25);faceDirection(new THREE.Vector3(0,0,-1));animMode='wave';
const qaStage=new URLSearchParams(location.search).get('qaStage');
if(qaStage!==null){setTimeout(()=>applyQAStage(Number(qaStage)),900);}else{setTimeout(()=>startMove(route('intro'),3.2,()=>{setStage(0);animMode='wave';showDialogue(DIALOGUES.intro);}),350);}
setTimeout(()=>{ui.loading.classList.add('done');window.__APP_READY__=true;},700);
function loop(){requestAnimationFrame(loop);const dt=Math.min(.04,clock.getDelta()),t=clock.elapsedTime;updateGate(dt);updateMovement(dt);animateTeacher(t);updateHearts(dt);for(const b of blooms){if(b.userData.growing){const k=Math.min(1,(performance.now()-b.userData.birth)/620),e=1-Math.pow(1-k,3);b.scale.setScalar(e);if(k>=1)b.userData.growing=false;}}if(portal){portal.rotation.z+=dt*.28;portal.scale.setScalar(1+Math.sin(t*2)*.025);}updateCamera(dt,t);renderer.render(scene,camera);}loop();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<760?1:1.35));renderer.setSize(innerWidth,innerHeight);});
