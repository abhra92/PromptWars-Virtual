import { describe, expect, it } from "vitest";
import { csvCell, loadEvents, saveEvents, toCsv } from "@/lib/storage";

describe("csvCell", () => {
  it("quotes plain values", () => {
    expect(csvCell("venue")).toBe('"venue"');
  });

  it.each(["=SUM(A1:A2)", "+1", "-1", "@cmd"])(
    "neutralises spreadsheet formula %s",
    (value) => {
      expect(csvCell(value)).toBe(`"'${value}"`);
    },
  );

  it("escapes double quotes", () => {
    expect(csvCell('Asha "A" Rao')).toBe('"Asha ""A"" Rao"');
  });

  it("collapses line breaks so each record stays on one line", () => {
    expect(csvCell("line one\nline two")).toBe('"line one line two"');
  });

  it("handles nullish values", () => {
    expect(csvCell(undefined)).toBe('""');
    expect(csvCell(null)).toBe('""');
  });
});

describe("toCsv", () => {
  it("returns an empty string when there are no rows", () => {
    expect(toCsv([])).toBe("");
  });

  it("uses the union of keys so mixed record types are not truncated", () => {
    const csv = toCsv([
      { type: "Task", name: "Kickoff" },
      { type: "Budget", name: "Venue", amount: 900 },
    ]);

    const [header, first, second] = csv.split("\r\n");
    expect(header).toBe('"type","name","amount"');
    expect(first).toBe('"Task","Kickoff",""');
    expect(second).toBe('"Budget","Venue","900"');
  });
});

describe("browser storage", () => {
  it("returns an empty list when there is no window (server rendering)", () => {
    expect(loadEvents()).toEqual([]);
    expect(saveEvents([])).toBe(false);
  });
});
