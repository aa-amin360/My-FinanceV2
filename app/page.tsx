"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  ArrowLeftRight, 
  ShieldCheck,
  Eye,
  EyeOff,
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowRight,
  Play,
  Users,
  CheckCircle2,
  Calendar,
  Grid,
  Bell,
  Plus
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  
  // Interactive Phone Screen State: "DEMO" or "AUTH"
  const [phoneScreen, setPhoneScreen] = useState<"DEMO" | "AUTH">("DEMO");
  const [tab, setTab] = useState<"LOGIN" | "SIGNUP">("LOGIN");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Input Fields State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ==========================================
  // SIGN IN HANDLER
  // ==========================================
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  // ==========================================
  // SIGN UP HANDLER
  // ==========================================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await signupRes.json();

      if (!signupRes.ok) {
        setError(data.error || "Failed to create account.");
        setLoading(false);
        return;
      }

      setSuccess("Account created! Logging you in...");

      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (loginRes?.error) {
        setError("Account created, but automatic sign-in failed. Please login manually.");
        setTab("LOGIN");
        setLoading(false);
      } else {
        router.push("/onboarding");
      }
    } catch {
      setError("Something went wrong during sign-up. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="relative min-h-screen bg-[#03060f] text-slate-100 flex flex-col justify-between transition-colors duration-300 overflow-hidden font-sans select-none">
      
      {/* ==========================================
          INLINE ANIMATION STYLES (100% COMPATIBLE)
          ========================================== */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(0.3deg); }
        }
        @keyframes floatMedium {
          0%, 100% { transform: translateY(0px) rotate(1deg); }
          50% { transform: translateY(-15px) rotate(-1deg); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(34, 197, 94, 0.08); }
          50% { box-shadow: 0 0 25px rgba(34, 197, 94, 0.18); }
        }
        @keyframes blobMove {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, -40px) scale(1.15); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: floatMedium 8s ease-in-out infinite;
        }
        .animate-glow-pulse {
          animation: glowPulse 3s ease-in-out infinite;
        }
        .animate-blob-slow {
          animation: blobMove 15s ease-in-out infinite;
        }
      `}} />

      {/* ================= BACKGROUND DECORATIONS ================= */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-green-500/5 blur-[130px] pointer-events-none animate-blob-slow" />
      <div className="absolute bottom-[5%] right-[-5%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[140px] pointer-events-none animate-blob-slow" style={{ animationDelay: "5s" }} />

      {/* ================= HEADER ================= */}
      <header className="relative z-20 max-w-6xl w-full mx-auto px-6 h-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-black font-extrabold text-lg shadow-md shadow-green-500/20">
            M
          </div>
          <span className="font-extrabold text-lg tracking-wide text-green-500">My Finance</span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
          <a href="#" className="hover:text-white transition">Features</a>
          <a href="#" className="hover:text-white transition">How It Works</a>
          <a href="#" className="hover:text-white transition">Why My Finance</a>
          <a href="#" className="hover:text-white transition">Pricing</a>
          <a href="#" className="hover:text-white transition">FAQ</a>
        </nav>

        {/* Action Button */}
        <button 
          onClick={() => { setPhoneScreen("AUTH"); setTab("LOGIN"); }}
          className="px-5 py-2 rounded-full bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs tracking-wider transition hover:scale-105 active:scale-[0.98]"
        >
          Get Started
        </button>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-6 py-6 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        
        {/* ================= LEFT COLUMN: MARKETING COPY ================= */}
        <div className="lg:col-span-6 space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20 shadow-sm animate-glow-pulse">
            <ShieldCheck size={14} className="shrink-0 animate-pulse" /> Smart. Simple. Powerful.
          </div>

          <h2 className="text-4xl sm:text-5.5xl font-extrabold tracking-tight leading-tight">
            Take Control of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-500">Your Money</span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg">
            My Finance helps you track income, manage expenses, handle debts & receivables, and grow your savings — all in one place.
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => { setPhoneScreen("AUTH"); setTab("SIGNUP"); }}
              className="px-6 py-3 rounded-full bg-green-500 hover:bg-green-400 text-black font-extrabold text-sm transition hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-green-500/10 flex items-center gap-1.5"
            >
              Get Started Free <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setPhoneScreen("DEMO")}
              className="px-6 py-3 rounded-full border border-zinc-800 bg-zinc-900/30 text-slate-300 font-bold text-sm hover:bg-zinc-900/60 transition flex items-center gap-2 hover:scale-[1.03]"
            >
              <Play size={14} className="fill-slate-300" /> See How It Works
            </button>
          </div>

          {/* Core Pillars Grid */}
          <div className="grid grid-cols-2 gap-4 pt-6">
            <MiniCard icon={ArrowLeftRight} title="All Transactions" desc="Income, Expense, Debt & Receivable" />
            <MiniCard icon={TrendingUp} title="Clear Overview" desc="Beautiful insights at a glance" />
            <MiniCard icon={ShieldCheck} title="Financial Control" desc="Manage obligations with confidence" />
            <MiniCard icon={Wallet} title="Grow Savings" desc="Track progress and achieve goals" />
          </div>

          {/* Trust Statistics */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 pt-6 border-t border-zinc-900">
            <Stat icon={Users} label="Happy Users" value="10K+" />
            <Stat icon={ShieldCheck} label="Secure & Private" value="100%" />
            <Stat icon={TrendingUp} label="Transactions Managed" value="50K+" />
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: INTERACTIVE DUAL SMARTPHONE PORTAL
            ========================================================= */}
        <div className="lg:col-span-6 flex justify-center items-center h-[520px] sm:h-[600px] relative">
          
          {/* PHONE 2: THE CALENDAR SCREEN (Background offset) */}
          <div className="absolute right-[5%] sm:right-[10%] top-[10%] w-[240px] sm:w-[270px] aspect-[9/19] rounded-[36px] bg-[#020408] border-[3px] border-zinc-800 shadow-[20px_20px_50px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-none opacity-40 sm:opacity-60 scale-95 origin-bottom-right rotate-[6deg] animate-float-medium z-0">
            <div className="w-full h-full p-3 sm:p-4 text-[10px] space-y-4 select-none">
              
              {/* Dynamic island */}
              <div className="w-20 h-4 bg-black rounded-full mx-auto" />
              
              <div className="flex items-center justify-between text-zinc-400 px-1 pt-1 font-bold">
                <span>Calendar</span>
                <span>May 2026</span>
              </div>

              {/* Grid representation */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[8px]">
                {["S", "M", "T", "W", "T", "F", "S"].map(d => (
                  <span key={d} className="text-zinc-600">{d}</span>
                ))}
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                  const hasIncome = day === 5 || day === 26;
                  const hasExpense = day === 6 || day === 14 || day === 28;
                  return (
                    <div key={day} className="aspect-square flex flex-col justify-between p-1 bg-zinc-950 rounded-md border border-zinc-900">
                      <span className="text-zinc-400 self-end text-[7px]">{day}</span>
                      <div className="text-[5px] text-left scale-90 origin-bottom-left leading-none font-extrabold">
                        {hasIncome && <span className="text-green-500 block">+2.5K</span>}
                        {hasExpense && <span className="text-red-500 block">-1.2K</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Month Summary card */}
              <div className="p-2.5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-1 text-[8px] font-bold">
                <span className="text-zinc-500 block mb-1.5 uppercase">May Summary</span>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Income</span>
                  <span className="text-green-500">৳ 75,200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Expense</span>
                  <span className="text-red-500">৳ 26,450</span>
                </div>
                <div className="flex justify-between border-t border-zinc-900 pt-1 text-[9px]">
                  <span className="text-white">Net</span>
                  <span className="text-green-500">৳ 48,750</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              PHONE 1: THE INTERACTIVE SCREEN (DEMO OR LOGIN)
              ========================================================= */}
          <div className="absolute left-[5%] sm:left-[10%] w-[260px] sm:w-[290px] aspect-[9/19] rounded-[38px] bg-[#020408] border-[4px] border-zinc-800 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden scale-100 hover:scale-[1.02] transition-transform duration-300 z-10 animate-float-slow">
            
            {/* Dynamic Island Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-50 flex items-center justify-between px-3 text-[9px] text-zinc-500 font-bold">
              <span>9:41</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>

            {/* SCREEN CONTENT */}
            <div className="w-full h-full pt-9 pb-4 px-3.5 sm:px-4 flex flex-col justify-between relative overflow-y-auto [&::-webkit-scrollbar]:hidden">

              {/* ================= APP PREVIEW SCREEN ================= */}
              {phoneScreen === "DEMO" && (
                <div className="flex flex-col gap-3.5 flex-1 animate-fadeIn pb-6">
                  
                  {/* App Header */}
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

                  {/* Main Balance Card */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-black shadow-lg shadow-green-500/10 space-y-2">
                    <p className="text-[8px] font-extrabold uppercase tracking-wider opacity-85">Total Balance</p>
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-black tracking-tight">৳ 48,750.00</span>
                      <span className="text-[7.5px] font-extrabold bg-white/20 px-1.5 py-0.5 rounded-full">
                        ↑ 12.5% this month
                      </span>
                    </div>
                  </div>

                  {/* Overview Metrics (Pills) */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <MiniPill label="Income" val="৳ 75.2K" color="text-green-500" />
                    <MiniPill label="Expense" val="৳ 26.4K" color="text-red-500" />
                    <MiniPill label="Savings" val="৳ 18.7K" color="text-blue-500" />
                  </div>

                  {/* Recent Activity List */}
                  <div className="space-y-1.5 flex-1 overflow-hidden">
                    <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest block mb-1">Recent Transactions</span>
                    
                    <TransactionRow name="Salary" type="Income" val="+৳ 50,000" isPositive={true} />
                    <TransactionRow name="Groceries" type="Expense" val="-৳ 2,450" isPositive={false} />
                    <TransactionRow name="Friend Payment" type="Receivable" val="+৳ 3,200" isPositive={true} />
                    <TransactionRow name="Electricity Bill" type="Expense" val="-৳ 1,850" isPositive={false} />
                  </div>

                  {/* Interactive Button to launch Auth */}
                  <button 
                    onClick={() => { setPhoneScreen("AUTH"); setTab("LOGIN"); }}
                    className="w-full py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-green-500 font-extrabold text-[10px] rounded-xl transition flex items-center justify-center gap-1 shrink-0"
                  >
                    Click to Open Auth Portal <ArrowRight size={11} />
                  </button>
                </div>
              )}

              {/* ================= INTERACTIVE AUTH SCREEN ================= */}
              {phoneScreen === "AUTH" && (
                <div className="flex flex-col gap-4 flex-1 animate-fadeIn pt-2 justify-center pb-6">
                  
                  {/* Tabs */}
                  <div className="grid grid-cols-2 p-0.5 bg-zinc-900 rounded-xl">
                    <button
                      onClick={() => { setTab("LOGIN"); setError(""); setSuccess(""); }}
                      className={`py-1 text-[10px] font-black rounded-lg transition-all duration-200 ${
                        tab === "LOGIN" 
                          ? "bg-zinc-800 text-white shadow-md" 
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setTab("SIGNUP"); setError(""); setSuccess(""); }}
                      className={`py-1 text-[10px] font-black rounded-lg transition-all duration-200 ${
                        tab === "SIGNUP" 
                          ? "bg-zinc-800 text-white shadow-md" 
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={tab === "LOGIN" ? handleSignIn : handleSignUp} className="flex flex-col gap-2">
                    {tab === "SIGNUP" && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wide">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Your Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-green-500 text-[10px] focus:bg-zinc-950 transition-all text-white"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wide">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-green-500 text-[10px] focus:bg-zinc-950 transition-all text-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-wide">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-green-500 text-[10px] focus:bg-zinc-950 pr-8 text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 -translate-y-1/2 right-2.5 text-zinc-500 hover:text-zinc-300 transition"
                        >
                          {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                    </div>

                    {/* Status messaging inside screen */}
                    {error && <div className="text-[8px] text-red-500 font-bold text-center leading-normal mt-1">{error}</div>}
                    {success && <div className="text-[8px] text-green-500 font-bold text-center leading-normal mt-1">{success}</div>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 mt-2 rounded-lg bg-green-500 hover:bg-green-400 text-black font-extrabold text-[10px] transition active:scale-[0.98] shadow-md shadow-green-500/10"
                    >
                      {loading ? "Processing..." : tab === "LOGIN" ? "Sign In" : "Create Account"}
                    </button>
                  </form>

                  {/* Google OAuth inside phone */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-[1px] bg-zinc-900" />
                    <span className="text-[7px] text-zinc-500 font-bold tracking-widest uppercase">Or</span>
                    <div className="flex-1 h-[1px] bg-zinc-900" />
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 font-bold text-[10px] hover:bg-zinc-900 transition flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Continue with Google
                  </button>

                  {/* Return to demo screen */}
                  <button 
                    onClick={() => setPhoneScreen("DEMO")}
                    className="text-[8.5px] font-bold text-zinc-500 hover:text-green-500 transition text-center mt-1"
                  >
                    ← Back to App Tour
                  </button>

                </div>
              )}

              {/* Virtual App Bottom Navigation bar */}
              <div className="h-10 border-t border-zinc-900/60 pt-1.5 flex justify-between items-center text-[7px] font-extrabold text-zinc-500 select-none shrink-0 relative z-30">
                <div className="flex flex-col items-center gap-0.5 text-green-500 cursor-pointer">
                  <Grid size={11} /> Dashboard
                </div>
                <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                  <ArrowLeftRight size={11} /> History
                </div>
                
                {/* Floating Plus button */}
                <div 
                  onClick={() => { setPhoneScreen("AUTH"); setTab("LOGIN"); }}
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

      {/* ================= TRUST STATEMENT FOOTER ================= */}
      <div className="max-w-6xl w-full mx-auto px-6 py-6 border-t border-zinc-900/50 text-center relative z-10 shrink-0">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Trusted by thousands to manage their money better every day
        </span>
      </div>

    </div>
  );
}

// ================= MINICARDS (Value Grid Items) =================
function MiniCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex gap-2.5 p-3 rounded-2xl bg-zinc-950/40 border border-zinc-900/80 shadow-md">
      <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <h4 className="text-xs font-bold text-slate-200 truncate">{title}</h4>
        <p className="text-[10px] text-zinc-500 mt-0.5 truncate leading-tight">{desc}</p>
      </div>
    </div>
  );
}

// ================= STATISTICS COMPONENT =================
function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-zinc-950 text-green-500 flex items-center justify-center shrink-0 border border-zinc-900 shadow-inner">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-semibold">{label}</p>
        <h4 className="text-sm font-black text-slate-200 mt-0.5 leading-none">{value}</h4>
      </div>
    </div>
  );
}

// ================= MINI PILLS (Dashboard Widget Values) =================
function MiniPill({ label, val, color }: { label: string, val: string, color: string }) {
  return (
    <div className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-900/80 flex flex-col text-[7px] leading-tight font-extrabold text-left">
      <span className="text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className={`${color} mt-0.5`}>{val}</span>
    </div>
  );
}

// ================= MINATURE TRANSACTION ROW =================
function TransactionRow({ name, type, val, isPositive }: { name: string, type: string, val: string, isPositive: boolean }) {
  return (
    <div className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-900/60 flex justify-between items-center text-[7.5px] leading-none font-bold">
      <div className="min-w-0 flex-1">
        <p className="text-zinc-200 truncate">{name}</p>
        <p className="text-zinc-600 text-[6.5px] mt-0.5">{type}</p>
      </div>
      <span className={isPositive ? "text-green-500" : "text-red-500"}>
        {val}
      </span>
    </div>
  );
}
