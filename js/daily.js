export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateOrdinal(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return NaN;
  const [, year, month, day] = match.map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const check = new Date(timestamp);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return NaN;
  return timestamp / 86400000;
}

export function dailySeed(dateKey, lang, size = 10) {
  return `${dateKey}:${lang}:${size}`;
}

export function resetMissedStreak(stats, today) {
  if (!stats.lastDailyDate) return { ...stats };
  const gap = dateOrdinal(today) - dateOrdinal(stats.lastDailyDate);
  return gap > 1 ? { ...stats, currentStreak: 0 } : { ...stats };
}

export function completeDailyStreak(stats, today) {
  if (stats.lastDailyDate === today) return { ...stats };
  const gap = stats.lastDailyDate ? dateOrdinal(today) - dateOrdinal(stats.lastDailyDate) : Infinity;
  const currentStreak = gap === 1 ? stats.currentStreak + 1 : 1;
  return {
    ...stats,
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    lastDailyDate: today,
    dailyCompleted: stats.dailyCompleted + 1,
    gamesCompleted: stats.gamesCompleted + 1
  };
}
