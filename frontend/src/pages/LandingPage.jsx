// Marketing page. Visual system follows the Notus template's layout language (railed 1280px
// column, full-width section rules, coral accent, Inter Display + DM Mono); all code, copy
// and illustrations are Sagewell's own. Copy lives in ./landing/content.js.
import "@fontsource-variable/inter/opsz.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";

import { useEffect } from "react";
import Navbar from "./landing/Navbar";
import Hero from "./landing/Hero";
import HowItWorks from "./landing/HowItWorks";
import Features from "./landing/Features";
import UseCases from "./landing/UseCases";
import Benefits from "./landing/Benefits";
import OpenSource from "./landing/OpenSource";
import Pricing from "./landing/Pricing";
import Privacy from "./landing/Privacy";
import Faq from "./landing/Faq";
import ClosingCta from "./landing/ClosingCta";
import Footer from "./landing/Footer";
import LogoGrid from "./landing/LogoGrid";
import { Rails, Rule, BandLabel } from "./landing/primitives";
import { SOURCE_TYPES } from "./landing/content";

export default function LandingPage() {
  // The app uses a 15px root; the landing layout is specified on a 16px root (1280px column).
  useEffect(() => {
    document.documentElement.classList.add("lp-root");
    return () => document.documentElement.classList.remove("lp-root");
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-lp-bg font-landing text-lp-text antialiased selection:bg-brand/25">
      <Navbar />
      <main>
        <Hero />

        <section aria-label="Supported sources">
          <Rails>
            <BandLabel>Works with your sources</BandLabel>
            <LogoGrid items={SOURCE_TYPES} />
          </Rails>
          <Rule />
        </section>

        <HowItWorks />
        <Features />
        <UseCases />
        <Benefits />
        <OpenSource />
        <Pricing />
        <Privacy />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
