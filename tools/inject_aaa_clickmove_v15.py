#!/usr/bin/env python3
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'src/main.js')
s = path.read_text(encoding='utf-8')

if '/* V15_AAA_CLICKMOVE */' in s:
    print('V15 already injected')
    raise SystemExit(0)

# Post-processing / image based lighting imports.
anchor_import = "import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';"
extra_imports = """import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';"""
if anchor_import not in s:
    raise SystemExit('V15 injection failed: GLTFLoader import anchor not found')
s = s.replace(anchor_import, anchor_import + '\n' + extra_imports, 1)

# Quality tier is intentionally desktop-first. Mobile keeps the lighter renderer.
s = s.replace("let renderer;", "const V15_HQ=innerWidth>=900 && ((navigator.deviceMemory||8)>=4);\nlet renderer;", 1)
s = s.replace("innerWidth<760?1:1.35", "innerWidth<760?1.05:(V15_HQ?1.7:1.35)")
s = s.replace("renderer.toneMappingExposure=1.08;", "renderer.toneMappingExposure=1.18;", 1)
s = s.replace("renderer.shadowMap.enabled=innerWidth>=760;", "renderer.shadowMap.enabled=V15_HQ||innerWidth>=760;", 1)

# Environment lighting + post-processing composer.
clock_anchor = "const clock=new THREE.Clock(); const loader=new GLTFLoader(); const UP=new THREE.Vector3(0,1,0);"
if clock_anchor not in s:
    raise SystemExit('V15 injection failed: clock anchor not found')
composer_code = r'''const clock=new THREE.Clock(); const loader=new GLTFLoader(); const UP=new THREE.Vector3(0,1,0);
/* V15_AAA_CLICKMOVE */
const v15Pmrem=new THREE.PMREMGenerator(renderer);
const v15Room=new RoomEnvironment();
const v15Environment=v15Pmrem.fromScene(v15Room,.04).texture;
scene.environment=v15Environment;
if('environmentIntensity' in scene) scene.environmentIntensity=.72;
v15Room.dispose?.();v15Pmrem.dispose();
const v15Composer=V15_HQ?new EffectComposer(renderer):null;
let v15Bloom=null,v15FXAA=null;
if(v15Composer){
  v15Composer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
  v15Composer.setSize(innerWidth,innerHeight);
  v15Composer.addPass(new RenderPass(scene,camera));
  v15Bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.16,.42,.96);
  v15Composer.addPass(v15Bloom);
  v15FXAA=new ShaderPass(FXAAShader);
  const pr=Math.min(devicePixelRatio||1,1.7);
  v15FXAA.material.uniforms.resolution.value.set(1/(innerWidth*pr),1/(innerHeight*pr));
  v15Composer.addPass(v15FXAA);
  v15Composer.addPass(new OutputPass());
}
'''
s = s.replace(clock_anchor, composer_code, 1)

# Better shadows and soft cinematic fills.
mats_anchor = "const mats={}; const blockers={outdoor:[],house:[],finale:[]};"
if mats_anchor not in s:
    raise SystemExit('V15 injection failed: mats anchor not found')
lighting_code = r'''if(sun.castShadow){
  sun.shadow.mapSize.set(V15_HQ?2048:1024,V15_HQ?2048:1024);
  sun.shadow.bias=-.00018; sun.shadow.normalBias=.035; sun.shadow.radius=2;
}
const v15Fill=new THREE.DirectionalLight(0xffdff0,.42);v15Fill.position.set(28,24,18);scene.add(v15Fill);
const v15SkyFill=new THREE.DirectionalLight(0xdff4ff,.34);v15SkyFill.position.set(-18,18,-28);scene.add(v15SkyFill);
const v15HeroLight=new THREE.PointLight(0xffeef7,V15_HQ?4.2:2.2,14,2);scene.add(v15HeroLight);

''' + mats_anchor
s = s.replace(mats_anchor, lighting_code, 1)

