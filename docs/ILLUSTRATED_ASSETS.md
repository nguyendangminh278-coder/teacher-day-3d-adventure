# Illustrated asset brief · 2026-11-04

Mode: built-in image_gen, using the user-provided image as a visual reference. No image-generation API is required by the game. Generated originals remain in the Codex generated_images directory; project copies live in assets/illustrations/.

Prompt set:

1. **village.png** — Match the reference lush, highly detailed 16-bit Vietnamese Teacher’s Day village closely: school with Vietnam flag at top center, golden cottage at left, blue car on winding road at upper right, windmill, turquoise waterfall, river and stone bridge. Remove all text, parchment UI, labels and characters. Replace the independent outdoor wishing tree with a flower garden. Make the cottage three floors with exterior stairs and subtle rooftop blossoms. Full-bleed scenery only.
2. **story-atlas.png** — Six equal full-bleed scenes in a strict two-column, three-row atlas. Reading order: school exterior with open gate; cozy Vietnamese classroom with students and teacher desk; blue family car on forest road between school and home; ground-floor living room with father and visible staircase; second floor with two sons and staircase; top-floor rooftop garden with a glowing pink wishing tree and golden cards. Match reference pixel illustration style. No text or UI.
3. **details-atlas.png** — Four equal full-bleed scenes in a strict two-by-two atlas: sunlit school interior hallway; three-floor cottage exterior with parked blue car; open-door blue car at the school gate; detailed wooden interior staircase. No characters, lettering, UI, gutters or borders. Match reference lush storybook pixel art.

Scene atlases are sampled directly in Canvas, rather than shipped as separately edited image files. Main map uses a fixed 1672×941 coordinate system; resize fits the complete map and recomputes the sign positions. The mobile portrait letterbox preserves destination access without cropping the school or home.

4. **family.png** — Transparent sprite atlas, four equal columns in one row. Father with glasses and blue cardigan; older boy with glasses in school uniform; younger boy in school uniform; Vietnamese teacher mother in blue floral áo dài. Full body, feet aligned, detailed chibi pixel style matched to the reference, no scenery or lettering. Original alpha preserved.


## Chronological edition · 2026-11-04

Built-in image_gen, original generated files copied into assets/illustrations/:

- school-thanhhoa.png: full-bleed pixel illustration matching the user-supplied Maps school gate reference: broad yellow rounded arch, burgundy right pillar and circular emblem, open black gates, pennants, tropical trees, yellow school block; morning light, clear center walking route. Source: https://maps.app.goo.gl/Y9fNgz5hbMLD65sr8 .
- home-townhouse.png: full-bleed pixel illustration matching the supplied house facade, green awning, brown double door open at center, cream/red-brown pillars, green-grey checker forecourt, leafy street trees, upper balcony and rooftop terrace. No address or business lettering. Reference observed June 2017 Street View. User's home location and raw reference photos remain outside tracked source.
- mother-walk.png: transparent 4-column × 2-row sprite atlas; reference mother in blue floral áo dài; top row four distinct eastward steps, bottom row four northward/back-view steps, equal cells and aligned feet, no UI. Runtime alpha-bound sampling anchors feet consistently between frames.
- car-action.png: transparent 2-column atlas of the same blue hatchback in side view facing right; left cell doors closed, right cell rear passenger door open. No people, text or background. Car moves independently of street background.
- town-road.png: continuous detailed Vietnamese urban street in afternoon light, three-storey townhouses, bougainvillea, overhead wires, straight horizontal road in foreground, no vehicles or people.

No flashes or fading white overlays. Scene changes follow completed character paths; default durations 2.4–4 seconds, drive 6.5 seconds. Times in the UI are fictional narrative times.


## Family and grounded movement revision · 2026-11-04

Built-in image_gen used with the user's latest family and car photos as identity references. Raw personal photos are not part of the repository. New local assets:

- family-v2.png: four transparent adult-proportioned chibi pixel characters, equal columns: mother in cream dress/blue-white cardigan, father in navy jacket and light gold rim glasses, black-haired son in short-sleeve white T-shirt, copper-highlighted-haired son in black glasses and long-sleeve white shirt. Prompt preserves faces, hairstyles and outfits; no background or ambient glow. A second generation corrected transparency and matched the walking proportions.
- mother-walk-v2.png: same mother's identity/outfit; 4 east-facing walking phases and 4 north-facing phases, transparent 4×2 atlas.
- vios-action.png: champagne sand-beige Toyota Vios four-door sedan, same side-facing car in two cells, rear passenger door closed/open, no people or background. Replaces blue hatchback.
- vios-rear.png: isolated rear-view sand Vios matching user's rear photo. Blank white plate; runtime renders the user-specified plate text exactly with the local font.
- home-rooms-v2.png: equal 2×2 backgrounds, empty living room, empty second-floor room, clear staircase and rooftop wish tree. No baked characters or human portraits. Broad clear floor, props against walls, consistent wood and flower palette.

All characters are separate sprites. Foot-based routes, floor regions and height by perspective are shared in src/scene-layout.js. Manual movement is constrained to floor areas. House route avoids the parked vehicle and ends at the door threshold. Parent/son sprite height ratios share the same perspective function, and draw order follows foot depth. Stair paths follow stair treads; route interpolation uses traveled length rather than equal time for unequal segments.
