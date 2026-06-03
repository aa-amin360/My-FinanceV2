"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  ArrowLeftRight, 
  Tag, 
  CreditCard, 
  ShieldCheck,
  Eye,
  EyeOff
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

      // Automatically log the user in after registration
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
        // New users are directed to onboarding to set starting balances/debts
        router.push("/onboarding");
      }
    } catch {
      setError("Something went wrong during sign-up. Please try again.");
      setLoading(false);
    }
  };

  // ==========================================
  // GOOGLE SIGN IN HANDLER
  // ==========================================
  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-300">
      
      {/* ================= HEADER ================= */}
      <header className="max-w-6xl w-full mx-auto px-6 h-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-black font-bold text-lg">
            M
          </div>
          <span className="font-bold text-lg tracking-wide text-green-500">My Finance</span>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <main className="max-w-6xl w-full mx-auto px-6 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        
        {/* Marketing Info (Left 7 Columns on desktop) */}
        <div className="lg:col-span-7 space-y-6 lg:pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500">
            <ShieldCheck size={14} /> Double-Entry Ledger Engine
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Take absolute control of your <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">personal wealth.</span>
          </h1>

          <p className="text-slate-500 dark:text-zinc-400 text-base sm:text-lg leading-relaxed max-w-xl">
            My Finance is a sleek, real-time ledger built to track assets, cash balances, liabilities, and receivables with exact mathematical precision. Zero missing cash, zero stale balances.
          </p>

          {/* Value Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <Highlight icon={ArrowLeftRight} title="Parent-Child Ledger Splits" desc="Automatically converts debt overpayments into active receivables." />
            <Highlight icon={TrendingUp} title="Active Cashflow Graphs" desc="Beautiful charts pre-calculated by indexed database aggregates." />
          </div>
        </div>

        {/* Auth Box (Right 5 Columns on desktop) */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <div className="w-full max-w-[400px] bg-white dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-900 shadow-xl rounded-3xl p-6 flex flex-col gap-6">
            
            {/* TABS */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-zinc-900 rounded-2xl">
              <button
                onClick={() => { setTab("LOGIN"); setError(""); setSuccess(""); }}
                className={`py-2 text-sm font-semibold rounded-xl transition ${
                  tab === "LOGIN" 
                    ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm" 
                    : "text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-300"
                }`}
              >
                Sign In
              </button>

              <button
                onClick={() => { setTab("SIGNUP"); setError(""); setSuccess(""); }}
                className={`py-2 text-sm font-semibold rounded-xl transition ${
                  tab === "SIGNUP" 
                    ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm" 
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
                  <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm pr-10"
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
              {error && <div className="text-xs text-red-500 font-semibold text-center">{error}</div>}
              {success && <div className="text-xs text-green-500 font-semibold text-center">{success}</div>}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl bg-green-500 hover:bg-green-400 disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-black font-semibold text-sm transition active:scale-[0.98]"
              >
                {loading ? "Processing..." : tab === "LOGIN" ? "Sign In" : "Create Account"}
              </button>
            </form>

            {/* SEPARATOR */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[1px] bg-slate-200 dark:bg-zinc-900" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or Continue With</span>
              <div className="flex-1 h-[1px] bg-slate-200 dark:bg-zinc-900" />
            </div>

            {/* OAUTH BUTTONS */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-zinc-900 transition flex items-center justify-center gap-2"
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
      <footer className="h-16 border-t border-slate-200 dark:border-zinc-900 flex items-center justify-center shrink-0">
        <span className="text-xs text-slate-400">© 2026 My Finance. All rights reserved.</span>
      </footer>

    </div>
  );
}

// ================= HIGHLIGHT COMPONENT =================
function Highlight({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{desc}</p>
      </div>
    </div>
  );
}
