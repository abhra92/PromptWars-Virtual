"use client";

import { CheckCircle2 } from "lucide-react";
import {
  allocatedTotal,
  daysUntil,
  progressPercent,
  risks,
  type EventPlan,
} from "@/lib/planning";
import type { Tab } from "@/lib/tabs";

type Props = {
  event: EventPlan;
  onNavigate: (tab: Tab) => void;
};

export function OverviewTab({ event, onNavigate }: Props) {
  const progress = progressPercent(event.tasks);
  const days = daysUntil(event.date);
  const warnings = risks(event);
  const unallocated = event.budget - allocatedTotal(event.allocations);
  const nextTasks = event.tasks
    .filter((task) => task.status === "todo")
    .slice(0, 4);

  return (
    <>
      <div className="grid grid-4">
        <div className="card stat">
          <span className="subtle">Planning progress</span>
          <strong>{progress}%</strong>
          <div
            className="progress"
            role="progressbar"
            aria-label="Planning progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="card stat">
          <span className="subtle">Days to go</span>
          <strong>{Math.max(days, 0)}</strong>
          <span className="subtle">
            <time dateTime={event.date}>{event.date}</time>
          </span>
        </div>

        <div className="card stat">
          <span className="subtle">Total budget</span>
          <strong>
            {event.currency} {event.budget.toLocaleString()}
          </strong>
          <span className="subtle">{event.guests} guests</span>
        </div>

        <div className="card stat">
          <span className="subtle">Unallocated</span>
          <strong>
            {event.currency} {unallocated.toLocaleString()}
          </strong>
          <span className="subtle">budget not assigned</span>
        </div>
      </div>

      <div className="grid grid-2 section">
        <section className="card" aria-labelledby="next-up-heading">
          <div className="section-head">
            <h2 id="next-up-heading">Next up</h2>
            <button
              className="button ghost"
              type="button"
              onClick={() => onNavigate("timeline")}
            >
              View timeline
            </button>
          </div>

          {nextTasks.length ? (
            nextTasks.map((task) => (
              <div className="task-row row" key={task.id}>
                <div>
                  <b>{task.title}</b>
                  <div className="subtle">
                    <time dateTime={task.dueDate}>{task.dueDate}</time> ·{" "}
                    {task.category}
                  </div>
                </div>
                <span
                  className={`pill ${task.priority === "high" ? "warning" : ""}`}
                >
                  {task.priority}
                </span>
              </div>
            ))
          ) : (
            <p className="subtle">Every milestone is complete.</p>
          )}
        </section>

        <section className="card" aria-labelledby="attention-heading">
          <div className="section-head">
            <h2 id="attention-heading">Attention</h2>
            <span className="pill warning">{warnings.length} items</span>
          </div>

          {warnings.length ? (
            warnings.slice(0, 4).map((warning) => (
              <div className="idea" key={warning}>
                {warning}
              </div>
            ))
          ) : (
            <div className="idea">
              <CheckCircle2 size={17} aria-hidden="true" /> No deterministic
              risks detected.
            </div>
          )}
        </section>
      </div>

      <section className="card section" aria-labelledby="brief-heading">
        <div className="section-head">
          <h2 id="brief-heading">Planning brief</h2>
          <span className="pill">Assumptions editable</span>
        </div>
        <p className="subtle">
          {event.theme || "No theme preference yet."}{" "}
          {event.priorities && `Priorities: ${event.priorities}.`}{" "}
          {event.dietary && `Dietary: ${event.dietary}.`}
        </p>
      </section>
    </>
  );
}
