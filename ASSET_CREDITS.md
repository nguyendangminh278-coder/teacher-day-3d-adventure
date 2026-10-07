# 3D Asset Credits

This project uses open game-ready 3D models as temporary illustrative assets. No model is extracted or ripped from a proprietary commercial game.

## Mascot example
- Model: `Panda.gltf` from **Cute Animated Monsters**
- Original creator: **Quaternius**
- Repository mirror: `agentkaerf/FreeModels`
- License: **CC0 1.0 Universal / Public Domain Dedication**
- Purpose here: temporary animated mascot reference. It can later be replaced by the final custom “Mầm Nhỏ” model without changing the movement/camera system.

## Car example
- Model: `sedan.glb` from the **Car Kit**
- Original creator: **Kenney**
- Repository: `Hidencod/tge-assets`
- License: **CC0 1.0 Universal**
- Purpose here: temporary vehicle used for the school-to-home driving sequence.

## Runtime
The public site does not download these models from third-party hosts at runtime. The GitHub Actions build downloads the CC0 source assets and publishes local copies under `assets/models/` together with the game bundle.
