import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TbMenu2, TbX } from "react-icons/tb";
import LeafIcon from "@/components/icons/leaf-icon";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { LpButton } from "./primitives";
import { NAV_LINKS } from "./content";

const MotionDiv = motion.div;

function Logo({ basePath = "" }) {
  const iconRef = useRef(null);
  return (
    <a
      href={basePath ? basePath : "#top"}
      className="flex items-center gap-2 text-lp-heading"
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      aria-label="Sagewell home"
    >
      <LeafIcon ref={iconRef} size={22} strokeWidth={2.4} className="text-brand" />
      <span className="font-display text-2xl font-medium tracking-tight">Sagewell</span>
    </a>
  );
}

function Links({ className, onNavigate, basePath = "" }) {
  return (
    <nav className={className}>
      {NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={`${basePath}${link.href}`}
          onClick={onNavigate}
          className="text-[15px] text-lp-text transition-colors hover:text-lp-heading"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

function BarContent({ onMenu, menuOpen, basePath }) {
  return (
    <div className="flex h-[72px] items-center justify-between gap-6 px-6 md:px-4">
      <Logo basePath={basePath} />
      <Links className="hidden items-center gap-10 md:flex" basePath={basePath} />
      <div className="flex items-center gap-3">
        <ThemeToggle className="text-lp-text hover:bg-lp-soft hover:text-lp-heading" />
        <LpButton to="/auth" className="hidden sm:inline-flex">
          Get started
        </LpButton>
        <button
          type="button"
          onClick={onMenu}
          className="inline-flex size-9 items-center justify-center rounded-lg text-lp-heading hover:bg-lp-soft md:hidden cursor-pointer"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <TbX className="size-[18px]" /> : <TbMenu2 className="size-[18px]" />}
        </button>
      </div>
    </div>
  );
}

/**
 * Resting navbar with a full-width bottom rule. After 40px of scroll a floating, blurred
 * pill version slides in from the top (the resting bar becomes inert meanwhile).
 */
/** basePath: "/" when used outside the landing page, so section links point back to it. */
export default function Navbar({ basePath = "" }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMenu = () => setMenuOpen((open) => !open);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="w-full border-b border-lp-line bg-lp-bg" inert={scrolled ? true : undefined}>
        <div className="mx-auto max-w-7xl">
          <BarContent onMenu={toggleMenu} menuOpen={menuOpen} basePath={basePath} />
        </div>
      </header>

      <AnimatePresence>
        {scrolled && (
          <MotionDiv
            key="floating-nav"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 top-0 z-50 xl:top-3"
          >
            <div className="mx-auto max-w-[calc(80rem-4rem)] border-b border-lp-line bg-lp-bg/80 shadow-[0_2px_8px_-2px_rgb(0_0_0/0.08)] backdrop-blur-md xl:rounded-2xl xl:border">
              <BarContent onMenu={toggleMenu} menuOpen={menuOpen} basePath={basePath} />
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <MotionDiv
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "fixed inset-x-4 top-[80px] z-50 rounded-2xl border border-lp-line bg-lp-bg/95 p-5 shadow-lg backdrop-blur-md md:hidden"
            )}
          >
            <Links className="flex flex-col gap-4" onNavigate={closeMenu} basePath={basePath} />
            <LpButton to="/auth" className="mt-5 w-full" onClick={closeMenu}>
              Get started
            </LpButton>
          </MotionDiv>
        )}
      </AnimatePresence>
    </>
  );
}
