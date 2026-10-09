export const ROUTES = {
  intro: [
    [0, 8.2, 16],
    [0, 6.5, 13],
    [0, 4.75, 10],
  ],
  jump: [
    [0, 4.75, 10],
    [0, 3.2, 3],
    [0, 0.18, -8],
  ],
  garden: [
    [0, 0.18, -8],
    [-1, 0.18, -22],
    [0, 0.18, -39],
  ],
  toSchool: [
    [0, 0.18, -39],
    [0, 0.18, -58],
    [0, 0.18, -73.5],
  ],
  enterClass: [
    [0, 0.18, -73.5],
    [0, 0.18, -81],
    [0, 0.18, -93],
    [0, 0.18, -103.8],
    [0, 0.18, -109.5],
    [0, 0.18, -121.2],
  ],
  exitClass: [
    [0, 0.18, -121.2],
    [8.4, 0.18, -121.2],
    [8.4, 0.18, -115],
    [11.7, 0.18, -115],
    [15, 0.18, -115],
  ],
  driveHome: [
    [15, 0.12, -115],
    [30, 0.12, -115],
    [54, 0.12, -114],
    [76, 0.12, -111],
    [87, 0.12, -106],
    [92, 0.12, -101],
    [94, 0.12, -99],
  ],
  toDoor: [
    [94, 0.18, -99],
    [97, 0.18, -97.4],
    [100, 0.18, -97.0],
    [100, 0.18, -95.4],
    [100, 0.18, -92.9],
  ],

  // Interior destinations deliberately stop ~2m in front of each family member.
  // This prevents the mother mesh and NPC mesh from occupying the same coordinates.
  houseEntry: [
    [0, 0.18, 5.7],
    [0, 0.18, 3.2],
    [-0.5, 0.18, 1.0],
    [-1.0, 0.18, 1.0],
  ],
  stairs1: [
    [-1.0, 0.18, 1.0],
    [2, 0.18, 0.0],
    [6, 0.18, -2.4],
    [5.4, 0.72, -2.4],
    [4.8, 1.22, -2.4],
    [4.2, 1.72, -2.4],
    [3.6, 2.22, -2.4],
    [3.0, 2.72, -2.4],
    [2.4, 3.22, -2.4],
    [1.8, 3.72, -2.4],
    [1.2, 4.52, -2.4],
    [0, 4.58, -1.0],
    [-1.0, 4.58, -1.0],
  ],
  toYounger: [
    [-1.0, 4.58, -1.0],
    [-1.8, 4.58, 1.3],
    [-1.8, 4.58, 3.0],
    [-0.8, 4.58, 3.0],
  ],
  stairs2: [
    [-0.8, 4.58, 3.0],
    [-5.8, 4.58, 2.4],
    [-5.2, 5.08, 2.4],
    [-4.6, 5.58, 2.4],
    [-4.0, 6.08, 2.4],
    [-3.4, 6.58, 2.4],
    [-2.8, 7.08, 2.4],
    [-2.2, 7.58, 2.4],
    [-1.6, 8.08, 2.4],
    [-1.0, 9.05, 2.4],
    [0, 9.05, 1.2],
  ],

  finaleEntry: [
    [0, 0.18, 6.2],
    [0, 0.18, 3.8],
    [0, 0.18, 1.5],
  ],
};

export const ROUTE_SPACES = {
  intro: "outdoor",
  jump: "outdoor",
  garden: "outdoor",
  toSchool: "outdoor",
  enterClass: "outdoor",
  exitClass: "outdoor",
  driveHome: "outdoor",
  toDoor: "outdoor",
  houseEntry: "house",
  stairs1: "house",
  toYounger: "house",
  stairs2: "house",
  finaleEntry: "finale",
};

export const COLLIDERS = [
  {
    space: "outdoor",
    name: "gate-left-post",
    min: [-7.05, 0, -79.6],
    max: [-5.95, 6.2, -78.3],
  },
  {
    space: "outdoor",
    name: "gate-right-post",
    min: [5.95, 0, -79.6],
    max: [7.05, 6.2, -78.3],
  },
  {
    space: "outdoor",
    name: "school-left-wing",
    min: [-17, 0, -102],
    max: [-7, 7.2, -83],
  },
  {
    space: "outdoor",
    name: "school-right-wing",
    min: [7, 0, -102],
    max: [17, 7.2, -83],
  },
  {
    space: "outdoor",
    name: "class-left-wall",
    min: [-10.5, 0, -126.8],
    max: [-10.0, 5.2, -106.2],
  },
  {
    space: "outdoor",
    name: "class-front-left",
    min: [-10.5, 0, -106.8],
    max: [-3.1, 5.2, -106.2],
  },
  {
    space: "outdoor",
    name: "class-front-right",
    min: [3.1, 0, -106.8],
    max: [10.5, 5.2, -106.2],
  },
  {
    space: "outdoor",
    name: "class-right-back",
    min: [10.0, 0, -126.8],
    max: [10.5, 5.2, -118.1],
  },
  {
    space: "outdoor",
    name: "class-right-front",
    min: [10.0, 0, -112.0],
    max: [10.5, 5.2, -106.2],
  },
  {
    space: "outdoor",
    name: "class-back-wall",
    min: [-10.5, 0, -126.8],
    max: [10.5, 5.2, -126.2],
  },
  {
    space: "outdoor",
    name: "house-front-left",
    min: [91.5, 0, -95.6],
    max: [98.45, 6.5, -94.8],
  },
  {
    space: "outdoor",
    name: "house-front-right",
    min: [101.55, 0, -95.6],
    max: [108.5, 6.5, -94.8],
  },

  {
    space: "house",
    name: "house-left-wall",
    min: [-9.4, 0, -6.8],
    max: [-8.8, 9.4, 6.8],
  },
  {
    space: "house",
    name: "house-right-wall",
    min: [8.8, 0, -6.8],
    max: [9.4, 9.4, 6.8],
  },
  {
    space: "house",
    name: "house-back-wall",
    min: [-9.4, 0, -7.1],
    max: [9.4, 9.4, -6.5],
  },
];

export const DESKS = [
  [-6.3, -110],
  [-3.6, -110],
  [3.6, -110],
  [6.3, -110],
  [-6.3, -113],
  [-3.6, -113],
  [3.6, -113],
  [6.3, -113],
  [-6.3, -116],
  [-3.6, -116],
  [3.6, -116],
  [6.3, -116],
  [-6.3, -119],
  [-3.6, -119],
  [3.6, -119],
  [6.3, -119],
].map(([x, z], i) => ({
  space: "outdoor",
  name: `desk-${i}`,
  min: [x - 1.05, 0, z - 0.55],
  max: [x + 1.05, 1.35, z + 0.55],
}));

// Slabs and their actual stairwell openings are shared by rendering and body-clearance QA.
export const FLOOR_SLABS = [
  { name: "level-2-left", size: [8.5, 0.28, 13], position: [-4.75, 4.4, 0] },
  { name: "level-2-right", size: [2, 0.28, 13], position: [8, 4.4, 0] },
  { name: "level-2-front", size: [7.5, 0.28, 5.8], position: [3.25, 4.4, 3.6] },
  {
    name: "level-2-back",
    size: [7.5, 0.28, 2.5],
    position: [3.25, 4.4, -5.25],
  },
  { name: "level-3-back", size: [18, 0.28, 6], position: [0, 8.87, -3.5] },
  { name: "level-3-landing", size: [7, 0.28, 1.6], position: [3, 8.87, 0.9] },
];
