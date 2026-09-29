"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, X } from "lucide-react";
import { authApi } from "@/frontend/api/auth";
import { errorMessage } from "@/frontend/api/client";

export type AuthTab = "LOGIN" | "SIGNUP";

type AuthModalProps = {
  open: boolean;
  tab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
  onClose: () => void;
};

// Sign in / sign up dialog with email+password and Google.
// Stays mounted while closed so typed values survive reopening.
export default function AuthModal({ open, tab, onTabChange, onClose }: AuthModalProps) {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Start each opening without stale messages
  useEffect(() => {
    if (open) {
      setError("");
      setSuccess("");
    }
  }, [open]);

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
      await authApi.signUp({ name, email, password });
    } catch (err) {
      setError(errorMessage(err, "Failed to create account."));
      setLoading(false);
      return;
    }

    try {
      setSuccess("Account created! Logging you in...");

      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (loginRes?.error) {
        setError("Account created, but automatic sign-in failed. Please login manually.");
        onTabChange("LOGIN");
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

  if (!open) return null;

  return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
          {/* Complete, compile-safe dark Gunmetal and light silver gradient container */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="
            w-full max-w-[400px]
            bg-gradient-to-br from-white to-slate-50
            dark:bg-gradient-to-br dark:from-[#0d1318] dark:to-[#080b0f]
            backdrop-blur-xl
            border border-black/[0.06] dark:border-white/[0.06]
            text-black dark:text-white
            rounded-3xl p-6 sm:p-8
            shadow-2xl flex flex-col gap-6
            animate-modalIn relative
            "
          >
            {/* Header Tabs */}
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04] pb-4">
              <div className="flex gap-4">
                <button
                  onClick={() => { onTabChange("LOGIN"); setError(""); setSuccess(""); }}
                  className={`text-sm font-bold pb-2 border-b-2 transition-all duration-200 ${
                    tab === "LOGIN" 
                      ? "border-green-500 text-black dark:text-white font-extrabold" 
                      : "border-transparent text-slate-400 dark:text-zinc-500 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { onTabChange("SIGNUP"); setError(""); setSuccess(""); }}
                  className={`text-sm font-bold pb-2 border-b-2 transition-all duration-200 ${
                    tab === "SIGNUP" 
                      ? "border-green-500 text-black dark:text-white font-extrabold" 
                      : "border-transparent text-slate-400 dark:text-zinc-500 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Close Button */}
              <button 
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] text-slate-400 hover:text-black dark:hover:text-white transition"
              >
                <X size={14} />
              </button>
            </div>

            {/* Action Form with standard desktop text sizing */}
            <form onSubmit={tab === "LOGIN" ? handleSignIn : handleSignUp} className="flex flex-col gap-4">
              {tab === "SIGNUP" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 transition-all duration-200 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder={tab === "SIGNUP" ? "At least 8 characters" : "••••••••"}
                    minLength={tab === "SIGNUP" ? 8 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-950 pr-10 transition-all duration-200 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <div className="text-xs text-red-500 font-bold text-center leading-normal mt-2">{error}</div>}
              {success && <div className="text-xs text-green-500 font-bold text-center leading-normal mt-2">{success}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-xl bg-green-500 hover:bg-green-400 text-black font-extrabold text-sm transition active:scale-[0.98] shadow-md shadow-green-500/10"
              >
                {loading ? "Processing..." : tab === "LOGIN" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-[1px] bg-black/[0.06] dark:bg-white/[0.06]" />
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold tracking-widest uppercase">Or</span>
              <div className="flex-1 h-[1px] bg-black/[0.06] dark:bg-white/[0.06]" />
            </div>

            {/* Google Sign In inside clean modal */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-3 rounded-xl border border-black/[0.05] dark:border-white/[0.05] bg-black/[0.02] dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 font-bold text-sm hover:bg-black/[0.04] dark:hover:bg-zinc-900 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
  );
}
