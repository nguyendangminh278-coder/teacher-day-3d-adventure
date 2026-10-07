import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CLASS_WISHES, TREE_WISHES, STAGES } from './config.js';

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
CLASS_WISHES.forEach(w => { const el=document.createElement('div'); el.className='wish-card'; el.textContent=w; ui.classWishes.appendChild(el); });

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (err) { ui.loading.classList.add('done'); ui.objectiveTitle.textContent='Không khởi tạo được 3D'; ui.objectiveText.textContent='Hãy bật Hardware Acceleration/WebGL trong trình duyệt rồi tải lại trang.'; throw err; }
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1 : 1.25));
renderer.setSize(innerWidth, innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=innerWidth>=760; renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene(); scene.background=new THREE.Color(0xbadfff); scene.fog=new THREE.Fog(0xcbe6f8,65,230);
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,500); const clock=new THREE.Clock(); const world=new THREE.Group(); scene.add(world);
scene.add(new THREE.HemisphereLight(0xffffff,0x8c746f,2.2));
const sun=new THREE.DirectionalLight(0xfff0d2,2.6); sun.position.set(-35,60,35); sun.castShadow=renderer.shadowMap.enabled;
if(sun.castShadow){sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-70;sun.shadow.camera.right=70;sun.shadow.camera.top=70;sun.shadow.camera.bottom=-70;} scene.add(sun);

const loader=new GLTFLoader(), mats={};
const M=(c,rough=.76,metal=0)=>mats[c]||(mats[c]=new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal}));
const mesh=(g,m,cast=true,receive=true)=>{const o=new THREE.Mesh(g,m);o.castShadow=renderer.shadowMap.enabled&&cast;o.receiveShadow=receive;return o;};
const box=(g,s,p,c)=>{const o=mesh(new THREE.BoxGeometry(...s),M(c));o.position.set(...p);g.add(o);return o;};
const sphere=(g,r,p,c,sc=[1,1,1])=>{const o=mesh(new THREE.SphereGeometry(r,16,10),M(c));o.position.set(...p);o.scale.set(...sc);g.add(o);return o;};
const cyl=(g,rt,rb,h,p,c,seg=12)=>{const o=mesh(new THREE.CylinderGeometry(rt,rb,h,seg),M(c));o.position.set(...p);g.add(o);return o;};
function canvasLabel(text,w=768,h=160,fg='#8b4d62',bg='rgba(255,250,250,.92)',font=46){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle=bg;x.beginPath();if(x.roundRect)x.roundRect(8,8,w-16,h-16,28);else x.rect(8,8,w-16,h-16);x.fill();x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';x.font=`800 ${font}px system-ui`;x.fillText(text,w/2,h/2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(w/110,h/110,1);return s;}
function cloud(x,y,z,s=1){const g=new THREE.Group();[[0,0,0,1.2],[1,.1,.1,.85],[-1,.1,.15,.82],[.25,.5,0,.75],[-.35,.42,.1,.65]].forEach(v=>sphere(g,.9,[v[0],v[1],v[2]],0xfffbf8,[1.35*v[3],.72*v[3],v[3]]));g.position.set(x,y,z);g.scale.setScalar(s);world.add(g);return g;}
function flower(x,z,s=1,c=0xff8daf,y=0){const g=new THREE.Group();cyl(g,.035,.045,.55,[0,.28,0],0x5f9b56,7);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;sphere(g,.13,[Math.cos(a)*.15,.64,Math.sin(a)*.15],c,[1.1,.65,.75]);}sphere(g,.08,[0,.64,0],0xffd56a);g.position.set(x,y,z);g.scale.setScalar(s);world.add(g);return g;}
function person(x,y,z,shirt=0xf39bb5,hair=0x3b2a27,s=1){const g=new THREE.Group();cyl(g,.35,.44,1.15,[0,.7,0],shirt,12);sphere(g,.38,[0,1.55,0],0xf1c5a7);sphere(g,.4,[0,1.72,-.06],hair,[1,.5,1]);cyl(g,.1,.11,.65,[-.2,.1,0],0xd8ab8c,8);cyl(g,.1,.11,.65,[.2,.1,0],0xd8ab8c,8);g.position.set(x,y,z);g.scale.setScalar(s);world.add(g);return g;}
function primitiveMascot(){const g=new THREE.Group();sphere(g,.68,[0,1.15,0],0xfff6ed,[1,1.02,.9]);sphere(g,.55,[0,2,.02],0xfff9f1,[1.03,.95,.92]);sphere(g,.06,[-.18,2.08,.49],0x292323);sphere(g,.06,[.18,2.08,.49],0x292323);box(g,[.65,.72,.3],[0,1.15,-.58],0x8b6346);cyl(g,.035,.04,.26,[0,2.58,0],0x5f9c55,7);sphere(g,.15,[-.11,2.73,0],0x70b863,[1.3,.5,.7]);sphere(g,.15,[.12,2.73,0],0x70b863,[1.3,.5,.7]);return g;}

