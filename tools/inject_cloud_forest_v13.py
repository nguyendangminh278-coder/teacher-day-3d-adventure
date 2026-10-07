#!/usr/bin/env python3
from pathlib import Path
import re
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'src/main.js')
s = path.read_text(encoding='utf-8')

if '/* V13_CLOUD_FOREST */' in s:
    print('V13 cloud forest already injected')
    raise SystemExit(0)

anchor = 'function showDialogue'
if anchor not in s:
    raise SystemExit('V13 injection failed: showDialogue anchor not found')

v13 = r'''/* V13_CLOUD_FOREST */
const v13Wind=[];
const v13CloudDrift=[];
let v13Built=false;

function v13WindRegister(o,strength=.05,phase=0){
  if(!o)return o;
  o.userData.v13BaseX=o.rotation.x;
  o.userData.v13BaseZ=o.rotation.z;
  o.userData.v13WindStrength=strength;
  o.userData.v13WindPhase=phase||v12Rand((o.id||1)*1.73)*Math.PI*2;
  v13Wind.push(o);
  return o;
}
function v13Plant(key,x,z,h,seed=1,scale=.95,strength=null){
  const o=v12Plant(key,outdoorWorld,x,z,h,seed,scale);
  if(!o)return null;
  const st=strength ?? (key.includes('tree')?.024:key.includes('bush')?.048:key.includes('grass')?.11:key.includes('flower')?.085:.035);
  return v13WindRegister(o,st,v12Rand(seed+811)*Math.PI*2);
}
function v13CloudDeck(){
  const geom=new THREE.SphereGeometry(1,10,7),mat=M(0xfffcf8,.96,0),count=286;
  const inst=new THREE.InstancedMesh(geom,mat,count),d=new THREE.Object3D();
  inst.castShadow=false;inst.receiveShadow=true;
  for(let i=0;i<count;i++){
    const z=8-v12Rand(930+i)*154;
    const lane=(i%2?-1:1),spread=5+v12Rand(1400+i)*28;
    const x=lane*spread+(v12Rand(1800+i)-.5)*5;
    const near=Math.max(0,1-Math.abs(x)/35);
    d.position.set(x,-2.0-v12Rand(2100+i)*.85,z);
    d.rotation.y=v12Rand(2400+i)*Math.PI;
    d.scale.set(3.7+v12Rand(2600+i)*4.9,1.05+near*.45,2.6+v12Rand(3000+i)*3.8);
    d.updateMatrix();inst.setMatrixAt(i,d.matrix);
  }
  outdoorWorld.add(inst);
  // Fill the exact center-line gaps underneath the route so the lower half never reads as blue void.
  const center=new THREE.InstancedMesh(geom,mat,72),c=new THREE.Object3D();center.castShadow=false;center.receiveShadow=true;
  for(let i=0;i<72;i++){
    const z=7-i*2.05;
    c.position.set((i%3-1)*1.8,-2.25,z);
    c.rotation.y=(i*.73)%Math.PI;
    c.scale.set(4.6+(i%4)*.35,1.15,3.4+(i%3)*.4);
    c.updateMatrix();center.setMatrixAt(i,c.matrix);
  }
  outdoorWorld.add(center);
}
function v13MeadowRibbon(){
  const geom=new THREE.CylinderGeometry(1,1,.28,24),mat=M(0x88b967,.92,0),d=new THREE.Object3D();
  const segs=[];
  let k=0;
  for(let z=-8;z>=-78;z-=4.4){
    for(const side of [-1,1]){
      const wave=Math.sin((z+20)*.13+side)*1.25;
      segs.push([side*(9.2+wave),-.42,z,6.75,4.15,side*.06]);
      if(k%2===0)segs.push([side*(18.0+wave*.7),-.56,z-1.1,8.7,5.0,side*.1]);
    }
    k++;
  }
  // Broad cloud-meadow apron around the school approach.
  for(let z=-78;z>=-107;z-=5.2){
    segs.push([-13.5,-.42,z,10.5,4.9,-.04],[13.5,-.42,z,10.5,4.9,.04]);
  }
  const inst=new THREE.InstancedMesh(geom,mat,segs.length);
  inst.castShadow=false;inst.receiveShadow=true;
  segs.forEach((p,i)=>{d.position.set(p[0],p[1],p[2]);d.rotation.y=p[5];d.scale.set(p[3],1,p[4]);d.updateMatrix();inst.setMatrixAt(i,d.matrix);});
  outdoorWorld.add(inst);
}
function v13ForestPath(){
  const control=[
    new THREE.Vector3(0,.075,-8),new THREE.Vector3(-.9,.075,-18),new THREE.Vector3(.75,.075,-30),
    new THREE.Vector3(-.7,.075,-42),new THREE.Vector3(.8,.075,-54),new THREE.Vector3(-.55,.075,-66),new THREE.Vector3(0,.075,-78)
  ];
  const curve=new THREE.CatmullRomCurve3(control,false,'catmullrom',.35),samples=120,width=4.7;
  const pos=[],uv=[],idx=[];
  for(let i=0;i<=samples;i++){
    const t=i/samples,p=curve.getPoint(t),tan=curve.getTangent(Math.min(.999,t)).normalize(),side=new THREE.Vector3(-tan.z,0,tan.x).normalize();
    const wobble=.18*Math.sin(i*.33);
    const l=p.clone().addScaledVector(side,width*.5+wobble),r=p.clone().addScaledVector(side,-width*.5-wobble);
    pos.push(l.x,l.y,l.z,r.x,r.y,r.z);uv.push(0,t*8,1,t*8);
    if(i<samples){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const m=new THREE.MeshStandardMaterial({color:0xb9aa75,roughness:.98,metalness:0});
  const trail=new THREE.Mesh(g,m);trail.receiveShadow=true;trail.castShadow=false;outdoorWorld.add(trail);

  // Soft moss shoulders keep the trail visually embedded in the forest, like the Quaternius reference.
  const shoulderMat=M(0x9ec77b,.94,0),sg=new THREE.SphereGeometry(1,12,7),inst=new THREE.InstancedMesh(sg,shoulderMat,54),d=new THREE.Object3D();
  for(let i=0;i<27;i++)for(const side of [-1,1]){
    const t=i/26,p=curve.getPoint(t),tan=curve.getTangent(Math.min(.999,t)).normalize(),sv=new THREE.Vector3(-tan.z,0,tan.x).normalize();
    const q=p.clone().addScaledVector(sv,side*(width*.62+1.05+v12Rand(3500+i*3+(side>0?1:0))*.8));
    d.position.set(q.x,-.18,q.z);d.rotation.y=v12Rand(3700+i)*Math.PI;d.scale.set(1.65+v12Rand(3900+i)*1.2,.20,1.5+v12Rand(4100+i)*.9);d.updateMatrix();inst.setMatrixAt(i*2+(side>0?1:0),d.matrix);
  }
  inst.castShadow=false;inst.receiveShadow=true;outdoorWorld.add(inst);
}
function v13DenseUnderstory(){
  let seed=5100;
  for(let z=-10;z>-76;z-=3.8){
    for(const side of [-1,1]){
      const nearX=side*(4.3+v12Rand(seed)*2.4),farX=side*(8.0+v12Rand(seed+1)*5.0);
      v13Plant((seed%4===0)?'bushUltimate':'grassSmall',nearX,z+(v12Rand(seed+2)-.5)*2.1,.48+v12Rand(seed+3)*.8,seed,.92,(seed%4===0)?.048:.115);
      v13Plant(seed%3===0?'flowerPink':'grassSmall',side*(5.2+v12Rand(seed+4)*3.4),z-1.5+(v12Rand(seed+5)-.5)*2.5,.42+v12Rand(seed+6)*.55,seed+20,.88,seed%3===0?.085:.105);
      if(seed%2===0)v13Plant(seed%5===0?'birch':(seed%3===0?'treeTwisted':'treeCommon'),farX,z+(v12Rand(seed+7)-.5)*3.0,6.4+v12Rand(seed+8)*4.2,seed+40,.96,.024);
      if(seed%3===0)v13Plant('rock',side*(5.6+v12Rand(seed+9)*2.4),z+(v12Rand(seed+10)-.5)*2.1,.55+v12Rand(seed+11)*.45,seed+60,.9,.015);
      seed+=17;
    }
  }
  // Dense framing at the school gate, but leave the central corridor open.
  for(const side of [-1,1])for(let i=0;i<8;i++){
    const x=side*(7.8+i*1.75),z=-74-i*.8;
    v13Plant(i%3===0?'treeCommon':(i%2?'bushUltimate':'grassSmall'),x,z,i%3===0?7.2+i*.25:1.0+i*.04,6900+i+(side>0?50:0),.95,i%3===0?.023:(i%2?.048:.11));
  }
}
function v13CloudLife(){
  const specs=[[-29,9,-20,4.2], [31,13,-35,4.8],[-35,16,-56,5.1],[34,11,-72,4.5],[-30,15,-96,5.4],[30,18,-116,5.7],[0,23,-150,7.0]];
  specs.forEach((p,i)=>{const g=v11LowPolyCloud(outdoorWorld,p[0],p[1],p[2],p[3],41+i);g.userData.v13BaseX=p[0];g.userData.v13BaseY=p[1];g.userData.v13Phase=i*1.17;g.userData.v13Speed=.035+i*.004;v13CloudDrift.push(g);});
}
function v13BuildCloudForest(){
  if(v13Built)return;v13Built=true;
  v13CloudDeck();v13MeadowRibbon();v13ForestPath();v13DenseUnderstory();v13CloudLife();
  // Upgrade the existing V12 trees and bushes from barely moving to a layered breeze.
  for(const o of v12Sway){
    if(v13Wind.includes(o))continue;
    const b=new THREE.Box3().setFromObject(o),sz=new THREE.Vector3();b.getSize(sz);
    v13WindRegister(o,sz.y>4?.022:(sz.y>1.4?.045:.10),v12Rand((o.id||1)+7200)*Math.PI*2);
  }
  scene.background=new THREE.Color(0xeef8ff);scene.fog=new THREE.Fog(0xeef8ff,58,185);
  if(ui.assetStatus)ui.assetStatus.textContent='V13 · rừng trên mây liền mạch · gió lay cây cỏ · bước chân nhún nhảy';
}
function loadV13CloudForest(){
  if(v13Built)return;
  if(typeof v12Plant!=='function'||typeof v11LowPolyCloud!=='function'||!v12Built){setTimeout(loadV13CloudForest,320);return;}
  v13BuildCloudForest();
}
function updateV13CloudForest(dt,t){
  if(currentSpace==='outdoor'){
    const gust=.62+.23*Math.sin(t*.37)+.15*Math.sin(t*1.31+.8);
    for(const o of v13Wind){
      const st=o.userData.v13WindStrength||.04,ph=o.userData.v13WindPhase||0;
      const slow=Math.sin(t*(.78+st*2.2)+ph),fast=Math.sin(t*2.25+ph*1.73)*.26;
      const bend=(slow+fast)*st*gust;
      o.rotation.z=o.userData.v13BaseZ+bend;
      o.rotation.x=o.userData.v13BaseX+bend*.42;
    }
    for(const c of v13CloudDrift){const ph=c.userData.v13Phase||0;c.position.x=c.userData.v13BaseX+Math.sin(t*c.userData.v13Speed*6.283+ph)*3.4;c.position.y=c.userData.v13BaseY+Math.sin(t*.12+ph)*.35;}
  }
}
'''

