import { describe, expect, it } from "vitest";
import {
  allocateBudget,
  allocatedTotal,
  daysUntil,
  generateTasks,
  profiles,
  progressPercent,
  remainingBudget,
  risks,
  vendorBalance,
  type EventPlan,
  type EventType,
} from "@/lib/planning";

const EVENT_TYPES: EventType[] = ["wedding", "birthday", "community"];

function baseEvent(overrides: Partial<EventPlan> = {}): EventPlan {
  const event: EventPlan = {
    id: "event-1",
    name: "Test event",
    type: "wedding",
    date: "2030-06-20",
    location: "Pune",
    guests: 120,
    budget: 500_000,
    currency: "INR",
    theme: "",
    dietary: "",
    accessibility: "",
    venue: "Indoor hall",
    priorities: "",
    notes: "",
    allocations: allocateBudget(500_000, "wedding"),
    tasks: [],
    vendors: [],
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  return { ...event, ...overrides };
}

describe("profiles", () => {
  it("uses percentages that add up to 100 for every event type", () => {
    for (const type of EVENT_TYPES) {
      const total = profiles[type].reduce(
        (sum, category) => sum + category.percent,
        0,
      );
      expect(total).toBe(100);
    }
  });

  it("gives every category a unique id", () => {
    for (const type of EVENT_TYPES) {
      const ids = profiles[type].map((category) => category.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("allocateBudget", () => {
  it.each([100_001, 999, 1, 123_457])(
    "allocates exactly the total for a budget of %i",
    (budget) => {
      for (const type of EVENT_TYPES) {
        const allocations = allocateBudget(budget, type);
        const sum = Object.values(allocations).reduce(
          (total, amount) => total + amount,
          0,
        );
        expect(sum).toBe(budget);
        expect(Object.values(allocations).every((amount) => Number.isInteger(amount))).toBe(
          true,
        );
      }
    },
  );

  it("keeps the contingency remainder non-negative", () => {
    const allocations = allocateBudget(1, "wedding");
    expect(allocations.contingency).toBeGreaterThanOrEqual(0);
  });
});

describe("generateTasks", () => {
  const event = baseEvent();

  it("creates ten ordered milestones", () => {
    const tasks = generateTasks(event);
    expect(tasks).toHaveLength(10);
    expect(tasks[0].title).toBe("Kickoff and priorities");
    expect(tasks.at(-1)?.title).toBe("Post-event closeout");
    expect(tasks.every((task) => task.status === "todo")).toBe(true);
  });

  it("counts backwards from the event date in UTC", () => {
    const tasks = generateTasks(event);
    expect(tasks[0].dueDate).toBe("2030-03-22");
    expect(tasks.at(-2)?.dueDate).toBe("2030-06-20");
    expect(tasks.at(-1)?.dueDate).toBe("2030-06-22");
  });

  it("is deterministic for the same input", () => {
    expect(generateTasks(event)).toEqual(generateTasks(event));
  });

  it("does not create milestones dated before today for a near event", () => {
    const today = new Date();
    today.setUTCHours(12, 0, 0, 0);
    const soon = new Date(today);
    soon.setUTCDate(soon.getUTCDate() + 10);

    const tasks = generateTasks({
      ...event,
      date: soon.toISOString().slice(0, 10),
    });
    const todayIso = today.toISOString().slice(0, 10);

    expect(tasks.every((task) => task.dueDate >= todayIso)).toBe(true);
  });
});

describe("budget helpers", () => {
  it("sums allocations", () => {
    expect(allocatedTotal({ venue: 100, catering: 250 })).toBe(350);
    expect(allocatedTotal({})).toBe(0);
  });

  it("reports remaining budget without clamping overspend", () => {
    expect(remainingBudget({ budget: 1_000 }, 250)).toBe(750);
    expect(remainingBudget({ budget: 1_000 }, 1_200)).toBe(-200);
  });

  it("never returns a negative vendor balance", () => {
    expect(vendorBalance({ quote: 100, paid: 120 })).toBe(0);
    expect(vendorBalance({ quote: 100, paid: 40 })).toBe(60);
  });

  it("calculates progress and handles an empty task list", () => {
    expect(progressPercent([])).toBe(0);
    expect(
      progressPercent([
        {
          id: "1",
          title: "A",
          dueDate: "2030-01-01",
          category: "Planning",
          priority: "high",
          status: "done",
          description: "",
        },
        {
          id: "2",
          title: "B",
          dueDate: "2030-01-02",
          category: "Planning",
          priority: "low",
          status: "todo",
          description: "",
        },
      ]),
    ).toBe(50);
  });

  it("calculates days to the event", () => {
    expect(daysUntil("2030-01-01")).toBeGreaterThan(0);
    expect(daysUntil("2020-01-01")).toBeLessThan(0);
  });
});

describe("risks", () => {
  it("warns when allocations exceed the budget", () => {
    const event = baseEvent({
      allocations: { ...allocateBudget(500_000, "wedding"), venue: 10_000_000 },
    });
    expect(risks(event)).toContain("Allocations exceed the total budget.");
  });

  it("warns when contingency is below five percent", () => {
    const event = baseEvent({
      allocations: { ...allocateBudget(500_000, "wedding"), contingency: 0 },
    });
    expect(risks(event)).toContain(
      "Contingency is below the recommended 5% reserve.",
    );
  });

  it("warns about a past event date", () => {
    const event = baseEvent({ date: "2020-01-01" });
    expect(risks(event)).toContain(
      "The event date has passed; review overdue milestones.",
    );
  });

  it("warns about an outdoor wedding", () => {
    const event = baseEvent({ venue: "Outdoor garden" });
    expect(risks(event)).toContain(
      "Add a weather backup plan for an outdoor or mixed venue.",
    );
  });

  it("warns when accessibility needs have no completed check", () => {
    const event = baseEvent({
      accessibility: "Step-free access",
      tasks: generateTasks(baseEvent()),
    });
    expect(risks(event)).toContain(
      "Accessibility needs are specified but the logistics check is incomplete.",
    );
  });

  it("warns when no vendor is booked or paid", () => {
    const researching = baseEvent({
      vendors: [
        {
          id: "v1",
          name: "Caterer",
          category: "Catering",
          quote: 100,
          paid: 0,
          status: "researching",
          deadline: "2030-01-01",
        },
      ],
    });
    expect(risks(researching)).toContain("No critical vendors are booked yet.");

    const paid = baseEvent({
      vendors: [
        {
          id: "v1",
          name: "Caterer",
          category: "Catering",
          quote: 100,
          paid: 100,
          status: "paid",
          deadline: "2030-01-01",
        },
      ],
    });
    expect(risks(paid)).not.toContain("No critical vendors are booked yet.");
  });

  it("returns no warnings for a healthy plan", () => {
    const event = baseEvent({
      vendors: [
        {
          id: "v1",
          name: "Caterer",
          category: "Catering",
          quote: 100,
          paid: 100,
          status: "paid",
          deadline: "2030-01-01",
        },
      ],
    });
    expect(risks(event)).toEqual([]);
  });
});
