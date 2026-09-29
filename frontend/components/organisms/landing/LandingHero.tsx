import type { AuthTab } from "@/frontend/components/organisms/landing/AuthModal";
import { ArrowLeftRight, ArrowRight, Bell, Calendar, Grid, Plus, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import MiniCard from "@/frontend/components/molecules/landing/MiniCard";
import Stat from "@/frontend/components/molecules/landing/Stat";
import MiniPill from "@/frontend/components/molecules/landing/MiniPill";
import MockTransactionRow from "@/frontend/components/molecules/landing/MockTransactionRow";

// Headline, highlights and the animated phone mockups
export default function LandingHero({ openAuthPortal }: { openAuthPortal: (tab: AuthTab) => void }) {
  return (
    <main className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
  
      {/* Left column info */}
      <div className="lg:col-span-6 space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20 shadow-sm animate-glow-pulse">
          <ShieldCheck size={14} className="shrink-0 animate-pulse" /> Smart. Simple. Powerful.
        </div>

        <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-5.5xl font-extrabold tracking-tight leading-tight lg:leading-none pt-1">
          Take Control of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-500">Your Money</span>
        </h2>

        <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-lg">
          My Finance helps you track income, manage expenses, handle debts & receivables, and grow your savings — all in one place.
        </p>

        <div className="flex flex-wrap gap-3 sm:gap-4 pt-1">
          {/* Button triggers readable registration modal */}
          <button
            onClick={() => openAuthPortal("SIGNUP")}
            className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-full bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs sm:text-sm transition hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-green-500/10 flex items-center gap-1.5"
          >
            Get Started Free <ArrowRight size={16} />
          </button>
        </div>

        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-4">
          <MiniCard icon={ArrowLeftRight} title="All Transactions" desc="Income, Expense, Debt & Receivable" />
          <MiniCard icon={TrendingUp} title="Clear Overview" desc="Beautiful insights at a glance" />
          <MiniCard icon={ShieldCheck} title="Financial Control" desc="Manage obligations with confidence" />
          <MiniCard icon={Wallet} title="Grow Savings" desc="Track progress and achieve goals" />
        </div>

        {/* Product Highlights */}
        <div className="grid grid-cols-3 gap-2 pt-6 border-t border-zinc-900/80 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-4">
          <Stat icon={Wallet} label="Accounts" value="Cash · Bank" />
          <Stat icon={ShieldCheck} label="Your Data" value="Private" />
          <Stat icon={TrendingUp} label="Pricing" value="Free" />
        </div>
      </div>

      {/* Right column: Overlapping glassmorphic device mockups */}
      <div className="lg:col-span-6 flex justify-center items-center h-[520px] sm:h-[600px] relative">
    
        {/* PHONE 2: THE CALENDAR SCREEN */}
        <div className="hidden sm:block absolute right-[5%] sm:right-[10%] top-[10%] w-[240px] sm:w-[270px] aspect-[9/19] rounded-[36px] bg-[#020408] border-[3px] border-zinc-800 shadow-[20px_20px_50px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-none opacity-40 sm:opacity-60 scale-95 origin-bottom-right rotate-[6deg] animate-float-medium z-0">
          <div className="w-full h-full p-3 sm:p-4 text-[10px] space-y-4 select-none">
            <div className="w-20 h-4 bg-black rounded-full mx-auto" />
            <div className="flex items-center justify-between text-zinc-400 px-1 pt-1 font-bold">
              <span>Calendar</span>
              <span>May 2026</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-bold text-zinc-400">
              {["S", "M", "T", "W", "T", "F", "S"].map(d => <span key={d}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[8px]">
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                const hasIncome = day === 5 || day === 26;
                const hasExpense = day === 6 || day === 14 || day === 28;
                return (
                  <div key={day} className="aspect-square flex flex-col justify-between p-1 bg-zinc-950/60 border border-zinc-900 rounded-md">
                    <span className="text-zinc-500 self-end text-[6.5px]">{day}</span>
                    <div className="text-[4px] text-left scale-90 origin-bottom-left leading-none font-bold">
                      {hasIncome && <span className="text-emerald-500 block">+2.5K</span>}
                      {hasExpense && <span className="text-rose-500 block">-1.2K</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PHONE 1: FOREGROUND INTERACTIVE APP DEMO SHOWCASE */}
        <div className="relative lg:absolute left-0 lg:left-[10%] mx-auto lg:mx-0 w-[250px] sm:w-[290px] aspect-[9/19] rounded-[38px] bg-[#020408] border-[4px] border-zinc-800 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden scale-100 hover:scale-[1.02] transition-transform duration-300 z-10 animate-float-slow">
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-50 flex items-center justify-between px-3 text-[9px] text-zinc-500 font-bold">
            <span>9:41</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>

          {/* Always displays your beautiful demo dashboard (Zero tiny inputs!) */}
          <div className="w-full h-full pt-9 pb-4 px-3.5 sm:px-4 flex flex-col justify-between relative overflow-y-auto [&::-webkit-scrollbar]:hidden select-none">
            <div className="flex flex-col gap-3.5 flex-1 animate-fadeIn pb-6">
              <div className="flex justify-between items-center pt-2">
                <div>
                  <p className="text-[9px] text-zinc-500 font-bold">Welcome back!</p>
                  <h4 className="text-xs font-black text-white flex items-center gap-1">Hello, Imran 👋</h4>
                </div>
                <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 relative">
                  <Bell size={11} />
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-black shadow-lg shadow-green-500/10 space-y-2">
                <p className="text-[8px] font-extrabold uppercase tracking-wider opacity-85">Total Balance</p>
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-black tracking-tight sm:text-lg">৳ 48,750.00</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <MiniPill label="Income" val="৳ 75.2K" color="text-emerald-400" />
                <MiniPill label="Expense" val="৳ 26.4K" color="text-rose-400" />
                <MiniPill label="Savings" val="৳ 18.7K" color="text-indigo-400" />
              </div>

              <div className="space-y-1.5 flex-1 overflow-hidden">
                <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest block">Recent Transactions</span>
                <MockTransactionRow name="Salary" type="INCOME" val="+৳ 50,000" isPositive={true} />
                <MockTransactionRow name="Groceries" type="EXPENSE" val="-৳ 2,450" isPositive={false} />
                <MockTransactionRow name="Friend Loan" type="RECEIVABLE" val="+৳ 3,200" isPositive={true} />
                <MockTransactionRow name="Electricity" type="EXPENSE" val="-৳ 1,850" isPositive={false} />
              </div>

              {/* Triggers readable modal popup */}
              <button 
                onClick={() => openAuthPortal("LOGIN")}
                className="w-full py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-green-500 font-extrabold text-[10px] rounded-xl transition flex items-center justify-center gap-1 shrink-0 cursor-pointer"
              >
                Click to Sign In Now <ArrowRight size={11} />
              </button>
            </div>

            {/* Phone footer nav */}
            <div className="h-10 border-t border-zinc-900/60 pt-1.5 flex justify-between items-center text-[7px] font-extrabold text-zinc-500 select-none shrink-0 relative z-30">
              <div className="flex flex-col items-center gap-0.5 text-green-500 cursor-pointer">
                <Grid size={11} /> Dashboard
              </div>
              <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                <ArrowLeftRight size={11} /> History
              </div>
          
              <div 
                onClick={() => openAuthPortal("SIGNUP")}
                className="w-7 h-7 rounded-full bg-green-500 text-black flex items-center justify-center -translate-y-3 cursor-pointer shadow-lg shadow-green-500/20 active:scale-95"
              >
                <Plus size={14} />
              </div>

              <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                <Calendar size={11} /> Calendar
              </div>
              <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                <TrendingUp size={11} /> Reports
              </div>
            </div>

          </div>
        </div>
      </div>

    </main>
  );
}
