import ShowcaseCard from "@/frontend/components/molecules/landing/ShowcaseCard";

// "Unmatched Ledger Intelligence" feature cards
export default function LandingFeatures() {
  return (
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
  );
}
