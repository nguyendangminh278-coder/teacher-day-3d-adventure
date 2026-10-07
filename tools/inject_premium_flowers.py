#!/usr/bin/env python3
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'src/main.js')
s = path.read_text(encoding='utf-8')

state_marker = "let controlled=teacherRoot,moveTask=null,driveTask=null,stage=0,busy=true,animMode='idle',lastForward=new THREE.Vector3(0,0,-1),finalOrbit=false,portal,treeRoot,blooms=[];"
if state_marker not in s:
    raise SystemExit('premium flower injection: state marker not found')
s = s.replace(state_marker, state_marker + "\nlet premiumFlowerSource=null,premiumFlowers=[];", 1)

load_marker = "function loadAssets(){"
if load_marker not in s:
    raise SystemExit('premium flower injection: loadAssets marker not found')

premium_code = r'''function fitPremiumFlower(model,targetWidth=1.45){
  const b=new THREE.Box3().setFromObject(model),sz=new THREE.Vector3();b.getSize(sz);
  const sc=targetWidth/Math.max(sz.x,sz.z,.001);model.scale.setScalar(sc);
  const b2=new THREE.Box3().setFromObject(model);model.userData.groundOffset=-b2.min.y;
}
function spawnPremiumFlowerGarden(){
  if(!premiumFlowerSource||premiumFlowers.length)return;
  const spots=[];
  for(let z=-10;z>-76;z-=5.2){
    spots.push([-4.45+.28*Math.sin(z*.73),.08,z,.72+.12*Math.sin(z)]);
    spots.push([ 4.45+.28*Math.cos(z*.61),.08,z,.68+.12*Math.cos(z)]);
  }
  for(let x=22;x<88;x+=8.5){spots.push([x,.08,-118.7,.72]);spots.push([x+2.4,.08,-107.4,.64]);}
  [[93,.08,-102,.72],[107,.08,-102,.66],[92,.08,-110,.62],[108,.08,-110,.7],[96,8.18,-102,.62],[104,8.18,-102,.65],[94,8.18,-109,.58],[108,8.18,-108,.6]].forEach(v=>spots.push(v));
  spots.forEach((p,i)=>{
    const c=premiumFlowerSource.clone(true);c.scale.multiplyScalar(p[3]);
    const groundOffset=(premiumFlowerSource.userData.groundOffset||0)*p[3];
    c.position.set(p[0],p[1]+groundOffset,p[2]);c.rotation.y=(i*2.3999632297)%(Math.PI*2);
    c.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;o.frustumCulled=true;}});
    world.add(c);premiumFlowers.push(c);
  });
}
'''
s = s.replace(load_marker, premium_code + "\n" + load_marker, 1)

car_marker = "  loader.load('./assets/models/sedan.glb'"
if car_marker not in s:
    raise SystemExit('premium flower injection: sedan loader marker not found')
flower_loader = "  loader.load('./assets/models/flower_empodium_4k.glb',g=>{const m=g.scene;fitPremiumFlower(m,1.45);premiumFlowerSource=m;spawnPremiumFlowerGarden();ui.assetStatus.textContent='Mẹ chibi 3D · vườn hoa 4K CC0 Poly Haven';},undefined,()=>{});\n"
s = s.replace(car_marker, flower_loader + car_marker, 1)

path.write_text(s, encoding='utf-8')
print(f'Injected premium 4K flower garden into {path}')
