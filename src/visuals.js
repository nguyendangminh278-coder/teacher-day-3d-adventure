import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export const QUALITY = {
  low: { ratio: 1, shadow: 0, bloom: false, ao: false },
  medium: { ratio: 1.35, shadow: 1024, bloom: true, ao: false },
  high: { ratio: 1.75, shadow: 2048, bloom: true, ao: true },
};

export function createPresentation(renderer, scene, camera, sun) {
  let composer,
    level = "medium";
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.28;
  room.dispose();
  pmrem.dispose();
  // A local analytic sky keeps startup independent of a 7 MB HDR download.
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(600, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color("#669cc0") },
        bottom: { value: new THREE.Color("#dcebe7") },
      },
      vertexShader:
        "varying vec3 vPosition; void main(){vPosition=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: `varying vec3 vPosition; uniform vec3 top; uniform vec3 bottom;
      void main(){vec3 d=normalize(vPosition); float h=pow(max(d.y,0.0),.55);
      vec3 color=mix(bottom,top,h); float glow=pow(max(dot(d,normalize(vec3(-.6,.28,-.6))),0.0),48.0);
      color+=vec3(.38,.24,.08)*glow; gl_FragColor=vec4(color,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
    }),
  );
  sky.frustumCulled = false;
  scene.add(sky);
  function resize() {
    const preset = QUALITY[level];
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, preset.ratio));
    renderer.setSize(innerWidth, innerHeight);
    composer?.setPixelRatio(renderer.getPixelRatio());
    composer?.setSize(innerWidth, innerHeight);
  }
  function setQuality(value) {
    level = QUALITY[value] ? value : "medium";
    const preset = QUALITY[level];
    if (composer) {
      for (const pass of composer.passes) pass.dispose?.();
      composer.dispose();
      composer = null;
    }
    renderer.shadowMap.enabled = preset.shadow > 0;
    sun.castShadow = preset.shadow > 0;
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
    sun.shadow.mapSize.set(preset.shadow || 512, preset.shadow || 512);
    scene.traverse((o) => {
      if (o.isMesh && o.material)
        for (const mat of [].concat(o.material)) mat.needsUpdate = true;
    });
    if (preset.bloom) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      if (preset.ao) {
        const ao = new SSAOPass(scene, camera, innerWidth, innerHeight);
        ao.kernelRadius = 8;
        ao.minDistance = 0.002;
        ao.maxDistance = 0.12;
        composer.addPass(ao);
      }
      composer.addPass(
        new UnrealBloomPass(
          new THREE.Vector2(innerWidth, innerHeight),
          0.22,
          0.55,
          1.1,
        ),
      );
      composer.addPass(new OutputPass());
    }
    resize();
    return level;
  }
  return {
    setQuality,
    resize,
    render(dt, target, space) {
      sky.visible = space !== "house";
      sky.position.copy(camera.position);
      // Tight shadow volume follows the actor instead of covering a 240m world.
      sun.target.position.copy(target);
      sun.position.copy(target).add(new THREE.Vector3(-24, 36, 18));
      sun.target.updateMatrixWorld();
      if (composer) composer.render(dt);
      else renderer.render(scene, camera);
    },
    get level() {
      return level;
    },
  };
}

