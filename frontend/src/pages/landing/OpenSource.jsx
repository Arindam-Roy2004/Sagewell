import { Github, GitPullRequest, GitFork, CircleDot } from "lucide-react";
import { Rails, Rule, BandLabel, Reveal, LpButton } from "./primitives";
import LogoGrid from "./LogoGrid";
import { OPEN_SOURCE, REPO_URL } from "./content";

/** Repository preview card (stands in for the template's portrait photo). */
function RepoCard() {
  return (
    <div className="flex h-full min-h-[280px] flex-col justify-between rounded-xl border border-lp-line bg-lp-bg p-6 shadow-[0_1px_3px_rgb(0_0_0/0.06)]">
      <div>
        <div className="flex items-center gap-2 text-[15px] text-lp-heading">
          <Github className="size-5" />
          <span className="font-medium">Arindam-Roy2004 / Sagewell</span>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-lp-text">
          Chat with your documents. Hybrid retrieval, citations, Google sign-in and a background worker for
          processing sources.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-4 text-[13px] text-lp-text">
        <span className="flex items-center gap-1.5"><CircleDot className="size-3.5 text-brand" /> JavaScript</span>
        <span className="flex items-center gap-1.5"><GitFork className="size-3.5" /> Fork</span>
        <span className="flex items-center gap-1.5"><GitPullRequest className="size-3.5" /> Pull requests welcome</span>
      </div>
    </div>
  );
}

export default function OpenSource() {
  return (
    <section id="open-source">
      <Rails>
        <BandLabel className="py-14">{OPEN_SOURCE.label}</BandLabel>
      </Rails>
      <Rule markers />
      <Rails className="bg-lp-soft">
        <div className="grid md:grid-cols-[1fr_1.25fr_0.9fr]">
          <Reveal className="p-6 md:p-8">
            <RepoCard />
          </Reveal>
          <Reveal delay={0.08} className="flex flex-col justify-between p-6 md:p-8">
            <p className="font-landing text-[20px] leading-[1.6] text-lp-heading md:text-[22px]">{OPEN_SOURCE.statement}</p>
            <div className="mt-8">
              <p className="text-[15px] font-medium text-lp-heading">{OPEN_SOURCE.author}</p>
              <p className="text-[14px] text-lp-text">{OPEN_SOURCE.authorNote}</p>
              <LpButton href={REPO_URL} variant="outline" className="mt-5">
                <Github className="size-4" /> View the code
              </LpButton>
            </div>
          </Reveal>
          <Reveal delay={0.16} className="flex flex-col justify-end border-t border-lp-line p-6 md:border-t-0 md:border-l md:p-8">
            <p className="font-display text-6xl font-semibold tracking-tight text-lp-heading">{OPEN_SOURCE.stat}</p>
            <p className="mt-2 text-[14px] text-lp-heading">{OPEN_SOURCE.statLabel}</p>
          </Reveal>
        </div>
      </Rails>
      <Rails>
        <LogoGrid items={OPEN_SOURCE.stack.map((label) => ({ label }))} />
      </Rails>
      <Rule markers />
    </section>
  );
}
