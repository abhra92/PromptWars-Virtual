export type EventType = "wedding" | "birthday" | "community";

export type Category = {
  id: string;
  label: string;
  percent: number;
};

export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "done";

export type PlanTask = {
  id: string;
  title: string;
  dueDate: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  description: string;
};

export type VendorStatus = "researching" | "booked" | "paid";

export type Vendor = {
  id: string;
  category: string;
  name: string;
  quote: number;
  paid: number;
  status: VendorStatus;
  deadline: string;
};

export type EventPlan = {
  id: string;
  name: string;
  type: EventType;
  date: string;
  location: string;
  guests: number;
  budget: number;
  currency: string;
  theme: string;
  dietary: string;
  accessibility: string;
  venue: string;
  priorities: string;
  notes: string;
  allocations: Record<string, number>;
  tasks: PlanTask[];
  vendors: Vendor[];
  createdAt: string;
};

/** The fields a user edits when creating an event. Derived fields are generated. */
export type EventDraft = Omit<
  EventPlan,
  "id" | "createdAt" | "allocations" | "tasks" | "vendors"
>;

type CategorySeed = readonly [id: string, label: string, percent: number];

const WEDDING_CATEGORIES: CategorySeed[] = [
  ["venue", "Venue", 18],
  ["catering", "Catering", 28],
  ["decoration", "Decoration", 14],
  ["photography", "Photography", 10],
  ["attire", "Attire", 9],
  ["entertainment", "Entertainment", 7],
  ["transport", "Transport", 5],
  ["miscellaneous", "Miscellaneous", 4],
  ["contingency", "Contingency", 5],
];

const BIRTHDAY_CATEGORIES: CategorySeed[] = [
  ["venue", "Venue", 18],
  ["catering", "Catering", 24],
  ["cake", "Cake", 10],
  ["decoration", "Decoration", 15],
  ["entertainment", "Entertainment", 15],
  ["photography", "Photography", 5],
  ["miscellaneous", "Miscellaneous", 8],
  ["contingency", "Contingency", 5],
];

const COMMUNITY_CATEGORIES: CategorySeed[] = [
  ["venue", "Venue", 15],
  ["equipment", "Equipment", 18],
  ["food", "Food", 20],
  ["permits", "Permits allowance", 5],
  ["accessibility", "Accessibility", 8],
  ["volunteers", "Volunteers", 8],
  ["safety", "Safety", 8],
  ["transport", "Transport", 8],
  ["miscellaneous", "Miscellaneous", 5],
  ["contingency", "Contingency", 5],
];

function toCategories(seeds: CategorySeed[]): Category[] {
  return seeds.map(([id, label, percent]) => ({ id, label, percent }));
}

export const profiles: Record<EventType, Category[]> = {
  wedding: toCategories(WEDDING_CATEGORIES),
  birthday: toCategories(BIRTHDAY_CATEGORIES),
  community: toCategories(COMMUNITY_CATEGORIES),
};

/**
 * Splits an integer budget across the profile percentages.
 * Section amounts are floored; the final category absorbs the rounding
 * remainder so allocations always add up to the exact total.
 */
export function allocateBudget(
  total: number,
  type: EventType,
): Record<string, number> {
  const categories = profiles[type];
  const allocations: Record<string, number> = {};
  let assigned = 0;

  categories.forEach((category, index) => {
    const isLast = index === categories.length - 1;
    const amount = isLast
      ? total - assigned
      : Math.floor((total * category.percent) / 100);
    allocations[category.id] = amount;
    assigned += amount;
  });

  return allocations;
}

const MILLISECONDS_PER_DAY = 86_400_000;

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

type TaskSeed = readonly [
  title: string,
  daysBeforeEvent: number,
  category: string,
  priority: TaskPriority,
];

