import { DEFAULT_SETTINGS } from "./settings.js";

export const STORAGE_KEY = "cacapalavras:v1";

export function createEmptyStore() {
  return {
    version: 1,
    prefs: { ...DEFAULT_SETTINGS },
    stats: {
      gamesCompleted: 0,
      dailyCompleted: 0,
      bestStreak: 0,
      totalSeconds: 0,
      lastDailyDate: null,
      currentStreak: 0
    },
    daily: {}
  };
}

function nonNegativeInteger(value, fallback = 0) {
  return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
}

export function sanitizeStore(value) {
  const empty = createEmptyStore();
  if (!value || typeof value !== "object") return empty;
  const prefs = value.prefs && typeof value.prefs === "object" ? value.prefs : {};
  const stats = value.stats && typeof value.stats === "object" ? value.stats : {};
  const daily = value.daily && typeof value.daily === "object" ? value.daily : {};
  const cleanDaily = {};
  for (const [date, entry] of Object.entries(daily)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !entry || typeof entry !== "object") continue;
    cleanDaily[date] = {
      foundWordIds: Array.isArray(entry.foundWordIds) ? entry.foundWordIds.filter((id) => typeof id === "string") : Array.isArray(entry.found) ? entry.found.filter((id) => typeof id === "string") : [],
      hintsUsed: Math.min(3, nonNegativeInteger(entry.hintsUsed)),
      startedAt: Number.isFinite(entry.startedAt) ? entry.startedAt : Date.now(),
      elapsedSeconds: nonNegativeInteger(entry.elapsedSeconds),
      completed: entry.completed === true
    };
  }
  return {
    version: 1,
    prefs: {
      lang: prefs.lang === "en" ? "en" : "pt",
      size: [8, 10, 12].includes(prefs.size) ? prefs.size : 10,
      theme: ["system", "light", "dark"].includes(prefs.theme) ? prefs.theme : "system"
    },
    stats: {
      gamesCompleted: nonNegativeInteger(stats.gamesCompleted),
      dailyCompleted: nonNegativeInteger(stats.dailyCompleted),
      bestStreak: nonNegativeInteger(stats.bestStreak),
      totalSeconds: nonNegativeInteger(stats.totalSeconds),
      lastDailyDate: typeof stats.lastDailyDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(stats.lastDailyDate) ? stats.lastDailyDate : null,
      currentStreak: nonNegativeInteger(stats.currentStreak)
    },
    daily: cleanDaily
  };
}

function getStorage(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function readStore(storage) {
  try {
    const source = getStorage(storage);
    if (!source) return { data: createEmptyStore(), persistent: false };
    const raw = source.getItem(STORAGE_KEY);
    return { data: raw ? sanitizeStore(JSON.parse(raw)) : createEmptyStore(), persistent: true };
  } catch {
    return { data: createEmptyStore(), persistent: false };
  }
}

export function writeStore(data, storage) {
  try {
    const destination = getStorage(storage);
    if (!destination) return false;
    destination.setItem(STORAGE_KEY, JSON.stringify(sanitizeStore(data)));
    return true;
  } catch {
    return false;
  }
}
