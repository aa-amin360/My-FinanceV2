"use client";

import { useState, useEffect, useRef } from "react";
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
  Plus,
  ChevronDown,
  Info
} from "lucide-react";

type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
  note: string | null;
  parent_id?: string | null;
};

export default function LandingPage() {
  const router = useRouter();
  
  // Interactive Phone Screen State: "DEMO" or "AUTH"
  const [phoneScreen, setPhoneScreen] = useState<"DEMO" | "AUTH">("DEMO");
  const [tab, setTab] = useState<"LOGIN" | "SIGNUP">("LOGIN");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Input Fields State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Created Ref to target the Phone Mockup wrapper
  const phoneRef = useRef<HTMLDivElement | null>(null);

  // Custom UX handler: Sets states and smoothly scrolls to the phone if on mobile
  const handleOpenAuth = (tabType: "LOGIN" | "SIGNUP") => {
    setPhoneScreen("AUTH");
    setTab(tabType);
    setError("");
    setSuccess("");

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    }
  };

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

  // Smooth scroll handler for nav items
  const handleScrollToSection = (e: React.MouseEvent<HTMLElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#131B21] text-slate-100 flex flex-col justify-between transition-colors duration-300 overflow-y-auto overflow-x-hidden font-sans scroll-smooth">
      
      {/* ==========================================
          INLINE ANIMATION & BEHAVIOR STYLES
          ========================================== */}
      <style dangerouslySetInnerHTML={{__html: `
        html {
          scroll-behavior: smooth;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(0.3deg); }
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

      {/* ================= BACKGROUND BLURS ================= */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-500/[0.04] blur-[130px] pointer-events-none animate-blob-slow" />
      <div className="absolute bottom-[20%] right-[-5%] w-[600px] h-[600px] rounded-full bg-green-500/[0.03] blur-[140px] pointer-events-none animate-blob-slow" style={{ animationDelay: "5s" }} />

      {/* ================= HEADER ================= */}
      <header className="relative z-20 max-w-6xl w-full mx-auto h-20 flex items-center justify-between shrink-0 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-black font-extrabold text-lg shadow-md shadow-green-500/20">
            M
          </div>
          <span className="font-extrabold text-lg tracking-wide text-green-500">My Finance</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
          <a href="#features" onClick={(e) => handleScrollToSection(e, "features")} className="hover:text-white transition">Features</a>
          <a href="#how-it-works" onClick={(e) => handleScrollToSection(e, "how-it-works")} className="hover:text-white transition">How It Works</a>
          <a href="#faq" onClick={(e) => handleScrollToSection(e, "faq")} className="hover:text-white transition">FAQ</a>
        </nav>

        <button 
          onClick={() => handleOpenAuth("LOGIN")}
          className="px-5 py-2.5 rounded-full bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs tracking-wider transition hover:scale-105 active:scale-[0.98] shadow-sm shadow-green-500/10"
        >
          Get Started
        </button>
      </header>

      {/* ================= HERO FOLD CONTAINER ================= */}
      {/* ✅ Optimized padding for better fit on tablets and phones */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left column info */}
        <div className="lg:col-span-6 space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20 shadow-sm animate-glow-pulse">
            <ShieldCheck size={14} className="shrink-0 animate-pulse" /> Smart. Simple. Powerful.
          </div>

          {/* ✅ Scaled text sizes dynamically for small viewports to prevent wrapping */}
          <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-5.5xl font-extrabold tracking-tight leading-tight lg:leading-none pt-1">
            Take Control of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-500">Your Money</span>
          </h2>

          <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-lg">
            My Finance helps you track income, manage expenses, handle debts & receivables, and grow your savings — all in one place.
          </p>

          <div className="flex flex-wrap gap-3 sm:gap-4 pt-1">
            <button
              onClick={() => handleOpenAuth("SIGNUP")}
              className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-full bg-green-500 hover:bg-green-400 text-black font-extrabold text-xs sm:text-sm transition hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-green-500/10 flex items-center gap-1.5"
            >
              Get Started Free <ArrowRight size={16} />
            </button>
            <button
              onClick={(e) => handleScrollToSection(e, "how-it-works")}
              className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-full border border-zinc-800 bg-zinc-900/30 text-slate-300 font-bold text-xs sm:text-sm hover:bg-zinc-900/60 transition flex items-center gap-2 hover:scale-[1.03]"
            >
              <Play size={14} className="fill-slate-300" /> See How It Works
            </button>
          </div>

          {/* ✅ Core Pillars Grid updated to stack vertically on mobile (cols-1) and double-column on tablet (cols-2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-4">
            <MiniCard icon={ArrowLeftRight} title="All Transactions" desc="Income, Expense, Debt & Receivable" />
            <MiniCard icon={TrendingUp} title="Clear Overview" desc="Beautiful insights at a glance" />
            <MiniCard icon={ShieldCheck} title="Financial Control" desc="Manage obligations with confidence" />
            <MiniCard icon={Wallet} title="Grow Savings" desc="Track progress and achieve goals" />
          </div>

          {/* ✅ Trust Statistics updated to perfectly centered columns on mobile grids */}
          <div className="grid grid-cols-3 gap-2 pt-6 border-t border-zinc-900/80 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-4">
            <Stat icon={Users} label="Happy Users" value="10K+" />
            <Stat icon={ShieldCheck} label="Secure & Private" value="100%" />
            <Stat icon={TrendingUp} label="Transactions" value="50K+" />
          </div>
        </div>

        {/* Right column: Interactive dual mockups */}
        <div ref={phoneRef} className="lg:col-span-6 flex justify-center items-center h-[520px] sm:h-[600px] relative">
          
          {/* PHONE 2: THE CALENDAR SCREEN */}
          {/* ✅ Hidden on phones (hidden) to prevent overflow scrolling, and rendered from small tablet upwards (sm:block) */}
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

          {/* PHONE 1: FOREGROUND INTERACTIVE SCREEN */}
          {/* ✅ Scaled to responsive width (w-[250px] sm:w-[290px]) so it sits centered comfortably on any mobile device */}
          <div className="relative lg:absolute left-0 lg:left-[10%] mx-auto lg:mx-0 w-[250px] sm:w-[290px] aspect-[9/19] rounded-[38px] bg-[#020408] border-[4px] border-zinc-800 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden scale-100 hover:scale-[1.02] transition-transform duration-300 z-10 animate-float-slow">
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-50 flex items-center justify-between px-3 text-[9px] text-zinc-500 font-bold">
              <span>9:41</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>

            <div className="w-full h-full pt-9 pb-4 px-3 sm:px-4 flex flex-col justify-between relative overflow-y-auto [&::-webkit-scrollbar]:hidden select-none">

              {/* DEMO DISPLAY STATE */}
              {phoneScreen === "DEMO" && (
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
                    <TransactionRow name="Salary" type="INCOME" val="+৳ 50,000" isPositive={true} />
                    <TransactionRow name="Groceries" type="EXPENSE" val="-৳ 2,450" isPositive={false} />
                    <TransactionRow name="Friend Loan" type="RECEIVABLE" val="+৳ 3,200" isPositive={true} />
                    <TransactionRow name="Electricity" type="EXPENSE" val="-৳ 1,850" isPositive={false} />
                  </div>

                  <button 
                    onClick={() => handleOpenAuth("LOGIN")}
                    className="w-full py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-green-500 font-extrabold text-[10px] rounded-xl transition flex items-center justify-center gap-1 shrink-0"
                  >
                    Click to Open Auth Portal <ArrowRight size={11} />
                  </button>
                </div>
              )}

              {/* INTERACTIVE AUTH SCREEN STATE */}
              {phoneScreen === "AUTH" && (
                <div className="flex flex-col gap-4 flex-1 animate-fadeIn pt-2 justify-center pb-6">
                  <div className="grid grid-cols-2 p-0.5 bg-zinc-900 rounded-xl">
                    <button
                      onClick={() => { setTab("LOGIN"); setError(""); setSuccess(""); }}
                      className={`py-1 text-[10px] font-black rounded-lg transition-all duration-200 ${
                        tab === "LOGIN" ? "bg-zinc-800 text-white shadow-md" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setTab("SIGNUP"); setError(""); setSuccess(""); }}
                      className={`py-1 text-[10px] font-black rounded-lg transition-all duration-200 ${
                        tab === "SIGNUP" ? "bg-zinc-800 text-white shadow-md" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>

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

                  <button onClick={() => setPhoneScreen("DEMO")} className="text-[8.5px] font-bold text-zinc-500 hover:text-green-500 transition text-center mt-1">
                    ← Back to App Tour
                  </button>
                </div>
              )}

              {/* Phone footer nav (FAB triggers auth toggle) */}
              <div className="h-10 border-t border-zinc-900/60 pt-1.5 flex justify-between items-center text-[7px] font-extrabold text-zinc-500 select-none shrink-0 relative z-30">
                <div onClick={() => setPhoneScreen("DEMO")} className="flex flex-col items-center gap-0.5 text-green-500 cursor-pointer">
                  <Grid size={11} /> Dashboard
                </div>
                <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                  <ArrowLeftRight size={11} /> History
                </div>
                
                <div 
                  onClick={() => handleOpenAuth("SIGNUP")}
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

      {/* ======================================================================
          SECTION 2: DETAILED VALUE SHOWCASE & FEATURES (#features)
          ====================================================================== */}
      <section id="features" className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 md:py-20 border-t border-zinc-900/60">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16 px-1 animate-fadeIn">
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">Unmatched Ledger Intelligence</h2>
          <p className="text-sm text-slate-400">Discover the unique, mathematical mechanisms that keep your personal balance sheets perfect down to the single Taka.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ShowcaseCard 
            title="Parent-Child Ledger Splits" 
            metric="Auto-reconciled conversions" 
            desc="Overpay a debt of 2,000 Tk with 3,000 Tk? The engine automatically closes your debt to 0 Tk and maps the remaining 1,000 Tk into an active receivable asset, ensuring zero manual entry gaps."
          />
          <ShowcaseCard 
            title="Zero-Impact Budgeting" 
            metric="Forecast vs. Active Ledger" 
            desc="Draft future monthly cashflow projections, schedule repayments, and simulate month-end scenarios on a separate prediction layer that never touches your actual on-hand balances."
          />
          <ShowcaseCard 
            title="Continuous Onboarding" 
            metric="Safe Starting Baselines" 
            desc="Bypass double-counting. Initial debts and receivable configurations represent historically spent funds, routing cash flows to/from null to safely anchor your assets without modifying cash."
          />
        </div>
      </section>

      {/* ======================================================================
          SECTION 3: THREE STEPS LIFE-CYCLE (#how-it-works)
          ====================================================================== */}
      <section id="how-it-works" className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 md:py-20 border-t border-zinc-900/60 animate-fadeIn">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-3 py-1 rounded-full">Execution Sequence</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white mt-3">Three Steps to Absolute Clarity</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepBlock num="01" title="Initialize Balance" desc="Log in via Google or secure credentials. Complete your run-once onboarding flow to anchor your starting cash and bank positions." />
          <StepBlock num="02" title="Schedule Projections" desc="Add planned income streams or recurring expenses to your monthly forecast calendars, projecting your exact wealth threshold." />
          <StepBlock num="03" title="Confirm Transactions" desc="When an event is due, confirm it. The system automatically converts plans into actual ledger entries, maintaining an auditable paper trail." />
        </div>
      </section>

      {/* ======================================================================
          SECTION 4: INTERACTIVE ACCORDION FAQ (#faq)
          ====================================================================== */}
      <section id="faq" className="relative z-10 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 md:py-20 border-t border-zinc-900/60">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">Frequently Answered Questions</h2>
          <p className="text-sm text-slate-400">Deep, technical answers about how My Finance maintains precision.</p>
        </div>

        <div className="space-y-4">
          <FaqRow 
            idx={1} 
            openIdx={openFaq} 
            setOpenIdx={setOpenFaq} 
            q="How does the double-entry accounting engine work?" 
            a="Every income, expense, transfer, or debt adjustment is stored as a dual-legged transaction. This means every Tk that leaves your cash account is strictly tracked in its destination asset or liability ledger. Balance calculations are performed dynamically using native SQL aggregation indexes, guaranteeing no mathematical drift."
          />
          <FaqRow 
            idx={2} 
            openIdx={openFaq} 
            setOpenIdx={setOpenFaq} 
            q="Is my financial data secure?" 
            a="Yes. Your data sits on an isolated PostgreSQL server protected by Neon-serverless firewalls. Local credentials passwords are hashed using Node's robust SHA-512 with PBKDF2 cryptography with custom salt offsets, making them unreadable by any database operator or script."
          />
          <FaqRow 
            idx={3} 
            openIdx={openFaq} 
            setOpenIdx={setOpenFaq} 
            q="Can I add history later if I skip onboarding?" 
            a="Yes. A dedicated 'Add History' portal is continuously available in your sidebar. If your starting Cash or Bank balances were never set, you can configure them exactly once. For active debts and receivables, you can append forgotten historical obligations at any time without alterating your cash balance."
          />
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 h-20 border-t border-zinc-900/50 flex flex-col justify-center items-center gap-1 shrink-0 bg-black/10 px-4">
        <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider text-center">
          Trusted by thousands to manage their money better every day
        </span>
        <span className="text-[9px] text-slate-600">© 2026 My Finance. All rights reserved.</span>
      </footer>

    </div>
  );
}

// ================= COMPONENT PORTALS ================= //

function MiniCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex gap-3 p-3.5 rounded-2xl bg-[#131B21]/40 border border-white/[0.04] backdrop-blur-md shadow-sm">
      <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 shadow-inner border border-green-500/10">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-xs font-bold text-slate-200 truncate">{title}</h4>
        <p className="text-[10px] text-zinc-500 mt-0.5 truncate leading-normal">{desc}</p>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 mx-auto sm:mx-0">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black/25 text-green-500 flex items-center justify-center shrink-0 border border-white/[0.03] shadow-inner">
        <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-[8.5px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-wider truncate leading-none">{label}</p>
        <h4 className="text-xs sm:text-sm font-black text-slate-200 mt-1 leading-none">{value}</h4>
      </div>
    </div>
  );
}

function MiniPill({ label, val, color }: { label: string, val: string, color: string }) {
  return (
    <div className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-900/80 flex flex-col text-[7px] leading-tight font-extrabold text-left">
      <span className="text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className={`${color} mt-0.5`}>{val}</span>
    </div>
  );
}

function TransactionRow({ name, type, val, isPositive }: { name: string, type: string, val: string, isPositive: boolean }) {
  return (
    <div className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-900/60 flex justify-between items-center text-[7.5px] leading-none font-bold">
      <div className="min-w-0 flex-1">
        <p className="text-zinc-200 truncate">{name}</p>
        <p className="text-zinc-600 text-[6.5px] mt-0.5">{type}</p>
      </div>
      <span className={isPositive ? "text-green-400" : "text-red-400"}>
        {val}
      </span>
    </div>
  );
}

function ShowcaseCard({ title, metric, desc }: { title: string, metric: string, desc: string }) {
  return (
    <div className="p-6 rounded-3xl bg-white/5 dark:bg-black/20 border border-black/[0.04] dark:border-white/[0.04] backdrop-blur-md flex flex-col justify-between gap-4 shadow-sm hover:scale-[1.01] hover:border-green-500/20 transition-all duration-300">
      <div className="space-y-1.5">
        <h4 className="text-sm font-bold text-white tracking-wide">{title}</h4>
        <p className="text-[11px] text-slate-400 leading-normal">{desc}</p>
      </div>
      <div className="pt-3 border-t border-black/[0.03] dark:border-white/[0.03] flex items-center gap-1.5 text-[10px] font-bold text-green-500">
        <Info size={12} /> {metric}
      </div>
    </div>
  );
}

function StepBlock({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="relative p-6 rounded-3xl bg-black/10 border border-white/[0.02] flex flex-col gap-3">
      <span className="text-2xl font-black text-green-500/10 font-mono tracking-tight absolute top-4 right-6">{num}</span>
      <h4 className="text-sm font-bold text-white tracking-wide">{title}</h4>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function FaqRow({ idx, openIdx, setOpenIdx, q, a }: { idx: number, openIdx: number | null, setOpenIdx: (i: number | null) => void, q: string, a: string }) {
  const isOpen = openIdx === idx;
  return (
    <div 
      onClick={() => setOpenIdx(isOpen ? null : idx)}
      className="p-4 sm:p-5 rounded-2xl bg-white/5 dark:bg-black/20 border border-black/[0.04] dark:border-white/[0.04] backdrop-blur-md cursor-pointer transition-all duration-200"
    >
      <div className="flex justify-between items-center gap-3">
        <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">{q}</h4>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </div>
      {isOpen && (
        <p className="text-xs text-slate-400 leading-relaxed pt-3 border-t border-slate-100 dark:border-zinc-900/40 mt-3 animate-fadeIn">
          {a}
        </p>
      )}
    </div>
  );
}