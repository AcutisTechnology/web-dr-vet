import { LandingNav, LandingHero } from "@/components/landing/landing-hero";
import {
  LandingStats,
  ScrollBanner,
  LandingFeatures,
  LandingAnamneseHighlight,
  LandingComparison,
  LandingPlans,
  LandingTestimonials,
  LandingCTA,
  LandingFooter,
} from "@/components/landing/landing-sections";

export default function Home() {
  return (
    <>
      <LandingNav />
      <LandingHero />
      <LandingStats />
      <ScrollBanner />
      <LandingFeatures />
      <LandingAnamneseHighlight />
      <LandingComparison />
      <LandingPlans />
      <LandingTestimonials />
      <LandingCTA />
      <LandingFooter />
    </>
  );
}
