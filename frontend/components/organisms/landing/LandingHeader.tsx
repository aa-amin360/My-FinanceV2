import type { AuthTab } from "@/frontend/components/organisms/landing/AuthModal";
// Logo and the "Get Started" button
export default function LandingHeader({ openAuthPortal }: { openAuthPortal: (tab: AuthTab) => void }) {
  return (
    <header className="relative z-20 max-w-6xl w-full mx-auto h-20 flex items-center justify-between shrink-0 px-4 sm:px-6">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-black font-extrabold text-lg shadow-md shadow-green-500/20">
          M
        </div>
        <span className="font-extrabold text-lg tracking-wide text-green-500">My Finance</span>
      </div>

      {/* Action Button (Launches fully readable glass modal) */}
      <button 
        onClick={() => openAuthPortal("LOGIN")}
        className="px-5 py-2.5 rounded-full bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs tracking-wider transition hover:scale-105 active:scale-[0.98] shadow-sm shadow-green-500/10"
      >
        Get Started
      </button>
    </header>
  );
}
