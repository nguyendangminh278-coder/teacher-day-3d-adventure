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

## V16–V17 photoreal layer — Poly Haven
V16 and V17 add a physically based, real-world visual layer on top of the interactive game geometry. Poly Haven assets are downloaded during GitHub Actions and served locally from `gh-pages`; the deployed game does not hotlink them at runtime.

- Provider: **Poly Haven** — https://polyhaven.com/
- License: **CC0**.
- HDRI: `cloud_layers` for image-based lighting and the sky/cloud background.
- PBR materials: `forest_floor`, `wood_floor`, `white_plaster_02`, `concrete_floor`, and `brick_wall_003`.
- V17 browser-sized model targets: `SchoolDesk_01`, `SchoolChair_01`, `potted_plant_02`, and `shrub_02`. The CI fetcher treats individual 3D models as optional so deployment remains resilient if an upstream model package changes; downloaded models are converted to local GLB files before publishing. Very heavy scanned trees are deliberately not shipped to the browser; the existing optimized trees remain as distant/background vegetation while scanned shrubs and props provide near-field realism.

V17 also uses Three.js physically based glass, soft contact shadows, high-quality shadow maps on capable desktop hardware, and screen-space ambient occlusion (SSAO). These effects are project code and do not redistribute assets from any commercial game.

## Runtime
Three.js and GLTFLoader are bundled into the local `dist/game.min.js` during GitHub Actions. The public site does not require a third-party JavaScript CDN at runtime. Nature, furniture, HDRI, PBR textures and V17 model assets are stored locally in the deployed `gh-pages` build.
