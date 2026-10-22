import { dailySeed, localDateKey, resetMissedStreak } from "./daily.js";
import { dictionaries } from "./dictionary.js";
import { generateGame } from "./generator.js";
import { nextHint } from "./hints.js";
import { matchSelection, resolveLine } from "./selection.js";
import { DEFAULT_SETTINGS } from "./settings.js";
import { formatDuration, recordCompletion } from "./stats.js";
import { readStore, writeStore } from "./storage.js";

const DAILY_WORDS = {
  pt: ["janela", "floresta", "planeta", "caminho", "viagem", "caderno", "brisa", "estrela"],
  en: ["window", "forest", "planet", "path", "journey", "notebook", "breeze", "star"]
};
const DAILY_SIZE = 10;
const MAX_HINTS = 3;
const elements = {
  board: document.querySelector(".board"),
  status: document.querySelector(".status"),
  wordList: document.querySelector(".word-list"),
  progress: document.querySelector(".progress"),
  remaining: document.querySelector(".panel-head span"),
  sizeLabel: document.querySelector(".board-label"),
  title: document.querySelector("#game-title"),
  date: document.querySelector("#daily-date"),
  streak: document.querySelector("#streak-value"),
  timer: document.querySelector("#game-timer"),
  hintButton: document.querySelector(".hint-button"),
  hintCount: document.querySelector(".hint-count"),
  storageWarning: document.querySelector("#storage-warning"),
  resetButton: document.querySelector("#reset-button"),
  freeDialog: document.querySelector("#free-dialog"),
  statsDialog: document.querySelector("#stats-dialog"),
  helpDialog: document.querySelector("#help-dialog"),
  resetDialog: document.querySelector("#reset-dialog"),
  completeDialog: document.querySelector("#complete-dialog"),
  themeButton: document.querySelector("#theme-toggle")
};

const storeResult = readStore();
const store = storeResult.data;
let stats = resetMissedStreak(store.stats, localDateKey());
let game = null;
let mode = "daily";
let foundWordIds = new Set();
let hintedWordIds = new Set();
let hintsUsed = 0;
let completed = false;
let activeCell = 0;
let clickStart = null;
let selectionPath = [];
let drag = null;
let suppressClick = false;
let elapsedBase = 0;
let timerStartedAt = null;
let feedbackToken = 0;
let hintTimer = null;

function saveStore() {
  store.stats = stats;
  const saved = writeStore(store);
  elements.storageWarning.textContent = saved ? "" : "Não foi possível salvar os dados neste navegador; o progresso pode não persistir.";
  return saved;
}

function currentElapsedSeconds() {
  if (timerStartedAt === null) return elapsedBase;
  return elapsedBase + Math.floor((performance.now() - timerStartedAt) / 1000);
}

function saveDailyProgress() {
  if (!game || mode !== "daily") return;
  const date = game.date;
  store.daily[date] = {
    foundWordIds: [...foundWordIds],
    hintsUsed,
    startedAt: store.daily[date]?.startedAt ?? Date.now(),
    elapsedSeconds: currentElapsedSeconds(),
    completed
  };
  saveStore();
}

function updateTimer() {
  if (elements.timer) elements.timer.textContent = formatDuration(currentElapsedSeconds());
}

function startTimer(elapsed = 0, isCompleted = false) {
  elapsedBase = elapsed;
  timerStartedAt = isCompleted ? null : performance.now();
  updateTimer();
}

function pauseTimer() {
  if (timerStartedAt === null) return;
  elapsedBase = currentElapsedSeconds();
  timerStartedAt = null;
  updateTimer();
}

function resumeTimer() {
  if (completed || timerStartedAt !== null) return;
  timerStartedAt = performance.now();
}

function rowColFromIndex(index) {
  return { row: Math.floor(index / game.size), col: index % game.size };
}

function indexFromRowCol(row, col) {
  return row * game.size + col;
}

