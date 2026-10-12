// Gradient pairs for initials avatars. Mid-depth (600-level) hues so white initials stay readable,
// spread across warm, cool and violet families, with the first pair on the coral brand colour.
const PAIRS = [
  ['#e8604c', '#f08a3c'], // coral → orange
  ['#4f46e5', '#7c3aed'], // indigo → violet
  ['#0d9488', '#0284c7'], // teal → blue
  ['#059669', '#0d9488'], // emerald → teal
  ['#e11d48', '#ea580c'], // rose → orange
  ['#7c3aed', '#c026d3'], // violet → fuchsia
  ['#0284c7', '#4f46e5'], // sky → indigo
  ['#d97706', '#dc2626'], // amber → red
];

/** Same name, same colours, every time. */
export function avatarGradient(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const [from, to] = PAIRS[Math.abs(hash) % PAIRS.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}
