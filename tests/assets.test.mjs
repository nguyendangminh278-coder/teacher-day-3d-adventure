import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

test("bundled GLB models have valid embedded buffers, textures and character pivots", async () => {
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    return (
      await Promise.all(
        entries.map((e) =>
          e.isDirectory() ? walk(join(dir, e.name)) : join(dir, e.name),
        ),
      )
    ).flat();
  }
  const files = (await walk("assets/models")).filter((p) => p.endsWith(".glb"));
  assert.ok(files.length >= 10);
  for (const path of files) {
    const bytes = await readFile(path);
    assert.equal(bytes.readUInt32LE(0), 0x46546c67, path);
    assert.equal(bytes.readUInt32LE(8), bytes.length, path);
    const jsonLength = bytes.readUInt32LE(12),
      doc = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
    const binaryLength = bytes.readUInt32LE(20 + jsonLength);
    assert.equal(28 + jsonLength + binaryLength, bytes.length, path);
    for (const view of doc.bufferViews) {
      assert.equal((view.byteOffset || 0) % 4, 0, path);
      assert.ok((view.byteOffset || 0) + view.byteLength <= binaryLength, path);
    }
    for (const buffer of doc.buffers) assert.equal(buffer.uri, undefined, path);
    for (const image of doc.images || [])
      assert.ok(Number.isInteger(image.bufferView) && !image.uri, path);
    if (path.endsWith("teacher_mom_chibi.glb"))
      for (const node of ["Head", "Arm_L", "Arm_R", "Leg_L", "Leg_R"])
        assert.ok(
          doc.nodes.some((n) => n.name === node),
          node,
        );
  }
});
