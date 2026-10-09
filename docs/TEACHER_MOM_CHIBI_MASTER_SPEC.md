# Teacher Mom Chibi — Master Character, Narrative & Integration Spec

> Historical concept brief. The implemented V18 character follows `src/config.js` and the existing original model: pastel-blue áo dài, shoulder-length hair and no glasses. The speculative visual/animation targets below are concept guidance, not shipped features. Current integration and verified behavior are documented in `RELEASE_V18.md`.

## 1. Creative direction

The protagonist is no longer a generic mascot. She is **the mother herself**, represented as an emotional, warm 3D chibi teacher. She is both the teacher in the classroom and the central playable character throughout the entire 20/11 journey.

Core emotional keywords: warm, gentle, maternal, intelligent, kind, dignified, approachable, nostalgic, loving.

Primary visual language:
- stylized 3D chibi, not exaggerated anime
- large expressive head, small body, soft proportions
- warm smile and kind eyes
- thin glasses
- neat hair bun with a few soft front strands
- pastel Vietnamese áo dài, ideally blush pink / peach cream / light lavender accents
- elegant low heels or soft neutral shoes
- optional small teaching notebook or folder

Recommended palette:
- pastel blush: #F6C8D7
- peach cream: #F9E7DF
- ivory: #FFF9F1
- warm dark brown hair: #3E2F2C
- natural warm skin: #F2D2BE
- soft lavender: #D9C7F2

Target game silhouette: instantly readable as “cô giáo” from a third-person camera while still feeling like a mother rather than a generic NPC.

---

## 2. Prompt pack for concept art / AI-assisted 3D

### 2.1 Hero character concept prompt

Create a premium 3D chibi Vietnamese female teacher who is also a loving mother figure. She has a warm round face, kind expressive eyes, a gentle smile, thin elegant glasses, and dark brown-black hair tied in a neat bun with a few soft strands framing the face. She wears a graceful pastel Vietnamese áo dài in blush pink and peach-cream tones, with very subtle floral embroidery and ivory trousers. Her proportions are stylized chibi: large head, small body, compact hands and feet, but not childish. The character should feel maternal, intelligent, comforting, dignified, emotionally warm, and approachable. Use soft PBR materials, clean topology, gentle subsurface skin shading, fabric with soft folds, and a polished family-friendly animated-film aesthetic. Produce front, side, back, three-quarter and facial-expression references. Neutral studio lighting, clean background, full-body turnaround, game-ready visual design, suitable for a heartfelt Vietnamese Teachers’ Day 20/11 third-person web adventure.

### 2.2 Face / expression sheet prompt

Create an expression sheet for the same 3D chibi Vietnamese teacher-mother character. Keep the same face, glasses, bun hairstyle and pastel áo dài. Show: gentle idle smile, warm hello, proud teacher smile, soft laugh, touched/emotional expression with hand near chest, surprised but happy, calm listening expression, affectionate family smile, and final grateful expression under warm golden light. Avoid exaggerated cartoon faces. The emotional range should stay subtle, warm and mature.

### 2.3 Costume detail prompt

Design a refined pastel Vietnamese áo dài for a warm middle-aged chibi teacher-mother character. Blush pink and peach-cream base, ivory trousers, subtle embroidered flower motifs, graceful side slits, soft fabric folds, modest elegant collar, no flashy metallic details. The costume must work for animation, walking, running and stair climbing in a real-time 3D game. Keep the silhouette simple enough for web performance.

### 2.4 Blender modeling brief

Model a stylized 3D chibi Vietnamese female teacher who is also a mother figure. Use clean production-ready topology and proportions suitable for third-person gameplay. Maintain a warm, mature face with large but believable eyes, thin glasses, neat hair bun, and pastel áo dài. Keep the model optimized for browser-based rendering.

Technical target:
- 15k–35k triangles for character body and clothing combined
- 1K textures by default, optional 2K hero texture for desktop
- one main skin material, one hair material, one áo dài material, one accessory/glasses material where practical
- standard PBR maps: BaseColor, Normal, Roughness/Metallic or ORM
- no unnecessary transparency except glasses if absolutely required
- origin at feet, Y-up, forward aligned consistently with glTF / Three.js
- apply transforms before export
- export as GLB
- rig should be humanoid and animation-friendly
- preserve glasses and hair bun as stable accessories during animation

Suggested object names:
- TeacherMom_Root
- TeacherMom_Body
- TeacherMom_Head
- TeacherMom_Hair
- TeacherMom_Glasses
- TeacherMom_AoDai
- TeacherMom_Trousers
- TeacherMom_Shoes
- TeacherMom_Notebook

### 2.5 Rigging prompt / brief

