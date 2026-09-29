"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import QuickAddButton from "@/frontend/components/molecules/QuickAddButton";
import AppHeader from "@/frontend/components/organisms/AppHeader";
import MobileNav from "@/frontend/components/organisms/MobileNav";
import Sidebar from "@/frontend/components/organisms/Sidebar";
import TransactionModal from "@/frontend/components/organisms/TransactionModal";
import { useOnboardingGate } from "@/frontend/hooks/useOnboardingGate";
import { setOnboardingCached } from "@/frontend/lib/onboardingCache";
import { useTheme } from "@/frontend/providers/ThemeProvider";
import TopProgressBar from "@/frontend/components/atoms/TopProgressBar";

// Shell for every signed-in page: sidebar, header, mobile nav, quick-add and the transaction modal
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { toggleTheme, theme, collapsed, toggleCollapse } = useTheme();

  useOnboardingGate(pathname);

  const handleSignOut = () => {
    setOnboardingCached(false);
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#E7EBED] text-black dark:bg-[#131B21] dark:text-white transition-colors duration-300">
      {/* Ambient background */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,0,0,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.14),rgba(0,0,0,0))]" />

      <Sidebar pathname={pathname} collapsed={collapsed} onToggleCollapse={toggleCollapse} />

      <div className="relative z-10 flex flex-col flex-1 h-full min-w-0">
        <AppHeader theme={theme} onToggleTheme={toggleTheme} onSignOut={handleSignOut} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-32 md:pb-8">{children}</div>
        </main>
      </div>

      <TopProgressBar />
      <MobileNav pathname={pathname} />
      <QuickAddButton pathname={pathname} />
      <TransactionModal />
    </div>
  );
}
