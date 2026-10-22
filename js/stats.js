import { completeDailyStreak } from "./daily.js";

export function recordCompletion(stats, { mode, date, elapsedSeconds }) {
  const elapsed = Math.max(0, Math.floor(elapsedSeconds));
  const updated = {
    ...stats,
    gamesCompleted: stats.gamesCompleted + 1,
    totalSeconds: stats.totalSeconds + elapsed
  };
  if (mode === "daily") return completeDailyStreak({ ...updated, gamesCompleted: stats.gamesCompleted, totalSeconds: updated.totalSeconds }, date);
  return updated;
}

export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