Rig the chibi teacher-mother character for a lightweight third-person web game. Use a clean humanoid skeleton with stable deformation for áo dài, shoulders, wrists, neck and face. The movement style should be graceful, warm and feminine rather than exaggerated. Avoid extreme squash-and-stretch. Preserve the calm maternal personality in all animation timing.

Required animation clips:
- Idle
- Walk
- Run
- Wave
- Jump
- Fall
- Land
- TurnLeft
- TurnRight
- Teach
- Talk
- Happy
- ReceiveLove
- LookAround
- WalkStairs
- EnterCar
- ExitCar
- FinalPose

Suggested durations:
- Idle: 4–6 s loop
- Walk: 1.0–1.2 s loop
- Run: 0.7–0.9 s loop
- Wave: 1.8–2.5 s
- Jump + Fall + Land: split clips, total around 1.5–2.0 s
- Teach: 3–5 s loop
- ReceiveLove: 2.5–4 s
- FinalPose: 4–6 s

---

## 3. Story rewrite — mother is the protagonist

### Scene 1 — The portal opens
A luminous portal opens in the sky. The teacher-mother chibi appears, gently jumps out, lands on a cloud and waves hello. The camera starts cinematic, then settles behind her into a third-person position.

Dialogue: “Xin chào… hôm nay mẹ sẽ bước vào một hành trình rất đặc biệt.”

Objective: “Bắt đầu hành trình của Mẹ”

### Scene 2 — Cloud garden
She jumps from the cloud and lands in a floating garden. The player sees the flower path ahead. Camera stays behind and slightly above the character.

Dialogue: “Con đường hôm nay đẹp quá. Không biết phía trước đang chờ điều gì nhỉ?”

Objective: “Đi qua khu vườn trên mây”

### Scene 3 — The road to school
She walks or runs along the flower-lined road. The school gate is visible far ahead and grows naturally larger as she approaches. No scene cut.

Dialogue: “Mỗi bước chân đến trường đều mang theo rất nhiều kỷ niệm.”

Objective: “Đi đến ngôi trường thân thương”

### Scene 4 — School entrance and corridor
She physically passes through the gate, crosses the courtyard, enters the corridor and continues into the classroom. Use one continuous world with checkpoint-triggered camera easing rather than fades.

Dialogue: “Ngôi trường này đã lưu giữ thật nhiều tiếng cười và những thế hệ học trò.”

Objective: “Trở về lớp học của mẹ”

### Scene 5 — Classroom wishes
The same protagonist becomes the teacher at the front of the class. Do not spawn a second teacher NPC. Students look toward her. The player reaches a podium trigger; then she transitions to Teach / Idle while wish cards begin appearing.

Dialogue: “Nhìn các con trưởng thành chính là một trong những niềm hạnh phúc lớn nhất của cô.”

Objective: “Lắng nghe những lời chúc từ học trò”

CTA: “Tan lớp”

### Scene 6 — Leaving school
After the class sequence, the same character walks from the podium through the classroom door, corridor, school yard and parking area. She then enters the car with an EnterCar transition.

Dialogue: “Một ngày đứng lớp khép lại rồi. Giờ mình về nhà thôi.”

Objective: “Trở về tổ ấm”

### Scene 7 — Drive home
The camera switches from character-follow to a car chase camera. The vehicle follows a curved road. Use continuous world travel; avoid teleporting except as a fallback on low-end devices.

Optional narration: “Sau mỗi ngày dài, nhà vẫn luôn là nơi ấm áp nhất.”

### Scene 8 — Home and family
She exits the car, walks into the house, meets the father on floor 1, then walks upstairs to floor 2 where two sons are waiting. She continues to floor 3.

Dialogue: “Dù một ngày có dài đến đâu, trở về nhà vẫn luôn là khoảnh khắc ấm áp nhất.”

Objective: “Đi đến điều bất ngờ cuối cùng”

### Scene 9 — Wish tree finale
A large ancient tree grows upward and blooms. Wishes appear as flowers rather than flat panels only. The mother stands beneath the tree, changes to ReceiveLove / FinalPose, and the camera performs a slow cinematic orbit.

Final line: “Cảm ơn mẹ vì đã luôn là cô giáo tận tâm và là người mẹ tuyệt vời của gia đình mình.”

Final title: “Cảm ơn mẹ vì vừa là mẹ, vừa là người thầy tuyệt vời nhất.”

---

## 4. 25 classroom wishes

