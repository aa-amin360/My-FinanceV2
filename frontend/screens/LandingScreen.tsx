"use client";

import { useState } from "react";
import AuthModal, { AuthTab } from "@/frontend/components/organisms/landing/AuthModal";
import LandingFaq from "@/frontend/components/organisms/landing/LandingFaq";
import LandingFeatures from "@/frontend/components/organisms/landing/LandingFeatures";
import LandingFooter from "@/frontend/components/organisms/landing/LandingFooter";
import LandingHeader from "@/frontend/components/organisms/landing/LandingHeader";
import LandingHero from "@/frontend/components/organisms/landing/LandingHero";
import LandingSteps from "@/frontend/components/organisms/landing/LandingSteps";
import LandingStyles from "@/frontend/components/organisms/landing/LandingStyles";

export default function LandingScreen() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tab, setTab] = useState<AuthTab>("LOGIN");

  const openAuthPortal = (authTab: AuthTab) => {
    setTab(authTab);
    setShowAuthModal(true);
  };

  return (
    <div className="relative min-h-screen bg-[#131B21] text-slate-100 flex flex-col justify-between transition-colors duration-300 overflow-y-auto overflow-x-hidden font-sans select-none scroll-smooth">
      <LandingStyles />

      {/* Background blurs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-500/[0.04] blur-[130px] pointer-events-none animate-blob-slow" />
      <div className="absolute bottom-[20%] right-[-5%] w-[600px] h-[600px] rounded-full bg-green-500/[0.03] blur-[140px] pointer-events-none animate-blob-slow" style={{ animationDelay: "5s" }} />

      <LandingHeader openAuthPortal={openAuthPortal} />
      <LandingHero openAuthPortal={openAuthPortal} />

      <AuthModal open={showAuthModal} tab={tab} onTabChange={setTab} onClose={() => setShowAuthModal(false)} />

      <LandingFeatures />
      <LandingSteps />
      <LandingFaq />
      <LandingFooter />
    </div>
  );
}
