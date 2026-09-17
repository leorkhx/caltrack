import { describe, expect, it } from "vitest";
import { longestStreak } from "./streak";

describe("longestStreak", () => {
  it("returns 0 when nothing was logged", () => {
    expect(longestStreak([{ calories: 0 }, { calories: 0 }], 2000)).toBe(0);
  });

  it("counts a single unbroken run", () => {
    const days = [{ calories: 500 }, { calories: 800 }, { calories: 1200 }];
    expect(longestStreak(days, 2000)).toBe(3);
  });

  it("does not anchor to the last day — an old streak still counts", () => {
    // Streak of 3 in the middle, then a gap (0 calories) at the end (e.g. "today" not logged yet).
    const days = [
      { calories: 500 },
      { calories: 500 },
      { calories: 500 },
      { calories: 0 },
    ];
    expect(longestStreak(days, 2000)).toBe(3);
  });

  it("picks the longest run when there are multiple", () => {
    const days = [
      { calories: 500 }, // run of 1
      { calories: 0 },
      { calories: 500 },
      { calories: 500 },
      { calories: 500 }, // run of 3
      { calories: 0 },
    ];
    expect(longestStreak(days, 2000)).toBe(3);
  });

  it("a day over the limit breaks the streak", () => {
    const days = [{ calories: 500 }, { calories: 2500 }, { calories: 500 }];
    expect(longestStreak(days, 2000)).toBe(1);
  });

  it("a day with 0 calories (not logged) breaks the streak", () => {
    const days = [{ calories: 500 }, { calories: 0 }, { calories: 500 }];
    expect(longestStreak(days, 2000)).toBe(1);
  });
});
