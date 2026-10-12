export { formatRelativeTime } from '@/components/credits/credit-utils';

const ONLINE_MS = 5 * 60 * 1000;

/** 'online' (active in the last 5 minutes) | 'recent' (last 24 hours) | 'idle' | 'never'. */
export function presence(lastActiveAt) {
  if (!lastActiveAt) return 'never';
  const age = Date.now() - new Date(lastActiveAt).getTime();
  if (age < ONLINE_MS) return 'online';
  if (age < 24 * 60 * 60 * 1000) return 'recent';
  return 'idle';
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

/** Week-over-week change as a whole percent, or null when there is no baseline. */
export function percentChange(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}
