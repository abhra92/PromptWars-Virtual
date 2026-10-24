export const TABS = [
  "overview",
  "budget",
  "timeline",
  "vendors",
  "assistant",
] as const;

export type Tab = (typeof TABS)[number];

export function tabLabel(tab: Tab): string {
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}
