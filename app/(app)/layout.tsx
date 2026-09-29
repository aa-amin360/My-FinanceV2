import type { ReactNode } from "react";
import DashboardLayout from "@/frontend/components/templates/DashboardLayout";

// Shared shell for every signed-in page. It stays mounted while navigating
// between these pages, so only the page content changes.
export default function AppLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
