#!/usr/bin/env python3
from pathlib import Path
import sys

path=Path(sys.argv[1] if len(sys.argv)>1 else 'src/main.js')
s=path.read_text(encoding='utf-8')
if '/* V16_PHOTOREAL_HYBRID */' in s:
    print('V16 already injected'); raise SystemExit(0)

imp="import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';"
if imp not in s: raise SystemExit('V16: GLTFLoader import missing')
s=s.replace(imp,imp+"\nimport { RGBELoader } from 'three/addons/loaders/RGBELoader.js';",1)

# Hide primitive student desks; V16 replaces them with real scanned/photogrammetry-style CC0 models.
legacy="box(outdoorWorld,[2.1,.16,1],[x,.95,z],0xb9825b);"
if legacy in s:
    s=s.replace(legacy,"const v16LegacyDesk=box(outdoorWorld,[2.1,.16,1],[x,.95,z],0xb9825b);v16LegacyDesk.visible=false;",1)

anchor='function showDialogue'
if anchor not in s: raise SystemExit('V16: showDialogue anchor missing')
v16=r'''/* V16_PHOTOREAL_HYBRID */
const v16TextureLoader=new THREE.TextureLoader();
let v16Sky=null,v16SkyEnv=null,v16Ready=false;
const v16Static=new THREE.Group();outdoorWorld.add(v16Static);
const v16HouseStatic=new THREE.Group();houseWorld.add(v16HouseStatic);

function v16LoadTexture(url,color=false){
  return new Promise((resolve,reject)=>v16TextureLoader.load(url,t=>{if(color)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy?.()||1);resolve(t);},undefined,reject));
}
function v16PBR(base,normal,rough,repeat=[3,3]){
  for(const t of [base,normal,rough])if(t)t.repeat.set(repeat[0],repeat[1]);
  return new THREE.MeshStandardMaterial({map:base,normalMap:normal,roughnessMap:rough,roughness:.82,metalness:0,envMapIntensity:1.15});
}
function v16Plane(parent,w,h,x,y,z,mat,rx=-Math.PI/2){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(x,y,z);m.rotation.x=rx;m.receiveShadow=true;m.castShadow=false;parent.add(m);return m;
}
function v16Circle(parent,r,x,y,z,mat,sx=1,sz=1){
  const m=new THREE.Mesh(new THREE.CircleGeometry(r,64),mat);m.position.set(x,y,z);m.rotation.x=-Math.PI/2;m.scale.set(sx,sz,1);m.receiveShadow=true;parent.add(m);return m;
}
function v16FitModel(root,targetY){const b=new THREE.Box3().setFromObject(root),sz=new THREE.Vector3();b.getSize(sz);root.scale.setScalar(targetY/Math.max(.001,sz.y));const b2=new THREE.Box3().setFromObject(root);root.position.y-=b2.min.y;root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m&&'envMapIntensity' in m)m.envMapIntensity=1.2;});}});}

async function v16BuildSurfaces(){
  try{
    const [fb,fn,fr,wb,wn,wr,pb,pn,pr]=await Promise.all([
      v16LoadTexture('./assets/v16/materials/forest_floor/basecolor.jpg',true),v16LoadTexture('./assets/v16/materials/forest_floor/normal.jpg'),v16LoadTexture('./assets/v16/materials/forest_floor/roughness.jpg'),
      v16LoadTexture('./assets/v16/materials/wood_floor/basecolor.jpg',true),v16LoadTexture('./assets/v16/materials/wood_floor/normal.jpg'),v16LoadTexture('./assets/v16/materials/wood_floor/roughness.jpg'),
      v16LoadTexture('./assets/v16/materials/white_plaster_02/basecolor.jpg',true),v16LoadTexture('./assets/v16/materials/white_plaster_02/normal.jpg'),v16LoadTexture('./assets/v16/materials/white_plaster_02/roughness.jpg')]);
    const forest=v16PBR(fb,fn,fr,[2.6,2.6]),wood=v16PBR(wb,wn,wr,[6,6]),plaster=v16PBR(pb,pn,pr,[5,3]);
    // Floating realistic garden islands: still a cloud world, but non-interactive ground now uses scanned PBR detail.
    for(const z of [-12,-34,-56,-73]){v16Circle(v16Static,6.8,-9.6,.015,z,forest,1.35,.92);v16Circle(v16Static,6.8,9.6,.015,z-2.5,forest,1.35,.92);}
    // School courtyard and classroom use physically based surfaces instead of flat colors.
    v16Plane(v16Static,20,20,0,.105,-116.5,wood);
    const classBack=v16Plane(v16Static,19,5,0,2.5,-126.27,plaster,0);classBack.rotation.y=Math.PI;
    // House is a separate 3D space; both floors get a real wood scan and the rear wall gets plaster microdetail.
    v16Plane(v16HouseStatic,17.7,12.7,0,.16,0,wood);
    v16Plane(v16HouseStatic,10.8,12.7,-3.5,4.66,0,wood);
    const houseBack=v16Plane(v16HouseStatic,18,8.6,0,4.55,-6.48,plaster,0);houseBack.rotation.y=0;
  }catch(e){console.warn('V16 PBR surfaces unavailable',e);}
}

function v16AddRealClassroomModels(){
  let deskSrc=null,chairSrc=null;
  const spawn=()=>{if(!deskSrc||!chairSrc)return;DESKS.forEach((d,i)=>{const x=(d.min[0]+d.max[0])/2,z=(d.min[2]+d.max[2])/2;const dg=deskSrc.clone(true);dg.position.set(x,.08,z);dg.rotation.y=Math.PI;outdoorWorld.add(dg);const cg=chairSrc.clone(true);cg.position.set(x,.08,z+1.05);cg.rotation.y=Math.PI;outdoorWorld.add(cg);});};
  loader.load('./assets/v16/models/school_desk.glb',g=>{deskSrc=g.scene;v16FitModel(deskSrc,.9);spawn();},undefined,e=>console.warn('V16 school desk missing',e));
  loader.load('./assets/v16/models/school_chair.glb',g=>{chairSrc=g.scene;v16FitModel(chairSrc,.92);spawn();},undefined,e=>console.warn('V16 school chair missing',e));
  loader.load('./assets/v16/models/chalkboard.glb',g=>{const cb=g.scene;v16FitModel(cb,2.2);cb.position.set(-6.9,.08,-124.7);cb.rotation.y=.12;outdoorWorld.add(cb);},undefined,e=>console.warn('V16 chalkboard missing',e));
}

function v16LoadHDRI(){
  new RGBELoader().load('./assets/v16/hdri/cloud_layers_2k.hdr',tex=>{
    tex.mapping=THREE.EquirectangularReflectionMapping;v16Sky=tex;
    const pm=new THREE.PMREMGenerator(renderer);v16SkyEnv=pm.fromEquirectangular(tex).texture;pm.dispose();v16Ready=true;
    scene.environment=v16SkyEnv;if('environmentIntensity' in scene)scene.environmentIntensity=1.0;
    ui.assetStatus.textContent='V16 · HDRI thật + PBR scan 2K + classroom CC0 chân thực · click-to-move';
  },undefined,e=>console.warn('V16 HDRI unavailable',e));
}
function updateV16PhotorealWorld(dt,t){
  if(!v16Ready)return;
  if(currentSpace==='outdoor'){
    scene.background=v16Sky;scene.environment=v16SkyEnv;
    if(scene.fog){scene.fog.near=72;scene.fog.far=245;}
  }else{
    // Keep interiors bright while retaining real image-based reflections.
    scene.environment=v16SkyEnv;
  }
  if(v15HeroLight){v15HeroLight.position.copy(teacherRoot.position).add(new THREE.Vector3(1.8,3.5,2.2));}
}
function v16Init(){v16LoadHDRI();v16BuildSurfaces();v16AddRealClassroomModels();}
setTimeout(v16Init,1200);
'''
s=s.replace(anchor,v16+'\n'+anchor,1)

# V14 rewrites the outdoor background each frame; V16 is the final authority for realistic HDRI.
needle='updateV14BrightWorld(dt,t);'
if needle in s:
    s=s.replace(needle,needle+'updateV16PhotorealWorld(dt,t);',1)
else:
    raise SystemExit('V16: V14 update anchor not found')

s=s.replace("location.href=`${location.pathname}?v=14`","location.href=`${location.pathname}?v=16`")
s=s.replace("location.href=`${location.pathname}?v=15`","location.href=`${location.pathname}?v=16`")
path.write_text(s,encoding='utf-8')
print('Injected V16 HDRI/PBR photoreal hybrid pass')
