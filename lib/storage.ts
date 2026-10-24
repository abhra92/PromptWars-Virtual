import type { EventPlan } from "./planning";

const STORAGE_KEY = "eventwise:v1";

/** Reads saved plans. Storage can be unavailable in private mode or SSR. */
export function loadEvents(): EventPlan[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EventPlan[]) : [];
  } catch {
    return [];
  }
}

/** Persists plans locally. Returns false when storage is full or blocked. */
export function saveEvents(events: EventPlan[]): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    return true;
  } catch {
    return false;
  }
}

/**
 * Escapes one CSV cell. Leading `=`, `+`, `-`, and `@` are prefixed with an
 * apostrophe so spreadsheet software treats them as text, not formulas.
 */
export function csvCell(value: unknown): string {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""').replace(/\r?\n/g, " ")}"`;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";

  const headers = Array.from(
    rows.reduce<Set<string>>((keys, row) => {
      Object.keys(row).forEach((key) => keys.add(key));
      return keys;
    }, new Set()),
  );
  const lines = rows.map((row) =>
    headers.map((header) => csvCell(row[header])).join(","),
  );

  return [headers.map(csvCell).join(","), ...lines].join("\r\n");
}

export { STORAGE_KEY };
