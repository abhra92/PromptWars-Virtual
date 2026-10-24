# EventWise AI

EventWise AI is a local-first planning workspace for weddings, birthdays, and community events. A short event brief becomes an editable budget, a dated milestone plan, a vendor ledger, explainable risk warnings, and optional Gemini suggestions.

**Chosen vertical:** Event planning (personal and community celebrations).

## Why this vertical

Event planning is full of small, dependent decisions: the budget shapes the vendor shortlist, the date shapes every deadline, and accessibility or dietary needs change what "good" looks like. Most tools either hide the maths or take control away from the planner. EventWise keeps the deterministic parts transparent and treats AI as an optional second opinion.

## How it works

1. **Create an event.** The form captures date, location, guest count, budget, venue type, theme, dietary needs, accessibility needs, and priorities. Input is validated on the client and again on the server.
2. **The planning engine runs first.** `lib/planning.ts` allocates the integer budget by event profile, generates ten milestones counted back from the event date, and evaluates rule-based risks. No AI is required for any of this.
3. **Edit with immediate feedback.** Budget rows recalculate the unallocated/overage total, timeline checkboxes update progress, and vendor balances are derived from quote and paid amounts. Every change is saved to `localStorage` under `eventwise:v1`.
4. **Ask for ideas when useful.** The assistant sends a bounded JSON payload to `/api/ai/plan`. The route validates input with Zod, limits body size and request rate, calls Gemini with a strict response schema, and validates the returned JSON before the browser sees it. With no key configured, a clearly labelled demo response is returned instead.
5. **Export the plan.** CSV export covers tasks, budget lines, and vendors, with formula-like cells escaped to reduce spreadsheet injection.

### Decision logic at a glance

| Decision | Rule |
| --- | --- |
| Budget split | Fixed profile percentages per event type; floored to whole units; final category absorbs rounding so the sum always equals the total. |
| Milestones | Ten fixed planning stages, dated backwards from the event (90 days to +2 days). |
| Risks | Allocations over budget, contingency below 5%, past event date, outdoor wedding without a weather plan, accessibility needs with an unfinished logistics check, no vendor booked. |
| AI | Suggestions only. The assistant never mutates the plan, and provider output is validated against a schema. |

## Architecture

```text
app/
  page.tsx                 Workspace shell: state, tabs, export, persistence
  layout.tsx               Metadata and document layout
  api/ai/plan/route.ts     Rate limit, validation, provider call, safe errors
components/                Presentation components for each workspace tab
lib/
  planning.ts              Typed planning engine (budgets, tasks, risks)
  storage.ts               Local storage and CSV helpers
  validation.ts            Zod schemas for forms, requests, and AI output
  ai.ts                    Gemini client, prompt, timeout, demo response
  rate-limit.ts            Fixed-window limiter for one process
tests/                     Vitest suites
```

Data stays in the browser. No account, database, or analytics service is required.

## Run locally

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

`GEMINI_API_KEY` enables live suggestions. `GEMINI_MODEL` is optional and defaults to `gemini-2.5-flash`. Without a key, the assistant returns a demo response that says so.

## Commands

```bash
npm run typecheck   # TypeScript, no emit
npm run lint        # ESLint
npm test            # Vitest (55 tests)
npm run build       # Production build
npm start           # Serve the production build
```

## Security

- The API key is read only on the server and is never sent to the browser.
- `.env*` files are ignored; only `.env.example` is committed.
- `/api/ai/plan` validates the body with Zod, enforces a 16 KB limit, applies a 5 requests/minute per-client limit, and returns generic errors without provider details.
- AI output is parsed as untrusted JSON and validated before rendering as text; the app does not render model HTML.
- Event text is passed to the model as labelled, untrusted data to reduce prompt-injection risk.
- CSV cells beginning with `=`, `+`, `-`, or `@` are prefixed with an apostrophe.
- Response headers include CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and COOP.
- `npm audit` may report an upstream PostCSS advisory that requires a breaking Next.js upgrade; it is tracked rather than force-fixed.

## Accessibility

- Semantic landmarks, a skip link, labelled form controls, and visible focus styles.
- Tabs use `role="tablist"` with arrow/Home/End keyboard navigation and `aria-selected`.
- Progress is exposed with `role="progressbar"`, and async messages use `aria-live`/`role="alert"`.
- The create dialog traps focus, closes on Escape, and restores focus to the trigger.
- Status is never communicated by colour alone, and `prefers-reduced-motion` disables transitions.
- Layout reflows to a single column on small screens, with tap targets kept comfortably sized.

Manual screen-reader and keyboard checks are still recommended before a production release.

## Tests

`npm test` covers:

- Budget allocation totals, integer rounding, and profile percentages.
- Milestone count, order, and date arithmetic.
- Risk rules, vendor balances, progress, and remaining budget.
- CSV quoting, formula escaping, and mixed-row headers.
- Schema validation for forms, requests, and AI output.
- Rate-limit windows and API route behaviour (invalid JSON, validation errors, demo mode, size limit, 429).

## Assumptions and limitations

- Budget percentages are planning heuristics, not market prices.
- Milestone offsets are generic and do not vary by venue or vendor lead time.
- All data is local to one browser profile; it is not encrypted, synchronized, or backed up.
- The rate limiter is per process and is not a substitute for a shared limiter in a multi-instance deployment.
- A production deployment would add authentication, durable storage, audit logging, and a formal vendor/legal review.

## Author

Built for the PromptWars Virtual challenge.