function toIndices(cells) {
  return cells.map(({ row, col }) => indexFromRowCol(row, col));
}

function clearSelection(message = "Seleção cancelada.") {
  feedbackToken += 1;
  clickStart = null;
  selectionPath = [];
  drag = null;
  updateBoardState();
  if (message) elements.status.textContent = message;
}

function updateHeader() {
  const dailyDate = game.date ? new Date(`${game.date}T12:00:00`) : null;
  elements.date.textContent = mode === "daily"
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(dailyDate)
    : `Partida livre · ${game.lang === "pt" ? "Português" : "English"}`;
  elements.title.textContent = mode === "daily" ? "Palavras do dia" : "Partida livre";
  elements.resetButton.textContent = mode === "daily" ? "Reiniciar desafio" : "Nova grade";
  elements.sizeLabel.textContent = `Grade ${game.size} × ${game.size}`;
  elements.resetButton.disabled = mode === "daily" && completed;
  elements.streak.textContent = `${stats.currentStreak} ${stats.currentStreak === 1 ? "dia" : "dias"}`;
  document.querySelector(".streak")?.setAttribute("aria-label", `Sequência de ${stats.currentStreak} ${stats.currentStreak === 1 ? "dia" : "dias"}`);
  document.querySelectorAll(".game-nav [data-mode]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  });
}

function updateProgress() {
  const found = foundWordIds.size;
  const total = game.targets.length;
  const remaining = Math.max(0, total - found);
  elements.progress.innerHTML = `<strong>${found}</strong> de ${total} palavras`;
  elements.remaining.textContent = `${remaining} ${remaining === 1 ? "restante" : "restantes"}`;
  const hintsRemaining = Math.max(0, MAX_HINTS - hintsUsed);
  elements.hintCount.textContent = hintsRemaining === 0
    ? "Limite de 3 dicas atingido"
    : `${hintsRemaining} ${hintsRemaining === 1 ? "dica disponível" : "dicas disponíveis"}`;
  elements.hintButton.setAttribute("aria-label", hintsRemaining === 0 ? "Limite de três dicas atingido" : "Revelar a primeira letra de uma palavra ainda não encontrada");
  elements.hintButton.disabled = hintsUsed >= MAX_HINTS || remaining === 0;
}

function updateBoardState() {
  const selected = new Set(selectionPath);
  [...elements.board.querySelectorAll(".cell")].forEach((cell, index) => {
    const isFound = foundWordIds.size > 0 && [...foundWordIds].some((id) => {
      const target = game.targets.find((word) => word.id === id);
      return target?.cells.some(({ row, col }) => indexFromRowCol(row, col) === index);
    });
    const isHinted = [...hintedWordIds].some((id) => {
      const target = game.targets.find((word) => word.id === id);
      const firstCell = target?.cells[0];
      return firstCell && indexFromRowCol(firstCell.row, firstCell.col) === index;
    });
    cell.classList.toggle("is-found", isFound);
    cell.classList.toggle("is-hint", isHinted && !isFound);
    cell.classList.toggle("is-selected", selected.has(index) && !isFound);
    cell.classList.toggle("is-active", index === activeCell && !isFound);
    cell.tabIndex = index === activeCell ? 0 : -1;
    cell.setAttribute("aria-selected", String(selected.has(index)));
    cell.setAttribute("aria-label", `${cell.dataset.baseLabel}${isFound ? ", palavra encontrada" : isHinted ? ", primeira letra de uma palavra" : ""}`);
  });
}

function renderGrid() {
  elements.board.replaceChildren();
  elements.board.style.setProperty("--grid-columns", String(game.size));
  elements.board.setAttribute("aria-label", `Grade de letras, ${game.size} linhas por ${game.size} colunas`);
  elements.board.setAttribute("aria-rowcount", String(game.size));
  elements.board.setAttribute("aria-colcount", String(game.size));
  for (let row = 0; row < game.size; row += 1) {
    const rowElement = document.createElement("div");
    rowElement.className = "board-row";
    rowElement.setAttribute("role", "row");
    rowElement.setAttribute("aria-rowindex", String(row + 1));
    for (let col = 0; col < game.size; col += 1) {
      const index = indexFromRowCol(row, col);
      const letter = game.grid[row][col];
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.textContent = letter;
      cell.dataset.index = String(index);
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-colindex", String(col + 1));
      cell.setAttribute("aria-label", `Linha ${row + 1}, coluna ${col + 1}, letra ${letter}`);
      cell.dataset.baseLabel = `Linha ${row + 1}, coluna ${col + 1}, letra ${letter}`;
      rowElement.append(cell);
    }
    elements.board.append(rowElement);
  }
  updateBoardState();
}

function renderWords() {
  elements.wordList.replaceChildren();
  game.targets.forEach((target) => {
    const item = document.createElement("li");
    item.dataset.word = target.id;
    item.textContent = target.display;
    item.classList.toggle("found", foundWordIds.has(target.id));
    elements.wordList.append(item);
  });
  updateProgress();
}

function createGame(nextMode, options = {}) {
  const date = nextMode === "daily" ? localDateKey() : null;
  const lang = options.lang ?? store.prefs.lang ?? DEFAULT_SETTINGS.lang;
  const size = nextMode === "daily" ? DAILY_SIZE : options.size ?? store.prefs.size ?? DEFAULT_SETTINGS.size;
  const seed = nextMode === "daily"
    ? dailySeed(date, lang, size)
    : `free:${Date.now()}:${Math.random()}`;
  const definition = {
    seed,
    lang,
    size,
    ...(nextMode === "daily" ? { dictionary: DAILY_WORDS[lang] } : { dictionary: dictionaries[lang] })
  };
  game = { ...generateGame(definition), mode: nextMode, date };
  mode = nextMode;
  foundWordIds = new Set();
  hintedWordIds = new Set();
  hintsUsed = 0;
  completed = false;
  activeCell = 0;
  clickStart = null;
  selectionPath = [];
  drag = null;
  if (nextMode === "daily") restoreDailyProgress(date);
  else startTimer();
  updateHeader();
  renderGrid();
  renderWords();
  updateTimer();
  elements.status.textContent = nextMode === "daily"
    ? completed ? "Desafio diário já concluído. O próximo estará disponível amanhã." : "Encontre as palavras: clique na primeira e na última letra ou arraste pela grade."
    : "Partida livre iniciada. Selecione palavras em linha reta.";
  store.prefs = { ...store.prefs, lang, ...(nextMode === "free" ? { size } : {}) };
  saveStore();
}

function restoreDailyProgress(date) {
  const saved = store.daily[date];
  const validIds = new Set(game.targets.map((target) => target.id));
  foundWordIds = new Set((saved?.foundWordIds ?? []).filter((id) => validIds.has(id)));
  hintsUsed = Math.min(MAX_HINTS, saved?.hintsUsed ?? 0);
  elapsedBase = Math.max(0, saved?.elapsedSeconds ?? 0);
  completed = saved?.completed === true && foundWordIds.size === game.targets.length;
  if (completed) {
    timerStartedAt = null;
  } else {
    timerStartedAt = performance.now();
    store.daily[date] = {
      foundWordIds: [...foundWordIds],
      hintsUsed,
      startedAt: saved?.startedAt ?? Date.now(),
      elapsedSeconds: elapsedBase,
      completed: false
    };
  }
}

function finishGame() {
  if (completed || foundWordIds.size !== game.targets.length) return;
  completed = true;
  elapsedBase = currentElapsedSeconds();
  timerStartedAt = null;
  stats = recordCompletion(stats, { mode, date: game.date, elapsedSeconds: elapsedBase });
  store.stats = stats;
  if (mode === "daily") saveDailyProgress();
  else saveStore();
  updateHeader();
  document.querySelector("#completion-time").textContent = formatDuration(elapsedBase);
  document.querySelector("#completion-hints").textContent = `${hintsUsed} ${hintsUsed === 1 ? "dica usada" : "dicas usadas"}`;
  document.querySelector("#completion-mode").textContent = mode === "daily" ? "Desafio diário concluído" : "Partida concluída";
  document.querySelector("#completion-words").textContent = `${game.targets.length} palavras encontradas`;
  const streakSummary = document.querySelector("#completion-streak");
  streakSummary.hidden = mode !== "daily";
  streakSummary.textContent = `Sequência atual: ${stats.currentStreak} ${stats.currentStreak === 1 ? "dia" : "dias"}`;
  if (!elements.completeDialog.open) elements.completeDialog.showModal();
  elements.status.textContent = "Parabéns! Você encontrou todas as palavras.";
}

function validatePath(path) {
  if (path.length < 2) return;
  const match = matchSelection(game.grid, game.targets, rowColFromIndex(path[0]), rowColFromIndex(path.at(-1)));
  if (!match) {
    const token = ++feedbackToken;
    elements.status.textContent = "Essa seleção não forma uma palavra da lista.";
    selectionPath = path;
    updateBoardState();
    window.setTimeout(() => {
      if (token !== feedbackToken) return;
      selectionPath = [];
      updateBoardState();
      elements.status.textContent = "Seleção removida. Tente outra palavra.";
    }, 450);
    return;
  }
  if (foundWordIds.has(match.target.id)) {
    selectionPath = [];
    updateBoardState();
    elements.status.textContent = `${match.target.display} já foi encontrada.`;
    return;
  }
  foundWordIds.add(match.target.id);
  hintedWordIds.delete(match.target.id);
  selectionPath = [];
  clickStart = null;
  renderWords();
  updateBoardState();
  updateProgress();
  elements.status.textContent = `Palavra encontrada: ${match.target.display}.`;
  if (mode === "daily") saveDailyProgress();
  finishGame();
}

function handleCellClick(index) {
  if (completed) return;
  feedbackToken += 1;
  activeCell = index;
  if (clickStart === null) {
    clickStart = index;
    selectionPath = [index];
    elements.status.textContent = "Primeira letra marcada. Selecione a última letra.";
    updateBoardState();
    return;
  }
  const cells = resolveLine(rowColFromIndex(clickStart), rowColFromIndex(index));
  if (!cells) {
    clearSelection("Selecione uma linha horizontal, vertical ou diagonal.");
    return;
  }
  selectionPath = toIndices(cells);
  clickStart = null;
  updateBoardState();
  validatePath(selectionPath);
}

function applyHint() {
  if (!game || completed || hintsUsed >= MAX_HINTS) return;
  const alreadySkipped = [...foundWordIds, ...hintedWordIds];
  const hint = nextHint(game.targets, alreadySkipped, hintsUsed);
  if (!hint) {
    elements.status.textContent = "Todas as palavras já foram encontradas.";
    return;
  }
  hintsUsed = hint.hintsUsed;
  hintedWordIds.add(hint.targetId);
  const index = indexFromRowCol(hint.cell.row, hint.cell.col);
  activeCell = index;
  updateBoardState();
  updateProgress();
  elements.status.textContent = `Dica: a primeira letra de ${game.targets.find((target) => target.id === hint.targetId).display} foi destacada.`;
  if (mode === "daily") saveDailyProgress();
  window.clearTimeout(hintTimer);
  hintTimer = window.setTimeout(() => {
    hintedWordIds.delete(hint.targetId);
    updateBoardState();
  }, 2200);
}

function updateStatsDialog() {
  const entries = [
    ["Partidas concluídas", stats.gamesCompleted],
    ["Desafios diários", stats.dailyCompleted],
    ["Sequência atual", `${stats.currentStreak} ${stats.currentStreak === 1 ? "dia" : "dias"}`],
    ["Melhor sequência", `${stats.bestStreak} ${stats.bestStreak === 1 ? "dia" : "dias"}`],
    ["Tempo total", formatDuration(stats.totalSeconds)]
  ];
  const list = document.querySelector("#stats-list");
  list.replaceChildren();
  entries.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "stat-row";
    const name = document.createElement("dt");
    const result = document.createElement("dd");
    name.textContent = label;
    result.textContent = String(value);
    item.append(name, result);
    list.append(item);
  });
}

