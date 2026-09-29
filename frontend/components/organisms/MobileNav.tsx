"use client";

import { useEffect } from "react";
import Link from "next/link";
import { isActivePath, MOBILE_NAV_ITEMS } from "@/frontend/lib/navigation";

// Horizontally scrolling bottom navigation for small screens
export default function MobileNav({ pathname }: { pathname: string }) {
  // Keep the active pill visible
  useEffect(() => {
    document.getElementById("active-nav-pill")?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md">
      <div className="flex gap-2 items-center w-full px-3 py-2 rounded-full bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/10 backdrop-blur-xl shadow-2xl overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} id={active ? "active-nav-pill" : undefined} className="shrink-0">
              <div className={`flex items-center justify-center gap-2 py-2 rounded-full transition-all duration-300 ${active ? "bg-green-500 text-black px-5 shadow-lg" : "text-slate-500 w-11 h-11"}`}>
                <item.icon size={20} />
                {active && <span className="font-bold text-xs">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
