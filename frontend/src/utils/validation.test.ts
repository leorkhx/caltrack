import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { localDateKey, localRangeToUtc, validateEntryForm } from "./validation";

describe("localDateKey", () => {
  const originalTz = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = "America/Sao_Paulo"; // UTC-3, no DST
  });

  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it("converts a UTC instant to the viewer's local calendar day", () => {
    // 23:30 UTC on the 16th is 20:30 on the 16th in UTC-3 — same day here,
    // but the point is it's derived from local time, not string-sliced.
    expect(localDateKey("2026-09-16T23:30:00Z")).toBe("2026-09-16");
  });

  it("rolls back a day near UTC midnight for a behind-UTC timezone", () => {
    // 01:00 UTC on the 16th is 22:00 on the 15th in UTC-3.
    expect(localDateKey("2026-09-16T01:00:00Z")).toBe("2026-09-15");
  });

  it("differs from naively slicing the ISO string", () => {
    const iso = "2026-09-16T01:00:00Z";
    expect(localDateKey(iso)).not.toBe(iso.slice(0, 10));
  });
});

describe("localRangeToUtc", () => {
  it("converts a local date range to full UTC day bounds", () => {
    const result = localRangeToUtc({ date_from: "2026-09-01", date_to: "2026-09-01" });
    expect(result.date_from).toBe(new Date("2026-09-01T00:00:00").toISOString());
    expect(result.date_to).toBe(new Date("2026-09-01T23:59:59.999").toISOString());
  });

  it("passes through undefined bounds", () => {
    expect(localRangeToUtc({})).toEqual({ date_from: undefined, date_to: undefined });
  });
});

describe("validateEntryForm", () => {
  const validValues = { foodName: "Banana", caloriesText: "100", quantityText: "1", date: "2020-01-01", time: "10:00" };

  it("passes with valid values", () => {
    expect(validateEntryForm(validValues)).toEqual({});
  });

  it("requires a food name", () => {
    expect(validateEntryForm({ ...validValues, foodName: "" }).foodName).toBeTruthy();
  });

  it("requires calories to be present", () => {
    expect(validateEntryForm({ ...validValues, caloriesText: "" }).calories).toBeTruthy();
  });

  it("rejects zero calories", () => {
    expect(validateEntryForm({ ...validValues, caloriesText: "0" }).calories).toBeTruthy();
  });

  it("requires a positive quantity", () => {
    expect(validateEntryForm({ ...validValues, quantityText: "0" }).quantity).toBeTruthy();
  });

  it("rejects a date far in the future", () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const [date, time] = future.toISOString().split("T");
    expect(validateEntryForm({ ...validValues, date, time: time.slice(0, 5) }).date).toBeTruthy();
  });
});
