// longest run of consecutive logged, within-limit days — not anchored to today
export function longestStreak(days: { calories: number }[], limit: number): number {
  let best = 0;
  let current = 0;
  for (const d of days) {
    if (d.calories > 0 && d.calories <= limit) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}
