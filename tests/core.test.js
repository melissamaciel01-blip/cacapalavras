import test from "node:test";
import assert from "node:assert/strict";
import { normalize } from "../js/normalize.js";
import { createRng, fnv1a } from "../js/prng.js";

test("normaliza acentos, cedilha, caixa e caracteres fora de A-Z", () => {
  assert.equal(normalize("coração & ação!"), "CORACAOACAO");
  assert.equal(normalize("maçã"), "MACA");
});

test("seed e PRNG são reproduzíveis", () => {
  assert.equal(fnv1a("2026-10-20:pt:10"), fnv1a("2026-10-20:pt:10"));
  const first = createRng("daily:pt:10");
  const second = createRng("daily:pt:10");
  assert.deepEqual(Array.from({ length: 8 }, first), Array.from({ length: 8 }, second));
});
