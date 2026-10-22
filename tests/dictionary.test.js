import test from "node:test";
import assert from "node:assert/strict";
import { dictionaries } from "../js/dictionary.js";
import { normalize } from "../js/normalize.js";

test("os dois dicionários têm pelo menos 300 palavras únicas", () => {
  for (const lang of ["pt", "en"]) {
    assert.ok(dictionaries[lang].length >= 300, `${lang} tem poucas palavras`);
    assert.equal(new Set(dictionaries[lang].map(normalize)).size, dictionaries[lang].length);
  }
});
