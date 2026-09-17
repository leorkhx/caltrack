/** Longest run of consecutive logged, within-limit days anywhere in `days` —
 * not anchored to today, so an old streak still shows up even if nothing's
 * been logged recently. A day with 0 calories (nothing logged) or over the
 * limit breaks the run. */
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