let stage=0,busy=false,mascotRoot,mascotVisual,carRoot,carVisual,controlled,moveTask=null,driveTask=null;
let mascotMixer=null,actions=new Map(),activeAction=null,portal=null,treeRoot=null,bloomItems=[];
let cameraYaw=0,lastForward=new THREE.Vector3(0,0,-1),introSettled=false,introTime=0;
const START=new THREE.Vector3(0,5.5,12), PARKING=new THREE.Vector3(14,.15,-82), HOME=new THREE.Vector3(93,.15,-100);
function makeMascotRoot(){const r=new THREE.Group();mascotVisual=primitiveMascot();mascotVisual.scale.setScalar(.72);r.add(mascotVisual);world.add(r);return r;}
function makeCarRoot(){const r=new THREE.Group(),g=new THREE.Group();box(g,[3.4,.85,5],[0,.75,0],0xec8b95);box(g,[2.6,1.25,2.4],[0,1.62,-.2],0xf0a0a5);box(g,[2.18,.65,.08],[0,1.72,1.02],0x9bc7d8);[[-1.45,.42,1.55],[1.45,.42,1.55],[-1.45,.42,-1.5],[1.45,.42,-1.5]].forEach(p=>{const w=cyl(g,.38,.38,.34,p,0x333035,14);w.rotation.z=Math.PI/2;});g.scale.setScalar(.8);r.add(g);carVisual=g;world.add(r);r.visible=false;return r;}
function normalizeModel(model,targetHeight=2.5){const b=new THREE.Box3().setFromObject(model),sz=new THREE.Vector3();b.getSize(sz);model.scale.setScalar(targetHeight/Math.max(sz.y,.001));const b2=new THREE.Box3().setFromObject(model),c2=new THREE.Vector3();b2.getCenter(c2);model.position.x-=c2.x;model.position.z-=c2.z;model.position.y-=b2.min.y;}
function loadAssets(){
  ui.assetStatus.textContent='Đang nạp mascot 3D CC0…';
  loader.load('./assets/models/mascot.gltf',gltf=>{const m=gltf.scene;normalizeModel(m,2.45);m.traverse(o=>{if(o.isMesh){o.castShadow=renderer.shadowMap.enabled;o.receiveShadow=true;}});mascotRoot.remove(mascotVisual);mascotVisual=m;mascotRoot.add(m);mascotMixer=new THREE.AnimationMixer(m);gltf.animations.forEach(c=>actions.set(c.name.toLowerCase(),mascotMixer.clipAction(c)));playAnim('idle');ui.assetStatus.textContent='Mascot Quaternius CC0 · xe Kenney CC0';},undefined,()=>{ui.assetStatus.textContent='Mascot fallback đang hoạt động';});
  loader.load('./assets/models/sedan.glb',gltf=>{const m=gltf.scene;normalizeModel(m,2.1);m.rotation.y=Math.PI/2;carRoot.remove(carVisual);carVisual=m;carRoot.add(m);},undefined,()=>{});
}
function findAction(want){const ws=Array.isArray(want)?want:[want];for(const w of ws){const q=w.toLowerCase();for(const [n,a] of actions){if(n===q||n.includes(q))return a;}}return actions.values().next().value||null;}
function playAnim(want,fade=.2){if(!mascotMixer)return;const next=findAction(want);if(!next||next===activeAction)return;next.reset().fadeIn(fade).play();if(activeAction)activeAction.fadeOut(fade);activeAction=next;}

