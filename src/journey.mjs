// This exact distance-based sampler is used by gameplay AND collision QA.
// Straight segments keep stair landings and door clearances faithful to the spec.
export class RouteMotion {
  constructor(points) {
    if (
      points.length < 2 ||
      points.some((p) => p.length !== 3 || p.some((v) => !Number.isFinite(v)))
    )
      throw new Error("Invalid route");
    this.points = points.map((p) => [...p]);
    this.lengths = points
      .slice(1)
      .map((p, i) => Math.hypot(...p.map((v, k) => v - points[i][k])));
    this.length = this.lengths.reduce((a, b) => a + b, 0);
  }
  sample(progress) {
    let distance = Math.max(0, Math.min(1, progress)) * this.length;
    let i = 0;
    while (i < this.lengths.length - 1 && distance > this.lengths[i])
      distance -= this.lengths[i++];
    const a = this.points[i],
      b = this.points[i + 1],
      length = this.lengths[i];
    const t = length ? Math.min(1, distance / length) : 1;
    return {
      position: a.map((v, k) => v + (b[k] - v) * t),
      direction: b.map((v, k) => (length ? (v - a[k]) / length : 0)),
    };
  }
}

// All narrative delays use simulation time: pause/background tabs freeze them.
export class Timeline {
  constructor() {
    this.time = 0;
    this.events = [];
  }
  after(seconds, callback) {
    this.events.push({ at: this.time + seconds, callback });
  }
  update(dt) {
    this.time += dt;
    const due = this.events.filter((e) => e.at <= this.time);
    this.events = this.events.filter((e) => e.at > this.time);
    for (const event of due) event.callback();
  }
  clear() {
    this.events = [];
  }
}
export const CHECKPOINT_KEY = "teacher-day-journey-v18";
export function readCheckpoint(storage) {
  try {
    const data = JSON.parse(storage.getItem(CHECKPOINT_KEY));
    return data?.version === 18 &&
      Number.isInteger(data.stage) &&
      [0, 1, 2, 3, 4, 6, 7, 8, 9].includes(data.stage)
      ? data.stage
      : null;
  } catch {
    return null;
  }
}
export function saveCheckpoint(storage, stage) {
  if (![0, 1, 2, 3, 4, 6, 7, 8, 9].includes(stage)) return;
  try {
    storage.setItem(CHECKPOINT_KEY, JSON.stringify({ version: 18, stage }));
  } catch {
    /* Private browsing may deny storage. */
  }
}