s = s.replace(anchor, v13 + '\n' + anchor, 1)

# Replace the basic walk cycle with a cheerful, lightly skipping gait. The root route remains unchanged,
# so QA/colliders stay deterministic while the visible character bounces and swings more expressively.
new_anim = r'''function animateTeacher(t){
  const p=teacherParts;if(!p.armL||!p.armR||!p.legL||!p.legR)return;
  const moving=['walk','run','stairs','jump'].includes(animMode);
  const amp=animMode==='run'?.82:animMode==='stairs'?.38:animMode==='jump'?.66:.56;
  const s=moving?Math.sin(gaitPhase)*amp:0;
  p.legL.rotation.x=s;p.legR.rotation.x=-s;p.armL.rotation.x=-s*.92;p.armR.rotation.x=s*.92;
  p.armL.rotation.z=0;p.armR.rotation.z=0;
  if(animMode==='wave'){p.armR.rotation.z=-1.5;p.armR.rotation.x=-.35+Math.sin(t*8)*.22;}
  else if(animMode==='teach'){p.armR.rotation.z=-.65;p.armR.rotation.x=-.25+Math.sin(t*2.6)*.22;p.armL.rotation.z=.18;}
  else if(animMode==='receive'){p.armL.rotation.z=.7;p.armR.rotation.z=-.7;p.armL.rotation.x=-.35;p.armR.rotation.x=-.35;}
  const step=moving?Math.abs(Math.sin(gaitPhase)):0;
  const joy=moving?(0.88+.18*Math.sin(gaitPhase*.5+.7)):1;
  const hop=moving?Math.pow(step,1.55)*(animMode==='run'?.145:animMode==='jump'?.19:animMode==='stairs'?.075:.105)*joy:Math.sin(t*2)*.018;
  if(p.body){p.body.rotation.z=moving?Math.sin(gaitPhase*.5)*.035:0;p.body.rotation.x=moving?-.035+Math.cos(gaitPhase*2)*.018:0;}
  if(p.head){p.head.rotation.z=(moving?Math.sin(gaitPhase*.5)*.024:0)+Math.sin(t*1.5)*.014;p.head.rotation.x=moving?-Math.cos(gaitPhase*2)*.018:0;}
  teacherVisual.position.y=teacherVisualBaseY+hop;
  teacherVisual.rotation.z=moving?Math.sin(gaitPhase)*.018:0;
  teacherVisual.rotation.x=moving?Math.cos(gaitPhase)*.012:0;
}'''

