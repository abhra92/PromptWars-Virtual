"use client";

import { progressPercent, type EventPlan, type PlanTask } from "@/lib/planning";

type Props = {
  event: EventPlan;
  onChange: (patch: Partial<EventPlan>) => void;
};

export function TimelineTab({ event, onChange }: Props) {
  const toggle = (task: PlanTask, done: boolean) => {
    onChange({
      tasks: event.tasks.map((candidate) =>
        candidate.id === task.id
          ? { ...candidate, status: done ? "done" : "todo" }
          : candidate,
      ),
    });
  };

  return (
    <section className="card" aria-labelledby="timeline-heading">
      <div className="section-head">
        <div>
          <h2 id="timeline-heading">Timeline</h2>
          <p className="subtle">
            Dates recalculate when the event date changes.
          </p>
        </div>
        <span className="pill">
          {progressPercent(event.tasks)}% complete
        </span>
      </div>

      {event.tasks.map((task) => (
        <div className="task-row row" key={task.id}>
          <div className="row" style={{ justifyContent: "flex-start" }}>
            <input
              className="task-check"
              id={`task-${task.id}`}
              type="checkbox"
              checked={task.status === "done"}
              onChange={(change) => toggle(task, change.target.checked)}
            />
            <div>
              <label
                htmlFor={`task-${task.id}`}
                style={{
                  textDecoration: task.status === "done" ? "line-through" : "none",
                }}
              >
                <b>{task.title}</b>
              </label>
              <div className="subtle">
                <time dateTime={task.dueDate}>{task.dueDate}</time> ·{" "}
                {task.category}
              </div>
            </div>
          </div>
          <span className={`pill ${task.priority === "high" ? "warning" : ""}`}>
            {task.priority}
          </span>
        </div>
      ))}
    </section>
  );
}