# Avoid scripted-route snapping after the player has freely moved.
old_start = "function startMove(points,speed=8,onDone,mode=null,cam=null,keepDialogue=false){if(!keepDialogue)hideDialogue();const curve=new THREE.CatmullRomCurve3(points.map(p=>p.clone()),false,'catmullrom',.15);moveTask={curve,t:0,last:points[0].clone(),duration:Math.max(.8,curve.getLength()/speed),done:onDone};animMode=mode||(speed>7?'run':'walk');setBusy(true);controlled=teacherRoot;if(cam)cameraMode=cam;}"
new_start = "function startMove(points,speed=8,onDone,mode=null,cam=null,keepDialogue=false){if(!keepDialogue)hideDialogue();const source=points.map(p=>p.clone());if(source.length&&teacherRoot.position.distanceTo(source[0])>.32)source.unshift(teacherRoot.position.clone());const curve=new THREE.CatmullRomCurve3(source,false,'catmullrom',.15);moveTask={curve,t:0,last:source[0].clone(),duration:Math.max(.8,curve.getLength()/speed),done:onDone};animMode=mode||(speed>7?'run':'walk');setBusy(true);controlled=teacherRoot;if(cam)cameraMode=cam;}"
if old_start not in s:
    raise SystemExit('V15 injection failed: startMove anchor not found')
s = s.replace(old_start,new_start,1)

# Click-to-move, A* pathfinding and destination indicator.
show_anchor = 'function showDialogue'
if show_anchor not in s:
    raise SystemExit('V15 injection failed: showDialogue anchor not found')