s, n = re.subn(r'function animateTeacher\(t\)\{.*?\}\n\nfunction resolveCamera', new_anim + '\n\nfunction resolveCamera', s, count=1, flags=re.S)
if n != 1:
    raise SystemExit('V13 injection failed: animateTeacher function not replaced')

# Start V13 after V12 assets/world are ready.
needle = 'setTimeout(loadV12DenseWorld,350);'
if needle in s:
    s = s.replace(needle, needle + 'setTimeout(loadV13CloudForest,950);', 1)
else:
    raise SystemExit('V13 injection failed: V12 loader anchor not found')

# Animate wind/clouds after V12's own subtle sway so V13 can apply the stronger final pose.
needle2 = 'updateCamera(dt,t);renderer.render(scene,camera);'
if needle2 in s:
    s = s.replace(needle2, 'updateV13CloudForest(dt,t);' + needle2, 1)
else:
    raise SystemExit('V13 injection failed: render loop anchor not found')

# Outdoor sky is intentionally near-white; cloud deck supplies depth instead of a flat blue void.
s = s.replace("scene.background=new THREE.Color(0xbfe2ff);scene.fog=new THREE.Fog(0xd7edff,105,330);", "scene.background=new THREE.Color(0xeef8ff);scene.fog=new THREE.Fog(0xeef8ff,58,185);")
s = s.replace("location.href=`${location.pathname}?v=10`", "location.href=`${location.pathname}?v=13`")

path.write_text(s, encoding='utf-8')
print('Injected V13 continuous cloud forest, winding meadow trail, stronger wind and cheerful skip gait')
