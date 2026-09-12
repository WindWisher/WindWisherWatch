import assert from "node:assert/strict";
import test from "node:test";

// Model only: archive TXT after crossing the boundary, replacing the old BAK.
// It is not a firmware emulator or a claim about an observed initial file size.
function retainedRecords(recordSizes, initialBytes, boundary) {
  let txtBytes = initialBytes;
  let txt = [];
  let bak = [];
  let rotations = 0;
  recordSizes.forEach((bytes, id) => {
    txt.push(id);
    txtBytes += bytes;
    if (txtBytes > boundary) {
      bak = txt;
      txt = [];
      txtBytes = 0;
      rotations++;
    }
  });
  return { retained: [...bak, ...txt], rotations };
}

test("a sub-10KB export can lose its prefix with a nonempty initial TXT", () => {
  // Synthetic record sizes, not personal capture contents.
  const sizes = [500, ...Array(9).fill(680), 2450, 70];
  assert.equal(
    sizes.reduce((a, b) => a + b),
    9140,
  );
  for (const boundary of [5000, 5120]) {
    const clean = retainedRecords(sizes, 0, boundary);
    assert.deepEqual(
      clean.retained,
      sizes.map((_, i) => i),
    );
    assert.equal(clean.rotations, 1);
    const dirty = retainedRecords(sizes, 4900, boundary);
    assert.equal(dirty.rotations, 2);
    assert.ok(!dirty.retained.includes(0));
  }
});

test("clean-start bounded exports cross at most one archive boundary", () => {
  for (const boundary of [5000, 5120]) {
    for (const blockSize of [70, 512, 680, 2450]) {
      const sizes = [];
      for (let left = 9500; left > 0; left -= blockSize)
        sizes.push(Math.min(blockSize, left));
      assert.deepEqual(
        retainedRecords(sizes, 0, boundary).retained,
        sizes.map((_, i) => i),
      );
    }
  }
});