v15_logic = r'''/* V15_AAA_CLICKMOVE_RUNTIME */
const v15Pointer=new THREE.Vector2(),v15NavPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),v15Hit=new THREE.Vector3();
let v15ClickTask=null;
const v15MoveMarker=new THREE.Group();
const v15Ring=new THREE.Mesh(new THREE.RingGeometry(.34,.52,42),new THREE.MeshBasicMaterial({color:0xff75b3,transparent:true,opacity:.92,side:THREE.DoubleSide,depthWrite:false}));
v15Ring.rotation.x=-Math.PI/2;v15MoveMarker.add(v15Ring);
const v15Dot=new THREE.Mesh(new THREE.CircleGeometry(.09,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false}));v15Dot.rotation.x=-Math.PI/2;v15Dot.position.y=.012;v15MoveMarker.add(v15Dot);v15MoveMarker.visible=false;actorLayer.add(v15MoveMarker);

function v15CanMove(){
  if(!teacherRoot.visible||carRoot.visible||finalOrbit||gateTask||houseDoorTask||driveTask||moveTask)return false;
  if([4,5,9].includes(stage))return false;
  return !busy||!!v15ClickTask;
}
function v15Bounds(){
  if(currentSpace==='house')return {minX:-7.2,maxX:7.2,minZ:-10.2,maxZ:6.3};
  if(currentSpace==='finale')return {minX:-8,maxX:8,minZ:-10,maxZ:6};
  if(stage<=1)return {minX:-7.4,maxX:7.4,minZ:-20,maxZ:16};
  return {minX:-7.5,maxX:7.5,minZ:-126,maxZ:7};
}
function v15WorldFromPointer(e){
  const r=canvas.getBoundingClientRect();
  v15Pointer.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
  cameraRay.setFromCamera(v15Pointer,camera);v15NavPlane.constant=-teacherRoot.position.y;
  return cameraRay.ray.intersectPlane(v15NavPlane,v15Hit)?v15Hit.clone():null;
}
function v15ObstacleBoxes(y){
  const out=[];
  for(const o of blockers[currentSpace]||[]){
    if(!o||!o.visible||!o.parent)continue;
    const b=new THREE.Box3().setFromObject(o);
    if(y<b.min.y-1.05||y>b.max.y+.7)continue;
    b.min.x-=.48;b.max.x+=.48;b.min.z-=.48;b.max.z+=.48;out.push(b);
  }
  return out;
}
function v15Pathfind(start,target){
  const B=v15Bounds(),step=.75,y=start.y,obs=v15ObstacleBoxes(y);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  target.x=clamp(target.x,B.minX,B.maxX);target.z=clamp(target.z,B.minZ,B.maxZ);target.y=y;
  const blocked=(x,z)=>obs.some(b=>x>b.min.x&&x<b.max.x&&z>b.min.z&&z<b.max.z);
  if(blocked(target.x,target.z)){
    let best=null,bd=1e9;
    for(let r=1;r<=7&&!best;r++)for(let ix=-r;ix<=r;ix++)for(let iz=-r;iz<=r;iz++){
      if(Math.abs(ix)!==r&&Math.abs(iz)!==r)continue;const x=target.x+ix*step,z=target.z+iz*step;
      if(x<B.minX||x>B.maxX||z<B.minZ||z>B.maxZ||blocked(x,z))continue;
      const d=ix*ix+iz*iz;if(d<bd){bd=d;best=new THREE.Vector3(x,y,z);}
    }
    if(!best)return null;target.copy(best);
  }
  const cols=Math.floor((B.maxX-B.minX)/step)+1,rows=Math.floor((B.maxZ-B.minZ)/step)+1;
  const toCell=p=>[Math.round((p.x-B.minX)/step),Math.round((p.z-B.minZ)/step)];
  const toWorld=(i,j)=>new THREE.Vector3(B.minX+i*step,y,B.minZ+j*step);
  const [si,sj]=toCell(start),[gi,gj]=toCell(target),key=(i,j)=>i+','+j;
  const gScore=new Map([[key(si,sj),0]]),came=new Map(),closed=new Set(),heap=[];
  const push=n=>{heap.push(n);let i=heap.length-1;while(i){let p=(i-1)>>1;if(heap[p].f<=heap[i].f)break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){let l=i*2+1,r=l+1,m=i;if(l<heap.length&&heap[l].f<heap[m].f)m=l;if(r<heap.length&&heap[r].f<heap[m].f)m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return top;};
  const H=(i,j)=>Math.hypot(gi-i,gj-j);push({i:si,j:sj,f:H(si,sj)});
  const dirs=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  let found=false,iter=0;
  while(heap.length&&iter++<8000){const n=pop(),k=key(n.i,n.j);if(closed.has(k))continue;closed.add(k);if(n.i===gi&&n.j===gj){found=true;break;}
    for(const [di,dj,cost] of dirs){const ni=n.i+di,nj=n.j+dj;if(ni<0||nj<0||ni>=cols||nj>=rows)continue;const p=toWorld(ni,nj);if(blocked(p.x,p.z))continue;
      if(di&&dj){const p1=toWorld(n.i+di,n.j),p2=toWorld(n.i,n.j+dj);if(blocked(p1.x,p1.z)||blocked(p2.x,p2.z))continue;}
      const nk=key(ni,nj),ng=(gScore.get(k)??1e9)+cost;if(ng>=(gScore.get(nk)??1e9))continue;gScore.set(nk,ng);came.set(nk,k);push({i:ni,j:nj,f:ng+H(ni,nj)});
    }
  }
  if(!found)return [start.clone(),target.clone()];
  const cells=[];let ck=key(gi,gj);cells.push([gi,gj]);while(ck!==key(si,sj)){ck=came.get(ck);if(!ck)break;const [a,b]=ck.split(',').map(Number);cells.push([a,b]);}cells.reverse();
  const raw=[start.clone(),...cells.slice(1).map(c=>toWorld(c[0],c[1])),target.clone()],simple=[raw[0]];
  let lastDir='';for(let i=1;i<raw.length-1;i++){const a=raw[i].clone().sub(raw[i-1]),b=raw[i+1].clone().sub(raw[i]);const d=Math.sign(a.x)+','+Math.sign(a.z),d2=Math.sign(b.x)+','+Math.sign(b.z);if(d!==d2||d!==lastDir)simple.push(raw[i]);lastDir=d;}simple.push(raw[raw.length-1]);return simple;
}
function v15StartClickPath(points,target){
  if(!points||points.length<2)return;hideDialogue();v15ClickTask={points,index:1,speed:8.8,v:1.2};controlled=teacherRoot;animMode='run';setBusy(true);cameraMode=currentSpace==='house'?'houseFollow':'follow';
  v15MoveMarker.position.set(target.x,target.y+.035,target.z);v15MoveMarker.visible=true;
}
function v15IssueMove(e){
  if(!v15CanMove())return;const p=v15WorldFromPointer(e);if(!p)return;const path=v15Pathfind(teacherRoot.position.clone(),p);if(path)v15StartClickPath(path,path[path.length-1]);
}
function v15UpdateClickMove(dt,t){
  if(v15MoveMarker.visible){const q=1+Math.sin(t*8)*.09;v15MoveMarker.scale.setScalar(q);v15Ring.material.opacity=.68+.22*Math.sin(t*5)*.5+.11;}
  if(!v15ClickTask)return;const task=v15ClickTask,target=task.points[task.index],delta=target.clone().sub(teacherRoot.position);delta.y=0;const dist=delta.length();
  if(dist<.09){task.index++;if(task.index>=task.points.length){v15ClickTask=null;animMode='idle';setBusy(false);setTimeout(()=>{if(!v15ClickTask)v15MoveMarker.visible=false;},220);return;}return;}
  const dir=delta.normalize(),finalLeg=task.index===task.points.length-1,desired=task.speed*(finalLeg?THREE.MathUtils.clamp(dist/.85,.32,1):1);task.v=THREE.MathUtils.lerp(task.v,desired,1-Math.exp(-dt*8));const d=Math.min(dist,task.v*dt);
  teacherRoot.position.addScaledVector(dir,d);faceDirection(dir);gaitPhase+=d*5.7;animMode=task.v>5.2?'run':'walk';
}
function v15PolishMaterials(){
  const aniso=Math.min(8,renderer.capabilities.getMaxAnisotropy?.()||1);
  scene.traverse(o=>{if(!o.isMesh)return;const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){if(!m||m.userData?.v15Polished)continue;m.userData=m.userData||{};for(const k of ['map','normalMap','roughnessMap','metalnessMap','aoMap'])if(m[k])m[k].anisotropy=aniso;if('envMapIntensity' in m)m.envMapIntensity=.9;m.userData.v15Polished=true;m.needsUpdate=true;}});
}
function v15UpdateRenderFX(dt,t){
  const hero=teacherRoot.visible?teacherRoot.position:carRoot.position;v15HeroLight.position.lerp(hero.clone().add(new THREE.Vector3(2.6,4.4,3.2)),1-Math.exp(-dt*4));
  if(v15Bloom)v15Bloom.strength=currentSpace==='finale'?.22:.14;
  const desiredFov=v15ClickTask?52:50;if(Math.abs(camera.fov-desiredFov)>.02){camera.fov=THREE.MathUtils.lerp(camera.fov,desiredFov,1-Math.exp(-dt*4));camera.updateProjectionMatrix();}
}
setTimeout(v15PolishMaterials,1300);setTimeout(v15PolishMaterials,3200);
'''
s = s.replace(show_anchor, v15_logic + '\n' + show_anchor, 1)

