#!/usr/bin/env python3
from pathlib import Path
import sys
p=Path(sys.argv[1] if len(sys.argv)>1 else 'src/main.js')
s=p.read_text(encoding='utf-8')
old="const V15_HQ=innerWidth>=900 && ((navigator.deviceMemory||8)>=4);"
new="const V15_HQ=innerWidth>=900 && ((navigator.deviceMemory||8)>=4) && !new URLSearchParams(location.search).has('qaStage');"
if old not in s:
    raise SystemExit('V15 QA fastpath anchor not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('Disabled expensive post-processing only for headless qaStage screenshots')
