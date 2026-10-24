import { describe, expect, it } from "vitest";
import {
  aiRecommendationSchema,
  aiRequestSchema,
  eventSchema,
} from "@/lib/validation";

const validDraft = {
  name: "  Asha and Arun  ",
  type: "wedding",
  date: "2030-06-20",
  location: "Pune",
  guests: "120",
  budget: "500000",
  currency: "INR",
  theme: "",
  dietary: "",
  accessibility: "",
  venue: "Indoor",
  priorities: "",
  notes: "",
};

describe("eventSchema", () => {
  it("trims text and coerces numeric strings", () => {
    const parsed = eventSchema.parse(validDraft);
    expect(parsed.name).toBe("Asha and Arun");
    expect(parsed.guests).toBe(120);
    expect(parsed.budget).toBe(500_000);
  });

  it("rejects impossible calendar dates", () => {
    const result = eventSchema.safeParse({ ...validDraft, date: "2026-02-31" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed dates", () => {
    expect(eventSchema.safeParse({ ...validDraft, date: "20-06-2030" }).success).toBe(
      false,
    );
  });

  it("rejects an empty guest count and budget", () => {
    expect(eventSchema.safeParse({ ...validDraft, guests: 0 }).success).toBe(false);
    expect(eventSchema.safeParse({ ...validDraft, budget: -1 }).success).toBe(false);
  });

  it("rejects an unknown event type", () => {
    expect(
      eventSchema.safeParse({ ...validDraft, type: "conference" }).success,
    ).toBe(false);
  });

  it("rejects text that exceeds its limit", () => {
    expect(
      eventSchema.safeParse({ ...validDraft, notes: "x".repeat(1001) }).success,
    ).toBe(false);
  });
});

describe("aiRequestSchema", () => {
  it("requires bounded remaining days", () => {
    const base = eventSchema.parse(validDraft);
    expect(aiRequestSchema.safeParse({ ...base, remainingDays: -1 }).success).toBe(
      false,
    );
    expect(aiRequestSchema.safeParse({ ...base, remainingDays: 6000 }).success).toBe(
      false,
    );
    expect(aiRequestSchema.safeParse({ ...base, remainingDays: 42 }).success).toBe(
      true,
    );
  });

  it("strips unknown fields from the browser payload", () => {
    const base = eventSchema.parse(validDraft);
    const parsed = aiRequestSchema.parse({
      ...base,
      remainingDays: 10,
      injected: "<script>",
    });
    expect("injected" in parsed).toBe(false);
  });
});

describe("aiRecommendationSchema", () => {
  const valid = {
    title: "Plan",
    explanation: "Explanation",
    themes: [{ title: "Calm", explanation: "Use soft light", priority: "high" }],
    savings: ["Compare quotes"],
    contingencies: ["Keep a reserve"],
    accessibility: ["Step-free route"],
    assumptions: ["Demo data"],
  };

  it("accepts a well-formed recommendation", () => {
    expect(aiRecommendationSchema.parse(valid).title).toBe("Plan");
  });

  it("requires every top-level section", () => {
    const { savings: _savings, ...missing } = valid;
    expect(aiRecommendationSchema.safeParse(missing).success).toBe(false);
  });

  it("rejects an invalid priority", () => {
    expect(
      aiRecommendationSchema.safeParse({
        ...valid,
        themes: [{ title: "Calm", explanation: "Soft light", priority: "urgent" }],
      }).success,
    ).toBe(false);
  });

  it("caps list length", () => {
    expect(
      aiRecommendationSchema.safeParse({
        ...valid,
        savings: Array.from({ length: 9 }, (_, index) => `Idea ${index}`),
      }).success,
    ).toBe(false);
  });
});
