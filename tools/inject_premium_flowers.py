#!/usr/bin/env python3
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'src/main.js')
s = path.read_text(encoding='utf-8')

if '/* V11_VISUAL_POLISH */' in s:
    print('V11 polish already injected')
    raise SystemExit(0)

anchor = "function showDialogue"
if anchor not in s:
    raise SystemExit('v11 injection failed: showDialogue anchor not found')

v11 = r'''/* V11_VISUAL_POLISH */
const v11Assets={};
const v11Floaters=[];
const v11Motes=[];
const v11Fans=[];
let v11Decorated=false;

function v11LoadModel(key,url){
  return new Promise(resolve=>loader.load(url,g=>{v11Assets[key]=g.scene;resolve(true);},undefined,()=>resolve(false)));
}
function v11FitClone(key,parent,pos,target=1,mode='height',rotY=0,scaleMul=1,shadow=false){
  const src=v11Assets[key];if(!src)return null;
  const c=src.clone(true);c.rotation.y=rotY;
  let b=new THREE.Box3().setFromObject(c),sz=new THREE.Vector3();b.getSize(sz);
  const base=mode==='width'?Math.max(sz.x,sz.z):sz.y;
  const sc=target/Math.max(base,.001)*scaleMul;c.scale.setScalar(sc);
  b=new THREE.Box3().setFromObject(c);const center=new THREE.Vector3();b.getCenter(center);
  c.position.set(pos[0]-center.x,pos[1]-b.min.y,pos[2]-center.z);
  c.traverse(o=>{if(o.isMesh){o.castShadow=renderer.shadowMap.enabled&&shadow;o.receiveShadow=true;o.frustumCulled=true;}});
  parent.add(c);return c;
}
function v11LowPolyCloud(parent,x,y,z,s=1,phase=0){
  const g=new THREE.Group();
  const top=new THREE.MeshBasicMaterial({color:0xfffdf8});
  const shade=new THREE.MeshBasicMaterial({color:0xddeaff});
  const geo=new THREE.IcosahedronGeometry(1,1);
  [[0,0,0,1.45],[1.25,.05,.05,1.0],[-1.15,.02,.08,.92],[.35,.62,.03,.92],[-.45,.52,.1,.78],[1.85,-.08,.08,.62],[-1.75,-.08,.1,.58]].forEach((v,i)=>{
    const m=new THREE.Mesh(geo,i>4?shade:top);m.position.set(v[0],v[1],v[2]);m.scale.set(1.25*v[3],.62*v[3],.92*v[3]);m.rotation.set((i*.37)%1,(i*.61)%1,(i*.23)%1);g.add(m);
  });
  g.position.set(x,y,z);g.scale.setScalar(s);g.userData.baseY=y;g.userData.phase=phase;parent.add(g);v11Floaters.push(g);return g;
}
function v11MoteField(parent,count,center,spread,color=0xffd7e7,size=.12){
  const geom=new THREE.BufferGeometry(),arr=new Float32Array(count*3),speed=new Float32Array(count);
  for(let i=0;i<count;i++){arr[i*3]=center[0]+(Math.random()-.5)*spread[0];arr[i*3+1]=center[1]+Math.random()*spread[1];arr[i*3+2]=center[2]+(Math.random()-.5)*spread[2];speed[i]=.25+Math.random()*.45;}
  geom.setAttribute('position',new THREE.BufferAttribute(arr,3));
  const pts=new THREE.Points(geom,new THREE.PointsMaterial({color,size,transparent:true,opacity:.76,depthWrite:false,sizeAttenuation:true}));pts.userData={center,spread,speed};parent.add(pts);v11Motes.push(pts);return pts;
}
function v11Bunting(parent,x,y,z,length=10){
  const colors=[0xff8eb3,0xffd56a,0x91d8ff,0xbca7ff,0x9be1b0];
  const rope=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,length,6),new THREE.MeshBasicMaterial({color:0xffffff}));rope.rotation.z=Math.PI/2;rope.position.set(x,y,z);parent.add(rope);
  for(let i=0;i<11;i++){const flag=new THREE.Mesh(new THREE.ConeGeometry(.18,.42,3),new THREE.MeshBasicMaterial({color:colors[i%colors.length]}));flag.position.set(x-length/2+i*(length/10),y-.22,z);flag.rotation.z=Math.PI;parent.add(flag);}
}
function v11DecorateOutdoor(){
  // Chadderbox-inspired low-poly cloud silhouettes: unlit, stretched, rotated and gently drifting.
  const cloudSpots=[[-13,5,-10,1.6],[14,6,-24,1.9],[-15,5.5,-43,1.7],[15,6.5,-61,1.65],[-22,8,-88,2.3],[22,7,-91,2.2],[22,5,-112,1.7],[-22,6,-119,1.9],[70,8,-104,2.5],[91,6,-95,1.8]];
  cloudSpots.forEach((p,i)=>v11LowPolyCloud(outdoorWorld,p[0],p[1],p[2],p[3],i*.73));

  const trees=[[-9,0,-18,7.5,.3],[10,0,-31,8.2,-.5],[-9.5,0,-49,7.1,.8],[10.5,0,-64,7.7,-.3],[-20,0,-84,9,.4],[20,0,-85,8.5,-.6],[-21,0,-101,8,.2],[21,0,-100,8.7,-.4]];
  trees.forEach((p,i)=>v11FitClone(i%3===0?'birch':'treeCommon',outdoorWorld,[p[0],p[1],p[2]],p[3],'height',p[4],1,false));
  [[-12,0,-37,6.2],[12,0,-53,6.5],[-17,0,-74,6.8],[18,0,-73,6.4]].forEach((p,i)=>v11FitClone('treeTwisted',outdoorWorld,[p[0],p[1],p[2]],p[3],'height',i*.9,1,false));

  for(let z=-11,i=0;z>-73;z-=4.3,i++){
    v11FitClone(i%2?'flowerPink':'flowerYellow',outdoorWorld,[-4.9,0,z],.72,'height',i*.62,.9,false);
    v11FitClone(i%2?'flowerYellow':'flowerPink',outdoorWorld,[4.9,0,z-1.2],.68,'height',-i*.53,.86,false);
    if(i%2===0){v11FitClone('fern',outdoorWorld,[-6.0,0,z-.7],.72,'height',i*.3,.9,false);v11FitClone('bushFlowers',outdoorWorld,[6.4,0,z-1.8],1.0,'height',i*.4,.95,false);}
  }
  [[-8.4,0,-76.7],[8.4,0,-76.7],[-17,0,-80],[17,0,-80]].forEach((p,i)=>v11FitClone(i<2?'bushUltimate':'bushFlowers',outdoorWorld,p,1.2,'height',i*.8,1,false));
  [[-11,0,-25],[11,0,-45],[-12,0,-67],[15,0,-90]].forEach((p,i)=>v11FitClone('rock',outdoorWorld,p,.72,'height',i,1,false));
  [[-7,0,-15],[7,0,-34],[-7,0,-57],[7,0,-69]].forEach((p,i)=>v11FitClone('mushroom',outdoorWorld,p,.48,'height',i*.7,1,false));

  // School yard and classroom details.
  v11FitClone('bench',outdoorWorld,[-19,0,-79],1.0,'height',Math.PI/2,1,false);
  v11FitClone('bench',outdoorWorld,[19,0,-79],1.0,'height',-Math.PI/2,1,false);
  for(let z=-84;z>-101;z-=4.2){v11FitClone('fence',outdoorWorld,[-18.3,0,z],1.25,'height',0,1,false);v11FitClone('fence',outdoorWorld,[18.3,0,z],1.25,'height',0,1,false);}
  v11Bunting(outdoorWorld,0,5.55,-105.7,12);
  v11FitClone('bookcase',outdoorWorld,[-8.5,.12,-124.3],3.2,'height',Math.PI/2,.9,false);
  v11FitClone('plant',outdoorWorld,[8.5,.12,-124],1.45,'height',0,1,false);
  v11FitClone('books',outdoorWorld,[1.35,.72,-121.6],.42,'height',.2,1,false);
  v11FitClone('laptop',outdoorWorld,[-1.25,.72,-121.6],.38,'height',Math.PI,1,false);
  const fan=v11FitClone('ceilingFan',outdoorWorld,[0,4.45,-116.4],2.8,'width',0,1,false);if(fan)v11Fans.push(fan);
  v11MoteField(outdoorWorld,85,[0,1.2,-40],[28,7,75],0xfff2b8,.10);
}
function v11DecorateHouse(){
  // Ground floor living room: keep the central route and stairs completely clear.
  v11FitClone('sofa',houseWorld,[-6.4,0,-3.8],1.45,'height',Math.PI/2,1,false);
  v11FitClone('coffee',houseWorld,[-4.7,0,-2.6],.72,'height',0,1,false);
  v11FitClone('rug',houseWorld,[-4.7,.02,-2.6],4.1,'width',0,1,false);
  v11FitClone('floorLamp',houseWorld,[-7.3,0,3.8],2.35,'height',0,1,false);
  v11FitClone('bookcase',houseWorld,[7.3,0,3.7],3.3,'height',-Math.PI/2,1,false);
  v11FitClone('tv',houseWorld,[7.2,.1,-3.7],1.7,'height',-Math.PI/2,1,false);
  v11FitClone('plant',houseWorld,[7.2,0,-5.1],1.55,'height',0,1,false);
  v11FitClone('sideTable',houseWorld,[5.9,0,-3.8],.8,'height',0,1,false);
  // Second floor feels lived in but leaves both family encounter points and stair paths open.
  v11FitClone('desk',houseWorld,[6.3,4.5,4.5],1.05,'height',Math.PI,1,false);
  v11FitClone('chair',houseWorld,[6.1,4.5,3.0],1.15,'height',0,1,false);
  v11FitClone('books',houseWorld,[5.7,5.45,4.45],.42,'height',0,1,false);
  v11FitClone('lounge',houseWorld,[-6.6,4.5,-4.0],1.35,'height',Math.PI/2,1,false);
  v11FitClone('plant',houseWorld,[-7.0,4.5,4.8],1.35,'height',0,.9,false);
  v11Bunting(houseWorld,0,8.25,-6.0,9.5);
  const warm=new THREE.PointLight(0xffd2a6,2.8,18,2);warm.position.set(0,3.8,1.5);houseWorld.add(warm);
}
function v11DecorateFinale(){
  [[-8,0,-4,7.8,.4],[8,0,-5,7.2,-.5],[-9,0,5,6.5,.7],[9,0,4,6.8,-.8]].forEach((p,i)=>v11FitClone(i%2?'birch':'treeCommon',finaleWorld,[p[0],p[1],p[2]],p[3],'height',p[4],1,false));
  for(let a=0,i=0;a<Math.PI*2;a+=Math.PI/8,i++){const r=5.5+(i%3)*.65,x=Math.cos(a)*r,z=-1+Math.sin(a)*r;v11FitClone(i%2?'flowerPink':'flowerYellow',finaleWorld,[x,.02,z],.78,'height',a,.95,false);if(i%3===0)v11FitClone('bushUltimate',finaleWorld,[Math.cos(a)*(r+1.6),0,-1+Math.sin(a)*(r+1.6)],1.15,'height',-a,.95,false);}
  [[-5,0,1],[5,0,2],[-4,0,-7],[4.5,0,-7]].forEach((p,i)=>v11FitClone(i%2?'mushroom':'fern',finaleWorld,p,.62,'height',i,.95,false));
  [[-6,0,-1],[6,0,-.5],[-2,0,-8],[3,0,-8]].forEach((p,i)=>v11FitClone('rock',finaleWorld,p,.65,'height',i*.8,1,false));
  for(let i=0;i<9;i++)v11LowPolyCloud(finaleWorld,-10+i*2.6,1.4+Math.sin(i)*.4,-10-(i%2)*2,.9+(i%3)*.12,i*.6);
  v11MoteField(finaleWorld,140,[0,.6,-1],[20,11,18],0xffd2e7,.14);
  v11MoteField(finaleWorld,65,[0,2,-1],[15,8,14],0xfff0a8,.10);
  const glow=new THREE.PointLight(0xffb5d1,4.2,22,2);glow.position.set(0,5,-1);finaleWorld.add(glow);
}
function v11Decorate(){if(v11Decorated)return;v11Decorated=true;v11DecorateOutdoor();v11DecorateHouse();v11DecorateFinale();ui.assetStatus.textContent='V11 · Quaternius CC0 · nội thất Kenney · mây low-poly sống động';}
function loadV11Polish(){
  const q='./assets/models/v11/quaternius/',k='./assets/models/v11/kenney/';
  const defs={
    flowerPink:q+'flower_pink.glb',flowerYellow:q+'flower_yellow.glb',bushFlowers:q+'bush_flowers.glb',treeCommon:q+'tree_common.glb',treeTwisted:q+'tree_twisted.glb',fern:q+'fern.glb',mushroom:q+'mushroom.glb',rock:q+'rock.glb',bushUltimate:q+'bush_ultimate.glb',birch:q+'birch.glb',
    bench:k+'bench.glb',fence:k+'fence.glb',books:k+'books.glb',bookcase:k+'bookcase.glb',plant:k+'pottedplant.glb',laptop:k+'laptop.glb',ceilingFan:k+'ceilingfan.glb',sofa:k+'sofa.glb',coffee:k+'coffee-table.glb',rug:k+'rug.glb',floorLamp:k+'floor-lamp.glb',tv:k+'tv.glb',sideTable:k+'side-table.glb',desk:k+'desk.glb',chair:k+'chair.glb',lounge:k+'lounge-chair.glb'
  };
  Promise.allSettled(Object.entries(defs).map(([key,url])=>v11LoadModel(key,url))).then(v11Decorate);
}
function updateV11Polish(dt,t){
  for(const g of v11Floaters){g.position.y=g.userData.baseY+Math.sin(t*.34+g.userData.phase)*.18;g.rotation.y+=dt*.007;}
  for(const f of v11Fans)f.rotation.y+=dt*2.2;
  for(const pts of v11Motes){const a=pts.geometry.attributes.position.array,{center,spread,speed}=pts.userData;for(let i=0;i<speed.length;i++){a[i*3+1]+=dt*speed[i];a[i*3]+=Math.sin(t*.8+i)*dt*.025;if(a[i*3+1]>center[1]+spread[1])a[i*3+1]=center[1];}pts.geometry.attributes.position.needsUpdate=true;pts.rotation.y=Math.sin(t*.06)*.08;}
}
'''

s = s.replace(anchor, v11 + "\n" + anchor, 1)

start_anchor = "buildWorlds();loadAssets();setSpace('outdoor');"
if start_anchor not in s:
    raise SystemExit('v11 injection failed: startup anchor not found')
s = s.replace(start_anchor, "buildWorlds();loadAssets();loadV11Polish();setSpace('outdoor');", 1)

loop_anchor = "updateDoors(dt);updateMovement(dt);animateTeacher(t);updateHearts(dt);updateBlooms();"
if loop_anchor not in s:
    raise SystemExit('v11 injection failed: loop anchor not found')
s = s.replace(loop_anchor, loop_anchor + "updateV11Polish(dt,t);", 1)

s = s.replace("?v=10`);", "?v=11`);", 1)
path.write_text(s, encoding='utf-8')
print(f'Injected V11 visual polish into {path}')
