import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventWise AI",
  description: "A calm, practical event planning workspace.",
  applicationName: "EventWise AI",
  openGraph: {
    title: "EventWise AI",
    description:
      "Plan a wedding, birthday, or community event with budgets, milestones, and vendors.",
    siteName: "EventWise AI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "EventWise AI",
    description:
      "Plan a wedding, birthday, or community event with budgets, milestones, and vendors.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f5ee",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