function buildWorld(){
  for(let i=0;i<24;i++)cloud((i%6-2.5)*15+(i%2)*4,5+(i%4)*2.2,28-i*9,.7+(i%3)*.28);
  portal=new THREE.Group();const ring=mesh(new THREE.TorusGeometry(3,.24,14,54),new THREE.MeshStandardMaterial({color:0x916cff,emissive:0x714cff,emissiveIntensity:2.5,roughness:.3}));portal.add(ring);const disk=mesh(new THREE.CircleGeometry(2.75,48),new THREE.MeshBasicMaterial({color:0x140f29}),false,false);disk.position.z=-.04;portal.add(disk);portal.position.set(0,8,16);world.add(portal);cloud(0,4.3,10,2);
  const title=canvasLabel('Chúc mừng mẹ ngày Nhà giáo Việt Nam 20/11',1000,150,'#d3577e','rgba(255,249,249,.94)',43);title.position.set(0,10.2,8);world.add(title);
  const island=cyl(world,8,4,1.8,[0,-1.05,-9],0xd4c09e,26);island.receiveShadow=true;box(world,[14,.35,34],[0,-.1,-17],0xddeec8);box(world,[6,.16,54],[0,.1,-48],0xf1d9c4);
  for(let z=-5;z>-76;z-=2.3){flower(-3.7+Math.sin(z)*.35,z,.68,(Math.round(Math.abs(z))%4===0?0xf7cd6f:0xff8dad));flower(3.7+Math.cos(z)*.35,z,.68,(Math.round(Math.abs(z))%5===0?0xaa91ff:0xff8dad));}
  box(world,[1.1,6,1.1],[-6,3,-79],0xedd3aa);box(world,[1.1,6,1.1],[6,3,-79],0xedd3aa);box(world,[13,1,1],[0,6,-79],0xedd3aa);const schoolSign=canvasLabel('TRƯỜNG TIỂU HỌC HOA MÂY',900,130,'#396d92','rgba(255,252,239,.98)',48);schoolSign.position.set(0,6.3,-78.4);world.add(schoolSign);
  box(world,[24,7,5],[0,3.5,-88],0xf2d2a8);for(let x=-8;x<=8;x+=5.3)box(world,[3.5,2.3,.3],[x,3.6,-85.35],0xcfe6f4);
  box(world,[15,.22,30],[0,.02,-99],0xe6d7c7);box(world,[.35,3.2,29],[-7.5,1.6,-99],0xf5e5d4);box(world,[.35,3.2,29],[7.5,1.6,-99],0xf5e5d4);
  box(world,[19,.22,18],[0,.02,-118],0xd5b689);box(world,[19,5,.35],[0,2.5,-127],0xe3c19e);box(world,[.35,5,18],[-9.5,2.5,-118],0xf0d7bc);box(world,[.35,5,18],[9.5,2.5,-118],0xf0d7bc);box(world,[10,3,.15],[0,3,-126.75],0x3e6e5a);
  const board=canvasLabel('Cảm ơn cô vì đã luôn ở đây!',800,130,'#fff4df','rgba(0,0,0,0)',43);board.position.set(0,3,-126.55);world.add(board);person(0,.1,-124.8,0xf39ab6,0x372824,1.15);
  for(let r=0;r<4;r++)for(let c=0;c<5;c++){const x=(c-2)*3.2,z=-112-r*3.2;box(world,[2.45,.16,1.1],[x,.95,z],0xb9825b);person(x,.15,z-.15,c%2?0xe8f2ff:0xfff9ef,0x3a2a27,.62);}
  box(world,[9,.18,35],[14,.05,-96],0x716c6c);box(world,[80,.18,9],[52,.05,-113],0x716c6c);box(world,[9,.18,25],[90,.05,-103],0x716c6c);for(let x=18;x<88;x+=6){flower(x,-118,.65,0xff9ab8);flower(x,-108,.65,0xffcf73);}
  for(let f=0;f<3;f++){const y=f*4;box(world,[18,.3,12],[98,y,-106],0xcaa47d);box(world,[.35,4,12],[89,y+2,-106],0xf3e2cf);box(world,[.35,4,12],[107,y+2,-106],0xf3e2cf);box(world,[18,4,.35],[98,y+2,-112],0xecd8c1);}box(world,[18,.35,12],[98,12,-106],0xcaa47d);person(96,.25,-105,0x8fa6b8,0x302b29,.95);person(95,4.2,-105,0x70a8dc,0x352c29,.78);person(101,4.2,-105,0x79b8e1,0x352c29,.78);
  const stairMat=M(0xd9bd9e);for(let f=0;f<3;f++)for(let i=0;i<7;i++){const st=mesh(new THREE.BoxGeometry(1.2,.25,2),stairMat);st.position.set(91+i*1.15,f*4+i*.5,-101.2);world.add(st);}
  treeRoot=new THREE.Group();world.add(treeRoot);treeRoot.position.set(99,8,-108);const branch=(a,b,r1=.42,r2=.09)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),o=mesh(new THREE.CylinderGeometry(r2,r1,d.length(),9),M(0x785139));o.position.copy(A.clone().add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());treeRoot.add(o);};
  branch([0,-8,0],[0,4,0],1.05,.55);branch([0,1,0],[-4,7,0],.45,.12);branch([0,1.8,0],[4.2,7.2,0],.45,.12);branch([0,2.5,0],[-1.2,10,0],.35,.09);branch([0,2.8,0],[1.6,10.2,0],.35,.09);
  [[-5,7],[-2.5,9],[0,7.5],[2.6,9],[5,7],[-1,11],[1,11]].forEach(([x,y])=>{sphere(treeRoot,2.1,[x,y,0],0xb57487,[1.2,.85,1]);for(let j=0;j<6;j++){const b=sphere(treeRoot,.18,[x+(Math.random()-.5)*2.8,y+(Math.random()-.5)*2,1.7+(Math.random()-.5)],[0xffabc4,0xffd4df,0xffefbd][j%3]);b.scale.setScalar(.001);bloomItems.push(b);}});
  TREE_WISHES.slice(0,10).forEach((w,i)=>{const s=canvasLabel(w,520,105,'#b55878','rgba(255,245,249,.96)',33),a=i/10*Math.PI*2;s.position.set(99+Math.cos(a)*(5+i%3),18+(i%4)*1.1,-106+Math.sin(a)*3);s.scale.setScalar(.001);world.add(s);bloomItems.push(s);});const homeLabel=canvasLabel('NHÀ CỦA MẸ',600,120,'#8a5562','rgba(255,246,240,.94)',44);homeLabel.position.set(98,12.7,-100);world.add(homeLabel);
}

