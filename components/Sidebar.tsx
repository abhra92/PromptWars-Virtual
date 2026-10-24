"use client";

import {
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Sparkles,
  Users,
} from "lucide-react";
import { TABS, tabLabel, type Tab } from "@/lib/tabs";

const ICONS = {
  overview: ClipboardList,
  budget: CircleDollarSign,
  timeline: CalendarDays,
  vendors: Users,
  assistant: Sparkles,
} as const;

type Props = {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
};

export function Sidebar({ activeTab, onSelect }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          E
        </span>
        EventWise AI
      </div>

      <nav className="nav" aria-label="Planning sections">
        {TABS.map((tab) => {
          const Icon = ICONS[tab];
          return (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? "active" : undefined}
              aria-current={activeTab === tab ? "page" : undefined}
              onClick={() => onSelect(tab)}
            >
              <Icon size={17} aria-hidden="true" />
              {tabLabel(tab)}
            </button>
          );
        })}
      </nav>

      <p className="sidebar-note">
        <b>Local-first planning</b>
        <br />
        A working notebook for decisions, deadlines, and details. AI suggestions
        stay optional and labelled.
      </p>
    </aside>
  );
}
