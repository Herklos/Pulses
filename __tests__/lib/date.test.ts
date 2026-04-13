import {
  formatDateKey,
  parseDateKey,
  getTodayDateKey,
  dateKeyLabel,
  formatTime,
} from "@/lib/date";

describe("formatDateKey", () => {
  it("formats a date to YYYY-MM-DD", () => {
    expect(formatDateKey(new Date(2024, 0, 5))).toBe("2024-01-05");
  });

  it("zero-pads single-digit month and day", () => {
    expect(formatDateKey(new Date(2024, 2, 9))).toBe("2024-03-09");
  });

  it("handles December (month 11)", () => {
    expect(formatDateKey(new Date(2024, 11, 31))).toBe("2024-12-31");
  });
});

describe("parseDateKey", () => {
  it("parses a YYYY-MM-DD string to midnight local time", () => {
    const date = parseDateKey("2024-03-15");
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(2); // 0-indexed
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
  });
});

describe("formatDateKey / parseDateKey roundtrip", () => {
  it("round-trips correctly for arbitrary dates", () => {
    const original = new Date(2026, 6, 4); // Jul 4 2026
    const key = formatDateKey(original);
    const parsed = parseDateKey(key);
    expect(key).toBe("2026-07-04");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(6);
    expect(parsed.getDate()).toBe(4);
  });
});

describe("getTodayDateKey", () => {
  it("returns a string matching YYYY-MM-DD format", () => {
    const key = getTodayDateKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns today's date", () => {
    const now = new Date();
    const expected = formatDateKey(now);
    expect(getTodayDateKey()).toBe(expected);
  });
});

describe("dateKeyLabel", () => {
  it("returns 'Today' for today's key", () => {
    const today = getTodayDateKey();
    expect(dateKeyLabel(today)).toBe("Today");
  });

  it("returns 'Yesterday' for yesterday's key", () => {
    const yesterday = formatDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    expect(dateKeyLabel(yesterday)).toBe("Yesterday");
  });

  it("returns a formatted date string for older dates", () => {
    const label = dateKeyLabel("2020-01-15");
    // Should be a non-empty string and not "Today" or "Yesterday"
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
    expect(label).not.toBe("Today");
    expect(label).not.toBe("Yesterday");
  });
});

describe("formatTime", () => {
  it("returns a non-empty time string from an ISO timestamp", () => {
    const result = formatTime("2024-06-15T14:30:00.000Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