function resetGame(){stage=0;busy=true;moveTask=null;driveTask=null;introSettled=false;introTime=0;ui.classPanel.classList.add('hidden');ui.finalPanel.classList.add('hidden');ui.action.style.display='flex';mascotRoot.visible=true;carRoot.visible=false;mascotRoot.position.set(0,8,15.3);mascotRoot.rotation.set(0,Math.PI,0);controlled=mascotRoot;playAnim('jump');bloomItems.forEach(o=>o.scale.setScalar(.001));setUI();camera.position.set(0,9.5,25);lastForward.set(0,0,-1);}
function updateIntro(dt){if(introSettled)return;introTime=Math.min(1,introTime+dt/1.55);const t=introTime,e=1-Math.pow(1-t,3);mascotRoot.position.set(0,8+(START.y-8)*e,15.3+(START.z-15.3)*e);mascotRoot.position.y+=Math.sin(t*Math.PI)*1.2;if(t>=1){introSettled=true;busy=false;mascotRoot.position.copy(START);playAnim('idle');setUI();showDialogue('Mầm Nhỏ','Xin chào! Từ đây mình sẽ chạy xuyên suốt cả hành trình, không đổi màn hình nữa.');}}
function setUI(){const s=STAGES[stage];ui.stageNumber.textContent=stage+1;ui.objectiveTitle.textContent=s.title;ui.objectiveText.textContent=s.text;ui.actionLabel.textContent=s.action;ui.action.disabled=busy;}
function setStage(n,msg){stage=n;busy=false;setUI();if(msg)showDialogue('Mầm Nhỏ',msg);}
function showDialogue(name,text){ui.dialogueName.textContent=name;ui.dialogueText.textContent=text;ui.dialogue.classList.remove('hidden');clearTimeout(showDialogue.t);showDialogue.t=setTimeout(()=>ui.dialogue.classList.add('hidden'),4200);}
function walk(points,speed=5,anim='run',done){busy=true;setUI();moveTask={obj:mascotRoot,points:points.map(p=>new THREE.Vector3(...p)),i:0,speed,done,jump:anim==='jump'};playAnim(anim==='jump'?['jump','run']:anim);}
function drive(points,speed=13,done){busy=true;setUI();const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.35);driveTask={curve,t:0,speed,length:curve.getLength(),done};controlled=carRoot;}
function finishMove(task){moveTask=null;playAnim('idle');const f=task.done;busy=false;f&&f();setUI();}
function updateMove(dt){if(!moveTask)return;const t=moveTask,target=t.points[t.i],o=t.obj,d=target.clone().sub(o.position),dist=d.length();if(dist<.16){t.i++;if(t.i>=t.points.length){finishMove(t);return;}}else{const dir=d.normalize(),step=Math.min(dist,t.speed*dt);o.position.addScaledVector(dir,step);lastForward.lerp(new THREE.Vector3(dir.x,0,dir.z).normalize(),.18);o.rotation.y=Math.atan2(dir.x,dir.z);if(t.jump)o.position.y=Math.max(target.y,target.y+Math.sin(Math.min(1,1-dist/18)*Math.PI)*2.3);}}
function updateDrive(dt){if(!driveTask)return;const d=driveTask;d.t=Math.min(1,d.t+(d.speed/d.length)*dt);const p=d.curve.getPointAt(d.t),tan=d.curve.getTangentAt(Math.min(.999,d.t+.002)).normalize();carRoot.position.copy(p);carRoot.rotation.y=Math.atan2(tan.x,tan.z);lastForward.lerp(new THREE.Vector3(tan.x,0,tan.z).normalize(),.15);if(d.t>=1){const f=d.done;driveTask=null;busy=false;f&&f();setUI();}}

