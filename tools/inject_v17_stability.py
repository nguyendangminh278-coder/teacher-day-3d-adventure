#!/usr/bin/env python3
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'src/main.js')
s = path.read_text(encoding='utf-8')
if '/* V17_STABILITY_PATCH */' in s:
    print('V17 stability patch already injected')
    raise SystemExit(0)

# V17 looked good but the default desktop post-processing path was too expensive on
# integrated GPUs. Keep the photoreal assets/materials, but make the stable path the default.
hq_old = "const V15_HQ=innerWidth>=900 && ((navigator.deviceMemory||8)>=4) && !new URLSearchParams(location.search).has('qaStage');"
hq_new = "const V15_HQ=innerWidth>=1280 && ((navigator.deviceMemory||4)>=8) && ((navigator.hardwareConcurrency||4)>=8) && (devicePixelRatio||1)<=1.5 && !new URLSearchParams(location.search).has('qaStage');"
if hq_old not in s:
    raise SystemExit('V17 stability: HQ anchor not found')
s = s.replace(hq_old, hq_new, 1)

# Reduce fill-rate pressure. PBR/HDRI stay enabled; the expensive full-screen composer is not.
s = s.replace("innerWidth<760?1.05:(V15_HQ?1.7:1.35)", "innerWidth<760?1:(V15_HQ?1.2:1.05)")
composer_old = "const v15Composer=V15_HQ?new EffectComposer(renderer):null;"
if composer_old not in s:
    raise SystemExit('V17 stability: composer anchor not found')
s = s.replace(composer_old, "const v15Composer=null;/* V17_STABILITY_PATCH: native render path avoids bloom/FXAA/SSAO stalls */", 1)

# 4K shadow maps caused major stalls on some laptops; 2K is plenty for this camera distance.
s = s.replace("sun.shadow.mapSize.set(4096,4096)", "sun.shadow.mapSize.set(2048,2048)")

# Allow scripted movement to advance correctly even when frames are temporarily slow.
# The previous 40ms cap made a 5-10 FPS machine look as if the button did nothing.
dt_old = "const dt=Math.min(.04,clock.getDelta())"
if dt_old not in s:
    raise SystemExit('V17 stability: dt anchor not found')
s = s.replace(dt_old, "const dt=Math.min(.12,clock.getDelta())", 1)

# Avoid a heavy decode/clone burst while the player is still in the opening cloud garden.
init_old = "function v17Init(){v17EnhanceRenderer();v17BuildArchitecture();v17LoadModels();}"
init_new = "function v17Init(){v17EnhanceRenderer();v17BuildArchitecture();const loadWhenNeeded=()=>{const q=new URLSearchParams(location.search);if(stage>=3||q.has('qaStage')){v17LoadModels();return;}setTimeout(loadWhenNeeded,1200);};setTimeout(loadWhenNeeded,1200);}"
if init_old not in s:
    raise SystemExit('V17 stability: v17Init anchor not found')
s = s.replace(init_old, init_new, 1)

# Lower texture sampling cost without changing the actual 2K source assets.
s = s.replace("Math.min(16,renderer.capabilities.getMaxAnisotropy?.()||1)", "Math.min(4,renderer.capabilities.getMaxAnisotropy?.()||1)")

# Recover from a stale busy flag if there is no active movement/door task.
action_old = "function action(){if(busy)return;"
action_new = "function action(){if(busy){if(!moveTask&&!driveTask&&!gateTask&&!houseDoorTask&&!v15ClickTask)setBusy(false);else return;}"
if action_old not in s:
    raise SystemExit('V17 stability: action anchor not found')
s = s.replace(action_old, action_new, 1)

s = s.replace("V17 · HDRI + PBR scan + model CC0 thật + SSAO + click-to-move", "V17.1 · HDRI + PBR scan + CC0 · chế độ mượt + click-to-move")
s = s.replace("location.href=`${location.pathname}?v=17`", "location.href=`${location.pathname}?v=171`")

path.write_text(s, encoding='utf-8')
print('Injected V17.1 stability/performance patch')
