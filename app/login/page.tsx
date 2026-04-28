"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="h-screen flex items-center justify-center">
      <button
        onClick={() => signIn("google")}
        className="px-6 py-3 bg-green-500 rounded-xl"
      >
        Sign in with Google
      </button>
    </div>
  );
}