1. Chúc cô luôn mạnh khỏe, bình an và thật nhiều niềm vui.
2. Chúc cô có một ngày 20/11 thật ấm áp và đáng nhớ.
3. Cảm ơn cô vì đã luôn kiên nhẫn với chúng em.
4. Chúc cô luôn giữ được nụ cười hiền như mỗi ngày.
5. Cảm ơn cô vì đã biến lớp học thành một nơi thật ấm áp.
6. Chúc cô luôn hạnh phúc trong công việc và cuộc sống.
7. Chúc cô thật nhiều sức khỏe để tiếp tục gieo những mầm xanh.
8. Cảm ơn cô vì mỗi bài học đều chứa cả sự tận tâm.
9. Chúc cô luôn được học trò yêu quý và trân trọng.
10. Cảm ơn cô vì đã luôn lắng nghe và thấu hiểu chúng em.
11. Chúc cô ngày nào cũng có thật nhiều tiếng cười.
12. Mong những điều dịu dàng nhất luôn tìm đến với cô.
13. Chúc cô luôn trẻ trung, xinh đẹp và tràn đầy năng lượng.
14. Cảm ơn cô vì đã truyền cho chúng em niềm tin vào chính mình.
15. Chúc cô mãi là người lái đò tận tâm và hạnh phúc.
16. Chúng em luôn biết ơn những điều cô đã dạy.
17. Chúc cô luôn vững vàng và tự hào trên hành trình làm nghề.
18. Cảm ơn cô vì những ngày cô vẫn mỉm cười dù rất mệt.
19. Chúc mỗi giờ lên lớp của cô đều là một giờ thật vui.
20. Mong cô luôn được bao quanh bởi những người yêu thương.
21. Cảm ơn cô vì đã cho chúng em không chỉ kiến thức mà cả sự tử tế.
22. Chúc cô luôn tỏa sáng theo cách rất riêng của mình.
23. Chúc mọi ước mơ của cô đều dần trở thành hiện thực.
24. Mong cô luôn bình yên khi trở về nhà sau mỗi ngày đứng lớp.
25. Chúc cô mãi hạnh phúc bên gia đình và những thế hệ học trò.

---

## 5. Wish-tree messages

Recommended messages should feel more personal and familial than the classroom wishes:
- Mẹ luôn mạnh khỏe
- Mẹ luôn bình an
- Mẹ luôn vui vẻ
- Mẹ luôn được yêu thương
- Mẹ luôn giữ nụ cười thật đẹp
- Mẹ có thật nhiều thời gian cho chính mình
- Mẹ luôn hạnh phúc với nghề giáo
- Mỗi ngày đi dạy của mẹ đều có niềm vui
- Mọi vất vả của mẹ đều được đền đáp
- Mẹ luôn tự hào về những học trò của mình
- Gia đình mình luôn ở bên mẹ
- Bố luôn đồng hành cùng mẹ
- Hai con trai luôn là niềm vui của mẹ
- Mẹ luôn trẻ trung và rạng rỡ
- Mẹ luôn đủ đầy yêu thương
- Mọi điều tốt đẹp đều tìm đến mẹ
- Những ước mơ của mẹ đều thành hiện thực
- Mẹ mãi là cô giáo tuyệt vời trong lòng học trò
- Mẹ mãi là người thầy đầu tiên của các con
- Mẹ luôn có một mái nhà thật ấm áp
- Mẹ luôn được trân trọng vì những điều mẹ đã cho đi
- Mẹ có thật nhiều những ngày nhẹ nhàng
- Mẹ luôn có chúng con ở phía sau
- Cảm ơn mẹ vì vừa là mẹ, vừa là người thầy tuyệt vời nhất

---

## 6. Technical integration plan for the current Three.js project

The current project already uses Three.js, GLTFLoader, a third-person camera, path movement, a local mascot model and a local car model. The refactor should preserve that foundation and replace the generic mascot layer instead of rewriting the engine.

### Phase A — Character data model

Use a dedicated character configuration object:

```js
const TEACHER_MOM_CHARACTER = {
  modelPath: './assets/models/teacher_mom_chibi.glb',
  fallbackModelPath: './assets/models/mascot.gltf',
  animations: {
    idle: ['idle'], walk: ['walk'], run: ['run'], wave: ['wave'],
    jump: ['jump'], fall: ['fall'], land: ['land'], teach: ['teach'],
    happy: ['happy'], receiveLove: ['receivelove'], stairs: ['walkstairs'],
    enterCar: ['entercar'], exitCar: ['exitcar']
  }
};
```

Fallback behavior is important: if the custom GLB is not available yet, the existing CC0 model can still keep the game playable.

### Phase B — Replace the loader logic

Current logic loads `./assets/models/mascot.gltf`. Change this so the loader first attempts `teacher_mom_chibi.glb`, then falls back to the existing mascot only on failure.

Pseudo implementation:

```js
function loadTeacherMom() {
  loader.load(
    TEACHER_MOM_CHARACTER.modelPath,
    setupTeacherMom,
    onProgress,
    () => loader.load(TEACHER_MOM_CHARACTER.fallbackModelPath, setupTeacherMom)
  );
}
```