function persistPreferences() {
  store.prefs = { ...store.prefs, lang: store.prefs.lang ?? DEFAULT_SETTINGS.lang, size: store.prefs.size ?? DEFAULT_SETTINGS.size };
  saveStore();
}

function applyTheme(theme) {
  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  document.documentElement.dataset.theme = resolved;
  elements.themeButton.textContent = `Tema: ${theme === "system" ? "sistema" : theme === "dark" ? "escuro" : "claro"}`;
  elements.themeButton.setAttribute("aria-label", `Tema atual: ${theme === "system" ? "sistema" : theme}. Alterar tema.`);
}

function cycleTheme() {
  const themes = ["system", "light", "dark"];
  const current = store.prefs.theme ?? "system";
  store.prefs.theme = themes[(themes.indexOf(current) + 1) % themes.length];
  applyTheme(store.prefs.theme);
  saveStore();
}

function startFreeGame(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const lang = form.elements.lang.value;
  const size = Number(form.elements.size.value);
  if (!dictionaries[lang] || ![8, 10, 12].includes(size)) return;
  elements.freeDialog.close();
  createGame("free", { lang, size });
}

function resetDaily() {
  if (mode !== "daily" || completed) return;
  delete store.daily[game.date];
  saveStore();
  createGame("daily", { lang: game.lang });
  elements.resetDialog.close();
}

