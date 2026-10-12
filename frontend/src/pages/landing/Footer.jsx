import { useRef } from "react";
import { Link } from "react-router-dom";
import LeafIcon from "@/components/icons/leaf-icon";
import { Container, Button } from "./primitives";
import { FOOTER } from "./content";

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
        <div className="mb-6 sm:col-span-2 md:col-span-4 lg:col-span-6">
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

      </div>

      <div className="my-4 flex flex-col items-center justify-between px-4 pt-8 pb-8 md:flex-row">
        <p className="text-footer-link text-sm">© {year} Sagewell. Open source.</p>
      </div>
    </Container>
  );
}
