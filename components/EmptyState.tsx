"use client";

import Image from "next/image";
import { Plus } from "lucide-react";

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="empty">
      <Image
        className="empty-illustration"
        src="/notifications.svg"
        alt=""
        aria-hidden="true"
        width={720}
        height={460}
        priority
      />
      <h2>Start with the shape of your event</h2>
      <p className="subtle">
        A calm workspace for budgets, deadlines, vendors, and thoughtful
        details.
      </p>
      <button className="button" type="button" onClick={onCreate}>
        <Plus size={17} aria-hidden="true" /> Create your first event
      </button>
    </div>
  );
}
