export function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (const character of new TextEncoder().encode(String(value))) {
    hash ^= character;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  let state = seed >>> 0;
  return function random() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seedText) {
  return mulberry32(typeof seedText === "number" ? seedText : fnv1a(seedText));
}
