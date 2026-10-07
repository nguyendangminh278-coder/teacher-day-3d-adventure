#!/usr/bin/env python3
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'src/main.js')
s = path.read_text(encoding='utf-8')

if '/* V12_DENSE_WORLD */' in s:
    print('V12 dense world already injected')
    raise SystemExit(0)

anchor = 'function showDialogue'
if anchor not in s:
    raise SystemExit('V12 injection failed: showDialogue anchor not found')

v12 = r'''/* V12_DENSE_WORLD */
const v12Birds=[];
const v12Sway=[];
let v12Started=false,v12Built=false,v12LastSpace='';
let v12AudioCtx=null,v12AudioEnabled=false,v12ChirpTimer=null;

function v12Rand(seed){let x=Math.sin(seed*91.713+17.37)*43758.5453;return x-Math.floor(x);}
function v12Plant(key,parent,x,z,h,seed=1,scale=.95){
  const o=v11FitClone(key,parent,[x,0,z],h,'height',v12Rand(seed)*Math.PI*2,scale,false);
  if(o&&(key.includes('tree')||key.includes('bush')||key==='grassLarge')){o.userData.v12BaseZ=o.rotation.z;o.userData.v12Phase=v12Rand(seed+4)*Math.PI*2;v12Sway.push(o);}return o;
}
function v12GardenIsland(x,z,rx=5.2,rz=4.2,seed=1){
  const g=new THREE.Group();g.position.set(x,0,z);outdoorWorld.add(g);
  const top=mesh(new THREE.CylinderGeometry(1,1,.22,28),M(0x91c96f,.92,0),false,true);top.position.y=-.08;top.scale.set(rx,1,rz);g.add(top);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7+v12Rand(seed+i),r=.55+v12Rand(seed+i*2)*.35;v11LowPolyCloud(g,Math.cos(a)*rx*r,-.78,Math.sin(a)*rz*r,.85+v12Rand(seed+i*3)*.45,seed+i);}
  return g;
}
function v12Cluster(cx,cz,seed=1,big=false){
  const treeKey=seed%4===0?'birch':(seed%3===0?'treeTwisted':'treeCommon');
  if(big||seed%2===0)v12Plant(treeKey,outdoorWorld,cx+(v12Rand(seed)-.5)*2.0,cz+(v12Rand(seed+1)-.5)*1.7,big?8.5:6.2+v12Rand(seed+2)*2.0,seed,.94);
  for(let i=0;i<3;i++){const a=v12Rand(seed+10+i)*Math.PI*2,r=1.4+v12Rand(seed+20+i)*2.2;v12Plant(i===0?'bushUltimate':(i===1?'bushSmallFlowers':'bushFlowers'),outdoorWorld,cx+Math.cos(a)*r,cz+Math.sin(a)*r,.9+v12Rand(seed+30+i)*.65,seed+50+i,.9);}
  for(let i=0;i<7;i++){const a=v12Rand(seed+70+i)*Math.PI*2,r=.8+v12Rand(seed+80+i)*3.4;v12Plant(i%3===0?'grassLarge':'grassSmall',outdoorWorld,cx+Math.cos(a)*r,cz+Math.sin(a)*r,.45+v12Rand(seed+90+i)*.65,seed+100+i,.9);}
  for(let i=0;i<4;i++){const a=v12Rand(seed+120+i)*Math.PI*2,r=1+v12Rand(seed+130+i)*3.2;v12Plant(i%2?'flowerClump':'flowerPink',outdoorWorld,cx+Math.cos(a)*r,cz+Math.sin(a)*r,.45+v12Rand(seed+140+i)*.45,seed+150+i,.85);}
  if(seed%3===0)v12Plant('rock',outdoorWorld,cx+2.4,cz-1.7,.55,seed+180,.8);
}
function v12Bird(centerX,centerZ,radius,height,phase,speed=.16){
  const g=new THREE.Group();
  const dark=new THREE.MeshBasicMaterial({color:0x3b4654,side:THREE.DoubleSide});
  const body=new THREE.Mesh(new THREE.SphereGeometry(.12,7,5),dark);body.scale.set(.7,.55,1.8);g.add(body);
  const mkWing=(side)=>{const geo=new THREE.BufferGeometry();const a=side<0?-.05:.05,tip=side<0?-.62:.62;geo.setAttribute('position',new THREE.Float32BufferAttribute([a,0,0,tip,.03,.08,tip*.62,0,-.22],3));geo.setIndex([0,1,2]);geo.computeVertexNormals();const m=new THREE.Mesh(geo,dark);m.name=side<0?'wingL':'wingR';g.add(m);return m;};
  const wingL=mkWing(-1),wingR=mkWing(1);outdoorWorld.add(g);v12Birds.push({g,wingL,wingR,centerX,centerZ,radius,height,phase,speed});return g;
}
function v12BuildDenseWorld(){
  if(v12Built)return;v12Built=true;
  // Connected floating garden islands: vegetation now sits on green cloud meadows instead of isolated objects in empty sky.
  const islands=[[-12,-13,5.8,4.4], [12,-24,6.2,4.7],[-13,-36,6.4,4.7],[13,-48,6.1,4.5],[-14,-61,6.7,4.8],[14,-70,6.2,4.5],[-18,-83,7.5,5.8],[18,-84,7.5,5.8],[-21,-98,8.2,6.2],[21,-99,8.2,6.2]];
  islands.forEach((p,i)=>{v12GardenIsland(p[0],p[1],p[2],p[3],i+1);v12Cluster(p[0],p[1],i+11,i>5);});

  // Dense side forest along the full cloud path, leaving a clear 6m corridor for Mom.
  let seed=200;
  for(let z=-8;z>-74;z-=5.2){for(const side of [-1,1]){const x=side*(8.2+v12Rand(seed)*9.5);v12Cluster(x,z+(v12Rand(seed+1)-.5)*3.1,seed++,seed%5===0);}}

  // Foreground framing + layered background forest around the school so every 360° view has content.
  [[-11,-7,9.4],[11,-10,9.0],[-23,-69,9.8],[24,-72,10.2],[-25,-91,10.5],[25,-94,9.8],[-30,-110,10.8],[30,-112,10.4],[-21,-132,11.2],[22,-136,10.8]].forEach((p,i)=>v12Plant(i%3===0?'birch':(i%2?'treeTwisted':'treeCommon'),outdoorWorld,p[0],p[1],p[2],330+i,1));
  for(let i=0;i<22;i++){const side=i%2?-1:1,x=side*(16+v12Rand(400+i)*20),z=-76-v12Rand(500+i)*76;v12Plant(i%4===0?'birch':'treeCommon',outdoorWorld,x,z,6.5+v12Rand(600+i)*4.8,500+i,.9);}

  // School garden beds: layered shrubs/grass/flowers frame the gate but never block its opening.
  for(const side of [-1,1])for(let i=0;i<6;i++){const x=side*(8.5+i*2.1),z=-76.5-(i%3)*3.4;v12Plant(i%2?'bushSmallFlowers':'bushUltimate',outdoorWorld,x,z,1.0+(i%3)*.18,700+i+(side>0?20:0),.95);for(let j=0;j<3;j++)v12Plant(j%2?'grassSmall':'flowerClump',outdoorWorld,x+side*(.8+j*.55),z-.8-j*.45,.48+(j*.08),760+i*5+j,.9);}

  // Extra cloud wall / horizon depth. Large, distant, slow-moving banks hide flat blue emptiness.
  const farClouds=[[-38,11,-22,3.2],[39,13,-35,3.6],[-43,15,-58,4.0],[44,12,-78,3.4],[-38,17,-102,4.4],[38,16,-121,4.1],[-30,19,-148,4.8],[30,18,-158,4.6],[0,22,-176,6.0],[-55,14,-132,4.2],[55,15,-142,4.3]];
  farClouds.forEach((p,i)=>v11LowPolyCloud(outdoorWorld,p[0],p[1],p[2],p[3],20+i*.8));

  // Air life and pollen.
  v11MoteField(outdoorWorld,180,[0,.8,-45],[44,9,86],0xfbe9a7,.075);
  v11MoteField(outdoorWorld,90,[0,2.2,-85],[52,11,55],0xffd5e7,.065);

  // Birds circling above the school and floating gardens.
  v12Bird(0,-82,13,10.2,.1,.19);v12Bird(0,-82,16,12.3,1.7,.15);v12Bird(-16,-55,9,8.8,2.8,.22);v12Bird(18,-42,8,9.5,4.1,.20);v12Bird(0,-104,20,13.8,5.0,.12);v12Bird(24,-93,7.5,11.0,.8,.24);

  if(ui.assetStatus)ui.assetStatus.textContent='V12 · vườn mây dày đặc · cỏ hoa Quaternius · chim bay & âm thanh thiên nhiên';
}
function loadV12DenseWorld(){
  if(v12Started)return;
  if(typeof v11LoadModel!=='function'||typeof v11FitClone!=='function'||!v11Assets||!v11Assets.treeCommon){setTimeout(loadV12DenseWorld,280);return;}
  v12Started=true;
  const q='./assets/models/v11/quaternius/';
  const defs={grassLarge:q+'grass_large.glb',grassSmall:q+'grass_small.glb',bushSmallFlowers:q+'bush_small_flowers.glb',flowerClump:q+'flower_clump.glb'};
  Promise.allSettled(Object.entries(defs).map(([k,u])=>v11LoadModel(k,u))).then(v12BuildDenseWorld);
}
function v12Chirp(){
  if(!v12AudioEnabled||!v12AudioCtx||currentSpace!=='outdoor')return;
  const now=v12AudioCtx.currentTime;
  for(let i=0;i<2;i++){const o=v12AudioCtx.createOscillator(),g=v12AudioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(1750+i*260,now+i*.13);o.frequency.exponentialRampToValueAtTime(2400+i*180,now+.11+i*.13);g.gain.setValueAtTime(.0001,now+i*.13);g.gain.exponentialRampToValueAtTime(.018,now+.025+i*.13);g.gain.exponentialRampToValueAtTime(.0001,now+.16+i*.13);o.connect(g);g.connect(v12AudioCtx.destination);o.start(now+i*.13);o.stop(now+.19+i*.13);}
}
function v12ScheduleChirp(){clearTimeout(v12ChirpTimer);v12ChirpTimer=setTimeout(()=>{v12Chirp();v12ScheduleChirp();},6500+Math.random()*7000);}
function v12EnableAudio(){if(v12AudioEnabled)return;try{v12AudioCtx=new (window.AudioContext||window.webkitAudioContext)();v12AudioEnabled=true;v12AudioCtx.resume?.();v12Chirp();v12ScheduleChirp();}catch(e){}}
function updateV12DenseWorld(dt,t){
  if(currentSpace!==v12LastSpace){v12LastSpace=currentSpace;scene.fog=currentSpace==='outdoor'?new THREE.Fog(0xc7e7ff,92,235):(currentSpace==='finale'?new THREE.Fog(0xf8e7ef,55,155):null);}
  for(const o of v12Sway)o.rotation.z=o.userData.v12BaseZ+Math.sin(t*.55+o.userData.v12Phase)*.012;
  for(const b of v12Birds){const a=t*b.speed*6.283+b.phase;b.g.position.set(b.centerX+Math.cos(a)*b.radius,b.height+Math.sin(a*2.1+b.phase)*.55,b.centerZ+Math.sin(a)*b.radius);b.g.rotation.y=-a;const flap=Math.sin(t*9.5+b.phase)*.58;b.wingL.rotation.z=-.15-flap;b.wingR.rotation.z=.15+flap;}
}
window.addEventListener('pointerdown',v12EnableAudio,{once:true});
''' 

s = s.replace(anchor, v12 + '\n' + anchor, 1)

# Start once V11 has begun loading; the loader polls until its shared CC0 assets are ready.
needle = 'buildWorlds();loadAssets();'
if needle in s:
    s = s.replace(needle, needle + 'setTimeout(loadV12DenseWorld,350);', 1)
else:
    raise SystemExit('V12 injection failed: world init anchor not found')

# Add animation update immediately before camera/render, regardless of V11's own update hook.
needle2 = 'updateCamera(dt,t);renderer.render(scene,camera);'
if needle2 in s:
    s = s.replace(needle2, 'updateV12DenseWorld(dt,t);' + needle2, 1)
else:
    raise SystemExit('V12 injection failed: render loop anchor not found')

path.write_text(s, encoding='utf-8')
print('Injected V12 dense floating garden, layered forest, birds and ambient chirps')
