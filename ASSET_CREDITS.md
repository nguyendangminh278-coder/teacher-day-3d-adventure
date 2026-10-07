# 3D Asset Credits

## Teacher-mother protagonist
The main character `teacher_mom_chibi.glb` is generated specifically for this project at build time with Blender using `tools/build_teacher_mom.py`.

The design is an original stylized chibi interpretation guided by reference photos supplied by the project owner. The source photographs are **not copied into the public repository or embedded into the deployed website**. The generated character uses broad visual cues only: warm smile, slim oval face, shoulder-length dark hair with soft curled ends, and a pastel-blue Vietnamese áo dài.

The generated model is not extracted from any commercial game and does not depend on a third-party character asset.

## Premium 4K flower garden
- Asset: **Flower Empodium** (`flower_empodium`)
- Source: **Poly Haven** — https://polyhaven.com/a/flower_empodium
- Creators: **Jenelle van Heerden** (photography), **Rico Cilliers** (modeling)
- License: **CC0 1.0 / Public Domain dedication**
- Source quality: 4K PBR glTF with real scanned botanical textures.
- Integration: downloaded only during GitHub Actions through the official Poly Haven public API, converted to a local GLB with Blender, and then cloned throughout the cloud garden, school road, and home/finale areas. The live game does not hotlink the Poly Haven model at runtime.

Powered by Poly Haven for the build-time asset retrieval pipeline.

## Car
- Model: `sedan.glb` from the **Car Kit**
- Original creator: **Kenney**
- Repository mirror: `Hidencod/tge-assets`
- License: **CC0 1.0 Universal**
- Purpose: vehicle for the continuous school-to-home driving sequence.

## Runtime
Three.js and GLTFLoader are bundled into the local `dist/game.min.js` during GitHub Actions. The public site does not require a third-party JavaScript CDN at runtime. The personalized chibi GLB and the Poly Haven flower GLB are generated/packed during CI and published locally under `assets/models/`.
