# 3D Asset Credits

## Teacher-mother protagonist
The main character `teacher_mom_chibi.glb` is generated specifically for this project at build time with Blender using `tools/build_teacher_mom.py`.

The design is an original stylized chibi interpretation guided by reference photos supplied by the project owner. The source photographs are **not copied into the public repository or embedded into the deployed website**. The generated character uses broad visual cues only: warm smile, slim oval face, shoulder-length dark hair with soft curled ends, and a pastel-blue Vietnamese áo dài.

The generated model is not extracted from any commercial game and does not depend on a third-party character asset.

## V11 stylized nature
The main flowers, bushes, trees, ferns, mushrooms and rocks in V11 come from Quaternius and are packed into local GLB files during GitHub Actions.

### Quaternius — Stylized Nature MegaKit
- Creator: **Quaternius**
- Official page: https://quaternius.com/packs/stylizednaturemegakit.html
- Assets used: flower groups, flowering bush, common tree, twisted tree, fern, mushroom and rock.
- License: **CC0 1.0 Universal / Public Domain dedication**.
- Build source: the public CC0 `agentkaerf/FreeModels` mirror is sparse-checked out in CI, then selected glTF models are repacked as local GLB files with Blender.

### Quaternius — Ultimate Stylized Nature
- Creator: **Quaternius**
- Official page: https://quaternius.com/packs/ultimatestylizednature.html
- Assets used: large flowering bush and birch tree.
- License: **CC0 1.0 Universal / Public Domain dedication**.
- Build source: the public CC0 `agentkaerf/FreeModels` mirror, packed locally during CI.

## Low-poly cloud art direction
- Reference: **7 Free Low Poly Clouds** by Chadderbox — https://chadderbox.itch.io/low-poly-clouds-free
- The project does not redistribute the paid 50-cloud pack.
- V11 clouds are original procedural low-poly cloud meshes created in Three.js, following the free pack author's recommended visual approach: unlit materials, reusable stretched/rotated silhouettes, and gentle movement.

## Furniture, school props and vehicle
- Original creator: **Kenney**
- License: **CC0 1.0 Universal**
- Public GLB mirror used in CI: `Hidencod/tge-assets`
- Furniture Kit assets used include benches, books, bookcase, potted plants, laptop, ceiling fan, sofa, coffee table, rug, floor lamp, TV, side table, desk, chair and lounge chair.
- Nature Kit asset used: simple fence.
- Car Kit asset used: sedan.

These assets are downloaded only during GitHub Actions and are served locally from the deployed site; the game does not hotlink them at runtime.

## Runtime
Three.js and GLTFLoader are bundled into the local `dist/game.min.js` during GitHub Actions. The public site does not require a third-party JavaScript CDN at runtime. V11 nature and furniture assets are stored under `assets/models/v11/` in the deployed `gh-pages` build.
