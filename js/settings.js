export const DEFAULT_SETTINGS = Object.freeze({
  lang: "pt",
  size: 10,
  theme: "system"
});

export const GAME_CONFIG = Object.freeze({
  8: Object.freeze({ words: 6, minLength: 3, maxLength: 8 }),
  10: Object.freeze({ words: 8, minLength: 3, maxLength: 10 }),
  12: Object.freeze({ words: 10, minLength: 4, maxLength: 12 })
});

export const ALPHABETS = Object.freeze({
  pt: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  en: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
});
