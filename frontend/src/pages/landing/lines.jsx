import { useId } from "react";
import { motion } from "motion/react";
import { CURVE_LEFT, CURVE_RIGHT } from "./curves";

/** useId() contains colons, which are awkward inside url(#...) references. */
const useSvgId = () => `g${useId().replace(/:/g, "")}`;

const MotionLinearGradient = motion.linearGradient;
const MotionSvg = motion.svg;

const LOOP = { repeat: Infinity, repeatType: "loop", ease: "easeInOut", repeatDelay: 1 };

/** Static track with a bright pulse that travels along it, forever. */
function Pulse({ gradientId, initial, animate, transition, stops }) {
  return (
    <defs>
      <MotionLinearGradient id={gradientId} gradientUnits="userSpaceOnUse" initial={initial} animate={animate} transition={transition}>
        {stops.map(([offset, color, opacity]) => (
          <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
        ))}
      </MotionLinearGradient>
    </defs>
  );
}

const trackStops = (mid) => [
  [0, "var(--color-line)"],
  [0.5, mid],
  [1, "var(--color-line)"],
];

/** Vertical 81px connector with a coral pulse. */
export function VerticalLine(props) {
  const id = useSvgId();
  return (
    <svg width="1" height="81" viewBox="0 0 1 81" fill="none" className="shrink-0" {...props}>
      <line y1="-0.5" x2="80" y2="-0.5" transform="matrix(0 -1 -1 0 0 80.5)" stroke="var(--color-line)" />
      <line y1="-0.5" x2="80" y2="-0.5" transform="matrix(0 -1 -1 0 0 80.5)" stroke={`url(#${id})`} />
      <Pulse
        gradientId={id}
        initial={{ x1: 0, x2: 2, y1: "0%", y2: "0%" }}
        animate={{ x1: 0, x2: 2, y1: "80%", y2: "100%" }}
        transition={{ duration: 4, ...LOOP }}
        stops={trackStops("#F17463")}
      />
    </svg>
  );
}

/** Horizontal 314px connector with a blue pulse. */
export function HorizontalLine(props) {
  const id = useSvgId();
  return (
    <svg width="314" height="2" viewBox="0 0 314 2" fill="none" {...props}>
      <line x1="0.5" y1="1" x2="313.5" y2="1" stroke="var(--color-line)" strokeLinecap="round" />
      <line x1="0.5" y1="1" x2="313.5" y2="1" stroke={`url(#${id})`} strokeLinecap="round" />
      <Pulse
        gradientId={id}
        initial={{ y1: 0, y2: 1, x1: "-10%", x2: "0%" }}
        animate={{ y1: 0, y2: 1, x1: "110%", x2: "120%" }}
        transition={{ duration: 2, ...LOOP }}
        stops={trackStops("var(--color-blue-500)")}
      />
    </svg>
  );
}

const pulseStops = (color) => [
  [0, "var(--color-line)"],
  [0.33, color],
  [0.66, color],
  [1, "var(--color-line)"],
];

/** Line that runs right then turns down (top-right elbow). */
export function ElbowDownLine(props) {
  const id = useSvgId();
  return (
    <svg width="312" height="33" viewBox="0 0 312 33" fill="none" {...props}>
      <line x1="0.5" y1="1" x2="311.5" y2="1" stroke="var(--color-line)" strokeLinecap="round" />
      <line x1="311.5" y1="1" x2="311.5" y2="32" stroke="var(--color-line)" strokeLinecap="round" />
      <line x1="0.5" y1="1" x2="311.5" y2="1" stroke={`url(#${id})`} strokeLinecap="round" />
      <Pulse
        gradientId={id}
        initial={{ x1: "-20%", x2: "0%", y1: 1, y2: 0 }}
        animate={{ x1: "105%", x2: "120%", y1: 1, y2: 0 }}
        transition={{ duration: 2, ...LOOP }}
        stops={pulseStops("#F17463")}
      />
    </svg>
  );
}

/** Plain 323px connector with a blue pulse. */
export function StraightLine(props) {
  const id = useSvgId();
  return (
    <svg width="323" height="2" viewBox="0 0 323 2" fill="none" {...props}>
      <line x1="0.5" y1="1" x2="322.5" y2="1" stroke="var(--color-line)" strokeLinecap="round" />
      <line x1="0.5" y1="1" x2="322.5" y2="1" stroke={`url(#${id})`} strokeLinecap="round" />
      <Pulse
        gradientId={id}
        initial={{ x1: "-20%", x2: "0%", y1: 1, y2: 0 }}
        animate={{ x1: "105%", x2: "120%", y1: 1, y2: 0 }}
        transition={{ duration: 2, ...LOOP }}
        stops={pulseStops("var(--color-blue-500)")}
      />
    </svg>
  );
}

