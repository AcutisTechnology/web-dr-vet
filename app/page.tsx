import { LandingNav, LandingHero } from "@/components/landing/landing-hero";
import {
  LandingStats,
  LandingFeatures,
  LandingAnamneseHighlight,
  LandingPlans,
  LandingTestimonials,
  LandingCTA,
  LandingFooter,
} from "@/components/landing/landing-sections";

export default function Home() {
  return (
    <>
      <style>{`
        @keyframes fadeInUp  { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
        @keyframes float     { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes blob      { 0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; } 50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; } }
      `}</style>
      <LandingNav />
      <LandingHero />
      <LandingStats />
      <LandingFeatures />
      <LandingAnamneseHighlight />
      <LandingPlans />
      <LandingTestimonials />
      <LandingCTA />
      <LandingFooter />
    </>
  );
}
