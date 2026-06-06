"use client";

import { useState } from "react";
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
  ArrowUpRight
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
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
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-300 overflow-hidden">
      
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
          50% { transform: translateY(-12px) rotate(0.5deg); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(34, 197, 94, 0.1); }
          50% { box-shadow: 0 0 25px rgba(34, 197, 94, 0.25); }
        }
        @keyframes blobMove {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.15); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }
        .animate-glow-pulse {
          animation: glowPulse 3s ease-in-out infinite;
        }
        .animate-blob-slow {
          animation: blobMove 12s ease-in-out infinite;
        }
      `}} />

      {/* ================= BACKGROUND DECORATIONS ================= */}
      <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-green-500/10 dark:bg-green-500/5 blur-[120px] pointer-events-none animate-blob-slow" />
      <div className="absolute bottom-[5%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[130px] pointer-events-none animate-blob-slow" style={{ animationDelay: "4s" }} />

      {/* ================= HEADER ================= */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-6 h-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-black font-bold text-lg shadow-md shadow-green-500/20 group-hover:scale-105 transition-transform duration-200">
            M
          </div>
          <span className="font-extrabold text-lg tracking-wide text-green-500">My Finance</span>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-6 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        
        {/* Marketing Info (Left 7 Columns) */}
        <div className="lg:col-span-7 space-y-6 lg:pr-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20 shadow-sm animate-glow-pulse">
            <ShieldCheck size={14} className="shrink-0 animate-pulse" /> Double-Entry Ledger Engine
          </div>

          <h1 className="text-4xl sm:text-5.5xl font-extrabold tracking-tight leading-tight">
            Take absolute control of your <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-500">personal wealth.</span>
          </h1>

          <p className="text-slate-500 dark:text-zinc-400 text-base sm:text-lg leading-relaxed max-w-xl">
            My Finance is a sleek, real-time ledger built to track assets, cash balances, liabilities, and receivables with exact mathematical precision. Zero missing cash, zero stale balances.
          </p>

          {/* Value Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
            <Highlight icon={ArrowLeftRight} title="Parent-Child Ledger Splits" desc="Automatically converts debt overpayments into active receivables." />
            <Highlight icon={TrendingUp} title="Active Cashflow Graphs" desc="Beautiful charts pre-calculated by indexed database aggregates." />
          </div>

          {/* ================= FLOATING MOCK DASHBOARD WIDGET ================= */}
          <div className="animate-float-slow hidden sm:flex flex-col gap-3.5 p-5 rounded-3xl bg-white/70 dark:bg-zinc-950/40 border border-slate-200/60 dark:border-zinc-900/60 backdrop-blur-xl shadow-xl max-w-md mt-10 hover:border-green-500/40 transition duration-300">
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-900/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                  <Wallet size={15} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-bold">Ledger Balance</p>
                  <p className="text-base font-extrabold text-black dark:text-white leading-none mt-0.5">45,000.00 Tk</p>
                </div>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
            
            {/* Split transaction sample */}
            <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800/80 flex justify-between items-center shadow-inner">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-black dark:text-white flex items-center gap-1">
                  Repay Rahim <ArrowUpRight size={13} className="text-green-500" />
                </p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500">Debt settled, remaining extra saved</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-500">+10,000.00 Tk</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 font-bold border border-green-500/20">
                  Asset Auto-Convert
                </span>
              </div>
            </div>

            {/* Performance Metric sample */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 px-1 pt-1">
              <div className="flex items-center gap-1">
                <Activity size={12} className="text-green-500" /> All records fully audited
              </div>
              <span>History Initialized</span>
            </div>
          </div>
        </div>

        {/* Auth Box (Right 5 Columns) */}
        <div className="lg:col-span-5 flex justify-center w-full relative z-20">
          <div className="w-full max-w-[400px] bg-white dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-900 shadow-2xl rounded-3xl p-6 sm:p-7 flex flex-col gap-6 backdrop-blur-xl">
            
            {/* TABS */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-zinc-900 rounded-2xl">
              <button
                onClick={() => { setTab("LOGIN"); setError(""); setSuccess(""); }}
                className={`py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                  tab === "LOGIN" 
                    ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-md scale-[1.02]" 
                    : "text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-300"
                }`}
              >
                Sign In
              </button>

              <button
                onClick={() => { setTab("SIGNUP"); setError(""); setSuccess(""); }}
                className={`py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                  tab === "SIGNUP" 
                    ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-md scale-[1.02]" 
                    : "text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-300"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={tab === "LOGIN" ? handleSignIn : handleSignUp} className="flex flex-col gap-4">
              
              {tab === "SIGNUP" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm focus:bg-white dark:focus:bg-zinc-900 transition-all duration-200"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm focus:bg-white dark:focus:bg-zinc-900 transition-all duration-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm focus:bg-white dark:focus:bg-zinc-900 pr-10 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Status Indicators */}
              {error && <div className="text-xs text-red-500 font-bold text-center leading-normal">{error}</div>}
              {success && <div className="text-xs text-green-500 font-bold text-center leading-normal">{success}</div>}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-black font-extrabold text-sm transition active:scale-[0.98] shadow-lg shadow-green-500/20"
              >
                {loading ? "Processing..." : tab === "LOGIN" ? "Sign In" : "Create Account"}
              </button>
            </form>

            {/* SEPARATOR */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[1px] bg-slate-200 dark:bg-zinc-900" />
              <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Or Continue With</span>
              <div className="flex-1 h-[1px] bg-slate-200 dark:bg-zinc-900" />
            </div>

            {/* OAUTH BUTTONS */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-zinc-900 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Google
            </button>

          </div>
        </div>

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 h-16 border-t border-slate-200 dark:border-zinc-900/60 flex items-center justify-center shrink-0">
        <span className="text-[10px] sm:text-xs text-slate-400">© 2026 My Finance. All rights reserved.</span>
      </footer>

    </div>
  );
}

// ================= HIGHLIGHT COMPONENT =================
function Highlight({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 shadow-inner">
        <Icon size={18} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-normal">{desc}</p>
      </div>
    </div>
  );
}
