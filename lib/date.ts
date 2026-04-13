/** Returns today's date key in YYYY-MM-DD format (local time) */
export function getTodayDateKey(): string {
  const now = new Date();
  return formatDateKey(now);
}

/** Formats a Date to YYYY-MM-DD */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a YYYY-MM-DD key into a Date (midnight local time) */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Returns a human-readable label for a date key relative to today */
export function dateKeyLabel(key: string): string {
  const today = getTodayDateKey();
  const yesterday = formatDateKey(
    new Date(Date.now() - 24 * 60 * 60 * 1000),
  );
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  const date = parseDateKey(key);
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

/** Format an ISO timestamp to a short time string (HH:MM) */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
