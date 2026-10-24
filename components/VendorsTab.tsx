"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  vendorBalance,
  type EventPlan,
  type Vendor,
  type VendorStatus,
} from "@/lib/planning";

type Props = {
  event: EventPlan;
  onChange: (patch: Partial<EventPlan>) => void;
};

type Draft = Pick<Vendor, "name" | "category" | "quote" | "paid" | "deadline">;

const STATUS_LABELS: Record<VendorStatus, string> = {
  researching: "Researching",
  booked: "Booked",
  paid: "Paid",
};

function emptyDraft(eventDate: string): Draft {
  return {
    name: "",
    category: "Catering",
    quote: 0,
    paid: 0,
    deadline: eventDate,
  };
}

export function VendorsTab({ event, onChange }: Props) {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(event.date));

  const addVendor = (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    const name = draft.name.trim();
    if (!name) return;

    onChange({
      vendors: [
        ...event.vendors,
        {
          ...draft,
          name,
          category: draft.category.trim() || "General",
          id: crypto.randomUUID(),
          status: "researching",
        },
      ],
    });
    setDraft(emptyDraft(event.date));
  };

  const updateStatus = (vendor: Vendor, status: VendorStatus) => {
    onChange({
      vendors: event.vendors.map((candidate) =>
        candidate.id === vendor.id ? { ...candidate, status } : candidate,
      ),
    });
  };

  return (
    <section className="card" aria-labelledby="vendors-heading">
      <div className="section-head">
        <div>
          <h2 id="vendors-heading">Vendor manager</h2>
          <p className="subtle">
            Track real vendors separately from category assumptions.
          </p>
        </div>
      </div>

      <form className="form-grid" style={{ marginBottom: 20 }} onSubmit={addVendor}>
        <div className="field">
          <label htmlFor="vendor-name">Vendor name</label>
          <input
            id="vendor-name"
            value={draft.name}
            onChange={(change) =>
              setDraft({ ...draft, name: change.target.value })
            }
            placeholder="e.g. shortlist or confirmed vendor"
            maxLength={80}
          />
        </div>

        <div className="field">
          <label htmlFor="vendor-category">Category</label>
          <input
            id="vendor-category"
            value={draft.category}
            onChange={(change) =>
              setDraft({ ...draft, category: change.target.value })
            }
            maxLength={60}
          />
        </div>

        <div className="field">
          <label htmlFor="vendor-quote">Agreed quote ({event.currency})</label>
          <input
            id="vendor-quote"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={draft.quote}
            onChange={(change) =>
              setDraft({ ...draft, quote: Number(change.target.value) })
            }
          />
        </div>

        <div className="field">
          <label htmlFor="vendor-paid">Paid ({event.currency})</label>
          <input
            id="vendor-paid"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={draft.paid}
            onChange={(change) =>
              setDraft({ ...draft, paid: Number(change.target.value) })
            }
          />
        </div>

        <div className="field">
          <label htmlFor="vendor-deadline">Payment deadline</label>
          <input
            id="vendor-deadline"
            type="date"
            value={draft.deadline}
            onChange={(change) =>
              setDraft({ ...draft, deadline: change.target.value })
            }
          />
        </div>

        <div className="field" style={{ alignSelf: "end" }}>
          <button className="button secondary" type="submit">
            <Plus size={16} aria-hidden="true" /> Add vendor
          </button>
        </div>
      </form>

      {event.vendors.length === 0 ? (
        <p className="subtle">No vendors added yet.</p>
      ) : (
        event.vendors.map((vendor) => (
          <div className="vendor-row row" key={vendor.id}>
            <div>
              <b>{vendor.name}</b>
              <div className="subtle">
                {vendor.category} ·{" "}
                <time dateTime={vendor.deadline}>
                  {vendor.deadline || "no deadline"}
                </time>
              </div>
            </div>

            <div className="row">
              <label className="visually-hidden" htmlFor={`status-${vendor.id}`}>
                Status for {vendor.name}
              </label>
              <select
                id={`status-${vendor.id}`}
                value={vendor.status}
                onChange={(change) =>
                  updateStatus(vendor, change.target.value as VendorStatus)
                }
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <span>
                {event.currency} {vendorBalance(vendor).toLocaleString()} due
              </span>

              <button
                className="button ghost"
                type="button"
                aria-label={`Delete ${vendor.name}`}
                onClick={() =>
                  onChange({
                    vendors: event.vendors.filter(
                      (candidate) => candidate.id !== vendor.id,
                    ),
                  })
                }
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
