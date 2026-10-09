// Marketing page. Layout, components and motion follow the Notus agent marketing template
// (https://notus-agent-marketing-template.vercel.app/): railed 1280px column, 1px section
// rules, hatched frames, shimmer eyebrows, spring-driven hover and scroll effects. The copy,
// product mock-ups and screenshots are Sagewell's own. Copy lives in ./landing/content.js.
import Navbar from "./landing/Navbar";
import Hero from "./landing/Hero";
import LogoGrid from "./landing/LogoGrid";
import HowItWorks from "./landing/HowItWorks";
import Features from "./landing/Features";
import UseCases from "./landing/UseCases";
import Benefits from "./landing/Benefits";
import Privacy from "./landing/Privacy";
import Faq from "./landing/Faq";
import ClosingCta from "./landing/ClosingCta";
import Footer from "./landing/Footer";
import { DivideX } from "./landing/primitives";

export default function LandingPage() {
  return (
    <div className="landing-theme font-display h-full min-h-screen overflow-x-clip bg-white [--pattern-fg:var(--color-charcoal-900)]/10 antialiased selection:bg-brand/25 dark:bg-black dark:[--pattern-fg:var(--color-neutral-100)]/30">
      <Navbar />
      <main>
        <Hero />
        <LogoGrid />
        <DivideX />
        <HowItWorks />
        <Features />
        <UseCases />
        <Benefits />
        <Privacy />
        <Faq />
        <ClosingCta />
      </main>
      <DivideX />
      <Footer />
    </div>
  );
}
