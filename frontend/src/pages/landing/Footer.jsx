import { useRef } from "react";
import { Link } from "react-router-dom";
import { Github } from "lucide-react";
import LeafIcon from "@/components/icons/leaf-icon";
import { LpButton } from "./primitives";
import { FOOTER, REPO_URL } from "./content";

function FooterLink({ link, basePath = "" }) {
  const className = "text-[15px] text-lp-link transition-colors hover:text-lp-heading";
  if (link.to) {
    return (
      <Link to={link.to} className={className}>
        {link.label}
      </Link>
    );
  }
  const external = /^https?:/.test(link.href);
  const href = link.href.startsWith("#") ? `${basePath}${link.href}` : link.href;
  return (
    <a href={href} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {link.label}
    </a>
  );
}

/** basePath: "/" when used outside the landing page, so section links point back to it. */
export default function Footer({ basePath = "" }) {
  const iconRef = useRef(null);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-lp-bg">
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-10 md:px-4">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,0.6fr)]">
          <div>
            <span
              className="flex items-center gap-2 text-lp-heading"
              onMouseEnter={() => iconRef.current?.startAnimation()}
              onMouseLeave={() => iconRef.current?.stopAnimation()}
            >
              <LeafIcon ref={iconRef} size={22} strokeWidth={2.4} className="text-brand" />
              <span className="font-display text-2xl font-medium tracking-tight">Sagewell</span>
            </span>
            <p className="mt-4 text-[16px] text-lp-text">{FOOTER.tagline}</p>
            <LpButton to="/auth" className="mt-5">
              Get started
            </LpButton>
          </div>
          {FOOTER.columns.map((column) => (
            <div key={column.title}>
              <p className="text-[15px] text-lp-text">{column.title}</p>
              <ul className="mt-5 space-y-5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink link={link} basePath={basePath} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-24 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-[14px] text-lp-link">© {year} Sagewell. Open source.</p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lp-link transition-colors hover:text-lp-heading"
            aria-label="Sagewell on GitHub"
          >
            <Github className="size-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