function seededRandom(seed = 2011) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function instances(parent, geometry, material, placements, cast = true) {
  const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
  const dummy = new THREE.Object3D();
  placements.forEach((p, i) => {
    dummy.position.set(...p.position);
    dummy.scale.set(...(p.scale || [1, 1, 1]));
    dummy.rotation.set(...(p.rotation || [0, 0, 0]));
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (p.color) mesh.setColorAt(i, new THREE.Color(p.color));
  });
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function decorateWorld({
  outdoor,
  house,
  finale,
  box,
  sphere,
  cyl,
  M,
  loader,
  desks,
  treeRoot,
}) {
  const random = seededRandom();
  const foliage = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
  });
  const leafGeometry = new THREE.IcosahedronGeometry(1, 1);
  const trunks = [],
    leaves = [];
  const islands = [
    [-13, -18, 8],
    [13, -29, 8],
    [-14, -44, 10],
    [14, -59, 9],
    [-15, -70, 7],
    [15, -77, 7],
  ];
  for (const [x, z, r] of islands) {
    cyl(outdoor, r, r * 0.8, 0.8, [x, -0.42, z], 0x8caa74, 32);
    const base = new THREE.Mesh(
      new THREE.ConeGeometry(r * 0.82, 6, 12),
      M(0x777c69),
    );
    base.rotation.z = Math.PI;
    base.position.set(x, -3.8, z);
    outdoor.add(base);
    for (let i = 0; i < 7; i++) {
      const a = random() * Math.PI * 2,
        radius = Math.sqrt(random()) * r * 0.7;
      const tx = x + Math.cos(a) * radius,
        tz = z + Math.sin(a) * radius,
        height = 3.6 + random() * 3;
      trunks.push({
        position: [tx, height / 2, tz],
        scale: [0.28, height, 0.28],
        rotation: [0, a, 0.04],
      });
      for (let k = 0; k < 4; k++)
        leaves.push({
          position: [
            tx + Math.cos(k * 2.4) * 1.1,
            height + Math.sin(k) * 0.5,
            tz + Math.sin(k * 2.4) * 1.1,
          ],
          scale: [1.5 + random() * 0.6, 1.3 + random() * 0.6, 1.5],
          rotation: [random(), a, random()],
          color: ["#5e8d6d", "#7da373", "#a7b476", "#719b89"][i % 4],
        });
    }
  }
  const fallbackTrunks = instances(
    outdoor,
    new THREE.CylinderGeometry(1, 1.5, 1, 8),
    M(0x8e7151),
    trunks,
  );
  const fallbackLeaves = instances(outdoor, leafGeometry, foliage, leaves);
  const meadowBases = [],
    meadowClouds = [];
  for (let z = -10; z > -74; z -= 5.5)
    for (const x of [-6.2, 6.2]) {
      meadowBases.push({
        position: [x, -0.18, z],
        scale: [3.4, 0.25, 4],
        color: "#9aaa79",
      });
      meadowClouds.push({ position: [x, -0.85, z], scale: [3.5, 0.7, 4.2] });
    }
  instances(
    outdoor,
    new THREE.SphereGeometry(1, 16, 8),
    foliage,
    meadowBases,
    false,
  );
  instances(
    outdoor,
    new THREE.SphereGeometry(1, 12, 8),
    M(0xf4eee1),
    meadowClouds,
    false,
  );
  // Meadow beds stay outside the movement corridor. Hundreds of petals share one draw call.
  const stems = [],
    petals = [],
    centers = [],
    grass = [];
  for (let i = 0; i < 360; i++) {
    const x = (i % 2 ? -1 : 1) * (3.7 + random() * 3.7),
      z = -8 - random() * 64,
      h = 0.3 + random() * 0.45;
    stems.push({ position: [x, h / 2, z], scale: [0.025, h, 0.025] });
    centers.push({ position: [x, h, z], scale: [0.075, 0.065, 0.075] });
    const color = ["#e59caa", "#f2cf90", "#d6badb", "#fff0d4"][i % 4];
    for (let k = 0; k < 5; k++) {
      const a = (k * Math.PI * 2) / 5;
      petals.push({
        position: [x + Math.cos(a) * 0.1, h, z + Math.sin(a) * 0.1],
        scale: [0.12, 0.045, 0.09],
        rotation: [0, a, 0],
        color,
      });
    }
    grass.push({
      position: [x, 0.16, z],
      scale: [0.035, 0.32, 0.035],
      rotation: [0, random() * 6.28, 0.2],
    });
  }
  instances(
    outdoor,
    new THREE.CylinderGeometry(1, 1, 1, 5),
    M(0x668765),
    stems,
    false,
  );
  instances(outdoor, new THREE.SphereGeometry(1, 6, 4), foliage, petals, false);
  instances(
    outdoor,
    new THREE.SphereGeometry(1, 6, 4),
    M(0xd2a958),
    centers,
    false,
  );
  instances(
    outdoor,
    new THREE.ConeGeometry(1, 1, 3),
    M(0x54745b),
    grass,
    false,
  );
  // Walkable foundations make the school, exit path and home continuous.
  box(outdoor, [38, 0.32, 53], [0, -0.18, -103], 0xbabfac);
  box(outdoor, [20, 0.3, 19], [100, -0.18, -92], 0xbabfac);
  for (const x of [-17, 17]) {
    for (let z = -87; z > -102; z -= 4.6) {
      box(outdoor, [0.16, 2.8, 2.3], [x, 3.7, z], 0x668894);
      box(outdoor, [0.2, 0.12, 2.6], [x, 2.25, z], 0xffeed5);
      box(outdoor, [0.22, 2.9, 0.08], [x, 3.7, z], 0xffeed5);
    }
    box(outdoor, [10.8, 0.4, 20.2], [x < 0 ? -12 : 12, 7.1, -92], 0x607b79);
  }
  for (const z of [-87, -94, -101])
    for (const x of [-7, 7])
      cyl(outdoor, 0.17, 0.21, 6.8, [x, 3.4, z], 0xffefd8, 12);
  // Desk legs, chairs and 25 seated pupils; center and exit aisles stay open.
  for (const desk of desks) {
    const x = (desk.min[0] + desk.max[0]) / 2,
      z = (desk.min[2] + desk.max[2]) / 2;
    for (const dx of [-0.85, 0.85])
      for (const dz of [-0.38, 0.38])
        box(outdoor, [0.08, 0.84, 0.08], [x + dx, 0.45, z + dz], 0x676d62);
    box(outdoor, [1.2, 0.1, 0.65], [x, 0.55, z + 1], 0x9e7d59);
    box(outdoor, [1.2, 0.75, 0.1], [x, 0.9, z + 1.28], 0x9e7d59);
    box(outdoor, [0.5, 0.035, 0.34], [x + 0.4, 1.05, z], 0xf5efdb);
  }
  for (let z = -110; z > -121; z -= 3.3) {
    box(outdoor, [0.12, 2.2, 2], [-10, 3.15, z], 0x7b9ca3);
    box(outdoor, [0.16, 0.08, 2.15], [-9.9, 2.05, z], 0xffeed5);
  }
  const bulbs = new THREE.MeshStandardMaterial({
    color: 0xffe2a8,
    emissive: 0xffd690,
    emissiveIntensity: 1.4,
  });
  const lights = [];
  for (let z = -109; z > -126; z -= 5) {
    box(outdoor, [16, 0.12, 0.14], [0, 5.4, z], 0xc5af91);
    lights.push({ position: [0, 5.25, z], scale: [0.3, 0.12, 0.3] });
  }
  instances(outdoor, new THREE.SphereGeometry(1, 12, 8), bulbs, lights, false);
  // Furnished house; props avoid the fixed routes and family meeting points.
  const tasks = [];
  function normalize(model, height) {
    const box = new THREE.Box3().setFromObject(model),
      size = box.getSize(new THREE.Vector3());
    model.scale.setScalar(height / Math.max(0.01, size.y));
    const fitted = new THREE.Box3().setFromObject(model),
      center = fitted.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -fitted.min.y, -center.z);
    model.updateMatrixWorld(true);
  }
  function batchModel(model, parent, placements) {
    model.traverse((o) => {
      if (!o.isMesh) return;
      const batch = new THREE.InstancedMesh(
          o.geometry,
          o.material,
          placements.length,
        ),
        dummy = new THREE.Object3D();
      placements.forEach((p, i) => {
        dummy.position.set(...p.position);
        dummy.rotation.set(0, p.rotation || 0, 0);
        dummy.scale.setScalar(p.scale || 1);
        dummy.updateMatrix();
        batch.setMatrixAt(i, dummy.matrix.clone().multiply(o.matrixWorld));
      });
      batch.castShadow = true;
      batch.receiveShadow = true;
      parent.add(batch);
    });
  }
  tasks.push(
    loader
      .loadAsync("./assets/models/v11/quaternius/tree_common.glb")
      .then((g) => {
        normalize(g.scene, 6);
        batchModel(
          g.scene,
          outdoor,
          trunks.map((t) => ({
            position: [t.position[0], 0, t.position[2]],
            scale: t.scale[1] / 6,
            rotation: t.rotation[1],
          })),
        );
        fallbackTrunks.visible = fallbackLeaves.visible = false;
      })
      .catch(() => {}),
  );
  tasks.push(
    loader
      .loadAsync("./assets/models/v11/quaternius/bush_flowers.glb")
      .then((g) => {
        normalize(g.scene, 1.2);
        const placements = [];
        for (let z = -14; z > -74; z -= 6.5)
          for (const x of [-7, 7])
            placements.push({
              position: [x, 0, z],
              scale: 0.8 + random() * 0.25,
              rotation: random() * 6.28,
            });
        batchModel(g.scene, outdoor, placements);
      })
      .catch(() => {}),
  );
  function prop(name, parent, placements, height) {
    tasks.push(
      loader
        .loadAsync(`./assets/models/v11/kenney/${name}.glb`)
        .then((g) => {
          const model = g.scene,
            b = new THREE.Box3().setFromObject(model),
            size = b.getSize(new THREE.Vector3());
          model.scale.setScalar(height / Math.max(0.01, size.y));
          const bounds = new THREE.Box3().setFromObject(model);
          model.position.y -= bounds.min.y;
          const center = bounds.getCenter(new THREE.Vector3());
          model.position.x -= center.x;
          model.position.z -= center.z;
          model.traverse((o) => {
            if (o.isMesh) {
              o.castShadow = true;
              o.receiveShadow = true;
            }
          });
          for (const [x, y, z, rotation = 0] of placements) {
            const pivot = new THREE.Group();
            pivot.add(model.clone(true));
            pivot.position.set(x, y, z);
            pivot.rotation.y = rotation;
            parent.add(pivot);
          }
        })
        .catch(() => {}),
    );
  }
  prop("sofa", house, [[-5, 0.18, -4, Math.PI]], 1.3);
  prop("coffee-table", house, [[-5, 0.18, -2]], 0.6);
  prop(
    "bookcase",
    house,
    [
      [7.8, 0.18, -5.5],
      [7.8, 4.65, -5.5],
    ],
    2.4,
  );
  prop("floor-lamp", house, [[-7.5, 0.18, -3.6]], 2.6);
  prop(
    "pottedplant",
    house,
    [
      [7, 0.18, 4.6],
      [-7, 4.65, -4],
    ],
    1.4,
  );
  prop(
    "bench",
    outdoor,
    [
      [-5, 0.18, -91, Math.PI / 2],
      [5, 0.18, -98, -Math.PI / 2],
    ],
    1.1,
  );
  for (const y of [2.2, 6.7])
    for (const x of [-4, 4]) {
      box(house, [2.4, 1.6, 0.1], [x, y, -6.42], 0xe9d1a5);
      box(house, [2.1, 1.3, 0.12], [x, y, -6.3], 0x7f9e8f);
    }
  // Upper landing and balustrades leave the stairwell open.
  for (const x of [-8.5, 8.5])
    for (let z = -5; z < 5; z += 1.2) {
      cyl(house, 0.04, 0.04, 1, [x, 5.15, z], 0xb48f64, 6);
    }
  const canopy = [];
  for (let i = 0; i < 68; i++) {
    const a = random() * 6.28,
      r = 1 + random() * 2.7;
    canopy.push({
      position: [Math.cos(a) * r, 5 + random() * 1.6, -2.1 + Math.sin(a) * r],
      scale: [
        0.65 + random() * 0.8,
        0.65 + random() * 0.65,
        0.75 + random() * 0.7,
      ],
      rotation: [random(), a, random()],
      color: ["#a7b981", "#b2be88", "#d0c58d", "#94ae82"][i % 4],
    });
  }
  const fallbackCanopy = instances(finale, leafGeometry, foliage, canopy);
  tasks.push(
    loader
      .loadAsync("./assets/models/v11/quaternius/tree_twisted.glb")
      .then((g) => {
        normalize(g.scene, 7.4);
        g.scene.scale.x *= 1.8;
        g.scene.scale.z *= 1.8;
        g.scene.position.add(new THREE.Vector3(0, 0, -2.1));
        g.scene.traverse((o) => {
          if (o.isMesh) {
            if (o.material.name?.startsWith("Leaves")) {
              const material = o.material.clone();
              material.onBeforeCompile = (shader) => {
                shader.fragmentShader = shader.fragmentShader.replace(
                  "#include <map_fragment>",
                  `#include <map_fragment>
                  float warmth=max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b));
                  diffuseColor.rgb=mix(vec3(.30,.12,.17),vec3(.88,.52,.60),clamp(warmth*1.3,0.0,1.0));`,
                );
              };
              material.customProgramCacheKey = () => "wish-tree-rose-v18";
              o.material = material;
            }
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        finale.add(g.scene);
        fallbackCanopy.visible = false;
        treeRoot.children.forEach((o) => {
          if (o.isMesh) o.visible = false;
        });
      })
      .catch(() => {}),
  );
  const string = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    string.push({
      position: [
        Math.cos(a) * 4.3,
        4.8 + Math.sin(a * 3) * 0.4,
        -2 + Math.sin(a) * 4.3,
      ],
      scale: [0.06, 0.06, 0.06],
    });
  }
  instances(finale, new THREE.SphereGeometry(1, 8, 6), bulbs, string, false);
  const petalsFinal = [];
  for (let i = 0; i < 100; i++) {
    const a = random() * 6.28,
      r = random() * 6;
    petalsFinal.push({
      position: [Math.cos(a) * r, 0.025, -1 + Math.sin(a) * r],
      scale: [0.09, 0.025, 0.16],
      rotation: [0, a, 0],
      color: i % 2 ? "#e8c0aa" : "#eedab7",
    });
  }
  instances(
    finale,
    new THREE.SphereGeometry(1, 6, 4),
    foliage,
    petalsFinal,
    false,
  );
  return Promise.all(tasks);
}

export async function loadSurfaces(worlds, renderer) {
  const loader = new THREE.TextureLoader();
  const definitions = [
    ["wood_floor", [0xd9bb91, 0xd7b98c], new THREE.Vector2(5, 5)],
    [
      "white_plaster_02",
      [0xf2d2a8, 0xf0d7bc, 0xe3c19e, 0xf2e3d3, 0xf2dfcd],
      new THREE.Vector2(2, 2),
    ],
    ["concrete_floor", [0xbabfac, 0xf8f0e6], new THREE.Vector2(9, 9)],
    ["forest_floor", [0x8caa74, 0x9fc384], new THREE.Vector2(3, 3)],
  ];
  await Promise.all(
    definitions.map(async ([name, colors, repeat]) => {
      try {
        const maps = await Promise.all(
          ["basecolor", "normal", "roughness"].map((map) =>
            loader.loadAsync(`./assets/materials/${name}/${map}.jpg`),
          ),
        );
        maps.forEach((map) => {
          map.wrapS = map.wrapT = THREE.RepeatWrapping;
          map.repeat.copy(repeat);
          map.anisotropy = Math.min(
            4,
            renderer.capabilities.getMaxAnisotropy(),
          );
        });
        maps[0].colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshStandardMaterial({
          color: name === "forest_floor" ? 0x91ae72 : 0xffffff,
          map: maps[0],
          normalMap: maps[1],
          roughnessMap: maps[2],
          normalScale: new THREE.Vector2(0.35, 0.35),
          roughness: 0.85,
        });
        for (const world of worlds)
          world.traverse((o) => {
            if (
              o.isMesh &&
              !Array.isArray(o.material) &&
              colors.includes(o.material.color?.getHex())
            )
              o.material = material;
          });
      } catch {
        /* Original procedural materials remain usable. */
      }
    }),
  );
}

export function createAtmosphere(scene) {
  const random = seededRandom(278),
    positions = new Float32Array(90 * 3);
  for (let i = 0; i < 90; i++) {
    positions[i * 3] = (random() - 0.5) * 30;
    positions[i * 3 + 1] = random() * 9;
    positions[i * 3 + 2] = (random() - 0.5) * 30;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { time: { value: 0 } },
      vertexShader:
        "uniform float time; varying float alpha; void main(){vec3 p=position;p.x+=sin(time*.25+position.z)*.6;p.y=mod(position.y+time*.18,9.0);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(70./-mv.z,1.,6.);alpha=.25+.25*sin(time+position.x);}",
      fragmentShader:
        "varying float alpha; void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;gl_FragColor=vec4(1.,.87,.61,(1.-r*2.)*alpha);}",
    }),
  );
  points.frustumCulled = false;
  scene.add(points);
  return {
    update(t, target, space) {
      points.position.set(target.x, 0, target.z);
      points.material.uniforms.time.value = t;
      points.visible = space !== "house";
    },
  };
}
