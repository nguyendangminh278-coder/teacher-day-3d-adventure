#!/usr/bin/env python3
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'src/main.js')
s = path.read_text(encoding='utf-8')
replacements = {
    "grass_large.glb": "fern.glb",
    "grass_small.glb": "fern.glb",
    "bush_small_flowers.glb": "bush_flowers.glb",
    "flower_clump.glb": "flower_pink.glb",
}
for old, new in replacements.items():
    s = s.replace(old, new)
path.write_text(s, encoding='utf-8')
print('V12 reuses already-deployed CC0 Quaternius assets for a fast, reliable publish')
