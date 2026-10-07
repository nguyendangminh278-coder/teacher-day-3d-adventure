#!/usr/bin/env python3
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'src/main.js')
s = path.read_text(encoding='utf-8')

if '/* V13_REFINED_FOREST */' in s:
    print('V13 forest refinement already applied')
    raise SystemExit(0)
if '/* V13_CLOUD_FOREST */' not in s:
    raise SystemExit('V13 refinement requires V13 cloud forest first')

# Make the winding trail visible from above regardless of triangle winding.
s = s.replace(
    "new THREE.MeshStandardMaterial({color:0xb9aa75,roughness:.98,metalness:0})",
    "new THREE.MeshStandardMaterial({color:0xa99b6d,roughness:.98,metalness:0,side:THREE.DoubleSide})"
)

# Lower and flatten the cloud deck so it reads as a cloud sea rather than giant foreground boulders.
s = s.replace(
    "d.position.set(x,-2.0-v12Rand(2100+i)*.85,z);",
    "d.position.set(x,-3.05-v12Rand(2100+i)*.65,z);"
)
s = s.replace(
    "d.scale.set(3.7+v12Rand(2600+i)*4.9,1.05+near*.45,2.6+v12Rand(3000+i)*3.8);",
    "d.scale.set(3.4+v12Rand(2600+i)*4.4,.68+near*.22,2.5+v12Rand(3000+i)*3.5);"
)
s = s.replace(
    "c.position.set((i%3-1)*1.8,-2.25,z);",
    "c.position.set((i%3-1)*1.8,-3.15,z);"
)
s = s.replace(
    "c.scale.set(4.6+(i%4)*.35,1.15,3.4+(i%3)*.4);",
    "c.scale.set(3.35+(i%4)*.28,.72,2.55+(i%3)*.32);"
)

# Store each plant's location so the wind can travel through the forest as a coherent wave.
s = s.replace(
    "o.userData.v13WindStrength=strength;\n  o.userData.v13WindPhase=phase||v12Rand((o.id||1)*1.73)*Math.PI*2;",
    "o.userData.v13WindStrength=strength;\n  o.userData.v13WindX=o.position.x;\n  o.userData.v13WindZ=o.position.z;\n  o.userData.v13WindPhase=phase||v12Rand((o.id||1)*1.73)*Math.PI*2;"
)
s = s.replace(
    "const slow=Math.sin(t*(.78+st*2.2)+ph),fast=Math.sin(t*2.25+ph*1.73)*.26;\n      const bend=(slow+fast)*st*gust;",
    "const wx=o.userData.v13WindX||0,wz=o.userData.v13WindZ||0;\n      const wave=Math.sin(t*1.05+wx*.18+wz*.082+ph*.16);\n      const flutter=Math.sin(t*(2.2+st*3.0)+ph)*.30;\n      const bend=(wave+flutter)*st*gust;"
)

anchor = 'function v13BuildCloudForest(){'
if anchor not in s:
    raise SystemExit('V13 refinement failed: build anchor not found')

extra = r'''/* V13_REFINED_FOREST */
function v13RefinedCloudSea(){
  // A continuous matte-white cloud sea removes the remaining blue floor while the low-poly puffs keep depth.
  const sea=new THREE.Mesh(
    new THREE.PlaneGeometry(170,225,1,1),
    new THREE.MeshStandardMaterial({color:0xf8fbff,roughness:1,metalness:0,side:THREE.DoubleSide})
  );
  sea.rotation.x=-Math.PI/2;sea.position.set(0,-2.55,-65);sea.receiveShadow=false;sea.castShadow=false;outdoorWorld.add(sea);

  // Foreground trunks/canopies frame the camera like the Quaternius woodland reference.
  const frames=[
    [-6.8,-12,'treeCommon',10.3], [7.1,-13,'treeTwisted',9.7],
    [-8.9,-23,'birch',9.3], [8.4,-26,'treeCommon',10.1],
    [-7.8,-39,'treeTwisted',9.6], [8.2,-43,'birch',9.5],
    [-9.0,-57,'treeCommon',10.4], [8.7,-61,'treeTwisted',10.0]
  ];
  frames.forEach((p,i)=>v13Plant(p[2],p[0],p[1],p[3],8100+i,.98,.022));

  // Rocks, fern masses and flower clumps tighten the edge of the trail without blocking the route.
  let seed=8300;
  for(let z=-13;z>-74;z-=6.0){
    for(const side of [-1,1]){
      const x=side*(3.7+v12Rand(seed)*1.15);
      v13Plant('grassSmall',x,z,.72+v12Rand(seed+1)*.45,seed,.92,.12);
      if(seed%2===0)v13Plant('rock',side*(4.5+v12Rand(seed+2)*1.5),z-1.1,.55+v12Rand(seed+3)*.35,seed+20,.88,.012);
      if(seed%3===0)v13Plant('flowerPink',side*(4.1+v12Rand(seed+4)*1.8),z+1.4,.48+v12Rand(seed+5)*.32,seed+40,.88,.09);
      seed+=19;
    }
  }
  const refresh=()=>{if(ui.assetStatus&&currentSpace==='outdoor')ui.assetStatus.textContent='V13 · rừng mây liền mạch · đường mòn woodland · gió lướt qua cây cỏ · bước chân nhún nhảy';};
  refresh();setTimeout(refresh,1800);setTimeout(refresh,4200);
}
'''

s = s.replace(anchor, extra + '\n' + anchor, 1)
s = s.replace(
    "v13CloudDeck();v13MeadowRibbon();v13ForestPath();v13DenseUnderstory();v13CloudLife();",
    "v13CloudDeck();v13RefinedCloudSea();v13MeadowRibbon();v13ForestPath();v13DenseUnderstory();v13CloudLife();",
    1
)

path.write_text(s, encoding='utf-8')
print('Refined V13: visible woodland trail, lower cloud sea, foreground forest framing and travelling wind waves')
