import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date in YYYY-MM-DD format.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Choose a valid calendar date.");

const shortText = (max: number) => z.string().trim().max(max);

export const eventSchema = z.object({
  name: z.string().trim().min(2, "Give the event a name.").max(80),
  type: z.enum(["wedding", "birthday", "community"]),
  date: isoDate,
  location: z
    .string()
    .trim()
    .min(2, "Add a city or venue area.")
    .max(120),
  guests: z.coerce
    .number()
    .int("Guest count must be a whole number.")
    .positive("Guest count must be at least 1.")
    .max(100_000),
  budget: z.coerce
    .number()
    .int("Budget must be a whole number.")
    .positive("Budget must be greater than 0.")
    .max(1_000_000_000),
  currency: z.string().trim().length(3, "Use a three-letter currency code."),
  theme: shortText(120),
  dietary: shortText(500),
  accessibility: shortText(500),
  venue: shortText(120),
  priorities: shortText(500),
  notes: shortText(1_000),
});

export type EventDraftInput = z.infer<typeof eventSchema>;

/** Payload accepted by `/api/ai/plan`. Unknown fields are stripped. */
export const aiRequestSchema = eventSchema.extend({
  remainingDays: z.number().int().min(0).max(5_000),
});

export type AiRequest = z.infer<typeof aiRequestSchema>;

const recommendationItem = z.object({
  title: z.string().trim().min(1).max(120),
  explanation: z.string().trim().min(1).max(600),
  priority: z.enum(["high", "medium", "low"]).optional(),
});

const recommendationList = z.array(z.string().trim().min(1).max(400)).max(8);

/**
 * Provider output is untrusted. Validate it before it reaches the browser,
 * so a confused or compromised model cannot inject unexpected markup/shape.
 */
export const aiRecommendationSchema = z.object({
  title: z.string().trim().min(1).max(160),
  explanation: z.string().trim().min(1).max(800),
  themes: z.array(recommendationItem).max(6),
  savings: recommendationList,
  contingencies: recommendationList,
  accessibility: recommendationList,
  assumptions: recommendationList,
});

export type AiRecommendation = z.infer<typeof aiRecommendationSchema>;

export type AiResponse = {
  mode: "ai" | "demo";
  data: AiRecommendation;
};
