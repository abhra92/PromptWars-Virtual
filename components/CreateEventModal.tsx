"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import type { EventDraft, EventType } from "@/lib/planning";

type Props = {
  draft: EventDraft;
  onChange: (draft: EventDraft) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

export function CreateEventModal({ draft, onChange, onClose, onSubmit }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const firstField = dialog?.querySelector<HTMLElement>(FOCUSABLE);
    firstField?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        onClose();
        return;
      }

      if (keyboardEvent.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => element.offsetParent !== null);

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop">
      <div
        className="modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="section-head">
          <div>
            <div className="eyebrow">New plan</div>
            <h2 id={titleId}>Create an event</h2>
            <p className="subtle" id={descriptionId}>
              Required fields are marked with an asterisk. Everything is stored
              in this browser.
            </p>
          </div>
          <button
            className="button ghost"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="form-grid">
          <div className="field">
            <label htmlFor="name">Event name *</label>
            <input
              id="name"
              required
              maxLength={80}
              value={draft.name}
              onChange={(change) => onChange({ ...draft, name: change.target.value })}
              placeholder="Asha & Arun's wedding"
            />
          </div>

          <div className="field">
            <label htmlFor="type">Event type *</label>
            <select
              id="type"
              value={draft.type}
              onChange={(change) =>
                onChange({ ...draft, type: change.target.value as EventType })
              }
            >
              <option value="wedding">Wedding</option>
              <option value="birthday">Birthday</option>
              <option value="community">Community event</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="date">Event date *</label>
            <input
              id="date"
              type="date"
              min={today}
              required
              value={draft.date}
              onChange={(change) => onChange({ ...draft, date: change.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="location">Location *</label>
            <input
              id="location"
              required
              maxLength={120}
              value={draft.location}
              onChange={(change) =>
                onChange({ ...draft, location: change.target.value })
              }
              placeholder="City or venue area"
            />
          </div>

          <div className="field">
            <label htmlFor="guests">Guest count *</label>
            <input
              id="guests"
              type="number"
              inputMode="numeric"
              min="1"
              max="100000"
              required
              value={draft.guests}
              onChange={(change) =>
                onChange({ ...draft, guests: Number(change.target.value) })
              }
            />
          </div>

          <div className="field">
            <label htmlFor="budget">Total budget *</label>
            <input
              id="budget"
              type="number"
              inputMode="numeric"
              min="1"
              required
              value={draft.budget}
              onChange={(change) =>
                onChange({ ...draft, budget: Number(change.target.value) })
              }
            />
          </div>

          <div className="field">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={draft.currency}
              onChange={(change) =>
                onChange({ ...draft, currency: change.target.value })
              }
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="theme">Preferred theme or style</label>
            <input
              id="theme"
              maxLength={120}
              value={draft.theme}
              onChange={(change) => onChange({ ...draft, theme: change.target.value })}
              placeholder="Warm, modern, garden"
            />
          </div>

          <div className="field">
            <label htmlFor="venue">Venue preference</label>
            <select
              id="venue"
              value={draft.venue}
              onChange={(change) => onChange({ ...draft, venue: change.target.value })}
            >
              <option value="">Select</option>
              <option>Indoor</option>
              <option>Outdoor</option>
              <option>Mixed</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="dietary">Dietary requirements</label>
            <input
              id="dietary"
              maxLength={500}
              value={draft.dietary}
              onChange={(change) =>
                onChange({ ...draft, dietary: change.target.value })
              }
              placeholder="Vegetarian, allergies, preferences"
            />
          </div>

          <div className="field full">
            <label htmlFor="accessibility">Accessibility requirements</label>
            <input
              id="accessibility"
              maxLength={500}
              value={draft.accessibility}
              onChange={(change) =>
                onChange({ ...draft, accessibility: change.target.value })
              }
              placeholder="Mobility, hearing, sensory or other needs"
            />
          </div>

          <div className="field full">
            <label htmlFor="priorities">Planning priorities</label>
            <textarea
              id="priorities"
              maxLength={500}
              value={draft.priorities}
              onChange={(change) =>
                onChange({ ...draft, priorities: change.target.value })
              }
              placeholder="What matters most?"
            />
          </div>

          <div className="field full">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              maxLength={1000}
              value={draft.notes}
              onChange={(change) => onChange({ ...draft, notes: change.target.value })}
            />
          </div>

          <div className="row field full">
            <button type="button" className="button secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="button" type="submit">
              Create plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
