import test from "node:test";
import assert from "node:assert/strict";
import { completeDailyStreak, dateOrdinal, dailySeed, localDateKey, resetMissedStreak } from "../js/daily.js";
import { createEmptyStore, readStore, sanitizeStore, writeStore } from "../js/storage.js";
import { nextHint } from "../js/hints.js";
import { formatDuration, recordCompletion } from "../js/stats.js";

const baseStats = { gamesCompleted: 4, dailyCompleted: 2, bestStreak: 2, totalSeconds: 30, lastDailyDate: "2026-10-19", currentStreak: 2 };

test("datas locais e seeds diárias são estáveis", () => {
  assert.equal(localDateKey(new Date(2026, 9, 20, 23)), "2026-10-20");
  assert.equal(dailySeed("2026-10-20", "en"), "2026-10-20:en:10");
  assert.equal(dateOrdinal("2026-10-20") - dateOrdinal("2026-10-19"), 1);
  assert.ok(Number.isNaN(dateOrdinal("2026-02-30")));
});

test("streak incrementa uma vez, continua ontem e reinicia após dia perdido", () => {
  assert.equal(completeDailyStreak(baseStats, "2026-10-20").currentStreak, 3);
  assert.equal(completeDailyStreak(baseStats, "2026-10-19").currentStreak, 2);
  assert.equal(completeDailyStreak(baseStats, "2026-10-22").currentStreak, 1);
  assert.equal(resetMissedStreak(baseStats, "2026-10-21").currentStreak, 0);
  assert.equal(resetMissedStreak(baseStats, "2026-10-22").currentStreak, 0);
});

test("storage saneia dados e tolera indisponibilidade", () => {
  const store = createEmptyStore();
  store.daily["2026-10-20"] = { found: ["CASA"], hintsUsed: 8, startedAt: 10 };
  const clean = sanitizeStore(store);
  assert.deepEqual(clean.daily["2026-10-20"].foundWordIds, ["CASA"]);
  assert.equal(clean.daily["2026-10-20"].hintsUsed, 3);
  assert.equal(readStore({ getItem: () => "{" }).persistent, false);
  assert.equal(writeStore(store, { setItem: () => { throw new Error("disabled"); } }), false);
});

test("dica é alfabética e não ultrapassa três usos", () => {
  const targets = [
    { id: "ZEBRA", normalized: "ZEBRA", cells: [{ row: 0, col: 0 }] },
    { id: "ABACATE", normalized: "ABACATE", cells: [{ row: 1, col: 2 }] }
  ];
  assert.equal(nextHint(targets, [], 0).targetId, "ABACATE");
  assert.equal(nextHint(targets, ["ABACATE"], 2).targetId, "ZEBRA");
  assert.equal(nextHint(targets, [], 3), null);
});

test("partida livre não muda streak e tempo é formatado", () => {
  const result = recordCompletion(baseStats, { mode: "free", elapsedSeconds: 75 });
  assert.equal(result.currentStreak, baseStats.currentStreak);
  assert.equal(result.gamesCompleted, 5);
  assert.equal(result.totalSeconds, 105);
  assert.equal(formatDuration(367), "06:07");
});
