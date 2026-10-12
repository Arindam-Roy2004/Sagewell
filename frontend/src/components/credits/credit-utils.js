/** Shared helpers for the credit UI: how amounts read and which colour state a balance is in. */

/** 82 -> "82", 4.37 -> "4.3". Rounds down so we never show credits the user doesn't have. */
export function formatCredits(value) {
  const n = Math.max(0, Number(value) || 0);
  if (n >= 10) return String(Math.floor(n));
  return (Math.floor(n * 10) / 10).toFixed(1).replace(/\.0$/, '');
}

/** 'ok' | 'low' (20% or less left) | 'empty' (can't afford an answer). */
export function creditTone(credits) {
  if (!credits) return 'ok';
  if (credits.exhausted || credits.balance <= 0) return 'empty';
  if (credits.granted > 0 && credits.balance / credits.granted <= 0.2) return 'low';
  return 'ok';
}

export const TONE_LABEL = { ok: 'Available', low: 'Running low', empty: 'Empty' };

// Colour classes per state, matching the badge and status tokens used elsewhere.
export const TONE_BAR = { ok: 'bg-brand-app', low: 'bg-warning', empty: 'bg-destructive' };
export const TONE_TEXT = { ok: 'text-foreground', low: 'text-warning', empty: 'text-destructive' };
export const TONE_BADGE = { ok: 'success', low: 'warning', empty: 'destructive' };

export function formatRelativeTime(iso) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