function advance(){
  if(busy)return;
  if(stage===0)walk([[0,7,9],[0,4,-1],[0,.15,-6]],7,'jump',()=>setStage(1,'Đã hạ cánh! Chạy tiếp qua khu vườn trên mây nhé.'));
  else if(stage===1)walk([[0,.15,-13],[1,.15,-20],[0,.15,-28]],5.5,'run',()=>setStage(2,'Phía trước là cổng trường. Camera luôn bám sau mình như game góc nhìn thứ ba.'));
  else if(stage===2)walk([[0,.15,-42],[-1,.15,-58],[0,.15,-72],[0,.15,-77]],7,'run',()=>setStage(3,'Đến cổng trường rồi. Mình sẽ chạy xuyên qua sân và hành lang.'));
  else if(stage===3)walk([[0,.15,-84],[0,.15,-96],[0,.15,-107],[0,.15,-113]],6,'run',()=>{setStage(4,'Chúng ta đã thực sự đi vào lớp học. 25 lời chúc đang chờ mẹ.');ui.action.style.display='none';setTimeout(()=>ui.classPanel.classList.remove('hidden'),350);});
  else if(stage===4){ui.classPanel.classList.remove('hidden');ui.action.style.display='none';}
  else if(stage===6)walk([[91,.15,-100],[96,.15,-101],[97,2,-101],[97,4,-101],[102,5,-101],[103,8,-102],[99,11.4,-104]],4.5,'walk',()=>setStage(7,'Đã lên tầng 3. Chạm lần cuối để cây điều ước nở rộ!'));
  else if(stage===7){busy=true;ui.action.disabled=true;const start=performance.now(),bloom=now=>{const t=Math.min(1,(now-start)/3000);bloomItems.forEach((o,i)=>{const q=Math.max(0,Math.min(1,(t-i*.012)*1.8)),s=q<1?1+3.2*Math.pow(q-1,3)+2.2*Math.pow(q-1,2):1;o.scale.setScalar(Math.max(.001,s*(o.isSprite?1:.75)));});if(t<1)requestAnimationFrame(bloom);else{busy=false;ui.action.style.display='none';ui.finalPanel.classList.remove('hidden');}};requestAnimationFrame(bloom);}
}
ui.action.addEventListener('click',advance);
canvas.addEventListener('pointerdown',()=>{if(!busy&&ui.classPanel.classList.contains('hidden')&&ui.finalPanel.classList.contains('hidden')&&ui.action.style.display!=='none')advance();});
ui.dismissClass.addEventListener('click',()=>{ui.classPanel.classList.add('hidden');stage=5;setUI();ui.action.style.display='none';showDialogue('Mầm Nhỏ','Tan lớp rồi. Mình sẽ chạy ra xe rồi lái thẳng về nhà.');walk([[0,.15,-107],[0,.15,-95],[0,.15,-84],[8,.15,-82],[14,.15,-82]],7,'run',()=>{mascotRoot.visible=false;carRoot.visible=true;carRoot.position.copy(PARKING);controlled=carRoot;drive([[14,.15,-82],[14,.15,-100],[20,.15,-113],[48,.15,-113],[76,.15,-113],[90,.15,-110],[90,.15,-102],[93,.15,-100]],15,()=>{carRoot.visible=false;mascotRoot.visible=true;mascotRoot.position.copy(HOME);controlled=mascotRoot;setStage(6,'Về tới nhà rồi! Bố ở tầng 1, hai anh ở tầng 2. Cùng chạy lên tầng 3 nhé.');ui.action.style.display='flex';});});});
ui.replay.addEventListener('click',resetGame);
window.addEventListener('pointermove',e=>{cameraYaw=((e.clientX/innerWidth)-.5)*.8;});window.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!busy)advance();});window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<760?1:1.25));});
function updateCamera(dt){if(!controlled)return;const p=controlled.position,dist=controlled===carRoot?11:8.5,height=controlled===carRoot?5.2:4.2;let f=lastForward.clone();if(f.lengthSq()<.1)f.set(0,0,-1);const yaw=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),cameraYaw),back=f.clone().applyQuaternion(yaw).multiplyScalar(-dist),desired=p.clone().add(back).add(new THREE.Vector3(0,height,0));camera.position.lerp(desired,1-Math.pow(.004,dt));camera.lookAt(p.clone().add(f.clone().multiplyScalar(4)).add(new THREE.Vector3(0,1.7,0)));}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);updateIntro(dt);updateMove(dt);updateDrive(dt);updateCamera(dt);if(mascotMixer)mascotMixer.update(dt);if(portal)portal.rotation.z+=dt*.25;renderer.render(scene,camera);}
buildWorld();mascotRoot=makeMascotRoot();carRoot=makeCarRoot();resetGame();animate();window.__APP_READY__=true;requestAnimationFrame(()=>setTimeout(()=>ui.loading.classList.add('done'),350));loadAssets();