`setupTeacherMom()` should:
- normalize model height to about 2.35–2.55 world units
- enable shadows on meshes
- build AnimationMixer
- register all animation clips by lowercase names
- start Idle
- update `assetStatus`

### Phase C — Remove duplicate teacher NPC

The classroom currently contains a separately generated teacher person at the front of the room. Remove that NPC. The protagonist herself must walk to the podium checkpoint and switch to `Teach` or `Idle` there.

### Phase D — Animation state machine

Replace ad-hoc animation calls with a small state controller:

```js
setCharacterState('idle');
setCharacterState('walk');
setCharacterState('run');
setCharacterState('wave');
setCharacterState('teach');
setCharacterState('receiveLove');
```

Rules:
- path speed < 2.2 → Walk
- path speed >= 2.2 → Run
- portal exit → Jump/Fall/Land
- classroom podium → Teach
- wish reveal → ReceiveLove
- final tree → ReceiveLove then FinalPose
- entering vehicle → EnterCar then hide character visual
- arriving home → show visual then ExitCar

### Phase E — Continuous traversal instead of scene replacement

Keep all locations in one world coordinate system. Use checkpoints such as:
- portal cloud
- garden landing
- flower road start
- school gate
- corridor start
- classroom podium
- parking
- home door
- floor 1
- floor 2
- floor 3 / tree

Each action starts a movement spline or waypoint sequence. Do not fade the full screen between stages. UI text may change when the character crosses checkpoint triggers.

### Phase F — Third-person camera

Recommended default follow offset:

```js
cameraOffset = new THREE.Vector3(0, 3.8, 7.0);
lookAtOffset = new THREE.Vector3(0, 1.6, -2.8);
```

Smooth both position and look target with damping. Use a wider camera during running and a closer camera for emotional moments.

Camera modes:
- `FOLLOW_CHARACTER`
- `FOLLOW_CAR`
- `CLASSROOM_CINEMATIC`
- `TREE_ORBIT`

Do not instantiate new cameras; move one camera between modes.

### Phase G — Path system

For every travel segment, use waypoints or CatmullRomCurve3.

Example:

```js
const schoolPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, -15),
  new THREE.Vector3(0, 0, -40),
  new THREE.Vector3(1, 0, -62),
  new THREE.Vector3(0, 0, -78)
]);
```

Movement update should:
- advance normalized progress 0..1
- place character at `curve.getPointAt(progress)`
- orient toward `curve.getTangentAt(progress)`
- select Walk/Run based on speed
- let camera follow continuously

### Phase H — Mobile controls

Desktop:
- click / space: advance scripted beat
- optional WASD mode later
- mouse drag: rotate follow camera slightly

Mobile:
- tap: advance scripted beat
- virtual joystick as an optional second mode
- lower pixel ratio to 1.0
- reduce shadow map / particle count

### Phase I — Performance budget

Recommended target:
- first interactive < 3 s on normal broadband after cache
- main bundle compressed ideally < 500–700 KB
- custom character GLB ideally < 2–4 MB
- total initial scene assets < 8–12 MB
- 30 FPS minimum on mid-range mobile
- lazy-load nonessential home/tree assets after school scene begins

Optimization:
- Draco or Meshopt only if decoder is bundled locally
- texture atlas where possible
- instanced flowers / repeated desks
- frustum culling
- no 4K textures
- avoid more than 1–2 shadow-casting lights

### Phase J — Exact replacement checklist

1. Add `assets/models/teacher_mom_chibi.glb`.
2. Update config with custom model path and animation aliases.
3. Load teacher model first, keep existing mascot only as fallback.
4. Remove the duplicate classroom teacher NPC.
5. Rename all UI labels from “Mầm Nhỏ” to “Mẹ” / “Cô giáo”.
6. Make the protagonist stop on the classroom podium and play `Teach`.
7. On “Tan lớp”, walk the same protagonist physically out of the classroom.
8. Play `EnterCar`, hide her model while driving, then `ExitCar` at home.
9. Make stair traversal visible rather than teleporting floors.
10. At the final tree, play `ReceiveLove` and a slow orbit camera while flowers bloom.
11. Keep fallback model and fallback animation names so the website never becomes unplayable if the custom GLB has a naming mismatch.
12. Test Chrome desktop, Chrome Android and Safari iOS before final delivery.

---

## 7. Personalization pass when reference photos are available

For a generic emotional teacher-mother version, the above spec is sufficient. For a version that visually resembles the real mother, use 2–5 clear reference photos covering:
- front face
- three-quarter face
- hairstyle / bun
- glasses if normally worn
- full-body or áo dài preference

Personalize only likeness features such as face shape, hairstyle, glasses, skin tone and favorite áo dài palette. Keep the rig, topology, animation names and technical constraints unchanged so the web integration remains stable.
