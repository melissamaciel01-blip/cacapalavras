import test from "node:test";
import assert from "node:assert/strict";
import { generateGame, validateGame } from "../js/generator.js";
import { matchSelection, resolveLine } from "../js/selection.js";

for (const lang of ["pt", "en"]) {
  for (const size of [8, 10, 12]) {
    test(`gera grade válida e determinística: ${lang} ${size}x${size}`, () => {
      const first = generateGame({ seed: "2026-10-20", lang, size });
      const second = generateGame({ seed: "2026-10-20", lang, size });
      assert.deepEqual(first, second);
      assert.equal(first.grid.length, size);
      assert.ok(first.targets.length > 0);
      assert.ok(validateGame(first));
      assert.equal(new Set(first.targets.map((target) => target.normalized)).size, first.targets.length);
    });
  }
}

test("resolve e encontra palavras em diagonais e no sentido reverso", () => {
  const grid = [ [..."ABCD"], [..."EFGH"], [..."IJKL"], [..."MNOP"] ];
  assert.deepEqual(resolveLine({ row: 0, col: 0 }, { row: 2, col: 2 }), [
    { row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }
  ]);
  assert.equal(resolveLine({ row: 0, col: 0 }, { row: 1, col: 2 }), null);
  const target = { id: "KFA", normalized: "KFA" };
  assert.equal(matchSelection(grid, [target], { row: 2, col: 2 }, { row: 0, col: 0 }).target, target);
});
