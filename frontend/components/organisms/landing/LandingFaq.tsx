"use client";

import { useState } from "react";
import FaqRow from "@/frontend/components/molecules/landing/FaqRow";

// Accordion of frequently asked questions
export default function LandingFaq() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
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
          a="Every income, expense, transfer, or debt adjustment is stored with a source and a destination account. Money that leaves your cash account is always tracked in the account it moved to, whether that is savings, a debt or a receivable. Balances are recalculated from these records each time, instead of being stored separately, so they cannot drift out of sync."
        />
        <FaqRow 
          idx={2} 
          openIdx={openFaq} 
          setOpenIdx={setOpenFaq} 
          q="Is my financial data secure?" 
          a="Your records are stored in a PostgreSQL database and every request is checked against your signed-in account, so other users cannot see your data. Passwords are never stored in plain text: they are hashed with PBKDF2-SHA512 using a unique random salt per account, and repeated failed sign-in attempts are throttled."
        />
        <FaqRow 
          idx={3} 
          openIdx={openFaq} 
          setOpenIdx={setOpenFaq} 
          q="Can I add history later if I skip onboarding?" 
          a="Yes. A dedicated 'Add History' portal is continuously available in your sidebar. If your starting Cash or Bank balances were never set, you can configure them exactly once. For active debts and receivables, you can append forgotten historical obligations at any time without altering your cash balance."
        />
      </div>
    </section>
  );
}