/** Line that runs right then turns up (bottom-right elbow), yellow pulse. */
export function ElbowUpLine(props) {
  const id = useSvgId();
  return (
    <svg width="326" height="32" viewBox="0 0 326 32" fill="none" {...props}>
      <line y1="31" x2="325" y2="31" stroke="var(--color-line)" />
      <line x1="325.5" y1="31" x2="325.5" y2="1" stroke="var(--color-line)" strokeLinecap="round" />
      <line y1="31" x2="325" y2="31" stroke={`url(#${id})`} />
      <Pulse
        gradientId={id}
        initial={{ x1: "-20%", x2: "0%", y1: 1, y2: 0 }}
        animate={{ x1: "105%", x2: "120%" }}
        transition={{ duration: 2, ...LOOP }}
        stops={pulseStops("var(--color-yellow-500)")}
      />
    </svg>
  );
}

/** Rounded corner connector, blue pulse, runs bottom-right to the left card. */
export function CurveLeft({ className }) {
  const id = useSvgId();
  const maskId = useSvgId();
  return (
    <MotionSvg
      width="128"
      height="97"
      viewBox="0 0 128 97"
      fill="none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className={className}
    >
      <mask id={maskId} fill="var(--color-line)">
        <path d={CURVE_LEFT.mask} />
      </mask>
      <path d={CURVE_LEFT.outline} fill="var(--color-line)" mask={`url(#${maskId})`} />
      <path d={CURVE_LEFT.outline} fill={`url(#${id})`} mask={`url(#${maskId})`} />
      <defs>
        <MotionLinearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{ x1: "100%", x2: "90%", y1: "90%", y2: "80%" }}
          animate={{ x1: "20%", x2: "0%", y1: "90%", y2: "220%" }}
          transition={{ duration: 5, repeat: Infinity, repeatDelay: 2 }}
        >
          <stop stopColor="var(--color-line)" stopOpacity="0.5" offset="0" />
          <stop stopColor="#5787FF" stopOpacity="1" offset="0.5" />
          <stop stopColor="var(--color-line)" stopOpacity="0" offset="1" />
        </MotionLinearGradient>
      </defs>
    </MotionSvg>
  );
}

/** Mirror of CurveLeft, coral pulse. */
export function CurveRight({ className }) {
  const id = useSvgId();
  const maskId = useSvgId();
  return (
    <MotionSvg
      width="128"
      height="96"
      viewBox="0 0 128 96"
      fill="none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className={className}
    >
      <mask id={maskId} fill="var(--color-line)">
        <path d={CURVE_RIGHT.mask} />
      </mask>
      <path d={CURVE_RIGHT.outline} fill="var(--color-line)" mask={`url(#${maskId})`} />
      <path d={CURVE_RIGHT.outline} fill={`url(#${id})`} mask={`url(#${maskId})`} />
      <defs>
        <MotionLinearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{ x1: "-10%", x2: "0%", y1: "0%", y2: "0%" }}
          animate={{ x1: "100%", x2: "110%", y1: "110%", y2: "140%" }}
          transition={{ duration: 5, repeat: Infinity, repeatDelay: 2 }}
        >
          <stop stopColor="white" stopOpacity="0.5" offset="0" />
          <stop stopColor="#F17463" stopOpacity="1" offset="0.5" />
          <stop stopColor="white" stopOpacity="0" offset="1" />
        </MotionLinearGradient>
      </defs>
    </MotionSvg>
  );
}

/** Short vertical connector between the two curves, coral pulse. */
export function DropLine({ className }) {
  const id = useSvgId();
  return (
    <MotionSvg
      width="2"
      height="56"
      viewBox="0 0 2 56"
      fill="none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className={className}
    >
      <line x1="1" y1="56" x2="1" stroke="var(--color-line)" strokeWidth="2" />
      <line x1="1" y1="56" x2="1" stroke={`url(#${id})`} strokeWidth="1" />
      <defs>
        <MotionLinearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{ x1: "0%", x2: "0%", y1: "-100%", y2: "-90%" }}
          animate={{ x1: "0%", x2: "0%", y1: "90%", y2: "100%" }}
          transition={{ duration: 5, repeat: Infinity, repeatDelay: 2 }}
        >
          <stop stopColor="var(--color-line)" stopOpacity="1" offset="0" />
          <stop stopColor="#F17463" stopOpacity="0.5" offset="0.5" />
          <stop stopColor="#F17463" stopOpacity="0" offset="1" />
        </MotionLinearGradient>
      </defs>
    </MotionSvg>
  );
}
