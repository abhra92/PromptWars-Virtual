"use client";

import { profiles, type EventPlan } from "@/lib/planning";

type Props = {
  event: EventPlan;
  onChange: (patch: Partial<EventPlan>) => void;
};

export function BudgetTab({ event, onChange }: Props) {
  const total = Object.values(event.allocations).reduce(
    (sum, amount) => sum + amount,
    0,
  );
  const remaining = event.budget - total;

  return (
    <section className="card" aria-labelledby="budget-heading">
      <div className="section-head">
        <div>
          <h2 id="budget-heading">Budget planner</h2>
          <p className="subtle">
            Editable planning assumptions, not market-verified prices.
          </p>
        </div>
        <span className={`pill ${total > event.budget ? "warning" : ""}`}>
          {event.currency} {total.toLocaleString()} allocated
        </span>
      </div>

      {profiles[event.type].map((category) => {
        const amount = event.allocations[category.id] ?? 0;
        const share = Math.min(100, (amount / event.budget) * 100 * 4);

        return (
          <div className="budget-row row" key={category.id}>
            <div style={{ width: "45%" }}>
              <b>{category.label}</b>
              <div className="progress" aria-hidden="true">
                <span style={{ width: `${share}%` }} />
              </div>
            </div>
            <input
              aria-label={`${category.label} allocation in ${event.currency}`}
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={amount}
              onChange={(change) =>
                onChange({
                  allocations: {
                    ...event.allocations,
                    [category.id]: Math.max(0, Number(change.target.value)),
                  },
                })
              }
              style={{
                width: 145,
                padding: 8,
                border: "1px solid var(--line)",
                borderRadius: 8,
              }}
            />
          </div>
        );
      })}

      <div className="section-head" style={{ marginTop: 18 }}>
        <b>Visible unallocated / overage</b>
        <strong aria-live="polite">
          {event.currency} {remaining.toLocaleString()}
        </strong>
      </div>
    </section>
  );
}