const TASK_SEEDS: TaskSeed[] = [
  ["Kickoff and priorities", 90, "Planning", "high"],
  ["Approve working budget", 75, "Budget", "high"],
  ["Research and shortlist venue", 70, "Venue", "high"],
  ["Book critical vendors", 45, "Vendors", "high"],
  ["Send invitations", 35, "Guests", "medium"],
  ["Confirm guest list", 14, "Guests", "high"],
  ["Accessibility and logistics check", 10, "Logistics", "high"],
  ["Final confirmations", 3, "Logistics", "high"],
  ["Event-day run sheet", 0, "Event day", "high"],
  ["Post-event closeout", -2, "Closeout", "low"],
];

/**
 * Builds a deterministic milestone list relative to the event date.
 * Dates are calculated in UTC so daylight-saving changes cannot shift them.
 */
export function generateTasks(
  event: Pick<EventPlan, "type" | "date" | "guests" | "venue" | "accessibility">,
): PlanTask[] {
  const eventDate = new Date(`${event.date}T12:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);

  return TASK_SEEDS.map(([title, daysBefore, category, priority], index) => {
    const planned = addDays(eventDate, -daysBefore);
    // Never hand a new plan milestones that were due before it was created.
    const due = eventDate >= today && planned < today ? today : planned;

    return {
      id: `task-${index + 1}`,
      title,
      dueDate: toIsoDate(due),
      category,
      priority,
      status: "todo",
      description: `Review ${title.toLowerCase()} for your ${event.type} plan.`,
    };
  });
}

/** Remaining budget after known spend. Negative values are surfaced, not clamped. */
export function remainingBudget(
  event: Pick<EventPlan, "budget">,
  actualSpend = 0,
): number {
  return event.budget - actualSpend;
}

/** Amount still owed to a vendor. Never negative. */
export function vendorBalance(vendor: Pick<Vendor, "quote" | "paid">): number {
  return Math.max(0, vendor.quote - vendor.paid);
}

/** Sum of every category allocation. */
export function allocatedTotal(
  allocations: Record<string, number>,
): number {
  return Object.values(allocations).reduce((sum, amount) => sum + amount, 0);
}

export function progressPercent(tasks: PlanTask[]): number {
  if (!tasks.length) return 0;
  const done = tasks.filter((task) => task.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}

export function daysUntil(isoDate: string): number {
  const target = new Date(`${isoDate}T12:00:00.000Z`).getTime();
  return Math.ceil((target - Date.now()) / MILLISECONDS_PER_DAY);
}

const MINIMUM_CONTINGENCY_RATE = 0.05;

/**
 * Explainable, rule-based risks. These are deterministic checks so the
 * dashboard can warn users even when no AI provider is configured.
 */
export function risks(
  event: Pick<
    EventPlan,
    | "budget"
    | "allocations"
    | "date"
    | "vendors"
    | "tasks"
    | "venue"
    | "accessibility"
    | "type"
  >,
): string[] {
  const warnings: string[] = [];
  const allocated = allocatedTotal(event.allocations);

  if (allocated > event.budget) {
    warnings.push("Allocations exceed the total budget.");
  }

  if ((event.allocations.contingency ?? 0) < event.budget * MINIMUM_CONTINGENCY_RATE) {
    warnings.push("Contingency is below the recommended 5% reserve.");
  }

  if (daysUntil(event.date) < 0) {
    warnings.push("The event date has passed; review overdue milestones.");
  }

  if (event.type === "wedding" && !event.venue.toLowerCase().includes("indoor")) {
    warnings.push("Add a weather backup plan for an outdoor or mixed venue.");
  }

  const accessibilityCheckOpen = event.tasks.some(
    (task) => task.title.includes("Accessibility") && task.status !== "done",
  );
  if (event.accessibility && accessibilityCheckOpen) {
    warnings.push(
      "Accessibility needs are specified but the logistics check is incomplete.",
    );
  }

  if (!event.vendors.some((vendor) => vendor.status !== "researching")) {
    warnings.push("No critical vendors are booked yet.");
  }

  return warnings;
}
