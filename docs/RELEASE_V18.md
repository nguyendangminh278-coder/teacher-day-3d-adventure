# V18 · A reproducible cinematic journey

The mother remains the protagonist, wearing her original blue áo dài. The ten chapters, 25 classroom wishes and 24 tree wishes preserve the existing story.

## What changed

- A checked-in, modular Three.js runtime replaces build-time source injection. Both local previews and GitHub Pages run the same code.
- Project-owned character and CC0 scenery are committed to `assets/`. Large embedded nature textures are resized to 512px; the migration script records the previous published commit. No external runtime script, model, font, texture or music request is required.
- PBR floors and walls, instanced trees/meadows, a local analytic sky, floating islands, furnished rooms, warm lighting and actor-following shadow coverage create a consistent film-inspired style. Medium uses bloom; high also adds SSAO. Low bypasses postprocessing and shadows.
- Runtime and route QA use the same distance-based sampler. QA checks the complete avatar body against walls, desks, family members and the actual stairwell slabs. Door animations finish before walking begins.
- Narrative delays run on simulation time. Pause and background-tab handling freeze movement, doors, dialogue and flower reveals. Readable dialogue, keyboard controls, touch camera rotation/pinch zoom, inert hidden panels and modal focus loops support desktop and mobile.
- Only stable chapters are saved. Reloading during the drive resumes the classroom; malformed/incompatible saves and denied storage are handled. Replay resets tasks, UI, doors, particles and flowers in place.
- The soundtrack is an original, quiet pentatonic Web Audio score, started only by the music button. The complete wish list remains available after the finale and individual blossoms can be selected.
- CI builds and plays the journey before publishing to the existing `gh-pages` branch, preserving its Git history, then explicitly requests the configured Pages build. Pull requests run verification without publishing.

## Verification

`npm run check` runs Node tests, full-body route QA, a production build and Playwright browser tests. The browser suite uses software WebGL to exercise a complete journey, pause, save/resume, replay, every graphics preset, mobile panels, malformed saves and failed hero/car models. Screenshots are captured in `test-results/` and uploaded by CI.

QA query parameters (`qa=1`, optional `qaSpeed`, `qaStage`, `qaQuality`) support reproducible browser tests. Their debug object exposes read-only observations. Ordinary visits have no debug object or accelerated clock.

## Practical limits

This is a polished, stylized browser experience, not a commercial AAA engine or a claim of flawless behavior on every GPU. The character uses lightweight pivot animation rather than motion capture. WebGL 2 is required. Actual frame rates vary by device; software-rendered tests prove functionality rather than hardware performance. Optional scenery has procedural fallbacks if an asset fails to load.

Legacy fetch/injection scripts remain as historical authoring tools. They are not invoked by the build or deployment workflow.
