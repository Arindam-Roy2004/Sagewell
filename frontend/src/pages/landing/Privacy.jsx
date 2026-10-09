import { Container, DivideX, Button } from "./primitives";
import { PRIVACY } from "./content";

export default function Privacy() {
  return (
    <section id="privacy">
      <Container className="border-divide border-x">
        <h2 className="pt-10 pb-5 text-center font-dm-mono text-sm tracking-tight text-neutral-500 uppercase md:pt-20 md:pb-10 dark:text-neutral-400">
          {PRIVACY.eyebrow}
        </h2>
      </Container>
      <DivideX />
      <Container className="border-divide grid grid-cols-1 border-x bg-gray-100 px-8 py-12 md:grid-cols-2 dark:bg-neutral-900">
        <div>
          <h2 className="text-charcoal-700 text-left text-2xl font-medium tracking-tight md:text-3xl lg:text-4xl dark:text-neutral-100">
            {PRIVACY.title}
          </h2>
          <p className="mt-4 text-left text-sm font-medium tracking-tight text-gray-600 md:text-sm lg:text-base dark:text-gray-300">
            {PRIVACY.text}
          </p>
          <Button to="/auth" className="mt-4 mb-8 inline-block w-full md:w-auto">
            {PRIVACY.cta}
          </Button>
        </div>
        <div className="flex items-center justify-center gap-10">
          {PRIVACY.badges.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <span className="inline-flex size-14 items-center justify-center rounded-full border-2 border-gray-500/60 text-gray-600 dark:border-neutral-500 dark:text-neutral-300">
                <Icon className="size-6" strokeWidth={1.5} />
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-neutral-300">
                <span className="size-1.5 rounded-full bg-gray-500" /> {label}
              </span>
            </div>
          ))}
        </div>
      </Container>
      <DivideX />
    </section>
  );
}
