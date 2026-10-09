import { useRef } from "react";
import { Link } from "react-router-dom";
import { Github } from "lucide-react";
import LeafIcon from "@/components/icons/leaf-icon";
import { Container, Button } from "./primitives";
import { FOOTER, REPO_URL } from "./content";

const linkClass = "text-footer-link text-sm font-medium transition-colors hover:text-gray-900 dark:hover:text-white";

function FooterLink({ link, basePath = "" }) {
  if (link.to) {
    return (
      <Link to={link.to} className={linkClass}>
        {link.label}
      </Link>
    );
  }
  const external = /^https?:/.test(link.href);
  const href = link.href.startsWith("#") ? `${basePath}${link.href}` : link.href;
  return (
    <a href={href} className={linkClass} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {link.label}
    </a>
  );
}

/** basePath: "/" when used outside the landing page, so section links point back to it. */
export default function Footer({ basePath = "" }) {
  const iconRef = useRef(null);
  const year = new Date().getFullYear();

  return (
    <Container className="w-full">
      <div className="grid grid-cols-1 px-4 py-20 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        <div className="mb-6 sm:col-span-2 md:col-span-4 lg:col-span-3">
          <span
            className="flex items-center gap-2 text-black dark:text-white"
            onMouseEnter={() => iconRef.current?.startAnimation()}
            onMouseLeave={() => iconRef.current?.stopAnimation()}
          >
            <LeafIcon ref={iconRef} size={24} strokeWidth={2.4} className="text-brand" />
            <span className="text-2xl font-medium">Sagewell</span>
          </span>
          <p className="mt-4 max-w-lg text-left text-sm font-medium tracking-tight text-gray-600 md:text-sm lg:text-base dark:text-gray-300">
            {FOOTER.tagline}
          </p>
          <Button to="/auth" className="mt-4 mb-8 inline-block lg:mb-0">
            Get started
          </Button>
        </div>

        {FOOTER.columns.map((column) => (
          <div key={column.title} className="col-span-1 mb-4 flex flex-col items-start gap-4 md:col-span-1 md:mb-0">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{column.title}</p>
            {column.links.map((link) => (
              <FooterLink key={link.label} link={link} basePath={basePath} />
            ))}
          </div>
        ))}

        <div className="col-span-1 mb-4 flex flex-col items-start md:col-span-1 md:mb-0 lg:col-span-2">
          <p className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-300">Contribute</p>
          <Button variant="secondary" href={REPO_URL} className="inline-flex items-center gap-2">
            <Github className="size-4 shrink-0" />
            Star on GitHub
          </Button>
          <p className="mt-4 max-w-xs text-left text-sm font-medium tracking-tight text-gray-600 dark:text-gray-300">
            Sagewell is open source. Issues and pull requests are welcome.
          </p>
        </div>
      </div>

      <div className="my-4 flex flex-col items-center justify-between px-4 pt-8 pb-8 md:flex-row">
        <p className="text-footer-link text-sm">© {year} Sagewell. Open source.</p>
        <div className="mt-4 flex items-center gap-4 md:mt-0">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-footer-link transition-colors hover:text-gray-900 dark:hover:text-white"
            aria-label="Sagewell on GitHub"
          >
            <Github className="size-5" />
          </a>
        </div>
      </div>
    </Container>
  );
}
