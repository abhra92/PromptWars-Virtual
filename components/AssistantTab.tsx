"use client";

import { useState } from "react";
import { Lightbulb, Sparkles } from "lucide-react";
import type { EventPlan } from "@/lib/planning";
import type { AiResponse } from "@/lib/validation";
import { daysUntil } from "@/lib/planning";

type Props = {
  event: EventPlan;
};

const SECTIONS = [
  "savings",
  "contingencies",
  "accessibility",
  "assumptions",
] as const;

const SECTION_TITLES: Record<(typeof SECTIONS)[number], string> = {
  savings: "Cost-saving ideas",
  contingencies: "Contingencies",
  accessibility: "Accessibility",
  assumptions: "Assumptions",
};

export function AssistantTab({ event }: Props) {
  const [result, setResult] = useState<AiResponse>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    setLoading(true);
    setError("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: event.name,
          type: event.type,
          date: event.date,
          location: event.location,
          guests: event.guests,
          budget: event.budget,
          currency: event.currency,
          theme: event.theme,
          dietary: event.dietary,
          accessibility: event.accessibility,
          venue: event.venue,
          priorities: event.priorities,
          notes: event.notes,
          remainingDays: Math.max(0, daysUntil(event.date)),
        }),
        signal: controller.signal,
      });

      const body: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof body.error === "string"
            ? body.error
            : "The AI assistant is unavailable right now.";
        throw new Error(message);
      }

      setResult(body as AiResponse);
    } catch (requestError) {
      setError(
        requestError instanceof DOMException && requestError.name === "AbortError"
          ? "The request timed out. Your saved plan is unchanged."
          : requestError instanceof Error
            ? requestError.message
            : "The AI assistant is unavailable right now.",
      );
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <section className="card" aria-labelledby="assistant-heading">
      <div className="section-head">
        <div>
          <h2 id="assistant-heading">AI planning assistant</h2>
          <p className="subtle">
            Suggestions never overwrite your plan or replace deterministic
            calculations.
          </p>
        </div>
        <span className="pill">
          <Lightbulb size={14} aria-hidden="true" /> optional
        </span>
      </div>

      <button
        className="button"
        type="button"
        onClick={ask}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? (
          "Thinking…"
        ) : (
          <>
            <Sparkles size={16} aria-hidden="true" /> Generate ideas
          </>
        )}
      </button>

      <div aria-live="polite">
        {error && (
          <div className="idea" role="alert">
            <b>Could not generate ideas</b>
            <div>{error}</div>
          </div>
        )}

        {result && (
          <div className="section">
            <span className="pill">
              {result.mode === "ai"
                ? "Gemini recommendation"
                : "Demo / local template"}
            </span>
            <h3 style={{ marginTop: 10 }}>{result.data.title}</h3>
            <p className="subtle">{result.data.explanation}</p>

            {result.data.themes.length > 0 && (
              <div className="idea">
                <b>Themes</b>
                {result.data.themes.map((theme) => (
                  <div key={`${theme.title}-${theme.explanation}`}>
                    • {theme.title}: {theme.explanation}
                  </div>
                ))}
              </div>
            )}

            {SECTIONS.map((section) =>
              result.data[section].length ? (
                <div className="idea" key={section}>
                  <b>{SECTION_TITLES[section]}</b>
                  {result.data[section].map((item) => (
                    <div key={item}>• {item}</div>
                  ))}
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>
    </section>
  );
}
