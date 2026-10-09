#!/usr/bin/env python3
from pathlib import Path
import sys

path=Path(sys.argv[1] if len(sys.argv)>1 else 'src/main.js')
s=path.read_text(encoding='utf-8')
if '/* V17_FULL_PHOTOREAL_REPLACEMENT */' in s:
    print('V17 already injected'); raise SystemExit(0)

imp="import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';"
if imp not in s: raise SystemExit('V17: RGBELoader import missing; apply V16 first')
s=s.replace(imp,imp+"\nimport { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';",1)

anchor='function showDialogue'
if anchor not in s: raise SystemExit('V17: showDialogue anchor missing')
v17=r'''/* V17_FULL_PHOTOREAL_REPLACEMENT */
const v17TextureLoader=new THREE.TextureLoader();
const v17Static=new THREE.Group();outdoorWorld.add(v17Static);
const v17HouseStatic=new THREE.Group();houseWorld.add(v17HouseStatic);
const v17Sway=[];
let v17SSAO=null,v17Ready=false;

function v17Tex(url,color=false){
  return new Promise((resolve,reject)=>v17TextureLoader.load(url,t=>{if(color)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy?.()||1);resolve(t);},undefined,reject));
}
function v17PBR(base,normal,rough,repeat=[2,2],opts={}){
  [base,normal,rough].forEach(t=>t&&t.repeat.set(repeat[0],repeat[1]));
  return new THREE.MeshStandardMaterial({map:base,normalMap:normal,roughnessMap:rough,roughness:opts.roughness??.78,metalness:opts.metalness??0,envMapIntensity:opts.env??1.35,color:opts.color??0xffffff});
}
function v17Plane(parent,w,h,x,y,z,mat,vertical=false,rotY=0){
  const g=new THREE.PlaneGeometry(w,h,1,1),m=new THREE.Mesh(g,mat);m.position.set(x,y,z);m.rotation.x=vertical?0:-Math.PI/2;m.rotation.y=rotY;m.receiveShadow=true;m.castShadow=false;parent.add(m);return m;
}
function v17Box(parent,size,pos,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function v17Glass(parent,w,h,x,y,z,rotY=0){
  const mat=new THREE.MeshPhysicalMaterial({color:0xdff5ff,roughness:.09,metalness:0,transparent:true,opacity:.48,transmission:.18,thickness:.05,envMapIntensity:2.1,side:THREE.DoubleSide});
  const m=v17Plane(parent,w,h,x,y,z,mat,true,rotY);m.renderOrder=2;return m;
}
function v17Normalize(root,targetY){
  const b=new THREE.Box3().setFromObject(root),sz=new THREE.Vector3();b.getSize(sz);root.scale.setScalar(targetY/Math.max(sz.y,.001));const b2=new THREE.Box3().setFromObject(root);root.position.y-=b2.min.y;root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){if(!m)continue;if('envMapIntensity' in m)m.envMapIntensity=1.45;if(m.map)m.map.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy?.()||1);}}});
}
function v17Clone(src,parent,pos,scale=1,rot=0,sway=false){const c=src.clone(true);c.position.set(pos[0],pos[1],pos[2]);c.scale.multiplyScalar(scale);c.rotation.y=rot;parent.add(c);if(sway)v17Sway.push({o:c,base:rot,p:Math.random()*6.28,a:.006+Math.random()*.008});return c;}

async function v17BuildArchitecture(){
  try{
    const [cb,cn,cr,bb,bn,br,pb,pn,pr]=await Promise.all([
      v17Tex('./assets/v17/materials/concrete_floor/basecolor.jpg',true),v17Tex('./assets/v17/materials/concrete_floor/normal.jpg'),v17Tex('./assets/v17/materials/concrete_floor/roughness.jpg'),
      v17Tex('./assets/v17/materials/brick_wall_003/basecolor.jpg',true),v17Tex('./assets/v17/materials/brick_wall_003/normal.jpg'),v17Tex('./assets/v17/materials/brick_wall_003/roughness.jpg'),
      v17Tex('./assets/v16/materials/white_plaster_02/basecolor.jpg',true),v17Tex('./assets/v16/materials/white_plaster_02/normal.jpg'),v17Tex('./assets/v16/materials/white_plaster_02/roughness.jpg')]);
    const concrete=v17PBR(cb,cn,cr,[5.5,8],{roughness:.9,env:.9}),brick=v17PBR(bb,bn,br,[4.3,3.1],{roughness:.8,env:1}),plaster=v17PBR(pb,pn,pr,[4,2.4],{roughness:.82,env:1});

    // A grounded, scan-textured school forecourt begins only after the cloud road reaches the gate.
    v17Plane(v17Static,18,26,0,.075,-93,concrete,false);
    // Detailed school facade: two real-material wings with a completely open center so the route never clips a wall.
    v17Box(v17Static,[8,6.6,.34],[-7.2,3.3,-83.7],plaster);
    v17Box(v17Static,[8,6.6,.34],[7.2,3.3,-83.7],plaster);
    v17Box(v17Static,[22,.55,.55],[0,6.45,-83.7],brick);
    for(const x of [-8.7,-5.8,5.8,8.7]){
      v17Glass(v17Static,2.15,2.15,x,3.55,-83.5);
      const frameMat=new THREE.MeshStandardMaterial({color:0xf7fafc,roughness:.42,metalness:.15,envMapIntensity:1.4});
      v17Box(v17Static,[2.35,.1,.08],[x,4.64,-83.43],frameMat);v17Box(v17Static,[2.35,.1,.08],[x,2.47,-83.43],frameMat);
      v17Box(v17Static,[.1,2.25,.08],[x-1.12,3.55,-83.43],frameMat);v17Box(v17Static,[.1,2.25,.08],[x+1.12,3.55,-83.43],frameMat);
    }
    // Classroom walls receive scanned plaster and the open right-hand exit remains unobstructed.
    v17Plane(v17Static,19.5,5.7,0,2.92,-126.28,plaster,true);
    v17Plane(v17Static,8.2,5.5,-10.03,2.85,-116.5,plaster,true,Math.PI/2);
    // High ceiling so the 360-degree classroom camera stays inside the room instead of clipping through it.
    v17Box(v17Static,[20.2,.18,20.2],[0,6.38,-116.5],plaster);
    const lightMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff7df,emissiveIntensity:2.6,roughness:.22});
    for(const x of [-3.4,3.4])for(const z of [-112.8,-119.2])v17Box(v17Static,[2.9,.08,.32],[x,6.22,z],lightMat);
    // Real glass in the classroom side opening.
    v17Glass(v17Static,5.8,3.45,10.05,3.05,-115,Math.PI/2);

    // House exterior/interior microdetail. These are decorative skins, not collision geometry.
    v17Plane(v17Static,15.4,5.8,100,3.15,-95.48,plaster,true);
    for(const x of [94.3,105.7])v17Glass(v17Static,2.35,2.25,x,3.45,-95.26);
    v17Plane(v17HouseStatic,17.6,8.5,0,4.55,-6.46,plaster,true);
    v17Ready=true;
  }catch(e){console.warn('V17 architecture PBR unavailable',e);}
}

function v17LoadModels(){
  loader.load('./assets/v17/models/school_desk.glb',g=>{const src=g.scene;v17Normalize(src,.88);DESKS.forEach((d,i)=>{const x=(d.min[0]+d.max[0])/2,z=(d.min[2]+d.max[2])/2;v17Clone(src,outdoorWorld,[x,.11,z],1,Math.PI);});},undefined,e=>console.warn('V17 desk model unavailable',e));
  loader.load('./assets/v17/models/school_chair.glb',g=>{const src=g.scene;v17Normalize(src,.92);DESKS.forEach((d,i)=>{const x=(d.min[0]+d.max[0])/2,z=(d.min[2]+d.max[2])/2;v17Clone(src,outdoorWorld,[x,.10,z+1.08],.92,Math.PI);});},undefined,e=>console.warn('V17 chair model unavailable',e));
  loader.load('./assets/v17/models/island_tree.glb',g=>{const src=g.scene;v17Normalize(src,7.7);for(const p of [[-13,.05,-14],[12.7,.05,-26],[-12.7,.05,-46],[13.2,.05,-62],[-12.4,.05,-71]])v17Clone(src,outdoorWorld,p,.88+Math.random()*.18,Math.random()*6.28,true);},undefined,e=>console.warn('V17 island tree unavailable',e));
  loader.load('./assets/v17/models/pine_tree.glb',g=>{const src=g.scene;v17Normalize(src,8.8);for(const p of [[13.5,.05,-11],[-13.5,.05,-31],[12.8,.05,-49],[-13.3,.05,-61]])v17Clone(src,outdoorWorld,p,.85+Math.random()*.18,Math.random()*6.28,true);},undefined,e=>console.warn('V17 pine tree unavailable',e));
  loader.load('./assets/v17/models/potted_plant.glb',g=>{const src=g.scene;v17Normalize(src,1.15);for(const p of [[6.7,.18,-4.6],[-6.8,.18,-4.7],[6.8,4.68,-4.4]])v17Clone(src,houseWorld,p,.9,Math.random()*6.28,true);},undefined,e=>console.warn('V17 potted plant unavailable',e));
}

function v17AddContactShadow(){
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,4,64,64,60);g.addColorStop(0,'rgba(70,76,84,.26)');g.addColorStop(.55,'rgba(90,94,100,.12)');g.addColorStop(1,'rgba(110,116,124,0)');x.fillStyle=g;x.fillRect(0,0,128,128);const tex=new THREE.CanvasTexture(c);const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:.85});const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.55),mat);m.rotation.x=-Math.PI/2;m.renderOrder=1;m.userData.v17Shadow=true;actorLayer.add(m);return m;
}
const v17ContactShadow=v17AddContactShadow();

function v17EnhanceRenderer(){
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  if(THREE.AgXToneMapping!==undefined)renderer.toneMapping=THREE.AgXToneMapping;
  renderer.toneMappingExposure=1.18;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  if(sun.castShadow&&V15_HQ){sun.shadow.mapSize.set(4096,4096);sun.shadow.camera.near=.5;sun.shadow.camera.far=190;sun.shadow.bias=-.00012;sun.shadow.normalBias=.025;}
  if(v15Composer&&V15_HQ){
    try{v17SSAO=new SSAOPass(scene,camera,innerWidth,innerHeight);v17SSAO.kernelRadius=12;v17SSAO.minDistance=.004;v17SSAO.maxDistance=.11;v15Composer.insertPass(v17SSAO,1);}catch(e){console.warn('V17 SSAO unavailable',e);}
  }
}

function updateV17RealWorld(dt,t){
  for(const q of v17Sway)q.o.rotation.z=Math.sin(t*.72+q.p)*q.a;
  if(v17ContactShadow){v17ContactShadow.visible=teacherRoot.visible&&currentSpace!=='finale';v17ContactShadow.position.set(teacherRoot.position.x,teacherRoot.position.y+.018,teacherRoot.position.z);v17ContactShadow.rotation.z=-teacherRoot.rotation.y;}
  renderer.toneMappingExposure=THREE.MathUtils.lerp(renderer.toneMappingExposure,currentSpace==='outdoor'?1.16:1.25,1-Math.exp(-dt*2.2));
  if(v16SkyEnv)scene.environment=v16SkyEnv;
  if(v17Ready&&ui.assetStatus&&!ui.assetStatus.textContent.startsWith('V17'))ui.assetStatus.textContent='V17 · HDRI + PBR scan + model CC0 thật + SSAO + click-to-move';
}
function v17Init(){v17EnhanceRenderer();v17BuildArchitecture();v17LoadModels();}
setTimeout(v17Init,1450);
'''
s=s.replace(anchor,v17+'\n'+anchor,1)

needle='updateV16PhotorealWorld(dt,t);'
if needle not in s: raise SystemExit('V17: V16 update hook missing')
s=s.replace(needle,needle+'updateV17RealWorld(dt,t);',1)
s=s.replace("location.href=`${location.pathname}?v=16`","location.href=`${location.pathname}?v=17`")
path.write_text(s,encoding='utf-8')
print('Injected V17 full photoreal replacement pass')
