import { useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "motion/react";
import LeafIcon from "@/components/icons/leaf-icon";
import ThemeToggle from "@/components/ThemeToggle";
import { Container, Button } from "./primitives";
import { HamburgerIcon, CloseIcon } from "./icons";
import { NAV_LINKS } from "./content";

const MotionDiv = motion.div;

function Logo({ basePath = "" }) {
  const iconRef = useRef(null);
  return (
    <a
      href={basePath || "#top"}
      className="flex items-center gap-2 text-black dark:text-white"
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
      aria-label="Sagewell home"
    >
      <LeafIcon ref={iconRef} size={24} strokeWidth={2.4} className="text-brand" />
      <span className="text-2xl font-medium">Sagewell</span>
    </a>
  );
}

const linkClass =
  "font-medium text-gray-600 transition duration-200 hover:text-neutral-900 dark:text-gray-300 dark:hover:text-neutral-300";

function Links({ basePath }) {
  return (
    <div className="flex items-center gap-10">
      {NAV_LINKS.map((link) => (
        <a key={link.label} href={`${basePath}${link.href}`} className={linkClass}>
          {link.label}
        </a>
      ))}
    </div>
  );
}

function Actions() {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle className="rounded-xl p-2 text-gray-600 hover:bg-transparent hover:text-neutral-900 dark:text-gray-300 dark:hover:bg-transparent" />
      <Button to="/auth">Get started</Button>
    </div>
  );
}

/** Pill that slides in from above once the page has scrolled past the resting bar. */
function FloatingNav({ basePath }) {
  const { scrollY } = useScroll();
  const y = useSpring(useTransform(scrollY, [100, 120], [-100, 10]), { stiffness: 300, damping: 30 });
  return (
    <MotionDiv
      style={{ y }}
      className="shadow-aceternity fixed inset-x-0 top-0 z-50 mx-auto hidden max-w-[calc(80rem-4rem)] items-center justify-between bg-white/80 px-2 py-2 backdrop-blur-sm md:flex xl:rounded-2xl dark:bg-neutral-900/80 dark:shadow-[0px_2px_0px_0px_var(--color-neutral-800),0px_-2px_0px_0px_var(--color-neutral-800)]"
    >
      <Logo basePath={basePath} />
      <Links basePath={basePath} />
      <Actions />
    </MotionDiv>
  );
}

function DesktopNav({ basePath }) {
  return (
    <div className="hidden items-center justify-between px-4 py-4 md:flex">
      <Logo basePath={basePath} />
      <Links basePath={basePath} />
      <Actions />
    </div>
  );
}

function MobileNav({ basePath }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center justify-between p-2 md:hidden">
      <Logo basePath={basePath} />
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="shadow-aceternity flex size-6 cursor-pointer flex-col items-center justify-center rounded-md"
        aria-label="Toggle menu"
      >
        <HamburgerIcon className="size-4 shrink-0 text-gray-600" />
      </button>
      <AnimatePresence>
        {open && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] h-full w-full bg-white shadow-lg dark:bg-neutral-900"
          >
            <div className="absolute right-4 bottom-4">
              <ThemeToggle className="text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex items-center justify-between p-2">
              <Logo basePath={basePath} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shadow-aceternity flex size-6 cursor-pointer flex-col items-center justify-center rounded-md"
                aria-label="Toggle menu"
              >
                <CloseIcon className="size-4 shrink-0 text-gray-600" />
              </button>
            </div>
            <div className="divide-divide border-divide mt-6 flex flex-col divide-y border-t">
              {NAV_LINKS.map((link, index) => (
                <a
                  key={link.label}
                  href={`${basePath}${link.href}`}
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 font-medium text-gray-600 transition duration-200 hover:text-neutral-900 dark:text-gray-300 dark:hover:text-neutral-300"
                >
                  <MotionDiv
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, delay: 0.1 * index }}
                  >
                    {link.label}
                  </MotionDiv>
                </a>
              ))}
              <div className="mt-4 p-4">
                <Button to="/auth" onClick={() => setOpen(false)} className="w-full">
                  Get started
                </Button>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}

/** basePath: "/" when used outside the landing page, so section links point back to it. */
export default function Navbar({ basePath = "" }) {
  return (
    <Container as="nav" className="w-full">
      <FloatingNav basePath={basePath} />
      <DesktopNav basePath={basePath} />
      <MobileNav basePath={basePath} />
    </Container>
  );
}
