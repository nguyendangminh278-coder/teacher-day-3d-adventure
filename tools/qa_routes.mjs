import {
  ROUTES,
  ROUTE_SPACES,
  COLLIDERS,
  DESKS,
  FLOOR_SLABS,
} from "../src/world-spec.mjs";
import { RouteMotion } from "../src/journey.mjs";

const solids = [
  ...COLLIDERS,
  ...DESKS,
  {
    space: "outdoor",
    name: "teacher-desk",
    min: [-2.25, 0.1, -124.6],
    max: [2.25, 1.11, -123.4],
  },
  ...FLOOR_SLABS.map((s) => ({
    space: "house",
    name: s.name,
    min: s.position.map((v, i) => v - s.size[i] / 2),
    max: s.position.map((v, i) => v + s.size[i] / 2),
  })),
  ...[
    [-3, 0.18, 1],
    [-3, 4.58, -1],
    [1.2, 4.58, 3],
  ].map(([x, y, z], i) => ({
    space: "house",
    name: `family-${i}`,
    min: [x - 0.4, y, z - 0.4],
    max: [x + 0.4, y + 1.9, z + 0.4],
  })),
];
const AVATAR_RADIUS = 0.55;
const AVATAR_HEIGHT = 2.65;
const SAMPLE = 0.16;
function inside(p, b, radius) {
  return (
    p[0] > b.min[0] - radius &&
    p[0] < b.max[0] + radius &&
    p[1] + AVATAR_HEIGHT > b.min[1] &&
    p[1] < b.max[1] &&
    p[2] > b.min[2] - radius &&
    p[2] < b.max[2] + radius
  );
}

let errors = [];
let samples = 0;
for (const [name, pts] of Object.entries(ROUTES)) {
  const space = ROUTE_SPACES[name] || "outdoor";
  const scoped = solids.filter((s) => (s.space || "outdoor") === space);
  const path = new RouteMotion(pts);
  const n = Math.max(1, Math.ceil(path.length / SAMPLE));
  for (let j = 0; j <= n; j++) {
    const p = path.sample(j / n).position;
    samples++;
    for (const c of scoped) {
      if (inside(p, c, name === "driveHome" ? 1.7 : AVATAR_RADIUS)) {
        errors.push(
          `${name} [${space}] intersects ${c.name} near (${p.map((v) => v.toFixed(2)).join(", ")})`,
        );
        break;
      }
    }
  }
}
if (errors.length) {
  console.error("ROUTE QA FAILED");
  console.error([...new Set(errors)].join("\n"));
  process.exit(1);
}
console.log(
  `ROUTE QA PASS: ${Object.keys(ROUTES).length} routes, ${samples} samples using the runtime sampler, ${solids.length} solids including stairwell slabs and family members; full avatar ${AVATAR_RADIUS}m radius / ${AVATAR_HEIGHT}m height.`,
);
