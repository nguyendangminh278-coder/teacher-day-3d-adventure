# 3D Asset Credits

## Teacher-mother protagonist
The main character `teacher_mom_chibi.glb` is generated specifically for this project at build time with Blender using `tools/build_teacher_mom.py`.

The design is an original stylized chibi interpretation guided by reference photos supplied by the project owner. The source photographs are **not copied into the public repository or embedded into the deployed website**. The generated character uses broad visual cues only: warm smile, slim oval face, shoulder-length dark hair with soft curled ends, and a pastel-blue Vietnamese áo dài.

The generated model is not extracted from any commercial game and does not depend on a third-party character asset.

## Car
- Model: `sedan.glb` from the **Car Kit**
- Original creator: **Kenney**
- Repository mirror: `Hidencod/tge-assets`
- License: **CC0 1.0 Universal**
- Purpose: vehicle for the continuous school-to-home driving sequence.

## Runtime
Three.js and GLTFLoader are bundled into the local `dist/game.min.js` during GitHub Actions. The public site does not require a third-party JavaScript CDN at runtime. The personalized chibi GLB is also generated during CI and published locally under `assets/models/`.
