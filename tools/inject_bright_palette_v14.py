#!/usr/bin/env python3
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'src/main.js')
s = path.read_text(encoding='utf-8')

if '/* V14_BRIGHT_CANDY_PALETTE */' in s:
    print('V14 bright palette already injected')
    raise SystemExit(0)

anchor = 'function showDialogue'
if anchor not in s:
    raise SystemExit('V14 injection failed: showDialogue anchor not found')

v14 = r'''/* V14_BRIGHT_CANDY_PALETTE */
let v14LastSpace='';
const v14Pastels={
  sky:0xfafcff,fog:0xffffff,white:0xffffff,mint:0xc8ffd8,leaf:0x8eea9f,lime:0xd7ff8f,
  pink:0xff8fbd,yellow:0xffe88d,lav:0xd9c7ff,peach:0xffd3b0,cocoa:0x9b776d,rose:0xb8758c
};

function v14LiftMaterial(mat){
  if(!mat||!mat.color||mat.userData?.v14Lifted)return;
  mat.userData=mat.userData||{};
  const c=mat.color.clone();
  const max=Math.max(c.r,c.g,c.b),min=Math.min(c.r,c.g,c.b),lum=.2126*c.r+.7152*c.g+.0722*c.b;
  // Remove true black/dark charcoal completely. Keep contrast with warm cocoa/rose instead.
  if(lum<.085){mat.color.setHex(v14Pastels.cocoa);}
  else if(lum<.18){mat.color.lerp(new THREE.Color(0xcaa89c),.72);}
  else if(lum<.32){mat.color.lerp(new THREE.Color(0xf4d7cc),.38);}
  // Give dull gray materials a slight pastel warmth rather than leaving them muddy.
  if(max-min<.08 && lum<.72)mat.color.lerp(new THREE.Color(0xffe8ef),.16);
  if('roughness' in mat)mat.roughness=Math.min(1,Math.max(.42,mat.roughness??.75));
  if('metalness' in mat)mat.metalness=Math.min(.12,mat.metalness??0);
  mat.needsUpdate=true;mat.userData.v14Lifted=true;
}

function v14LiftObject(root){
  if(!root)return;
  root.traverse(o=>{
    if(!o.isMesh)return;
    if(Array.isArray(o.material))o.material.forEach(v14LiftMaterial);else v14LiftMaterial(o.material);
  });
}

function v14ApplyPalette(){
  renderer.toneMappingExposure=1.24;
  renderer.setClearColor(v14Pastels.sky,1);
  scene.background=new THREE.Color(v14Pastels.sky);
  scene.fog=new THREE.Fog(v14Pastels.fog,currentSpace==='house'?34:58,currentSpace==='house'?105:210);
  // Softer, whiter lighting with pastel fill.
  scene.traverse(o=>{
    if(o.isHemisphereLight){o.color.set(0xffffff);o.groundColor.set(0xe8f7ec);o.intensity=Math.max(o.intensity,2.55);}
    if(o.isDirectionalLight){o.color.set(0xfffdf2);o.intensity=Math.max(o.intensity,2.85);}
  });
  v14LiftObject(outdoorWorld);v14LiftObject(houseWorld);v14LiftObject(finaleWorld);v14LiftObject(actorLayer);
  if(ui.assetStatus)ui.assetStatus.textContent='V14 · trắng sáng pastel · rừng mây rực rỡ · không dùng mảng đen';
}

function updateV14BrightWorld(dt,t){
  if(currentSpace!==v14LastSpace){v14LastSpace=currentSpace;setTimeout(v14ApplyPalette,0);}
  if(currentSpace==='outdoor'){
    scene.background.setHex(v14Pastels.sky);
    if(scene.fog){scene.fog.color.setHex(v14Pastels.fog);scene.fog.near=58;scene.fog.far=210;}
  }else if(currentSpace==='house'){
    scene.background.set(0xfffbfd);
    if(scene.fog){scene.fog.color.set(0xfffbfd);scene.fog.near=34;scene.fog.far=105;}
  }else{
    scene.background.set(0xfff8fc);
    if(scene.fog){scene.fog.color.set(0xfffbfd);scene.fog.near=42;scene.fog.far=145;}
  }
}
'''

s=s.replace(anchor,v14+'\n'+anchor,1)

needle='setTimeout(loadV13CloudForest,950);'
if needle in s:
    s=s.replace(needle,needle+'setTimeout(v14ApplyPalette,1900);',1)
else:
    raise SystemExit('V14 injection failed: V13 loader anchor not found')

# V14 must run after V13/V12 updates so their fog/background changes cannot darken the final frame.
needle2='updateV13CloudForest(dt,t);'
if needle2 in s:
    s=s.replace(needle2,needle2+'updateV14BrightWorld(dt,t);',1)
else:
    raise SystemExit('V14 injection failed: V13 update anchor not found')

# Replay should preserve V14 cache version.
s=s.replace("location.href=`${location.pathname}?v=10`", "location.href=`${location.pathname}?v=14`")

path.write_text(s,encoding='utf-8')
print('Injected V14 white-bright candy palette, lifted dark materials and brighter lighting')