function setupInteractions() {
  elements.board.addEventListener("pointerdown", (event) => {
    const cell = event.target.closest("[data-index]");
    if (!cell || event.button !== 0 || completed) return;
    event.preventDefault();
    const index = Number(cell.dataset.index);
    feedbackToken += 1;
    drag = { pointerId: event.pointerId, start: index, last: index, moved: false, path: [index] };
    activeCell = index;
    cell.setPointerCapture?.(event.pointerId);
    updateBoardState();
    cell.focus({ preventScroll: true });
  });

  elements.board.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-index]");
    if (!cell) return;
    const index = Number(cell.dataset.index);
    if (index === drag.last) return;
    drag.last = index;
    if (index !== drag.start) drag.moved = true;
    const cells = resolveLine(rowColFromIndex(drag.start), rowColFromIndex(index));
    if (!cells) {
      drag.path = [];
      selectionPath = [];
      activeCell = index;
      updateBoardState();
      return;
    }
    drag.path = toIndices(cells);
    selectionPath = drag.path;
    activeCell = index;
    updateBoardState();
  });

  elements.board.addEventListener("pointerup", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const finishedDrag = drag;
    drag = null;
    finishedDrag.path = [];
    selectionPath = [];
    const releaseCell = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-index]");
    if (releaseCell) {
      const releaseIndex = Number(releaseCell.dataset.index);
      const releasePath = resolveLine(rowColFromIndex(finishedDrag.start), rowColFromIndex(releaseIndex));
      if (releasePath) {
        finishedDrag.last = releaseIndex;
        finishedDrag.moved = releaseIndex !== finishedDrag.start;
        finishedDrag.path = toIndices(releasePath);
        selectionPath = finishedDrag.path;
      }
    }
    if (finishedDrag.moved) {
      suppressClick = true;
      clickStart = null;
      window.setTimeout(() => { suppressClick = false; }, 0);
      if (finishedDrag.path.length > 1) validatePath(finishedDrag.path);
      else clearSelection("Seleção removida.");
    } else {
      selectionPath = [];
      updateBoardState();
    }
  });

  const cancelPointerSelection = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    feedbackToken += 1;
    drag = null;
    clickStart = null;
    selectionPath = [];
    updateBoardState();
    elements.status.textContent = "Seleção cancelada.";
  };
  elements.board.addEventListener("pointercancel", cancelPointerSelection);
  elements.board.addEventListener("lostpointercapture", cancelPointerSelection);

  elements.board.addEventListener("click", (event) => {
    const cell = event.target.closest("[data-index]");
    if (!cell) return;
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    handleCellClick(Number(cell.dataset.index));
  });

  elements.board.addEventListener("keydown", (event) => {
    const cell = event.target.closest("[data-index]");
    if (!cell) return;
    const index = Number(cell.dataset.index);
    if (event.key === "Escape") {
      clearSelection();
      return;
    }
    const { row, col } = rowColFromIndex(index);
    const moves = {
      ArrowUp: [row - 1, col],
      ArrowDown: [row + 1, col],
      ArrowLeft: [row, col - 1],
      ArrowRight: [row, col + 1]
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const [nextRow, nextCol] = moves[event.key];
    if (nextRow < 0 || nextRow >= game.size || nextCol < 0 || nextCol >= game.size) return;
    const nextIndex = indexFromRowCol(nextRow, nextCol);
    activeCell = nextIndex;
    if (clickStart !== null) {
      const cells = resolveLine(rowColFromIndex(clickStart), rowColFromIndex(nextIndex));
      selectionPath = cells ? toIndices(cells) : [clickStart];
    }
    updateBoardState();
    elements.board.querySelector(`[data-index="${nextIndex}"]`).focus();
  });

  elements.hintButton.addEventListener("click", applyHint);
  elements.themeButton.addEventListener("click", cycleTheme);
  document.querySelector("#free-game-button").addEventListener("click", () => {
    document.querySelector("#free-lang").value = store.prefs.lang;
    document.querySelector("#free-size").value = String(store.prefs.size);
    elements.freeDialog.showModal();
  });
  document.querySelector("#daily-game-button").addEventListener("click", () => createGame("daily", { lang: store.prefs.lang }));
  document.querySelector("#stats-button").addEventListener("click", () => {
    updateStatsDialog();
    elements.statsDialog.showModal();
  });
  document.querySelector("#help-button").addEventListener("click", () => elements.helpDialog.showModal());
  document.querySelector("#reset-button").addEventListener("click", () => {
    if (mode === "daily") elements.resetDialog.showModal();
    else createGame("free", { lang: game.lang, size: game.size });
  });
  document.querySelector("#free-form").addEventListener("submit", startFreeGame);
  document.querySelector("#confirm-reset").addEventListener("click", resetDaily);
  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });
  document.querySelector("#play-again").addEventListener("click", () => {
    elements.completeDialog.close();
    if (mode === "daily") createGame("daily", { lang: game.lang });
    else createGame("free", { lang: game.lang, size: game.size });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseTimer();
      saveDailyProgress();
      return;
    }
    resumeTimer();
    updateTimer();
  });
  window.addEventListener("beforeunload", saveDailyProgress);
  window.setInterval(() => {
    updateTimer();
    if (mode === "daily" && !completed && currentElapsedSeconds() % 5 === 0) saveDailyProgress();
  }, 1000);
}

function initialize() {
  if (!storeResult.persistent) elements.storageWarning.textContent = "O armazenamento local está indisponível; o progresso pode não ser salvo.";
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  media?.addEventListener?.("change", () => {
    if ((store.prefs.theme ?? "system") === "system") applyTheme("system");
  });
  applyTheme(store.prefs.theme ?? DEFAULT_SETTINGS.theme);
  persistPreferences();
  setupInteractions();
  createGame("daily", { lang: store.prefs.lang ?? DEFAULT_SETTINGS.lang });
}

initialize();
