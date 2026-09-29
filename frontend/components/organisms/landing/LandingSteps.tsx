import StepBlock from "@/frontend/components/molecules/landing/StepBlock";

// Three-step "how it works" section
export default function LandingSteps() {
  return (
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
  );
}