# Replace camera drag block: right-click issues movement commands, left-drag keeps 360 camera.
old_pointer = "let dragging=false,lastPX=0,lastPY=0;canvas.addEventListener('pointerdown',e=>{dragging=true;lastPX=e.clientX;lastPY=e.clientY;canvas.setPointerCapture?.(e.pointerId);userCameraTouched=true;});canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastPX,dy=e.clientY-lastPY;lastPX=e.clientX;lastPY=e.clientY;cameraUserYaw-=dx*.006;cameraPitch=THREE.MathUtils.clamp(cameraPitch-dy*.003,-.28,.72);});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);canvas.addEventListener('wheel',e=>{cameraZoom=THREE.MathUtils.clamp(cameraZoom+Math.sign(e.deltaY)*.7,5.3,13.5);e.preventDefault();},{passive:false});"
new_pointer = "let dragging=false,lastPX=0,lastPY=0;canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{if(e.button===2){e.preventDefault();v15IssueMove(e);return;}if(e.button!==0)return;dragging=true;lastPX=e.clientX;lastPY=e.clientY;canvas.setPointerCapture?.(e.pointerId);userCameraTouched=true;});canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastPX,dy=e.clientY-lastPY;lastPX=e.clientX;lastPY=e.clientY;cameraUserYaw-=dx*.006;cameraPitch=THREE.MathUtils.clamp(cameraPitch-dy*.003,-.28,.72);});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);canvas.addEventListener('wheel',e=>{cameraZoom=THREE.MathUtils.clamp(cameraZoom+Math.sign(e.deltaY)*.7,5.3,13.5);e.preventDefault();},{passive:false});"
if old_pointer not in s:
    raise SystemExit('V15 injection failed: pointer block not found')
s = s.replace(old_pointer,new_pointer,1)

# Run click locomotion and enhanced rendering every frame.
s = s.replace("updateDoors(dt);updateMovement(dt);animateTeacher(t);", "updateDoors(dt);v15UpdateClickMove(dt,t);updateMovement(dt);animateTeacher(t);v15UpdateRenderFX(dt,t);", 1)
s = s.replace("renderer.render(scene,camera);", "v15Composer?v15Composer.render():renderer.render(scene,camera);", 1)

# Composer + FXAA resize.
resize_old = "renderer.setSize(innerWidth,innerHeight);});"
resize_new = "renderer.setSize(innerWidth,innerHeight);if(v15Composer){const pr=Math.min(devicePixelRatio||1,1.7);v15Composer.setPixelRatio(pr);v15Composer.setSize(innerWidth,innerHeight);if(v15FXAA)v15FXAA.material.uniforms.resolution.value.set(1/(innerWidth*pr),1/(innerHeight*pr));}});"
if resize_old not in s:
    raise SystemExit('V15 injection failed: resize anchor not found')
s = s.replace(resize_old,resize_new,1)

# Cache/replay version.
s = s.replace("?v=14`", "?v=15`")

path.write_text(s,encoding='utf-8')
print('Injected V15 desktop cinematic renderer + right-click A* click-to-move controls')
