import { NextResponse } from "next/server";
import { requestRecommendation, demoRecommendation } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import { aiRequestSchema } from "@/lib/validation";

const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function json(body: unknown, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers });
}

export async function POST(request: Request) {
  const limit = checkRateLimit(
    `ai:${clientKey(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );

  if (!limit.allowed) {
    return json(
      { error: "Too many requests. Wait a minute and try again." },
      429,
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ error: "The request is too large." }, 413);
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return json({ error: "Could not read the request." }, 400);
  }

  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: "The request is too large." }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Send a valid JSON body." }, 400);
  }

  const parsed = aiRequestSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      { error: "Please check the event details and try again." },
      400,
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ mode: "demo", data: demoRecommendation }, 200);
  }

  try {
    const data = await requestRecommendation(parsed.data, apiKey);
    return json({ mode: "ai", data }, 200);
  } catch (error) {
    // Keep provider details and credentials out of the response.
    console.error(
      "[ai/plan] recommendation failed:",
      error instanceof Error ? error.name : "unknown error",
    );
    return json(
      {
        error:
          "The AI assistant is unavailable right now. Your saved plan is unchanged.",
      },
      502,
    );
  }
}
