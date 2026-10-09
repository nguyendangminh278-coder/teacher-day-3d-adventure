#!/usr/bin/env python3
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'src/main.js')
s = path.read_text(encoding='utf-8')
if '/* V17_2_SCRIPTED_ONLY */' in s:
    print('V17.2 scripted-only patch already injected')
    raise SystemExit(0)

# Remove MOBA click-to-move from the runtime entirely. Keep only left-drag camera + scripted buttons.
pointer_old = "let dragging=false,lastPX=0,lastPY=0;canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{if(e.button===2){e.preventDefault();v15IssueMove(e);return;}if(e.button!==0)return;dragging=true;lastPX=e.clientX;lastPY=e.clientY;canvas.setPointerCapture?.(e.pointerId);userCameraTouched=true;});canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastPX,dy=e.clientY-lastPY;lastPX=e.clientX;lastPY=e.clientY;cameraUserYaw-=dx*.006;cameraPitch=THREE.MathUtils.clamp(cameraPitch-dy*.003,-.28,.72);});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);canvas.addEventListener('wheel',e=>{cameraZoom=THREE.MathUtils.clamp(cameraZoom+Math.sign(e.deltaY)*.7,5.3,13.5);e.preventDefault();},{passive:false});"
pointer_new = "let dragging=false,lastPX=0,lastPY=0;canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;lastPX=e.clientX;lastPY=e.clientY;canvas.setPointerCapture?.(e.pointerId);userCameraTouched=true;});canvas.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastPX,dy=e.clientY-lastPY;lastPX=e.clientX;lastPY=e.clientY;cameraUserYaw-=dx*.006;cameraPitch=THREE.MathUtils.clamp(cameraPitch-dy*.003,-.28,.72);});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);canvas.addEventListener('wheel',e=>{cameraZoom=THREE.MathUtils.clamp(cameraZoom+Math.sign(e.deltaY)*.7,5.3,13.5);e.preventDefault();},{passive:false});"
if pointer_old not in s:
    raise SystemExit('V17.2: pointer block anchor not found')
s = s.replace(pointer_old, pointer_new, 1)

# Do not update click locomotion or the click destination marker in the frame loop.
s = s.replace("updateDoors(dt);v15UpdateClickMove(dt,t);updateMovement(dt);", "updateDoors(dt);updateMovement(dt);", 1)

# Ensure any stale task from an older cached state cannot interfere with scripted movement.
anchor = "function showDialogue"
if anchor not in s:
    raise SystemExit('V17.2: showDialogue anchor not found')
override = r'''/* V17_2_SCRIPTED_ONLY */
v15ClickTask=null;
v15MoveMarker.visible=false;
function v172DisableClickMove(){v15ClickTask=null;v15MoveMarker.visible=false;}
const v172OriginalSetStage=setStage;
setStage=function(n){v172DisableClickMove();return v172OriginalSetStage(n);};

// Keep the photoreal architecture and PBR surfaces, but avoid the large desk/chair model burst
// that caused visible stalls around stage 3 on integrated GPUs. Decorative real-world plants
// are loaded only after the class scene is reached and are staggered.
v17LoadModels=function(){
  if(v17LoadModels._started)return;v17LoadModels._started=true;
  setTimeout(()=>loader.load('./assets/v17/models/shrub.glb',g=>{const src=g.scene;v17Normalize(src,2.35);const pts=[[-10.7,.05,-12],[10.8,.05,-17],[-11.2,.05,-29],[10.9,.05,-38],[-10.9,.05,-51],[11.1,.05,-61],[-10.5,.05,-71],[10.6,.05,-73]];for(const p of pts)v17Clone(src,outdoorWorld,p,.72+Math.random()*.22,Math.random()*6.28,true);},undefined,()=>{}),800);
  setTimeout(()=>loader.load('./assets/v17/models/potted_plant.glb',g=>{const src=g.scene;v17Normalize(src,1.15);for(const p of [[6.7,.18,-4.6],[-6.8,.18,-4.7],[6.8,4.68,-4.4]])v17Clone(src,houseWorld,p,.9,Math.random()*6.28,true);},undefined,()=>{}),2200);
};
'''
s = s.replace(anchor, override + "\n" + anchor, 1)

# Delay decorative model loading until the classroom step, so the road-to-school button never stalls.
s = s.replace("if(stage>=3||q.has('qaStage'))", "if(stage>=4||q.has('qaStage'))", 1)

# The scripted action button should recover from a stale busy flag without consulting click-move state.
s = s.replace("if(!moveTask&&!driveTask&&!gateTask&&!houseDoorTask&&!v15ClickTask)setBusy(false)", "if(!moveTask&&!driveTask&&!gateTask&&!houseDoorTask)setBusy(false)", 1)

# Click-move-specific camera FOV pulse is no longer needed.
s = s.replace("const desiredFov=v15ClickTask?52:50;", "const desiredFov=50;", 1)

# Stable scripted-mode label/version.
s = s.replace("V17.1 · HDRI + PBR scan + CC0 · chế độ mượt + click-to-move", "V17.2 · HDRI + PBR · chế độ kịch bản ổn định")
s = s.replace("location.href=`${location.pathname}?v=171`", "location.href=`${location.pathname}?v=172`")

path.write_text(s, encoding='utf-8')
print('Injected V17.2 scripted-only performance patch')
