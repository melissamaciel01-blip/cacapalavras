import { dictionaries } from "./dictionary.js";
import { GAME_CONFIG, ALPHABETS } from "./settings.js";
import { normalize } from "./normalize.js";
import { createRng } from "./prng.js";

const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]];
const MAX_ATTEMPTS_PER_WORD = 5000;

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function makeCandidates(word, size, random) {
  const candidates = [];
  for (const [rowStep, colStep] of DIRECTIONS) {
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const lastRow = row + rowStep * (word.length - 1);
        const lastCol = col + colStep * (word.length - 1);
        if (lastRow < 0 || lastRow >= size || lastCol < 0 || lastCol >= size) continue;
        candidates.push(Array.from({ length: word.length }, (_, offset) => ({
          row: row + rowStep * offset,
          col: col + colStep * offset
        })));
      }
    }
  }
  return shuffle(candidates, random);
}

function placeWords(words, size, random) {
  const grid = Array.from({ length: size }, () => Array(size).fill(null));
  const candidates = words.map((word) => makeCandidates(word.normalized, size, random));
  const attempts = words.map(() => 0);
  const placements = Array(words.length);

  function place(index) {
    if (index === words.length) return true;
    for (const cells of candidates[index]) {
      attempts[index] += 1;
      if (attempts[index] > MAX_ATTEMPTS_PER_WORD) return false;
      let compatible = true;
      for (let letterIndex = 0; letterIndex < cells.length; letterIndex += 1) {
        const { row, col } = cells[letterIndex];
        if (grid[row][col] !== null && grid[row][col] !== words[index].normalized[letterIndex]) {
          compatible = false;
          break;
        }
      }
      if (!compatible) continue;
      const newlyFilled = [];
      for (let letterIndex = 0; letterIndex < cells.length; letterIndex += 1) {
        const { row, col } = cells[letterIndex];
        if (grid[row][col] === null) {
          grid[row][col] = words[index].normalized[letterIndex];
          newlyFilled.push({ row, col });
        }
      }
      placements[index] = cells;
      if (place(index + 1)) return true;
      for (const { row, col } of newlyFilled) grid[row][col] = null;
      placements[index] = null;
    }
    return false;
  }

  return place(0) ? { grid, placements } : null;
}

function makeLetterPicker(dictionary, alphabet) {
  const frequencies = new Map([...alphabet].map((letter) => [letter, 1]));
  for (const word of dictionary) {
    for (const letter of normalize(word)) {
      if (frequencies.has(letter)) frequencies.set(letter, frequencies.get(letter) + 1);
    }
  }
  const entries = [...frequencies.entries()];
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  return (random) => {
    let choice = random() * total;
    for (const [letter, count] of entries) {
      choice -= count;
      if (choice < 0) return letter;
    }
    return entries.at(-1)[0];
  };
}

export function validateGame(game) {
  if (!game || !Array.isArray(game.grid) || game.grid.length !== game.size) return false;
  const normalizedTargets = new Set();
  for (const target of game.targets) {
    if (normalizedTargets.has(target.normalized) || target.cells.length !== target.normalized.length) return false;
    normalizedTargets.add(target.normalized);
    const letters = target.cells.map(({ row, col }) => game.grid[row]?.[col] ?? "").join("");
    if (letters !== target.normalized) return false;
  }
  return game.grid.every((row) => row.length === game.size && row.every((letter) => /^[A-Z]$/.test(letter)));
}

export function generateGame({ seed, lang = "pt", size = 10, dictionary = dictionaries[lang] } = {}) {
  const config = GAME_CONFIG[size];
  if (!config || !ALPHABETS[lang] || !Array.isArray(dictionary)) throw new TypeError("Idioma ou tamanho de grade inválido.");
  const normalizedWords = [...new Map(dictionary
    .map((display) => ({ display, normalized: normalize(display) }))
    .filter(({ normalized }) => normalized.length >= config.minLength && normalized.length <= config.maxLength)
    .map((word) => [word.normalized, word])).values()];
  if (normalizedWords.length < config.words) throw new RangeError("Dicionário insuficiente para gerar esta grade.");

  const seedText = `${seed ?? "free"}:${lang}:${size}`;
  const random = createRng(seedText);
  const selected = shuffle(normalizedWords, random).slice(0, config.words)
    .sort((left, right) => right.normalized.length - left.normalized.length || (left.normalized < right.normalized ? -1 : 1));
  let placed;
  let targetCount = selected.length;
  while (targetCount > 0 && !(placed = placeWords(selected.slice(0, targetCount), size, random))) targetCount -= 1;
  if (!placed) throw new Error("Não foi possível posicionar palavras na grade.");

  const targets = selected.slice(0, targetCount).map((word, index) => ({
    id: word.normalized,
    display: word.display,
    normalized: word.normalized,
    cells: placed.placements[index]
  })).sort((left, right) => left.normalized < right.normalized ? -1 : left.normalized > right.normalized ? 1 : 0);
  const pickLetter = makeLetterPicker(dictionary, ALPHABETS[lang]);
  for (const row of placed.grid) {
    for (let col = 0; col < row.length; col += 1) {
      if (row[col] === null) row[col] = pickLetter(random);
    }
  }
  const game = { id: `${seedText}`, seed: seedText, lang, size, grid: placed.grid, targets };
  if (!validateGame(game)) throw new Error("A validação da grade gerada falhou.");
  return game;
}
