"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { AssistantTab } from "@/components/AssistantTab";
import { BudgetTab } from "@/components/BudgetTab";
import { CreateEventModal } from "@/components/CreateEventModal";
import { EmptyState } from "@/components/EmptyState";
import { OverviewTab } from "@/components/OverviewTab";
import { Sidebar } from "@/components/Sidebar";
import { TimelineTab } from "@/components/TimelineTab";
import { VendorsTab } from "@/components/VendorsTab";
import {
  allocateBudget,
  generateTasks,
  vendorBalance,
  type EventDraft,
  type EventPlan,
} from "@/lib/planning";
import { loadEvents, saveEvents, toCsv } from "@/lib/storage";
import { TABS, tabLabel, type Tab } from "@/lib/tabs";
import { eventSchema } from "@/lib/validation";

const BLANK_EVENT: EventDraft = {
  name: "",
  type: "wedding",
  date: "",
  location: "",
  guests: 100,
  budget: 500_000,
  currency: "INR",
  theme: "",
  dietary: "",
  accessibility: "",
  venue: "",
  priorities: "",
  notes: "",
};

const EVENT_TYPE_LABELS = {
  wedding: "Wedding",
  birthday: "Birthday",
  community: "Community event",
} as const;

function safeFileName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "event"
  );
}

export default function Home() {
  const [events, setEvents] = useState<EventPlan[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [tab, setTab] = useState<Tab>("overview");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState<EventDraft>(BLANK_EVENT);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const event = events.find((candidate) => candidate.id === activeId);

  useEffect(() => {
    const saved = loadEvents();
    setEvents(saved);
    setActiveId(saved[0]?.id);
  }, []);

  useEffect(() => {
    if (!events.length) return;
    if (!saveEvents(events)) {
      setMessage("This browser could not save your plan. Storage may be full.");
      setMessageIsError(true);
    }
  }, [events]);

  const notify = (text: string, isError = false) => {
    setMessage(text);
    setMessageIsError(isError);
  };

  const updateActiveEvent = (patch: Partial<EventPlan>) => {
    if (!event) return;
    setEvents((current) =>
      current.map((candidate) =>
        candidate.id === event.id ? { ...candidate, ...patch } : candidate,
      ),
    );
  };

  const createEvent = (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    const parsed = eventSchema.safeParse(draft);

    if (!parsed.success) {
      notify(
        parsed.error.issues[0]?.message || "Please review the form.",
        true,
      );
      return;
    }

    const next: EventPlan = {
      ...parsed.data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      allocations: allocateBudget(parsed.data.budget, parsed.data.type),
      tasks: generateTasks(parsed.data),
      vendors: [],
    };

    setEvents((current) => [next, ...current]);
    setActiveId(next.id);
    setShowCreate(false);
    setTab("overview");
    setDraft(BLANK_EVENT);
    notify("Event created and saved in this browser.");
  };

  const deleteEvent = () => {
    if (!event) return;
    const confirmed = window.confirm(
      `Delete "${event.name}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    const remaining = events.filter((candidate) => candidate.id !== event.id);
    setEvents(remaining);
    setActiveId(remaining[0]?.id);
    notify("Event deleted.");
  };

  const exportPlan = () => {
    if (!event) return;

    const rows: Record<string, unknown>[] = [
      ...event.tasks.map((task) => ({
        type: "Task",
        name: task.title,
        dueDate: task.dueDate,
        status: task.status,
        category: task.category,
      })),
      ...Object.entries(event.allocations).map(([category, amount]) => ({
        type: "Budget",
        name: category,
        amount,
        currency: event.currency,
      })),
      ...event.vendors.map((vendor) => ({
        type: "Vendor",
        name: vendor.name,
        category: vendor.category,
        quote: vendor.quote,
        paid: vendor.paid,
        balance: vendorBalance(vendor),
      })),
    ];

    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName(event.name)}-plan.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify("Plan exported as CSV.");
  };

  const closeCreate = useCallback(() => setShowCreate(false), []);

  const handleTabKeys = (keyboardEvent: React.KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.indexOf(tab);
    let nextIndex: number | undefined;

    if (keyboardEvent.key === "ArrowRight") {
      nextIndex = (index + 1) % TABS.length;
    } else if (keyboardEvent.key === "ArrowLeft") {
      nextIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (keyboardEvent.key === "Home") {
      nextIndex = 0;
    } else if (keyboardEvent.key === "End") {
      nextIndex = TABS.length - 1;
    }

    if (nextIndex === undefined) return;
    keyboardEvent.preventDefault();
    const nextTab = TABS[nextIndex];
    setTab(nextTab);
    document.getElementById(`tab-${nextTab}`)?.focus();
  };

  const tabs = (
    <div
      className="tabs"
      role="tablist"
      aria-label="Event workspace sections"
      onKeyDown={handleTabKeys}
    >
      {TABS.map((candidate) => (
        <button
          key={candidate}
          id={`tab-${candidate}`}
          type="button"
          role="tab"
          aria-selected={tab === candidate}
          aria-controls={`panel-${candidate}`}
          tabIndex={tab === candidate ? 0 : -1}
          className={tab === candidate ? "active" : undefined}
          onClick={() => setTab(candidate)}
        >
          {tabLabel(candidate)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <Sidebar activeTab={tab} onSelect={setTab} />

      <main className="main" id="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">Field notes / 01</div>
            <h1>{event ? event.name : "Make space for a great day."}</h1>
            <div className="subtle">
              {event
                ? `${EVENT_TYPE_LABELS[event.type]} · ${event.guests} guests · ${event.location}`
                : "Turn a few details into a plan you can actually use."}
            </div>
          </div>

          <div className="row">
            {events.length > 1 && (
              <div className="field">
                <label htmlFor="event-switcher">Switch plan</label>
                <select
                  id="event-switcher"
                  value={activeId ?? ""}
                  onChange={(change) => {
                    setActiveId(change.target.value);
                    setTab("overview");
                  }}
                >
                  {events.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {event && (
              <button
                className="button secondary"
                type="button"
                onClick={deleteEvent}
              >
                <Trash2 size={16} aria-hidden="true" /> Delete
              </button>
            )}

            <button
              className="button secondary"
              type="button"
              onClick={exportPlan}
              disabled={!event}
            >
              <Download size={16} aria-hidden="true" /> Export
            </button>

            <button
              className="button"
              type="button"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={17} aria-hidden="true" /> New event
            </button>
          </div>
        </header>

        {message && (
          <div
            className="card"
            style={{ marginBottom: 16 }}
            role={messageIsError ? "alert" : "status"}
          >
            {message}{" "}
            <button
              className="button ghost"
              type="button"
              onClick={() => notify("")}
            >
              Dismiss
            </button>
          </div>
        )}

        {!event ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <>
            {tabs}

            <div
              id={`panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
              tabIndex={0}
            >
              {tab === "overview" && (
                <OverviewTab event={event} onNavigate={setTab} />
              )}
              {tab === "budget" && (
                <BudgetTab event={event} onChange={updateActiveEvent} />
              )}
              {tab === "timeline" && (
                <TimelineTab event={event} onChange={updateActiveEvent} />
              )}
              {tab === "vendors" && (
                <VendorsTab event={event} onChange={updateActiveEvent} />
              )}
              {tab === "assistant" && <AssistantTab event={event} />}
            </div>
          </>
        )}
      </main>

      {showCreate && (
        <CreateEventModal
          draft={draft}
          onChange={setDraft}
          onClose={closeCreate}
          onSubmit={createEvent}
        />
      )}
    </div>
  );
}
