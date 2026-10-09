import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RouteMotion,
  Timeline,
  readCheckpoint,
  saveCheckpoint,
  CHECKPOINT_KEY,
} from "../src/journey.mjs";
import { ROUTES } from "../src/world-spec.mjs";

test("movement traverses route endpoints without overshooting, at constant distance speed", () => {
  const path = new RouteMotion([
    [0, 0, 0],
    [3, 0, 0],
    [3, 0, 4],
  ]);
  assert.equal(path.length, 7);
  assert.deepEqual(path.sample(3 / 7).position, [3, 0, 0]);
  assert.deepEqual(path.sample(5 / 7).position, [3, 0, 2]);
  assert.deepEqual(path.sample(-1).position, [0, 0, 0]);
  assert.deepEqual(path.sample(2).position, [3, 0, 4]);
  for (const points of Object.values(ROUTES)) {
    const route = new RouteMotion(points);
    assert.deepEqual(route.sample(0).position, points[0]);
    route
      .sample(1)
      .position.forEach((v, i) =>
        assert.ok(Math.abs(v - points.at(-1)[i]) < 1e-9),
      );
  }
});
test("zero length waypoints cannot cause NaN", () => {
  const path = new RouteMotion([
    [1, 2, 3],
    [1, 2, 3],
    [2, 2, 3],
  ]);
  for (const t of [0, 0.5, 1])
    assert.ok(path.sample(t).position.every(Number.isFinite));
  assert.throws(
    () =>
      new RouteMotion([
        [1, 2, NaN],
        [1, 2, 3],
      ]),
  );
});
test("paused simulation does not dispatch dialogue, transition or bloom callbacks", () => {
  const timeline = new Timeline(),
    events = [];
  timeline.after(1, () => {
    events.push("first");
    timeline.after(0.5, () => events.push("nested"));
  });
  timeline.update(0.9);
  assert.deepEqual(events, []);
  timeline.update(0.1);
  assert.deepEqual(events, ["first"]);
  timeline.update(0.5);
  assert.deepEqual(events, ["first", "nested"]);
  timeline.after(0, () => events.push("stale"));
  timeline.clear();
  timeline.update(100);
  assert.equal(events.length, 2);
});
test("resume accepts only compatible stable chapters and tolerates unavailable storage", () => {
  const data = new Map(),
    storage = {
      getItem: (k) => data.get(k),
      setItem: (k, v) => data.set(k, v),
    };
  assert.equal(readCheckpoint(storage), null);
  for (const stage of [0, 1, 2, 3, 4, 6, 7, 8, 9]) {
    saveCheckpoint(storage, stage);
    assert.equal(readCheckpoint(storage), stage);
  }
  saveCheckpoint(storage, 5);
  assert.equal(readCheckpoint(storage), 9);
  for (const value of [
    "oops",
    "null",
    '{"version":18,"stage":5}',
    '{"version":17,"stage":4}',
    '{"version":18,"stage":2.1}',
  ]) {
    data.set(CHECKPOINT_KEY, value);
    assert.equal(readCheckpoint(storage), null);
  }
  const denied = {
    getItem: () => {
      throw Error("denied");
    },
    setItem: () => {
      throw Error("denied");
    },
  };
  assert.equal(readCheckpoint(denied), null);
  assert.doesNotThrow(() => saveCheckpoint(denied, 4));
});
