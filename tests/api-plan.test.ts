import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/ai/plan/route";
import { resetRateLimits } from "@/lib/rate-limit";

const validPayload = {
  name: "Asha and Arun",
  type: "wedding",
  date: "2030-06-20",
  location: "Pune",
  guests: 120,
  budget: 500_000,
  currency: "INR",
  theme: "Garden",
  dietary: "Vegetarian",
  accessibility: "Step-free access",
  venue: "Outdoor",
  priorities: "Food",
  notes: "",
  remainingDays: 500,
};

function post(body: string, headers: Record<string, string> = {}) {
  return POST(
    new Request("http://localhost/api/ai/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body,
    }),
  );
}

describe("POST /api/ai/plan", () => {
  beforeEach(() => {
    resetRateLimits();
    vi.stubEnv("GEMINI_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects malformed JSON", async () => {
    const response = await post("{not json");
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Send a valid JSON body.",
    });
  });

  it("rejects event details that fail validation", async () => {
    const response = await post(JSON.stringify({ ...validPayload, guests: 0 }));
    expect(response.status).toBe(400);
  });

  it("returns a labelled demo recommendation when no key is configured", async () => {
    const response = await post(JSON.stringify(validPayload));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.mode).toBe("demo");
    expect(body.data.assumptions[0]).toMatch(/no AI provider key/i);
  });

  it("rejects bodies larger than the limit", async () => {
    const response = await post(
      JSON.stringify({ ...validPayload, notes: "x".repeat(20_000) }),
    );
    expect(response.status).toBe(413);
  });

  it("rate limits repeated requests from one client", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await post(JSON.stringify(validPayload), {
        "x-forwarded-for": "203.0.113.10",
      });
      expect(response.status).toBe(200);
    }

    const blocked = await post(JSON.stringify(validPayload), {
      "x-forwarded-for": "203.0.113.10",
    });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });
});
